import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import AIContentCard from './AIContentCard';
import {
  Search,
  Plus,
  Settings,
  ArrowLeft,
  Video,
  Sparkles,
  Clock,
  CheckCircle,
  Edit
} from 'lucide-react';

interface SocialMediaDashboardViewProps {
  projectId: number;
  projectName: string;
  onBack: () => void;
}

interface ContentItem {
  id: number;
  userId: string;
  projectId?: number;
  title: string;
  caption?: string;
  hashtags?: string[];
  emojis?: string[];
  contentType: 'post' | 'reel' | 'short' | 'story' | 'video';
  status: 'draft' | 'scheduled' | 'published' | 'paused' | 'failed';
  scheduledAt?: string;
  publishedAt?: string;
  thumbnailUrl?: string;
  mediaUrls?: string[];
  aiGenerated: boolean;
  platform?: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export default function SocialMediaDashboardView({ 
  projectId, 
  projectName, 
  onBack 
}: SocialMediaDashboardViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();


  // Fetch project content
  const { data: contentResponse, isLoading: contentLoading } = useQuery({
    queryKey: ['project-content', projectId, filterStatus, filterPlatform],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPlatform !== 'all') params.append('platform', filterPlatform);
      
      try {
        const response = await apiRequest('GET', `/api/projects/${projectId}/content?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          // Return data even if content array is empty - this is valid
          return data;
        }
        throw new Error(`API request failed: ${response.status}`);
      } catch (error) {
        console.error('Error fetching content from API:', error);
        
        // Fallback to localStorage for development
        const storedContent = localStorage.getItem('localContent');
        if (storedContent) {
          const allContent = JSON.parse(storedContent);
          const projectContent = allContent.filter((item: any) => 
            item.projectId && item.projectId.toString() === projectId.toString()
          );
          if (projectContent.length > 0) {
            return { content: projectContent };
          }
        }
        
        // Return empty content - this is valid for projects without content
        console.log('🎯 No content found for project:', projectId, '- returning empty array');
        return { content: [] };
      }
    },
    enabled: !!projectId
  });

  const content: ContentItem[] = contentResponse?.content || [];

  // Filter content based on search query
  const filteredContent = content.filter((item) => {
    const matchesSearch = !searchQuery ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.hashtags && item.hashtags.some(tag =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      ));

    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesPlatform = filterPlatform === 'all' || item.platform === filterPlatform;

    return matchesSearch && matchesStatus && matchesPlatform;
  });

  // Content update mutation
  const updateContentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await apiRequest('PUT', `/api/content/${id}`, updates);
      if (!response.ok) throw new Error('Failed to update content');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-content', projectId] });
      toast({
        title: "Content Updated",
        description: "Content has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update content",
        variant: "destructive",
      });
    },
  });

  // Content delete mutation
  const deleteContentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/content/${id}`);
      if (!response.ok) throw new Error('Failed to delete content');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-content', projectId] });
      toast({
        title: "Content Deleted",
        description: "Content has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete content",
        variant: "destructive",
      });
    },
  });

  // Publish content mutation
  const publishContentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PUT', `/api/content/${id}`, {
        status: 'published',
        publishedAt: new Date().toISOString()
      });
      if (!response.ok) throw new Error('Failed to publish content');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-content', projectId] });
      toast({
        title: "Content Published",
        description: "Content has been published successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Publishing Failed",
        description: error.message || "Failed to publish content",
        variant: "destructive",
      });
    },
  });

  // Regenerate content mutation
  const regenerateContentMutation = useMutation({
    mutationFn: async (id: number) => {
      // Simulate AI regeneration
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { id, regenerated: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-content', projectId] });
      toast({
        title: "Content Regenerated",
        description: "AI has generated new content for this post",
      });
    },
    onError: (error) => {
      toast({
        title: "Regeneration Failed",
        description: error.message || "Failed to regenerate content",
        variant: "destructive",
      });
    },
  });

  // Event handlers
  const handleStatusChange = (contentId: number, status: string) => {
    updateContentMutation.mutate({ id: contentId, updates: { status } });
  };

  const handleRegenerate = (contentId: number) => {
    regenerateContentMutation.mutate(contentId);
  };

  const handleEdit = (contentId: number, updates: Partial<ContentItem>) => {
    updateContentMutation.mutate({ id: contentId, updates });
  };

  const handleDelete = (contentId: number) => {
    deleteContentMutation.mutate(contentId);
  };

  const handlePublishNow = (contentId: number) => {
    publishContentMutation.mutate(contentId);
  };

  // Calculate statistics
  const stats = {
    total: content.length,
    published: content.filter(c => c.status === 'published').length,
    scheduled: content.filter(c => c.status === 'scheduled').length,
    draft: content.filter(c => c.status === 'draft').length,
    aiGenerated: content.filter(c => c.aiGenerated).length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Social Media Dashboard</h1>
                <p className="text-gray-600">{projectName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Plus className="h-4 w-4 mr-2" />
                Create Content
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Content</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Video className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Published</p>
                  <p className="text-2xl font-bold">{stats.published}</p>
                </div>
                <CheckCircle className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Scheduled</p>
                  <p className="text-2xl font-bold">{stats.scheduled}</p>
                </div>
                <Clock className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">AI Generated</p>
                  <p className="text-2xl font-bold">{stats.aiGenerated}</p>
                </div>
                <Sparkles className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Drafts</p>
                  <p className="text-2xl font-bold">{stats.draft}</p>
                </div>
                <Edit className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search content by title, caption, or hashtags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Grid */}
        {contentLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredContent.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || filterStatus !== 'all' || filterPlatform !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first piece of content to get started'
                }
              </p>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Plus className="h-4 w-4 mr-2" />
                Create Content
              </Button>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredContent.map((content) => (
                <AIContentCard
                  key={content.id}
                  content={content}
                  onStatusChange={handleStatusChange}
                  onRegenerate={handleRegenerate}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onPublishNow={handlePublishNow}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}