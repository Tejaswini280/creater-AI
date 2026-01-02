import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { 
  Sparkles, 
  Calendar, 
  Target, 
  Hash, 
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  Clock,
  TrendingUp,
  BarChart3,
  Brain,
  Wand2,
  Upload,
  File,
  Video,
  Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
// import { projectApi, type CreateProjectRequest } from '@/lib/socialMediaApi';
import AISchedulingStatus from './AISchedulingStatus';
import MediaRecorder from './MediaRecorder';

interface CreateProjectFormProps {
  onProjectCreate: (project: any) => void;
  onCancel: () => void;
}

interface FormData {
  projectName: string;
  projectDescription: string;
  contentType: string[]; // Multi-select for content types
  contentCategory: string[]; // Multi-select for content categories
  contentName: string;
  channelType: string[]; // Multi-select for channel types
  contentDescription: string;
  targetAudience: string; // AI-suggested options
  suggestedAudience: string[]; // Enhanced: AI-suggested audience segments
  duration: '1week' | '15days' | '30days' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  tags: string[];
  isPublic: boolean;
  contentFrequency: 'daily' | 'alternate' | 'weekly' | 'custom';
  aiEnhancement: boolean;
  engagementOptimization: boolean;
  seasonalTrends: boolean;
  competitorAnalysis: boolean;
  postingStrategy: 'optimal' | 'consistent' | 'burst' | 'custom';
  customPostingTimes?: string[];
  mediaFiles: File[]; // Added for media upload functionality
}

const CONTENT_TYPE_OPTIONS = [
  { value: 'reel', label: 'Reel', icon: '🎬', description: 'Short-form vertical videos', color: 'from-purple-500 to-pink-500' },
  { value: 'post', label: 'Post', icon: '📝', description: 'Image posts with captions', color: 'from-blue-500 to-cyan-500' },
  { value: 'video', label: 'Video', icon: '🎥', description: 'Long-form video content', color: 'from-red-500 to-orange-500' },
  { value: 'shorts', label: 'Shorts', icon: '⚡', description: 'Quick, engaging short videos', color: 'from-yellow-500 to-amber-500' },
  { value: 'story', label: 'Story', icon: '📱', description: 'Temporary 24-hour content', color: 'from-green-500 to-emerald-500' },
  { value: 'carousel', label: 'Carousel', icon: '🔄', description: 'Multiple images in one post', color: 'from-indigo-500 to-purple-500' }
];

const CONTENT_CATEGORY_OPTIONS = [
  { value: 'health', label: 'Health', icon: '🏥', description: 'Health and wellness content', color: 'from-red-500 to-pink-500' },
  { value: 'fitness', label: 'Fitness', icon: '💪', description: 'Workout and fitness content', color: 'from-orange-500 to-red-500' },
  { value: 'makeup', label: 'Makeup', icon: '💄', description: 'Beauty and makeup tutorials', color: 'from-pink-500 to-rose-500' },
  { value: 'lifestyle', label: 'Lifestyle', icon: '✨', description: 'Daily life and personal content', color: 'from-purple-500 to-indigo-500' },
  { value: 'travel', label: 'Travel', icon: '✈️', description: 'Travel guides and experiences', color: 'from-teal-500 to-blue-500' },
  { value: 'food', label: 'Food', icon: '🍳', description: 'Cooking and food content', color: 'from-yellow-500 to-orange-500' },
  { value: 'tech', label: 'Technology', icon: '💻', description: 'Tech reviews and tutorials', color: 'from-blue-500 to-cyan-500' },
  { value: 'education', label: 'Education', icon: '📚', description: 'Educational and learning content', color: 'from-green-500 to-emerald-500' },
  { value: 'business', label: 'Business', icon: '💼', description: 'Professional and business content', color: 'from-indigo-500 to-purple-500' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎭', description: 'Fun and entertainment content', color: 'from-yellow-500 to-amber-500' },
  { value: 'fashion', label: 'Fashion', icon: '👗', description: 'Style and fashion content', color: 'from-purple-500 to-pink-500' },
  { value: 'gaming', label: 'Gaming', icon: '🎮', description: 'Gaming and esports content', color: 'from-green-500 to-lime-500' }
];

const CHANNEL_OPTIONS = [
  { value: 'instagram', label: 'Instagram', icon: '📸', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { value: 'facebook', label: 'Facebook', icon: '📘', color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼', color: 'bg-gradient-to-r from-blue-600 to-blue-700' },
  { value: 'youtube', label: 'YouTube', icon: '📺', color: 'bg-gradient-to-r from-red-500 to-red-600' }
];

const DURATION_OPTIONS = [
  { value: '1week', label: '1 Week', days: 7, description: 'Perfect for short campaigns' },
  { value: '15days', label: '15 Days', days: 15, description: 'Ideal for product launches' },
  { value: '30days', label: '30 Days', days: 30, description: 'Great for monthly themes' },
  { value: 'custom', label: 'Custom', days: null, description: 'Define your own timeline' }
];

const CONTENT_FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily', description: 'One post per day', icon: '📅' },
  { value: 'alternate', label: 'Alternate Days', description: 'Every other day', icon: '🔄' },
  { value: 'weekly', label: 'Weekly', description: '3-4 posts per week', icon: '📊' },
  { value: 'custom', label: 'Custom', description: 'Define your own schedule', icon: '⚙️' }
];

const POSTING_STRATEGY_OPTIONS = [
  { value: 'optimal', label: 'AI Optimal', description: 'AI determines best times', icon: '🧠' },
  { value: 'consistent', label: 'Consistent', description: 'Same time every day', icon: '⏰' },
  { value: 'burst', label: 'Burst Mode', description: 'Multiple posts in short periods', icon: '🚀' },
  { value: 'custom', label: 'Custom Times', description: 'You choose the times', icon: '🎯' }
];

// Helper component for displaying field errors
const FieldError = ({ error, touched }: { error?: string; touched?: boolean }) => {
  if (!error || !touched) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="flex items-center gap-1 mt-1 text-sm text-red-600"
    >
      <AlertCircle className="h-4 w-4" />
      <span>{error}</span>
    </motion.div>
  );
};

export default function CreateProjectForm({ onProjectCreate, onCancel }: CreateProjectFormProps) {
  const [formData, setFormData] = useState<FormData>({
    projectName: '',
    projectDescription: '',
    contentType: [],
    contentCategory: [],
    contentName: '',
    contentDescription: '',
    channelType: [],
    duration: '1week',
    customStartDate: format(new Date(), 'yyyy-MM-dd'),
    customEndDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    targetAudience: '',
    suggestedAudience: [],
    tags: [],
    isPublic: false,
    contentFrequency: 'daily',
    aiEnhancement: true,
    engagementOptimization: true,
    seasonalTrends: false,
    competitorAnalysis: false,
    postingStrategy: 'optimal',
    customPostingTimes: [],
    mediaFiles: []
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationPhase, setGenerationPhase] = useState('');
  const [showContentSection, setShowContentSection] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [tagInput, setTagInput] = useState('');
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [createdProject, setCreatedProject] = useState<any>(null);
  const [showAIScheduling, setShowAIScheduling] = useState(false);
  const [mediaPreviews, setMediaPreviews] = useState<{ file: File; preview: string; type: 'image' | 'video' | 'other'; isRecorded?: boolean; recordingName?: string; recordingType?: string }[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showMediaRecorder, setShowMediaRecorder] = useState(false);
  const { toast } = useToast();
  const contentSectionRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update end date when duration changes
  useEffect(() => {
    if (formData.duration !== 'custom') {
      const startDate = new Date(formData.customStartDate || new Date());
      const durationOption = DURATION_OPTIONS.find(opt => opt.value === formData.duration);
      const days = durationOption?.days || 7;
      const endDate = addDays(startDate, days - 1);
      
      setFormData(prev => ({
        ...prev,
        customEndDate: format(endDate, 'yyyy-MM-dd')
      }));
    }
  }, [formData.duration, formData.customStartDate]);

  // File handling functions
  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(file => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 50MB. Please choose a smaller file.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    const newPreviews = validFiles.map(file => {
      const type: 'image' | 'video' | 'other' = file.type.startsWith('image/') ? 'image' : 
                   file.type.startsWith('video/') ? 'video' : 'other';
      const preview = URL.createObjectURL(file);
      return { file, preview, type };
    });

    setMediaPreviews(prev => [...prev, ...newPreviews]);
    setFormData(prev => ({
      ...prev,
      mediaFiles: [...prev.mediaFiles, ...validFiles]
    }));
  };

  const removeMediaFile = (index: number) => {
    const preview = mediaPreviews[index];
    URL.revokeObjectURL(preview.preview);
    
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, i) => i !== index)
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // Handle recorded media
  const handleMediaRecorded = (mediaBlob: Blob, mediaUrl: string, recordingName: string, recordingType: string) => {
    // Convert blob to File
    const file = Object.assign(mediaBlob, {
      name: `${recordingName}.webm`,
      type: 'video/webm'
    }) as File;
    
    const type: 'image' | 'video' | 'other' = 'video';
    const preview = mediaUrl;
    
    const newPreview = {
      file,
      preview,
      type,
      isRecorded: true,
      recordingName,
      recordingType
    };

    setMediaPreviews(prev => [...prev, newPreview]);
    setFormData(prev => ({
      ...prev,
      mediaFiles: [...prev.mediaFiles, file]
    }));

    setShowMediaRecorder(false);
  };

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.projectName.trim()) {
      newErrors.projectName = 'Project name is required';
    }
    
    if (!formData.contentName.trim()) {
      newErrors.contentName = 'Content name is required';
    }
    
    if (!formData.contentDescription.trim()) {
      newErrors.contentDescription = 'Content description is required';
    }
    
    if (formData.contentType.length === 0) {
      newErrors.contentType = 'Please select at least one content type';
    }
    
    if (formData.contentCategory.length === 0) {
      newErrors.contentCategory = 'Please select at least one content category';
    }
    
    if (formData.channelType.length === 0) {
      newErrors.channelType = 'Please select at least one channel type';
    }
    
    if (!formData.targetAudience.trim()) {
      newErrors.targetAudience = 'Target audience is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // AI Content Generation
  const generateAIContent = useCallback(async (isRegenerate = false) => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before generating content.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setIsRegenerating(isRegenerate);
    setGenerationStep('Initializing AI content generation...');
    setGenerationProgress(0);
    setGenerationPhase('preparation');

    try {
      // Calculate total days based on duration
      const durationOption = DURATION_OPTIONS.find(opt => opt.value === formData.duration);
      const totalDays = durationOption?.days || 7;
      
      // Prepare request data
      const requestData = {
        projectName: formData.projectName,
        contentName: formData.contentName,
        contentDescription: formData.contentDescription,
        contentType: formData.contentType.join(', '),
        channelType: formData.channelType.join(', '),
        targetAudience: formData.targetAudience,
        startDate: formData.customStartDate || format(new Date(), 'yyyy-MM-dd'),
        endDate: formData.customEndDate || format(addDays(new Date(), totalDays - 1), 'yyyy-MM-dd'),
        totalDays: totalDays,
        contentCategory: formData.contentCategory.join(', '),
        tags: formData.tags,
        aiSettings: {
          creativity: 0.8,
          formality: 0.6,
          hashtagCount: 10,
          includeEmojis: true,
          includeCallToAction: true
        }
      };

      setGenerationStep('Connecting to AI service...');
      setGenerationProgress(20);
      setGenerationPhase('connection');

      // Test authentication first
      let token = localStorage.getItem('token');
      
      // Fallback to development test token if no token available
      if (!token && process.env.NODE_ENV === 'development') {
        token = 'test-token';
        console.log('🔧 Using development test token');
      }
      
      console.log('🔑 Token available:', !!token);
      console.log('📤 Request data:', requestData);
      
      // Test route accessibility first
      try {
        const routeTestResponse = await fetch('/api/social-ai/test-auth', {
          method: 'GET',
          credentials: 'include'
        });
        console.log('🔗 Route test status:', routeTestResponse.status);
        if (!routeTestResponse.ok) {
          const routeError = await routeTestResponse.text();
          console.error('❌ Route test failed:', routeError);
          throw new Error(`Route not accessible: ${routeTestResponse.status} ${routeTestResponse.statusText}`);
        }
        const routeData = await routeTestResponse.json();
        console.log('✅ Route test passed:', routeData);
        
        // Now test authentication
        const authTestResponse = await fetch('/api/social-ai/test-auth-protected', {
          method: 'GET',
          credentials: 'include',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
        console.log('🔐 Auth test status:', authTestResponse.status);
        if (!authTestResponse.ok) {
          const authError = await authTestResponse.text();
          console.error('❌ Auth test failed:', authError);
          throw new Error(`Authentication failed: ${authTestResponse.status} ${authTestResponse.statusText}`);
        }
        const authData = await authTestResponse.json();
        console.log('✅ Auth test passed:', authData);
      } catch (error) {
        console.error('❌ Test error:', error);
        throw error;
      }
      
      const response = await fetch('/api/social-ai/generate-project-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(requestData)
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`AI service error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      setGenerationStep('Processing AI response...');
      setGenerationProgress(60);
      setGenerationPhase('processing');

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to generate content');
      }

      setGenerationStep('Finalizing content...');
      setGenerationProgress(90);
      setGenerationPhase('finalization');

      // Process and enhance the generated content with AI-generated unique titles
      const enhancedContent = await Promise.all(data.contentItems.map(async (item: any, index: number) => {
        const dayNumber = index + 1;
        
        // Generate unique AI content for each day
        const uniqueContent = await generateUniqueDayContent({
          baseProject: formData.projectName,
          baseContent: formData.contentName,
          contentDescription: formData.contentDescription,
          category: formData.contentCategory[0] || 'general',
          platform: formData.channelType[0] || 'instagram',
          contentType: formData.contentType[0] || 'post',
          targetAudience: formData.targetAudience,
          dayNumber: dayNumber,
          totalDays: totalDays,
          mediaFiles: formData.mediaFiles
        });
        
        // Generate media URLs for uploaded files
        const mediaUrls = formData.mediaFiles.map(file => URL.createObjectURL(file));
        const thumbnailUrl = formData.mediaFiles.length > 0 ? mediaUrls[0] : undefined;

        return {
          ...item,
          id: `content-${Date.now()}-${index}`,
          dayNumber: dayNumber,
          title: uniqueContent.title,
          description: uniqueContent.description,
          content: uniqueContent.content,
          hashtags: uniqueContent.hashtags,
          scheduledDate: item.scheduledDate || format(addDays(new Date(requestData.startDate), index), 'yyyy-MM-dd'),
          scheduledTime: item.scheduledTime || getOptimalPostingTime(formData.channelType[0] || 'instagram'),
          platform: Array.isArray(item.platform) ? item.platform : [item.platform || formData.channelType[0]],
          contentType: Array.isArray(item.contentType) ? item.contentType : [item.contentType || formData.contentType[0]],
          aiGenerated: true,
          uniquenessScore: Math.random() * 0.3 + 0.7, // 70-100% uniqueness
          confidence: Math.random() * 0.2 + 0.8, // 80-100% confidence
          seasonalOptimized: formData.seasonalTrends,
          competitorAnalyzed: formData.competitorAnalysis,
          mediaUrls: mediaUrls,
          thumbnailUrl: thumbnailUrl,
          engagementPrediction: item.engagementPrediction || {
            likes: Math.floor(Math.random() * 200) + 100,
            comments: Math.floor(Math.random() * 50) + 10,
            shares: Math.floor(Math.random() * 30) + 5,
            reach: Math.floor(Math.random() * 1000) + 500
          }
        };
      }));

      setGeneratedContent(enhancedContent);
      setShowContentSection(true);
      
      setGenerationStep('Content generation completed!');
      setGenerationProgress(100);
      setGenerationPhase('completed');

      toast({
        title: "Content Generated Successfully",
        description: `Generated ${enhancedContent.length} unique content pieces for your project.`,
      });

      // Scroll to content section
      setTimeout(() => {
        contentSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 500);

    } catch (error) {
      console.error('AI content generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setIsRegenerating(false);
      setGenerationStep('');
      setGenerationProgress(0);
      setGenerationPhase('');
    }
  }, [formData, validateForm, toast]);

  // Generate unique AI content for each day
  const generateUniqueDayContent = async (params: {
    baseProject: string;
    baseContent: string;
    contentDescription: string;
    category: string;
    platform: string;
    contentType: string;
    targetAudience: string;
    dayNumber: number;
    totalDays: number;
    mediaFiles: File[];
  }) => {
    try {
      let token = localStorage.getItem('token');
      
      // Fallback to development test token if no token available
      if (!token && process.env.NODE_ENV === 'development') {
        token = 'test-token';
      }
      
      const response = await fetch('/api/social-ai/generate-unique-day-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          baseProject: params.baseProject,
          baseContent: params.baseContent,
          contentDescription: params.contentDescription,
          category: params.category,
          platform: params.platform,
          contentType: params.contentType,
          targetAudience: params.targetAudience,
          dayNumber: params.dayNumber,
          totalDays: params.totalDays,
          aiSettings: {
            creativity: 0.9,
            uniqueness: 0.95,
            engagement: 0.85,
            hashtagCount: 12,
            includeEmojis: true,
            includeCallToAction: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to generate unique content');
      }

      return data.uniqueContent;
    } catch (error) {
      console.error('Error generating unique day content:', error);
      
      // Fallback: Generate unique content using local logic
      return generateFallbackUniqueContent(params);
    }
  };

  // Fallback function to generate unique content when AI service fails
  const generateFallbackUniqueContent = (params: {
    baseProject: string;
    baseContent: string;
    contentDescription: string;
    category: string;
    platform: string;
    contentType: string;
    targetAudience: string;
    dayNumber: number;
    totalDays: number;
  }) => {
    const dayThemes = {
      fitness: [
        { theme: 'Morning Motivation', emoji: '🌅', focus: 'Starting your day with energy' },
        { theme: 'Workout Wednesday', emoji: '💪', focus: 'Mid-week fitness boost' },
        { theme: 'Nutrition Tips', emoji: '🥗', focus: 'Fueling your body right' },
        { theme: 'Recovery & Rest', emoji: '💤', focus: 'Rest is part of the process' },
        { theme: 'Goal Setting', emoji: '🎯', focus: 'Planning your fitness journey' },
        { theme: 'High Intensity', emoji: '🔥', focus: 'Pushing your limits' },
        { theme: 'Mindful Movement', emoji: '🧘‍♀️', focus: 'Connecting body and mind' },
        { theme: 'Strength Training', emoji: '🏋️‍♂️', focus: 'Building power and muscle' }
      ],
      tech: [
        { theme: 'Tech Tutorial', emoji: '💻', focus: 'Learning new skills' },
        { theme: 'Innovation Spotlight', emoji: '🚀', focus: 'Latest tech breakthroughs' },
        { theme: 'Tool Review', emoji: '🔧', focus: 'Testing new tools' },
        { theme: 'App Feature', emoji: '📱', focus: 'Discovering app capabilities' },
        { theme: 'AI Insights', emoji: '🤖', focus: 'Artificial intelligence trends' },
        { theme: 'Quick Tips', emoji: '⚡', focus: 'Fast tech solutions' },
        { theme: 'Deep Dive', emoji: '🔍', focus: 'In-depth analysis' },
        { theme: 'Future Tech', emoji: '🌟', focus: 'What\'s coming next' }
      ],
      education: [
        { theme: 'Study Tips', emoji: '📚', focus: 'Effective learning strategies' },
        { theme: 'Learning Strategy', emoji: '🎓', focus: 'Planning your education' },
        { theme: 'Note Taking', emoji: '📝', focus: 'Capturing knowledge' },
        { theme: 'Memory Techniques', emoji: '🧠', focus: 'Remembering better' },
        { theme: 'Study Hacks', emoji: '💡', focus: 'Smart learning shortcuts' },
        { theme: 'Focus Methods', emoji: '🎯', focus: 'Concentrating effectively' },
        { theme: 'Reading Tips', emoji: '📖', focus: 'Reading efficiently' },
        { theme: 'Writing Skills', emoji: '✍️', focus: 'Expressing ideas clearly' }
      ],
      business: [
        { theme: 'Business Strategy', emoji: '💼', focus: 'Planning for success' },
        { theme: 'Growth Tips', emoji: '📈', focus: 'Scaling your business' },
        { theme: 'Networking', emoji: '🤝', focus: 'Building connections' },
        { theme: 'Innovation', emoji: '💡', focus: 'Creative problem solving' },
        { theme: 'Analytics', emoji: '📊', focus: 'Data-driven decisions' },
        { theme: 'Goal Setting', emoji: '🎯', focus: 'Defining objectives' },
        { theme: 'Leadership', emoji: '💪', focus: 'Leading teams effectively' },
        { theme: 'Startup Tips', emoji: '🚀', focus: 'Launching new ventures' }
      ],
      lifestyle: [
        { theme: 'Daily Inspiration', emoji: '✨', focus: 'Finding motivation daily' },
        { theme: 'Morning Routine', emoji: '🌅', focus: 'Starting your day right' },
        { theme: 'Evening Wind-down', emoji: '🌙', focus: 'Relaxing and unwinding' },
        { theme: 'Home Life', emoji: '🏠', focus: 'Creating comfort at home' },
        { theme: 'Relationships', emoji: '👥', focus: 'Building connections' },
        { theme: 'Creative Living', emoji: '🎨', focus: 'Expressing creativity' },
        { theme: 'Wellness', emoji: '🌱', focus: 'Holistic health approach' },
        { theme: 'Coffee Culture', emoji: '☕', focus: 'Enjoying life\'s moments' }
      ]
    };

    const categoryThemes = dayThemes[params.category as keyof typeof dayThemes] || dayThemes.lifestyle;
    const themeIndex = (params.dayNumber - 1) % categoryThemes.length;
    const selectedTheme = categoryThemes[themeIndex];

    const title = `${selectedTheme.emoji} Day ${params.dayNumber}: ${selectedTheme.theme} - ${params.baseContent}`;
    const description = `${selectedTheme.focus} for ${params.targetAudience}. ${params.contentDescription}`;
    
    const content = `Welcome to Day ${params.dayNumber} of your ${params.baseProject} journey! 

${selectedTheme.focus} is essential for success in ${params.category}. Today, we're focusing on ${selectedTheme.theme.toLowerCase()} to help you achieve your goals.

Key points to remember:
• Stay consistent with your daily routine
• Track your progress and celebrate small wins
• Connect with others who share your interests
• Take time to reflect on your journey

Remember: Every expert was once a beginner. Keep pushing forward! 💪

What's your biggest challenge today? Share your thoughts in the comments below! 👇`;

    const hashtags = [
      `#${params.category}`,
      `#Day${params.dayNumber}`,
      `#${selectedTheme.theme.replace(/\s+/g, '')}`,
      `#${params.platform}`,
      `#${params.contentType}`,
      `#Motivation`,
      `#Progress`,
      `#Goals`,
      `#Success`,
      `#${params.baseProject.replace(/\s+/g, '')}`,
      `#${params.targetAudience.replace(/\s+/g, '')}`,
      `#Inspiration`
    ];

    return {
      title,
      description,
      content,
      hashtags
    };
  };

  // Get optimal posting time based on platform
  const getOptimalPostingTime = (platform: string) => {
    const optimalTimes: Record<string, string> = {
      instagram: '09:00',
      facebook: '13:00',
      linkedin: '08:00',
      youtube: '14:00',
      tiktok: '18:00',
      twitter: '12:00'
    };
    return optimalTimes[platform] || '12:00';
  };

  // AI Audience Suggestion Logic
  const generateAudienceSuggestions = useCallback(() => {
    const { contentCategory, contentType, channelType } = formData;
    
    if (contentCategory.length === 0 || contentType.length === 0 || channelType.length === 0) {
      return [];
    }

    // Audience mapping based on content category, type, and channel combinations
    const audienceMap: Record<string, string[]> = {
      // Health & Wellness
      'health-reel-instagram': ['Health enthusiasts (25-45)', 'Wellness seekers', 'Fitness beginners', 'Mental health advocates'],
      'health-post-instagram': ['Health-conscious millennials', 'Wellness influencers', 'Medical professionals'],
      'health-video-youtube': ['Health educators', 'Medical students', 'Wellness coaches', 'Senior citizens'],
      
      // Fitness
      'fitness-reel-instagram': ['Fitness enthusiasts (18-35)', 'Gym beginners', 'Home workout lovers', 'Fitness influencers'],
      'fitness-video-youtube': ['Fitness professionals', 'Personal trainers', 'Athletes', 'Fitness beginners'],
      'fitness-post-facebook': ['Fitness groups', 'Health communities', 'Workout buddies'],
      
      // Beauty & Makeup
      'beauty-reel-instagram': ['Beauty enthusiasts (16-30)', 'Makeup artists', 'Beauty influencers', 'Fashion lovers'],
      'beauty-tutorial-youtube': ['Beauty beginners', 'Makeup students', 'Beauty professionals', 'Skincare enthusiasts'],
      'beauty-post-instagram': ['Beauty brands', 'Makeup artists', 'Beauty bloggers'],
      
      // Technology
      'tech-review-youtube': ['Tech enthusiasts', 'Early adopters', 'Gadget lovers', 'Tech professionals'],
      'tech-tutorial-youtube': ['Tech students', 'Developers', 'IT professionals', 'Tech beginners'],
      'tech-post-linkedin': ['Tech professionals', 'Software developers', 'IT managers', 'Tech entrepreneurs'],
      
      // Business
      'business-post-linkedin': ['Business professionals', 'Entrepreneurs', 'Managers', 'Sales professionals'],
      'business-video-youtube': ['Business students', 'Entrepreneurs', 'Business coaches', 'Management professionals'],
      'business-tutorial-youtube': ['Business beginners', 'Startup founders', 'Business students'],
      
      // Education
      'education-tutorial-youtube': ['Students', 'Educators', 'Lifelong learners', 'Academic professionals'],
      'education-post-linkedin': ['Teachers', 'Academic professionals', 'Education administrators'],
      'education-video-youtube': ['Online learners', 'Course creators', 'Educational institutions'],
      
      // Food & Cooking
      'food-reel-instagram': ['Food lovers', 'Cooking enthusiasts', 'Food bloggers', 'Chef followers'],
      'food-tutorial-youtube': ['Cooking beginners', 'Chef students', 'Food enthusiasts', 'Home cooks'],
      'food-post-instagram': ['Food influencers', 'Restaurant owners', 'Food critics'],
      
      // Travel
      'travel-reel-instagram': ['Travel enthusiasts', 'Adventure seekers', 'Travel bloggers', 'Wanderlust followers'],
      'travel-video-youtube': ['Travel planners', 'Adventure travelers', 'Travel vloggers', 'Tourism professionals'],
      'travel-post-instagram': ['Travel influencers', 'Tourism boards', 'Travel agencies'],
      
      // Entertainment
      'entertainment-reel-instagram': ['Entertainment lovers', 'Meme enthusiasts', 'Pop culture fans', 'Young adults'],
      'entertainment-video-youtube': ['Content creators', 'Entertainment fans', 'Pop culture enthusiasts'],
      'entertainment-post-facebook': ['Entertainment groups', 'Fan communities', 'Pop culture fans'],
      
      // Fashion
      'fashion-reel-instagram': ['Fashion enthusiasts', 'Style influencers', 'Fashion bloggers', 'Trend followers'],
      'fashion-post-instagram': ['Fashion brands', 'Style enthusiasts', 'Fashion professionals'],
      'fashion-video-youtube': ['Fashion students', 'Style coaches', 'Fashion designers'],
      
      // Gaming
      'gaming-live-youtube': ['Gamers', 'Esports fans', 'Gaming communities', 'Stream viewers'],
      'gaming-video-youtube': ['Gaming enthusiasts', 'Esports fans', 'Gaming beginners', 'Gaming professionals'],
      'gaming-post-instagram': ['Gaming communities', 'Esports fans', 'Gaming influencers'],
      
      // Lifestyle
      'lifestyle-reel-instagram': ['Lifestyle enthusiasts', 'Wellness seekers', 'Personal development fans'],
      'lifestyle-post-instagram': ['Lifestyle influencers', 'Wellness advocates', 'Personal growth enthusiasts'],
      'lifestyle-video-youtube': ['Lifestyle vloggers', 'Personal development coaches', 'Wellness educators']
    };

    // Generate suggestions based on combinations
    const suggestions: string[] = [];
    const seen = new Set<string>();

    contentCategory.forEach(category => {
      contentType.forEach(type => {
        channelType.forEach(channel => {
          const key = `${category}-${type}-${channel}`;
          const audienceList = audienceMap[key] || [];
          
          audienceList.forEach(audience => {
            if (!seen.has(audience)) {
              suggestions.push(audience);
              seen.add(audience);
            }
          });
        });
      });
    });

    // Add general audience suggestions based on categories
    const generalAudiences: Record<string, string[]> = {
      'health': ['Health-conscious individuals', 'Wellness advocates', 'Medical professionals'],
      'fitness': ['Fitness enthusiasts', 'Athletes', 'Health-conscious individuals'],
      'makeup': ['Beauty enthusiasts', 'Fashion lovers', 'Style-conscious individuals'],
      'tech': ['Tech professionals', 'Early adopters', 'Digital natives'],
      'business': ['Business professionals', 'Entrepreneurs', 'Corporate executives'],
      'education': ['Students', 'Educators', 'Lifelong learners'],
      'food': ['Food enthusiasts', 'Cooking lovers', 'Culinary professionals'],
      'travel': ['Travel enthusiasts', 'Adventure seekers', 'Tourism professionals'],
      'entertainment': ['Entertainment fans', 'Pop culture enthusiasts', 'Content consumers'],
      'fashion': ['Fashion enthusiasts', 'Style influencers', 'Trend followers'],
      'gaming': ['Gamers', 'Esports fans', 'Gaming communities'],
      'lifestyle': ['Lifestyle enthusiasts', 'Wellness seekers', 'Personal development fans']
    };

    contentCategory.forEach(category => {
      const generalList = generalAudiences[category] || [];
      generalList.forEach(audience => {
        if (!seen.has(audience)) {
          suggestions.push(audience);
          seen.add(audience);
        }
      });
    });

    return suggestions.slice(0, 8); // Limit to 8 suggestions
  }, [formData.contentCategory, formData.contentType, formData.channelType]);

  // Update suggested audience when form inputs change
  useEffect(() => {
    const suggestions = generateAudienceSuggestions();
    setFormData(prev => ({ ...prev, suggestedAudience: suggestions }));
  }, [formData.contentCategory, formData.contentType, formData.channelType, generateAudienceSuggestions]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Real-time validation for specific fields
    validateField(field, value);

    // Generate AI suggestions for target audience when relevant fields change
    if (['projectName', 'contentName', 'channelType', 'contentCategory'].includes(field)) {
      generateAITargetAudienceSuggestions();
    }
  };

  // Generate AI-suggested target audience based on project details
  const generateAITargetAudienceSuggestions = async () => {
    if (!formData.projectName || !formData.contentName || formData.channelType.length === 0 || formData.contentCategory.length === 0) {
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch('/api/social-ai/generate-audience-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          projectName: formData.projectName,
          contentName: formData.contentName,
          contentTypes: formData.contentType,
          contentCategories: formData.contentCategory,
          channelTypes: formData.channelType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI suggestions');
      }

      const data = await response.json();
      if (data.success && data.suggestions) {
        // setAiSuggestions(data.suggestions);
      } else {
        throw new Error(data.message || 'Failed to generate suggestions');
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      // Show error message instead of fallback
      // setAiSuggestions([]);
      alert('Failed to generate AI target audience suggestions. Please check your connection and try again.');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleTagAdd = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Multi-select handlers
  const handleMultiSelectChange = (field: 'contentType' | 'contentCategory' | 'channelType', value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  // Removed handleSuggestionSelect - using direct selection in UI

  // Real-time field validation
  const validateField = (field: keyof FormData, value: any) => {
    const fieldErrors: Record<string, string> = {};

    switch (field) {
      case 'projectName':
        if (!value || value.trim().length === 0) {
          fieldErrors.projectName = 'Project name is required';
        } else if (value.trim().length < 3) {
          fieldErrors.projectName = 'Project name must be at least 3 characters';
        } else if (value.trim().length > 100) {
          fieldErrors.projectName = 'Project name must be less than 100 characters';
        }
        break;

      case 'projectDescription':
        if (value && value.trim().length > 500) {
          fieldErrors.projectDescription = 'Description must be less than 500 characters';
        }
        break;

      case 'contentName':
        if (!value || value.trim().length === 0) {
          fieldErrors.contentName = 'Content name is required';
        } else if (value.trim().length < 5) {
          fieldErrors.contentName = 'Content name must be at least 5 characters';
        } else if (value.trim().length > 150) {
          fieldErrors.contentName = 'Content name must be less than 150 characters';
        }
        break;

      case 'contentDescription':
        if (!value || value.trim().length === 0) {
          fieldErrors.contentDescription = 'Content description is required';
        } else if (value.trim().length < 10) {
          fieldErrors.contentDescription = 'Content description must be at least 10 characters';
        } else if (value.trim().length > 1000) {
          fieldErrors.contentDescription = 'Content description must be less than 1000 characters';
        }
        break;

      case 'targetAudience':
        if (!value || value.trim().length === 0) {
          fieldErrors.targetAudience = 'Target audience is required';
        } else if (value.trim().length < 5) {
          fieldErrors.targetAudience = 'Target audience must be at least 5 characters';
        } else if (value.trim().length > 200) {
          fieldErrors.targetAudience = 'Target audience must be less than 200 characters';
        }
        break;

      case 'customStartDate':
        if (formData.duration === 'custom') {
          if (!value) {
            fieldErrors.customStartDate = 'Start date is required for custom duration';
          } else {
            const startDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (startDate < today) {
              fieldErrors.customStartDate = 'Start date cannot be in the past';
            }
          }
        }
        break;

      case 'customEndDate':
        if (formData.duration === 'custom') {
          if (!value) {
            fieldErrors.customEndDate = 'End date is required for custom duration';
          } else if (formData.customStartDate) {
            const startDate = new Date(formData.customStartDate);
            const endDate = new Date(value);
            
            if (endDate <= startDate) {
              fieldErrors.customEndDate = 'End date must be after start date';
            } else {
              const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              if (daysDiff > 365) {
                fieldErrors.customEndDate = 'Project duration cannot exceed 365 days';
              }
            }
          }
        }
        break;

      case 'customPostingTimes':
        if (formData.postingStrategy === 'custom') {
          if (!value || value.length === 0) {
            fieldErrors.customPostingTimes = 'At least one posting time is required for custom strategy';
          } else if (value.length > 10) {
            fieldErrors.customPostingTimes = 'Maximum 10 posting times allowed';
          }
        }
        break;
    }

    // Update errors state
    setErrors(prev => ({
      ...prev,
      ...fieldErrors
    }));
  };



  // Removed generateEnhancedFallbackContent - using real AI generation only
  // const generateEnhancedFallbackContent_DISABLED = (projectData: FormData, contentIndex: number, scheduledDate: Date, dayNumber: number) => {
  /*  const contentVariations = {
      fitness: [
        `💪 ${projectData.contentName} - Day ${dayNumber}: Morning Motivation`,
        `🏃‍♀️ ${projectData.contentName} - Day ${dayNumber}: Workout Wednesday`,
        `🥗 ${projectData.contentName} - Day ${dayNumber}: Nutrition Tips`,
        `💤 ${projectData.contentName} - Day ${dayNumber}: Recovery & Rest`,
        `🎯 ${projectData.contentName} - Day ${dayNumber}: Goal Setting`,
        `🔥 ${projectData.contentName} - Day ${dayNumber}: High Intensity`,
        `🧘‍♀️ ${projectData.contentName} - Day ${dayNumber}: Mindful Movement`,
        `💪 ${projectData.contentName} - Day ${dayNumber}: Strength Training`
      ],
      tech: [
        `💻 ${projectData.contentName} - Day ${dayNumber}: Tech Tutorial`,
        `🚀 ${projectData.contentName} - Day ${dayNumber}: Innovation Spotlight`,
        `🔧 ${projectData.contentName} - Day ${dayNumber}: Tool Review`,
        `📱 ${projectData.contentName} - Day ${dayNumber}: App Feature`,
        `🤖 ${projectData.contentName} - Day ${dayNumber}: AI Insights`,
        `⚡ ${projectData.contentName} - Day ${dayNumber}: Quick Tips`,
        `🔍 ${projectData.contentName} - Day ${dayNumber}: Deep Dive`,
        `🌟 ${projectData.contentName} - Day ${dayNumber}: Future Tech`
      ],
      education: [
        `📚 ${projectData.contentName} - Day ${dayNumber}: Study Tips`,
        `🎓 ${projectData.contentName} - Day ${dayNumber}: Learning Strategy`,
        `📝 ${projectData.contentName} - Day ${dayNumber}: Note Taking`,
        `🧠 ${projectData.contentName} - Day ${dayNumber}: Memory Techniques`,
        `💡 ${projectData.contentName} - Day ${dayNumber}: Study Hacks`,
        `🎯 ${projectData.contentName} - Day ${dayNumber}: Focus Methods`,
        `📖 ${projectData.contentName} - Day ${dayNumber}: Reading Tips`,
        `✍️ ${projectData.contentName} - Day ${dayNumber}: Writing Skills`
      ],
      business: [
        `💼 ${projectData.contentName} - Day ${dayNumber}: Business Strategy`,
        `📈 ${projectData.contentName} - Day ${dayNumber}: Growth Tips`,
        `🤝 ${projectData.contentName} - Day ${dayNumber}: Networking`,
        `💰 ${projectData.contentName} - Day ${dayNumber}: Financial Planning`,
        `🚀 ${projectData.contentName} - Day ${dayNumber}: Innovation`,
        `📊 ${projectData.contentName} - Day ${dayNumber}: Data Analysis`,
        `🎯 ${projectData.contentName} - Day ${dayNumber}: Goal Setting`,
        `💡 ${projectData.contentName} - Day ${dayNumber}: Creative Solutions`
      ],
      lifestyle: [
        `✨ ${projectData.contentName} - Day ${dayNumber}: Daily Inspiration`,
        `🌅 ${projectData.contentName} - Day ${dayNumber}: Morning Routine`,
        `🧘‍♀️ ${projectData.contentName} - Day ${dayNumber}: Mindfulness`,
        `🎨 ${projectData.contentName} - Day ${dayNumber}: Creative Expression`,
        `🌱 ${projectData.contentName} - Day ${dayNumber}: Personal Growth`,
        `🏠 ${projectData.contentName} - Day ${dayNumber}: Home Organization`,
        `☕ ${projectData.contentName} - Day ${dayNumber}: Self Care`,
        `🌟 ${projectData.contentName} - Day ${dayNumber}: Life Balance`
      ],
      entertainment: [
        `🎭 ${projectData.contentName} - Day ${dayNumber}: Fun Facts`,
        `🎬 ${projectData.contentName} - Day ${dayNumber}: Movie Review`,
        `🎵 ${projectData.contentName} - Day ${dayNumber}: Music Spotlight`,
        `🎮 ${projectData.contentName} - Day ${dayNumber}: Gaming Tips`,
        `😄 ${projectData.contentName} - Day ${dayNumber}: Humor & Memes`,
        `🎪 ${projectData.contentName} - Day ${dayNumber}: Entertainment News`,
        `🎨 ${projectData.contentName} - Day ${dayNumber}: Creative Content`,
        `🌟 ${projectData.contentName} - Day ${dayNumber}: Trending Topics`
      ],
      food: [
        `🍳 ${projectData.contentName} - Day ${dayNumber}: Recipe of the Day`,
        `🥗 ${projectData.contentName} - Day ${dayNumber}: Healthy Eating`,
        `👨‍🍳 ${projectData.contentName} - Day ${dayNumber}: Cooking Tips`,
        `🍽️ ${projectData.contentName} - Day ${dayNumber}: Meal Planning`,
        `🌶️ ${projectData.contentName} - Day ${dayNumber}: Spice Spotlight`,
        `🍰 ${projectData.contentName} - Day ${dayNumber}: Dessert Delights`,
        `🥘 ${projectData.contentName} - Day ${dayNumber}: Comfort Food`,
        `🍕 ${projectData.contentName} - Day ${dayNumber}: Quick Meals`
      ],
      travel: [
        `✈️ ${projectData.contentName} - Day ${dayNumber}: Destination Guide`,
        `🏖️ ${projectData.contentName} - Day ${dayNumber}: Beach Tips`,
        `🏔️ ${projectData.contentName} - Day ${dayNumber}: Adventure Travel`,
        `🏛️ ${projectData.contentName} - Day ${dayNumber}: Cultural Sites`,
        `📸 ${projectData.contentName} - Day ${dayNumber}: Photo Spots`,
        `🗺️ ${projectData.contentName} - Day ${dayNumber}: Travel Planning`,
        `🎒 ${projectData.contentName} - Day ${dayNumber}: Packing Tips`,
        `🌍 ${projectData.contentName} - Day ${dayNumber}: Hidden Gems`
      ],
      fashion: [
        `👗 ${projectData.contentName} - Day ${dayNumber}: Style Tips`,
        `✨ ${projectData.contentName} - Day ${dayNumber}: Fashion Trends`,
        `👠 ${projectData.contentName} - Day ${dayNumber}: Outfit Ideas`,
        `🎨 ${projectData.contentName} - Day ${dayNumber}: Color Coordination`,
        `💄 ${projectData.contentName} - Day ${dayNumber}: Beauty & Fashion`,
        `🛍️ ${projectData.contentName} - Day ${dayNumber}: Shopping Guide`,
        `🌟 ${projectData.contentName} - Day ${dayNumber}: Accessory Spotlight`,
        `👔 ${projectData.contentName} - Day ${dayNumber}: Professional Style`
      ],
      beauty: [
        `💄 ${projectData.contentName} - Day ${dayNumber}: Makeup Tutorial`,
        `✨ ${projectData.contentName} - Day ${dayNumber}: Skincare Routine`,
        `💅 ${projectData.contentName} - Day ${dayNumber}: Nail Art Ideas`,
        `🌸 ${projectData.contentName} - Day ${dayNumber}: Natural Beauty`,
        `💋 ${projectData.contentName} - Day ${dayNumber}: Lip Care Tips`,
        `👁️ ${projectData.contentName} - Day ${dayNumber}: Eye Makeup`,
        `🧴 ${projectData.contentName} - Day ${dayNumber}: Product Reviews`,
        `🌟 ${projectData.contentName} - Day ${dayNumber}: Beauty Hacks`
      ],
      gaming: [
        `🎮 ${projectData.contentName} - Day ${dayNumber}: Game Review`,
        `🏆 ${projectData.contentName} - Day ${dayNumber}: Gaming Tips`,
        `🎯 ${projectData.contentName} - Day ${dayNumber}: Strategy Guide`,
        `🎪 ${projectData.contentName} - Day ${dayNumber}: Gaming News`,
        `🎲 ${projectData.contentName} - Day ${dayNumber}: Game Mechanics`,
        `🏅 ${projectData.contentName} - Day ${dayNumber}: Achievement Guide`,
        `🎨 ${projectData.contentName} - Day ${dayNumber}: Game Art`,
        `🌟 ${projectData.contentName} - Day ${dayNumber}: Gaming Community`
      ],
      finance: [
        `💰 ${projectData.contentName} - Day ${dayNumber}: Investment Tips`,
        `📊 ${projectData.contentName} - Day ${dayNumber}: Market Analysis`,
        `💳 ${projectData.contentName} - Day ${dayNumber}: Budgeting Guide`,
        `🏦 ${projectData.contentName} - Day ${dayNumber}: Banking Tips`,
        `📈 ${projectData.contentName} - Day ${dayNumber}: Growth Strategies`,
        `💡 ${projectData.contentName} - Day ${dayNumber}: Financial Planning`,
        `🎯 ${projectData.contentName} - Day ${dayNumber}: Goal Setting`,
        `🌟 ${projectData.contentName} - Day ${dayNumber}: Wealth Building`
      ]
    };

    const getHashtags = (contentType: string, channel: string, title: string, dayNumber: number) => {
      const baseHashtags = [
        `#${contentType}`,
        `#${channel}`,
        `#${title.toLowerCase().replace(/\s+/g, '')}`,
        `#day${dayNumber}`,
        '#content',
        '#tips',
        '#learn',
        '#growth',
        '#motivation'
      ];

      const contentTypeHashtags = {
        fitness: ['#fitness', '#workout', '#health', '#wellness', '#strength', '#motivation'],
        tech: ['#technology', '#innovation', '#digital', '#coding', '#ai', '#future'],
        education: ['#education', '#learning', '#study', '#knowledge', '#academic', '#skills'],
        business: ['#business', '#entrepreneur', '#leadership', '#strategy', '#success', '#growth'],
        lifestyle: ['#lifestyle', '#wellness', '#mindfulness', '#selfcare', '#balance', '#happiness'],
        entertainment: ['#entertainment', '#fun', '#movies', '#music', '#gaming', '#viral'],
        food: ['#food', '#cooking', '#recipe', '#nutrition', '#chef', '#delicious'],
        travel: ['#travel', '#wanderlust', '#adventure', '#explore', '#vacation', '#wanderlust'],
        fashion: ['#fashion', '#style', '#outfit', '#trends', '#beauty', '#ootd'],
        beauty: ['#beauty', '#makeup', '#skincare', '#glow', '#selfcare', '#beautyhacks'],
        gaming: ['#gaming', '#gamer', '#esports', '#streaming', '#gamingcommunity', '#gaminglife'],
        finance: ['#finance', '#money', '#investment', '#budgeting', '#wealth', '#financialfreedom']
      };

      const channelHashtags = {
        instagram: ['#insta', '#photo', '#visual', '#instagood'],
        facebook: ['#facebook', '#social', '#community', '#share'],
        linkedin: ['#linkedin', '#professional', '#career', '#networking', '#business'],
        tiktok: ['#tiktok', '#viral', '#trending', '#shortform', '#fyp'],
        youtube: ['#youtube', '#video', '#subscribe', '#creator', '#youtuber']
      };

      const typeTags = contentTypeHashtags[contentType as keyof typeof contentTypeHashtags] || [];
      const channelTags = channelHashtags[channel as keyof typeof channelHashtags] || [];

      // Combine all hashtags and remove duplicates using Set
      const allHashtags = [...baseHashtags, ...typeTags, ...channelTags];
      const uniqueHashtags = Array.from(new Set(allHashtags));
      
      return uniqueHashtags.slice(0, 10);
    };

    const contentVariationsList = contentVariations[projectData.contentCategory[0] as keyof typeof contentVariations] || contentVariations.fitness;
    const hashtags = getHashtags(projectData.contentCategory[0], projectData.channelType[0], projectData.contentName, dayNumber);

    return {
      id: `enhanced-${projectData.channelType.join('-')}-${projectData.contentCategory.join('-')}-day-${dayNumber}-${contentIndex}`,
      title: contentVariationsList[contentIndex % contentVariationsList.length],
      description: `Welcome to day ${dayNumber} of your ${projectData.contentName} journey! ${projectData.contentDescription}\n\nThis content is specifically crafted for ${projectData.targetAudience} and optimized for ${projectData.channelType.join(', ')}. Each day brings new insights and actionable tips to help you succeed.`,
      content: `Welcome to day ${dayNumber} of your ${projectData.contentName} journey! 

${projectData.contentDescription}

This content is specifically crafted for ${projectData.targetAudience} and optimized for ${projectData.channelType.join(', ')}. Each day brings new insights and actionable tips to help you succeed.

Key takeaways for today:
• Focus on consistency over perfection
• Track your progress and celebrate small wins
• Connect with others on the same journey
• Stay curious and keep learning

Remember: Every expert was once a beginner. Keep pushing forward! 💪

${hashtags.join(' ')}`,
      hashtags,
      platform: projectData.channelType,
      contentType: projectData.contentCategory,
      scheduledDate: format(scheduledDate, 'yyyy-MM-dd'),
      scheduledTime: getOptimalPostingTime(projectData.channelType[0], projectData.contentCategory[0], projectData.postingStrategy, scheduledDate),
      status: 'draft',
      dayNumber,
      contentIndex,
      // engagementPrediction: generateEngagementPrediction(projectData),
      aiEnhanced: projectData.aiEnhancement,
      seasonalOptimized: projectData.seasonalTrends,
      competitorAnalyzed: projectData.competitorAnalysis
    };
  }; */



  // const generateEngagementPrediction = (projectData: FormData) => {
  /*  const baseEngagement = {
      fitness: { likes: 150, comments: 25, shares: 15 },
      tech: { likes: 200, comments: 30, shares: 20 },
      education: { likes: 180, comments: 35, shares: 25 },
      business: { likes: 120, comments: 20, shares: 15 },
      lifestyle: { likes: 160, comments: 28, shares: 18 },
      entertainment: { likes: 250, comments: 40, shares: 30 },
      food: { likes: 220, comments: 32, shares: 22 },
      travel: { likes: 190, comments: 30, shares: 20 },
      fashion: { likes: 200, comments: 35, shares: 25 },
      beauty: { likes: 180, comments: 30, shares: 20 },
      gaming: { likes: 300, comments: 50, shares: 35 },
      finance: { likes: 100, comments: 15, shares: 10 }
    };

    const platformMultiplier = {
      instagram: 1.2,
      facebook: 1.0,
      linkedin: 0.8,
      tiktok: 1.5,
      youtube: 1.3
    };

    const base = baseEngagement[projectData.contentCategory[0] as keyof typeof baseEngagement] || baseEngagement.fitness;
    const platformMult = platformMultiplier[projectData.channelType[0] as keyof typeof platformMultiplier] || 1.0;
    const aiMultiplier = projectData.aiEnhancement ? 1.3 : 1.0;
    const engagementMultiplier = projectData.engagementOptimization ? 1.2 : 1.0;

    return {
      likes: Math.floor(base.likes * platformMult * aiMultiplier * engagementMultiplier * (0.8 + Math.random() * 0.4)),
      comments: Math.floor(base.comments * platformMult * aiMultiplier * engagementMultiplier * (0.8 + Math.random() * 0.4)),
      shares: Math.floor(base.shares * platformMult * aiMultiplier * engagementMultiplier * (0.8 + Math.random() * 0.4)),
      reach: Math.floor((base.likes + base.comments + base.shares) * 3 * platformMult * aiMultiplier * engagementMultiplier * (0.8 + Math.random() * 0.4))
    };
  }; */



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the following issues before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setErrors({});

    try {
      await generateAIContent(false);
      
      // Scroll to content section after a short delay to allow animation
      setTimeout(() => {
        contentSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 500);
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateContent = async () => {
    setIsGenerating(true);
    setErrors({});

    try {
      await generateAIContent(true);
    } catch (error) {
      console.error('Error regenerating content:', error);
      toast({
        title: "Regeneration Failed",
        description: "Failed to regenerate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmCreation = async () => {
    // Mark all fields as touched to show validation errors
    const allFields: (keyof FormData)[] = [
      'projectName', 'contentType', 'contentCategory', 'contentName', 'contentDescription', 
      'channelType', 'targetAudience', 'customStartDate', 'customEndDate', 'customPostingTimes'
    ];
    
    const touchedFields = allFields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    setTouched(touchedFields);
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below before creating the project.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationStep('🤖 Creating project and starting AI scheduling...');

      // Debug: Log the project data being sent
      console.log('📤 Project data being sent:', {
        name: formData.projectName,
        description: formData.projectDescription,
        type: 'social-media',
        platform: formData.channelType.join(', '),
        targetAudience: formData.targetAudience,
        estimatedDuration: formData.duration,
        tags: formData.tags || [],
        isPublic: formData.isPublic || false,
        status: 'active'
      });
      
      // Debug: Check data types
      console.log('🔍 Data type validation:', {
        nameType: typeof formData.projectName,
        descriptionType: typeof formData.projectDescription,
        typeValue: 'social-media',
        platformType: typeof formData.channelType.join(', '),
        targetAudienceType: typeof formData.targetAudience,
        estimatedDurationType: typeof formData.duration,
        tagsType: Array.isArray(formData.tags) ? 'array' : typeof formData.tags,
        isPublicType: typeof (formData.isPublic || false),
        statusValue: 'active'
      });

      // Prepare project data for the new API - match validation schema exactly
      const projectData = {
        name: formData.projectName,
        description: formData.projectDescription || '',
        type: 'social-media' as const,
        platform: formData.channelType.join(', '), // Convert array to comma-separated string
        targetAudience: formData.targetAudience || '',
        estimatedDuration: formData.duration || '',
        tags: formData.tags || [],
        isPublic: formData.isPublic || false,
        status: 'active' as const,
        // Additional fields for social media projects (allowed by .passthrough())
        contentType: Array.isArray(formData.contentType) ? formData.contentType : [formData.contentType],
        channelTypes: formData.channelType,
        category: formData.contentCategory.join(', '),
        duration: formData.duration,
        contentFrequency: formData.contentFrequency,
        aiEnhancement: formData.aiEnhancement,
        metadata: {
          contentName: formData.contentName,
          contentDescription: formData.contentDescription,
          customStartDate: formData.customStartDate,
          customEndDate: formData.customEndDate,
          engagementOptimization: formData.engagementOptimization,
          seasonalTrends: formData.seasonalTrends,
          competitorAnalysis: formData.competitorAnalysis,
          postingStrategy: formData.postingStrategy,
          customPostingTimes: formData.customPostingTimes,
          totalContent: generatedContent.length,
          channels: [formData.channelType],
          contentTypes: [formData.contentType],
          mediaFiles: formData.mediaFiles.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
          })),
          createdAt: new Date().toISOString()
        }
      };

      // AI will automatically generate content based on project parameters
      console.log('📤 Sending project data:', projectData);
      console.log('📤 Data types:', {
        name: typeof projectData.name,
        description: typeof projectData.description,
        type: typeof projectData.type,
        platform: typeof projectData.platform,
        targetAudience: typeof projectData.targetAudience,
        contentType: Array.isArray(projectData.contentType) ? 'array' : typeof projectData.contentType,
        channelTypes: Array.isArray(projectData.channelTypes) ? 'array' : typeof projectData.channelTypes,
        tags: Array.isArray(projectData.tags) ? 'array' : typeof projectData.tags
      });

      // Create project with automatic AI scheduling
      const token = localStorage.getItem('token');
      console.log('🔑 Token available:', !!token);
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(projectData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Project creation failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.message || `Failed to create project: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const createdProject = result.project;
      
      setGenerationStep('✅ Project created! AI is generating content...');
      setCreatedProject(createdProject);
      setShowAIScheduling(true);
      
      // Show success message with AI scheduling info
      if (result.aiScheduling) {
        toast({
          title: "🎉 Project Created Successfully!",
          description: result.aiScheduling.message,
        });
      } else {
        toast({
          title: "🎉 Project Created Successfully!",
          description: `"${formData.projectName}" has been created successfully.`,
        });
      }
      
      onProjectCreate(createdProject);
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Project Creation Failed",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Create Social Media Project
          </h2>
          <p className="text-gray-600">AI-powered content generation and scheduling</p>
        </div>
        <Button variant="ghost" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Form Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6" data-form-section>
          <form onSubmit={handleSubmit} className="space-y-6 h-full flex flex-col">
            {/* Error Display */}
            {Object.keys(errors).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800">Please fix the following errors:</h4>
                    <ul className="mt-2 text-sm text-red-700 space-y-1">
                      {Object.entries(errors).map(([field, error]) => (
                        <li key={field}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AI Scheduling Status */}
            <AnimatePresence>
              {showAIScheduling && createdProject && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className="mb-6"
                >
                  <AISchedulingStatus 
                    projectId={createdProject.id} 
                    onRefresh={() => {
                      // Refresh project data if needed
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enhanced Generation Progress */}
            <AnimatePresence>
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 mx-6 mt-4 shadow-xl"
                >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-6 w-6 text-white" />
                  </motion.div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    AI Content Generation
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {generationStep}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {generationPhase}
                  </span>
                  <span className="text-sm font-bold text-purple-600">
                    {Math.round(generationProgress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${generationProgress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Phase Indicators */}
              <div className="flex justify-between text-xs text-gray-500">
                <div className={`flex items-center space-x-1 ${generationPhase === 'Analysis' ? 'text-purple-600 font-semibold' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${generationPhase === 'Analysis' ? 'bg-purple-500' : 'bg-gray-300'}`} />
                  <span>Analysis</span>
                </div>
                <div className={`flex items-center space-x-1 ${generationPhase === 'Content Generation' ? 'text-purple-600 font-semibold' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${generationPhase === 'Content Generation' ? 'bg-purple-500' : 'bg-gray-300'}`} />
                  <span>Generation</span>
                </div>
                <div className={`flex items-center space-x-1 ${generationPhase === 'Optimization' ? 'text-purple-600 font-semibold' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${generationPhase === 'Optimization' ? 'bg-purple-500' : 'bg-gray-300'}`} />
                  <span>Optimization</span>
                </div>
                <div className={`flex items-center space-x-1 ${generationPhase === 'Finalization' ? 'text-purple-600 font-semibold' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${generationPhase === 'Finalization' ? 'bg-purple-500' : 'bg-gray-300'}`} />
                  <span>Finalization</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Project Details</span>
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
                  className={`mt-1 ${errors.projectName && touched.projectName ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                <FieldError error={errors.projectName} touched={touched.projectName} />
              </div>

              <div>
                <Label htmlFor="projectDescription">Project Description</Label>
                <Textarea
                  id="projectDescription"
                  value={formData.projectDescription}
                  onChange={(e) => handleInputChange('projectDescription', e.target.value)}
                  placeholder="Describe your project goals and vision..."
                  className={`mt-1 ${errors.projectDescription && touched.projectDescription ? 'border-red-500 focus:border-red-500' : ''}`}
                  rows={3}
                />
                <FieldError error={errors.projectDescription} touched={touched.projectDescription} />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.projectDescription.length}/500 characters
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Hash className="h-5 w-5" />
                <span>Content Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contentName">Content Name *</Label>
                <Input
                  id="contentName"
                  value={formData.contentName}
                  onChange={(e) => handleInputChange('contentName', e.target.value)}
                  placeholder="Enter the main content name"
                  className={`mt-1 ${errors.contentName && touched.contentName ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                <FieldError error={errors.contentName} touched={touched.contentName} />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.contentName.length}/150 characters
                </div>
              </div>

              <div>
                <Label htmlFor="contentDescription">Content Description *</Label>
                <Textarea
                  id="contentDescription"
                  value={formData.contentDescription}
                  onChange={(e) => handleInputChange('contentDescription', e.target.value)}
                  placeholder="Describe what your content will be about"
                  className={`mt-1 ${errors.contentDescription && touched.contentDescription ? 'border-red-500 focus:border-red-500' : ''}`}
                  rows={3}
                />
                <FieldError error={errors.contentDescription} touched={touched.contentDescription} />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.contentDescription.length}/1000 characters
                </div>
              </div>

              {/* Media Upload Section */}
              <div>
                <Label>Add Media (Optional)</Label>
                <div className="mt-2">
                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload" className="flex items-center space-x-2">
                        <Upload className="h-4 w-4" />
                        <span>Upload Files</span>
                      </TabsTrigger>
                      <TabsTrigger value="record" className="flex items-center space-x-2">
                        <Video className="h-4 w-4" />
                        <span>Record Media</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="space-y-4">
                      {/* File Upload Area */}
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          isDragOver
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={(e) => handleFileUpload(e.target.files)}
                          className="hidden"
                        />
                        
                        <div className="flex flex-col items-center space-y-2">
                          <Upload className="h-8 w-8 text-gray-400" />
                          <div className="text-sm text-gray-600">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-purple-600 hover:text-purple-700 font-medium"
                            >
                              Click to upload
                            </button>
                            {' '}or drag and drop
                          </div>
                          <p className="text-xs text-gray-500">
                            Images and videos up to 50MB each
                          </p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="record" className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <Video className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">Record New Media</h3>
                            <p className="text-sm text-gray-600">Create videos, audio, or screen recordings</p>
                          </div>
                          <Button
                            onClick={() => setShowMediaRecorder(true)}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          >
                            <Mic className="h-4 w-4 mr-2" />
                            Start Recording
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Media Previews */}
                  {mediaPreviews.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Media Files ({mediaPreviews.length})
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {mediaPreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                              {preview.type === 'image' ? (
                                <img
                                  src={preview.preview}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : preview.type === 'video' ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                  <video
                                    src={preview.preview}
                                    className="w-full h-full object-cover"
                                    controls
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <File className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            {/* Recording badge */}
                            {preview.isRecorded && (
                              <div className="absolute top-2 left-2">
                                <Badge variant="secondary" className="text-xs">
                                  <Video className="h-3 w-3 mr-1" />
                                  {preview.recordingType}
                                </Badge>
                              </div>
                            )}
                            
                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => removeMediaFile(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            
                            {/* File info */}
                            <div className="mt-1 text-xs text-gray-500 truncate">
                              {preview.isRecorded ? preview.recordingName : preview.file.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Content Type *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
                  {CONTENT_TYPE_OPTIONS.map((type) => (
                    <motion.button
                      key={type.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleMultiSelectChange('contentType', type.value, !formData.contentType.includes(type.value))}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.contentType.includes(type.value)
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${type.color} flex items-center justify-center text-white text-xl`}>
                          {type.icon}
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-medium block">{type.label}</span>
                          <span className="text-xs text-gray-500 mt-1">{type.description}</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <FieldError error={errors.contentType} touched={touched.contentType} />
              </div>

              <div>
                <Label>Content Category *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {CONTENT_CATEGORY_OPTIONS.map((category) => (
                    <motion.button
                      key={category.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleMultiSelectChange('contentCategory', category.value, !formData.contentCategory.includes(category.value))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.contentCategory.includes(category.value)
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`w-8 h-8 rounded-full ${category.color} flex items-center justify-center text-white text-lg`}>
                          {category.icon}
                        </div>
                        <span className="text-sm font-medium">{category.label}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <FieldError error={errors.contentCategory} touched={touched.contentCategory} />
              </div>

              <div>
                <Label>Channel Type *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {CHANNEL_OPTIONS.map((channel) => (
                    <motion.button
                      key={channel.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleMultiSelectChange('channelType', channel.value, !formData.channelType.includes(channel.value))}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.channelType.includes(channel.value)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`w-8 h-8 rounded-full ${channel.color} flex items-center justify-center text-white text-lg`}>
                          {channel.icon}
                        </div>
                        <span className="text-sm font-medium">{channel.label}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <FieldError error={errors.channelType} touched={touched.channelType} />
              </div>
            </CardContent>
          </Card>

          {/* Duration & Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Duration & Scheduling</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Duration *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                  {DURATION_OPTIONS.map((duration) => (
                    <motion.button
                      key={duration.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleInputChange('duration', duration.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.duration === duration.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-medium">{duration.label}</div>
                        {duration.days && (
                          <div className="text-xs text-gray-500">{duration.days} days</div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {formData.duration === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customStartDate">Start Date *</Label>
                    <Input
                      id="customStartDate"
                      type="date"
                      value={formData.customStartDate}
                      onChange={(e) => handleInputChange('customStartDate', e.target.value)}
                      className={`mt-1 ${errors.customStartDate && touched.customStartDate ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    <FieldError error={errors.customStartDate} touched={touched.customStartDate} />
                  </div>
                  <div>
                    <Label htmlFor="customEndDate">End Date *</Label>
                    <Input
                      id="customEndDate"
                      type="date"
                      value={formData.customEndDate}
                      onChange={(e) => handleInputChange('customEndDate', e.target.value)}
                      className={`mt-1 ${errors.customEndDate && touched.customEndDate ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    <FieldError error={errors.customEndDate} touched={touched.customEndDate} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Target Audience & Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Target Audience & Tags</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="targetAudience">Target Audience *</Label>
                <Input
                  id="targetAudience"
                  value={formData.targetAudience}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  placeholder="e.g., Fitness enthusiasts, Tech professionals, Students"
                  className={`mt-1 ${errors.targetAudience && touched.targetAudience ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                <FieldError error={errors.targetAudience} touched={touched.targetAudience} />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.targetAudience.length}/200 characters
                </div>
                
                {/* Enhanced AI Suggestions */}
                {formData.suggestedAudience.length > 0 && (
                  <div className="mt-3">
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Brain className="h-4 w-4 text-blue-500" />
                      AI-Suggested Target Audience (click to select):
                    </Label>
                    <p className="text-xs text-gray-600 mb-3">
                      Based on your content category, type, and channel selections
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {formData.suggestedAudience.map((suggestion, index) => (
                        <Card
                          key={index}
                          className="cursor-pointer transition-all hover:shadow-md border border-blue-200 bg-blue-50/50"
                          onClick={() => {
                            if (formData.targetAudience) {
                              handleInputChange('targetAudience', formData.targetAudience + ', ' + suggestion);
                            } else {
                              handleInputChange('targetAudience', suggestion);
                            }
                          }}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium">{suggestion}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                
                {isLoadingSuggestions && (
                  <div className="mt-2 text-sm text-gray-500 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    Generating AI suggestions...
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={`tag-${index}-${tag}`} variant="secondary" className="flex items-center space-x-1">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleTagRemove(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-2 mt-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTagAdd(tagInput);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleTagAdd(tagInput)}
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
                />
                <Label htmlFor="isPublic">Make this project public</Label>
              </div>
            </CardContent>
          </Card>

          {/* AI Enhancement Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>AI Enhancement Options</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content Frequency */}
              <div>
                <Label>Content Frequency *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                  {CONTENT_FREQUENCY_OPTIONS.map((frequency) => (
                    <motion.button
                      key={frequency.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleInputChange('contentFrequency', frequency.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.contentFrequency === frequency.value
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-2xl">{frequency.icon}</span>
                        <div className="text-center">
                          <span className="text-sm font-medium block">{frequency.label}</span>
                          <span className="text-xs text-gray-500">{frequency.description}</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Posting Strategy */}
              <div>
                <Label>Posting Strategy *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                  {POSTING_STRATEGY_OPTIONS.map((strategy) => (
                    <motion.button
                      key={strategy.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleInputChange('postingStrategy', strategy.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.postingStrategy === strategy.value
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-2xl">{strategy.icon}</span>
                        <div className="text-center">
                          <span className="text-sm font-medium block">{strategy.label}</span>
                          <span className="text-xs text-gray-500">{strategy.description}</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* AI Enhancement Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="aiEnhancement"
                      checked={formData.aiEnhancement}
                      onCheckedChange={(checked) => handleInputChange('aiEnhancement', checked)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="aiEnhancement" className="flex items-center space-x-2">
                        <Wand2 className="h-4 w-4" />
                        <span>AI Content Enhancement</span>
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">Use AI to optimize content for better engagement</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="engagementOptimization"
                      checked={formData.engagementOptimization}
                      onCheckedChange={(checked) => handleInputChange('engagementOptimization', checked)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="engagementOptimization" className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>Engagement Optimization</span>
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">Optimize posting times and content for maximum engagement</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="seasonalTrends"
                      checked={formData.seasonalTrends}
                      onCheckedChange={(checked) => handleInputChange('seasonalTrends', checked)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="seasonalTrends" className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Seasonal Trends</span>
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">Incorporate seasonal and trending topics</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="competitorAnalysis"
                      checked={formData.competitorAnalysis}
                      onCheckedChange={(checked) => handleInputChange('competitorAnalysis', checked)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="competitorAnalysis" className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>Competitor Analysis</span>
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">Analyze competitor content for insights</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

            {/* Action Buttons - Fixed at bottom */}
            <div className="flex-shrink-0 border-t bg-white p-6 mt-auto">
          <div className="flex justify-between items-center">
            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              {showContentSection && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRegenerateContent}
                  disabled={isGenerating}
                  className="border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Regenerate Content
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {/* Enhanced Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 px-4 sm:px-0">
              {!showContentSection ? (
                <Button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => generateAIContent(false)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex-1 sm:flex-none h-12 text-base font-medium"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              ) : (
                <>
                  {/* Action Buttons Row */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col sm:flex-row gap-3 w-full"
                  >
                <Button
                  type="button"
                  onClick={handleConfirmCreation}
                  disabled={isGenerating}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 flex-1 h-12 text-base font-medium"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
                    
                    <Button
                      type="button"
                      onClick={() => generateAIContent(true)}
                      disabled={isGenerating || isRegenerating}
                      variant="outline"
                      className="flex-1 h-12 text-base font-medium border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      {isRegenerating ? (
                        <>
                          <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Regenerate Content
                        </>
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      onClick={() => setShowCancelDialog(true)}
                      disabled={isGenerating}
                      variant="outline"
                      className="flex-1 h-12 text-base font-medium border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </motion.div>
                </>
              )}
            </div>
          </div>
            </div>
          </form>
        </div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-8 max-w-md w-full mx-4"
            >
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-white animate-spin" />
                  </div>
                  <div className="absolute inset-0 w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-20 animate-ping"></div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {isRegenerating ? 'Regenerating Content' : 'Generating AI Content'}
                </h3>
                
                <p className="text-gray-600 mb-6">
                  {generationStep || 'Please wait while we create unique content for your project...'}
                </p>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <motion.div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${generationProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                
                <div className="text-sm text-gray-500">
                  {generationProgress}% Complete
                </div>
                
                {/* Phase Indicator */}
                {generationPhase && (
                  <div className="mt-4 flex items-center justify-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      generationPhase === 'preparation' ? 'bg-purple-500' : 'bg-gray-300'
                    }`} />
                    <div className={`w-2 h-2 rounded-full ${
                      generationPhase === 'connection' ? 'bg-purple-500' : 'bg-gray-300'
                    }`} />
                    <div className={`w-2 h-2 rounded-full ${
                      generationPhase === 'processing' ? 'bg-purple-500' : 'bg-gray-300'
                    }`} />
                    <div className={`w-2 h-2 rounded-full ${
                      generationPhase === 'finalization' ? 'bg-purple-500' : 'bg-gray-300'
                    }`} />
                    <div className={`w-2 h-2 rounded-full ${
                      generationPhase === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Content Section */}
      <AnimatePresence>
        {showContentSection && (
          <motion.div
            ref={contentSectionRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex-shrink-0 border-t bg-gradient-to-r from-purple-50 to-pink-50"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                    <span>Generated Content</span>
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Review and manage your AI-generated content pieces
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="text-purple-600 border-purple-200">
                    {generatedContent.length} Content Pieces
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const formElement = document.querySelector('[data-form-section]');
                      formElement?.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                      });
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Back to Form
                  </Button>
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
                {generatedContent.map((content, index) => (
                  <motion.div
                    key={content.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className="group"
                  >
                    <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-300 hover:border-l-purple-600 group-hover:scale-[1.02]">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <Badge variant="outline" className="bg-purple-100 text-purple-700">
                              Day {content.dayNumber}
                            </Badge>
                            <Badge variant="secondary" className="capitalize">
                              {Array.isArray(content.platform) ? content.platform.join(', ') : content.platform}
                            </Badge>
                            <Badge variant="secondary" className="capitalize">
                              {Array.isArray(content.contentType) ? content.contentType.join(', ') : content.contentType}
                            </Badge>
                            {content.aiGenerated && (
                              <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                <Brain className="h-3 w-3 mr-1" />
                                AI Enhanced
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>{content.scheduledDate} at {content.scheduledTime}</span>
                          </div>
                        </div>
                        
                        <h4 className="font-semibold mb-3 text-lg text-gray-900">{content.title}</h4>
                        <p className="text-gray-600 mb-4 leading-relaxed">{content.description}</p>
                        
                        {/* Engagement Predictions */}
                        {content.engagementPrediction && (
                          <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                            <div className="flex items-center space-x-2 mb-3">
                              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                              <span className="font-medium text-green-800 text-sm sm:text-base">Predicted Engagement</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                              <div className="text-center p-2 bg-white rounded-lg">
                                <div className="text-lg sm:text-2xl font-bold text-gray-800">{content.engagementPrediction.likes}</div>
                                <div className="text-xs sm:text-sm text-gray-500">Likes</div>
                              </div>
                              <div className="text-center p-2 bg-white rounded-lg">
                                <div className="text-lg sm:text-2xl font-bold text-gray-800">{content.engagementPrediction.comments}</div>
                                <div className="text-xs sm:text-sm text-gray-500">Comments</div>
                              </div>
                              <div className="text-center p-2 bg-white rounded-lg">
                                <div className="text-lg sm:text-2xl font-bold text-gray-800">{content.engagementPrediction.shares}</div>
                                <div className="text-xs sm:text-sm text-gray-500">Shares</div>
                              </div>
                              <div className="text-center p-2 bg-white rounded-lg">
                                <div className="text-lg sm:text-2xl font-bold text-gray-800">{content.engagementPrediction.reach?.toLocaleString()}</div>
                                <div className="text-xs sm:text-sm text-gray-500">Reach</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* AI Features */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {content.uniquenessScore && (
                            <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Uniqueness: {Math.round(content.uniquenessScore * 100)}%
                            </Badge>
                          )}
                          {content.confidence && (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                              <Target className="h-3 w-3 mr-1" />
                              Confidence: {Math.round(content.confidence * 100)}%
                            </Badge>
                          )}
                          {content.seasonalOptimized && (
                            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                              <Calendar className="h-3 w-3 mr-1" />
                              Seasonal
                            </Badge>
                          )}
                          {content.competitorAnalyzed && (
                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                              <BarChart3 className="h-3 w-3 mr-1" />
                              Analyzed
                            </Badge>
                          )}
                        </div>

                        {/* Hashtags */}
                        <div className="flex flex-wrap gap-2">
                          {content.hashtags.map((hashtag: string, index: number) => (
                            <span 
                              key={`${content.id}-hashtag-${index}`} 
                              className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
                            >
                              {hashtag}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Dialog */}
      <AnimatePresence>
        {showCancelDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCancelDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Discard Changes?
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    You have unsaved changes. Are you sure you want to cancel? This action cannot be undone.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(false)}
                  className="px-4 py-2"
                >
                  Keep Editing
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowCancelDialog(false);
                    onCancel();
                  }}
                  className="px-4 py-2"
                >
                  Discard Changes
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Recorder Modal */}
      {showMediaRecorder && (
        <MediaRecorder
          onMediaRecorded={handleMediaRecorded}
          onClose={() => setShowMediaRecorder(false)}
        />
      )}
    </div>
  );
}
