import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { SocialMediaCalendarView } from '@/components/social-media/SocialMediaCalendarView';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  Brain,
  Target,
  TrendingUp,
  Eye,
  Edit,
  RefreshCw,
  Play,
  Pause,
  StopCircle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// API function to fetch project details
const fetchProjectDetails = async (projectId: string) => {
  const response = await fetch(`/api/projects/${projectId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch project details');
  }

  return response.json();
};

// API function to fetch project content
const fetchProjectContent = async (projectId: string) => {
  const response = await fetch(`/api/projects/${projectId}/content`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch project content');
  }

  return response.json();
};

export default function SocialMediaProjectDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/social-media-project/:id');
  const projectId = params?.id;
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Fetch project details
  const { data: projectData, isLoading: projectLoading, error: projectError, refetch: refetchProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProjectDetails(projectId!),
    enabled: !!projectId,
  });

  // Fetch project content
  const { data: contentData, isLoading: contentLoading, error: contentError, refetch: refetchContent } = useQuery({
    queryKey: ['project-content', projectId],
    queryFn: () => fetchProjectContent(projectId!),
    enabled: !!projectId,
  });

  const project = projectData?.project;
  const content = contentData?.content || [];
  const isLoading = projectLoading || contentLoading;
  const error = projectError || contentError;

  // Organize content by day
  const contentByDay = content.reduce((acc: any, item: any) => {
    const day = item.dayNumber || 1;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(item);
    return acc;
  }, {});

  const totalDays = Math.max(...Object.keys(contentByDay).map((key: string) => Number(key)), 1);
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Handle project actions (start, pause, stop)
  const handleProjectAction = async (action: 'start' | 'pause' | 'stop') => {
    if (!projectId) return;

    try {
      const newStatus = action === 'start' ? 'active' : action;
      const response = await fetch(`/api/projects/${projectId}`, {
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
          description: `Project ${action}ed successfully`,
        });
        refetchProject(); // Refresh project data
        refetchContent(); // Refresh content data
      } else {
        throw new Error('Failed to update project status');
      }
    } catch (error) {
      console.error('Error updating project status:', error);
      toast({
        title: "Error",
        description: `Failed to ${action} project`,
        variant: "destructive"
      });
    }
  };

  // Handle content actions
  const handleContentAction = async (contentId: number, action: string, data?: any) => {
    try {
      let response;
      
      switch (action) {
        case 'play':
          response = await fetch(`/api/content/${contentId}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: 'scheduled', isPaused: false, isStopped: false })
          });
          break;
          
        case 'pause':
          response = await fetch(`/api/content/${contentId}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ isPaused: true })
          });
          break;
          
        case 'stop':
          response = await fetch(`/api/content/${contentId}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ isStopped: true, status: 'draft' })
          });
          break;
          
        case 'edit':
          response = await fetch(`/api/content/${contentId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
          });
          break;
          
        case 'regenerate':
          response = await fetch(`/api/content/${contentId}/regenerate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
          });
          break;
          
        case 'delete':
          response = await fetch(`/api/content/${contentId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          break;
          
        default:
          throw new Error('Unknown action');
      }
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `Content ${action}ed successfully`,
        });
        refetchContent(); // Refresh content data
      } else {
        throw new Error('Failed to perform action');
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

  // Handle content regeneration
  const handleRegenerateContent = async () => {
    if (!projectId) return;

    setIsRegenerating(true);
    try {
      const response = await fetch(`/api/ai-projects/${projectId}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          regenerateType: 'both'
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Content regenerated with AI",
        });
        refetchProject(); // Refresh project data
        refetchContent(); // Refresh content data
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
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle project extension
  const handleExtendProject = async () => {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/ai-projects/${projectId}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          additionalDays: 7 // Extend by 7 days
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Project extended with new content",
        });
        refetchProject();
        refetchContent();
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

  // Get platform icon
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

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Draft', color: 'bg-gray-100' },
      active: { variant: 'default' as const, label: 'Active', color: 'bg-green-100' },
      paused: { variant: 'outline' as const, label: 'Paused', color: 'bg-yellow-100' },
      completed: { variant: 'secondary' as const, label: 'Completed', color: 'bg-blue-100' },
      stopped: { variant: 'destructive' as const, label: 'Stopped', color: 'bg-red-100' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <Badge variant={config.variant} className={`${config.color} text-gray-800 border-0`}>
        {config.label}
      </Badge>
    );
  };

  // Calculate project stats
  const stats = {
    totalContent: content.length,
    scheduledContent: content.filter((c: any) => c.status === 'scheduled').length,
    publishedContent: content.filter((c: any) => c.status === 'published').length,
    averageEngagement: content.length > 0
      ? Math.round(content.reduce((acc: number, item: any) =>
          acc + (item.metadata?.engagementPrediction?.average || 0), 0) / content.length)
      : 0,
    platforms: [...new Set(content.map((c: any) => c.platform))],
    contentTypes: [...new Set(content.map((c: any) => c.contentType))]
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="max-w-6xl mx-auto space-y-6">
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error ? 'Failed to load project details' : 'The requested project could not be found'}
          </p>
          <Button onClick={() => setLocation('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
              <p className="text-gray-600">{project.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {getStatusBadge(project.status)}

            {project.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleProjectAction('pause')}
                className="flex items-center gap-2"
              >
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            )}

            {project.status === 'paused' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleProjectAction('start')}
                className="flex items-center gap-2"
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
                className="flex items-center gap-2"
              >
                <StopCircle className="h-4 w-4" />
                Stop
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateContent}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate Content
            </Button>
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Content</p>
                  <p className="text-3xl font-bold">{stats.totalContent}</p>
                </div>
                <Target className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Published</p>
                  <p className="text-3xl font-bold">{stats.publishedContent}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Avg Engagement</p>
                  <p className="text-3xl font-bold">{stats.averageEngagement}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Platforms</p>
                  <p className="text-3xl font-bold">{stats.platforms.length}</p>
                </div>
                <Eye className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="content">Content ({content.length})</TabsTrigger>
              <TabsTrigger value="calendar">Calendar ({content.length})</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Project Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Project Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Project Type</Label>
                      <p className="text-gray-600 capitalize">{project.projectType}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Content Title</Label>
                      <p className="text-gray-600">{project.contentTitle || 'Not specified'}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Channel Type</Label>
                      <p className="text-gray-600">{project.channelType || 'Multiple platforms'}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Duration</Label>
                      <p className="text-gray-600">{project.duration} days</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Content Frequency</Label>
                      <p className="text-gray-600 capitalize">{project.contentFrequency}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Target Platforms</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {project.targetChannels?.map((channel: string) => (
                          <Badge key={channel} variant="outline" className="flex items-center gap-1">
                            <span>{getPlatformIcon(channel)}</span>
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Content Goals</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {project.contentGoals?.map((goal: string) => (
                          <Badge key={goal} variant="secondary" className="text-xs">
                            {goal}
                          </Badge>
                        )) || <span className="text-gray-500 text-sm">No goals specified</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Brain className="h-8 w-8 text-blue-600" />
                        <div>
                          <h4 className="font-semibold text-gray-900">AI-Powered Content</h4>
                          <p className="text-sm text-gray-600">
                            {content.length} pieces of optimized content generated automatically
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Content Quality Score</span>
                        <span className="font-medium">
                          {content.length > 0
                            ? Math.round(content.reduce((acc: number, item: any) =>
                                acc + (item.metadata?.confidence || 0), 0) / content.length)
                            : 0}%
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Platform Optimization</span>
                        <span className="font-medium">{stats.platforms.length} platforms</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Content Types</span>
                        <span className="font-medium">{stats.contentTypes.length} types</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {project.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Project Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{project.description}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              {content.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Yet</h3>
                    <p className="text-gray-500 mb-6">
                      AI will generate content based on your project strategy
                    </p>
                    <Button onClick={handleRegenerateContent} className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Generate Content
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Day Navigation */}
                  <div className="flex flex-wrap gap-2">
                    {days.map((day) => (
                      <Button
                        key={day}
                        variant={selectedDay === day ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                        className="flex items-center gap-2"
                      >
                        Day {day}
                        {contentByDay[day] && (
                          <Badge variant="secondary" className="ml-1">
                            {contentByDay[day].length}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>

                  {/* Content Display */}
                  {selectedDay ? (
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold">Day {selectedDay} Content</h3>
                      {contentByDay[selectedDay]?.length > 0 ? (
                        <div className="grid gap-4">
                          {contentByDay[selectedDay].map((item: any) => (
                            <Card key={item.id} className="hover:shadow-md transition-shadow">
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="text-2xl">{getPlatformIcon(item.platform)}</span>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <CardTitle className="text-lg">{item.title}</CardTitle>
                                        <Badge variant="outline" className="bg-purple-50 border-purple-200">
                                          <Sparkles className="h-3 w-3 mr-1 text-purple-600" />
                                          AI Generated
                                        </Badge>
                                      </div>
                                      <CardDescription className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        {item.scheduledAt ? new Date(item.scheduledAt).toLocaleDateString() : 'Not scheduled'}
                                      </CardDescription>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getStatusBadge(item.status)}
                                    <Badge variant="outline">{item.contentType}</Badge>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <p className="text-gray-700 mb-4">{item.description}</p>

                                {item.tags && item.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-4">
                                    {item.tags.slice(0, 8).map((tag: string) => (
                                      <Badge key={tag} variant="secondary" className="text-xs">
                                        #{tag}
                                      </Badge>
                                    ))}
                                    {item.tags.length > 8 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{item.tags.length - 8} more
                                      </Badge>
                                    )}
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-blue-600" />
                                    <div>
                                      <div className="text-xs text-gray-600">Engagement Prediction</div>
                                      <div className="text-sm font-medium">
                                        {item.metadata?.engagementPrediction?.average || 0}%
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-green-600" />
                                    <div>
                                      <div className="text-xs text-gray-600">Best Posting Time</div>
                                      <div className="text-sm font-medium">
                                        {item.metadata?.optimalPostingTime || 'N/A'}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleContentAction(item.id, 'edit', {
                                      title: item.title,
                                      description: item.description,
                                      script: item.script,
                                      tags: item.tags
                                    })}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleContentAction(item.id, 'regenerate')}
                                  >
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    Regenerate
                                  </Button>
                                  {item.status !== 'published' && (
                                    <>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleContentAction(item.id, 'play')}
                                        disabled={item.isPaused || item.isStopped}
                                      >
                                        <Play className="h-4 w-4 mr-1" />
                                        Play
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleContentAction(item.id, 'pause')}
                                        disabled={item.isPaused || item.isStopped}
                                      >
                                        <Pause className="h-4 w-4 mr-1" />
                                        Pause
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleContentAction(item.id, 'stop')}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <StopCircle className="h-4 w-4 mr-1" />
                                        Stop
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleContentAction(item.id, 'delete')}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        Delete
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card className="text-center py-8">
                          <CardContent>
                            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Content for Day {selectedDay}</h3>
                            <p className="text-gray-500">This day doesn't have any scheduled content yet</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Day</h3>
                      <p className="text-gray-500">Choose a day above to view its content</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6">
              <SocialMediaCalendarView
                projectId={parseInt(projectId!)}
                content={content}
                calendar={[]}
                onContentAction={handleContentAction}
                onExtendProject={handleExtendProject}
                onRegenerateContent={handleRegenerateContent}
                isLoading={isRegenerating}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Content</span>
                      <span className="font-medium">{stats.totalContent}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Scheduled</span>
                      <span className="font-medium">{stats.scheduledContent}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Published</span>
                      <span className="font-medium">{stats.publishedContent}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Draft</span>
                      <span className="font-medium">{content.filter((c: any) => c.status === 'draft').length}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Platform Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(
                      content.reduce((acc: any, item: any) => {
                        acc[item.platform] = (acc[item.platform] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([platform, count]) => (
                      <div key={platform} className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <span>{getPlatformIcon(platform)}</span>
                          {platform}
                        </span>
                        <Badge variant="secondary">{String(count)}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
