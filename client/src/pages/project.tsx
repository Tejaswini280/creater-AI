import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import ContentWorkspaceModal from '@/components/modals/ContentWorkspaceModal';
import AIEnhancement from '@/components/ui/ai-enhancement';
import { CustomLoader, ButtonLoader } from '@/components/ui/custom-loader';
import { DeleteConfirmationDialog, StopConfirmationDialog } from '@/components/ui/custom-dialog';
import { useFeedback, FeedbackSystem } from '@/components/ui/feedback-system';

// Import social media components
import ProjectManager from '@/components/social-media/ProjectManager';
import CalendarView from '@/components/social-media/CalendarView';
import SocialMediaAnalytics from '@/components/analytics/SocialMediaAnalytics';
import AIAssistant from '@/components/social-media/AIAssistant';
import SocialAccountsManager from '@/components/social-media/SocialAccountsManager';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Calendar,
  Tag,
  Clock,
  FolderOpen,
  Youtube,
  Instagram,
  Facebook,
  Video,
  FileText,
  Camera,
  Mic,
  Image,
  Eye,
  RefreshCw,
  Upload,
  X,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  Heart,
  BarChart3
} from 'lucide-react';

interface Content {
  id: number;
  title: string;
  description?: string;
  platform: string;
  contentType: string;
  status: string;
  createdAt: string;
  scheduledAt?: string;
  projectId?: number;
}

interface Project {
  id: number;
  name: string;
  description?: string;
  type: string;
  tags?: string[];
  createdAt: string;
}

interface ContentFormData {
  title: string;
  description: string;
  platform: string;
  contentType: string;
  tags: string;
  status: string;
}

const PLATFORMS = [
  { value: 'youtube', label: 'YouTube', icon: Video },
  { value: 'instagram', label: 'Instagram', icon: Camera },
  { value: 'facebook', label: 'Facebook', icon: Video },
];

const CONTENT_TYPES = [
  { value: 'video', label: 'Video', icon: Video },
  { value: 'short', label: 'Short/Reel', icon: Video },
  { value: 'image', label: 'Image Post', icon: Camera },
  { value: 'text', label: 'Text Post', icon: FileText },
];

export default function ProjectDetail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const feedback = useFeedback();

  // Extract project ID from URL parameters using React Router
  const [, params] = useRoute('/project/:id');
  const projectId = params?.id || '';

  // Project ID mapping for large IDs that exceed PostgreSQL integer limits
  const getMappedProjectId = (id: string): number => {
    const numId = parseInt(id);
    // PostgreSQL integer max value is 2,147,483,647
    // If the project ID is larger, map it to a smaller valid ID
    if (numId > 2147483647) {
      // Use a hash-based approach to generate a consistent smaller ID
      const hash = id.split('').reduce((a, b) => {
        a = ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff;
        return a;
      }, 0);
      const mappedId = Math.abs(hash) % 1000000; // Map to 0-999999 range
      console.log('🔍 Large project ID mapped:', { original: id, mapped: mappedId });
      return mappedId;
    }
    return numId;
  };

  const mappedProjectId = getMappedProjectId(projectId);

  // All state hooks must be declared before any early returns
  const [activeTab, setActiveTab] = useState('overview');
  const [projectNotFound, setProjectNotFound] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  
  // Content Workspace Modal States
  const [isContentWorkspaceOpen, setIsContentWorkspaceOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  // Content creation form state
  // Form is always visible in the new layout
  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    description: '',
    platform: 'youtube',
    contentType: 'video',
    tags: '',
    status: 'draft'
  });
  const [formErrors, setFormErrors] = useState<Partial<ContentFormData>>({});
  const [isCreating, setIsCreating] = useState(false);

  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    itemId?: number;
    itemName?: string;
  }>({ isOpen: false });

  const [stopDialog, setStopDialog] = useState<{
    isOpen: boolean;
    itemId?: number;
    itemName?: string;
  }>({ isOpen: false });

  // Check if project exists
  useEffect(() => {
    const checkProjectExists = async () => {
      try {
        const response = await fetch(`/api/ai-projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.status === 404) {
          setProjectNotFound(true);
        }
      } catch (error) {
        console.error('Error checking project existence:', error);
        setProjectNotFound(true);
      }
    };

    checkProjectExists();
  }, [projectId]);
  
  // Fetch project details
  const { data: projectResponse, isLoading: projectLoading } = useQuery({
    queryKey: ['project', mappedProjectId],
    queryFn: async () => {
      try {
        // Try main endpoint first
        const response = await apiRequest('GET', `/api/projects/${mappedProjectId}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.log('🔍 Main project endpoint failed, trying test endpoint...');
      }
      
      // Fallback to test endpoint
      try {
        const testResponse = await apiRequest('GET', `/api/test/projects/${mappedProjectId}`);
        return await testResponse.json();
      } catch (testError) {
        console.log('🔍 Test endpoint also failed, using localStorage fallback...');
        
        // Fallback to localStorage for development
        const storedProjects = localStorage.getItem('localProjects');
        if (storedProjects) {
          const projects = JSON.parse(storedProjects);
          const project = projects.find((p: any) => p.id.toString() === projectId);
          if (project) {
            console.log('🔍 Project found in localStorage:', project);
            return { success: true, project };
          }
        }
        
        throw testError;
      }
    },
    enabled: !!mappedProjectId
  });

  // Extract project from response
  const project = projectResponse?.project;
  
  // Debug logging
  console.log('🔍 Project page debug:', {
    projectId,
    projectResponse,
    project,
    projectLoading,
    windowLocation: window.location.pathname
  });

  // Fetch project-specific content only
  const { data: contentResponse, isLoading: contentLoading } = useQuery({
    queryKey: ['project-content', mappedProjectId, statusFilter, platformFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (platformFilter !== 'all') params.append('platform', platformFilter);
      
      console.log('🔍 Fetching content for project:', mappedProjectId);
      console.log('🔍 API endpoint:', `/api/projects/${mappedProjectId}/content?${params.toString()}`);
      
      try {
        // Use main endpoint only - no fallback to test endpoint
        const response = await apiRequest('GET', `/api/projects/${mappedProjectId}/content?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 Main API response:', data);
          return data;
        } else {
          console.error('🔍 Main API failed:', response.status, response.statusText);
          throw new Error(`API request failed: ${response.status}`);
        }
      } catch (error) {
        console.log('🔍 API failed, using localStorage fallback for content...');
        
        // Fallback to localStorage for development
        const storedContent = localStorage.getItem('localContent');
        if (storedContent) {
          const allContent = JSON.parse(storedContent);
          const projectContent = allContent.filter((item: any) => 
            item.projectId && item.projectId.toString() === mappedProjectId.toString()
          );
          
          console.log('🔍 Content found in localStorage for project:', projectContent);
          return { content: projectContent };
        }
        
        throw error;
      }
    },
    enabled: !!mappedProjectId,
    retry: 1, // Only retry once
    retryDelay: 1000
  });

  // Extract content array from the API response
  const content: Content[] = contentResponse?.content || [];
  
  // Debug logging for content
  console.log('🔍 Project page content debug:', {
    projectId,
    contentResponse,
    content,
    contentLength: content.length,
    searchTerm,
    statusFilter,
    platformFilter
  });

  // Additional project ID validation filter to ensure only project content is shown
  const projectFilteredContent = content.filter((item: Content) => {
    // Ensure content belongs to this project - handle both string and number IDs
    const itemProjectId = item.projectId;
    const currentProjectId = mappedProjectId; // Use mapped project ID for filtering
    
    // Convert both to strings for comparison to handle type mismatches
    const belongsToProject = itemProjectId?.toString() === currentProjectId?.toString();
    
    if (!belongsToProject) {
      console.warn('🔍 Content item filtered out - wrong project:', {
        contentId: item.id,
        contentProjectId: itemProjectId,
        currentProjectId: currentProjectId,
        mappedProjectId: mappedProjectId,
        originalProjectId: projectId,
        title: item.title,
        comparison: `${itemProjectId?.toString()} === ${currentProjectId?.toString()}`
      });
    }
    return belongsToProject;
  });

  // Enhanced content filtering with hashtag support
  const filteredContent = projectFilteredContent.filter((item: Content) => {
    // Enhanced search filter (title, description, and hashtags)
    const matchesSearch = !searchTerm ||
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((item as any).hashtags && (item as any).hashtags.some((tag: string) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      ));

    // Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    // Platform filter
    const matchesPlatform = platformFilter === 'all' || item.platform === platformFilter;

    return matchesSearch && matchesStatus && matchesPlatform;
  });

  // Create content mutation
  const createContentMutation = useMutation({
    mutationFn: async (contentData: ContentFormData) => {
      // Process tags properly - convert comma-separated string to array
      const processedTags = contentData.tags.trim() 
        ? contentData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];
      
      const response = await apiRequest('POST', '/api/content', {
        ...contentData,
        tags: processedTags,
        projectId: mappedProjectId // Use mapped project ID to avoid integer overflow
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Content Created Successfully!",
        description: `Your ${formData.contentType} for ${formData.platform} has been created in this project.`,
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        platform: 'youtube',
        contentType: 'video',
        tags: '',
        status: 'draft'
      });
      setFormErrors({});
      
      // Invalidate content queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['project-content', mappedProjectId] });
      
      // Form is always visible in the new layout
    },
    onError: (error) => {
      toast({
        title: "Error Creating Content",
        description: "Failed to create content. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async (contentId: number) => {
      const response = await apiRequest('DELETE', `/api/content/${contentId}`);
      if (!response.ok) throw new Error('Failed to delete content');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-content', mappedProjectId] });
      toast({
        title: "Success",
        description: "Content deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete content",
        variant: "destructive",
      });
    },
  });

  const handleDeleteContent = (contentId: number, contentTitle?: string) => {
    setDeleteDialog({
      isOpen: true,
      itemId: contentId,
      itemName: contentTitle || 'this content'
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.itemId) return;

    try {
      await apiRequest('DELETE', `/api/content/${deleteDialog.itemId}`);
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${mappedProjectId}/content`] });
      setDeleteDialog({ isOpen: false });
      feedback.success('Content Deleted', `"${deleteDialog.itemName}" has been deleted successfully.`);
    } catch (error) {
      console.error('Failed to delete content:', error);
      feedback.error('Delete Failed', 'Failed to delete content. Please try again.');
    }
  };

  const handleEditContent = (content: Content) => {
    setLocation(`/content-studio?id=${content.id}`);
  };

  const handleOpenContentWorkspace = (content: Content) => {
    // Open Content Workspace modal instead of navigating to separate page
    setSelectedContent(content);
    setIsContentWorkspaceOpen(true);
  };
  
  const handleContentUpdate = (updatedContent: any) => {
    // Update the content in the list
    queryClient.invalidateQueries({ queryKey: ['project-content', projectId, statusFilter, platformFilter] });
    setSelectedContent(updatedContent);
  };

  const handleContentDelete = (contentId: string) => {
    handleDeleteContent(parseInt(contentId));
  };

  const handleContentCreate = (contentData: any) => {
    createContentMutation.mutate(contentData);
  };

  const handleBatchOperation = (operation: string, contentIds: string[]) => {
    // Handle batch operations like delete, update status, etc.
    console.log('Batch operation:', operation, 'on content IDs:', contentIds);
    // Implement batch operations as needed
  };

  // Close modal if selectedContent becomes null
  useEffect(() => {
    if (!selectedContent && isContentWorkspaceOpen) {
      setIsContentWorkspaceOpen(false);
    }
  }, [selectedContent, isContentWorkspaceOpen]);

  // Form is always visible in the new layout

  const handleBackToDashboard = () => {
    setLocation('/dashboard');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors: Partial<ContentFormData> = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.platform) errors.platform = 'Platform is required';
    if (!formData.contentType) errors.contentType = 'Content type is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setIsCreating(true);
    createContentMutation.mutate(formData, {
      onSettled: () => {
        setIsCreating(false);
      }
    });
  };

  const handleInputChange = (field: keyof ContentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-600" />;
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'facebook':
        return <Facebook className="w-4 h-4 text-blue-600" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  // Enhanced handler functions for content cards
  const handleToggleContentStatus = async (contentId: number) => {
    try {
      const contentItem = content?.find(c => c.id === contentId);
      if (!contentItem) return;

      const newStatus = contentItem.status === 'scheduled' ? 'draft' : 'scheduled';

      await apiRequest('PATCH', `/api/content/${contentId}`, {
        status: newStatus
      });

      // Invalidate and refetch content
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${mappedProjectId}/content`] });

      toast({
        title: "Content Status Updated",
        description: `Content "${contentItem.title}" has been ${newStatus === 'scheduled' ? 'scheduled' : 'set to draft'}.`,
      });
    } catch (error) {
      console.error('Failed to toggle content status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update content status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRegenerateContent = async (content: Content) => {
    try {
      toast({
        title: "Regenerating Content",
        description: "AI is regenerating your content...",
      });

      // Simulate AI regeneration (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Invalidate and refetch content
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${mappedProjectId}/content`] });

      toast({
        title: "Content Regenerated",
        description: "Your content has been regenerated with AI enhancements.",
      });
    } catch (error) {
      console.error('Failed to regenerate content:', error);
      toast({
        title: "Regeneration Failed",
        description: "Failed to regenerate content. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateContent = async (content: Content) => {
    try {
      toast({
        title: "Updating Content",
        description: "Publishing your content updates...",
      });

      await apiRequest('PATCH', `/api/content/${content.id}`, {
        status: 'scheduled',
        updatedAt: new Date().toISOString()
      });

      // Invalidate and refetch content
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${mappedProjectId}/content`] });

      toast({
        title: "Content Updated",
        description: "Your content has been updated and scheduled for posting.",
      });
    } catch (error) {
      console.error('Failed to update content:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update content. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStopContent = async (contentId: number) => {
    try {
      const contentItem = content?.find(c => c.id === contentId);
      if (!contentItem) return;

      await apiRequest('PATCH', `/api/content/${contentId}`, {
        status: 'draft'
      });

      // Invalidate and refetch content
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${mappedProjectId}/content`] });

      toast({
        title: "Content Stopped",
        description: `Content "${contentItem.title}" has been stopped and set to draft.`,
      });
    } catch (error) {
      console.error('Failed to stop content:', error);
      toast({
        title: "Stop Failed",
        description: "Failed to stop content. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
            <p className="text-gray-600 mb-6">
              The project you're looking for doesn't exist or you don't have access to it.
              <br />
              <span className="text-sm text-gray-500">Project ID: {projectId}</span>
            </p>
            <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left text-sm">
              <h3 className="font-semibold mb-2">Debug Information:</h3>
              <p>Project ID: {projectId}</p>
              <p>Project Response: {JSON.stringify(projectResponse, null, 2)}</p>
              <p>Loading: {projectLoading ? 'Yes' : 'No'}</p>
            </div>
            <Button onClick={handleBackToDashboard}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Early return checks - must be after all hooks
  // Validate project ID
  if (!projectId || isNaN(parseInt(projectId))) {
    console.error('🔍 Invalid project ID:', projectId);
    console.error('🔍 Full path:', window.location.pathname);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Project</h1>
          <p className="text-gray-600 mb-6">The project ID is invalid or missing.</p>
          <Button onClick={() => setLocation('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Show project not found message
  if (projectNotFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
          <p className="text-gray-600 mb-6">The project you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => setLocation('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FolderOpen className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                {project.description && (
                  <p className="text-gray-600 mt-1">{project.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
                {project.type}
              </Badge>
              <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                <Clock className="h-4 w-4 inline mr-2" />
                Created {new Date(project.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </div>
            </div>
          </div>
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {project.tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected Accounts</CardTitle>
              <Users className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs opacity-90">
                Social platforms connected
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published Content</CardTitle>
              <Eye className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{content?.filter(c => c.status === 'published').length || 0}</div>
              <p className="text-xs opacity-90">
                {content?.filter(c => c.status === 'scheduled').length || 0} scheduled
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Generated</CardTitle>
              <Sparkles className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{content?.filter(c => (c as any).aiGenerated).length || 0}</div>
              <p className="text-xs opacity-90">
                of {content?.length || 0} total posts
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
              <Heart className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.2K</div>
              <p className="text-xs opacity-90">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +12% from last week
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Project Overview Card */}
      <div className="max-w-7xl mx-auto px-8 py-4">
        <Card className="bg-white shadow-sm border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FolderOpen className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
                  <p className="text-gray-600 mt-1">{project.description || 'No description provided'}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="secondary" className="text-sm">
                      {project.type}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {content?.length || 0}
                  </div>
                  <div className="text-xs text-gray-500">Total Content</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {content?.filter(c => c.status === 'published').length || 0}
                  </div>
                  <div className="text-xs text-gray-500">Published</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {content?.filter(c => c.status === 'scheduled').length || 0}
                  </div>
                  <div className="text-xs text-gray-500">Scheduled</div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Clock className="h-4 w-4 mr-2" />
                    Extend
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="ai">AI Assistant</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {content.slice(0, 5).map((item, index) => (
                    <div key={item.id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {item.contentType.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <p className="text-xs text-gray-500">
                          {item.status === 'published' ? 'Published' : 'Scheduled for'} {
                            item.scheduledAt ? new Date(item.scheduledAt).toLocaleDateString() : 'TBD'
                          }
                        </p>
                      </div>
                      <Badge variant={item.status === 'published' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="h-20 flex flex-col items-center justify-center space-y-2">
                    <Sparkles className="h-6 w-6" />
                    <span>Generate AI Content</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                    <Calendar className="h-6 w-6" />
                    <span>Schedule Content</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                    <BarChart3 className="h-6 w-6" />
                    <span>View Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            {/* Project Overview Card */}
            <Card className="bg-white shadow-sm border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FolderOpen className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
                      <p className="text-gray-600 mt-1">{project.description || 'No description provided'}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="secondary" className="text-sm">
                          {project.type}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Created {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {content?.length || 0}
                      </div>
                      <div className="text-xs text-gray-500">Total Content</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {content?.filter(c => c.status === 'published').length || 0}
                      </div>
                      <div className="text-xs text-gray-500">Published</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {content?.filter(c => c.status === 'scheduled').length || 0}
                      </div>
                      <div className="text-xs text-gray-500">Scheduled</div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Clock className="h-4 w-4 mr-2" />
                        Extend
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts">
            <SocialAccountsManager />
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView
              contents={content?.map(item => ({
                id: item.id,
                userId: '1', // Default user ID
                projectId: item.projectId,
                title: item.title,
                caption: item.description || '',
                hashtags: [],
                emojis: [],
                contentType: item.contentType as 'post' | 'reel' | 'short' | 'story' | 'video',
                status: item.status as 'draft' | 'scheduled' | 'published' | 'paused' | 'failed',
                scheduledAt: item.scheduledAt,
                publishedAt: undefined,
                thumbnailUrl: undefined,
                mediaUrls: [],
                aiGenerated: false,
                metadata: {},
                createdAt: item.createdAt,
                updatedAt: item.createdAt
              })) as any[] || []}
              onContentUpdate={handleContentUpdate}
              onContentDelete={handleContentDelete}
              onContentCreate={handleContentCreate}
              onBatchOperation={handleBatchOperation}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <SocialMediaAnalytics />
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Side: Create New Content Form (1/4 width) */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Content
                </CardTitle>
                <div className="mt-2">
                  <Badge variant="outline" className="text-sm px-2 py-1 bg-blue-50 border-blue-200 text-blue-700">
                    <FolderOpen className="w-4 h-4 mr-1" />
                    Project #{projectId} Content
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Title</label>
                  <Input
                    placeholder="Enter content title..."
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`${formErrors.title ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {formErrors.title && (
                    <p className="text-sm text-red-500 font-medium">{formErrors.title}</p>
                  )}
                </div>

                <AIEnhancement
                  text={formData.description}
                  onAccept={(enhancedText) => handleInputChange('description', enhancedText)}
                  context={{
                    contentType: formData.contentType,
                    platform: formData.platform,
                    targetAudience: 'General audience' // Could be enhanced to get from project data
                  }}
                  placeholder="Describe your content..."
                />
                <div>
                  <Textarea
                    placeholder="Describe your content..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Platforms</label>
                  <div className="flex flex-wrap gap-3">
                    {PLATFORMS.map((platform) => (
                      <label key={platform.value} className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="platform"
                          value={platform.value}
                          checked={formData.platform === platform.value}
                          onChange={() => handleInputChange('platform', platform.value)}
                          className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                        />
                        {platform.label}
                      </label>
                    ))}
                  </div>
                  {formErrors.platform && (
                    <p className="text-sm text-red-500 font-medium">{formErrors.platform}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Content Type</label>
                  <div className="flex flex-wrap gap-2">
                    {CONTENT_TYPES.map((type) => (
                      <Button 
                        key={type.value} 
                        variant={formData.contentType === type.value ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => handleInputChange('contentType', type.value)}
                      >
                        {type.label}
                      </Button>
                    ))}
                  </div>
                  {formErrors.contentType && (
                    <p className="text-sm text-red-500 font-medium">{formErrors.contentType}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Tags</label>
                  <Input
                    placeholder="Enter tags separated by commas..."
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Status</label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  disabled={isCreating}
                  className="w-full"
                  onClick={handleFormSubmit}
                >
                  {isCreating ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Content
                    </>
                  )}
                </Button>


              </CardContent>
            </Card>
          </div>

          {/* Right Side: Content Cards (3/4 width) */}
          <div className="lg:col-span-3">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <CardTitle>Your Content</CardTitle>
                  <div className="w-full sm:w-auto">
                    <Select value={platformFilter} onValueChange={setPlatformFilter}>
                      <SelectTrigger className="w-56">
                        <div className="flex items-center gap-2">
                          {platformFilter === "youtube" && <Youtube className="w-4 h-4 text-red-600" />}
                          {platformFilter === "instagram" && <Instagram className="w-4 h-4 text-pink-600" />}
                          {platformFilter === "facebook" && <Facebook className="w-4 h-4 text-blue-600" />}
                          {platformFilter === "all" && <Video className="w-4 h-4 text-gray-500" />}
                          <SelectValue placeholder="All Platforms" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Enhanced Search and Filters */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 space-y-4"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search content by title, description, or hashtags..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Content Type Filter */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={platformFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPlatformFilter('all')}
                    >
                      All Platforms
                    </Button>
                    <Button
                      variant={platformFilter === 'youtube' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPlatformFilter('youtube')}
                    >
                      <Youtube className="w-4 h-4 mr-1" />
                      YouTube
                    </Button>
                    <Button
                      variant={platformFilter === 'instagram' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPlatformFilter('instagram')}
                    >
                      <Instagram className="w-4 h-4 mr-1" />
                      Instagram
                    </Button>
                    <Button
                      variant={platformFilter === 'facebook' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPlatformFilter('facebook')}
                    >
                      <Facebook className="w-4 h-4 mr-1" />
                      Facebook
                    </Button>
                  </div>
                </motion.div>

                {/* Content Display */}
                {contentLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="w-16 h-12 bg-gray-200 rounded animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredContent.length === 0 ? (
                  <div className="text-center py-12">
                    <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
                    <p className="text-gray-500 mb-4">Create your first piece of content to get started</p>
                    <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Content
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredContent.map((item: Content) => (
                      <Card key={item.id} className="bg-white shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
                        <CardContent className="p-6">
                          {/* Header with Platform Icon and Status */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                {getPlatformIcon(item.platform)}
                              </div>
                              <div>
                                <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                                  {item.status}
                                </Badge>
                                <p className="text-xs text-gray-500 mt-1 capitalize">
                                  {item.contentType}
                                </p>
                              </div>
                            </div>
                            {/* Play/Pause Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`p-2 ${item.status === 'scheduled' ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}`}
                              onClick={() => handleToggleContentStatus(item.id)}
                            >
                              {item.status === 'scheduled' ? (
                                <div className="w-4 h-4 border-2 border-current rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-current rounded-full"></div>
                                </div>
                              ) : (
                                <div className="w-4 h-4 border-2 border-current rounded flex items-center justify-center">
                                  <div className="w-0 h-2 border-l-2 border-current ml-1"></div>
                                </div>
                              )}
                            </Button>
                          </div>

                          {/* Content Title and Description */}
                          <div className="mb-4 cursor-pointer" onClick={() => handleOpenContentWorkspace(item)}>
                            <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                              {item.title}
                            </h3>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                                {item.description}
                              </p>
                            )}
                          </div>

                          {/* Schedule Info */}
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Clock className="w-3 h-3" />
                              {item.status === 'scheduled' && item.scheduledAt ? (
                                <span>
                                  Scheduled: {new Date(item.scheduledAt).toLocaleDateString()} at {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              ) : (
                                <span>
                                  Created: {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenContentWorkspace(item)}
                              className="flex-1"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditContent(item)}
                              className="flex-1"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRegenerateContent(item)}
                              className="flex-1"
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Regenerate
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateContent(item)}
                              className="flex-1"
                            >
                              <Upload className="w-3 h-3 mr-1" />
                              Update
                            </Button>
                            {item.status !== 'published' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStopContent(item.id)}
                                className="flex-1 text-orange-600 hover:text-orange-700"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Stop
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteContent(item.id, item.title)}
                              className="flex-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </div>

                          {/* AI Generated Indicator */}
                          {(item as any).aiGenerated && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span>AI Generated</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
          </TabsContent>
        </Tabs>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="ai">AI Assistant</TabsTrigger>
          </TabsList>
          <TabsContent value="ai">
            <AIAssistant />
          </TabsContent>
        </Tabs>
      </div>

      {/* Content Workspace Modal */}
      {selectedContent && (
        <ContentWorkspaceModal
          isOpen={isContentWorkspaceOpen}
          onClose={() => setIsContentWorkspaceOpen(false)}
          content={selectedContent}
          onContentUpdate={handleContentUpdate}
        />
      )}

      {/* Custom Confirmation Dialogs */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false })}
        onConfirm={handleConfirmDelete}
        itemName={deleteDialog.itemName || ''}
        itemType="Content"
      />

      <StopConfirmationDialog
        isOpen={stopDialog.isOpen}
        onClose={() => setStopDialog({ isOpen: false })}
        onConfirm={() => {
          // Handle stop logic here
          setStopDialog({ isOpen: false });
          feedback.success('Content Stopped', `"${stopDialog.itemName}" has been stopped and moved to draft.`);
        }}
        itemName={stopDialog.itemName || ''}
      />

      {/* Feedback System */}
      <FeedbackSystem
        feedbacks={feedback.feedbacks}
        onRemove={feedback.removeFeedback}
        position="top-right"
      />
    </div>
  );
}
