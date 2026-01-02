import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  BarChart3,
  Calendar,
  Settings,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
  Eye,
  Heart,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// Import our components
import ProjectManager from '@/components/social-media/ProjectManager';
import CalendarView from '@/components/social-media/CalendarView';
import SocialMediaAnalytics from '@/components/analytics/SocialMediaAnalytics';
import AIContentCard from '@/components/social-media/AIContentCard';
import SocialAccountsManager from '@/components/social-media/SocialAccountsManager';
import AIAssistant from '@/components/social-media/AIAssistant';
import EnhancedProjectCreationFlow from '@/components/social-media/EnhancedProjectCreationFlow';
import SocialMediaDashboardView from '@/components/social-media/SocialMediaDashboardView';
import Recorder from '@/pages/recorder';

// Import API services
import { socialPostApi, socialAccountApi, projectApi, Project } from '@/lib/socialMediaApi';

// Using types from socialMediaApi

export default function SocialMediaDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Check for project-specific view parameters
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectName, setProjectName] = useState<string>('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectIdParam = urlParams.get('projectId');
    const projectNameParam = urlParams.get('projectName');

    if (projectIdParam) {
      setProjectId(parseInt(projectIdParam));
      setProjectName(projectNameParam ? decodeURIComponent(projectNameParam) : 'Project');
    }
  }, []);

  // Fetch all content (including generated content) using React Query
  const { data: contents = [], isLoading: contentsLoading } = useQuery({
    queryKey: ['all-content'],
    queryFn: async () => {
      try {
        // Try to fetch from the new content API first
        const token = localStorage.getItem('token');
        const response = await fetch('/api/content', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const content = data.content || [];
          // Filter out any content that doesn't have valid IDs or is corrupted
          return content.filter((item: any) => 
            item && 
            item.id && 
            typeof item.id === 'number' && 
            item.id > 0 &&
            item.title
          );
        }
        
        // Fallback to social posts API
        const socialPosts = await socialPostApi.getSocialPosts();
        return socialPosts.filter((item: any) => 
          item && 
          item.id && 
          typeof item.id === 'number' && 
          item.id > 0 &&
          item.title
        );
      } catch (error) {
        console.error('Error fetching content:', error);
        // Fallback to social posts API
        try {
          const socialPosts = await socialPostApi.getSocialPosts();
          return socialPosts.filter((item: any) => 
            item && 
            item.id && 
            typeof item.id === 'number' && 
            item.id > 0 &&
            item.title
          );
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          return [];
        }
      }
    },
  });

  // Fetch social accounts for metrics
  const { data: socialAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: () => socialAccountApi.getSocialAccounts(),
  });

  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['social-analytics'],
    queryFn: () => socialPostApi.getSocialMediaAnalytics('30d'),
  });

  // Fetch projects data
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectApi.getProjects(),
  });

  const isLoading = contentsLoading || accountsLoading || analyticsLoading || projectsLoading;

  // If we're in project-specific view, render the project dashboard
  if (projectId) {
    return (
      <SocialMediaDashboardView
        projectId={projectId}
        projectName={projectName}
        onBack={() => setLocation('/dashboard')}
      />
    );
  }

  // Handle content operations (keeping for compatibility with existing components)
  const handleContentUpdate = (_contentId: string, _updates: any) => {
    // Invalidate queries to refetch data
    // This will be handled by React Query mutations in real implementation
  };

  const handleContentDelete = (_contentId: string) => {
    // This will be handled by React Query mutations in real implementation
  };

  const handleContentCreate = (_newContent: any) => {
    // This will be handled by React Query mutations in real implementation
  };

  const handleBatchOperation = (_operation: string, _contentIds: string[]) => {
    // This will be handled by React Query mutations in real implementation
  };

  // Handle project operations
  const handleProjectUpdate = (project: Project) => {
    // Invalidate queries to refetch data
    // This will be handled by React Query mutations in real implementation
    console.log('Updating project:', project);
  };

  const handleProjectDelete = (projectId: string) => {
    // This will be handled by React Query mutations in real implementation
    console.log('Deleting project:', projectId);
  };


  // Calculate dashboard metrics from real data
  const dashboardMetrics = {
    totalProjects: projects.length,
    activeProjects: projects.filter((p: any) => p.status === 'active').length,
    totalContent: contents.length,
    scheduledContent: contents.filter((c: any) => c.status === 'scheduled').length,
    publishedContent: contents.filter((c: any) => c.status === 'published').length,
    totalEngagement: analytics?.totalEngagement || 0,
    aiGeneratedContent: contents.filter((c: any) => c.aiGenerated).length,
    connectedAccounts: socialAccounts.length
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              CreatorNexus AI
            </h1>
            <p className="text-gray-600">AI-Powered Social Media Management</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button 
              onClick={() => setShowCreateProject(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-gradient-to-br from-gray-500 to-gray-600 text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="h-4 bg-gray-400 rounded animate-pulse w-24"></div>
                    <div className="h-4 w-4 bg-gray-400 rounded animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-400 rounded animate-pulse w-16 mb-2"></div>
                    <div className="h-3 bg-gray-400 rounded animate-pulse w-32"></div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Connected Accounts</CardTitle>
                  <Users className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardMetrics.connectedAccounts}</div>
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
                  <div className="text-2xl font-bold">{dashboardMetrics.publishedContent}</div>
                  <p className="text-xs opacity-90">
                    {dashboardMetrics.scheduledContent} scheduled
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Generated</CardTitle>
                  <Sparkles className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardMetrics.aiGeneratedContent}</div>
                  <p className="text-xs opacity-90">
                    of {dashboardMetrics.totalContent} total posts
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
                  <Heart className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardMetrics.totalEngagement.toLocaleString()}</div>
                  <p className="text-xs opacity-90">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    {analytics?.averageEngagement ? `${analytics.averageEngagement.toFixed(1)} avg` : 'Loading...'}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-8 flex-shrink-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="recorder">Recorder</TabsTrigger>
            <TabsTrigger value="ai">AI Assistant</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 overflow-y-auto space-y-6">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contents.slice(0, 5).map((content: any, index: number) => (
                      <motion.div
                        key={content.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {content.contentType.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{content.title}</h4>
                          <p className="text-xs text-gray-500">
                            {content.status === 'published' ? 'Published' : 'Scheduled for'} {
                              content.scheduledAt ? new Date(content.scheduledAt).toLocaleDateString() : 'TBD'
                            }
                          </p>
                        </div>
                        <Badge variant={content.status === 'published' ? 'default' : 'secondary'}>
                          {content.status === 'draft' ? 'scheduled' : content.status}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
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
            </motion.div>
          </TabsContent>

          <TabsContent value="projects" className="flex-1 overflow-y-auto">
            <ProjectManager
              projects={projects}
              onProjectUpdate={handleProjectUpdate}
              onProjectDelete={handleProjectDelete}
            />
          </TabsContent>

          <TabsContent value="accounts" className="flex-1 overflow-y-auto">
            <SocialAccountsManager />
          </TabsContent>

          <TabsContent value="calendar" className="flex-1 overflow-y-auto">
            <CalendarView
              contents={contents}
              onContentUpdate={handleContentUpdate}
              onContentDelete={handleContentDelete}
              onContentCreate={handleContentCreate}
              onBatchOperation={handleBatchOperation}
            />
          </TabsContent>

          <TabsContent value="analytics" className="flex-1 overflow-y-auto">
            <SocialMediaAnalytics />
          </TabsContent>

          <TabsContent value="content" className="flex-1 overflow-y-auto space-y-6">
            {/* Content Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-4"
            >
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            {/* Content Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {contents
                  .filter((content: any) =>
                    filterStatus === 'all' || content.status === filterStatus
                  )
                  .filter((content: any) =>
                    !searchQuery ||
                    content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (content.caption && content.caption.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    content.hashtags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
                  )
                  .map((content: any) => {
                    // Additional validation before rendering
                    if (!content || !content.id || typeof content.id !== 'number' || content.id <= 0) {
                      console.warn('Skipping invalid content:', content);
                      return null;
                    }
                    
                    return (
                      <AIContentCard
                        key={content.id}
                        content={content}
                        onEdit={(_id: number, updates: Partial<any>) => handleContentUpdate(_id.toString(), updates)}
                        onDelete={(_id: number) => handleContentDelete(_id.toString())}
                        onPublishNow={async (_id: number) => {
                          handleContentUpdate(_id.toString(), { status: 'published', publishedAt: new Date().toISOString() });
                          toast({
                            title: "Content Published",
                            description: "Content has been published successfully",
                          });
                        }}
                      />
                    );
                  })}
              </AnimatePresence>
            </motion.div>

            {contents.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="text-gray-500 text-lg mb-4">No content found</div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Content
                </Button>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="recorder" className="flex-1 overflow-y-auto">
            <Recorder />
          </TabsContent>

          <TabsContent value="ai" className="flex-1 overflow-y-auto">
            <AIAssistant />
          </TabsContent>
        </Tabs>
        </div>
      </div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {showCreateProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto scroll-smooth">
                <EnhancedProjectCreationFlow
                  onProjectCreate={async (project) => {
                    try {
                      setShowCreateProject(false);
                      
                      // Show loading toast
                      toast({
                        title: "Creating Project...",
                        description: "Saving project and generating content...",
                      });

                      // Transform project data for API
                      const projectData = {
                        name: project.projectName || project.name || 'Untitled Project',
                        description: project.projectDescription || project.description || '',
                        type: Array.isArray(project.contentType) ? project.contentType.join(', ') : (project.contentType || project.type || 'social-media'),
                        platform: Array.isArray(project.channelType) ? project.channelType.join(', ') : (project.channelType || project.platform || 'instagram'),
                        targetAudience: project.targetAudience || '',
                        estimatedDuration: project.duration || project.estimatedDuration || '1week',
                        tags: project.tags || [],
                        isPublic: project.isPublic || false,
                        metadata: {
                          contentType: Array.isArray(project.contentType) ? project.contentType : [project.contentType || 'post'],
                          channelType: Array.isArray(project.channelType) ? project.channelType : [project.channelType || 'instagram'],
                          contentFrequency: project.contentFrequency || 'daily',
                          aiEnhancement: true,
                          createdAt: new Date().toISOString()
                        }
                      };

                      // Calculate total days from start and end dates
                      const startDate = new Date(project.customStartDate || new Date());
                      const endDate = new Date(project.customEndDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
                      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                      const contentSettings = {
                        totalDays: totalDays,
                        contentPerDay: 1, // Default to 1 content per day
                        platforms: Array.isArray(project.channelType) ? project.channelType : (project.channelType ? [project.channelType] : ['instagram']),
                        contentType: Array.isArray(project.contentType) ? (project.contentType[0] || 'post') : (project.contentType || 'post'),
                        startDate: project.customStartDate || new Date().toISOString()
                      };

                      // Call the API to create project with content generation
                      const token = localStorage.getItem('token');
                      const response = await fetch('/api/projects/create-with-content', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                          ...projectData,
                          contentSettings
                        })
                      });

                      if (!response.ok) {
                        const errorData = await response.json();
                        console.error('API Error Response:', errorData);
                        console.error('Request data that failed:', { projectData, contentSettings });
                        throw new Error(errorData.message || `Failed to create project: ${response.status} ${response.statusText}`);
                      }

                      const result = await response.json();
                      
                      // Show success message
                      toast({
                        title: "Project Created Successfully!",
                        description: `"${project.projectName}" has been created with ${result.contentItems?.length || 0} generated content items.`,
                      });

                      // Refresh the page to show the new project
                      window.location.reload();

                    } catch (error) {
                      console.error('Error creating project:', error);
                      toast({
                        title: "Project Creation Failed",
                        description: error instanceof Error ? error.message : "Failed to create project. Please try again.",
                        variant: "destructive"
                      });
                      setShowCreateProject(true); // Reopen the modal on error
                    }
                  }}
                  onCancel={() => setShowCreateProject(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
