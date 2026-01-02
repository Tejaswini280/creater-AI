import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Eye, Calendar, Target, Zap, Sparkles, CheckCircle } from 'lucide-react';
import EnhancedProjectDetailsModal from '@/components/modals/EnhancedProjectDetailsModal';
import SimpleCreateProjectForm from '@/components/social-media/SimpleCreateProjectForm';

// Mock project data
const mockProjects = [
  {
    id: 1,
    name: "Fitness Journey 2025",
    description: "Fitness content series",
    type: "fitness",
    status: "active",
    createdAt: "2025-09-18T00:00:00Z",
    updatedAt: "2025-09-18T00:00:00Z"
  },
  {
    id: 2,
    name: "Business Tips Daily",
    description: "Daily business insights and tips",
    type: "business",
    status: "active",
    createdAt: "2025-09-17T00:00:00Z",
    updatedAt: "2025-09-17T00:00:00Z"
  }
];

// Mock content data
const mockContent = [
  {
    id: 1,
    title: "Morning Workout Motivation",
    description: "Start your day with energy and motivation",
    content: "Good morning! 💪 Ready to crush your fitness goals today? Remember, every workout counts towards your journey to a healthier, stronger you. Let's make today amazing! #FitnessJourney #MorningMotivation #WorkoutWednesday",
    platform: "instagram",
    contentType: "post",
    status: "published",
    dayNumber: 1,
    isPaused: false,
    isStopped: false,
    canPublish: true,
    publishOrder: 1,
    contentVersion: 1,
    hashtags: ["FitnessJourney", "MorningMotivation", "WorkoutWednesday"],
    publishedAt: "2025-09-18T08:00:00Z",
    createdAt: "2025-09-18T00:00:00Z",
    updatedAt: "2025-09-18T08:00:00Z",
    projectId: 1,
    userId: "user123",
    aiGenerated: true
  },
  {
    id: 2,
    title: "Healthy Breakfast Ideas",
    description: "Nutritious breakfast recipes for fitness enthusiasts",
    content: "Fuel your body right! 🥗 Here are 5 quick and healthy breakfast ideas that will keep you energized throughout your workout. Protein-packed and delicious! #HealthyEating #FitnessNutrition #BreakfastIdeas",
    platform: "instagram",
    contentType: "post",
    status: "draft",
    dayNumber: 2,
    isPaused: false,
    isStopped: false,
    canPublish: true,
    publishOrder: 1,
    contentVersion: 1,
    hashtags: ["HealthyEating", "FitnessNutrition", "BreakfastIdeas"],
    createdAt: "2025-09-18T00:00:00Z",
    updatedAt: "2025-09-18T00:00:00Z",
    projectId: 1,
    userId: "user123",
    aiGenerated: true
  },
  {
    id: 3,
    title: "Business Growth Strategy",
    description: "Essential strategies for business growth",
    content: "Growing your business requires a clear strategy! 📈 Today we're focusing on customer acquisition and retention. Remember, it's not just about getting new customers, but keeping them happy! #BusinessGrowth #Strategy #Entrepreneur",
    platform: "linkedin",
    contentType: "post",
    status: "scheduled",
    dayNumber: 1,
    isPaused: false,
    isStopped: false,
    canPublish: true,
    publishOrder: 1,
    contentVersion: 1,
    hashtags: ["BusinessGrowth", "Strategy", "Entrepreneur"],
    scheduledAt: "2025-09-19T09:00:00Z",
    createdAt: "2025-09-17T00:00:00Z",
    updatedAt: "2025-09-17T00:00:00Z",
    projectId: 2,
    userId: "user123",
    aiGenerated: true
  }
];

export default function ProjectContentIntegrationDemo() {
  const [projects, setProjects] = useState(mockProjects);
  const [content, setContent] = useState(mockContent);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock API responses
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (url: string, options?: RequestInit) => {
      // Mock project creation with content
      if (url.includes('/api/projects/create-with-content')) {
        const requestData = JSON.parse(options?.body as string);
        const newProject = {
          id: Date.now(),
          name: requestData.name,
          description: requestData.description,
          type: requestData.type,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Generate mock content
        const generatedContent = Array.from({ length: requestData.contentSettings.totalDays }, (_, index) => ({
          id: Date.now() + index + 1,
          title: `${requestData.name} - Day ${index + 1}`,
          description: `Content for day ${index + 1} of ${requestData.name}`,
          content: `This is generated content for day ${index + 1}. ${requestData.description}`,
          platform: requestData.contentSettings.platforms[0],
          contentType: requestData.contentSettings.contentType,
          status: 'draft',
          dayNumber: index + 1,
          isPaused: false,
          isStopped: false,
          canPublish: true,
          publishOrder: 1,
          contentVersion: 1,
          hashtags: [`${requestData.type}`, `Day${index + 1}`, 'Generated'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          projectId: newProject.id,
          userId: 'user123',
          aiGenerated: true
        }));

        return new Response(JSON.stringify({
          success: true,
          data: {
            project: newProject,
            content: generatedContent,
            metadata: {
              totalContent: generatedContent.length,
              projectId: newProject.id,
              generatedAt: new Date().toISOString()
            }
          }
        }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Mock project content fetch
      if (url.includes('/api/projects/') && url.includes('/content')) {
        const projectId = parseInt(url.match(/\/api\/projects\/(\d+)\/content/)?.[1] || '0');
        const projectContent = content.filter(c => c.projectId === projectId);
        
        return new Response(JSON.stringify({
          success: true,
          data: {
            content: projectContent,
            total: projectContent.length,
            projectId
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Mock content fetch
      if (url.includes('/api/content')) {
        return new Response(JSON.stringify({
          success: true,
          content: content
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return originalFetch(url, options);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [content]);

  const handleProjectCreate = (newProject: any) => {
    setProjects(prev => [...prev, newProject]);
    if (newProject.generatedContent) {
      setContent(prev => [...prev, ...newProject.generatedContent]);
    }
    setShowCreateProject(false);
  };

  const handleViewDetails = (project: any) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'draft': return <Calendar className="h-4 w-4 text-gray-500" />;
      case 'scheduled': return <Calendar className="h-4 w-4 text-blue-500" />;
      default: return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Project Content Integration Demo
          </h1>
          <p className="text-gray-600">
            This demo shows the complete integration between project creation, content generation, and content display.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="content">Recent Content</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Total Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{projects.length}</div>
                  <p className="text-sm text-gray-500">Active projects</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Total Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{content.length}</div>
                  <p className="text-sm text-gray-500">Generated pieces</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI Generated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {content.filter(c => c.aiGenerated).length}
                  </div>
                  <p className="text-sm text-gray-500">AI-created content</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button onClick={() => setShowCreateProject(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Project
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('projects')}>
                    <Target className="h-4 w-4 mr-2" />
                    View All Projects
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('content')}>
                    <Zap className="h-4 w-4 mr-2" />
                    View All Content
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Projects</h2>
              <Button onClick={() => setShowCreateProject(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const projectContent = content.filter(c => c.projectId === project.id);
                const publishedContent = projectContent.filter(c => c.status === 'published').length;
                
                return (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {project.description}
                          </CardDescription>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {project.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Content Generated</span>
                          <span className="font-medium">{projectContent.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Published</span>
                          <span className="font-medium">{publishedContent}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Type</span>
                          <Badge variant="outline">{project.type}</Badge>
                        </div>
                        <Button
                          onClick={() => handleViewDetails(project)}
                          className="w-full"
                          variant="outline"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Recent Content</h2>
              <div className="text-sm text-gray-500">
                Showing {content.length} pieces of content
              </div>
            </div>

            <div className="space-y-4">
              {content.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(item.status)}
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                          {item.aiGenerated && (
                            <Badge variant="outline" className="text-purple-600 border-purple-300">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI Generated
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                        <p className="text-gray-600 mb-3">{item.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            {item.platform}
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="h-4 w-4" />
                            {item.contentType}
                          </span>
                          <span>Day {item.dayNumber}</span>
                        </div>
                        {item.hashtags && item.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.hashtags.map((tag, index) => (
                              <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Project Modal */}
        {showCreateProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <SimpleCreateProjectForm
                onProjectCreate={handleProjectCreate}
                onCancel={() => setShowCreateProject(false)}
              />
            </div>
          </div>
        )}

        {/* Project Details Modal */}
        {selectedProject && (
          <EnhancedProjectDetailsModal
            isOpen={showProjectDetails}
            onClose={() => setShowProjectDetails(false)}
            project={selectedProject}
            onProjectUpdate={(projectId, updates) => {
              setProjects(prev => prev.map(p => 
                p.id === projectId ? { ...p, ...updates } : p
              ));
            }}
          />
        )}
      </div>
    </div>
  );
}
