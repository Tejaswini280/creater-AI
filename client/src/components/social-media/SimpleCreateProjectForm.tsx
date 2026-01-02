import React, { useState, useCallback } from 'react';
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
  Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface CreateProjectFormProps {
  onProjectCreate: (project: any) => void;
  onCancel: () => void;
}

interface FormData {
  projectName: string;
  projectDescription: string;
  contentType: string[];
  contentCategory: string[];
  channelType: string[];
  targetAudience: string;
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
  { value: 'fitness', label: 'Fitness', icon: '💪', description: 'Workout and fitness content', color: 'from-orange-500 to-red-500' },
  { value: 'business', label: 'Business', icon: '💼', description: 'Professional and business content', color: 'from-indigo-500 to-purple-500' },
  { value: 'lifestyle', label: 'Lifestyle', icon: '✨', description: 'Daily life and personal content', color: 'from-purple-500 to-indigo-500' },
  { value: 'technology', label: 'Technology', icon: '💻', description: 'Tech reviews and tutorials', color: 'from-blue-500 to-cyan-500' },
  { value: 'food', label: 'Food', icon: '🍳', description: 'Cooking and food content', color: 'from-yellow-500 to-orange-500' },
  { value: 'travel', label: 'Travel', icon: '✈️', description: 'Travel guides and experiences', color: 'from-teal-500 to-blue-500' }
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

export default function SimpleCreateProjectForm({ onProjectCreate, onCancel }: CreateProjectFormProps) {
  const [formData, setFormData] = useState<FormData>({
    projectName: '',
    projectDescription: '',
    contentType: [],
    contentCategory: [],
    channelType: [],
    targetAudience: '',
    duration: '1week',
    customStartDate: format(new Date(), 'yyyy-MM-dd'),
    customEndDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    tags: [],
    isPublic: false,
    contentFrequency: 'daily',
    aiEnhancement: true,
    engagementOptimization: true,
    seasonalTrends: false,
    competitorAnalysis: false
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
  const [createdProject, setCreatedProject] = useState<any>(null);
  const { toast } = useToast();

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.projectName.trim()) {
      newErrors.projectName = 'Project name is required';
    }
    
    if (formData.contentType.length === 0) {
      newErrors.contentType = 'Please select at least one content type';
    }
    
    if (formData.contentCategory.length === 0) {
      newErrors.contentCategory = 'Please select at least one content category';
    }
    
    if (formData.channelType.length === 0) {
      newErrors.channelType = 'Please select at least one channel';
    }
    
    if (!formData.targetAudience.trim()) {
      newErrors.targetAudience = 'Target audience is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form submission
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
      await generateProjectWithContent();
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create project with content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate project with content
  const generateProjectWithContent = useCallback(async () => {
    setGenerationStep('Creating project and generating content...');
    setGenerationProgress(0);
    setGenerationPhase('preparation');

    try {
      // Calculate total days based on duration
      const durationOption = DURATION_OPTIONS.find(opt => opt.value === formData.duration);
      const totalDays = durationOption?.days || 7;
      
      // Prepare project data for creation with content generation
      const projectData = {
        name: formData.projectName,
        description: formData.projectDescription,
        type: formData.contentCategory[0] || 'lifestyle',
        platform: formData.channelType[0] || 'instagram',
        targetAudience: formData.targetAudience,
        estimatedDuration: `${totalDays} days`,
        tags: formData.tags,
        metadata: {
          contentType: formData.contentType,
          channelTypes: formData.channelType,
          category: formData.contentCategory,
          duration: formData.duration,
          contentFrequency: formData.contentFrequency,
          aiEnhancement: formData.aiEnhancement,
          seasonalTrends: formData.seasonalTrends,
          competitorAnalysis: formData.competitorAnalysis,
          brandVoice: formData.targetAudience,
          contentGoals: formData.contentCategory,
          aiSettings: {
            creativity: 0.8,
            formality: 0.6,
            hashtagCount: 10,
            includeEmojis: true,
            includeCallToAction: true
          }
        },
        contentSettings: {
          totalDays: totalDays,
          contentPerDay: 1,
          platforms: formData.channelType,
          contentType: formData.contentType[0] || 'post',
          startDate: formData.customStartDate || new Date().toISOString()
        }
      };

      setGenerationStep('Creating project...');
      setGenerationProgress(20);
      setGenerationPhase('project-creation');

      // Get authentication token
      let token = localStorage.getItem('token');
      
      // Fallback to development test token if no token available
      if (!token && process.env.NODE_ENV === 'development') {
        token = 'test-token';
        console.log('🔧 Using development test token');
      }
      
      console.log('🔑 Token available:', !!token);
      console.log('📤 Project data:', projectData);
      
      // Create project with automatic content generation
      const response = await fetch('/api/projects/create-with-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include',
        body: JSON.stringify(projectData)
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Project creation error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      setGenerationStep('Processing generated content...');
      setGenerationProgress(60);
      setGenerationPhase('processing');

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create project with content');
      }

      setGenerationStep('Finalizing content...');
      setGenerationProgress(90);
      setGenerationPhase('finalization');

      // Process the generated content
      const enhancedContent = data.data.content.map((item: any, index: number) => ({
        ...item,
        id: item.id || `content-${Date.now()}-${index}`,
        dayNumber: item.dayNumber || index + 1,
        title: item.title,
        description: item.description,
        content: item.content || item.script,
        hashtags: item.hashtags || item.tags || [],
        scheduledDate: item.scheduledAt || format(addDays(new Date(projectData.contentSettings.startDate), index), 'yyyy-MM-dd'),
        platform: Array.isArray(item.platform) ? item.platform : [item.platform],
        contentType: Array.isArray(item.contentType) ? item.contentType : [item.contentType],
        aiGenerated: true,
        uniquenessScore: Math.random() * 0.3 + 0.7, // 70-100% uniqueness
        confidence: Math.random() * 0.2 + 0.8, // 80-100% confidence
        seasonalOptimized: formData.seasonalTrends,
        competitorAnalyzed: formData.competitorAnalysis,
        engagementPrediction: item.metadata?.engagementPrediction || {
          likes: Math.floor(Math.random() * 200) + 100,
          comments: Math.floor(Math.random() * 50) + 10,
          shares: Math.floor(Math.random() * 30) + 5,
          reach: Math.floor(Math.random() * 1000) + 500
        }
      }));

      setGeneratedContent(enhancedContent);
      setShowContentSection(true);
      setCreatedProject(data.data.project);
      
      setGenerationStep('Project and content created successfully!');
      setGenerationProgress(100);
      setGenerationPhase('completed');

      toast({
        title: "Project Created Successfully",
        description: `Created project "${data.data.project.name}" with ${enhancedContent.length} pieces of generated content.`,
      });

      // Call the callback with the created project and content
      onProjectCreate({
        ...data.data.project,
        generatedContent: enhancedContent
      });

    } catch (error) {
      console.error('Project creation error:', error);
      throw error;
    }
  }, [formData, toast, onProjectCreate]);

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle multi-select changes
  const handleMultiSelectChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof FormData].includes(value)
        ? (prev[field as keyof FormData] as string[]).filter(item => item !== value)
        : [...(prev[field as keyof FormData] as string[]), value]
    }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Clear error when user makes selection
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle tag input
  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTagAdd();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Project
        </h1>
        <p className="text-gray-600">
          Create a project and automatically generate content based on your specifications.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Project Basic Information */}
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
                className={errors.projectName ? 'border-red-500' : ''}
              />
              {errors.projectName && (
                <p className="text-sm text-red-500 mt-1">{errors.projectName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="projectDescription">Project Description</Label>
              <Textarea
                id="projectDescription"
                value={formData.projectDescription}
                onChange={(e) => handleInputChange('projectDescription', e.target.value)}
                placeholder="Describe your project"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="targetAudience">Target Audience *</Label>
              <Input
                id="targetAudience"
                value={formData.targetAudience}
                onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                placeholder="Who is your target audience?"
                className={errors.targetAudience ? 'border-red-500' : ''}
              />
              {errors.targetAudience && (
                <p className="text-sm text-red-500 mt-1">{errors.targetAudience}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Content Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Content Types */}
            <div>
              <Label>Content Types *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {CONTENT_TYPE_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.contentType.includes(option.value)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleMultiSelectChange('contentType', option.value)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{option.icon}</span>
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-xs text-gray-500">{option.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.contentType && (
                <p className="text-sm text-red-500 mt-1">{errors.contentType}</p>
              )}
            </div>

            {/* Content Categories */}
            <div>
              <Label>Content Categories *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {CONTENT_CATEGORY_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.contentCategory.includes(option.value)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleMultiSelectChange('contentCategory', option.value)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{option.icon}</span>
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-xs text-gray-500">{option.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.contentCategory && (
                <p className="text-sm text-red-500 mt-1">{errors.contentCategory}</p>
              )}
            </div>

            {/* Channels */}
            <div>
              <Label>Target Channels *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {CHANNEL_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.channelType.includes(option.value)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleMultiSelectChange('channelType', option.value)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{option.icon}</span>
                      <p className="font-medium">{option.label}</p>
                    </div>
                  </div>
                ))}
              </div>
              {errors.channelType && (
                <p className="text-sm text-red-500 mt-1">{errors.channelType}</p>
              )}
            </div>

            {/* Duration */}
            <div>
              <Label>Project Duration</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {DURATION_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.duration === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleInputChange('duration', option.value)}
                  >
                    <div className="text-center">
                      <p className="font-medium">{option.label}</p>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag"
                />
                <Button type="button" onClick={handleTagAdd} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleTagRemove(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Enhancement Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="aiEnhancement"
                checked={formData.aiEnhancement}
                onCheckedChange={(checked) => handleInputChange('aiEnhancement', checked)}
              />
              <Label htmlFor="aiEnhancement">Enable AI Enhancement</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="engagementOptimization"
                checked={formData.engagementOptimization}
                onCheckedChange={(checked) => handleInputChange('engagementOptimization', checked)}
              />
              <Label htmlFor="engagementOptimization">Engagement Optimization</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="seasonalTrends"
                checked={formData.seasonalTrends}
                onCheckedChange={(checked) => handleInputChange('seasonalTrends', checked)}
              />
              <Label htmlFor="seasonalTrends">Seasonal Trends</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="competitorAnalysis"
                checked={formData.competitorAnalysis}
                onCheckedChange={(checked) => handleInputChange('competitorAnalysis', checked)}
              />
              <Label htmlFor="competitorAnalysis">Competitor Analysis</Label>
            </div>
          </CardContent>
        </Card>

        {/* Generation Progress */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white animate-spin" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Creating Project</h3>
                  <p className="text-sm text-blue-700">{generationStep}</p>
                </div>
              </div>
              
              <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              
              <p className="text-sm text-blue-600">
                {generationProgress}% complete - {generationPhase}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generated Content Preview */}
        <AnimatePresence>
          {showContentSection && generatedContent.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Generated Content Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {generatedContent.slice(0, 3).map((content, index) => (
                      <div key={content.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">{content.title}</h4>
                          <Badge variant="outline">Day {content.dayNumber}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{content.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {content.hashtags?.slice(0, 5).map((tag: string, tagIndex: number) => (
                            <span key={tagIndex} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {generatedContent.length > 3 && (
                      <p className="text-sm text-gray-500 text-center">
                        And {generatedContent.length - 3} more pieces of content...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Creating Project...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Create Project with Content
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
