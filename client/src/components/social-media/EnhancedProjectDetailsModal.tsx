import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  BarChart3, 
  Settings, 
  Play, 
  Pause, 
  Square, 
  RefreshCw,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Sparkles,
  Target,
  Users,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ContentGrid from './ContentGrid';
import ContentEditorModal from './ContentEditorModal';
import ContentCalendarIntegration from './ContentCalendarIntegration';
import { ContentItem } from './ContentCard';

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onProjectUpdate?: (projectId: number, updates: any) => void;
}

interface ProjectStats {
  totalContent: number;
  draftCount: number;
  scheduledCount: number;
  publishedCount: number;
  pausedCount: number;
  deletedCount: number;
  totalDays: number;
  avgEngagement: number;
}

export default function EnhancedProjectDetailsModal({
  isOpen,
  onClose,
  project,
  onProjectUpdate
}: ProjectDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('content');
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [showContentEditor, setShowContentEditor] = useState(false);
  const { toast } = useToast();

  // Load project data when modal opens
  useEffect(() => {
    if (isOpen && project?.id) {
      loadProjectData();
    }
  }, [isOpen, project]);

  const loadProjectData = async () => {
    if (!project?.id) return;

    setIsLoading(true);
    try {
      // Load project overview and stats
      const overviewResponse = await fetch(`/api/content-management/project/${project.id}/overview`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        setStats(overviewData.data.stats);
      }

      // Load project content
      const contentResponse = await fetch(`/api/content-management/project/${project.id}/content`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (contentResponse.ok) {
        const contentData = await contentResponse.json();
        setContents(contentData.data);
      }
    } catch (error) {
      console.error('Error loading project data:', error);
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentAction = async (contentId: number, action: string, data?: any) => {
    try {
      const response = await fetch(`/api/content-management/content/${contentId}/${action}`, {
        method: action === 'view' ? 'GET' : 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: action !== 'view' ? JSON.stringify(data) : undefined
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state based on action
        if (action === 'edit') {
          setEditingContent(result.data);
          setShowContentEditor(true);
        } else if (action === 'view') {
          setEditingContent(result.data);
          setShowContentEditor(true);
        } else if (action === 'delete' || action === 'stop' || action === 'pause' || action === 'play') {
          // Refresh content list
          await loadProjectData();
          toast({
            title: "Success",
            description: `Content ${action}ed successfully`,
          });
        } else if (action === 'regenerate' || action === 'recreate') {
          // Update the specific content in the list
          setContents(prev => prev.map(content => 
            content.id === contentId ? result.data : content
          ));
          toast({
            title: "Success",
            description: `Content ${action}d successfully`,
          });
        } else if (action === 'update') {
          // Update the specific content in the list
          setContents(prev => prev.map(content => 
            content.id === contentId ? result.data : content
          ));
          toast({
            title: "Success",
            description: "Content updated successfully",
          });
        }
      } else {
        throw new Error('Action failed');
      }
    } catch (error) {
      console.error(`Error ${action}ing content:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} content`,
        variant: "destructive"
      });
    }
  };

  const handleExtendProject = async (days: number) => {
    try {
      const response = await fetch(`/api/content-management/project/${project.id}/extend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ days })
      });

      if (response.ok) {
        const result = await response.json();
        setContents(prev => [...prev, ...result.data.newContent]);
        setStats(prev => prev ? {
          ...prev,
          totalContent: prev.totalContent + result.data.newContent.length,
          totalDays: result.data.totalDays
        } : null);
        toast({
          title: "Success",
          description: `Project extended by ${days} days with ${result.data.newContent.length} new content items`,
        });
      } else {
        throw new Error('Extension failed');
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

  const handleRefresh = async () => {
    await loadProjectData();
  };

  const handleProjectAction = async (action: 'stop' | 'pause' | 'resume') => {
    try {
      const response = await fetch(`/api/projects/${project.id}/${action}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        onProjectUpdate?.(project.id, result.data);
        toast({
          title: "Success",
          description: `Project ${action}d successfully`,
        });
      } else {
        throw new Error('Project action failed');
      }
    } catch (error) {
      console.error(`Error ${action}ing project:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} project`,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      paused: { label: 'Paused', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Pause },
      stopped: { label: 'Stopped', color: 'bg-red-100 text-red-800 border-red-200', icon: Square },
      completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge className={`text-xs ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      instagram: '📷',
      youtube: '📺',
      tiktok: '🎵',
      linkedin: '💼',
      facebook: '👥',
      twitter: '🐦',
      pinterest: '📌'
    };
    return icons[platform.toLowerCase()] || '📱';
  };

  if (!project) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getPlatformIcon(project.platform)}</span>
                <div>
                  <DialogTitle className="text-2xl font-bold">{project.name}</DialogTitle>
                  <DialogDescription className="text-base">
                    {project.description}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(project.status)}
                <Badge variant="outline" className="text-sm">
                  {project.platform}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6">
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="text-2xl font-bold text-blue-900">{stats.totalContent}</div>
                        <div className="text-sm text-blue-700">Total Content</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="text-2xl font-bold text-green-900">{stats.publishedCount}</div>
                        <div className="text-sm text-green-700">Published</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <div>
                        <div className="text-2xl font-bold text-yellow-900">{stats.scheduledCount}</div>
                        <div className="text-sm text-yellow-700">Scheduled</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-600" />
                      <div>
                        <div className="text-2xl font-bold text-purple-900">{stats.avgEngagement}%</div>
                        <div className="text-sm text-purple-700">Avg Engagement</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <ContentGrid
                contents={contents}
                onContentAction={handleContentAction}
                onExtendProject={handleExtendProject}
                onRefresh={handleRefresh}
                isProjectActive={project.status === 'active'}
              />
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6">
              <ContentCalendarIntegration
                contents={contents}
                onContentUpdate={handleContentAction}
                projectId={project.id}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
                <p className="text-gray-500">
                  Detailed analytics and performance metrics will be available here.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="text-center py-12">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Project Settings</h3>
                <p className="text-gray-500 mb-4">
                  Configure project settings and preferences.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => handleProjectAction('pause')}
                    disabled={project.status !== 'active'}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Project
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleProjectAction('stop')}
                    disabled={project.status === 'stopped'}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop Project
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Content Editor Modal */}
      {editingContent && (
        <ContentEditorModal
          isOpen={showContentEditor}
          onClose={() => {
            setShowContentEditor(false);
            setEditingContent(null);
          }}
          content={editingContent}
          onSave={async (contentId, updates) => {
            await handleContentAction(contentId, 'update', updates);
            setShowContentEditor(false);
            setEditingContent(null);
          }}
          onRegenerate={async (contentId) => {
            await handleContentAction(contentId, 'regenerate');
          }}
          onRecreate={async (contentId) => {
            await handleContentAction(contentId, 'recreate');
          }}
          onPreview={(content) => {
            // Handle preview logic
            console.log('Preview content:', content);
          }}
        />
      )}
    </>
  );
}
