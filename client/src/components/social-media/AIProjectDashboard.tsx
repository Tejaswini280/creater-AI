import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Calendar, 
  BarChart3, 
  Settings, 
  RefreshCw,
  Play,
  Pause,
  Square,
  Edit,
  Trash2,
  Eye,
  Download,
  Share2,
  Zap,
  TrendingUp,
  Users,
  Clock,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import AIProjectForm from './AIProjectForm';
import AIContentCalendar from './AIContentCalendar';

interface Project {
  id: number;
  title: string;
  description: string;
  projectType: string;
  duration: number;
  targetChannels: string[];
  contentFrequency: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectAnalytics {
  totalContent: number;
  totalCalendarEntries: number;
  contentByPlatform: Record<string, number>;
  contentByType: Record<string, number>;
  engagementPredictions: {
    average: number;
    byPlatform: Record<string, number>;
  };
  optimalPostingTimes: Record<string, string[]>;
  projectHealth: {
    score: number;
    recommendations: string[];
  };
}

interface ContentItem {
  id: number;
  title: string;
  description: string;
  content: string;
  platform: string;
  contentType: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledDate: string;
  hashtags: string[];
  metadata: any;
  engagementPrediction?: {
    average: number;
    likes: number;
    comments: number;
    shares: number;
  };
}

interface CalendarEntry {
  id: number;
  contentId: number;
  scheduledDate: string;
  scheduledTime: string;
  platform: string;
  contentType: string;
  status: 'scheduled' | 'published' | 'failed';
  optimalPostingTime: boolean;
  engagementScore: number;
  aiOptimized: boolean;
  metadata: any;
}

const PLATFORM_COLORS = {
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  facebook: 'bg-gradient-to-r from-blue-500 to-blue-600',
  linkedin: 'bg-gradient-to-r from-blue-600 to-blue-700',
  tiktok: 'bg-gradient-to-r from-black to-gray-800',
  youtube: 'bg-gradient-to-r from-red-500 to-red-600',
  twitter: 'bg-gradient-to-r from-blue-400 to-blue-500'
};

const PLATFORM_ICONS = {
  instagram: '📸',
  facebook: '📘',
  linkedin: '💼',
  tiktok: '🎵',
  youtube: '📺',
  twitter: '🐦'
};

export default function AIProjectDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectContent, setProjectContent] = useState<ContentItem[]>([]);
  const [projectCalendar, setProjectCalendar] = useState<CalendarEntry[]>([]);
  const [projectAnalytics, setProjectAnalytics] = useState<ProjectAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const result = await response.json();
      setProjects(result.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive"
      });
    }
  }, [toast]);

  const fetchProjectDetails = useCallback(async (projectId: number) => {
    try {
      const [projectResponse, analyticsResponse] = await Promise.all([
        fetch(`/api/ai-projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch(`/api/ai-projects/${projectId}/analytics`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ]);

      if (!projectResponse.ok || !analyticsResponse.ok) {
        throw new Error('Failed to fetch project details');
      }

      const projectResult = await projectResponse.json();
      const analyticsResult = await analyticsResponse.json();

      setSelectedProject(projectResult.data.project);
      setProjectContent(projectResult.data.content || []);
      setProjectCalendar(projectResult.data.calendar || []);
      setProjectAnalytics(analyticsResult.data);
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch project details",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleProjectCreate = useCallback((newProject: any) => {
    setProjects(prev => [newProject.project, ...prev]);
    setSelectedProject(newProject.project);
    setProjectContent(newProject.contentItems || []);
    setProjectCalendar(newProject.calendarEntries || []);
    setShowCreateForm(false);
    setActiveTab('calendar');
  }, []);

  const handleContentUpdate = useCallback(async (contentId: number, updates: Partial<ContentItem>) => {
    try {
      const response = await fetch(`/api/ai-projects/${selectedProject?.id}/content/${contentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update content');
      }

      setProjectContent(prev => 
        prev.map(item => 
          item.id === contentId ? { ...item, ...updates } : item
        )
      );

      toast({
        title: "Success",
        description: "Content updated successfully",
      });
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive"
      });
    }
  }, [selectedProject, toast]);

  const handleCalendarUpdate = useCallback(async (calendarId: number, updates: Partial<CalendarEntry>) => {
    try {
      const response = await fetch(`/api/ai-projects/${selectedProject?.id}/calendar/${calendarId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update calendar');
      }

      setProjectCalendar(prev => 
        prev.map(item => 
          item.id === calendarId ? { ...item, ...updates } : item
        )
      );

      toast({
        title: "Success",
        description: "Calendar updated successfully",
      });
    } catch (error) {
      console.error('Error updating calendar:', error);
      toast({
        title: "Error",
        description: "Failed to update calendar",
        variant: "destructive"
      });
    }
  }, [selectedProject, toast]);

  const handleContentDelete = useCallback(async (contentId: number) => {
    try {
      const response = await fetch(`/api/ai-projects/${selectedProject?.id}/content/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete content');
      }

      setProjectContent(prev => prev.filter(item => item.id !== contentId));
      setProjectCalendar(prev => prev.filter(item => item.contentId !== contentId));

      toast({
        title: "Success",
        description: "Content deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive"
      });
    }
  }, [selectedProject, toast]);

  const handleRegenerateContent = useCallback(async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`/api/ai-projects/${selectedProject.id}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          regenerateType: 'both'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate content');
      }

      const result = await response.json();
      setProjectContent(result.data.contentItems || []);
      setProjectCalendar(result.data.calendarEntries || []);

      toast({
        title: "Success",
        description: "Content regenerated successfully",
      });
    } catch (error) {
      console.error('Error regenerating content:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate content",
        variant: "destructive"
      });
    }
  }, [selectedProject, toast]);

  const handleProjectAction = useCallback(async (action: string) => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`/api/ai-projects/${selectedProject.id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        throw new Error('Failed to perform action');
      }

      const result = await response.json();
      setSelectedProject(result.data);

      toast({
        title: "Success",
        description: `Project ${action}ed successfully`,
      });
    } catch (error) {
      console.error('Error performing action:', error);
      toast({
        title: "Error",
        description: "Failed to perform action",
        variant: "destructive"
      });
    }
  }, [selectedProject, toast]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchProjects();
      setIsLoading(false);
    };

    loadData();
  }, [fetchProjects]);

  const renderProjectCard = (project: Project) => (
    <Card
      key={project.id}
      className={`cursor-pointer transition-all hover:shadow-md ${
        selectedProject?.id === project.id ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => {
        setSelectedProject(project);
        fetchProjectDetails(project.id);
        setActiveTab('overview');
      }}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{project.title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{project.description}</p>
          </div>
          <Badge
            variant="secondary"
            className={`${
              project.status === 'active' ? 'bg-green-100 text-green-800' :
              project.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}
          >
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{project.projectType}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{project.duration} days</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-1">
              {project.targetChannels.slice(0, 3).map((channel) => (
                <div
                  key={channel}
                  className={`w-6 h-6 rounded-full ${PLATFORM_COLORS[channel as keyof typeof PLATFORM_COLORS]} flex items-center justify-center text-white text-xs`}
                >
                  {PLATFORM_ICONS[channel as keyof typeof PLATFORM_ICONS]}
                </div>
              ))}
              {project.targetChannels.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs">
                  +{project.targetChannels.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderOverview = () => {
    if (!selectedProject || !projectAnalytics) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Content</p>
                  <p className="text-2xl font-bold">{projectAnalytics.totalContent}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Calendar Entries</p>
                  <p className="text-2xl font-bold">{projectAnalytics.totalCalendarEntries}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Avg Engagement</p>
                  <p className="text-2xl font-bold">{Math.round(projectAnalytics.engagementPredictions.average)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Zap className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">Project Health</p>
                  <p className="text-2xl font-bold">{projectAnalytics.projectHealth.score}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Content by Platform</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(projectAnalytics.contentByPlatform).map(([platform, count]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS]}
                      </span>
                      <span className="capitalize">{platform}</span>
                    </div>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {projectAnalytics.projectHealth.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-600">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderContentList = () => (
    <div className="space-y-4">
      {projectContent.map((item) => (
        <Card key={item.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">
                    {PLATFORM_ICONS[item.platform as keyof typeof PLATFORM_ICONS]}
                  </span>
                  <div>
                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span className="capitalize">{item.platform}</span>
                      <span>•</span>
                      <span className="capitalize">{item.contentType}</span>
                      <span>•</span>
                      <span>{item.scheduledDate}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {item.description}
                </p>
                
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      item.status === 'published' ? 'bg-green-100 text-green-800' :
                      item.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      item.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {item.status}
                  </Badge>
                  
                  {item.engagementPrediction && (
                    <Badge variant="outline" className="text-xs">
                      {Math.round(item.engagementPrediction.average)}% engagement
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleContentUpdate(item.id, { status: 'published' })}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleContentDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Project Management</h1>
          <p className="text-gray-600">Create and manage AI-driven social media projects</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create AI Project
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Your Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No projects yet</p>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    variant="outline"
                    size="sm"
                  >
                    Create your first project
                  </Button>
                </div>
              ) : (
                projects.map(renderProjectCard)
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedProject ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedProject.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{selectedProject.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProjectAction(selectedProject.status === 'active' ? 'pause' : 'start')}
                    >
                      {selectedProject.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateContent}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProject(null)}
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="calendar">Calendar</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="mt-6">
                    {renderOverview()}
                  </TabsContent>
                  
                  <TabsContent value="content" className="mt-6">
                    {renderContentList()}
                  </TabsContent>
                  
                  <TabsContent value="calendar" className="mt-6">
                    <AIContentCalendar
                      projectId={selectedProject.id}
                      content={projectContent}
                      calendar={projectCalendar}
                      onContentUpdate={handleContentUpdate}
                      onCalendarUpdate={handleCalendarUpdate}
                      onContentDelete={handleContentDelete}
                      onRegenerateContent={handleRegenerateContent}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Project</h3>
                <p className="text-gray-600">Choose a project from the sidebar to view details and manage content</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCreateForm && (
          <AIProjectForm
            onProjectCreate={handleProjectCreate}
            onCancel={() => setShowCreateForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
