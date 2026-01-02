import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Plus,
  Sparkles,
  Clock,
  TrendingUp,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Target,
  Zap,
  RefreshCw,
  Settings,
  Play,
  Pause,
  Edit
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, differenceInDays } from 'date-fns';

interface ProjectExtension {
  id: string;
  originalEndDate: Date;
  newEndDate: Date;
  additionalDays: number;
  extensionType: 'fixed' | 'rolling' | 'milestone';
  reason: string;
  aiContentCount: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

interface ContentPreview {
  id: string;
  title: string;
  description: string;
  platform: string;
  scheduledAt: string;
  aiGenerated: boolean;
  status: 'draft' | 'scheduled';
}

interface ExtensionAnalytics {
  totalContentBefore: number;
  totalContentAfter: number;
  projectedEngagement: number;
  contentQualityScore: number;
  platformDistribution: Record<string, number>;
  estimatedCompletionTime: number;
}

interface ProjectExtensionProps {
  projectId: string;
  currentEndDate: Date;
  currentDuration: number;
  platforms: string[];
  category: string;
  contentFrequency: string;
  onExtensionComplete?: (extensionData: ProjectExtension) => void;
  onContentGenerated?: (newContent: ContentPreview[]) => void;
}

const EXTENSION_TYPES = [
  {
    id: 'fixed',
    name: 'Fixed Extension',
    description: 'Add a specific number of days to your project',
    icon: Calendar,
    recommended: true
  },
  {
    id: 'rolling',
    name: 'Rolling Extension',
    description: 'Extend until a specific milestone or goal is reached',
    icon: Target,
    recommended: false
  },
  {
    id: 'milestone',
    name: 'Milestone-Based',
    description: 'Extend based on content performance milestones',
    icon: TrendingUp,
    recommended: false
  }
];

const QUICK_EXTENSIONS = [
  { days: 7, label: '1 Week', description: 'Quick extension for immediate needs' },
  { days: 15, label: '2 Weeks', description: 'Balanced extension for most projects' },
  { days: 30, label: '1 Month', description: 'Extended campaign period' },
  { days: 60, label: '2 Months', description: 'Long-term content strategy' },
  { days: 90, label: '3 Months', description: 'Comprehensive content series' }
];

export default function ProjectExtension({
  projectId,
  currentEndDate,
  currentDuration,
  platforms,
  category,
  contentFrequency,
  onExtensionComplete,
  onContentGenerated
}: ProjectExtensionProps) {
  const { toast } = useToast();

  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedExtensionType, setSelectedExtensionType] = useState('fixed');
  const [customDays, setCustomDays] = useState(30);
  const [extensionReason, setExtensionReason] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analytics, setAnalytics] = useState<ExtensionAnalytics | null>(null);
  const [generatedContent, setGeneratedContent] = useState<ContentPreview[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Calculate extension details
  const additionalDays = customDays;
  const newEndDate = addDays(currentEndDate, additionalDays);
  const newTotalDuration = currentDuration + additionalDays;

  // Estimate content count based on frequency
  const getEstimatedContentCount = () => {
    const frequencyMap = {
      'daily': additionalDays,
      'weekly': Math.ceil(additionalDays / 7),
      'bi-weekly': Math.ceil(additionalDays / 14),
      'monthly': Math.ceil(additionalDays / 30)
    };
    return frequencyMap[contentFrequency as keyof typeof frequencyMap] || Math.ceil(additionalDays / 7);
  };

  const estimatedContentCount = getEstimatedContentCount() * platforms.length;

  // Handle extension analysis
  const handleAnalyzeExtension = async () => {
    setIsAnalyzing(true);

    try {
      // Simulate analysis API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockAnalytics: ExtensionAnalytics = {
        totalContentBefore: Math.floor(Math.random() * 20) + 10,
        totalContentAfter: Math.floor(Math.random() * 20) + 10 + estimatedContentCount,
        projectedEngagement: Math.floor(Math.random() * 40) + 60,
        contentQualityScore: Math.floor(Math.random() * 20) + 75,
        platformDistribution: platforms.reduce((acc, platform) => ({
          ...acc,
          [platform]: Math.floor(Math.random() * 30) + 20
        }), {}),
        estimatedCompletionTime: estimatedContentCount * 2 // 2 seconds per content piece
      };

      setAnalytics(mockAnalytics);
      setCurrentStep(2);

      toast({
        title: "Analysis Complete",
        description: `Extension analysis ready. ${estimatedContentCount} new content pieces will be generated.`,
      });

    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze extension. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle content generation
  const handleGenerateContent = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Simulate content generation with progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Generate mock content
      const mockContent: ContentPreview[] = [];
      const startDate = addDays(currentEndDate, 1);

      for (let i = 0; i < estimatedContentCount; i++) {
        const platformIndex = i % platforms.length;
        const daysFromStart = Math.floor(i / platforms.length);
        const scheduledDate = addDays(startDate, daysFromStart);

        mockContent.push({
          id: `ext_${Date.now()}_${i}`,
          title: `Extended Content ${i + 1} - ${platforms[platformIndex]}`,
          description: `AI-generated content for ${category} campaign extension. Optimized for ${platforms[platformIndex]} audience engagement and platform-specific best practices.`,
          platform: platforms[platformIndex],
          scheduledAt: scheduledDate.toISOString(),
          aiGenerated: true,
          status: 'draft'
        });
      }

      setGeneratedContent(mockContent);
      setGenerationProgress(100);
      setCurrentStep(3);

      // Call callbacks
      onContentGenerated?.(mockContent);

      toast({
        title: "Content Generated Successfully! 🎉",
        description: `${mockContent.length} new content pieces created for your extended project.`,
      });

    } catch (error) {
      console.error('Content generation failed:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle extension completion
  const handleCompleteExtension = async () => {
    try {
      const extensionData: ProjectExtension = {
        id: `ext_${Date.now()}`,
        originalEndDate: currentEndDate,
        newEndDate,
        additionalDays,
        extensionType: selectedExtensionType as any,
        reason: extensionReason,
        aiContentCount: estimatedContentCount,
        status: 'completed',
        createdAt: new Date(),
        completedAt: new Date()
      };

      // Call completion callback
      onExtensionComplete?.(extensionData);

      // Reset and close
      setIsOpen(false);
      setCurrentStep(1);
      setAnalytics(null);
      setGeneratedContent([]);

      toast({
        title: "Project Extended Successfully! 🎉",
        description: `Your project has been extended by ${additionalDays} days with ${estimatedContentCount} new content pieces.`,
      });

    } catch (error) {
      console.error('Extension completion failed:', error);
      toast({
        title: "Extension Failed",
        description: "Failed to complete project extension. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Reset modal when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setAnalytics(null);
      setGeneratedContent([]);
      setGenerationProgress(0);
    }
  }, [isOpen]);

  const steps = [
    { id: 1, name: 'Configure Extension', description: 'Set duration and type' },
    { id: 2, name: 'Review & Analyze', description: 'Check impact and projections' },
    { id: 3, name: 'Generate Content', description: 'AI creates new content' },
    { id: 4, name: 'Complete Extension', description: 'Finalize and activate' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
          <Plus className="h-4 w-4 mr-2" />
          Extend Project
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            <span>Extend Your Project</span>
          </DialogTitle>
          <p className="text-gray-600 mt-1">
            Add more days to your project and let AI generate additional content automatically.
          </p>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                  step.id <= currentStep
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {step.id < currentStep ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 transition-all duration-300 ${
                    step.id < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h3 className="text-sm font-semibold text-gray-900">
              {steps[currentStep - 1]?.name}
            </h3>
            <p className="text-xs text-gray-600">{steps[currentStep - 1]?.description}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Configure Extension */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Current Project Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Current Project Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Current End Date</span>
                      <div className="font-medium">{format(currentEndDate, 'MMM d, yyyy')}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Current Duration</span>
                      <div className="font-medium">{currentDuration} days</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Platforms</span>
                      <div className="font-medium">{platforms.length} active</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Content Frequency</span>
                      <div className="font-medium capitalize">{contentFrequency}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Extension Type Selection */}
              <div>
                <Label className="text-base font-medium mb-4 block">Extension Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {EXTENSION_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <Card
                        key={type.id}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedExtensionType === type.id
                            ? 'ring-2 ring-blue-500 bg-blue-50'
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedExtensionType(type.id)}
                      >
                        <CardContent className="p-4 text-center">
                          <Icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                          <h4 className="font-medium text-sm">{type.name}</h4>
                          <p className="text-xs text-gray-600 mt-1">{type.description}</p>
                          {type.recommended && (
                            <Badge variant="secondary" className="text-xs mt-2">
                              Recommended
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Duration Selection */}
              <div>
                <Label className="text-base font-medium mb-4 block">Extension Duration</Label>

                {/* Quick Extensions */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  {QUICK_EXTENSIONS.map((ext) => (
                    <Button
                      key={ext.days}
                      variant={customDays === ext.days ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCustomDays(ext.days)}
                      className="text-xs"
                    >
                      {ext.label}
                    </Button>
                  ))}
                </div>

                {/* Custom Duration */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <Label className="text-sm">Custom Duration:</Label>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={customDays}
                      onChange={(e) => setCustomDays(parseInt(e.target.value) || 30)}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600">days</span>
                  </div>

                  <div className="text-sm text-gray-600">
                    New end date: <span className="font-medium">{format(newEndDate, 'MMMM d, yyyy')}</span>
                    <br />
                    Estimated content: <span className="font-medium">{estimatedContentCount} pieces</span>
                  </div>
                </div>
              </div>

              {/* Extension Reason */}
              <div>
                <Label htmlFor="reason" className="text-base font-medium">
                  Reason for Extension (Optional)
                </Label>
                <Textarea
                  id="reason"
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="e.g., Strong audience engagement, need more content for campaign goals..."
                  rows={3}
                  className="mt-2"
                />
              </div>
            </motion.div>
          )}

          {/* Step 2: Review & Analyze */}
          {currentStep === 2 && analytics && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Extension Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Extension Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{additionalDays}</div>
                      <div className="text-sm text-gray-600">Days Added</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{estimatedContentCount}</div>
                      <div className="text-sm text-gray-600">New Content</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{analytics.projectedEngagement}%</div>
                      <div className="text-sm text-gray-600">Engagement Boost</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{analytics.contentQualityScore}%</div>
                      <div className="text-sm text-gray-600">Quality Score</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Analytics Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Content Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(analytics.platformDistribution).map(([platform, count]) => (
                        <div key={platform} className="flex items-center justify-between">
                          <span className="capitalize text-sm">{platform}</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={(count / Math.max(...Object.values(analytics.platformDistribution))) * 100} className="w-16 h-2" />
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Projected Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Content Before</span>
                          <span>{analytics.totalContentBefore}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Content After</span>
                          <span className="font-medium">{analytics.totalContentAfter}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Increase</span>
                          <span className="text-green-600 font-medium">
                            +{((analytics.totalContentAfter - analytics.totalContentBefore) / analytics.totalContentBefore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <div className="flex justify-between text-sm">
                          <span>Est. Completion Time</span>
                          <span>{Math.round(analytics.estimatedCompletionTime / 60)} min</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Step 3: Generate Content */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Generation Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Sparkles className="h-5 w-5" />
                    <span>AI Content Generation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Generating {estimatedContentCount} content pieces...</span>
                    <span className="text-sm font-medium">{Math.round(generationProgress)}%</span>
                  </div>
                  <Progress value={generationProgress} className="h-3" />

                  {isGenerating && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">
                        AI is creating optimized content for each platform and scheduling it appropriately.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Generated Content Preview */}
              {generatedContent.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Generated Content Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {generatedContent.slice(0, 5).map((content, index) => (
                        <div key={content.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h5 className="font-medium text-sm truncate">{content.title}</h5>
                              <Badge variant="outline" className="text-xs capitalize">
                                {content.platform}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{content.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {format(new Date(content.scheduledAt), 'MMM d, h:mm a')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {generatedContent.length > 5 && (
                        <div className="text-center text-sm text-gray-500 py-2">
                          +{generatedContent.length - 5} more content pieces generated
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* Step 4: Complete Extension */}
          {currentStep === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-green-900 mb-2">
                    Project Extension Ready!
                  </h3>
                  <p className="text-green-700 mb-4">
                    Your project has been successfully extended with {estimatedContentCount} new AI-generated content pieces.
                  </p>

                  <div className="bg-white rounded-lg p-4 max-w-md mx-auto">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Original Duration:</span>
                        <span className="font-medium">{currentDuration} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Extension:</span>
                        <span className="font-medium">+{additionalDays} days</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>New Total:</span>
                        <span className="font-semibold text-green-600">{newTotalDuration} days</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Click "Complete Extension" to activate the new content schedule and extend your project timeline.
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Back
          </Button>

          <div className="flex items-center space-x-2">
            {currentStep === 1 && (
              <Button
                onClick={handleAnalyzeExtension}
                disabled={isAnalyzing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analyze Extension
                  </>
                )}
              </Button>
            )}

            {currentStep === 2 && (
              <Button
                onClick={() => setCurrentStep(3)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Content
              </Button>
            )}

            {currentStep === 3 && (
              <Button
                onClick={handleGenerateContent}
                disabled={isGenerating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Generation
                  </>
                )}
              </Button>
            )}

            {currentStep === 4 && (
              <Button
                onClick={handleCompleteExtension}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Extension
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
