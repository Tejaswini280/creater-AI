import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Calendar, 
  BarChart3, 
  Settings, 
  RefreshCw, 
  Eye, 
  Edit, 
  Trash2,
  Sparkles,
  Target,
  Clock,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AIProjectForm from '@/components/social-media/AIProjectForm';
import AIContentCalendar from '@/components/social-media/AIContentCalendar';
import ProjectCards from '@/components/social-media/ProjectCards';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AIProject {
  id: number;
  title: string;
  description: string;
  projectType: string;
  duration: number;
  targetChannels: string[];
  contentFrequency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  contentItems?: any[];
  calendarEntries?: any[];
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

const PROJECT_TYPE_ICONS = {
  fitness: '💪',
  business: '💼',
  lifestyle: '🌟',
  technology: '💻',
  food: '🍳',
  travel: '✈️',
  fashion: '👗',
  education: '📚',
  entertainment: '🎬',
  finance: '💰',
};

const PLATFORM_ICONS = {
  instagram: '📸',
  youtube: '🎥',
  tiktok: '🎵',
  linkedin: '💼',
  facebook: '👥',
  twitter: '🐦',
};

export default function AIProjectDashboard() {
  const [, setLocation] = useLocation();
  const [projects, setProjects] = useState<AIProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<AIProject | null>(null);
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load analytics when project is selected
  useEffect(() => {
    if (selectedProject) {
      loadProjectAnalytics(selectedProject.id);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.data || []);
      } else {
        throw new Error('Failed to load projects');
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectAnalytics = async (projectId: number) => {
    try {
      const response = await fetch(`/api/ai-projects/${projectId}/analytics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      } else {
        throw new Error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive"
      });
    }
  };

  const handleProjectCreated = (projectData: any) => {
    setProjects(prev => [projectData.project, ...prev]);
    setShowCreateForm(false);
    setSelectedProject(projectData.project);
    setActiveTab('calendar');
  };

  const handleProjectSelect = (project: AIProject) => {
    setSelectedProject(project);
    setActiveTab('overview');
  };

  const handleDeleteProject = async (projectId: number) => {
    try {
      const response = await fetch(`/api/ai-projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        if (selectedProject?.id === projectId) {
          setSelectedProject(null);
          setAnalytics(null);
        }
        toast({
          title: "Success!",
          description: "Project deleted successfully",
        });
      } else {
        throw new Error('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive"
      });
    }
  };

  const handleRegenerateProject = async (projectId: number, type: 'content' | 'calendar' | 'both') => {
    try {
      const response = await fetch(`/api/ai-projects/${projectId}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ regenerateType: type })
      });

      if (response.ok) {
        const data = await response.json();
        // Update the selected project with new data
        if (selectedProject?.id === projectId) {
          setSelectedProject(prev => prev ? {
            ...prev,
            contentItems: data.data.contentItems,
            calendarEntries: data.data.calendarEntries
          } : null);
        }
        toast({
          title: "Success!",
          description: `Project ${type} regenerated successfully`,
        });
      } else {
        throw new Error('Failed to regenerate project');
      }
    } catch (error) {
      console.error('Error regenerating project:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate project",
        variant: "destructive"
      });
    }
  };

  if (isLoading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-blue-500" />
              AI Project Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your AI-driven social media projects and content calendars
            </p>
          </div>
          
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create AI Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New AI Project</DialogTitle>
                <DialogDescription>
                  Set up a new AI-driven social media project with automated content generation
                </DialogDescription>
              </DialogHeader>
              <AIProjectForm onProjectCreated={handleProjectCreated} />
            </DialogContent>
          </Dialog>
        </div>

        {!selectedProject ? (
          /* Projects List */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your AI Projects ({projects.length})</h2>
              <Button variant="outline" onClick={loadProjects}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {projects.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No AI Projects Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first AI-driven social media project to get started
                  </p>
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Project
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ProjectCards
                projects={projects}
                onProjectUpdate={(projectId, updates) => {
                  setProjects(prev => prev.map(p =>
                    p.id === projectId ? { ...p, ...updates } : p
                  ));
                  if (selectedProject?.id === projectId) {
                    setSelectedProject(prev => prev ? { ...prev, ...updates } : null);
                  }
                }}
                onProjectAction={async (projectId, action) => {
                  try {
                    const response = await fetch(`/api/ai-projects/${projectId}/action`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      },
                      body: JSON.stringify({ action })
                    });

                    if (response.ok) {
                      const data = await response.json();
                      setProjects(prev => prev.map(p =>
                        p.id === projectId ? data.data : p
                      ));
                      if (selectedProject?.id === projectId) {
                        setSelectedProject(data.data);
                      }
                      toast({
                        title: "Success!",
                        description: `Project ${action}ed successfully`,
                      });
                    } else {
                      throw new Error('Failed to perform action');
                    }
                  } catch (error) {
                    console.error('Error performing project action:', error);
                    toast({
                      title: "Error",
                      description: `Failed to ${action} project`,
                      variant: "destructive"
                    });
                  }
                }}
              />
            )}
          </div>
        ) : (
          /* Selected Project View */
          <div className="space-y-6">
            {/* Project Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {PROJECT_TYPE_ICONS[selectedProject.projectType as keyof typeof PROJECT_TYPE_ICONS]}
                    </span>
                    <div>
                      <CardTitle className="text-2xl">{selectedProject.title}</CardTitle>
                      <CardDescription className="text-base">
                        {selectedProject.description || 'No description provided'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedProject.status === 'active' ? 'default' : 'secondary'}>
                      {selectedProject.status}
                    </Badge>
                    <Button variant="outline" onClick={() => setSelectedProject(null)}>
                      Back to Projects
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Project Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedProject.contentItems?.length || 0}</div>
                      <p className="text-xs text-gray-500">AI-generated pieces</p>
                    </CardContent>
                    </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Platforms</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedProject.targetChannels.length}</div>
                      <p className="text-xs text-gray-500">Target channels</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Duration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedProject.duration}</div>
                      <p className="text-xs text-gray-500">Days</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Frequency</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold capitalize">{selectedProject.contentFrequency}</div>
                      <p className="text-xs text-gray-500">Posting schedule</p>
                    </CardContent>
                  </Card>
                </div>

                {analytics && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Engagement Predictions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">
                              {analytics.engagementPredictions.average.toFixed(1)}%
                            </div>
                            <p className="text-sm text-gray-500">Average Engagement</p>
                          </div>
                          <div className="space-y-2">
                            {Object.entries(analytics.engagementPredictions.byPlatform).map(([platform, score]) => (
                              <div key={platform} className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                  {PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS]}
                                  {platform}
                                </span>
                                <span className="font-medium">{score.toFixed(1)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Project Health
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-green-600">
                              {analytics.projectHealth.score}/100
                            </div>
                            <p className="text-sm text-gray-500">Health Score</p>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium">Recommendations:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {analytics.projectHealth.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-1">•</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="calendar">
                <AIContentCalendar 
                  projectId={selectedProject.id}
                  onContentUpdate={(content) => {
                    setSelectedProject(prev => prev ? { ...prev, contentItems: content } : null);
                  }}
                  onCalendarUpdate={(calendar) => {
                    setSelectedProject(prev => prev ? { ...prev, calendarEntries: calendar } : null);
                  }}
                />
              </TabsContent>

              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Analytics</CardTitle>
                    <CardDescription>
                      Detailed insights and performance metrics for your AI project
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-semibold mb-3">Content Distribution by Platform</h3>
                            <div className="space-y-2">
                              {Object.entries(analytics.contentByPlatform).map(([platform, count]) => (
                                <div key={platform} className="flex items-center justify-between">
                                  <span className="flex items-center gap-2">
                                    {PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS]}
                                    {platform}
                                  </span>
                                  <span className="font-medium">{count} pieces</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h3 className="font-semibold mb-3">Content Types</h3>
                            <div className="space-y-2">
                              {Object.entries(analytics.contentByType).map(([type, count]) => (
                                <div key={type} className="flex items-center justify-between">
                                  <span className="capitalize">{type}</span>
                                  <span className="font-medium">{count} pieces</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Optimal Posting Times</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(analytics.optimalPostingTimes).map(([platform, times]) => (
                              <Card key={platform}>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm flex items-center gap-2">
                                    {PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS]}
                                    {platform}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-1">
                                    {times.map((time, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {time}
                                      </Badge>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">Analytics data not available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Settings</CardTitle>
                    <CardDescription>
                      Manage your project configuration and AI settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold mb-2">Project Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Type:</span>
                            <span className="ml-2 capitalize">{selectedProject.projectType}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <span className="ml-2">{selectedProject.duration} days</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Frequency:</span>
                            <span className="ml-2 capitalize">{selectedProject.contentFrequency}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Status:</span>
                            <span className="ml-2 capitalize">{selectedProject.status}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold mb-2">Target Platforms</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedProject.targetChannels.map((channel) => (
                            <Badge key={channel} variant="secondary">
                              {PLATFORM_ICONS[channel as keyof typeof PLATFORM_ICONS]} {channel}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Project
                        </Button>
                        <Button variant="outline">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate All
                        </Button>
                        <Button variant="destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Project
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
