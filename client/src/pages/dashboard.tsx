import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAsyncOperation } from "@/hooks/useAsyncOperation";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import Sidebar from "@/components/dashboard/Sidebar";
import MetricsCards from "@/components/dashboard/MetricsCards";
import RecentContent from "@/components/dashboard/RecentContent";
import AIAssistant from "@/components/dashboard/AIAssistant";
import AnalyticsChart from "@/components/dashboard/AnalyticsChart";
import UpcomingSchedule from "@/components/dashboard/UpcomingSchedule";
import QuickActions from "@/components/dashboard/QuickActions";
import NotificationDropdown from "@/components/modals/NotificationDropdown";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import QuickProjectCreationModal from "@/components/modals/QuickProjectCreationModal";

// Social Media Dashboard Components (imported when needed)
import { Plus, Menu, Circle, FolderOpen, Clock, Tag, Folder, Calendar, Hash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Component, ErrorInfo, ReactNode } from "react";

// Simple ErrorBoundary for dashboard components
class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dashboard component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong with this component.</div>;
    }
    return this.props.children;
  }
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const isMobile = useIsMobile();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); // Add initialization flag
  const [isQuickProjectModalOpen, setIsQuickProjectModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    projectId: string | null;
    projectName: string;
  }>({
    isOpen: false,
    projectId: null,
    projectName: '',
  });
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Async operation for loading projects
  const { execute: executeLoadProjects, isLoading: isLoadingProjectsAsync } = useAsyncOperation(
    async () => {
      const response = await apiRequest('GET', '/api/projects');
      if (response.ok) {
        const result = await response.json();
        return result.projects || [];
      }
      throw new Error('Failed to load projects');
    },
    {
      onSuccess: (projects) => {
        if (projects && projects.length > 0) {
          setProjects(projects);
        }
      },
      errorMessage: 'Failed to load projects. Using sample data.',
    }
  );

  // Async operation for deleting projects
  const { execute: executeDeleteProject, isLoading: isDeletingProject } = useAsyncOperation(
    async (projectId: string) => {
      console.log('Attempting to delete project:', projectId);
      
      try {
        // Try API delete first
        const response = await apiRequest('DELETE', `/api/projects/${projectId}`);
        if (response.ok) {
          console.log('Project deleted via API:', projectId);
          return projectId;
        } else {
          console.warn('API delete failed, trying localStorage fallback');
        }
      } catch (apiError) {
        console.warn('API delete error, using localStorage fallback:', apiError);
      }
      
      // Fallback to localStorage
      try {
        const localProjects = JSON.parse(localStorage.getItem('localProjects') || '[]');
        const filteredProjects = localProjects.filter((p: any) => p.id !== projectId);
        localStorage.setItem('localProjects', JSON.stringify(filteredProjects));
        console.log('Project deleted from localStorage:', projectId);
        
        // Trigger refresh event
        window.dispatchEvent(new CustomEvent('refreshDashboardProjects'));
        
        return projectId;
      } catch (storageError) {
        console.error('localStorage delete failed:', storageError);
        throw new Error('Failed to delete project from both API and localStorage');
      }
    },
    {
      onSuccess: (deletedProjectId) => {
        console.log('Delete operation successful:', deletedProjectId);
        setProjects(prev => prev.filter(p => p.id !== deletedProjectId));
        setDeleteConfirmation({ isOpen: false, projectId: null, projectName: '' });
      },
      successMessage: 'Project deleted successfully',
      errorMessage: 'Failed to delete project. Please try again.',
    }
  );

  // Debounced project state update to prevent rapid re-renders
  const debouncedSetProjects = useDebouncedCallback((newProjects: any[]) => {
    setProjects(newProjects);
  }, 100);
  const debouncedNavigate = useDebouncedCallback((url: string) => {
    try {
      window.location.href = url;
    } catch (error) {
      console.error('Navigation error:', error);
      toast({
        title: "Navigation Error",
        description: "Failed to navigate. Please try again.",
        variant: "destructive",
      });
    }
  }, 300);

  // Load projects from API with error handling
  const loadProjects = useCallback(async () => {
    try {
      setIsLoadingProjects(true);
      
      // First try to load from localStorage (immediate)
      const localProjects = localStorage.getItem('localProjects');
      if (localProjects) {
        try {
          const parsedProjects = JSON.parse(localProjects);
          if (Array.isArray(parsedProjects) && parsedProjects.length > 0) {
            console.log('Loading projects from localStorage:', parsedProjects);
            setProjects(parsedProjects);
          }
        } catch (parseError) {
          console.error('Error parsing local projects:', parseError);
        }
      }
      
      // Then try to load from API (background)
      await executeLoadProjects();
    } catch (error) {
      // Error is already handled by useAsyncOperation
      console.error('Error loading projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  }, [executeLoadProjects]);

  // Load projects on component mount
  useEffect(() => {
    if (isAuthenticated && !isInitialized) {
      setIsInitialized(true); // Mark as initialized to prevent re-runs
      
      // Load from localStorage immediately (real projects from Project Wizard)
      const localProjects = localStorage.getItem('localProjects');
      if (localProjects) {
        try {
          const parsedProjects = JSON.parse(localProjects);
          if (Array.isArray(parsedProjects) && parsedProjects.length > 0) {
            console.log('Loading real projects from localStorage:', parsedProjects);
            setProjects(parsedProjects);
            return; // Don't load sample data or call API if we have real projects
          }
        } catch (parseError) {
          console.error('Error parsing local projects:', parseError);
        }
      }
      
      // Only show sample data if no real projects exist
      const sampleProjects = [
        {
          id: 'sample_1',
          name: "YouTube Channel Growth",
          description: "Content strategy for growing YouTube subscribers",
          type: "video",
          tags: ["youtube", "growth"],
          createdAt: new Date().toISOString(),
          isSample: true
        },
        {
          id: 'sample_2',
          name: "Instagram Marketing",
          description: "Social media campaign for brand awareness",
          type: "campaign", 
          tags: ["instagram", "marketing"],
          createdAt: new Date().toISOString(),
          isSample: true
        }
      ];
      
      setProjects(sampleProjects);
      localStorage.setItem('sampleProjects', JSON.stringify(sampleProjects));
    }
  }, [isAuthenticated, isInitialized]); // Add isInitialized to dependencies

  // Separate effect for API loading (only when needed)
  useEffect(() => {
    if (isAuthenticated && isInitialized) {
      // Only try API loading if we don't have real projects in localStorage
      const localProjects = localStorage.getItem('localProjects');
      if (!localProjects) {
        // Try to load from API in background
        executeLoadProjects().catch(error => {
          console.log('API load failed, using sample data:', error);
        });
      }
    }
  }, [isAuthenticated, isInitialized]); // Removed executeLoadProjects to prevent loops

  // Handle project deletion with confirmation
  const handleDeleteProject = useCallback((projectId: string, projectName: string) => {
    console.log('Delete button clicked for project:', { projectId, projectName });
    setDeleteConfirmation({
      isOpen: true,
      projectId,
      projectName,
    });
  }, []);

  const confirmDeleteProject = useCallback(async () => {
    if (deleteConfirmation.projectId) {
      try {
        await executeDeleteProject(deleteConfirmation.projectId);
        // Success is handled by useAsyncOperation onSuccess callback
      } catch (error) {
        console.error('Delete project failed:', error);
        // Error is handled by useAsyncOperation
      }
    }
  }, [deleteConfirmation.projectId, executeDeleteProject]);

  // Listen for project creation events to refresh the list
  useEffect(() => {
    const handleRefreshProjects = () => {
      console.log('Refreshing projects from event...');
      // Reload from localStorage when projects are updated
      const localProjects = localStorage.getItem('localProjects');
      if (localProjects) {
        try {
          const parsedProjects = JSON.parse(localProjects);
          if (Array.isArray(parsedProjects)) {
            setProjects(parsedProjects);
          }
        } catch (parseError) {
          console.error('Error parsing local projects on refresh:', parseError);
        }
      }
    };

    // Listen for custom events
    window.addEventListener('refreshDashboardProjects', handleRefreshProjects);
    
    // Also listen for storage changes (when projects are updated in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'localProjects') {
        console.log('Projects updated in localStorage, refreshing...');
        handleRefreshProjects();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('refreshDashboardProjects', handleRefreshProjects);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Empty dependency array to prevent re-renders

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    console.log('🔄 Dashboard: Auth is loading, showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🔄 Dashboard: Not authenticated, should redirect to login');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  console.log('✅ Dashboard: Authenticated, rendering dashboard');

  return (
    <div className="flex h-screen bg-gray-50" role="application">
      {/* Sidebar (desktop) */}
      {!isMobile && <Sidebar />}

      {/* Mobile Sidebar Drawer */}
      {isMobile && (
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetContent side="left" className="p-0 w-[18rem]">
            <Sidebar />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        onTouchStart={(e) => {
          if (!isMobile) return;
          const touch = e.touches[0];
          touchStartXRef.current = touch.clientX;
          touchStartYRef.current = touch.clientY;
        }}
        onTouchEnd={(e) => {
          if (!isMobile) return;
          const startX = touchStartXRef.current;
          const startY = touchStartYRef.current;
          touchStartXRef.current = null;
          touchStartYRef.current = null;
          if (startX == null || startY == null) return;
          const touch = e.changedTouches[0];
          const dx = touch.clientX - startX;
          const dy = Math.abs(touch.clientY - startY);
          const edgeSwipe = startX < 30; // from left edge
          const horizontalEnough = Math.abs(dx) > 60 && dy < 40;
          if (edgeSwipe && horizontalEnough && dx > 0) {
            setIsMobileSidebarOpen(true);
          }
          if (isMobileSidebarOpen && horizontalEnough && dx < -60) {
            setIsMobileSidebarOpen(false);
          }
        }}
      >
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4" role="banner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open navigation"
                  className="md:hidden"
                  onClick={() => setIsMobileSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-gray-600">Welcome back! Here's what's happening with your content.</p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Notification Bell */}
              <NotificationDropdown />
              
              {/* Quick Actions - Added Social Media Dashboard */}
              <div className="flex items-center space-x-3">
                {/* Social Media Dashboard Button */}
                <Button
                  variant="outline"
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 text-purple-700 hover:from-purple-100 hover:to-pink-100 active:scale-[0.98] touch-manipulation"
                  onClick={() => debouncedNavigate('/social-media')}
                  aria-label="Navigate to Social Media Dashboard"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Social Media</span>
                </Button>

                {/* Recorder Button */}
                <Button
                  variant="outline"
                  className="flex items-center space-x-2 bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400 active:scale-[0.98] touch-manipulation"
                  onClick={() => debouncedNavigate('/recorder')}
                  aria-label="Navigate to Recorder"
                >
                  <Circle className="h-4 w-4 text-red-500 fill-red-500" />
                  <span className="text-gray-700">Recorder</span>
                </Button>

                {/* New Project Button */}
                <Button
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98] touch-manipulation"
                  onClick={() => debouncedNavigate('/project-wizard')}
                  aria-label="Create New Project"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Project</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main id="main-content" className="flex-1 overflow-y-auto p-6" role="main">
          {/* Key Metrics Row */}
          <div className="mb-8">
            <ErrorBoundary fallback={<div className="text-center py-4 text-gray-500">Loading metrics...</div>}>
              <MetricsCards />
            </ErrorBoundary>
          </div>

          {/* Content Grid - Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
            {/* Recent Content - Full width on mobile/tablet, 2 cols on desktop */}
            <div className="lg:col-span-2">
              <ErrorBoundary fallback={<div className="p-4 bg-white rounded-lg shadow"><p className="text-gray-500">Recent content loading...</p></div>}>
                <RecentContent />
              </ErrorBoundary>
            </div>

            {/* AI Assistant - Full width on mobile/tablet, 1 col on desktop */}
            <div className="lg:col-span-1">
              <ErrorBoundary fallback={<div className="p-4 bg-white rounded-lg shadow"><p className="text-gray-500">AI Assistant loading...</p></div>}>
                <AIAssistant />
              </ErrorBoundary>
            </div>
          </div>

        {/* Local Projects Section */}
        {isLoadingProjects || isLoadingProjectsAsync ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="ml-2 text-gray-600">Loading projects...</span>
          </div>
        ) : projects.length > 0 ? (
          <div className="mb-8">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-blue-600" />
                  Your Projects ({projects.length})
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={loadProjects}
                  className="ml-auto"
                  disabled={isLoadingProjects || isLoadingProjectsAsync}
                  aria-label="Refresh projects list"
                >
                  <Loader2 className={`h-4 w-4 mr-2 ${isLoadingProjects || isLoadingProjectsAsync ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.slice(0, 6).map((project) => (
                    <div
                      key={project.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-white shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 truncate pr-2">
                          {project.name || 'Untitled Project'}
                        </h3>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {project.contentType || project.type || 'project'}
                        </Badge>
                      </div>
                      {project.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <Clock className="h-3 w-3" />
                        <span>
                          {project.createdAt 
                            ? new Date(project.createdAt).toLocaleDateString()
                            : 'Recently created'
                          }
                        </span>
                        {project.status && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{project.status}</span>
                          </>
                        )}
                      </div>
                      {/* Tags/Platforms */}
                      {((project.platforms && project.platforms.length > 0) || (project.tags && project.tags.length > 0)) && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {(project.platforms || project.tags || []).slice(0, 3).map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700"
                            >
                              <Tag className="h-2 w-2 mr-1" />
                              {tag}
                            </span>
                          ))}
                          {(project.platforms || project.tags || []).length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{(project.platforms || project.tags || []).length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs flex-1"
                          onClick={() => debouncedNavigate(`/project-details?id=${project.id}`)}
                          aria-label={`View details for ${project.name}`}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs flex-1"
                          onClick={() => {
                            // Navigate to social media dashboard with project context
                            const projectName = encodeURIComponent(project.name || 'Untitled Project');
                            debouncedNavigate(`/social-media?projectId=${project.id}&projectName=${projectName}`);
                          }}
                          aria-label={`Open project ${project.name}`}
                        >
                          Open Project
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleDeleteProject(project.id, project.name || 'Untitled Project')}
                          disabled={isDeletingProject}
                          aria-label={`Delete project ${project.name}`}
                        >
                          {isDeletingProject ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {projects.length > 6 && (
                  <div className="mt-4 text-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => debouncedNavigate('/projects')}
                      aria-label={`View all ${projects.length} projects`}
                    >
                      View All Projects ({projects.length})
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Yet</h3>
              <p className="text-gray-600 mb-4">You don't have any projects yet. Start by creating your first project!</p>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => debouncedNavigate('/project-wizard')}
                aria-label="Create your first project"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </div>
          </div>
        )}

          {/* Analytics and Schedule Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Analytics Chart */}
            <div>
              <AnalyticsChart />
            </div>

            {/* Upcoming Schedule */}
            <div>
              <UpcomingSchedule />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <QuickActions />
          </div>

          {/* Social Media Management Section */}
          <div className="mb-8">
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      AI Social Media Hub
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple-300 text-purple-600 hover:bg-purple-50"
                    onClick={() => debouncedNavigate('/social-media')}
                    aria-label="Open Social Media Dashboard"
                  >
                    Open Full Dashboard →
                  </Button>
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  Manage your social media projects with AI-powered content generation, scheduling, and analytics.
                </p>
              </CardHeader>
              <CardContent>
                {/* Social Media Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Projects</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {projects.filter(p => p.status === 'active').length}
                        </p>
                      </div>
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FolderOpen className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-pink-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">AI Content</p>
                        <p className="text-2xl font-bold text-pink-600">∞</p>
                      </div>
                      <div className="p-2 bg-pink-100 rounded-lg">
                        <Plus className="h-6 w-6 text-pink-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Platforms</p>
                        <p className="text-2xl font-bold text-blue-600">5</p>
                      </div>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Hash className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Analytics</p>
                        <p className="text-2xl font-bold text-green-600">24/7</p>
                      </div>
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Clock className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 border-purple-300 hover:bg-purple-50"
                    onClick={() => debouncedNavigate('/social-media')}
                    aria-label="Navigate to Content Calendar"
                  >
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-purple-600" />
                    </div>
                    <span className="font-medium">Content Calendar</span>
                    <span className="text-sm text-gray-500 text-center">AI-powered scheduling</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 border-pink-300 hover:bg-pink-50"
                    onClick={() => debouncedNavigate('/social-media')}
                    aria-label="Navigate to AI Content Generation"
                  >
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <Plus className="h-6 w-6 text-pink-600" />
                    </div>
                    <span className="font-medium">AI Content Generation</span>
                    <span className="text-sm text-gray-500 text-center">Create with AI assistance</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 border-blue-300 hover:bg-blue-50"
                    onClick={() => debouncedNavigate('/social-media')}
                    aria-label="Navigate to Project Manager"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FolderOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="font-medium">Project Manager</span>
                    <span className="text-sm text-gray-500 text-center">Manage campaigns</span>
                  </Button>
                </div>

                {/* Platform Status */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Platform Status
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500', status: 'connected' },
                      { name: 'Facebook', color: 'bg-blue-600', status: 'connected' },
                      { name: 'TikTok', color: 'bg-black', status: 'connected' },
                      { name: 'YouTube', color: 'bg-red-600', status: 'connected' },
                      { name: 'LinkedIn', color: 'bg-blue-700', status: 'connected' }
                    ].map((platform) => (
                      <div key={platform.name} className="text-center">
                        <div className={`w-12 h-12 ${platform.color} rounded-lg mx-auto mb-2 flex items-center justify-center`}>
                          <span className="text-white font-bold text-sm">
                            {platform.name.charAt(0)}
                          </span>
                        </div>
                        <p className="text-xs font-medium">{platform.name}</p>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          {platform.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test Components Section */}
          <div className="mb-8">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-green-600" />
                  Test Enhanced Components
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => debouncedNavigate('/project-wizard')}
                    aria-label="Navigate to Project Wizard"
                  >
                    <Folder className="h-8 w-8 text-green-600" />
                    <span className="font-medium">Project Wizard</span>
                    <span className="text-sm text-gray-500 text-center">Multi-step project creation flow</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => debouncedNavigate('/test-planner')}
                    aria-label="Navigate to Content Planner"
                  >
                    <Calendar className="h-8 w-8 text-blue-600" />
                    <span className="font-medium">Content Planner</span>
                    <span className="text-sm text-gray-500 text-center">Plan and schedule your content</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => debouncedNavigate('/test-hashtags')}
                    aria-label="Navigate to Hashtag Picker"
                  >
                    <Hash className="h-8 w-8 text-purple-600" />
                    <span className="font-medium">Hashtag Picker</span>
                    <span className="text-sm text-gray-500 text-center">Test hashtag suggestions</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, projectId: null, projectName: '' })}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        description={`Are you sure you want to delete "${deleteConfirmation.projectName}"? This action cannot be undone and will permanently remove all project data.`}
        confirmText="Delete Project"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeletingProject}
      />

      {/* Quick Project Creation Modal */}
      <QuickProjectCreationModal
        isOpen={isQuickProjectModalOpen}
        onClose={() => setIsQuickProjectModalOpen(false)}
      />
    </div>
  );
}
