import { useState, useEffect } from "react";
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAsyncOperation } from "@/hooks/useAsyncOperation";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ProjectService, ProjectData } from "@/lib/projectService";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Save,
  Settings,
  Calendar,
  Zap,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Twitter,
  Smartphone,
  TrendingUp,
  FileText,
  Clock,
  Target,
  Palette,
  Video,
  Image,
  MessageSquare
} from "lucide-react";
import { useLocation } from "wouter";
import { createTimezoneAwareDate, getCurrentDateInTimezone } from "@/utils/dateUtils";

// Form schemas for each step
const projectBasicsSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  description: z.string().optional(),
  contentType: z.string().min(1, "Please select a content type"),
  category: z.string().min(1, "Please select a category"),
  targetAudience: z.string().optional(),
  goals: z.array(z.string()).min(1, "Please select at least one goal"),
});

const contentCreationSchema = z.object({
  contentFormats: z.array(z.string()).min(1, "Please select at least one content format"),
  postingFrequency: z.string().min(1, "Please select posting frequency"),
  contentThemes: z.array(z.string()).min(1, "Please select at least one theme"),
  brandVoice: z.string().min(1, "Please select brand voice"),
  contentLength: z.string().min(1, "Please select content length"),
});

const integrationsSchema = z.object({
  platforms: z.array(z.string()).min(1, "Please select at least one platform"),
  aiTools: z.array(z.string()).optional(),
  schedulingPreferences: z.object({
    autoSchedule: z.boolean(),
    timeZone: z.string(),
    preferredTimes: z.array(z.string()),
  }),
});

const scheduleSchema = z.object({
  startDate: z.string().min(1, "Please select a start date"),
  duration: z.string().min(1, "Please select project duration"),
  milestones: z.array(z.object({
    name: z.string(),
    date: z.string(),
    description: z.string().optional(),
  })).optional(),
  budget: z.string().optional(),
  teamMembers: z.array(z.string()).optional(),
});

type ProjectBasicsData = z.infer<typeof projectBasicsSchema>;
type ContentCreationData = z.infer<typeof contentCreationSchema>;
type IntegrationsData = z.infer<typeof integrationsSchema>;
type ScheduleData = z.infer<typeof scheduleSchema>;

interface ProjectWizardData {
  basics: ProjectBasicsData;
  content: ContentCreationData;
  integrations: IntegrationsData;
  schedule: ScheduleData;
}

const STEPS = [
  { id: 1, name: 'Project Basics', icon: FileText },
  { id: 2, name: 'Content Creation', icon: Palette },
  { id: 3, name: 'Integrations', icon: Settings },
  { id: 4, name: 'Schedule & Plan', icon: Calendar },
];

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { value: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
  { value: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-600' },
  { value: 'twitter', label: 'Twitter/X', icon: Twitter, color: 'text-black' },
  { value: 'tiktok', label: 'TikTok', icon: Smartphone, color: 'text-black' },
];

const CONTENT_TYPES = [
  { value: 'fitness', label: 'Fitness', icon: Zap, color: 'text-green-600' },
  { value: 'tech', label: 'Technology', icon: Smartphone, color: 'text-blue-600' },
  { value: 'lifestyle', label: 'Lifestyle', icon: TrendingUp, color: 'text-purple-600' },
  { value: 'business', label: 'Business', icon: Target, color: 'text-orange-600' },
  { value: 'education', label: 'Education', icon: FileText, color: 'text-indigo-600' },
];

const CONTENT_FORMATS = [
  { value: 'video', label: 'Video Content', icon: Video },
  { value: 'image', label: 'Image Posts', icon: Image },
  { value: 'carousel', label: 'Carousel Posts', icon: MessageSquare },
  { value: 'stories', label: 'Stories', icon: Clock },
  { value: 'reels', label: 'Reels/Shorts', icon: Video },
  { value: 'live', label: 'Live Streams', icon: Video },
];

const PROJECT_GOALS = [
  'Increase Brand Awareness',
  'Drive Website Traffic',
  'Generate Leads',
  'Boost Engagement',
  'Build Community',
  'Increase Sales',
  'Educate Audience',
  'Launch Product',
];

const CONTENT_THEMES = [
  'Educational Content',
  'Behind the Scenes',
  'User Generated Content',
  'Product Showcases',
  'Industry News',
  'Tips & Tutorials',
  'Inspirational Content',
  'Entertainment',
];

const BRAND_VOICES = [
  'Professional',
  'Friendly',
  'Authoritative',
  'Playful',
  'Inspirational',
  'Educational',
  'Conversational',
  'Bold',
];

export default function ProjectWizard() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [currentStep, setCurrentStep] = useState(1);
  const [projectData, setProjectData] = useState<Partial<ProjectWizardData>>({});

  // Debounced navigation
  const debouncedNavigate = useDebouncedCallback((url: string) => {
    try {
      setLocation(url);
    } catch (error) {
      console.error('Navigation error:', error);
      toast({
        title: "Navigation Error",
        description: "Failed to navigate. Please try again.",
        variant: "destructive",
      });
    }
  }, 300);

  // Async operation for project creation
  const { execute: executeCreateProject, isLoading: isSubmitting } = useAsyncOperation(
    async (completeData: Partial<ProjectWizardData>) => {
      console.log('Creating project with data:', completeData);

      // Prepare project data for the service
      const newProjectData: Omit<ProjectData, 'id' | 'createdAt' | 'updatedAt'> = {
        name: completeData.basics?.name || '',
        description: completeData.basics?.description || '',
        contentType: completeData.basics?.contentType || '',
        category: completeData.basics?.category || '',
        targetAudience: completeData.basics?.targetAudience || '',
        goals: completeData.basics?.goals || [],
        contentFormats: completeData.content?.contentFormats || [],
        postingFrequency: completeData.content?.postingFrequency || '',
        contentThemes: completeData.content?.contentThemes || [],
        brandVoice: completeData.content?.brandVoice || '',
        contentLength: completeData.content?.contentLength || '',
        platforms: completeData.integrations?.platforms || [],
        aiTools: completeData.integrations?.aiTools || [],
        schedulingPreferences: {
          autoSchedule: completeData.integrations?.schedulingPreferences?.autoSchedule || false,
          timeZone: completeData.integrations?.schedulingPreferences?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          preferredTimes: completeData.integrations?.schedulingPreferences?.preferredTimes || [],
        },
        startDate: completeData.schedule?.startDate 
          ? createTimezoneAwareDate(
              completeData.schedule.startDate, 
              completeData.integrations?.schedulingPreferences?.timeZone || 'UTC'
            )
          : '',
        duration: completeData.schedule?.duration || '',
        budget: completeData.schedule?.budget || '',
        teamMembers: completeData.schedule?.teamMembers || [],
        status: 'draft',
      };

      // Create the project using the service
      const createdProject = await ProjectService.createProject(newProjectData);
      return createdProject;
    },
    {
      onSuccess: (createdProject) => {
        toast({
          title: "🎉 Project Created Successfully!",
          description: `"${createdProject.name}" has been created with all configurations. You can now start creating content!`,
        });

        // Store the project ID for the details page
        localStorage.setItem('currentProjectId', createdProject.id!);

        // Redirect to project details page after a short delay
        setTimeout(() => {
          debouncedNavigate(`/project-details?id=${createdProject.id}`);
        }, 1500);
      },
      errorMessage: "Failed to create project. Please try again.",
    }
  );

  // Form for current step
  const basicsForm = useForm<ProjectBasicsData>({
    resolver: zodResolver(projectBasicsSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      contentType: '',
      category: '',
      targetAudience: '',
      goals: [],
    }
  });

  const contentForm = useForm<ContentCreationData>({
    resolver: zodResolver(contentCreationSchema),
    mode: 'onChange',
    defaultValues: {
      contentFormats: [],
      postingFrequency: '',
      contentThemes: [],
      brandVoice: '',
      contentLength: '',
    }
  });

  const integrationsForm = useForm<IntegrationsData>({
    resolver: zodResolver(integrationsSchema),
    mode: 'onChange',
    defaultValues: {
      platforms: [],
      aiTools: [],
      schedulingPreferences: {
        autoSchedule: false,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        preferredTimes: [],
      },
    }
  });

  const scheduleForm = useForm<ScheduleData>({
    resolver: zodResolver(scheduleSchema),
    mode: 'onChange',
    defaultValues: {
      startDate: '',
      duration: '',
      milestones: [],
      budget: '',
      teamMembers: [],
    }
  });

  // Check authentication
  if (!isLoading && !isAuthenticated) {
    debouncedNavigate('/login');
    return null;
  }

  // Debug logging
  useEffect(() => {
    console.log('Project Wizard - Current Step:', currentStep);
    console.log('Project Wizard - Project Data:', projectData);
  }, [currentStep, projectData]);

  const getCurrentForm = () => {
    console.log('Getting form for step:', currentStep);
    switch (currentStep) {
      case 1: return basicsForm;
      case 2: return contentForm;
      case 3: return integrationsForm;
      case 4: return scheduleForm;
      default: return basicsForm;
    }
  };

  const handleNext = async () => {
    const form = getCurrentForm();
    
    // Custom validation for each step since some fields use setValue instead of register
    let isValid = true;
    let validationErrors: string[] = [];

    try {
      // First try the form's built-in validation
      const formValid = await form.trigger();
      
      // Then do custom validation for fields that use setValue
      const formData = form.getValues();
      
      switch (currentStep) {
        case 1: {
          const data = formData as ProjectBasicsData;
          if (!data.name || data.name.length < 3) {
            validationErrors.push("Project name must be at least 3 characters");
            isValid = false;
          }
          if (!data.contentType) {
            validationErrors.push("Please select a content type");
            isValid = false;
          }
          if (!data.category) {
            validationErrors.push("Please select a category");
            isValid = false;
          }
          if (!data.goals || data.goals.length === 0) {
            validationErrors.push("Please select at least one goal");
            isValid = false;
          }
          break;
        }
          
        case 2: {
          const data = formData as ContentCreationData;
          if (!data.contentFormats || data.contentFormats.length === 0) {
            validationErrors.push("Please select at least one content format");
            isValid = false;
          }
          if (!data.postingFrequency) {
            validationErrors.push("Please select posting frequency");
            isValid = false;
          }
          if (!data.contentThemes || data.contentThemes.length === 0) {
            validationErrors.push("Please select at least one theme");
            isValid = false;
          }
          if (!data.brandVoice) {
            validationErrors.push("Please select brand voice");
            isValid = false;
          }
          if (!data.contentLength) {
            validationErrors.push("Please select content length");
            isValid = false;
          }
          break;
        }
          
        case 3: {
          const data = formData as IntegrationsData;
          if (!data.platforms || data.platforms.length === 0) {
            validationErrors.push("Please select at least one platform");
            isValid = false;
          }
          break;
        }
          
        case 4: {
          const data = formData as ScheduleData;
          if (!data.startDate) {
            validationErrors.push("Please select a start date");
            isValid = false;
          }
          if (!data.duration) {
            validationErrors.push("Please select project duration");
            isValid = false;
          }
          break;
        }
      }
      
      // Combine form validation with custom validation
      isValid = formValid && isValid;
      
    } catch (error) {
      console.error('Form validation error:', error);
      isValid = false;
      validationErrors.push("Form validation failed");
    }
    
    if (!isValid) {
      toast({
        title: "Please complete all required fields",
        description: validationErrors.length > 0 ? validationErrors.join(", ") : "Fill in the required information before proceeding.",
        variant: "destructive",
      });
      return;
    }

    // Save current step data
    const formData = form.getValues();
    const stepKey = ['basics', 'content', 'integrations', 'schedule'][currentStep - 1] as keyof ProjectWizardData;
    setProjectData(prev => ({ ...prev, [stepKey]: formData }));

    console.log(`Step ${currentStep} completed. Data:`, formData);

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      toast({
        title: "Step Completed",
        description: `Moving to step ${currentStep + 1}`,
      });
    } else {
      await handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      // Combine all form data
      const completeData = {
        ...projectData,
        schedule: scheduleForm.getValues(),
      };

      await executeCreateProject(completeData);
    } catch (error) {
      console.error('Error creating project:', error);
      // Error handling is done by useAsyncOperation
    }
  };

  const getStepProgress = () => {
    return (currentStep / STEPS.length) * 100;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
                <p className="text-sm text-gray-600">Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm px-3 py-1">
              Project Wizard
            </Badge>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => {
              const IconComponent = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isActive 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <IconComponent className="w-5 h-5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={getStepProgress()} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(STEPS[currentStep - 1].icon, { className: "h-5 w-5 text-blue-600" })}
              {STEPS[currentStep - 1].name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Project Basics */}
            {currentStep === 1 && (
              <ProjectBasicsStep 
                form={basicsForm}
                contentTypes={CONTENT_TYPES}
                goals={PROJECT_GOALS}
              />
            )}

            {/* Step 2: Content Creation */}
            {currentStep === 2 && (
              <ContentCreationStep 
                form={contentForm}
                contentFormats={CONTENT_FORMATS}
                themes={CONTENT_THEMES}
                brandVoices={BRAND_VOICES}
              />
            )}

            {/* Step 3: Integrations */}
            {currentStep === 3 && (
              <IntegrationsStep 
                form={integrationsForm}
                platforms={PLATFORMS}
              />
            )}

            {/* Step 4: Schedule & Plan */}
            {currentStep === 4 && (
              <ScheduleStep 
                form={scheduleForm}
                projectData={projectData}
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              {/* Left side navigation */}
              {currentStep === 1 ? (
                <Button
                  variant="outline"
                  onClick={() => debouncedNavigate('/dashboard')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Button>
              )}

              {/* Right side navigation */}
              <Button
                onClick={handleNext}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Project...
                  </>
                ) : currentStep === 4 ? (
                  <>
                    <Save className="w-4 h-4" />
                    Create Project
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Step Components
function ProjectBasicsStep({ form, contentTypes, goals }: any) {
  const { register, setValue, watch, formState: { errors } } = form;
  const watchedValues = watch();

  return (
    <div className="space-y-6">
      {/* Project Name */}
      <div>
        <Label htmlFor="name">Project Name *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Enter your project name..."
          className={`mt-2 ${errors.name ? 'border-red-500' : ''}`}
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Project Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Describe your project goals and objectives..."
          className="mt-2"
          rows={3}
        />
      </div>

      {/* Content Type */}
      <div>
        <Label>Content Type *</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
          {contentTypes.map((type: any) => {
            const IconComponent = type.icon;
            const isSelected = watchedValues.contentType === type.value;
            return (
              <div
                key={type.value}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setValue('contentType', type.value)}
              >
                <div className="flex flex-col items-center text-center">
                  <IconComponent className={`h-6 w-6 mb-2 ${type.color}`} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                    {type.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {errors.contentType && (
          <p className="text-sm text-red-600 mt-1">{errors.contentType.message}</p>
        )}
      </div>

      {/* Category */}
      {watchedValues.contentType && (
        <div>
          <Label htmlFor="category">Category *</Label>
          <Select value={watchedValues.category} onValueChange={(value) => setValue('category', value)}>
            <SelectTrigger className={`mt-2 ${errors.category ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner Level</SelectItem>
              <SelectItem value="intermediate">Intermediate Level</SelectItem>
              <SelectItem value="advanced">Advanced Level</SelectItem>
              <SelectItem value="professional">Professional Level</SelectItem>
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
          )}
        </div>
      )}

      {/* Target Audience */}
      <div>
        <Label htmlFor="targetAudience">Target Audience</Label>
        <Input
          id="targetAudience"
          {...register('targetAudience')}
          placeholder="e.g., Young professionals, fitness enthusiasts..."
          className="mt-2"
        />
      </div>

      {/* Project Goals */}
      <div>
        <Label>Project Goals *</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {goals.map((goal: string) => {
            const isSelected = watchedValues.goals?.includes(goal);
            return (
              <div
                key={goal}
                className={`p-3 border rounded-lg cursor-pointer transition-all text-sm ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => {
                  const currentGoals = watchedValues.goals || [];
                  const newGoals = isSelected
                    ? currentGoals.filter((g: string) => g !== goal)
                    : [...currentGoals, goal];
                  setValue('goals', newGoals);
                }}
              >
                {goal}
              </div>
            );
          })}
        </div>
        {errors.goals && (
          <p className="text-sm text-red-600 mt-1">{errors.goals.message}</p>
        )}
      </div>
    </div>
  );
}

function ContentCreationStep({ form, contentFormats, themes, brandVoices }: any) {
  const { setValue, watch, formState: { errors } } = form;
  const watchedValues = watch();

  return (
    <div className="space-y-6">
      {/* Content Formats */}
      <div>
        <Label>Content Formats *</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
          {contentFormats.map((format: any) => {
            const IconComponent = format.icon;
            const isSelected = watchedValues.contentFormats?.includes(format.value);
            return (
              <div
                key={format.value}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => {
                  const currentFormats = watchedValues.contentFormats || [];
                  const newFormats = isSelected
                    ? currentFormats.filter((f: string) => f !== format.value)
                    : [...currentFormats, format.value];
                  setValue('contentFormats', newFormats);
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <IconComponent className="h-6 w-6 mb-2 text-blue-600" />
                  <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                    {format.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {errors.contentFormats && (
          <p className="text-sm text-red-600 mt-1">{errors.contentFormats.message}</p>
        )}
      </div>

      {/* Posting Frequency */}
      <div>
        <Label htmlFor="postingFrequency">Posting Frequency *</Label>
        <Select value={watchedValues.postingFrequency} onValueChange={(value) => setValue('postingFrequency', value)}>
          <SelectTrigger className={`mt-2 ${errors.postingFrequency ? 'border-red-500' : ''}`}>
            <SelectValue placeholder="Select posting frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="3-times-week">3 times per week</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
        {errors.postingFrequency && (
          <p className="text-sm text-red-600 mt-1">{errors.postingFrequency.message}</p>
        )}
      </div>

      {/* Content Themes */}
      <div>
        <Label>Content Themes *</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {themes.map((theme: string) => {
            const isSelected = watchedValues.contentThemes?.includes(theme);
            return (
              <div
                key={theme}
                className={`p-3 border rounded-lg cursor-pointer transition-all text-sm ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => {
                  const currentThemes = watchedValues.contentThemes || [];
                  const newThemes = isSelected
                    ? currentThemes.filter((t: string) => t !== theme)
                    : [...currentThemes, theme];
                  setValue('contentThemes', newThemes);
                }}
              >
                {theme}
              </div>
            );
          })}
        </div>
        {errors.contentThemes && (
          <p className="text-sm text-red-600 mt-1">{errors.contentThemes.message}</p>
        )}
      </div>

      {/* Brand Voice */}
      <div>
        <Label htmlFor="brandVoice">Brand Voice *</Label>
        <Select value={watchedValues.brandVoice} onValueChange={(value) => setValue('brandVoice', value)}>
          <SelectTrigger className={`mt-2 ${errors.brandVoice ? 'border-red-500' : ''}`}>
            <SelectValue placeholder="Select brand voice" />
          </SelectTrigger>
          <SelectContent>
            {brandVoices.map((voice: string) => (
              <SelectItem key={voice} value={voice.toLowerCase()}>
                {voice}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.brandVoice && (
          <p className="text-sm text-red-600 mt-1">{errors.brandVoice.message}</p>
        )}
      </div>

      {/* Content Length */}
      <div>
        <Label htmlFor="contentLength">Content Length *</Label>
        <Select value={watchedValues.contentLength} onValueChange={(value) => setValue('contentLength', value)}>
          <SelectTrigger className={`mt-2 ${errors.contentLength ? 'border-red-500' : ''}`}>
            <SelectValue placeholder="Select content length" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="short">Short (&lt; 100 words)</SelectItem>
            <SelectItem value="medium">Medium (100-300 words)</SelectItem>
            <SelectItem value="long">Long (300+ words)</SelectItem>
            <SelectItem value="mixed">Mixed lengths</SelectItem>
          </SelectContent>
        </Select>
        {errors.contentLength && (
          <p className="text-sm text-red-600 mt-1">{errors.contentLength.message}</p>
        )}
      </div>
    </div>
  );
}

function IntegrationsStep({ form, platforms }: any) {
  const { setValue, watch, formState: { errors } } = form;
  const watchedValues = watch();

  return (
    <div className="space-y-6">
      {/* Platforms */}
      <div>
        <Label>Social Media Platforms *</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
          {platforms.map((platform: any) => {
            const IconComponent = platform.icon;
            const isSelected = watchedValues.platforms?.includes(platform.value);
            return (
              <div
                key={platform.value}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => {
                  const currentPlatforms = watchedValues.platforms || [];
                  const newPlatforms = isSelected
                    ? currentPlatforms.filter((p: string) => p !== platform.value)
                    : [...currentPlatforms, platform.value];
                  setValue('platforms', newPlatforms);
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <IconComponent className={`h-6 w-6 mb-2 ${platform.color}`} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                    {platform.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {errors.platforms && (
          <p className="text-sm text-red-600 mt-1">{errors.platforms.message}</p>
        )}
      </div>

      {/* AI Tools */}
      <div>
        <Label>AI Tools (Optional)</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {['Content Generation', 'Image Creation', 'Video Editing', 'Hashtag Research', 'Analytics', 'Scheduling'].map((tool) => {
            const isSelected = watchedValues.aiTools?.includes(tool);
            return (
              <div
                key={tool}
                className={`p-3 border rounded-lg cursor-pointer transition-all text-sm ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => {
                  const currentTools = watchedValues.aiTools || [];
                  const newTools = isSelected
                    ? currentTools.filter((t: string) => t !== tool)
                    : [...currentTools, tool];
                  setValue('aiTools', newTools);
                }}
              >
                {tool}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scheduling Preferences */}
      <div className="space-y-4">
        <Label>Scheduling Preferences</Label>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="autoSchedule"
            checked={watchedValues.schedulingPreferences?.autoSchedule || false}
            onChange={(e) => setValue('schedulingPreferences.autoSchedule', e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="autoSchedule" className="text-sm">
            Enable automatic scheduling
          </Label>
        </div>

        <div>
          <Label htmlFor="timeZone">Time Zone</Label>
          <Select 
            value={watchedValues.schedulingPreferences?.timeZone || 'UTC'} 
            onValueChange={(value) => setValue('schedulingPreferences.timeZone', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select time zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
              <SelectItem value="America/New_York">EST (Eastern Time)</SelectItem>
              <SelectItem value="America/Los_Angeles">PST (Pacific Time)</SelectItem>
              <SelectItem value="Europe/London">GMT (Greenwich Mean Time)</SelectItem>
              <SelectItem value="Asia/Kolkata">IST (Indian Standard Time)</SelectItem>
              <SelectItem value="Europe/Paris">CET (Central European Time)</SelectItem>
              <SelectItem value="Asia/Tokyo">JST (Japan Standard Time)</SelectItem>
              <SelectItem value="Australia/Sydney">AEST (Australian Eastern Time)</SelectItem>
              <SelectItem value="Asia/Dubai">GST (Gulf Standard Time)</SelectItem>
              <SelectItem value="Asia/Singapore">SGT (Singapore Time)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function ScheduleStep({ form, projectData }: any) {
  const { register, setValue, watch, formState: { errors } } = form;
  const watchedValues = watch();

  // Get the current timezone from integrations step or default to user's timezone
  const selectedTimezone = projectData.integrations?.schedulingPreferences?.timeZone || 
                          Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // Set default start date to today in the selected timezone
  React.useEffect(() => {
    if (!watchedValues.startDate) {
      const todayInTimezone = getCurrentDateInTimezone(selectedTimezone);
      setValue('startDate', todayInTimezone);
    }
  }, [selectedTimezone, setValue, watchedValues.startDate]);

  return (
    <div className="space-y-6">
      {/* Project Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Project Summary</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Name:</strong> {projectData.basics?.name || 'Not specified'}</p>
          <p><strong>Type:</strong> {projectData.basics?.contentType || 'Not specified'}</p>
          <p><strong>Platforms:</strong> {projectData.integrations?.platforms?.join(', ') || 'Not specified'}</p>
          <p><strong>Posting Frequency:</strong> {projectData.content?.postingFrequency || 'Not specified'}</p>
          <p><strong>Time Zone:</strong> {selectedTimezone}</p>
        </div>
      </div>

      {/* Start Date */}
      <div>
        <Label htmlFor="startDate">Project Start Date *</Label>
        <Input
          id="startDate"
          type="date"
          {...register('startDate')}
          className={`mt-2 ${errors.startDate ? 'border-red-500' : ''}`}
          min={getCurrentDateInTimezone(selectedTimezone)} // Prevent selecting past dates
        />
        {errors.startDate && (
          <p className="text-sm text-red-600 mt-1">{errors.startDate.message}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Date will be set in {selectedTimezone} timezone
        </p>
      </div>

      {/* Duration */}
      <div>
        <Label htmlFor="duration">Project Duration *</Label>
        <Select value={watchedValues.duration} onValueChange={(value) => setValue('duration', value)}>
          <SelectTrigger className={`mt-2 ${errors.duration ? 'border-red-500' : ''}`}>
            <SelectValue placeholder="Select project duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1-month">1 Month</SelectItem>
            <SelectItem value="3-months">3 Months</SelectItem>
            <SelectItem value="6-months">6 Months</SelectItem>
            <SelectItem value="1-year">1 Year</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
          </SelectContent>
        </Select>
        {errors.duration && (
          <p className="text-sm text-red-600 mt-1">{errors.duration.message}</p>
        )}
      </div>

      {/* Budget */}
      <div>
        <Label htmlFor="budget">Budget (Optional)</Label>
        <Select value={watchedValues.budget} onValueChange={(value) => setValue('budget', value)}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select budget range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="under-1000">Under $1,000</SelectItem>
            <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
            <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
            <SelectItem value="10000-plus">$10,000+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Members */}
      <div>
        <Label htmlFor="teamMembers">Team Members (Optional)</Label>
        <Textarea
          id="teamMembers"
          placeholder="Enter team member emails, separated by commas..."
          className="mt-2"
          rows={3}
          onChange={(e) => {
            const members = e.target.value.split(',').map(m => m.trim()).filter(Boolean);
            setValue('teamMembers', members);
          }}
        />
      </div>

      {/* Final Review */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Ready to Create Your Project?</h3>
        <p className="text-sm text-blue-700">
          Review all the information above and click "Create Project" to finalize your social media project setup.
        </p>
      </div>
    </div>
  );
}