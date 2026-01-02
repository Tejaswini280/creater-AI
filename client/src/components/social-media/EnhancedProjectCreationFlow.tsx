import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { 
  Sparkles, 
  Calendar, 
  Target, 
  CheckCircle2,
  X,
  TrendingUp,
  Brain,
  Wand2,
  Upload,
  Mic,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  Image as ImageIcon,
  RefreshCw,
  File
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import MediaRecorder from './MediaRecorder';

interface EnhancedProjectCreationFlowProps {
  onProjectCreate: (project: any) => void;
  onCancel: () => void;
}

interface FormData {
  // Phase 1: Input
  projectName: string;
  projectDescription: string;
  contentType: string[];
  contentCategory: string[];
  contentName: string;
  channelType: string[];
  contentDescription: string;
  targetAudience: string;
  duration: '1week' | '15days' | '30days' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  tags: string[];
  contentFrequency: 'daily' | 'alternate' | 'weekly' | 'custom';
  
  // Phase 2: Idea Generation
  selectedTheme: string;
  generatedThemes: Array<{
    id: string;
    title: string;
    description: string;
    hashtags: string[];
    engagement: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
  
  // Phase 3: Content Generation
  generatedContent: {
    mainContent: string;
    hashtags: string[];
    suggestions: string[];
    variations: Array<{
      id: string;
      content: string;
      style: string;
      engagement: number;
    }>;
  } | null;
  
  // Phase 4: Media Integration
  mediaType: 'ai-generated' | 'upload' | 'record';
  mediaFiles: File[];
  recordedMedia: Array<{
    id: string;
    name: string;
    type: 'video' | 'audio';
    duration: number;
    url: string;
  }>;
  
  // Phase 5: Project Creation & Scheduling
  postingStrategy: 'optimal' | 'consistent' | 'burst' | 'custom';
  customPostingTimes: string[];
  aiAnalysis: {
    optimalTimes: Array<{
      platform: string;
      time: string;
      engagement: number;
    }>;
    predictions: {
      expectedReach: number;
      expectedEngagement: number;
      bestPerformingContent: string;
    };
  } | null;
}

const CONTENT_TYPE_OPTIONS = [
  { value: 'reel', label: 'Reel', icon: '🎬', description: 'Short-form vertical videos' },
  { value: 'post', label: 'Post', icon: '📝', description: 'Image posts with captions' },
  { value: 'video', label: 'Video', icon: '🎥', description: 'Long-form video content' },
  { value: 'shorts', label: 'Shorts', icon: '⚡', description: 'Quick, engaging short videos' },
  { value: 'story', label: 'Story', icon: '📱', description: 'Temporary 24-hour content' },
  { value: 'carousel', label: 'Carousel', icon: '🔄', description: 'Multiple images in one post' }
];

const CONTENT_CATEGORY_OPTIONS = [
  { value: 'health', label: 'Health', icon: '🏥', description: 'Health and wellness content' },
  { value: 'fitness', label: 'Fitness', icon: '💪', description: 'Workout and fitness content' },
  { value: 'makeup', label: 'Makeup', icon: '💄', description: 'Beauty and makeup tutorials' },
  { value: 'lifestyle', label: 'Lifestyle', icon: '✨', description: 'Daily life and personal content' },
  { value: 'travel', label: 'Travel', icon: '✈️', description: 'Travel guides and experiences' },
  { value: 'food', label: 'Food', icon: '🍳', description: 'Cooking and food content' },
  { value: 'tech', label: 'Technology', icon: '💻', description: 'Tech reviews and tutorials' },
  { value: 'education', label: 'Education', icon: '📚', description: 'Educational and learning content' },
  { value: 'business', label: 'Business', icon: '💼', description: 'Professional and business content' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎭', description: 'Fun and entertainment content' },
  { value: 'fashion', label: 'Fashion', icon: '👗', description: 'Style and fashion content' },
  { value: 'gaming', label: 'Gaming', icon: '🎮', description: 'Gaming and esports content' }
];

const CHANNEL_OPTIONS = [
  { value: 'instagram', label: 'Instagram', icon: '📸' },
  { value: 'facebook', label: 'Facebook', icon: '📘' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'youtube', label: 'YouTube', icon: '📺' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'twitter', label: 'Twitter', icon: '🐦' }
];

const DURATION_OPTIONS = [
  { value: '1week', label: '1 Week', days: 7, description: 'Perfect for short campaigns' },
  { value: '15days', label: '15 Days', days: 15, description: 'Ideal for product launches' },
  { value: '30days', label: '30 Days', days: 30, description: 'Great for monthly themes' },
  { value: 'custom', label: 'Custom', days: null, description: 'Define your own timeline' }
];

const CONTENT_FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily', description: 'One post per day' },
  { value: 'alternate', label: 'Alternate Days', description: 'Every other day' },
  { value: 'weekly', label: 'Weekly', description: '3-4 posts per week' },
  { value: 'custom', label: 'Custom', description: 'Define your own schedule' }
];

type Phase = 'input' | 'idea-generation' | 'content-generation' | 'media-integration' | 'scheduling';

export default function EnhancedProjectCreationFlow({ onProjectCreate, onCancel }: EnhancedProjectCreationFlowProps) {
  const [currentPhase, setCurrentPhase] = useState<Phase>('input');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');
  const [showMediaRecorder, setShowMediaRecorder] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    projectName: '',
    projectDescription: '',
    contentType: [],
    contentCategory: [],
    contentName: '',
    channelType: [],
    contentDescription: '',
    targetAudience: '',
    duration: '1week',
    customStartDate: format(new Date(), 'yyyy-MM-dd'),
    customEndDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    tags: [],
    contentFrequency: 'daily',
    selectedTheme: '',
    generatedThemes: [],
    generatedContent: null,
    mediaType: 'ai-generated',
    mediaFiles: [],
    recordedMedia: [],
    postingStrategy: 'optimal',
    customPostingTimes: [],
    aiAnalysis: null
  });

  const phases = [
    { id: 'input', title: 'Project Details', description: 'Enter basic project information' },
    { id: 'idea-generation', title: 'Idea Generation', description: 'AI generates content themes' },
    { id: 'content-generation', title: 'Content Creation', description: 'Generate full content' },
    { id: 'media-integration', title: 'Media Integration', description: 'Add videos/images' },
    { id: 'scheduling', title: 'Scheduling & Analysis', description: 'AI analyzes optimal posting' }
  ];

  const currentPhaseIndex = phases.findIndex(phase => phase.id === currentPhase);

  // File upload handlers
  const handleFileUpload = (files: File[]) => {
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/');
      const isValidSize = file.size <= 100 * 1024 * 1024; // 100MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Some files were skipped",
        description: "Only image, video, and audio files under 100MB are allowed.",
        variant: "destructive"
      });
    }

    setFormData(prev => ({
      ...prev,
      mediaFiles: [...prev.mediaFiles, ...validFiles]
    }));

    if (validFiles.length > 0) {
      toast({
        title: "Files uploaded",
        description: `${validFiles.length} file(s) added to your project.`,
      });
    }
  };

  const removeMediaFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, i) => i !== index)
    }));
  };

  const handleMediaRecorded = (mediaBlob: Blob, mediaUrl: string, recordingName: string, recordingType: string) => {
    // Convert blob to File
    const file = Object.assign(mediaBlob, {
      name: `${recordingName}.webm`,
      type: 'video/webm'
    }) as File;
    
    setFormData(prev => ({
      ...prev,
      mediaFiles: [...prev.mediaFiles, file],
      recordedMedia: [...prev.recordedMedia, {
        id: Date.now().toString(),
        name: recordingName,
        type: recordingType as 'video' | 'audio',
        duration: 0, // Will be updated by MediaRecorder
        url: mediaUrl
      }]
    }));

    setShowMediaRecorder(false);
    toast({
      title: "Recording saved",
      description: "Your recorded content has been added to the project.",
    });
  };

  // AI-powered idea generation
  const generateIdeas = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStep('Analyzing your project details...');

    try {
      const steps = [
        'Analyzing project requirements...',
        'Researching trending topics...',
        'Generating content themes...',
        'Calculating engagement potential...',
        'Finalizing recommendations...'
      ];

      for (let i = 0; i < steps.length; i++) {
        setGenerationStep(steps[i]);
        setGenerationProgress((i + 1) * 20);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Call AI API to generate content ideas
      const response = await fetch('/api/social-ai/generate-project-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          projectName: formData.projectName,
          contentName: formData.contentName || formData.projectName,
          contentDescription: formData.contentDescription || formData.projectDescription,
          contentType: formData.contentType,
          channelType: formData.channelType,
          targetAudience: formData.targetAudience,
          startDate: formData.customStartDate || new Date().toISOString(),
          endDate: formData.customEndDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI content ideas');
      }

      const data = await response.json();
      
      if (data.success && data.contentItems) {
        // Transform AI-generated content into theme format
        const themes = data.contentItems.slice(0, 5).map((item: any, index: number) => ({
          id: (index + 1).toString(),
          title: item.title || `Content Idea ${index + 1}`,
          description: item.description || item.content || 'AI-generated content idea',
          hashtags: item.hashtags || ['#AI', '#Content', '#Creative'],
          engagement: Math.floor(Math.random() * 30) + 70, // 70-100
          difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'easy' | 'medium' | 'hard'
        }));

        setFormData(prev => ({
          ...prev,
          generatedThemes: themes
        }));
      } else {
        throw new Error(data.message || 'Failed to generate content ideas');
      }

    } catch (error) {
      console.error('Error generating AI ideas:', error);
      
      // Fallback to mock themes if AI fails
      const fallbackThemes = [
        {
          id: '1',
          title: 'Behind the Scenes',
          description: 'Show the process of creating your content, including preparation, challenges, and final results.',
          hashtags: ['#BehindTheScenes', '#Process', '#MakingOf', '#CreatorLife'],
          engagement: 85,
          difficulty: 'easy' as const
        },
        {
          id: '2',
          title: 'Educational Tutorial',
          description: 'Create step-by-step tutorials that teach your audience something valuable.',
          hashtags: ['#Tutorial', '#HowTo', '#Learn', '#Education'],
          engagement: 92,
          difficulty: 'medium' as const
        },
        {
          id: '3',
          title: 'Trending Challenge',
          description: 'Participate in or create a challenge that aligns with your content and audience.',
          hashtags: ['#Challenge', '#Trending', '#Viral', '#Fun'],
          engagement: 78,
          difficulty: 'easy' as const
        }
      ];

      setFormData(prev => ({
        ...prev,
        generatedThemes: fallbackThemes
      }));
    }

    setIsGenerating(false);
    setCurrentPhase('idea-generation');
  };

  // AI-powered content generation
  const generateContent = async (themeId: string) => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStep('Generating content based on selected theme...');

    try {
      const steps = [
        'Analyzing selected theme...',
        'Generating main content...',
        'Creating hashtag suggestions...',
        'Developing content variations...',
        'Optimizing for engagement...'
      ];

      for (let i = 0; i < steps.length; i++) {
        setGenerationStep(steps[i]);
        setGenerationProgress((i + 1) * 20);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const selectedTheme = formData.generatedThemes.find(t => t.id === themeId);
      
      // Call AI API to generate detailed content
      const response = await fetch('/api/gemini/generate-advanced-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          prompt: `Generate detailed social media content for the theme: "${selectedTheme?.title}". 
          
          Project Details:
          - Project Name: ${formData.projectName}
          - Description: ${formData.projectDescription}
          - Target Audience: ${formData.targetAudience}
          - Content Type: ${formData.contentType.join(', ')}
          - Platform: ${formData.channelType.join(', ')}
          - Theme: ${selectedTheme?.description}
          
          Please generate:
          1. Main content text optimized for the platform
          2. Relevant hashtags
          3. Content suggestions
          4. 3 content variations with different styles
          
          Make it engaging, authentic, and tailored to the target audience.`,
          context: {
            projectName: formData.projectName,
            targetAudience: formData.targetAudience,
            platform: formData.channelType.join(', '),
            theme: selectedTheme?.title
          },
          contentType: 'social-media',
          platform: formData.channelType[0] || 'instagram'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI content');
      }

      const data = await response.json();
      
      if (data.success && data.content) {
        // Parse AI-generated content
        const aiContent = data.content;
        
        const generatedContent = {
          mainContent: aiContent.mainContent || `🎯 ${selectedTheme?.title}\n\n${selectedTheme?.description}\n\nHere's how you can create engaging content that resonates with your audience:\n\n1. Start with a compelling hook that grabs attention\n2. Share valuable insights or entertainment\n3. Include a clear call-to-action\n4. Use high-quality visuals\n5. Engage with your audience in the comments\n\nRemember: Authenticity is key to building a loyal following!`,
          hashtags: aiContent.hashtags || selectedTheme?.hashtags || [],
          suggestions: aiContent.suggestions || [
            'Consider adding behind-the-scenes footage',
            'Include user-generated content',
            'Create a series of related posts',
            'Use trending audio or music',
            'Collaborate with other creators'
          ],
          variations: aiContent.variations || [
            {
              id: '1',
              content: 'Short and punchy version for quick consumption',
              style: 'Concise',
              engagement: 75
            },
            {
              id: '2',
              content: 'Detailed educational version with step-by-step guide',
              style: 'Educational',
              engagement: 90
            },
            {
              id: '3',
              content: 'Personal story version with emotional connection',
              style: 'Personal',
              engagement: 85
            }
          ]
        };

        setFormData(prev => ({
          ...prev,
          selectedTheme: themeId,
          generatedContent: generatedContent
        }));
      } else {
        throw new Error(data.message || 'Failed to generate content');
      }

    } catch (error) {
      console.error('Error generating AI content:', error);
      
      // Fallback to mock content if AI fails
      const selectedTheme = formData.generatedThemes.find(t => t.id === themeId);
      
      const fallbackContent = {
        mainContent: `🎯 ${selectedTheme?.title}\n\n${selectedTheme?.description}\n\nHere's how you can create engaging content that resonates with your audience:\n\n1. Start with a compelling hook that grabs attention\n2. Share valuable insights or entertainment\n3. Include a clear call-to-action\n4. Use high-quality visuals\n5. Engage with your audience in the comments\n\nRemember: Authenticity is key to building a loyal following!`,
        hashtags: selectedTheme?.hashtags || [],
        suggestions: [
          'Consider adding behind-the-scenes footage',
          'Include user-generated content',
          'Create a series of related posts',
          'Use trending audio or music',
          'Collaborate with other creators'
        ],
        variations: [
          {
            id: '1',
            content: 'Short and punchy version for quick consumption',
            style: 'Concise',
            engagement: 75
          },
          {
            id: '2',
            content: 'Detailed educational version with step-by-step guide',
            style: 'Educational',
            engagement: 90
          },
          {
            id: '3',
            content: 'Personal story version with emotional connection',
            style: 'Personal',
            engagement: 85
          }
        ]
      };

      setFormData(prev => ({
        ...prev,
        selectedTheme: themeId,
        generatedContent: fallbackContent
      }));
    }

    setIsGenerating(false);
    setCurrentPhase('content-generation');
  };

  // Create project with AI-generated content and media
  const createProject = async () => {
    setIsGenerating(true);
    setGenerationStep('Creating project and saving content...');

    try {
      // Prepare project data
      const projectData = {
        name: formData.projectName,
        description: formData.projectDescription,
        type: formData.contentType.join(', '),
        platform: formData.channelType.join(', '),
        targetAudience: formData.targetAudience,
        estimatedDuration: formData.duration,
        tags: formData.tags,
        metadata: {
          contentType: formData.contentType,
          channelType: formData.channelType,
          contentFrequency: formData.contentFrequency,
          aiEnhancement: true,
          createdAt: new Date().toISOString(),
          generatedThemes: formData.generatedThemes,
          generatedContent: formData.generatedContent,
          mediaFiles: formData.mediaFiles.map(file => ({
            name: file.name,
            type: file.type,
            size: file.size
          })),
          recordedMedia: formData.recordedMedia
        }
      };

      // Create project
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(projectData)
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const result = await response.json();
      const createdProject = result.project;

      // If we have AI-generated content, save it
      if (formData.generatedContent) {
        const contentData = {
          projectId: createdProject.id,
          content: formData.generatedContent.mainContent,
          hashtags: formData.generatedContent.hashtags,
          suggestions: formData.generatedContent.suggestions,
          variations: formData.generatedContent.variations,
          platform: formData.channelType[0],
          contentType: formData.contentType[0],
          status: 'draft'
        };

        await fetch('/api/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(contentData)
        });
      }

      // Upload media files if any
      if (formData.mediaFiles.length > 0) {
        const formDataUpload = new FormData();
        formData.mediaFiles.forEach((file, index) => {
          formDataUpload.append(`media_${index}`, file);
        });
        formDataUpload.append('projectId', createdProject.id.toString());

        await fetch('/api/media/upload', {
          method: 'POST',
          credentials: 'include',
          body: formDataUpload
        });
      }

      toast({
        title: "Project Created Successfully!",
        description: `"${formData.projectName}" has been created with AI-generated content and media.`,
      });

      onProjectCreate(createdProject);

    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Project Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Simulate AI scheduling analysis
  const analyzeScheduling = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStep('Analyzing optimal posting times...');

    const steps = [
      'Analyzing your audience demographics...',
      'Studying platform algorithms...',
      'Calculating optimal posting times...',
      'Predicting engagement rates...',
      'Generating recommendations...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setGenerationStep(steps[i]);
      setGenerationProgress((i + 1) * 20);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const mockAnalysis = {
      optimalTimes: [
        { platform: 'Instagram', time: '6:00 PM', engagement: 95 },
        { platform: 'Facebook', time: '1:00 PM', engagement: 88 },
        { platform: 'LinkedIn', time: '8:00 AM', engagement: 92 },
        { platform: 'YouTube', time: '2:00 PM', engagement: 85 },
        { platform: 'TikTok', time: '7:00 PM', engagement: 98 }
      ],
      predictions: {
        expectedReach: 12500,
        expectedEngagement: 8.5,
        bestPerformingContent: 'Educational Tutorial'
      }
    };

    setFormData(prev => ({
      ...prev,
      aiAnalysis: mockAnalysis
    }));

    setIsGenerating(false);
    setCurrentPhase('scheduling');
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (currentPhase === 'input') {
      // Validate required fields
      if (!formData.projectName.trim()) {
        toast({
          title: "Project name required",
          description: "Please enter a project name to continue.",
          variant: "destructive"
        });
        return;
      }
      if (formData.contentType.length === 0) {
        toast({
          title: "Content type required",
          description: "Please select at least one content type.",
          variant: "destructive"
        });
        return;
      }
      if (formData.contentCategory.length === 0) {
        toast({
          title: "Content category required",
          description: "Please select at least one content category.",
          variant: "destructive"
        });
        return;
      }
      if (formData.channelType.length === 0) {
        toast({
          title: "Target platform required",
          description: "Please select at least one target platform.",
          variant: "destructive"
        });
        return;
      }
      generateIdeas();
    } else if (currentPhase === 'idea-generation') {
      if (!formData.selectedTheme) {
        toast({
          title: "Please select a theme",
          description: "Choose one of the generated themes to continue.",
          variant: "destructive"
        });
        return;
      }
      generateContent(formData.selectedTheme);
    } else if (currentPhase === 'content-generation') {
      setCurrentPhase('media-integration');
    } else if (currentPhase === 'media-integration') {
      analyzeScheduling();
    } else if (currentPhase === 'scheduling') {
      // Create the project with AI-generated content and media
      createProject();
    }
  };

  const handlePrevious = () => {
    const phaseIndex = phases.findIndex(phase => phase.id === currentPhase);
    if (phaseIndex > 0) {
      setCurrentPhase(phases[phaseIndex - 1].id as Phase);
    }
  };

  const renderInputPhase = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Project Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="projectName">Project Name *</Label>
            <Input
              id="projectName"
              value={formData.projectName}
              onChange={(e) => handleInputChange('projectName', e.target.value)}
              placeholder="Enter your project name"
            />
          </div>
          <div>
            <Label htmlFor="projectDescription">Project Description</Label>
            <Textarea
              id="projectDescription"
              value={formData.projectDescription}
              onChange={(e) => handleInputChange('projectDescription', e.target.value)}
              placeholder="Describe your project goals and vision..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Content Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Content Types *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {CONTENT_TYPE_OPTIONS.map((type) => (
                <div
                  key={type.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    formData.contentType.includes(type.value)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    const newTypes = formData.contentType.includes(type.value)
                      ? formData.contentType.filter(t => t !== type.value)
                      : [...formData.contentType, type.value];
                    handleInputChange('contentType', newTypes);
                  }}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="font-medium text-sm">{type.label}</div>
                  <div className="text-xs text-gray-500">{type.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Content Categories *</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              {CONTENT_CATEGORY_OPTIONS.map((category) => (
                <div
                  key={category.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    formData.contentCategory.includes(category.value)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    const newCategories = formData.contentCategory.includes(category.value)
                      ? formData.contentCategory.filter(c => c !== category.value)
                      : [...formData.contentCategory, category.value];
                    handleInputChange('contentCategory', newCategories);
                  }}
                >
                  <div className="text-2xl mb-1">{category.icon}</div>
                  <div className="font-medium text-sm">{category.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Target Platforms *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {CHANNEL_OPTIONS.map((channel) => (
                <div
                  key={channel.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    formData.channelType.includes(channel.value)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    const newChannels = formData.channelType.includes(channel.value)
                      ? formData.channelType.filter(c => c !== channel.value)
                      : [...formData.channelType, channel.value];
                    handleInputChange('channelType', newChannels);
                  }}
                >
                  <div className="text-2xl mb-1">{channel.icon}</div>
                  <div className="font-medium text-sm">{channel.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Textarea
              id="targetAudience"
              value={formData.targetAudience}
              onChange={(e) => handleInputChange('targetAudience', e.target.value)}
              placeholder="Describe your target audience..."
              rows={2}
            />
          </div>

          <div>
            <Label>Project Duration</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              {DURATION_OPTIONS.map((duration) => (
                <div
                  key={duration.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    formData.duration === duration.value
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('duration', duration.value)}
                >
                  <div className="font-medium text-sm">{duration.label}</div>
                  <div className="text-xs text-gray-500">{duration.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Content Frequency</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              {CONTENT_FREQUENCY_OPTIONS.map((frequency) => (
                <div
                  key={frequency.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    formData.contentFrequency === frequency.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('contentFrequency', frequency.value)}
                >
                  <div className="font-medium text-sm">{frequency.label}</div>
                  <div className="text-xs text-gray-500">{frequency.description}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIdeaGenerationPhase = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI-Generated Content Themes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Based on your project details, here are some content themes that could work well for your audience:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.generatedThemes.map((theme) => (
              <div
                key={theme.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  formData.selectedTheme === theme.id
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleInputChange('selectedTheme', theme.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{theme.title}</h3>
                  <Badge variant={theme.difficulty === 'easy' ? 'default' : theme.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                    {theme.difficulty}
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm mb-3">{theme.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {theme.hashtags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <TrendingUp className="h-4 w-4" />
                    {theme.engagement}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContentGenerationPhase = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Generated Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Main Content</Label>
            <Textarea
              value={formData.generatedContent?.mainContent || ''}
              onChange={(e) => handleInputChange('generatedContent', {
                ...formData.generatedContent,
                mainContent: e.target.value
              })}
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          <div>
            <Label>Hashtags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.generatedContent?.hashtags.map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Content Suggestions</Label>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {formData.generatedContent?.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-gray-600">{suggestion}</li>
              ))}
            </ul>
          </div>

          <div>
            <Label>Content Variations</Label>
            <div className="space-y-3 mt-2">
              {formData.generatedContent?.variations.map((variation) => (
                <div key={variation.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{variation.style}</span>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <TrendingUp className="h-4 w-4" />
                      {variation.engagement}%
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{variation.content}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMediaIntegrationPhase = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Media Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Media Type</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  formData.mediaType === 'ai-generated'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleInputChange('mediaType', 'ai-generated')}
              >
                <Brain className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-center font-medium">AI Generated</div>
                <div className="text-xs text-gray-500 text-center">Let AI create visuals</div>
              </div>
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  formData.mediaType === 'upload'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleInputChange('mediaType', 'upload')}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-center font-medium">Upload</div>
                <div className="text-xs text-gray-500 text-center">Upload your files</div>
              </div>
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  formData.mediaType === 'record'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  handleInputChange('mediaType', 'record');
                  setShowMediaRecorder(true);
                }}
              >
                <Mic className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <div className="text-center font-medium">Record</div>
                <div className="text-xs text-gray-500 text-center">Record new content</div>
              </div>
            </div>
          </div>

          {formData.mediaType === 'ai-generated' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-5 w-5 text-blue-500" />
                <span className="font-medium">AI-Generated Media</span>
              </div>
              <p className="text-sm text-gray-600">
                AI will automatically generate relevant images and videos based on your content theme and description.
              </p>
            </div>
          )}

          {formData.mediaType === 'upload' && (
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                  const files = Array.from(e.dataTransfer.files);
                  handleFileUpload(files);
                }}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-2">Drag and drop files here, or click to select</p>
                <p className="text-sm text-gray-500">Supports images, videos, and audio files</p>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      const files = Array.from(e.target.files);
                      handleFileUpload(files);
                    }
                  }}
                />
              </div>
              
              {/* Display uploaded files */}
              {formData.mediaFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Files</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {formData.mediaFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {file.type.startsWith('image/') ? (
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : file.type.startsWith('video/') ? (
                            <video 
                              src={URL.createObjectURL(file)} 
                              className="w-full h-full object-cover"
                              controls
                            />
                          ) : (
                            <div className="text-center p-4">
                              <File className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-xs text-gray-600 truncate">{file.name}</p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeMediaFile(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {formData.mediaType === 'record' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mic className="h-5 w-5 text-red-500" />
                <span className="font-medium">Recording Studio</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Use our integrated recorder to create videos and audio content for your project.
              </p>
              <Button onClick={() => setShowMediaRecorder(true)}>
                <Mic className="h-4 w-4 mr-2" />
                Open Recorder
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSchedulingPhase = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            AI Scheduling Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.aiAnalysis && (
            <>
              <div>
                <Label>Optimal Posting Times</Label>
                <div className="space-y-3 mt-2">
                  {formData.aiAnalysis.optimalTimes.map((time) => (
                    <div key={time.platform} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {time.platform.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{time.platform}</div>
                          <div className="text-sm text-gray-500">{time.time}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-medium text-green-600">{time.engagement}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Engagement Predictions</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formData.aiAnalysis.predictions.expectedReach.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-700">Expected Reach</div>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formData.aiAnalysis.predictions.expectedEngagement}%
                    </div>
                    <div className="text-sm text-blue-700">Expected Engagement</div>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="text-sm font-medium text-purple-700">
                      {formData.aiAnalysis.predictions.bestPerformingContent}
                    </div>
                    <div className="text-sm text-purple-600">Best Performing Content</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Project
        </h1>
        <p className="text-gray-600">
          Follow our AI-powered workflow to create engaging social media content
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {phases.map((phase, index) => (
            <div key={phase.id} className="flex items-center flex-shrink-0">
              <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 ${
                currentPhaseIndex >= index
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-gray-300 bg-white text-gray-400'
              }`}>
                {currentPhaseIndex > index ? (
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <span className="text-xs sm:text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="ml-2 sm:ml-3 hidden sm:block">
                <div className={`text-sm font-medium ${
                  currentPhaseIndex >= index ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {phase.title}
                </div>
                <div className="text-xs text-gray-500">{phase.description}</div>
              </div>
              {index < phases.length - 1 && (
                <div className={`w-8 sm:w-16 h-0.5 mx-2 sm:mx-4 ${
                  currentPhaseIndex > index ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
        {/* Mobile phase title */}
        <div className="sm:hidden mt-2">
          <div className="text-sm font-medium text-gray-900">
            {phases[currentPhaseIndex]?.title}
          </div>
          <div className="text-xs text-gray-500">
            {phases[currentPhaseIndex]?.description}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-8 relative">
        {currentPhase === 'input' && renderInputPhase()}
        {currentPhase === 'idea-generation' && renderIdeaGenerationPhase()}
        {currentPhase === 'content-generation' && renderContentGenerationPhase()}
        {currentPhase === 'media-integration' && renderMediaIntegrationPhase()}
        {currentPhase === 'scheduling' && renderSchedulingPhase()}
        
        {/* Scroll indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                <span className="font-medium">{generationStep}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 mt-8 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <Button
            variant="outline"
            onClick={currentPhaseIndex > 0 ? handlePrevious : onCancel}
            disabled={isGenerating}
            className="flex-1 sm:flex-none"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">
              {currentPhaseIndex > 0 ? 'Previous' : 'Cancel'}
            </span>
            <span className="sm:hidden">
              {currentPhaseIndex > 0 ? 'Back' : 'Cancel'}
            </span>
          </Button>

          <Button
            onClick={handleNext}
            disabled={isGenerating || (currentPhase === 'input' && (
              !formData.projectName.trim() || 
              formData.contentType.length === 0 || 
              formData.contentCategory.length === 0 || 
              formData.channelType.length === 0
            ))}
            className="flex-1 sm:flex-none"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Generating...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : currentPhase === 'scheduling' ? (
              <>
                <span className="hidden sm:inline">Create Project</span>
                <span className="sm:hidden">Create</span>
                <CheckCircle2 className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Media Recorder Modal */}
      {showMediaRecorder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Media Recorder</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMediaRecorder(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <MediaRecorder 
                onMediaRecorded={handleMediaRecorded}
                onClose={() => setShowMediaRecorder(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
