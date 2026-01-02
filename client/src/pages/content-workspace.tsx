import React, { useState, useEffect } from 'react';
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
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Edit3, 
  Trash2, 
  Calendar,
  Tag,
  Clock,
  Youtube,
  Instagram,
  Facebook,
  Video,
  FileText,
  Camera,
  Mic,
  Image,
  Play,
  Pause,
  Square,
  Download,
  Copy,
  Sparkles,
  Bot,
  Globe,
  Loader2,
  Check,
  X,
  RefreshCw,
  Type,
  Scissors,
  Crop,
  Filter,
  Upload
} from 'lucide-react';

interface Content {
  id: number;
  title: string;
  description?: string;
  platform: string;
  contentType: string;
  status: string;
  createdAt: string;
  projectId?: number;
  tags?: string;
}

interface ContentFormData {
  title: string;
  description: string;
  platform: string;
  contentType: string;
  tags: string;
  status: string;
}

export default function ContentWorkspace() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/content-workspace/:id');
  const contentId = params?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Content editing state
  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    description: '',
    platform: 'youtube',
    contentType: 'video',
    tags: '',
    status: 'draft'
  });
  const [formErrors, setFormErrors] = useState<Partial<ContentFormData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');

  // Media editing states
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [isMediaPlaying, setIsMediaPlaying] = useState(false);
  const [activeEditingTool, setActiveEditingTool] = useState<string | null>(null);

  // Fetch content data
  const { data: contentResponse, isLoading: contentLoading } = useQuery({
    queryKey: ['content', contentId],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/content/${contentId}`);
        if (response.ok) {
          return await response.json();
        }
        throw new Error('Failed to fetch content');
      } catch (error) {
        console.error('Error fetching content:', error);
        throw error;
      }
    },
    enabled: !!contentId
  });

  const content = contentResponse?.data || contentResponse?.content;

  // Update form data when content is loaded
  useEffect(() => {
    if (content) {
      setFormData({
        title: content.title || '',
        description: content.description || '',
        platform: content.platform || 'youtube',
        contentType: content.contentType || 'video',
        tags: content.tags || '',
        status: content.status || 'draft'
      });
    }
  }, [content]);

  // Save content mutation
  const saveContentMutation = useMutation({
    mutationFn: async (data: ContentFormData) => {
      const response = await apiRequest('PUT', `/api/content/${contentId}`, data);
      if (!response.ok) {
        throw new Error('Failed to save content');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Content saved successfully",
        description: "Your changes have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ['content', contentId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving content",
        description: error.message || "Failed to save content. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/content/${contentId}`);
      if (!response.ok) {
        throw new Error('Failed to delete content');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Content deleted successfully",
        description: "The content has been permanently removed.",
      });
      // Navigate back to project page or dashboard
      if (content?.projectId) {
        setLocation(`/project/${content.projectId}`);
      } else {
        setLocation('/dashboard');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting content",
        description: error.message || "Failed to delete content. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSave = async () => {
    // Validate form
    const errors: Partial<ContentFormData> = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.platform) errors.platform = 'Platform is required';
    if (!formData.contentType) errors.contentType = 'Content type is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    saveContentMutation.mutate(formData, {
      onSettled: () => {
        setIsSaving(false);
      }
    });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      deleteContentMutation.mutate();
    }
  };

  const handleInputChange = (field: keyof ContentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBackToProject = () => {
    if (content?.projectId) {
      setLocation(`/project/${content.projectId}`);
    } else {
      setLocation('/dashboard');
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

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType.toLowerCase()) {
      case 'video':
        return <Video className="w-4 h-4 text-blue-600" />;
      case 'image':
        return <Image className="w-4 h-4 text-green-600" />;
      case 'audio':
        return <Mic className="w-4 h-4 text-purple-600" />;
      case 'text':
        return <FileText className="w-4 h-4 text-gray-600" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (contentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Content Not Found</h1>
            <p className="text-gray-600 mb-6">The content you're looking for doesn't exist or has been removed.</p>
            <Button onClick={handleBackToProject}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Project
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={handleBackToProject}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Project
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Content Workspace</h1>
                <p className="text-sm text-gray-500">Editing: {content.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Content Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Edit3 className="w-5 h-5" />
                  <span>Content Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter content title..."
                    className={formErrors.title ? 'border-red-500' : ''}
                  />
                  {formErrors.title && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your content..."
                    rows={4}
                  />
                </div>

                {/* Platform */}
                <div>
                  <Label htmlFor="platform">Platform</Label>
                  <Select value={formData.platform} onValueChange={(value) => handleInputChange('platform', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Content Type */}
                <div>
                  <Label htmlFor="contentType">Content Type</Label>
                  <Select value={formData.contentType} onValueChange={(value) => handleInputChange('contentType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="short">Short/Reel</SelectItem>
                      <SelectItem value="image">Image Post</SelectItem>
                      <SelectItem value="text">Text Post</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    placeholder="Enter tags separated by commas..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas</p>
                </div>

                {/* Status */}
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Content Info */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Content Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Platform:</span>
                      <div className="flex items-center space-x-2">
                        {getPlatformIcon(content.platform)}
                        <span className="capitalize">{content.platform}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Type:</span>
                      <div className="flex items-center space-x-2">
                        {getContentTypeIcon(content.contentType)}
                        <span className="capitalize">{content.contentType}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Status:</span>
                      <Badge className={getStatusColor(content.status)}>
                        {content.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Created:</span>
                      <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Content Workspace */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Video className="w-5 h-5" />
                  <span>Content Workspace</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="ai">AI Tools</TabsTrigger>
                    <TabsTrigger value="publish">Publish</TabsTrigger>
                  </TabsList>

                  {/* Edit Tab */}
                  <TabsContent value="edit" className="space-y-4">
                    <div className="text-center py-12">
                      <Edit3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Content Editor</h3>
                      <p className="text-gray-500 mb-4">Edit your content details and metadata</p>
                      <p className="text-sm text-gray-400">Use the form on the left to edit content details</p>
                    </div>
                  </TabsContent>

                  {/* Media Tab */}
                  <TabsContent value="media" className="space-y-4">
                    <div className="text-center py-12">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Media Editor</h3>
                      <p className="text-gray-500 mb-4">Upload and edit media files</p>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Media
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Media
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* AI Tools Tab */}
                  <TabsContent value="ai" className="space-y-4">
                    <div className="text-center py-12">
                      <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">AI Tools</h3>
                      <p className="text-gray-500 mb-4">Generate content using AI</p>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Script
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Mic className="w-4 h-4 mr-2" />
                          AI Voiceover
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Image className="w-4 h-4 mr-2" />
                          Generate Thumbnail
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Publish Tab */}
                  <TabsContent value="publish" className="space-y-4">
                    <div className="text-center py-12">
                      <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Publishing</h3>
                      <p className="text-gray-500 mb-4">Schedule and publish your content</p>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full">
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule Post
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Globe className="w-4 h-4 mr-2" />
                          Publish Now
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
