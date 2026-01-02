import React, { useState, useEffect, useCallback } from 'react';
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
  Loader2,
  Brain,
  Clock,
  Users,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

interface AIProjectFormProps {
  onProjectCreated: (project: any) => void;
  onCancel: () => void;
}

interface FormData {
  title: string;
  description: string;
  projectType: string;
  contentCategory: string[]; // Enhanced: Multi-select content categories
  contentType: string[]; // Enhanced: Multi-select content types
  channelType: string[]; // Enhanced: Multi-select channel types
  duration: number;
  customDuration?: number;
  targetChannels: string[];
  contentFrequency: string;
  targetAudience: string;
  suggestedAudience: string[]; // Enhanced: AI-suggested audience segments
  brandVoice: string;
  contentGoals: string[];
  contentTitle: string;
  contentDescription: string;
  tags: string[];
  aiSettings: {
    creativity: number;
    formality: number;
    hashtagCount: number;
    includeEmojis: boolean;
    includeCallToAction: boolean;
  };
  startDate: string;
}

// Enhanced Content Category Options
const CONTENT_CATEGORY_OPTIONS = [
  { value: 'health', label: 'Health & Wellness', icon: '🏥', description: 'Health tips, medical advice, wellness content', color: 'from-red-500 to-pink-500' },
  { value: 'fitness', label: 'Fitness', icon: '💪', description: 'Workout routines, nutrition tips, fitness motivation', color: 'from-orange-500 to-red-500' },
  { value: 'beauty', label: 'Beauty & Makeup', icon: '💄', description: 'Beauty tutorials, makeup tips, skincare routines', color: 'from-pink-500 to-rose-500' },
  { value: 'lifestyle', label: 'Lifestyle', icon: '✨', description: 'Daily life, wellness, personal development', color: 'from-purple-500 to-indigo-500' },
  { value: 'travel', label: 'Travel', icon: '✈️', description: 'Travel guides, destinations, experiences', color: 'from-teal-500 to-blue-500' },
  { value: 'food', label: 'Food & Cooking', icon: '🍳', description: 'Recipes, cooking tips, food reviews', color: 'from-yellow-500 to-orange-500' },
  { value: 'tech', label: 'Technology', icon: '💻', description: 'Tech reviews, tutorials, industry insights', color: 'from-blue-500 to-cyan-500' },
  { value: 'education', label: 'Education', icon: '📚', description: 'Educational content, courses, learning tips', color: 'from-green-500 to-emerald-500' },
  { value: 'business', label: 'Business', icon: '💼', description: 'Entrepreneurship, marketing, professional tips', color: 'from-indigo-500 to-purple-500' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎭', description: 'Fun content, memes, entertainment', color: 'from-yellow-500 to-amber-500' },
  { value: 'fashion', label: 'Fashion', icon: '👗', description: 'Style tips, fashion trends, outfit ideas', color: 'from-purple-500 to-pink-500' },
  { value: 'gaming', label: 'Gaming', icon: '🎮', description: 'Gaming content, esports, game reviews', color: 'from-green-500 to-lime-500' },
  { value: 'finance', label: 'Finance', icon: '💰', description: 'Financial tips, investment advice, money management', color: 'from-emerald-500 to-teal-500' },
  { value: 'parenting', label: 'Parenting', icon: '👶', description: 'Parenting tips, child development, family content', color: 'from-pink-500 to-purple-500' },
  { value: 'sports', label: 'Sports', icon: '⚽', description: 'Sports news, athlete content, fitness sports', color: 'from-orange-500 to-yellow-500' }
];

// Enhanced Content Type Options
const CONTENT_TYPE_OPTIONS = [
  { value: 'reel', label: 'Reel', icon: '🎬', description: 'Short-form vertical videos (15-90 seconds)', color: 'from-purple-500 to-pink-500' },
  { value: 'post', label: 'Post', icon: '📝', description: 'Image posts with captions and hashtags', color: 'from-blue-500 to-cyan-500' },
  { value: 'video', label: 'Video', icon: '🎥', description: 'Long-form video content (1+ minutes)', color: 'from-red-500 to-orange-500' },
  { value: 'shorts', label: 'Shorts', icon: '⚡', description: 'Quick, engaging short videos (under 60 seconds)', color: 'from-yellow-500 to-amber-500' },
  { value: 'story', label: 'Story', icon: '📱', description: 'Temporary 24-hour content', color: 'from-green-500 to-emerald-500' },
  { value: 'carousel', label: 'Carousel', icon: '🔄', description: 'Multiple images in one post', color: 'from-indigo-500 to-purple-500' },
  { value: 'live', label: 'Live Stream', icon: '🔴', description: 'Real-time streaming content', color: 'from-red-500 to-pink-500' },
  { value: 'igtv', label: 'IGTV', icon: '📺', description: 'Long-form vertical videos for Instagram', color: 'from-purple-500 to-indigo-500' },
  { value: 'tutorial', label: 'Tutorial', icon: '🎓', description: 'Step-by-step educational content', color: 'from-blue-500 to-teal-500' },
  { value: 'review', label: 'Review', icon: '⭐', description: 'Product or service reviews', color: 'from-yellow-500 to-orange-500' }
];

// Legacy PROJECT_TYPE_OPTIONS for backward compatibility
const PROJECT_TYPE_OPTIONS = CONTENT_CATEGORY_OPTIONS;

const CHANNEL_OPTIONS = [
  { value: 'instagram', label: 'Instagram', icon: '📸', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { value: 'facebook', label: 'Facebook', icon: '📘', color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼', color: 'bg-gradient-to-r from-blue-600 to-blue-700' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵', color: 'bg-gradient-to-r from-black to-gray-800' },
  { value: 'youtube', label: 'YouTube', icon: '📺', color: 'bg-gradient-to-r from-red-500 to-red-600' },
  { value: 'twitter', label: 'Twitter', icon: '🐦', color: 'bg-gradient-to-r from-blue-400 to-blue-500' }
];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily', description: '1 post per day' },
  { value: 'weekly', label: 'Weekly', description: '1 post per week' },
  { value: 'bi-weekly', label: 'Bi-weekly', description: '2 posts per week' },
  { value: 'monthly', label: 'Monthly', description: '1 post per month' }
];

const BRAND_VOICE_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Formal, authoritative tone' },
  { value: 'casual', label: 'Casual', description: 'Relaxed, friendly tone' },
  { value: 'humorous', label: 'Humorous', description: 'Funny, entertaining tone' },
  { value: 'inspirational', label: 'Inspirational', description: 'Motivating, uplifting tone' },
  { value: 'educational', label: 'Educational', description: 'Informative, teaching tone' },
  { value: 'conversational', label: 'Conversational', description: 'Chatty, engaging tone' }
];

const CONTENT_GOALS = [
  'Increase brand awareness',
  'Drive engagement',
  'Generate leads',
  'Build community',
  'Educate audience',
  'Entertain followers',
  'Promote products',
  'Share expertise'
];

export default function AIProjectForm({ onProjectCreated, onCancel }: AIProjectFormProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    projectType: '',
    contentCategory: [],
    contentType: [],
    channelType: [],
    duration: 7,
    customDuration: undefined,
    targetChannels: [],
    contentFrequency: 'daily',
    targetAudience: '',
    suggestedAudience: [],
    brandVoice: 'professional',
    contentGoals: [],
    contentTitle: '',
    contentDescription: '',
    tags: [],
    aiSettings: {
      creativity: 0.7,
      formality: 0.5,
      hashtagCount: 10,
      includeEmojis: true,
      includeCallToAction: true
    },
    startDate: format(new Date(), 'yyyy-MM-dd')
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();

  const totalSteps = 4;

  const updateFormData = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateAISettings = useCallback((field: keyof FormData['aiSettings'], value: any) => {
    setFormData(prev => ({
      ...prev,
      aiSettings: { ...prev.aiSettings, [field]: value }
    }));
  }, []);

  const addTag = useCallback(() => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateFormData('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  }, [tagInput, formData.tags, updateFormData]);

  // AI Audience Suggestion Logic
  const generateAudienceSuggestions = useCallback(async () => {
    const { contentCategory, contentType, channelType, projectName, contentName } = formData;
    
    if (contentCategory.length === 0 || contentType.length === 0 || channelType.length === 0 || !projectName || !contentName) {
      return [];
    }

    try {
      const response = await fetch('/api/social-ai/generate-audience-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          projectName,
          contentName,
          contentTypes: contentType,
          contentCategories: contentCategory,
          channelTypes: channelType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI suggestions');
      }

      const data = await response.json();
      if (data.success && data.suggestions) {
        return data.suggestions;
      } else {
        throw new Error(data.message || 'Failed to generate suggestions');
      }
    } catch (error) {
      console.error('Error generating AI audience suggestions:', error);
      return [];
    }
  }, [formData]);

  // Update suggested audience when form inputs change
  useEffect(() => {
    const updateSuggestions = async () => {
      const suggestions = await generateAudienceSuggestions();
    updateFormData('suggestedAudience', suggestions);
    };
    
    updateSuggestions();
  }, [formData.contentCategory, formData.contentType, formData.channelType, formData.title, formData.contentTitle, generateAudienceSuggestions, updateFormData]);

  const removeTag = useCallback((tagToRemove: string) => {
    updateFormData('tags', formData.tags.filter(tag => tag !== tagToRemove));
  }, [formData.tags, updateFormData]);

  // Enhanced validation function
  const validateForm = useCallback(() => {
    const newErrors: string[] = [];

    if (!formData.title.trim()) {
      newErrors.push('Project title is required');
    }

    if (!formData.description.trim()) {
      newErrors.push('Project description is required');
    }

    if (formData.contentCategory.length === 0) {
      newErrors.push('Please select at least one content category');
    }

    if (formData.contentType.length === 0) {
      newErrors.push('Please select at least one content type');
    }

    if (formData.channelType.length === 0) {
      newErrors.push('Please select at least one channel type');
    }

    if (formData.duration < 1) {
      newErrors.push('Duration must be at least 1 day');
    }

    if (formData.contentGoals.length === 0) {
      newErrors.push('Please select at least one content goal');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  }, [formData]);

  const toggleChannel = useCallback((channel: string) => {
    const newChannels = formData.targetChannels.includes(channel)
      ? formData.targetChannels.filter(c => c !== channel)
      : [...formData.targetChannels, channel];
    updateFormData('targetChannels', newChannels);
  }, [formData.targetChannels, updateFormData]);

  const toggleContentGoal = useCallback((goal: string) => {
    const newGoals = formData.contentGoals.includes(goal)
      ? formData.contentGoals.filter(g => g !== goal)
      : [...formData.contentGoals, goal];
    updateFormData('contentGoals', newGoals);
  }, [formData.contentGoals, updateFormData]);


  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationStep('Creating AI project...');

    try {
      const response = await fetch('/api/ai-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const result = await response.json();
      
      setGenerationStep('Project created successfully!');
      setGeneratedContent(result.data.contentItems || []);
      setShowPreview(true);
      
      toast({
        title: "Success!",
        description: "AI project created with generated content and calendar",
      });

      setTimeout(() => {
        onProjectCreated(result.data);
      }, 2000);

    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Basics</h2>
        <p className="text-gray-600">Let's start with the fundamental details of your AI project</p>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="title">Project Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => updateFormData('title', e.target.value)}
            placeholder="e.g., Fitness Transformation Journey"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description">Project Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateFormData('description', e.target.value)}
            placeholder="Describe your project goals and vision..."
            className="mt-1"
            rows={3}
          />
        </div>

        {/* Enhanced Content Category Selection */}
        <div>
          <Label>Content Category *</Label>
          <p className="text-sm text-gray-600 mb-3">Select one or more categories that best describe your content</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
            {CONTENT_CATEGORY_OPTIONS.map((category) => (
              <Card
                key={category.value}
                className={`cursor-pointer transition-all ${
                  formData.contentCategory.includes(category.value)
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:shadow-md'
                }`}
                onClick={() => {
                  const newCategories = formData.contentCategory.includes(category.value)
                    ? formData.contentCategory.filter(c => c !== category.value)
                    : [...formData.contentCategory, category.value];
                  updateFormData('contentCategory', newCategories);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <h3 className="font-medium text-sm">{category.label}</h3>
                      <p className="text-xs text-gray-600">{category.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Enhanced Content Type Selection */}
        <div>
          <Label>Content Type *</Label>
          <p className="text-sm text-gray-600 mb-3">Choose the types of content you want to create</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
            {CONTENT_TYPE_OPTIONS.map((type) => (
              <Card
                key={type.value}
                className={`cursor-pointer transition-all ${
                  formData.contentType.includes(type.value)
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:shadow-md'
                }`}
                onClick={() => {
                  const newTypes = formData.contentType.includes(type.value)
                    ? formData.contentType.filter(t => t !== type.value)
                    : [...formData.contentType, type.value];
                  updateFormData('contentType', newTypes);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <h3 className="font-medium text-sm">{type.label}</h3>
                      <p className="text-xs text-gray-600">{type.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Enhanced Channel Type Selection */}
        <div>
          <Label>Channel Type *</Label>
          <p className="text-sm text-gray-600 mb-3">Select the social media platforms for your content</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
            {CHANNEL_OPTIONS.map((channel) => (
              <Card
                key={channel.value}
                className={`cursor-pointer transition-all ${
                  formData.channelType.includes(channel.value)
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:shadow-md'
                }`}
                onClick={() => {
                  const newChannels = formData.channelType.includes(channel.value)
                    ? formData.channelType.filter(c => c !== channel.value)
                    : [...formData.channelType, channel.value];
                  updateFormData('channelType', newChannels);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{channel.icon}</span>
                    <span className="font-medium">{channel.label}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Strategy</h2>
        <p className="text-gray-600">Define your content approach and target audience</p>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="contentTitle">Content Title *</Label>
          <Input
            id="contentTitle"
            value={formData.contentTitle}
            onChange={(e) => updateFormData('contentTitle', e.target.value)}
            placeholder="e.g., Daily Fitness Tips"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="contentDescription">Content Description</Label>
          <Textarea
            id="contentDescription"
            value={formData.contentDescription}
            onChange={(e) => updateFormData('contentDescription', e.target.value)}
            placeholder="Describe the type of content you want to create..."
            className="mt-1"
            rows={3}
          />
        </div>

        {/* AI-Suggested Target Audience */}
        {formData.suggestedAudience.length > 0 && (
          <div>
            <Label className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-500" />
              AI-Suggested Target Audience
            </Label>
            <p className="text-sm text-gray-600 mb-3">
              Based on your content category, type, and channel selections, here are suggested audience segments:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {formData.suggestedAudience.map((audience, index) => (
                <Card
                  key={index}
                  className="cursor-pointer transition-all hover:shadow-md border border-blue-200 bg-blue-50/50"
                  onClick={() => {
                    if (formData.targetAudience) {
                      updateFormData('targetAudience', formData.targetAudience + ', ' + audience);
                    } else {
                      updateFormData('targetAudience', audience);
                    }
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">{audience}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="targetAudience">Target Audience</Label>
          <Textarea
            id="targetAudience"
            value={formData.targetAudience}
            onChange={(e) => updateFormData('targetAudience', e.target.value)}
            placeholder="Describe your target audience or click on AI suggestions above..."
            className="mt-1"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Tip: Click on AI suggestions above to automatically add them to your target audience description
          </p>
        </div>

        <div>
          <Label>Content Goals</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {CONTENT_GOALS.map((goal) => (
              <div key={goal} className="flex items-center space-x-2">
                <Checkbox
                  id={goal}
                  checked={formData.contentGoals.includes(goal)}
                  onCheckedChange={() => toggleContentGoal(goal)}
                />
                <Label htmlFor={goal} className="text-sm">{goal}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Timeline & Frequency</h2>
        <p className="text-gray-600">Set your project duration and posting schedule</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Project Duration</Label>
          <div className="grid grid-cols-4 gap-3 mt-2">
            {[
              { value: 7, label: '1 Week' },
              { value: 15, label: '15 Days' },
              { value: 30, label: '30 Days' },
              { value: 60, label: '60 Days' }
            ].map((duration) => (
              <Card
                key={duration.value}
                className={`cursor-pointer transition-all ${
                  formData.duration === duration.value
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:shadow-md'
                }`}
                onClick={() => updateFormData('duration', duration.value)}
              >
                <CardContent className="p-4 text-center">
                  <h3 className="font-medium">{duration.label}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Label>Content Frequency</Label>
          <Select value={formData.contentFrequency} onValueChange={(value) => updateFormData('contentFrequency', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map((freq) => (
                <SelectItem key={freq.value} value={freq.value}>
                  <div>
                    <div className="font-medium">{freq.label}</div>
                    <div className="text-sm text-gray-600">{freq.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Brand Voice</Label>
          <Select value={formData.brandVoice} onValueChange={(value) => updateFormData('brandVoice', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BRAND_VOICE_OPTIONS.map((voice) => (
                <SelectItem key={voice.value} value={voice.value}>
                  <div>
                    <div className="font-medium">{voice.label}</div>
                    <div className="text-sm text-gray-600">{voice.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => updateFormData('startDate', e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Settings</h2>
        <p className="text-gray-600">Customize how AI generates your content</p>
      </div>

      <div className="space-y-6">
        <div>
          <Label>Creativity Level</Label>
          <div className="mt-2">
            <Slider
              value={[formData.aiSettings.creativity]}
              onValueChange={([value]) => updateAISettings('creativity', value)}
              max={1}
              min={0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>Conservative</span>
              <span>Creative</span>
            </div>
          </div>
        </div>

        <div>
          <Label>Formality Level</Label>
          <div className="mt-2">
            <Slider
              value={[formData.aiSettings.formality]}
              onValueChange={([value]) => updateAISettings('formality', value)}
              max={1}
              min={0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>Casual</span>
              <span>Formal</span>
            </div>
          </div>
        </div>

        <div>
          <Label>Hashtag Count</Label>
          <div className="mt-2">
            <Slider
              value={[formData.aiSettings.hashtagCount]}
              onValueChange={([value]) => updateAISettings('hashtagCount', value)}
              max={30}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="text-center text-sm text-gray-600 mt-1">
              {formData.aiSettings.hashtagCount} hashtags
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeEmojis"
              checked={formData.aiSettings.includeEmojis}
              onCheckedChange={(checked) => updateAISettings('includeEmojis', checked)}
            />
            <Label htmlFor="includeEmojis">Include Emojis</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeCallToAction"
              checked={formData.aiSettings.includeCallToAction}
              onCheckedChange={(checked) => updateAISettings('includeCallToAction', checked)}
            />
            <Label htmlFor="includeCallToAction">Include Call-to-Action</Label>
          </div>
        </div>

        <div>
          <Label>Tags</Label>
          <div className="mt-2">
            <div className="flex space-x-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button type="button" onClick={addTag} size="sm">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderPreview = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-green-600 mb-2">Project Created Successfully!</h2>
        <p className="text-gray-600">Your AI project has been generated with content and calendar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Generated Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {generatedContent.length} pieces
            </div>
            <p className="text-sm text-gray-600">
              AI-generated content ready for your {formData.duration}-day project
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              Content Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formData.duration} days
            </div>
            <p className="text-sm text-gray-600">
              Optimized posting schedule across {formData.targetChannels.length} platforms
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center space-x-4">
        <Button onClick={onCancel} variant="outline">
          Close
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create AI Project</h1>
            <p className="text-gray-600">Step {currentStep} of {totalSteps}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <AnimatePresence mode="wait">
            {showPreview ? (
              renderPreview()
            ) : (
              <>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
              </>
            )}
          </AnimatePresence>

          {errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                <AlertCircle className="h-4 w-4" />
                Please fix the following errors:
              </div>
              <ul className="list-disc list-inside text-sm text-red-700">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        {!showPreview && (
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            <div className="flex items-center space-x-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i + 1 <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {currentStep === totalSteps ? (
              <Button
                onClick={handleSubmit}
                disabled={isGenerating}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {generationStep || 'Creating...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create AI Project
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={nextStep}>
                Next
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
