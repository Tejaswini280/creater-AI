import { Switch, Route } from "wouter";
import { Suspense, lazy, Component, ErrorInfo, ReactNode, useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import CookieConsent from "@/components/ui/cookie-consent";
import HelpButton from "@/components/ui/help-button";
import { ThemeProvider } from "@/components/ui/theme-provider";

// Simple Error Boundary that doesn't show error pages to users
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
    console.error('Error caught by boundary:', error, errorInfo);
    // Log error but don't show error page to user
  }

  render() {
    if (this.state.hasError) {
      // Return fallback or just retry the children
      return this.props.fallback || this.props.children;
    }
    return this.props.children;
  }
}

// Route-based code splitting with error handling
const Landing = lazy(() => import("@/pages/landing").catch(() => ({ default: () => <div>Error loading Landing page</div> })));
const Login = lazy(() => import("@/pages/login").catch(() => ({ default: () => <div>Error loading Login page</div> })));
const Dashboard = lazy(() => import("@/pages/dashboard").catch(() => ({ default: () => <div>Error loading Dashboard page</div> })));
const ContentStudio = lazy(() => import("@/pages/content-studio").catch(() => ({ default: () => <div>Error loading Content Studio page</div> })));
const RecentContent = lazy(() => import("@/pages/recent-content").catch(() => ({ default: () => <div>Error loading Recent Content page</div> })));
const AIGenerator = lazy(() => import("@/pages/ai-generator").catch(() => ({ default: () => <div>Error loading AI Generator page</div> })));
const AIContentGenerator = lazy(() => import("@/pages/ai-content-generator").catch(() => ({ default: () => <div>Error loading AI Content Generator page</div> })));
const Analytics = lazy(() => import("@/pages/analytics").catch(() => ({ default: () => <div>Error loading Analytics page</div> })));
const Scheduler = lazy(() => import("@/pages/scheduler").catch(() => ({ default: () => <div>Error loading Scheduler page</div> })));
const EnhancedScheduler = lazy(() => import("@/pages/enhanced-scheduler").catch(() => ({ default: () => <div>Error loading Enhanced Scheduler page</div> })));
const Templates = lazy(() => import("@/pages/templates").catch(() => ({ default: () => <div>Error loading Templates page</div> })));
const LinkedIn = lazy(() => import("@/pages/linkedin").catch(() => ({ default: () => <div>Error loading LinkedIn page</div> })));
const YouTubePage = lazy(() => import("@/pages/youtube").catch(() => ({ default: () => <div>Error loading YouTube page</div> })));
const GeminiStudio = lazy(() => import("@/pages/gemini-studio").catch(() => ({ default: () => <div>Error loading Gemini Studio page</div> })));
const WebSocketTest = lazy(() => import("@/pages/websocket-test").catch(() => ({ default: () => <div>Error loading WebSocket Test page</div> })));
const NotFound = lazy(() => import("@/pages/not-found").catch(() => ({ default: () => <div>Error loading Not Found page</div> })));
const Notifications = lazy(() => import("@/pages/notifications").catch(() => ({ default: () => <div>Error loading Notifications page</div> })));
const Assets = lazy(() => import("@/pages/assets").catch(() => ({ default: () => <div>Error loading Assets page</div> })));
const Privacy = lazy(() => import("@/pages/privacy").catch(() => ({ default: () => <div>Error loading Privacy page</div> })));
const Terms = lazy(() => import("@/pages/terms").catch(() => ({ default: () => <div>Error loading Terms page</div> })));
const Docs = lazy(() => import("@/pages/docs").catch(() => ({ default: () => <div>Error loading Docs page</div> })));
const FAQ = lazy(() => import("@/pages/faq").catch(() => ({ default: () => <div>Error loading FAQ page</div> })));
const ApiDocs = lazy(() => import("@/pages/api-docs").catch(() => ({ default: () => <div>Error loading API Docs page</div> })));
const Tutorials = lazy(() => import("@/pages/tutorials").catch(() => ({ default: () => <div>Error loading Tutorials page</div> })));
const DevDocs = lazy(() => import("@/pages/developer-docs").catch(() => ({ default: () => <div>Error loading Developer Docs page</div> })));
const Troubleshooting = lazy(() => import("@/pages/troubleshooting").catch(() => ({ default: () => <div>Error loading Troubleshooting page</div> })));
const Recorder = lazy(() => import("@/pages/recorder").catch(() => ({ default: () => <div>Error loading Recorder page</div> })));
const NewProject = lazy(() => import("@/pages/new-project").catch(() => ({ default: () => <div>Error loading New Project page</div> })));
const NewProjectEnhanced = lazy(() => import("@/pages/new-project-enhanced").catch(() => ({ default: () => <div>Error loading Enhanced New Project page</div> })));
const TestPlanner = lazy(() => import("@/pages/test-planner").catch(() => ({ default: () => <div>Error loading Test Planner page</div> })));
const TestHashtags = lazy(() => import("@/pages/test-hashtags").catch(() => ({ default: () => <div>Error loading Test Hashtags page</div> })));
const Project = lazy(() => import("@/pages/project").catch(() => ({ default: () => <div>Error loading Project page</div> })));
const ContentWorkspace = lazy(() => import("@/pages/content-workspace").catch(() => ({ default: () => <div>Error loading Content Workspace page</div> })));
const SocialMediaDashboard = lazy(() => import("@/pages/SocialMediaDashboard").catch(() => ({ default: () => <div>Error loading Social Media Dashboard</div> })));
const TrendAnalysis = lazy(() => import("@/pages/trend-analysis").catch(() => ({ default: () => <div>Error loading Trend Analysis page</div> })));
const ProjectWizard = lazy(() => import("@/pages/project-wizard").catch(() => ({ default: () => <div>Error loading Project Wizard page</div> })));
const ProjectDetails = lazy(() => import("@/pages/project-details").catch(() => ({ default: () => <div>Error loading Project Details page</div> })));
const Projects = lazy(() => import("@/pages/projects").catch(() => ({ default: () => <div>Error loading Projects page</div> })));

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // ✅ CRITICAL FIX: Add maximum loading timeout to prevent infinite loading
  const [forceShowRoutes, setForceShowRoutes] = useState(false);
  
  useEffect(() => {
    // Force show routes after 2 seconds if still loading
    const forceTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ Forcing routes to show after timeout');
        setForceShowRoutes(true);
      }
    }, 2000);
    
    return () => clearTimeout(forceTimeout);
  }, [isLoading]);

  // Show routes if not loading OR if we've hit the force timeout
  const shouldShowRoutes = !isLoading || forceShowRoutes;

  return (
    <Switch>
      {!shouldShowRoutes ? (
        <div className="min-h-screen flex flex-col" role="document">
          <header role="banner" className="sr-only">Loading header</header>
          <main role="main" className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </main>
        </div>
      ) : (
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="min-h-screen flex flex-col" role="document">
                <header role="banner" className="sr-only">Loading header</header>
                <main role="main" className="flex flex-1 items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading page...</p>
                  </div>
                </main>
              </div>
            }
          >
            {/* Public routes - always accessible */}
            <Route path="/login" component={Login} />
            <Route path="/privacy" component={Privacy} />
            <Route path="/terms" component={Terms} />
            <Route path="/docs" component={Docs} />
            <Route path="/faq" component={FAQ} />
            <Route path="/api-docs" component={ApiDocs} />
            <Route path="/tutorials" component={Tutorials} />
            <Route path="/developer-docs" component={DevDocs} />
            <Route path="/troubleshooting" component={Troubleshooting} />

            {/* Conditional routes based on authentication */}
            {!isAuthenticated ? (
              <>
                <Route path="/" component={Landing} />
              </>
            ) : (
              <>
                <Route path="/" component={Dashboard} />
                <Route path="/content" component={ContentStudio} />
                <Route path="/content-studio" component={ContentStudio} />
                <Route path="/content/recent" component={RecentContent} />
                <Route path="/ai" component={AIGenerator} />
                <Route path="/ai-content-generator" component={AIContentGenerator} />
                <Route path="/analytics" component={Analytics} />
                <Route path="/scheduler" component={Scheduler} />
                <Route path="/enhanced-scheduler" component={EnhancedScheduler} />
                <Route path="/templates" component={Templates} />
                <Route path="/youtube" component={YouTubePage} />
                <Route path="/linkedin" component={LinkedIn} />
                {/* Dedicated guide routes mapped to the Docs page anchors for now */}
                <Route path="/docs/getting-started" component={Docs} />
                <Route path="/docs/scheduler" component={Docs} />
                <Route path="/docs/integrations" component={Docs} />
                <Route path="/docs/ai-generator" component={Docs} />
                <Route path="/gemini" component={GeminiStudio} />
                <Route path="/websocket-test" component={WebSocketTest} />
                <Route path="/notifications" component={Notifications} />
                <Route path="/assets" component={Assets} />
                {/* New routes for the two new dashboard options */}
                <Route path="/recorder" component={Recorder} />
                <Route path="/new-project" component={NewProject} />
                <Route path="/new-project-enhanced" component={NewProjectEnhanced} />
                <Route path="/test-planner" component={TestPlanner} />
                <Route path="/test-hashtags" component={TestHashtags} />
                <Route path="/project/:id" component={Project} />
                <Route path="/social-media" component={SocialMediaDashboard} />
                <Route path="/trend-analysis" component={TrendAnalysis} />
                <Route path="/project-wizard" component={ProjectWizard} />
                <Route path="/project-details" component={ProjectDetails} />
                <Route path="/projects" component={Projects} />

              </>
            )}
          </Suspense>
        </ErrorBoundary>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <CookieConsent />
          <Router />
          <HelpButton />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
