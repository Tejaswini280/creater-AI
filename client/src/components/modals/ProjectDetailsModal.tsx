import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, Play, Pause, StopCircle, Edit, Plus, Eye, TrendingUp, Sparkles, RefreshCw, Target, Users, Zap, BarChart3, Brain, Star, Trash2, Save, X, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, PauseCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ContentCalendarView from '@/components/social-media/ContentCalendarView';

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onProjectUpdate?: (projectId: number, updates: any) => void;
}

interface ContentItem {
  id: number;
  title: string;
  description: string;
  platform: string;
  contentType: string;
  status: 'draft' | 'scheduled' | 'published' | 'paused' | 'stopped' | 'deleted';
  scheduledDate: string;
  scheduledTime?: string;
  hashtags: string[];
  metadata: any;
  dayNumber: number;
  isEditing?: boolean;
  originalContent?: {
    title: string;
    description: string;
    hashtags: string[];
  };
}

interface CalendarEntry {
  id: number;
  scheduledDate: string;
  scheduledTime: string;
  platform: string;
  contentType: string;
  status: string;
  engagementScore: number;
  metadata: any;
}

interface DayContentCardProps {
  content: ContentItem;
  onView: () => void;
  onEdit: () => void;
  onRecreate: () => void;
  onRegenerate: () => void;
  onUpdate: (updates: Partial<ContentItem>) => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onDelete: () => void;
  getStatusBadge: (status: string) => JSX.Element;
  getPlatformIcon: (platform: string) => string;
}

const DayContentCard: React.FC<DayContentCardProps> = ({
  content,
  onView,
  onEdit,
  onRecreate,
  onRegenerate,
  onPlay,
  onPause,
  onStop,
  onDelete,
  getStatusBadge,
  getPlatformIcon
}) => {
  const canEdit = content.status !== 'published';
  const canDelete = content.status !== 'published';
  const canStop = content.status === 'scheduled' || content.status === 'paused';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">{getPlatformIcon(content.platform)}</span>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{content.title}</CardTitle>
                {content.metadata?.aiGenerated && (
                  <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200">
                    <Sparkles className="h-3 w-3 mr-1 text-purple-600" />
                    AI Generated
                  </Badge>
                )}
              </div>
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {content.scheduledTime || 'No specific time'}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(content.status)}
            <Badge variant="outline">{content.contentType}</Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Content Description */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-700">{content.description}</p>
        </div>

        {/* Hashtags */}
        {content.hashtags && content.hashtags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Zap className="h-4 w-4" />
              <span>Hashtags</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {content.hashtags.slice(0, 5).map((hashtag) => (
                <Badge key={hashtag} variant="secondary" className="text-xs">
                  #{hashtag}
                </Badge>
              ))}
              {content.hashtags.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{content.hashtags.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* AI Metadata */}
        {content.metadata && (
          <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-xs text-gray-600">Engagement Prediction</div>
                <div className="text-sm font-medium">
                  {content.metadata.engagementPrediction?.average || 0}%
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-xs text-gray-600">Target Audience</div>
                <div className="text-sm font-medium">
                  {content.metadata.targetAudience || 'General'}
                </div>
              </div>
            </div>
            {content.metadata.confidence && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-600" />
                <div>
                  <div className="text-xs text-gray-600">AI Confidence</div>
                  <div className="text-sm font-medium">
                    {content.metadata.confidence}%
                  </div>
                </div>
              </div>
            )}
            {content.metadata.bestPostingTime && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="text-xs text-gray-600">Best Time</div>
                  <div className="text-sm font-medium">
                    {content.metadata.bestPostingTime}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <TrendingUp className="h-4 w-4" />
            <span>Expected reach: {content.metadata?.expectedReach || 'N/A'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onView}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}

            {content.status === 'draft' || content.status === 'paused' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onPlay}
                className="text-green-600 hover:text-green-700"
              >
                <Play className="h-4 w-4 mr-1" />
                Play
              </Button>
            ) : content.status === 'scheduled' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onPause}
                className="text-yellow-600 hover:text-yellow-700"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            ) : null}

            {canStop && (
              <Button
                variant="outline"
                size="sm"
                onClick={onStop}
                className="text-orange-600 hover:text-orange-700"
              >
                <StopCircle className="h-4 w-4 mr-1" />
                Stop
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onRecreate}
              className="flex items-center gap-1"
            >
              <Sparkles className="h-4 w-4" />
              Recreate
            </Button>

            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Validate project data - used in multiple places
const isValidProject = (project: any) => {
  return project && 
         project.id && 
         !isNaN(Number(project.id)) && 
         Number(project.id) > 0;
};

export default function ProjectDetailsModal({
  isOpen,
  onClose,
  project,
  onProjectUpdate
}: ProjectDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [calendar, setCalendar] = useState<CalendarEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [extendDays, setExtendDays] = useState(7);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [showContentEditor, setShowContentEditor] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [totalDays, setTotalDays] = useState(7);
  const { toast } = useToast();

  // Don't render if project is invalid
  if (isOpen && project && !isValidProject(project)) {
    console.error('Invalid project data, closing modal:', project);
    toast({
      title: "Invalid Project",
      description: "The project data is invalid or corrupted.",
      variant: "destructive"
    });
    onClose();
    return null;
  }

  // Load project content and calendar when modal opens
  useEffect(() => {
    if (isOpen && project?.id && isValidProject(project)) {
      loadProjectData();
    }
  }, [isOpen, project]);

  const loadProjectData = async () => {
    if (!project?.id || !isValidProject(project)) return;

    setIsLoading(true);
    try {
      // Try AI projects endpoint first (for AI projects)
      let response = await fetch(`/api/ai-projects/${project.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContent(data.data.content || []);
        setCalendar(data.data.calendar || []);
        return;
      } else if (response.status === 404) {
        // If AI project not found, try regular projects endpoint
        console.log(`🔍 AI project ${project.id} not found, trying regular projects endpoint...`);
        response = await fetch(`/api/projects/${project.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Regular projects don't have content/calendar, so set empty arrays
          setContent([]);
          setCalendar([]);
          console.log('🔍 Regular project found:', data.project);
          return;
        }
      }

      // If both endpoints fail
      if (response.status === 404) {
        console.log(`🔍 Project ${project.id} not found in any database`);
        toast({
          title: "Project Not Found",
          description: `Project "${project.title || project.name || project.id}" does not exist or has been deleted.`,
          variant: "destructive"
        });
        onClose(); // Close the modal
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error loading project data:', error);
      toast({
        title: "Error",
        description: "Failed to load project details. The project may have been deleted or you may not have permission to view it.",
        variant: "destructive"
      });
      onClose(); // Close the modal on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectAction = async (action: 'stop' | 'pause' | 'resume') => {
    if (!project?.id) return;

    try {
      const newStatus = action === 'resume' ? 'active' : action;
      
      // Try AI projects endpoint first
      let response = await fetch(`/api/ai-projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Project ${action}ped successfully`,
        });

        if (onProjectUpdate) {
          onProjectUpdate(project.id, { status: newStatus });
        }
        return;
      } else if (response.status === 404) {
        // Try regular projects endpoint
        response = await fetch(`/api/projects/${project.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: `Project ${action}ped successfully`,
          });

          if (onProjectUpdate) {
            onProjectUpdate(project.id, { status: newStatus });
          }
          return;
        }
      }

      throw new Error('Failed to update project status');
    } catch (error) {
      console.error('Error updating project status:', error);
      toast({
        title: "Error",
        description: `Failed to ${action} project`,
        variant: "destructive"
      });
    }
  };



  const handleRegenerateContent = async (contentId: number) => {
    try {
      const response = await fetch(`/api/ai-generated-content/${contentId}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          regenerateType: 'content',
          keepOriginalMetadata: true
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Content regenerated with AI",
        });
        loadProjectData(); // Reload data to show new content
      } else {
        throw new Error('Failed to regenerate content');
      }
    } catch (error) {
      console.error('Error regenerating content:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate content",
        variant: "destructive"
      });
    }
  };

  // New content management functions
  const handleViewContent = (contentItem: ContentItem) => {
    setEditingContent(contentItem);
    setShowContentEditor(true);
  };

  const handleEditContent = (contentItem: ContentItem) => {
    setEditingContent({
      ...contentItem,
      isEditing: true,
      originalContent: {
        title: contentItem.title,
        description: contentItem.description,
        hashtags: contentItem.hashtags
      }
    });
    setShowContentEditor(true);
  };

  const handleRecreateContent = async (contentId: number) => {
    try {
      const response = await fetch(`/api/ai-generated-content/${contentId}/recreate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recreateType: 'complete',
          keepContext: false
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Content completely recreated with AI",
        });
        loadProjectData();
      } else {
        throw new Error('Failed to recreate content');
      }
    } catch (error) {
      console.error('Error recreating content:', error);
      toast({
        title: "Error",
        description: "Failed to recreate content",
        variant: "destructive"
      });
    }
  };

  const handleUpdateContent = async (contentId: number, updates: Partial<ContentItem>) => {
    try {
      const response = await fetch(`/api/ai-generated-content/${contentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Content updated successfully",
        });
        loadProjectData();
        setShowContentEditor(false);
        setEditingContent(null);
      } else {
        throw new Error('Failed to update content');
      }
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive"
      });
    }
  };

  const handlePlayContent = async (contentId: number) => {
    try {
      const response = await fetch(`/api/ai-generated-content/${contentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'scheduled' })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Content scheduled for publishing",
        });
        loadProjectData();
      } else {
        throw new Error('Failed to schedule content');
      }
    } catch (error) {
      console.error('Error scheduling content:', error);
      toast({
        title: "Error",
        description: "Failed to schedule content",
        variant: "destructive"
      });
    }
  };

  const handlePauseContent = async (contentId: number) => {
    try {
      const response = await fetch(`/api/ai-generated-content/${contentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'paused' })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Content paused",
        });
        loadProjectData();
      } else {
        throw new Error('Failed to pause content');
      }
    } catch (error) {
      console.error('Error pausing content:', error);
      toast({
        title: "Error",
        description: "Failed to pause content",
        variant: "destructive"
      });
    }
  };

  const handleStopContent = async (contentId: number) => {
    try {
      const response = await fetch(`/api/ai-generated-content/${contentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'stopped' })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Content stopped",
        });
        loadProjectData();
      } else {
        throw new Error('Failed to stop content');
      }
    } catch (error) {
      console.error('Error stopping content:', error);
      toast({
        title: "Error",
        description: "Failed to stop content",
        variant: "destructive"
      });
    }
  };

  const handleDeleteContent = async (contentId: number) => {
    try {
      const response = await fetch(`/api/ai-generated-content/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Content deleted permanently",
        });
        loadProjectData();
      } else {
        throw new Error('Failed to delete content');
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive"
      });
    }
  };

  const handleExtendContentPlan = async (additionalDays: number) => {
    try {
      const response = await fetch(`/api/ai-projects/${project.id}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          additionalDays,
          regenerateContent: true
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Content plan extended by ${additionalDays} days`,
        });
        setTotalDays(totalDays + additionalDays);
        loadProjectData();
      } else {
        throw new Error('Failed to extend content plan');
      }
    } catch (error) {
      console.error('Error extending content plan:', error);
      toast({
        title: "Error",
        description: "Failed to extend content plan",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Draft', icon: AlertCircle },
      scheduled: { variant: 'default' as const, label: 'Scheduled', icon: Clock },
      published: { variant: 'default' as const, label: 'Published', icon: CheckCircle },
      paused: { variant: 'outline' as const, label: 'Paused', icon: PauseCircle },
      stopped: { variant: 'destructive' as const, label: 'Stopped', icon: StopCircle },
      deleted: { variant: 'destructive' as const, label: 'Deleted', icon: Trash2 }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPlatformIcon = (platform: string) => {
    const icons = {
      instagram: '📸',
      facebook: '👥',
      youtube: '🎥',
      tiktok: '🎵',
      linkedin: '💼',
      twitter: '🐦'
    };
    return icons[platform as keyof typeof icons] || '📱';
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {project.title}
          </DialogTitle>
          <DialogDescription>
            Project details and content management
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {getStatusBadge(project.status)}
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              {project.duration} days
            </div>
          </div>

          <div className="flex items-center gap-2">
            {project.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleProjectAction('pause')}
                className="flex items-center gap-1"
              >
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            )}

            {project.status === 'paused' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleProjectAction('resume')}
                className="flex items-center gap-1"
              >
                <Play className="h-4 w-4" />
                Resume
              </Button>
            )}

            {(project.status === 'active' || project.status === 'paused') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleProjectAction('stop')}
                className="flex items-center gap-1"
              >
                <StopCircle className="h-4 w-4" />
                Stop
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExtendDialog(true)}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Extend
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-5 flex-shrink-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content ({content.length})</TabsTrigger>
            <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
            <TabsTrigger value="calendar">Calendar ({calendar.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 overflow-y-auto space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Project Type</Label>
                    <p className="text-sm text-gray-600">{project.projectType}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Content Title</Label>
                    <p className="text-sm text-gray-600">{project.contentTitle || 'Not specified'}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Channel Type</Label>
                    <p className="text-sm text-gray-600">{project.channelType || 'Multiple platforms'}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Target Channels</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {project.targetChannels?.map((channel: string) => (
                        <Badge key={channel} variant="outline" className="text-xs">
                          <span className="mr-1">{getPlatformIcon(channel)}</span>
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {project.tags?.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      )) || <span className="text-sm text-gray-500">No tags</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Content Strategy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Content Frequency</Label>
                    <p className="text-sm text-gray-600">{project.contentFrequency}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Target Audience</Label>
                    <p className="text-sm text-gray-600">{project.targetAudience || 'General audience'}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Brand Voice</Label>
                    <p className="text-sm text-gray-600">{project.brandVoice || 'Professional'}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Content Goals</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {project.contentGoals?.map((goal: string) => (
                        <Badge key={goal} variant="outline" className="text-xs">
                          {goal}
                        </Badge>
                      )) || <span className="text-sm text-gray-500">No goals specified</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {project.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{project.description}</p>
                </CardContent>
              </Card>
            )}

            {project.contentDescription && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Content Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{project.contentDescription}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="content" className="flex-1 overflow-y-auto space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Loading AI-generated content...
              </div>
            ) : content.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No AI content yet</h3>
                <p className="text-gray-500 mb-4">AI will generate content based on your project strategy</p>
                <Button variant="outline" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Content
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Day Navigation */}
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDay(Math.max(1, currentDay - 1))}
                      disabled={currentDay === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-center">
                      <div className="text-lg font-semibold">Day {currentDay}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(Date.now() + (currentDay - 1) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDay(Math.min(totalDays, currentDay + 1))}
                      disabled={currentDay === totalDays}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {currentDay} of {totalDays} days
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExtendDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Extend Plan
                    </Button>
                  </div>
                </div>

                {/* Day-wise Content Cards */}
                <div className="space-y-4">
                  {content
                    .filter(item => item.dayNumber === currentDay)
                    .map((item) => (
                      <DayContentCard
                        key={item.id}
                        content={item}
                        onView={() => handleViewContent(item)}
                        onEdit={() => handleEditContent(item)}
                        onRecreate={() => handleRecreateContent(item.id)}
                        onRegenerate={() => handleRegenerateContent(item.id)}
                        onUpdate={(updates) => handleUpdateContent(item.id, updates)}
                        onPlay={() => handlePlayContent(item.id)}
                        onPause={() => handlePauseContent(item.id)}
                        onStop={() => handleStopContent(item.id)}
                        onDelete={() => handleDeleteContent(item.id)}
                        getStatusBadge={getStatusBadge}
                        getPlatformIcon={getPlatformIcon}
                      />
                    ))}
                  
                  {content.filter(item => item.dayNumber === currentDay).length === 0 && (
                    <Card className="border-dashed border-2 border-gray-200">
                      <CardContent className="text-center py-8">
                        <div className="text-4xl mb-4">📅</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No content for Day {currentDay}</h3>
                        <p className="text-gray-500 mb-4">This day doesn't have any scheduled content yet</p>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add Content
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai-insights" className="flex-1 overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AI Performance Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    AI Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Average Confidence</span>
                      <span className="font-medium">
                        {content.length > 0
                          ? Math.round(content.reduce((acc, item) => acc + (item.metadata?.confidence || 0), 0) / content.length)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Content Quality Score</span>
                      <span className="font-medium">
                        {content.length > 0
                          ? Math.round(content.reduce((acc, item) => acc + (item.metadata?.qualityScore || 85), 0) / content.length)
                          : 85}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Predicted Engagement</span>
                      <span className="font-medium">
                        {content.length > 0
                          ? Math.round(content.reduce((acc, item) => acc + (item.metadata?.engagementPrediction?.average || 0), 0) / content.length)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Optimization Suggestions</span>
                      <span className="font-medium text-blue-600">
                        {content.filter(item => item.metadata?.recommendations?.length > 0).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Content Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    Content Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Content Types</span>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(
                          content.reduce((acc, item) => {
                            acc[item.contentType] = (acc[item.contentType] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([type, count]) => (
                          <div key={type} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 capitalize">{type}</span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Platform Optimization</span>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(
                          content.reduce((acc, item) => {
                            acc[item.platform] = (acc[item.platform] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([platform, count]) => (
                          <div key={platform} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 capitalize flex items-center gap-2">
                              <span>{getPlatformIcon(platform)}</span>
                              {platform}
                            </span>
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Recommendations */}
            {content.some(item => item.metadata?.recommendations?.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-600" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {content
                      .filter(item => item.metadata?.recommendations?.length > 0)
                      .map((item) => (
                        <div key={item.id} className="border-l-4 border-blue-200 pl-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">{item.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {item.platform}
                            </Badge>
                          </div>
                          <ul className="space-y-1">
                            {item.metadata.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Content Generation Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  AI Generation Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{content.length}</div>
                    <div className="text-sm text-gray-600">Total Content</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {content.filter(item => item.metadata?.aiGenerated).length}
                    </div>
                    <div className="text-sm text-gray-600">AI Generated</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {content.filter(item => item.status === 'published').length}
                    </div>
                    <div className="text-sm text-gray-600">Published</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="flex-1 overflow-y-auto space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Loading calendar...</div>
            ) : content.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No content scheduled yet</div>
            ) : (
              <ContentCalendarView
                content={content}
                onContentAction={async (action, contentId, updates) => {
                  switch (action) {
                    case 'play':
                      await handlePlayContent(contentId);
                      break;
                    case 'pause':
                      await handlePauseContent(contentId);
                      break;
                    case 'stop':
                      await handleStopContent(contentId);
                      break;
                    case 'regenerate':
                      await handleRegenerateContent(contentId);
                      break;
                    case 'recreate':
                      await handleRecreateContent(contentId);
                      break;
                    case 'delete':
                      await handleDeleteContent(contentId);
                      break;
                    case 'update':
                      await handleUpdateContent(contentId, updates);
                      break;
                    default:
                      console.warn('Unknown action:', action);
                  }
                }}
                onViewContent={handleViewContent}
                onEditContent={handleEditContent}
                currentMonth={new Date()}
                onMonthChange={(date) => {
                  // Handle month change if needed
                  console.log('Month changed to:', date);
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="analytics" className="flex-1 overflow-y-auto space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Content Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Content:</span>
                    <span className="font-medium">{content.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scheduled:</span>
                    <span className="font-medium">{content.filter(c => c.status === 'scheduled').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Draft:</span>
                    <span className="font-medium">{content.filter(c => c.status === 'draft').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Published:</span>
                    <span className="font-medium">{content.filter(c => c.status === 'published').length}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(
                    content.reduce((acc, item) => {
                      acc[item.platform] = (acc[item.platform] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([platform, count]) => (
                    <div key={platform} className="flex justify-between">
                      <span className="flex items-center gap-2">
                        <span>{getPlatformIcon(platform)}</span>
                        {platform}
                      </span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Content Editor Modal */}
        <Dialog open={showContentEditor} onOpenChange={setShowContentEditor}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingContent?.isEditing ? <Edit className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                {editingContent?.isEditing ? 'Edit Content' : 'View Content'}
              </DialogTitle>
              <DialogDescription>
                {editingContent?.isEditing 
                  ? 'Modify the AI-generated content for this day' 
                  : 'Review the content details and metadata'
                }
              </DialogDescription>
            </DialogHeader>

            {editingContent && (
              <div className="space-y-6">
                {/* Content Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="content-title">Title</Label>
                      <Input
                        id="content-title"
                        value={editingContent.title}
                        onChange={(e) => setEditingContent({
                          ...editingContent,
                          title: e.target.value
                        })}
                        disabled={!editingContent.isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content-description">Description</Label>
                      <Textarea
                        id="content-description"
                        value={editingContent.description}
                        onChange={(e) => setEditingContent({
                          ...editingContent,
                          description: e.target.value
                        })}
                        disabled={!editingContent.isEditing}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content-hashtags">Hashtags (comma-separated)</Label>
                      <Input
                        id="content-hashtags"
                        value={editingContent.hashtags.join(', ')}
                        onChange={(e) => setEditingContent({
                          ...editingContent,
                          hashtags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                        })}
                        disabled={!editingContent.isEditing}
                        placeholder="fitness, workout, health"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Content Metadata */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Content Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getPlatformIcon(editingContent.platform)}</span>
                          <div>
                            <div className="text-sm font-medium">{editingContent.platform}</div>
                            <div className="text-xs text-gray-500">{editingContent.contentType}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="text-sm font-medium">Scheduled Time</div>
                            <div className="text-xs text-gray-500">
                              {editingContent.scheduledTime || 'No specific time'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {getStatusBadge(editingContent.status)}
                        </div>

                        {editingContent.metadata && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium">AI Insights</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <div className="text-gray-500">Confidence</div>
                                <div className="font-medium">
                                  {editingContent.metadata.confidence || 0}%
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500">Engagement</div>
                                <div className="font-medium">
                                  {editingContent.metadata.engagementPrediction?.average || 0}%
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* AI Recommendations */}
                    {editingContent.metadata?.recommendations && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            AI Recommendations
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {editingContent.metadata.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    {editingContent.isEditing && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingContent({
                            ...editingContent,
                            isEditing: false,
                            title: editingContent.originalContent?.title || editingContent.title,
                            description: editingContent.originalContent?.description || editingContent.description,
                            hashtags: editingContent.originalContent?.hashtags || editingContent.hashtags
                          });
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowContentEditor(false)}
                    >
                      Close
                    </Button>

                    {editingContent.isEditing && (
                      <Button
                        onClick={() => handleUpdateContent(editingContent.id, {
                          title: editingContent.title,
                          description: editingContent.description,
                          hashtags: editingContent.hashtags
                        })}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save Changes
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

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
                Current duration: {project.duration} days
                <span className="mx-2">→</span>
                New duration: {project.duration + extendDays} days
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowExtendDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleExtendContentPlan(extendDays)}>
                Extend Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
