import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
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
  X,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  BarChart3,
  Brain,
  Star,
  Target,
  Play,
  Pause,
  StopCircle,
  Zap,
  Hash,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface Project {
  id: number;
  name: string;
  description?: string;
  type: string;
  tags?: string[];
  createdAt: string;
  status?: string;
  duration?: number;
  startDate?: string;
  endDate?: string;
  targetChannels?: string[];
  targetAudience?: string;
  brandVoice?: string;
  contentGoals?: string[];
  contentFrequency?: string;
  contentDescription?: string;
  channelType?: string;
  projectType?: string;
}

interface ContentItem {
  id: number;
  title: string;
  description?: string;
  platform: string;
  contentType: string;
  status: string;
  createdAt: string;
  scheduledAt?: string;
  projectId?: number;
  hashtags?: string[];
  aiGenerated?: boolean;
  engagementPrediction?: number;
  expectedReach?: string;
  confidence?: number;
  qualityScore?: number;
  bestPostingTime?: string;
  metadata?: any;
}

interface OpenProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export default function OpenProjectModal({ isOpen, onClose, project }: OpenProjectModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [extendDays, setExtendDays] = useState(7);
  const [expandedContent, setExpandedContent] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  // Load project content when modal opens
  useEffect(() => {
    if (isOpen && project?.id) {
      loadProjectContent();
    }
  }, [isOpen, project]);

  // Filter content based on search and filters
  useEffect(() => {
    let filtered = content;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.hashtags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (platformFilter !== 'all') {
      filtered = filtered.filter(item => item.platform === platformFilter);
    }

    setFilteredContent(filtered);
  }, [content, searchTerm, statusFilter, platformFilter]);

  const loadProjectContent = async () => {
    if (!project?.id) return;

    setIsLoading(true);
    try {
      const response = await apiRequest('GET', `/api/projects/${project.id}/content`);
      if (response.ok) {
        const data = await response.json();
        setContent(data.content || []);
      } else {
        // Fallback to localStorage for development
        const storedContent = localStorage.getItem('localContent');
        if (storedContent) {
          const allContent = JSON.parse(storedContent);
          const projectContent = allContent.filter((item: any) =>
            item.projectId && item.projectId.toString() === project.id.toString()
          );
          setContent(projectContent);
        }
      }
    } catch (error) {
      console.error('Error loading project content:', error);
      toast({
        title: "Error",
        description: "Failed to load project content",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentAction = async (contentId: number, action: 'pause' | 'resume' | 'stop' | 'regenerate') => {
    try {
      let newStatus = '';
      let endpoint = '';
      let method = 'PATCH';

      switch (action) {
        case 'pause':
          newStatus = 'draft';
          endpoint = `/api/content/${contentId}`;
          break;
        case 'resume':
          newStatus = 'scheduled';
          endpoint = `/api/content/${contentId}`;
          break;
        case 'stop':
          newStatus = 'draft';
          endpoint = `/api/content/${contentId}`;
          break;
        case 'regenerate':
          endpoint = `/api/content/${contentId}/regenerate`;
          method = 'POST';
          break;
      }

      const response = await apiRequest(method, endpoint, method === 'PATCH' ? { status: newStatus } : {
        regenerateType: 'content',
        keepOriginalMetadata: true
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Content ${action}${action === 'regenerate' ? 'd' : action === 'stop' ? 'ped' : 'd'} successfully`,
        });
        loadProjectContent(); // Refresh content
      } else {
        throw new Error('Failed to update content');
      }
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Error",
        description: `Failed to ${action} content`,
        variant: "destructive"
      });
    }
  };

  const handleExtendProject = async () => {
    if (!project?.id || !extendDays) return;

    try {
      const response = await apiRequest('POST', `/api/projects/${project.id}/extend`, {
        additionalDays: extendDays
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Project extended by ${extendDays} days`,
        });
        setShowExtendDialog(false);
        // Optionally refresh project data here
      } else {
        throw new Error('Failed to extend project');
      }
    } catch (error) {
      console.error('Error extending project:', error);
      toast({
        title: "Error",
        description: "Failed to extend project",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      published: { variant: 'default' as const, label: 'Published', color: 'bg-green-100 text-green-800' },
      scheduled: { variant: 'secondary' as const, label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
      draft: { variant: 'outline' as const, label: 'Draft', color: 'bg-gray-100 text-gray-800' },
      processing: { variant: 'outline' as const, label: 'Processing', color: 'bg-yellow-100 text-yellow-800' },
      paused: { variant: 'outline' as const, label: 'Paused', color: 'bg-orange-100 text-orange-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPlatformIcon = (platform: string) => {
    const icons = {
      youtube: <Youtube className="w-5 h-5 text-red-600" />,
      instagram: <Instagram className="w-5 h-5 text-pink-600" />,
      facebook: <Facebook className="w-5 h-5 text-blue-600" />,
      tiktok: <Video className="w-5 h-5 text-black" />,
      linkedin: <Users className="w-5 h-5 text-blue-700" />,
      twitter: <Hash className="w-5 h-5 text-blue-400" />
    };
    return icons[platform as keyof typeof icons] || <Hash className="w-5 h-5 text-gray-500" />;
  };

  const getContentTypeIcon = (contentType: string) => {
    const icons = {
      video: <Video className="w-4 h-4" />,
      image: <Image className="w-4 h-4" />,
      text: <FileText className="w-4 h-4" />,
      short: <Video className="w-4 h-4" />,
      reel: <Video className="w-4 h-4" />
    };
    return icons[contentType as keyof typeof icons] || <FileText className="w-4 h-4" />;
  };

  const toggleContentExpansion = (contentId: number) => {
    const newExpanded = new Set(expandedContent);
    if (newExpanded.has(contentId)) {
      newExpanded.delete(contentId);
    } else {
      newExpanded.add(contentId);
    }
    setExpandedContent(newExpanded);
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FolderOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">{project.name}</DialogTitle>
                <DialogDescription className="text-gray-600 mt-1">
                  {project.description || 'Project details and content management'}
                </DialogDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Project Status Bar */}
          <div className="flex items-center gap-4 mt-4">
            {getStatusBadge(project.status || 'active')}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'} -
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{project.duration || 0} days duration</span>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="content">Content ({filteredContent.length})</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Project Overview Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Project Information */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-blue-600" />
                      Project Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Project Type</Label>
                        <p className="text-sm text-gray-600 mt-1">{project.projectType || project.type}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Content Frequency</Label>
                        <p className="text-sm text-gray-600 mt-1">{project.contentFrequency || 'Daily'}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Target Channels</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {project.targetChannels?.map((channel) => (
                          <Badge key={channel} variant="outline" className="text-xs">
                            <span className="mr-1">{getPlatformIcon(channel)}</span>
                            {channel}
                          </Badge>
                        )) || <span className="text-sm text-gray-500">No channels specified</span>}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Content Types</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          <Video className="w-3 h-3 mr-1" />
                          Video
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Image className="w-3 h-3 mr-1" />
                          Image
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <FileText className="w-3 h-3 mr-1" />
                          Text
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Target Audience</Label>
                      <p className="text-sm text-gray-600 mt-1">{project.targetAudience || 'General audience'}</p>
                    </div>

                    {project.contentDescription && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Content Description</Label>
                        <p className="text-sm text-gray-600 mt-1">{project.contentDescription}</p>
                      </div>
                    )}

                    {project.tags && project.tags.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Tags</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {project.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{content.length}</div>
                      <div className="text-sm text-gray-600">Total Content</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {content.filter(c => c.status === 'published').length}
                      </div>
                      <div className="text-sm text-gray-600">Published</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {content.filter(c => c.status === 'scheduled').length}
                      </div>
                      <div className="text-sm text-gray-600">Scheduled</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {content.filter(c => c.aiGenerated).length}
                      </div>
                      <div className="text-sm text-gray-600">AI Generated</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Project
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowExtendDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Extend Project
                  </Button>
                </div>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Content
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              {/* Search and Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-64">
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

                    <Select value={platformFilter} onValueChange={setPlatformFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Content List */}
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading content...</span>
                </div>
              ) : filteredContent.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
                  <p className="text-gray-500 mb-4">
                    {content.length === 0 ? 'No content has been created for this project yet.' : 'No content matches your filters.'}
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Content
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredContent.map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {getPlatformIcon(item.platform)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                {getStatusBadge(item.status)}
                                <Badge variant="outline" className="text-xs">
                                  {getContentTypeIcon(item.contentType)}
                                  <span className="ml-1">{item.contentType}</span>
                                </Badge>
                                {item.aiGenerated && (
                                  <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200">
                                    <Sparkles className="w-3 h-3 mr-1 text-purple-600" />
                                    AI Generated
                                  </Badge>
                                )}
                              </div>

                              {item.description && (
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                  {item.description}
                                </p>
                              )}

                              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {item.scheduledAt
                                      ? `Scheduled: ${new Date(item.scheduledAt).toLocaleDateString()} at ${new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                      : `Created: ${new Date(item.createdAt).toLocaleDateString()}`
                                    }
                                  </span>
                                </div>
                                {item.expectedReach && (
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span>Expected reach: {item.expectedReach}</span>
                                  </div>
                                )}
                              </div>

                              {item.hashtags && item.hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {item.hashtags.slice(0, 5).map((hashtag) => (
                                    <Badge key={hashtag} variant="secondary" className="text-xs">
                                      #{hashtag}
                                    </Badge>
                                  ))}
                                  {item.hashtags.length > 5 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{item.hashtags.length - 5} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleContentExpansion(item.id)}
                            >
                              {expandedContent.has(item.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedContent.has(item.id) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t"
                          >
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              {item.engagementPrediction && (
                                <div className="flex items-center gap-2">
                                  <Target className="w-4 h-4 text-blue-600" />
                                  <div>
                                    <div className="text-xs text-gray-600">Engagement Prediction</div>
                                    <div className="text-sm font-medium">{item.engagementPrediction}%</div>
                                  </div>
                                </div>
                              )}
                              {item.confidence && (
                                <div className="flex items-center gap-2">
                                  <Star className="w-4 h-4 text-yellow-600" />
                                  <div>
                                    <div className="text-xs text-gray-600">AI Confidence</div>
                                    <div className="text-sm font-medium">{item.confidence}%</div>
                                  </div>
                                </div>
                              )}
                              {item.bestPostingTime && (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-purple-600" />
                                  <div>
                                    <div className="text-xs text-gray-600">Best Posting Time</div>
                                    <div className="text-sm font-medium">{item.bestPostingTime}</div>
                                  </div>
                                </div>
                              )}
                              {item.qualityScore && (
                                <div className="flex items-center gap-2">
                                  <BarChart3 className="w-4 h-4 text-green-600" />
                                  <div>
                                    <div className="text-xs text-gray-600">Quality Score</div>
                                    <div className="text-sm font-medium">{item.qualityScore}%</div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleContentAction(item.id, 'regenerate')}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Regenerate
                              </Button>
                              {item.status === 'scheduled' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleContentAction(item.id, 'pause')}
                                >
                                  <Pause className="h-4 w-4 mr-1" />
                                  Pause
                                </Button>
                              ) : item.status === 'draft' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleContentAction(item.id, 'resume')}
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  Resume
                                </Button>
                              ) : null}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleContentAction(item.id, 'stop')}
                              >
                                <StopCircle className="h-4 w-4 mr-1" />
                                Stop
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Content Calendar
                  </CardTitle>
                  <CardDescription>
                    View and manage your scheduled content across all platforms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {content.filter(c => c.scheduledAt).length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled content</h3>
                      <p className="text-gray-500">Schedule your content to see it in the calendar view.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {content
                        .filter(c => c.scheduledAt)
                        .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
                        .map((item) => (
                          <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {getPlatformIcon(item.platform)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{item.title}</h4>
                              <p className="text-sm text-gray-600">
                                {new Date(item.scheduledAt!).toLocaleDateString()} at {new Date(item.scheduledAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {getStatusBadge(item.status)}
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Content Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(content.reduce((acc, item) => acc + (item.engagementPrediction || 0), 0) / Math.max(content.length, 1))}%
                        </div>
                        <div className="text-sm text-gray-600">Avg Engagement</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.round(content.reduce((acc, item) => acc + (item.confidence || 0), 0) / Math.max(content.length, 1))}%
                        </div>
                        <div className="text-sm text-gray-600">AI Confidence</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      Platform Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(
                        content.reduce((acc, item) => {
                          acc[item.platform] = (acc[item.platform] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([platform, count]) => (
                        <div key={platform} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {getPlatformIcon(platform)}
                            <span className="capitalize">{platform}</span>
                          </div>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Extend Project Dialog */}
        <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Extend Project Duration</DialogTitle>
              <DialogDescription>
                Add more days to your project to generate additional content.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="extendDays">Additional Days</Label>
                <Select value={extendDays.toString()} onValueChange={(value) => setExtendDays(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Current duration: {project.duration || 0} days</span>
                <span className="mx-2">→</span>
                <span>New duration: {(project.duration || 0) + extendDays} days</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowExtendDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleExtendProject}>
                Extend Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
