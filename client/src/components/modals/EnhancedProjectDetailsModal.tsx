import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  BarChart3, 
  Settings, 
  Play, 
  Pause, 
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Target,
  StopCircle,
  CalendarPlus,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AIContentCard from '@/components/social-media/AIContentCard';
import ContentEditorModal from './ContentEditorModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  content: string;
  platform: string;
  contentType: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'paused' | 'stopped';
  dayNumber: number;
  isPaused: boolean;
  isStopped: boolean;
  canPublish: boolean;
  publishOrder: number;
  contentVersion: number;
  lastRegeneratedAt?: string;
  scheduledAt?: string;
  publishedAt?: string;
  hashtags?: string[];
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  // Additional properties for AIContentCard compatibility
  userId?: string;
  projectId?: number;
  caption?: string;
  emojis?: string[];
  scheduledDate?: string;
  thumbnailUrl?: string;
  mediaUrls?: string[];
  aiGenerated?: boolean;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
}

interface AIContentItem {
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

interface ProjectStats {
  totalContent: number;
  publishedCount: number;
  draftCount: number;
  pausedCount: number;
  stoppedCount: number;
  totalDays: number;
  completionPercentage: number;
}

interface DayContent {
  dayNumber: number;
  date: string;
  content: ContentItem[];
  isPaused: boolean;
  isStopped: boolean;
}

export default function EnhancedProjectDetailsModal({
  isOpen,
  onClose,
  project,
  onProjectUpdate
}: ProjectDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('content');
  const [content, setContent] = useState<AIContentItem[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStats>({
    totalContent: 0,
    publishedCount: 0,
    draftCount: 0,
    pausedCount: 0,
    stoppedCount: 0,
    totalDays: 0,
    completionPercentage: 0
  });
  const [, setDaysContent] = useState<DayContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [showContentEditor, setShowContentEditor] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [extendDays, setExtendDays] = useState(7);
  const [showDeleteProjectDialog, setShowDeleteProjectDialog] = useState(false);
  const [showDeleteContentDialog, setShowDeleteContentDialog] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<ContentItem | null>(null);
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
      // Try to fetch project content from the new API
      let response = await fetch(`/api/projects/${project.id}/content`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Project content API response:', data);
        
        // Handle different response structures
        let projectContent = [];
        if (data.data && data.data.content) {
          projectContent = data.data.content;
        } else if (data.content) {
          projectContent = data.content;
        } else if (Array.isArray(data)) {
          projectContent = data;
        } else if (data.data && Array.isArray(data.data)) {
          projectContent = data.data;
        }
        
        setContent(projectContent);
        processContentData(projectContent);
        return;
      } else if (response.status === 404) {
        // Try AI projects endpoint
        response = await fetch(`/api/ai-projects/${project.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('AI projects API response:', data);
          
          // Handle different response structures
          let projectContent = [];
          if (data.data && data.data.content) {
            projectContent = data.data.content;
          } else if (data.content) {
            projectContent = data.content;
          } else if (Array.isArray(data)) {
            projectContent = data;
          } else if (data.data && Array.isArray(data.data)) {
            projectContent = data.data;
          }
          
          setContent(projectContent);
          processContentData(projectContent);
          return;
        } else {
          // Try regular projects endpoint
          response = await fetch(`/api/projects/${project.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Regular projects API response:', data);
            setContent([]);
            processContentData([]);
            return;
          }
        }
      }

      throw new Error(`Project not found: ${response.status}`);
    } catch (error) {
      console.error('Error loading project data:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        projectId: project?.id
      });
      toast({
        title: "Error",
        description: "Failed to load project data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processContentData = (contentData: ContentItem[] | AIContentItem[]) => {
    // Ensure contentData is an array
    if (!Array.isArray(contentData)) {
      console.warn('processContentData received non-array data:', contentData);
      contentData = [];
    }

    // Transform content data to match AIContentCard interface
    const transformedContent: AIContentItem[] = contentData.map(item => {
      // Handle both ContentItem and AIContentItem interfaces
      const baseItem = item as any;
      return {
        id: baseItem.id,
        userId: baseItem.userId || 'current-user',
        projectId: baseItem.projectId,
        title: baseItem.title || '',
        caption: baseItem.caption || baseItem.description || '',
        hashtags: baseItem.hashtags || [],
        emojis: baseItem.emojis || [],
        contentType: (['post', 'reel', 'short', 'story', 'video'].includes(baseItem.contentType) 
          ? baseItem.contentType 
          : 'post') as 'post' | 'reel' | 'short' | 'story' | 'video',
        status: (baseItem.status as 'draft' | 'scheduled' | 'published' | 'paused' | 'failed') || 'draft',
        scheduledAt: baseItem.scheduledDate || baseItem.scheduledAt,
        publishedAt: baseItem.publishedAt,
        thumbnailUrl: baseItem.thumbnailUrl,
        mediaUrls: baseItem.mediaUrls || [],
        aiGenerated: baseItem.aiGenerated || false,
        platform: baseItem.platform || 'youtube',
        engagement: baseItem.engagement,
        metadata: baseItem.metadata || {},
        createdAt: baseItem.createdAt || new Date().toISOString(),
        updatedAt: baseItem.updatedAt || new Date().toISOString()
      };
    });

    // Update the content state with transformed data
    setContent(transformedContent);

    // Group content by day for the day view (keeping this for other tabs)
    const groupedByDay = contentData.reduce((acc, item) => {
      const baseItem = item as any;
      const dayNumber = baseItem.dayNumber || 1;
      if (!acc[dayNumber]) {
        acc[dayNumber] = {
          dayNumber,
          date: new Date(Date.now() + (dayNumber - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          content: [],
          isPaused: baseItem.isPaused || false,
          isStopped: baseItem.isStopped || false
        };
      }
      // Convert to ContentItem format for day grouping
      const contentItem: ContentItem = {
        id: baseItem.id,
        title: baseItem.title || '',
        description: baseItem.description || baseItem.caption || '',
        content: baseItem.content || baseItem.caption || '',
        platform: baseItem.platform || 'youtube',
        contentType: baseItem.contentType || 'post',
        status: (baseItem.status as 'draft' | 'scheduled' | 'published' | 'failed' | 'paused' | 'stopped') || 'draft',
        dayNumber: baseItem.dayNumber || 1,
        isPaused: baseItem.isPaused || false,
        isStopped: baseItem.isStopped || false,
        canPublish: baseItem.canPublish || true,
        publishOrder: baseItem.publishOrder || 1,
        contentVersion: baseItem.contentVersion || 1,
        lastRegeneratedAt: baseItem.lastRegeneratedAt,
        scheduledAt: baseItem.scheduledAt || baseItem.scheduledDate,
        publishedAt: baseItem.publishedAt,
        hashtags: baseItem.hashtags || [],
        metadata: baseItem.metadata || {},
        createdAt: baseItem.createdAt || new Date().toISOString(),
        updatedAt: baseItem.updatedAt || new Date().toISOString(),
        userId: baseItem.userId || 'current-user',
        projectId: baseItem.projectId,
        caption: baseItem.caption || baseItem.description || '',
        emojis: baseItem.emojis || [],
        scheduledDate: baseItem.scheduledDate || baseItem.scheduledAt,
        thumbnailUrl: baseItem.thumbnailUrl,
        mediaUrls: baseItem.mediaUrls || [],
        aiGenerated: baseItem.aiGenerated || false,
        engagement: baseItem.engagement
      };
      acc[dayNumber].content.push(contentItem);
      return acc;
    }, {} as Record<number, DayContent>);

    const daysArray = Object.values(groupedByDay).sort((a, b) => a.dayNumber - b.dayNumber);
    setDaysContent(daysArray);

    // Calculate stats
    const stats: ProjectStats = {
      totalContent: contentData.length,
      publishedCount: contentData.filter(c => (c as any).status === 'published').length,
      draftCount: contentData.filter(c => (c as any).status === 'draft').length,
      pausedCount: contentData.filter(c => (c as any).isPaused).length,
      stoppedCount: contentData.filter(c => (c as any).isStopped).length,
      totalDays: Math.max(...contentData.map(c => (c as any).dayNumber || 1), 1),
      completionPercentage: contentData.length > 0 ? Math.round((contentData.filter(c => (c as any).status === 'published').length / contentData.length) * 100) : 0
    };
    setProjectStats(stats);
  };

  const handleContentAction = async (action: string, contentItem: ContentItem | AIContentItem, updates?: Partial<ContentItem>) => {
    try {
      let response;
      const baseUrl = contentItem.id > 1000 ? '/api/ai-generated-content' : '/api/content';
      
      switch (action) {
        case 'edit':
          // Convert AIContentItem to ContentItem for editing
          const contentItemForEdit: ContentItem = {
            id: contentItem.id,
            title: contentItem.title,
            description: contentItem.caption || '',
            content: contentItem.caption || '',
            platform: contentItem.platform || 'youtube',
            contentType: contentItem.contentType,
            status: contentItem.status as 'draft' | 'scheduled' | 'published' | 'failed' | 'paused' | 'stopped',
            dayNumber: 1,
            isPaused: false,
            isStopped: false,
            canPublish: true,
            publishOrder: 1,
            contentVersion: 1,
            lastRegeneratedAt: undefined,
            scheduledAt: contentItem.scheduledAt,
            publishedAt: contentItem.publishedAt,
            hashtags: contentItem.hashtags || [],
            metadata: contentItem.metadata || {},
            createdAt: contentItem.createdAt,
            updatedAt: contentItem.updatedAt,
            userId: contentItem.userId,
            projectId: contentItem.projectId,
            caption: contentItem.caption,
            emojis: contentItem.emojis || [],
            scheduledDate: contentItem.scheduledAt,
            thumbnailUrl: contentItem.thumbnailUrl,
            mediaUrls: contentItem.mediaUrls || [],
            aiGenerated: contentItem.aiGenerated,
            engagement: contentItem.engagement
          };
          setEditingContent(contentItemForEdit);
          setShowContentEditor(true);
          break;
          
        case 'update':
          if (!updates) return;
          response = await fetch(`${baseUrl}/${contentItem.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(updates)
          });
          
          if (response.ok) {
            const updatedContent = content.map(c => 
              c.id === contentItem.id ? { ...c, ...updates } : c
            ) as AIContentItem[];
            setContent(updatedContent);
            // Convert back to ContentItem format for processContentData
            const contentItems = updatedContent.map(item => ({
              ...item,
              description: item.caption || '',
              content: item.caption || '',
              dayNumber: 1,
              isPaused: false,
              isStopped: false,
              canPublish: true,
              publishOrder: 1,
              contentVersion: 1,
              platform: item.platform || 'youtube'
            }));
            processContentData(contentItems);
            toast({
              title: "Success",
              description: "Content updated successfully"
            });
          }
          break;
          
        case 'regenerate':
          response = await fetch(`${baseUrl}/${contentItem.id}/regenerate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const updatedContent = content.map(c => 
              c.id === contentItem.id ? { ...c, ...data.content, contentVersion: (c as any).contentVersion ? (c as any).contentVersion + 1 : 2 } : c
            );
            setContent(updatedContent);
            // Convert back to ContentItem format for processContentData
            const contentItems = updatedContent.map(item => ({
              ...item,
              description: item.caption || '',
              content: item.caption || '',
              dayNumber: 1,
              isPaused: false,
              isStopped: false,
              canPublish: true,
              publishOrder: 1,
              contentVersion: (item as any).contentVersion || 1,
              platform: item.platform || 'youtube'
            }));
            processContentData(contentItems);
            toast({
              title: "Success",
              description: "Content regenerated successfully"
            });
          }
          break;
          
        case 'delete':
          // Convert AIContentItem to ContentItem for deletion
          const contentItemForDelete: ContentItem = {
            id: contentItem.id,
            title: contentItem.title,
            description: contentItem.caption || '',
            content: contentItem.caption || '',
            platform: contentItem.platform || 'youtube',
            contentType: contentItem.contentType,
            status: contentItem.status as 'draft' | 'scheduled' | 'published' | 'failed' | 'paused' | 'stopped',
            dayNumber: 1,
            isPaused: false,
            isStopped: false,
            canPublish: true,
            publishOrder: 1,
            contentVersion: 1,
            lastRegeneratedAt: undefined,
            scheduledAt: contentItem.scheduledAt,
            publishedAt: contentItem.publishedAt,
            hashtags: contentItem.hashtags || [],
            metadata: contentItem.metadata || {},
            createdAt: contentItem.createdAt,
            updatedAt: contentItem.updatedAt,
            userId: contentItem.userId,
            projectId: contentItem.projectId,
            caption: contentItem.caption,
            emojis: contentItem.emojis || [],
            scheduledDate: contentItem.scheduledAt,
            thumbnailUrl: contentItem.thumbnailUrl,
            mediaUrls: contentItem.mediaUrls || [],
            aiGenerated: contentItem.aiGenerated,
            engagement: contentItem.engagement
          };
          setContentToDelete(contentItemForDelete);
          setShowDeleteContentDialog(true);
          break;
          
        case 'publish':
          await handleContentAction('update', contentItem, { status: 'published', publishedAt: new Date().toISOString() });
          break;
          
        case 'unpublish':
          await handleContentAction('update', contentItem, { status: 'draft', publishedAt: undefined });
          break;
          
        case 'pause':
          await handleContentAction('update', contentItem, { isPaused: true });
          break;
          
        case 'play':
          await handleContentAction('update', contentItem, { isPaused: false });
          break;
          
        case 'stop':
          await handleContentAction('update', contentItem, { isStopped: true, canPublish: false });
          break;
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} content`,
        variant: "destructive"
      });
    }
  };

  const handleDeleteContent = async () => {
    if (!contentToDelete) return;

    try {
      const baseUrl = contentToDelete.id > 1000 ? '/api/ai-generated-content' : '/api/content';
      const response = await fetch(`${baseUrl}/${contentToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const updatedContent = content.filter(c => c.id !== contentToDelete.id);
        setContent(updatedContent);
            // Convert back to ContentItem format for processContentData
            const contentItems = updatedContent.map(item => ({
              ...item,
              description: item.caption || '',
              content: item.caption || '',
              dayNumber: 1,
              isPaused: false,
              isStopped: false,
              canPublish: true,
              publishOrder: 1,
              contentVersion: 1,
              platform: item.platform || 'youtube'
            }));
        processContentData(contentItems);
        toast({
          title: "Success",
          description: "Content deleted successfully"
        });
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive"
      });
    } finally {
      setShowDeleteContentDialog(false);
      setContentToDelete(null);
    }
  };

  const handleProjectAction = async (action: string) => {
    try {
      let response;
      const baseUrl = project.id > 1000 ? '/api/ai-projects' : '/api/projects';
      
      switch (action) {
        case 'pause':
          response = await fetch(`${baseUrl}/${project.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: 'paused' })
          });
          break;
          
        case 'play':
          response = await fetch(`${baseUrl}/${project.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: 'active' })
          });
          break;
          
        case 'stop':
          // Stop all unpublished content
          const unpublishedContent = content.filter(c => c.status !== 'published');
          for (const item of unpublishedContent) {
            await handleContentAction('stop', item);
          }
          break;
          
        case 'delete':
          setShowDeleteProjectDialog(true);
          break;
      }
      
      if (response?.ok) {
        toast({
          title: "Success",
          description: `Project ${action}ed successfully`
        });
        onProjectUpdate?.(project.id, { status: action === 'play' ? 'active' : action });
      }
    } catch (error) {
      console.error(`Error performing project ${action}:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} project`,
        variant: "destructive"
      });
    }
  };

  const handleDeleteProject = async () => {
    try {
      const baseUrl = project.id > 1000 ? '/api/ai-projects' : '/api/projects';
      const response = await fetch(`${baseUrl}/${project.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Project deleted successfully"
        });
        onClose();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive"
      });
    } finally {
      setShowDeleteProjectDialog(false);
    }
  };

  const handleExtendProject = async () => {
    try {
      const baseUrl = project.id > 1000 ? '/api/ai-projects' : '/api/projects';
      const response = await fetch(`${baseUrl}/${project.id}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ days: extendDays })
      });

      if (response.ok) {
        const data = await response.json();
        const newContent = data.content || content;
        setContent(newContent);
        // Convert to ContentItem format for processContentData
        const contentItems = newContent.map((item: any) => ({
          ...item,
          description: item.caption || item.description || '',
          content: item.caption || item.content || '',
          dayNumber: item.dayNumber || 1,
          isPaused: item.isPaused || false,
          isStopped: item.isStopped || false,
          canPublish: item.canPublish || true,
          publishOrder: item.publishOrder || 1,
          contentVersion: item.contentVersion || 1,
          platform: item.platform || 'youtube'
        }));
        processContentData(contentItems);
        toast({
          title: "Success",
          description: `Project extended by ${extendDays} days`
        });
        setShowExtendDialog(false);
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




  if (!project) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">{project.title || project.name}</DialogTitle>
                <DialogDescription className="mt-2">
                  {project.description || 'Project details and content management'}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExtendDialog(true)}
                >
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Extend
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {project.status === 'active' ? (
                      <DropdownMenuItem onClick={() => handleProjectAction('pause')}>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause Project
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleProjectAction('play')}>
                        <Play className="h-4 w-4 mr-2" />
                        Resume Project
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleProjectAction('stop')}>
                      <StopCircle className="h-4 w-4 mr-2" />
                      Stop Publishing
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleProjectAction('delete')}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="flex-1 overflow-y-auto space-y-4">
              <div className="space-y-6">
                {/* Project Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-600">Total Content</p>
                          <p className="text-2xl font-bold">{projectStats.totalContent}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm text-gray-600">Published</p>
                          <p className="text-2xl font-bold">{projectStats.publishedCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Edit className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Drafts</p>
                          <p className="text-2xl font-bold">{projectStats.draftCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="text-sm text-gray-600">Completion</p>
                          <p className="text-2xl font-bold">{projectStats.completionPercentage}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Content Grid */}
                <div className="space-y-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin" />
                      <span className="ml-2">Loading content...</span>
                    </div>
                  ) : content.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {content.map((contentItem) => (
                        <AIContentCard
                          key={contentItem.id}
                          content={contentItem}
                          onStatusChange={async (contentId, status) => {
                            try {
                              const response = await fetch(`/api/content/${contentId}`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                                },
                                credentials: 'include',
                                body: JSON.stringify({ content_status: status })
                              });
                              
                              if (response.ok) {
                                const updatedContent = content.map(c => 
                                  c.id === contentId ? { ...c, status: status as 'draft' | 'scheduled' | 'published' | 'paused' | 'failed' } : c
                                );
                                setContent(updatedContent);
                                // Convert back to ContentItem format for processContentData
                                const contentItems = updatedContent.map(item => ({
                                  ...item,
                                  description: item.caption || '',
                                  content: item.caption || '',
                                  dayNumber: 1,
                                  isPaused: false,
                                  isStopped: false,
                                  canPublish: true,
                                  publishOrder: 1,
                                  contentVersion: 1,
                                  platform: item.platform || 'youtube'
                                }));
                                processContentData(contentItems);
                                toast({
                                  title: "Status Updated",
                                  description: `Content status updated to ${status}`,
                                });
                              }
                            } catch (error) {
                              console.error('Error updating content status:', error);
                              toast({
                                title: "Update Failed",
                                description: "Failed to update content status",
                                variant: "destructive"
                              });
                            }
                          }}
                          onRegenerate={async () => {
                            toast({
                              title: "Regenerating Content",
                              description: "AI is generating new content...",
                            });
                          }}
                          onEdit={async (contentId, updates) => {
                            try {
                              const response = await fetch(`/api/content/${contentId}`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                                },
                                credentials: 'include',
                                body: JSON.stringify(updates)
                              });
                              
                              if (response.ok) {
                                const updatedContent = content.map(c => 
                                  c.id === contentId ? { ...c, ...updates } : c
                                );
                                setContent(updatedContent);
                                // Convert back to ContentItem format for processContentData
                                const contentItems = updatedContent.map(item => ({
                                  ...item,
                                  description: item.caption || '',
                                  content: item.caption || '',
                                  dayNumber: 1,
                                  isPaused: false,
                                  isStopped: false,
                                  canPublish: true,
                                  publishOrder: 1,
                                  contentVersion: 1,
                                  platform: item.platform || 'youtube'
                                }));
                                processContentData(contentItems);
                                toast({
                                  title: "Content Updated",
                                  description: "Content has been updated successfully",
                                });
                              }
                            } catch (error) {
                              console.error('Error updating content:', error);
                              toast({
                                title: "Update Failed",
                                description: "Failed to update content",
                                variant: "destructive"
                              });
                            }
                          }}
                          onDelete={async (contentId) => {
                            try {
                              const response = await fetch(`/api/content/${contentId}`, {
                                method: 'DELETE',
                                headers: {
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                                },
                                credentials: 'include'
                              });
                              
                              if (response.ok) {
                                const updatedContent = content.filter(c => c.id !== contentId);
                                setContent(updatedContent);
                                // Convert back to ContentItem format for processContentData
                                const contentItems = updatedContent.map(item => ({
                                  ...item,
                                  description: item.caption || '',
                                  content: item.caption || '',
                                  dayNumber: 1,
                                  isPaused: false,
                                  isStopped: false,
                                  canPublish: true,
                                  publishOrder: 1,
                                  contentVersion: 1,
                                  platform: item.platform || 'youtube'
                                }));
                                processContentData(contentItems);
                                toast({
                                  title: "Content Deleted",
                                  description: "Content has been deleted successfully",
                                });
                              }
                            } catch (error) {
                              console.error('Error deleting content:', error);
                              toast({
                                title: "Delete Failed",
                                description: "Failed to delete content",
                                variant: "destructive"
                              });
                            }
                          }}
                          onPublishNow={async (contentId) => {
                            try {
                              const response = await fetch(`/api/content/${contentId}`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                                },
                                credentials: 'include',
                                body: JSON.stringify({ 
                                  content_status: 'published',
                                  published_at: new Date().toISOString()
                                })
                              });
                              
                              if (response.ok) {
                                const updatedContent = content.map(c => 
                                  c.id === contentId ? { ...c, status: 'published' as const, publishedAt: new Date().toISOString() } : c
                                );
                                setContent(updatedContent);
                                // Convert back to ContentItem format for processContentData
                                const contentItems = updatedContent.map(item => ({
                                  ...item,
                                  description: item.caption || '',
                                  content: item.caption || '',
                                  dayNumber: 1,
                                  isPaused: false,
                                  isStopped: false,
                                  canPublish: true,
                                  publishOrder: 1,
                                  contentVersion: 1,
                                  platform: item.platform || 'youtube'
                                }));
                                processContentData(contentItems);
                                toast({
                                  title: "Content Published",
                                  description: "Content has been published successfully",
                                });
                              }
                            } catch (error) {
                              console.error('Error publishing content:', error);
                              toast({
                                title: "Publish Failed",
                                description: "Failed to publish content",
                                variant: "destructive"
                              });
                            }
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card className="p-12 text-center">
                      <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold mb-2">No Content Yet</h3>
                      <p className="text-gray-500 mb-4">This project doesn't have any content yet.</p>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Content
                      </Button>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="calendar" className="flex-1 overflow-y-auto space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Content Calendar</CardTitle>
                  <CardDescription>Schedule and manage your content timeline</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2">Calendar View</h3>
                    <p className="text-gray-500">Calendar integration coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="flex-1 overflow-y-auto space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Analytics</CardTitle>
                  <CardDescription>Track performance and engagement metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                    <p className="text-gray-500">Analytics integration coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Extend Project Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Project</DialogTitle>
            <DialogDescription>
              Add more days to your project timeline
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="extendDays">Number of days to add</Label>
              <Input
                id="extendDays"
                type="number"
                min="1"
                max="30"
                value={extendDays}
                onChange={(e) => setExtendDays(parseInt(e.target.value) || 7)}
              />
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

      {/* Delete Project Confirmation */}
      <AlertDialog open={showDeleteProjectDialog} onOpenChange={setShowDeleteProjectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone and will remove all associated content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-red-600 hover:bg-red-700">
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Content Confirmation */}
      <AlertDialog open={showDeleteContentDialog} onOpenChange={setShowDeleteContentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this content item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContent} className="bg-red-600 hover:bg-red-700">
              Delete Content
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Content Editor Modal */}
      {editingContent && (
        <ContentEditorModal
          isOpen={showContentEditor}
          onClose={() => {
            setShowContentEditor(false);
            setEditingContent(null);
          }}
          content={editingContent}
          onSave={async (_, updates) => {
            await handleContentAction('update', editingContent, updates);
            setShowContentEditor(false);
            setEditingContent(null);
          }}
          onRegenerate={async () => {
            await handleContentAction('regenerate', editingContent);
          }}
          onRecreate={async () => {
            await handleContentAction('regenerate', editingContent);
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
