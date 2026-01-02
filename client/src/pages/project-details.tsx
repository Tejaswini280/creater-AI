import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Target,
  Users,
  Settings,
  BarChart3,
  FileText,
  Palette,
  Globe,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Play,
  Edit,
  Share,
  Download,
  Plus,
  TrendingUp,
  Zap,
  Brain,
  Lightbulb,
  CheckSquare,
  ArrowRight,
  Sparkles,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Activity
} from "lucide-react";
import { useLocation } from "wouter";
import { 
  formatDateInTimezone, 
  formatDateTimeInTimezone, 
  getTimezoneDisplayName, 
  getCurrentDateInTimezone,
  getRelativeTime,
  isToday as isDateToday,
  createTimezoneAwareDate
} from "@/utils/dateUtils";

interface ProjectData {
  id: string;
  name: string;
  description?: string;
  contentType?: string;
  category?: string;
  targetAudience?: string;
  goals?: string[];
  contentFormats?: string[];
  postingFrequency?: string;
  contentThemes?: string[];
  brandVoice?: string;
  contentLength?: string;
  platforms?: string[];
  aiTools?: string[];
  schedulingPreferences?: {
    autoSchedule: boolean;
    timeZone: string;
    preferredTimes: string[];
  };
  startDate?: string;
  duration?: string;
  budget?: string;
  teamMembers?: string[];
  status?: 'draft' | 'active' | 'paused' | 'completed';
  createdAt?: string;
  updatedAt?: string;
}

export default function ProjectDetails() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);

  // Get project ID from URL params or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id') || localStorage.getItem('currentProjectId');
    
    if (projectId) {
      loadProject(projectId);
    } else {
      // Try to get the latest created project
      const latestProject = localStorage.getItem('latestCreatedProject');
      if (latestProject) {
        try {
          const projectData = JSON.parse(latestProject);
          console.log('Loading latest created project:', projectData);
          // Transform wizard data to match expected structure
          const transformedProject = transformWizardData(projectData);
          setProject(transformedProject);
          setIsLoadingProject(false);
        } catch (error) {
          console.error('Error parsing latest project:', error);
          setLocation('/dashboard');
        }
      } else {
        setLocation('/dashboard');
      }
    }
  }, [setLocation]);

  // Transform wizard data to match project details structure
  const transformWizardData = (wizardData: any): ProjectData => {
    console.log('🔍 Transform Debug - Input data:', wizardData);
    
    // Check if this is already a properly formatted ProjectData object
    if (wizardData.id && wizardData.createdAt && wizardData.schedulingPreferences && !wizardData.basics) {
      // This is already a ProjectData object from localStorage, return as-is
      console.log('✅ Data is already in ProjectData format, using directly:', wizardData);
      return wizardData;
    }

    // This is wizard step data that needs transformation
    console.log('🔄 Transforming wizard step data:', wizardData);
    
    const transformedData = {
      id: wizardData.id || Date.now().toString(),
      name: wizardData.projectName || wizardData.name || wizardData.basics?.name || 'Untitled Project',
      description: wizardData.description || wizardData.projectDescription || wizardData.basics?.description || 'A comprehensive social media project designed to boost engagement and reach.',
      contentType: wizardData.contentType || wizardData.projectType || wizardData.basics?.contentType || 'Social Media Content',
      category: wizardData.category || wizardData.niche || wizardData.basics?.category || 'Digital Marketing',
      targetAudience: wizardData.targetAudience || wizardData.audience || wizardData.basics?.targetAudience || 'General audience interested in engaging content',
      goals: wizardData.goals || wizardData.objectives || wizardData.basics?.goals || ['Increase Engagement', 'Build Brand Awareness', 'Drive Traffic'],
      contentFormats: wizardData.contentFormats || wizardData.formats || wizardData.content?.contentFormats || ['Posts', 'Images', 'Stories', 'Videos'],
      postingFrequency: wizardData.postingFrequency || wizardData.frequency || wizardData.content?.postingFrequency || 'Daily',
      contentThemes: wizardData.contentThemes || wizardData.themes || wizardData.content?.contentThemes || ['Educational', 'Entertainment', 'Behind the Scenes'],
      brandVoice: wizardData.brandVoice || wizardData.tone || wizardData.content?.brandVoice || 'Professional & Friendly',
      contentLength: wizardData.contentLength || wizardData.content?.contentLength || 'Medium',
      platforms: wizardData.platforms || wizardData.socialPlatforms || wizardData.integrations?.platforms || ['Instagram', 'Facebook', 'LinkedIn'],
      aiTools: wizardData.aiTools || wizardData.integrations?.aiTools || ['Content Generator', 'Image Creator', 'Hashtag Optimizer'],
      schedulingPreferences: {
        autoSchedule: wizardData.autoSchedule !== undefined ? wizardData.autoSchedule : (wizardData.integrations?.schedulingPreferences?.autoSchedule !== undefined ? wizardData.integrations.schedulingPreferences.autoSchedule : true),
        timeZone: wizardData.timeZone || wizardData.integrations?.schedulingPreferences?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        preferredTimes: wizardData.preferredTimes || wizardData.integrations?.schedulingPreferences?.preferredTimes || ['09:00', '15:00', '18:00']
      },
      startDate: wizardData.startDate || wizardData.schedule?.startDate || wizardData.integrations?.schedulingPreferences?.startDate || getCurrentDateInTimezone(wizardData.timeZone || wizardData.integrations?.schedulingPreferences?.timeZone || 'UTC'),
      duration: wizardData.duration || wizardData.timeline || wizardData.schedule?.duration || '3 months',
      budget: wizardData.budget || wizardData.schedule?.budget || '$500-1000',
      teamMembers: wizardData.teamMembers || wizardData.schedule?.teamMembers || [],
      status: wizardData.status || 'draft',
      createdAt: wizardData.createdAt || new Date().toISOString(),
      updatedAt: wizardData.updatedAt || new Date().toISOString()
    };
    
    console.log('✅ Transformed data:', transformedData);
    console.log('📅 Start Date:', transformedData.startDate);
    console.log('🌍 Timezone:', transformedData.schedulingPreferences.timeZone);
    
    return transformedData;
  };

  const loadProject = async (projectId: string) => {
    try {
      setIsLoadingProject(true);
      
      // Try to load from API first
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const projectData = await response.json();
        console.log('Project loaded from API:', projectData);
        
        // Check if this is API response format with nested project data
        const actualProjectData = projectData.project || projectData;
        
        // If the API response has metadata with originalData, use that
        if (actualProjectData.metadata?.originalData) {
          console.log('Using originalData from API metadata:', actualProjectData.metadata.originalData);
          const transformedProject = transformWizardData(actualProjectData.metadata.originalData);
          setProject(transformedProject);
        } else {
          // Transform API response to match our format
          const transformedProject = transformWizardData(actualProjectData);
          setProject(transformedProject);
        }
      } else {
        // Fallback to localStorage
        const localProjects = JSON.parse(localStorage.getItem('localProjects') || '[]');
        const foundProject = localProjects.find((p: any) => p.id === projectId);
        
        if (foundProject) {
          console.log('Project loaded from localStorage:', foundProject);
          const transformedProject = transformWizardData(foundProject);
          setProject(transformedProject);
        } else {
          throw new Error('Project not found');
        }
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast({
        title: "Error",
        description: "Failed to load project details.",
        variant: "destructive",
      });
      setLocation('/dashboard');
    } finally {
      setIsLoadingProject(false);
    }
  };

  const handleStartProject = async () => {
    if (!project) return;

    try {
      // Update project status to active
      const updatedProject = { ...project, status: 'active' as const };
      
      // Save to localStorage
      const localProjects = JSON.parse(localStorage.getItem('localProjects') || '[]');
      const updatedProjects = localProjects.map((p: any) => 
        p.id === project.id ? updatedProject : p
      );
      localStorage.setItem('localProjects', JSON.stringify(updatedProjects));
      
      setProject(updatedProject);
      
      toast({
        title: "Project Started!",
        description: "Your project is now active and ready for content creation.",
      });
    } catch (error) {
      console.error('Error starting project:', error);
      toast({
        title: "Error",
        description: "Failed to start project.",
        variant: "destructive",
      });
    }
  };

  const handleEditProject = () => {
    if (project) {
      localStorage.setItem('editingProjectId', project.id);
      setLocation('/project-wizard?edit=true');
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'paused': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: { [key: string]: string } = {
      instagram: '📷',
      facebook: '📘',
      linkedin: '💼',
      youtube: '📺',
      twitter: '🐦',
      tiktok: '🎵'
    };
    return icons[platform] || '🌐';
  };

  // Remove local getTimezoneDisplayName function - using utility instead

  // Calculate project health/readiness score
  const calculateProjectHealth = (project: ProjectData) => {
    let score = 0;
    
    // Basic setup (40 points)
    if (project.name && project.name !== 'Untitled Project') score += 10;
    if (project.description) score += 10;
    if (project.platforms && project.platforms.length > 0) score += 10;
    if (project.goals && project.goals.length > 0) score += 10;
    
    // Content strategy (30 points)
    if (project.contentFormats && project.contentFormats.length > 0) score += 10;
    if (project.contentThemes && project.contentThemes.length > 0) score += 10;
    if (project.postingFrequency) score += 10;
    
    // Scheduling setup (20 points)
    if (project.startDate) score += 10;
    if (project.schedulingPreferences?.timeZone) score += 10;
    
    // Advanced setup (10 points)
    if (project.budget) score += 5;
    if (project.teamMembers && project.teamMembers.length > 0) score += 5;
    
    return Math.round(score);
  };

  // Generate AI-driven recommendations
  const generateAIRecommendations = (project: ProjectData) => {
    const recommendations = [];
    
    // Platform-specific recommendations
    if (project.platforms?.includes('Instagram')) {
      recommendations.push({
        type: 'content',
        title: 'Instagram Stories Strategy',
        description: 'Create behind-the-scenes content for higher engagement',
        action: 'Generate Story Ideas',
        priority: 'high',
        icon: '📸'
      });
    }
    
    if (project.platforms?.includes('LinkedIn')) {
      recommendations.push({
        type: 'content',
        title: 'Professional Thought Leadership',
        description: 'Share industry insights to build authority',
        action: 'Create LinkedIn Posts',
        priority: 'medium',
        icon: '💼'
      });
    }
    
    // Frequency-based recommendations
    if (project.postingFrequency === 'Daily') {
      recommendations.push({
        type: 'planning',
        title: 'Batch Content Creation',
        description: 'Create a week\'s worth of content in advance',
        action: 'Generate Weekly Plan',
        priority: 'high',
        icon: '📅'
      });
    }
    
    // Theme-based recommendations
    if (project.contentThemes?.includes('Educational')) {
      recommendations.push({
        type: 'content',
        title: 'Educational Series',
        description: 'Create a multi-part educational series',
        action: 'Plan Content Series',
        priority: 'medium',
        icon: '🎓'
      });
    }
    
    return recommendations.slice(0, 3); // Limit to top 3
  };

  // Get optimal posting insights
  const getPostingInsights = (project: ProjectData) => {
    const insights = [];
    
    // Platform-specific best times
    if (project.platforms?.includes('Instagram')) {
      insights.push({
        platform: 'Instagram',
        bestTimes: ['11:00 AM', '2:00 PM', '5:00 PM'],
        bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
        tip: 'Stories perform best in the evening'
      });
    }
    
    if (project.platforms?.includes('LinkedIn')) {
      insights.push({
        platform: 'LinkedIn',
        bestTimes: ['8:00 AM', '12:00 PM', '5:00 PM'],
        bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
        tip: 'Professional content works best on weekdays'
      });
    }
    
    return insights;
  };

  const handleAutoSchedule = async () => {
    if (!project) return;

    try {
      toast({
        title: "🤖 Auto-Scheduling Started",
        description: "Generating content and optimal schedule for your project...",
      });

      // Generate sample scheduled content
      const scheduledEntries: any[] = [];
      const platforms = project.platforms || ['Instagram'];
      const startDate = project.startDate ? new Date(project.startDate) : new Date();
      
      // Generate 7 days of content
      for (let day = 0; day < 7; day++) {
        const postDate = new Date(startDate);
        postDate.setDate(postDate.getDate() + day);
        
        platforms.forEach((platform, platformIndex) => {
          const optimalTimes = platform === 'Instagram' ? ['11:00', '17:00'] : ['09:00', '15:00'];
          const timeSlot = optimalTimes[day % optimalTimes.length];
          const [hours, minutes] = timeSlot.split(':').map(Number);
          
          postDate.setHours(hours, minutes, 0, 0);
          
          const contentTemplates = [
            `🎯 Quick tip for ${project.category || 'your industry'}: Focus on quality over quantity when creating content. What's your biggest content challenge?`,
            `📚 Did you know? Consistent posting increases engagement by 67%. Here's how ${project.name} can help you stay consistent!`,
            `💡 Behind the scenes: How we create content for ${project.name}. The process might surprise you!`,
            `🚀 Success story: See how our strategies helped boost engagement. Your turn to shine!`,
            `❓ Question time: What type of content do you want to see more of? Let us know in the comments!`,
            `🔥 Trending now in ${project.category || 'your industry'}: Here are the top 3 things you should know.`,
            `✨ Weekly wrap-up: Here's what we accomplished this week with ${project.name}. What are your wins?`
          ];
          
          const content = contentTemplates[day % contentTemplates.length];
          
          scheduledEntries.push({
            id: `auto_${Date.now()}_${day}_${platformIndex}`,
            projectId: project.id,
            projectName: project.name,
            content: content,
            contentType: 'post',
            platform: platform,
            scheduledAt: postDate.toISOString(),
            timezone: project.schedulingPreferences?.timeZone || 'UTC',
            status: 'scheduled',
            autoGenerated: true,
            createdAt: new Date().toISOString()
          });
        });
      }
      
      // Save to localStorage
      const existingSchedule = JSON.parse(localStorage.getItem('scheduledContent') || '[]');
      const updatedSchedule = [...existingSchedule, ...scheduledEntries];
      localStorage.setItem('scheduledContent', JSON.stringify(updatedSchedule));
      
      toast({
        title: "🎉 Auto-Scheduling Complete!",
        description: `Successfully scheduled ${scheduledEntries.length} posts for ${project.name}. Check your scheduler!`,
      });
      
      // Navigate to scheduler after a delay
      setTimeout(() => {
        setLocation('/enhanced-scheduler');
      }, 2000);
      
    } catch (error) {
      console.error('Auto-scheduling error:', error);
      toast({
        title: "Error",
        description: "Failed to auto-schedule content. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get onboarding checklist
  const getOnboardingChecklist = () => {
    return [
      {
        id: 'content',
        title: 'Create your first content',
        description: 'Generate or upload your first post',
        completed: false, // This would be dynamic based on actual content
        action: () => setLocation('/ai-content-generator'),
        priority: 1
      },
      {
        id: 'platforms',
        title: 'Connect social platforms',
        description: 'Link your social media accounts',
        completed: false,
        action: () => {}, // Would open platform connection modal
        priority: 2
      },
      {
        id: 'schedule',
        title: 'Schedule your first posts',
        description: 'Plan when your content goes live',
        completed: false,
        action: () => setLocation('/enhanced-scheduler'),
        priority: 3
      },
      {
        id: 'analytics',
        title: 'Set up analytics tracking',
        description: 'Monitor your performance',
        completed: false,
        action: () => setLocation('/analytics'),
        priority: 4
      }
    ];
  };

  if (!isAuthenticated && !isLoading) {
    setLocation('/login');
    return null;
  }

  if (isLoading || isLoadingProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => setLocation('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                  <Badge className={`${getStatusColor(project.status || 'draft')} flex items-center gap-1`}>
                    {getStatusIcon(project.status || 'draft')}
                    {(project.status || 'draft').charAt(0).toUpperCase() + (project.status || 'draft').slice(1)}
                  </Badge>
                </div>
                
                {/* Project Health Indicator */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Setup Progress</span>
                    <div className="flex items-center gap-2">
                      <Progress value={calculateProjectHealth(project)} className="w-24 h-2" />
                      <span className="text-sm font-semibold text-blue-600">
                        {calculateProjectHealth(project)}%
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    Created {project.createdAt 
                      ? formatDateInTimezone(
                          project.createdAt, 
                          project.schedulingPreferences?.timeZone || 'UTC'
                        )
                      : 'Unknown'
                    }
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(project.status || 'draft') === 'draft' && (
                <Button onClick={handleStartProject} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Play className="h-4 w-4" />
                  Launch Project
                </Button>
              )}
              <Button variant="outline" onClick={handleEditProject} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Share className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* AI Recommendations Banner */}
        {calculateProjectHealth(project) < 80 && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Brain className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">AI Recommendations</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Complete your setup to unlock the full potential of your {project.name} project
                </p>
                <div className="flex flex-wrap gap-2">
                  {generateAIRecommendations(project).map((rec, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      className="text-xs bg-white hover:bg-blue-50 border-blue-200"
                      onClick={() => {
                        if (rec.action === 'Generate Weekly Plan') setLocation('/enhanced-scheduler');
                        else if (rec.action === 'Create LinkedIn Posts') setLocation('/ai-content-generator');
                        else setLocation('/ai-content-generator');
                      }}
                    >
                      <span className="mr-1">{rec.icon}</span>
                      {rec.action}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Project Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Project Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {project.description && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                        <p className="text-gray-600">{project.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Content Type</h4>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {project.contentType || 'Social Media Content'}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Category</h4>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {project.category || 'General'}
                        </Badge>
                      </div>
                    </div>

                    {project.targetAudience && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Target Audience</h4>
                        <p className="text-gray-600">{project.targetAudience}</p>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Project Goals</h4>
                      <div className="flex flex-wrap gap-2">
                        {(project.goals || []).map((goal, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {goal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Strategy */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Content Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Content Formats</h4>
                      <div className="flex flex-wrap gap-2">
                        {(project.contentFormats || []).map((format, index) => (
                          <Badge key={index} variant="outline">{format}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Posting Frequency</h4>
                        <Badge variant="secondary">{project.postingFrequency || 'Not specified'}</Badge>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Brand Voice</h4>
                        <Badge variant="secondary">{project.brandVoice || 'Not specified'}</Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Content Themes</h4>
                      <div className="flex flex-wrap gap-2">
                        {(project.contentThemes || []).map((theme, index) => (
                          <Badge key={index} variant="outline">{theme}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Platforms & Integrations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Platforms & Integrations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Social Media Platforms</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {(project.platforms || []).map((platform, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                            <span className="text-lg">{getPlatformIcon(platform)}</span>
                            <span className="font-medium capitalize">{platform}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {project.aiTools && project.aiTools.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">AI Tools</h4>
                        <div className="flex flex-wrap gap-2">
                          {(project.aiTools || []).map((tool, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              <Settings className="h-3 w-3" />
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Auto Schedule</h4>
                        <Badge variant={project.schedulingPreferences?.autoSchedule ? "default" : "secondary"}>
                          {project.schedulingPreferences?.autoSchedule ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Time Zone</h4>
                        <Badge variant="outline">{getTimezoneDisplayName(project.schedulingPreferences?.timeZone || 'UTC')}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="space-y-6">
                {/* Content Creation Tools */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        AI-Powered Content Studio
                      </CardTitle>
                      <Button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" onClick={() => setLocation('/ai-content-generator')}>
                        <Plus className="h-4 w-4" />
                        Create Content
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {/* AI Content Generator */}
                      <div className="group border rounded-lg p-4 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100" onClick={() => setLocation('/ai-content-generator')}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Brain className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">AI Content Generator</h4>
                            <p className="text-sm text-gray-600">Create posts with AI</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">
                          Perfect for: Daily posts, captions, hashtags. Generate engaging content in seconds based on your brand voice and themes.
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">Ready to use</Badge>
                          <ArrowRight className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>

                      {/* Template Library */}
                      <div className="group border rounded-lg p-4 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-green-300 bg-gradient-to-br from-green-50 to-green-100" onClick={() => setLocation('/templates')}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileText className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Template Library</h4>
                            <p className="text-sm text-gray-600">Pre-made templates</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">
                          Perfect for: Quick starts, consistent branding. Choose from professionally designed templates for your industry.
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">50+ templates</Badge>
                          <ArrowRight className="h-4 w-4 text-green-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>

                      {/* Gemini Studio */}
                      <div className="group border rounded-lg p-4 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-purple-300 bg-gradient-to-br from-purple-50 to-purple-100" onClick={() => setLocation('/gemini-studio')}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Zap className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Gemini Studio</h4>
                            <p className="text-sm text-gray-600">Advanced AI tools</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">
                          Perfect for: Complex content, research, analysis. Advanced AI capabilities for sophisticated content creation.
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">Pro features</Badge>
                          <ArrowRight className="h-4 w-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>

                    {/* Smart Content Suggestions */}
                    <div className="border-t pt-6">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Smart Suggestions for Your Project
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h5 className="font-medium text-yellow-900 mb-2">📅 Weekly Content Plan</h5>
                          <p className="text-sm text-yellow-700 mb-3">
                            Generate a complete week of content based on your {project.postingFrequency || 'posting'} schedule
                          </p>
                          <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100" onClick={() => setLocation('/enhanced-scheduler')}>
                            Generate Plan
                          </Button>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h5 className="font-medium text-blue-900 mb-2">🔥 Trending Topics</h5>
                          <p className="text-sm text-blue-700 mb-3">
                            Discover what's trending in {project.category || 'your industry'} right now
                          </p>
                          <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100" onClick={() => setLocation('/trend-analysis')}>
                            Explore Trends
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Content Strategy Overview */}
                    <div className="border-t pt-6">
                      <h4 className="font-medium text-gray-900 mb-4">Content Strategy for this Project</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{(project.contentFormats || []).length}</div>
                          <div className="text-sm text-gray-600">Content Formats</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{(project.platforms || []).length}</div>
                          <div className="text-sm text-gray-600">Platforms</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{(project.contentThemes || []).length}</div>
                          <div className="text-sm text-gray-600">Themes</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{project.postingFrequency || 'Daily'}</div>
                          <div className="text-sm text-gray-600">Frequency</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-6">
                {/* Scheduling Tools */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-blue-600" />
                        Smart Scheduling Hub
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleAutoSchedule} className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50">
                          <Zap className="h-4 w-4" />
                          Auto-Schedule
                        </Button>
                        <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" onClick={() => setLocation('/enhanced-scheduler')}>
                          <Calendar className="h-4 w-4" />
                          Open Scheduler
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Scheduling Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="border rounded-lg p-4 text-center bg-gradient-to-br from-blue-50 to-blue-100">
                        <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
                        <div className="text-sm text-gray-600 mb-3">Scheduled Posts</div>
                        <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100" onClick={handleAutoSchedule}>
                          Auto-Schedule
                        </Button>
                      </div>
                      <div className="border rounded-lg p-4 text-center bg-gradient-to-br from-green-50 to-green-100">
                        <div className="text-3xl font-bold text-green-600 mb-2">{(project.platforms || []).length}</div>
                        <div className="text-sm text-gray-600 mb-3">Connected Platforms</div>
                        <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-100">
                          Manage
                        </Button>
                      </div>
                      <div className="border rounded-lg p-4 text-center bg-gradient-to-br from-purple-50 to-purple-100">
                        <div className="text-3xl font-bold text-purple-600 mb-2">{project.postingFrequency || 'Daily'}</div>
                        <div className="text-sm text-gray-600 mb-3">Posting Frequency</div>
                        <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-100">
                          Optimize
                        </Button>
                      </div>
                    </div>

                    {/* AI-Powered Posting Insights */}
                    <div className="border-t pt-6 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        AI-Powered Posting Insights
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getPostingInsights(project).map((insight, index) => (
                          <div key={index} className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-lg">{getPlatformIcon(insight.platform.toLowerCase())}</span>
                              <h5 className="font-medium text-green-900">{insight.platform} Optimization</h5>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium text-green-800">Best Times:</span>
                                <span className="text-green-700 ml-2">{insight.bestTimes.join(', ')}</span>
                              </div>
                              <div>
                                <span className="font-medium text-green-800">Best Days:</span>
                                <span className="text-green-700 ml-2">{insight.bestDays.join(', ')}</span>
                              </div>
                              <div className="bg-green-100 rounded p-2 mt-2">
                                <span className="text-xs text-green-800">💡 {insight.tip}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Scheduling Preferences */}
                    <div className="border-t pt-6 mb-6">
                      <h4 className="font-medium text-gray-900 mb-4">Current Scheduling Setup</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h5 className="font-medium mb-2 flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Auto Schedule
                          </h5>
                          <Badge variant={project.schedulingPreferences?.autoSchedule ? "default" : "secondary"} className="mb-2">
                            {project.schedulingPreferences?.autoSchedule ? "Enabled" : "Disabled"}
                          </Badge>
                          <p className="text-sm text-gray-600">
                            {project.schedulingPreferences?.autoSchedule 
                              ? "Content will be automatically scheduled based on optimal times"
                              : "Manual scheduling required for each post"
                            }
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h5 className="font-medium mb-2 flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Time Zone
                          </h5>
                          <Badge variant="outline" className="mb-2">{getTimezoneDisplayName(project.schedulingPreferences?.timeZone || 'UTC')}</Badge>
                          <p className="text-sm text-gray-600">
                            All scheduled content will be posted in this timezone
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="border-t pt-6">
                      <h4 className="font-medium text-gray-900 mb-4">Quick Actions</h4>
                      <div className="flex flex-wrap gap-3">
                        <Button variant="outline" className="flex items-center gap-2" onClick={handleAutoSchedule}>
                          <Zap className="h-4 w-4" />
                          Auto-Schedule
                        </Button>
                        <Button variant="outline" className="flex items-center gap-2" onClick={() => setLocation('/enhanced-scheduler')}>
                          <Calendar className="h-4 w-4" />
                          Manual Schedule
                        </Button>
                        <Button variant="outline" className="flex items-center gap-2" onClick={() => setLocation('/scheduler')}>
                          <ClockIcon className="h-4 w-4" />
                          View Calendar
                        </Button>
                        <Button variant="outline" className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Optimize Times
                        </Button>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Scheduling Settings
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                {/* Analytics Dashboard */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Analytics Dashboard
                      <Button variant="outline" className="flex items-center gap-2" onClick={() => setLocation('/analytics')}>
                        <BarChart3 className="h-4 w-4" />
                        Full Analytics
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Analytics Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="border rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-2">0</div>
                        <div className="text-sm text-gray-600">Total Posts</div>
                      </div>
                      <div className="border rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600 mb-2">0</div>
                        <div className="text-sm text-gray-600">Total Engagement</div>
                      </div>
                      <div className="border rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600 mb-2">0</div>
                        <div className="text-sm text-gray-600">Followers Gained</div>
                      </div>
                      <div className="border rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600 mb-2">0%</div>
                        <div className="text-sm text-gray-600">Engagement Rate</div>
                      </div>
                    </div>

                    {/* Platform Performance */}
                    <div className="border-t pt-6 mb-6">
                      <h4 className="font-medium text-gray-900 mb-4">Platform Performance</h4>
                      <div className="space-y-3">
                        {(project.platforms || []).map((platform, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{getPlatformIcon(platform)}</span>
                              <div>
                                <div className="font-medium capitalize">{platform}</div>
                                <div className="text-sm text-gray-600">Ready for content</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">0 posts</div>
                              <div className="text-xs text-gray-600">0 engagement</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Analytics Tools */}
                    <div className="border-t pt-6">
                      <h4 className="font-medium text-gray-900 mb-4">Analytics Tools</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation('/analytics')}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <BarChart3 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h5 className="font-medium">Performance Analytics</h5>
                              <p className="text-sm text-gray-600">Track engagement and reach</p>
                            </div>
                          </div>
                          <Badge variant="secondary">Available</Badge>
                        </div>

                        <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation('/trend-analysis')}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Target className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h5 className="font-medium">Trend Analysis</h5>
                              <p className="text-sm text-gray-600">Discover trending topics</p>
                            </div>
                          </div>
                          <Badge variant="secondary">Available</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Getting Started */}
                    <div className="border-t pt-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h5 className="font-medium text-blue-900 mb-1">Start Tracking Analytics</h5>
                            <p className="text-sm text-blue-700 mb-3">
                              Create and publish content to start seeing analytics data. Your performance metrics will appear here once you begin posting.
                            </p>
                            <Button size="sm" onClick={() => setLocation('/ai-content-generator')}>
                              Create First Post
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Onboarding Checklist */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-green-600" />
                  Getting Started
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getOnboardingChecklist().map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.completed ? 'bg-green-500' : 'bg-gray-200'
                    }`}>
                      {item.completed ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-xs font-medium text-gray-600">{item.priority}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                      {!item.completed && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2 text-xs h-7"
                          onClick={item.action}
                        >
                          Start
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Project Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Project Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Start Date</h4>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <div className="flex flex-col">
                      <p className="text-gray-600">
                        {(() => {
                          console.log('🔍 Project startDate:', project.startDate);
                          console.log('🔍 Project timezone:', project.schedulingPreferences?.timeZone);
                          
                          if (project.startDate) {
                            const formatted = formatDateInTimezone(
                              project.startDate, 
                              project.schedulingPreferences?.timeZone || 'UTC'
                            );
                            console.log('🔍 Formatted date:', formatted);
                            return formatted;
                          } else if (project.createdAt) {
                            const formatted = formatDateInTimezone(
                              project.createdAt, 
                              project.schedulingPreferences?.timeZone || 'UTC'
                            );
                            console.log('🔍 Using createdAt, formatted:', formatted);
                            return formatted;
                          } else {
                            return 'Not set';
                          }
                        })()}
                      </p>
                      {(project.startDate || project.createdAt) && (
                        <p className="text-xs text-gray-500">
                          {(() => {
                            const dateToUse = project.startDate || project.createdAt;
                            const relTime = getRelativeTime(
                              dateToUse, 
                              project.schedulingPreferences?.timeZone || 'UTC'
                            );
                            console.log('🔍 Relative time:', relTime);
                            return relTime;
                          })()}
                          {(() => {
                            const dateToUse = project.startDate || project.createdAt;
                            const isTodayResult = isDateToday(
                              dateToUse, 
                              project.schedulingPreferences?.timeZone || 'UTC'
                            );
                            console.log('🔍 Is today?', isTodayResult);
                            return isTodayResult ? <span className="ml-1 text-green-600 font-medium">• Today</span> : null;
                          })()}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Timezone: {getTimezoneDisplayName(project.schedulingPreferences?.timeZone || 'UTC')}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Duration</h4>
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    <ClockIcon className="h-3 w-3" />
                    {project.duration || 'Not specified'}
                  </Badge>
                </div>
                {project.budget && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Budget</h4>
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      <DollarSign className="h-3 w-3" />
                      {project.budget}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Members */}
            {project.teamMembers && project.teamMembers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {project.teamMembers.map((member, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {member.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-700">{member}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-200" onClick={() => setLocation('/ai-content-generator')}>
                  <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
                  Generate Content
                </Button>
                <Button variant="outline" className="w-full justify-start bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-200" onClick={handleAutoSchedule}>
                  <Zap className="h-4 w-4 mr-2 text-green-600" />
                  Auto-Schedule Posts
                </Button>
                <Button variant="outline" className="w-full justify-start bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200" onClick={() => setLocation('/enhanced-scheduler')}>
                  <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                  Manual Schedule
                </Button>
                <Button variant="outline" className="w-full justify-start bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-200" onClick={() => setLocation('/analytics')}>
                  <BarChart3 className="h-4 w-4 mr-2 text-green-600" />
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 border-orange-200" onClick={() => setLocation('/trend-analysis')}>
                  <TrendingUp className="h-4 w-4 mr-2 text-orange-600" />
                  Discover Trends
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}