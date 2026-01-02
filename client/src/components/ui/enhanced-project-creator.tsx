import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Loader2,
  FileText,
  Target,
  Calendar as CalendarIcon,
  Link2,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  Clock,
  Users,
  TrendingUp
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import AIEnhancement from './ai-enhancement';

// Enhanced project creation schema
const projectFormSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  description: z.string().optional(),
  contentType: z.string().min(1, "Please select a content type"),
  channelTypes: z.array(z.string()).min(1, "Please select at least one channel"),
  category: z.string().min(1, "Please select a category"),
  duration: z.enum(['1week', '15days', '30days', 'custom']),
  customDuration: z.number().optional(),
  contentFrequency: z.enum(['daily', 'weekly', 'bi-weekly', 'monthly']),
  calendarPreference: z.enum(['ai-generated', 'custom']),
  aiEnhancement: z.boolean().default(true),
  targetAudience: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  notificationsEnabled: z.boolean().default(true)
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface EnhancedProjectCreatorProps {
  onProjectCreate?: (projectData: ProjectFormData) => void;
  onCancel?: () => void;
}

export default function EnhancedProjectCreator({ onProjectCreate, onCancel }: EnhancedProjectCreatorProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showAIPreview, setShowAIPreview] = useState(false);
  const [aiEnhancingField, setAiEnhancingField] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      description: '',
      contentType: '',
      channelTypes: [],
      category: '',
      duration: '1week',
      contentFrequency: 'weekly',
      calendarPreference: 'ai-generated',
      aiEnhancement: true,
      targetAudience: '',
      tags: [],
      isPublic: false,
      notificationsEnabled: true
    }
  });

  const watchedValues = watch();

  // Multi-step form steps
  const steps = [
    { id: 1, name: 'Project Basics', description: 'Name and description', icon: FileText },
    { id: 2, name: 'Content Details', description: 'Type, category, and audience', icon: Target },
    { id: 3, name: 'Scheduling', description: 'Duration and frequency', icon: CalendarIcon },
    { id: 4, name: 'Platform Integration', description: 'Connect social accounts', icon: Link2 },
    { id: 5, name: 'AI Generation', description: 'Review and generate content', icon: Sparkles }
  ];

  // AI Enhancement handler
  const handleAIEnhancement = async (field: string, currentValue: string) => {
    if (!currentValue.trim()) {
      toast({
        title: "No Content to Enhance",
        description: "Please enter some text before using AI enhancement.",
        variant: "destructive",
      });
      return;
    }

    setAiEnhancingField(field);
    setShowAIPreview(true);

    // Simulate AI enhancement
    setTimeout(() => {
      const enhancedText = `${currentValue} [AI Enhanced with better engagement hooks and optimized keywords]`;
      setValue(field as any, enhancedText);
      setAiEnhancingField(null);
      setShowAIPreview(false);

      toast({
        title: "AI Enhancement Complete! 🎉",
        description: `${field} has been enhanced with AI improvements`,
      });
    }, 2000);
  };

  // Platform toggle handler
  const handlePlatformToggle = (platform: string, checked: boolean) => {
    let updatedPlatforms;
    if (checked) {
      updatedPlatforms = [...selectedPlatforms, platform];
    } else {
      updatedPlatforms = selectedPlatforms.filter(p => p !== platform);
    }
    setSelectedPlatforms(updatedPlatforms);
    setValue('channelTypes', updatedPlatforms);
  };

  // Project creation handler
  const onSubmit = async (data: ProjectFormData) => {
    setIsGenerating(true);

    try {
      // Simulate AI content generation
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mock generated content
      const mockContent = [
        {
          id: '1',
          title: 'Welcome to Your Content Journey',
          description: 'Starting your amazing content series with engaging hooks and valuable insights.',
          platform: selectedPlatforms[0] || 'instagram',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          status: 'draft',
          aiGenerated: true
        },
        {
          id: '2',
          title: 'Deep Dive: Best Practices',
          description: 'Exploring the latest trends and strategies in your niche for maximum engagement.',
          platform: selectedPlatforms[1] || selectedPlatforms[0] || 'instagram',
          scheduledAt: new Date(Date.now() + 172800000).toISOString(),
          status: 'draft',
          aiGenerated: true
        }
      ];

      setGeneratedContent(mockContent);

      toast({
        title: "Project Created Successfully! 🎉",
        description: `Generated ${mockContent.length} content pieces for your project`,
      });

      // Call the onProjectCreate callback
      if (onProjectCreate) {
        onProjectCreate(data);
      }

    } catch (error) {
      toast({
        title: "Creation Failed",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const StepIcon = ({ step }: { step: typeof steps[0] }) => {
    const Icon = step.icon;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            {onCancel && (
              <Button
                variant="ghost"
                onClick={onCancel}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
              <p className="text-gray-600">Build your social media content strategy with AI</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    step.id <= currentStep
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {step.id < currentStep ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 transition-all duration-300 ${
                      step.id < currentStep ? 'bg-purple-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {steps[currentStep - 1]?.name}
            </h2>
            <p className="text-gray-600">{steps[currentStep - 1]?.description}</p>
          </div>
        </div>

        {/* Main Form Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              {/* Step 1: Project Basics */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-base font-medium">
                      Project Name *
                    </Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="e.g., Summer Fitness Challenge 2024"
                      className="mt-2"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="description" className="text-base font-medium">
                        Project Description
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAIEnhancement('description', watchedValues.description || '')}
                        disabled={!watchedValues.description?.trim() || aiEnhancingField === 'description'}
                        className="flex items-center space-x-2"
                      >
                        {aiEnhancingField === 'description' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        <span>Enhance with AI</span>
                      </Button>
                    </div>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Describe your project goals, target audience, and content strategy..."
                      rows={4}
                      className="resize-none"
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="aiEnhancement"
                      {...register('aiEnhancement')}
                      defaultChecked={true}
                    />
                    <Label htmlFor="aiEnhancement" className="text-sm">
                      Enable AI enhancement for content generation
                    </Label>
                  </div>
                </div>
              )}

              {/* Step 2: Content Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="contentType" className="text-base font-medium">
                        Content Type *
                      </Label>
                      <Select
                        value={watchedValues.contentType}
                        onValueChange={(value) => setValue('contentType', value)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fitness">🏋️ Fitness & Health</SelectItem>
                          <SelectItem value="tech">💻 Technology</SelectItem>
                          <SelectItem value="business">💼 Business</SelectItem>
                          <SelectItem value="lifestyle">🌟 Lifestyle</SelectItem>
                          <SelectItem value="education">📚 Education</SelectItem>
                          <SelectItem value="food">🍽️ Food & Cooking</SelectItem>
                          <SelectItem value="travel">✈️ Travel</SelectItem>
                          <SelectItem value="fashion">👗 Fashion & Beauty</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.contentType && (
                        <p className="text-red-500 text-sm mt-1">{errors.contentType.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="category" className="text-base font-medium">
                        Content Category *
                      </Label>
                      <Select
                        value={watchedValues.category}
                        onValueChange={(value) => setValue('category', value)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="educational">Educational</SelectItem>
                          <SelectItem value="promotional">Promotional</SelectItem>
                          <SelectItem value="engagement">Community Engagement</SelectItem>
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                          <SelectItem value="informational">Informational</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="targetAudience" className="text-base font-medium">
                      Target Audience
                    </Label>
                    <Input
                      id="targetAudience"
                      {...register('targetAudience')}
                      placeholder="e.g., Young professionals, Fitness enthusiasts, Tech-savvy millennials"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-medium">
                      Tags (Optional)
                    </Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {['viral', 'trending', 'educational', 'entertainment', 'motivation', 'tips'].map((tag) => (
                        <Badge
                          key={tag}
                          variant={watchedValues.tags?.includes(tag) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            const currentTags = watchedValues.tags || [];
                            const updatedTags = currentTags.includes(tag)
                              ? currentTags.filter(t => t !== tag)
                              : [...currentTags, tag];
                            setValue('tags', updatedTags);
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Scheduling */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-base font-medium">
                        Project Duration *
                      </Label>
                      <RadioGroup
                        value={watchedValues.duration}
                        onValueChange={(value) => setValue('duration', value as any)}
                        className="mt-3 space-y-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="1week" id="1week" />
                          <Label htmlFor="1week">1 Week</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="15days" id="15days" />
                          <Label htmlFor="15days">15 Days</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="30days" id="30days" />
                          <Label htmlFor="30days">30 Days</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="custom" id="custom" />
                          <Label htmlFor="custom">Custom Duration</Label>
                        </div>
                      </RadioGroup>

                      {watchedValues.duration === 'custom' && (
                        <div className="mt-4">
                          <Label htmlFor="customDuration">Custom Duration (days)</Label>
                          <Input
                            id="customDuration"
                            type="number"
                            min="1"
                            max="365"
                            {...register('customDuration', { valueAsNumber: true })}
                            placeholder="Enter number of days"
                            className="mt-2"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-base font-medium">
                        Content Frequency *
                      </Label>
                      <RadioGroup
                        value={watchedValues.contentFrequency}
                        onValueChange={(value) => setValue('contentFrequency', value as any)}
                        className="mt-3 space-y-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="daily" id="daily" />
                          <Label htmlFor="daily">Daily</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="weekly" id="weekly" />
                          <Label htmlFor="weekly">Weekly</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="bi-weekly" id="bi-weekly" />
                          <Label htmlFor="bi-weekly">Bi-weekly</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="monthly" id="monthly" />
                          <Label htmlFor="monthly">Monthly</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Platform Integration */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Connect Your Social Media Accounts</h3>
                    <p className="text-gray-600 mb-6">
                      Link your social platforms to automatically publish content and track performance.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { id: 'instagram', name: 'Instagram', icon: '📸', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
                        { id: 'facebook', name: 'Facebook', icon: '👥', color: 'bg-blue-600' },
                        { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-blue-700' },
                        { id: 'youtube', name: 'YouTube', icon: '🎬', color: 'bg-red-600' },
                        { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-black' },
                        { id: 'twitter', name: 'Twitter', icon: '🐦', color: 'bg-sky-500' }
                      ].map((platform) => (
                        <Card
                          key={platform.id}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedPlatforms.includes(platform.id) ? 'ring-2 ring-purple-500' : ''
                          }`}
                          onClick={() => handlePlatformToggle(platform.id, !selectedPlatforms.includes(platform.id))}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center`}>
                                  <span className="text-white text-lg">{platform.icon}</span>
                                </div>
                                <div>
                                  <h4 className="font-medium">{platform.name}</h4>
                                  <p className="text-sm text-gray-600">Click to connect</p>
                                </div>
                              </div>
                              <Checkbox
                                checked={selectedPlatforms.includes(platform.id)}
                                onChange={() => {}} // Handled by card click
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: AI Generation */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Ready to Generate Your Content!</h3>
                    <p className="text-gray-600 mb-6">
                      AI will create a personalized content calendar based on your project details.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-medium mb-4">Project Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <span className="ml-2 font-medium">{watchedValues.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-2 font-medium">{watchedValues.contentType}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <span className="ml-2 font-medium">{watchedValues.duration}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Platforms:</span>
                        <span className="ml-2 font-medium">{selectedPlatforms.length} selected</span>
                      </div>
                    </div>
                  </div>

                  {isGenerating && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Generating AI content calendar...</p>
                      <p className="text-sm text-gray-500 mt-2">
                        This may take a few moments depending on your project size.
                      </p>
                    </div>
                  )}

                  {generatedContent.length > 0 && (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 text-green-700">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Content Generated Successfully!</span>
                        </div>
                        <p className="text-green-600 text-sm mt-1">
                          Generated {generatedContent.length} content pieces for your project.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium">Generated Content Preview</h4>
                        {generatedContent.map((content, index) => (
                          <Card key={content.id} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium">{content.title}</h5>
                                <p className="text-sm text-gray-600 mt-1">{content.description}</p>
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                  <span>Platform: {content.platform}</span>
                                  <span>Status: {content.status}</span>
                                  <span>AI Generated: {content.aiGenerated ? 'Yes' : 'No'}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          <div className="flex items-center space-x-2">
            {currentStep < 5 ? (
              <Button
                onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
                disabled={
                  (currentStep === 1 && !watchedValues.name) ||
                  (currentStep === 2 && (!watchedValues.contentType || !watchedValues.category)) ||
                  (currentStep === 3 && !watchedValues.duration) ||
                  (currentStep === 4 && selectedPlatforms.length === 0)
                }
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Next Step
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={isGenerating}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Project with AI
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* AI Enhancement Modal */}
      <Dialog open={showAIPreview} onOpenChange={setShowAIPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span>AI Content Enhancement</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="text-purple-700 font-medium">Enhancing your content...</span>
              </div>
              <p className="text-purple-600 text-sm">
                AI is analyzing your content and generating improvements based on platform best practices and audience engagement patterns.
              </p>
            </div>

            <div className="text-center py-8">
              <p className="text-gray-600">Please wait while we enhance your content...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
