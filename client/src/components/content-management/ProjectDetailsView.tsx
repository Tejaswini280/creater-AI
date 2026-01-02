import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Square, 
  Trash2, 
  Edit, 
  RotateCcw, 
  Save, 
  Calendar,
  Plus,
  Settings,
  BarChart3,
  Filter,
  MoreVertical,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { ContentCard } from './ContentCard';
import { ContentDayView } from './ContentDayView';
import { ProjectStats } from './ProjectStats';
import { BulkActionsPanel } from './BulkActionsPanel';
import { ExtendProjectModal } from './ExtendProjectModal';
import { ProjectSettingsModal } from './ProjectSettingsModal';
import { useToast } from '@/hooks/use-toast';

interface ProjectDetailsViewProps {
  projectId: number;
  onBack: () => void;
}

interface ProjectContentOverview {
  projectId: number;
  projectName: string;
  totalDays: number;
  currentDay: number;
  contentPerDay: number;
  isPaused: boolean;
  isStopped: boolean;
  canPublishUnpublished: boolean;
  totalContent: number;
  publishedContent: number;
  unpublishedContent: number;
  pausedContent: number;
  stoppedContent: number;
  days: ContentDay[];
}

interface ContentDay {
  dayNumber: number;
  date: Date;
  content: ContentCard[];
  totalContent: number;
  publishedContent: number;
  unpublishedContent: number;
  pausedContent: number;
  stoppedContent: number;
}

interface ContentCard {
  id: number;
  title: string;
  description: string;
  content: string;
  platform: string;
  contentType: string;
  status: string;
  dayNumber: number;
  scheduledDate: Date | null;
  publishedAt: Date | null;
  isPaused: boolean;
  isStopped: boolean;
  canPublish: boolean;
  publishOrder: number;
  contentVersion: number;
  lastRegeneratedAt: Date | null;
  hashtags: string[];
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export function ProjectDetailsView({ projectId, onBack }: ProjectDetailsViewProps) {
  const [overview, setOverview] = useState<ProjectContentOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    loadProjectOverview();
  }, [projectId]);

  const loadProjectOverview = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/content-management/project/${projectId}/overview`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load project overview');
      }

      const data = await response.json();
      setOverview(data.data);
    } catch (error) {
      console.error('Error loading project overview:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project overview',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContentAction = async (contentId: number, action: string, data?: any) => {
    try {
      const response = await fetch(`/api/content-management/content/${contentId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action, data })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} content`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message
        });
        // Reload the overview to reflect changes
        loadProjectOverview();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error(`Error ${action}ing content:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} content`,
        variant: 'destructive'
      });
    }
  };

  const handleBulkAction = async (action: string, filters?: any) => {
    try {
      const response = await fetch(`/api/content-management/project/${projectId}/bulk-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action, filters })
      });

      if (!response.ok) {
        throw new Error(`Failed to perform bulk ${action}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `Bulk ${action} completed. ${result.data.affectedCount} items affected.`
        });
        loadProjectOverview();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      toast({
        title: 'Error',
        description: `Failed to perform bulk ${action}`,
        variant: 'destructive'
      });
    }
  };

  const handleExtendProject = async (additionalDays: number, platforms: string[], contentType: string) => {
    try {
      const response = await fetch(`/api/content-management/project/${projectId}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ additionalDays, platforms, contentType })
      });

      if (!response.ok) {
        throw new Error('Failed to extend project');
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `Project extended by ${additionalDays} days. ${result.data.newContentCount} new content pieces created.`
        });
        loadProjectOverview();
        setShowExtendModal(false);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error extending project:', error);
      toast({
        title: 'Error',
        description: 'Failed to extend project',
        variant: 'destructive'
      });
    }
  };

  const handleProjectSettingsUpdate = async (settings: any) => {
    try {
      const response = await fetch(`/api/content-management/project/${projectId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to update project settings');
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Project settings updated successfully'
        });
        loadProjectOverview();
        setShowSettingsModal(false);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error updating project settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project settings',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load project details</p>
        <Button onClick={onBack} className="mt-4">
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{overview.projectName}</h1>
            <p className="text-gray-500">
              {overview.totalDays} days • {overview.contentPerDay} content per day
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowBulkActions(!showBulkActions)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Bulk Actions
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowExtendModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Extend Project
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowSettingsModal(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Project Status */}
      <div className="flex items-center space-x-4">
        <Badge variant={overview.isPaused ? "secondary" : overview.isStopped ? "destructive" : "default"}>
          {overview.isPaused ? "Paused" : overview.isStopped ? "Stopped" : "Active"}
        </Badge>
        <Badge variant={overview.canPublishUnpublished ? "default" : "secondary"}>
          {overview.canPublishUnpublished ? "Can Publish" : "Publishing Disabled"}
        </Badge>
        <div className="text-sm text-gray-500">
          Current Day: {overview.currentDay} of {overview.totalDays}
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {showBulkActions && (
        <BulkActionsPanel
          onAction={handleBulkAction}
          onClose={() => setShowBulkActions(false)}
          projectStats={{
            totalContent: overview.totalContent,
            publishedContent: overview.publishedContent,
            unpublishedContent: overview.unpublishedContent,
            pausedContent: overview.pausedContent,
            stoppedContent: overview.stoppedContent
          }}
        />
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Project Stats */}
          <ProjectStats
            totalContent={overview.totalContent}
            publishedContent={overview.publishedContent}
            unpublishedContent={overview.unpublishedContent}
            pausedContent={overview.pausedContent}
            stoppedContent={overview.stoppedContent}
            totalDays={overview.totalDays}
            currentDay={overview.currentDay}
          />

          {/* Days List */}
          <div className="grid gap-4">
            <h2 className="text-lg font-semibold">Content by Day</h2>
            <div className="grid gap-4">
              {overview.days.map((day) => (
                <ContentDayView
                  key={day.dayNumber}
                  day={day}
                  onContentAction={handleContentAction}
                  onViewDay={() => setSelectedDay(day.dayNumber)}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Calendar View</h3>
            <p className="text-gray-500">Calendar view will be implemented here</p>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Statistics</h3>
            <p className="text-gray-500">Detailed statistics will be implemented here</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showExtendModal && (
        <ExtendProjectModal
          onExtend={handleExtendProject}
          onClose={() => setShowExtendModal(false)}
        />
      )}

      {showSettingsModal && (
        <ProjectSettingsModal
          projectId={projectId}
          currentSettings={{
            isPaused: overview.isPaused,
            isStopped: overview.isStopped,
            canPublishUnpublished: overview.canPublishUnpublished
          }}
          onUpdate={handleProjectSettingsUpdate}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
}
