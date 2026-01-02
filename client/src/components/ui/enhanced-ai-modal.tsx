import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Wand2,
  Target,
  MessageSquare,
  TrendingUp,
  Lightbulb,
  Check,
  X,
  RotateCcw,
  Copy,
  Eye,
  EyeOff,
  Zap,
  Brain,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  History,
  Settings,
  Save,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Star,
  AlertCircle
} from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface EnhancementResult {
  enhancedText: string;
  improvements: Array<{
    type: 'grammar' | 'engagement' | 'relevance' | 'seo' | 'tone' | 'platform' | 'audience';
    description: string;
    before: string;
    after: string;
    impact: 'low' | 'medium' | 'high';
    confidence: number;
  }>;
  suggestions: Array<{
    type: 'improvement' | 'warning' | 'opportunity';
    message: string;
    action?: string;
  }>;
  analytics: {
    readabilityScore: number;
    engagementPotential: number;
    seoScore: number;
    platformOptimization: number;
    overallScore: number;
  };
  metadata: {
    processingTime: number;
    modelUsed: string;
    tokensUsed: number;
    version: string;
  };
}

interface EnhancementHistory {
  id: string;
  timestamp: Date;
  originalText: string;
  enhancedText: string;
  improvements: EnhancementResult['improvements'];
  score: number;
}

interface EnhancedAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  field: string;
  context: {
    contentType?: string;
    platform?: string;
    targetAudience?: string;
    category?: string;
    tone?: string;
  };
  onAccept: (enhancedText: string) => void;
  onReject?: () => void;
  existingEnhancements?: EnhancementHistory[];
}

const ENHANCEMENT_MODES = [
  {
    id: 'comprehensive',
    name: 'Comprehensive',
    description: 'Full AI enhancement with all optimizations',
    icon: Sparkles,
    features: ['Grammar', 'Engagement', 'SEO', 'Platform Optimization']
  },
  {
    id: 'engagement',
    name: 'Engagement Boost',
    description: 'Focus on increasing audience interaction',
    icon: Target,
    features: ['Call-to-actions', 'Questions', 'Emotional hooks']
  },
  {
    id: 'platform',
    name: 'Platform Optimized',
    description: 'Tailored for specific social media platform',
    icon: TrendingUp,
    features: ['Hashtags', 'Formatting', 'Length optimization']
  },
  {
    id: 'tone',
    name: 'Tone Adjustment',
    description: 'Adjust writing style and voice',
    icon: MessageSquare,
    features: ['Professional', 'Casual', 'Friendly', 'Authoritative']
  }
];

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Formal, business-like tone' },
  { value: 'casual', label: 'Casual', description: 'Relaxed, conversational tone' },
  { value: 'friendly', label: 'Friendly', description: 'Warm, approachable tone' },
  { value: 'authoritative', label: 'Authoritative', description: 'Confident, expert tone' },
  { value: 'humorous', label: 'Humorous', description: 'Light-hearted, fun tone' },
  { value: 'inspirational', label: 'Inspirational', description: 'Motivational, uplifting tone' }
];

export default function EnhancedAIModal({
  isOpen,
  onClose,
  originalText,
  field,
  context,
  onAccept,
  onReject,
  existingEnhancements = []
}: EnhancedAIModalProps) {
  const { toast } = useToast();
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementResult, setEnhancementResult] = useState<EnhancementResult | null>(null);
  const [activeTab, setActiveTab] = useState('enhance');
  const [selectedMode, setSelectedMode] = useState('comprehensive');
  const [selectedTone, setSelectedTone] = useState(context.tone || 'casual');
  const [creativityLevel, setCreativityLevel] = useState([0.7]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [enhancementHistory, setEnhancementHistory] = useState<EnhancementHistory[]>(existingEnhancements);
  const [comparisonView, setComparisonView] = useState<'split' | 'original' | 'enhanced'>('split');

  // Simulate AI enhancement
  const handleEnhance = async () => {
    if (!originalText.trim()) {
      toast({
        title: "No Content to Enhance",
        description: "Please enter some text before using AI enhancement.",
        variant: "destructive",
      });
      return;
    }

    setIsEnhancing(true);
    setEnhancementResult(null);

    try {
      // Simulate API call with realistic timing
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

      const result = generateMockEnhancementResult(originalText, selectedMode, selectedTone, creativityLevel[0], context);

      setEnhancementResult(result);

      // Add to history
      const historyEntry: EnhancementHistory = {
        id: Date.now().toString(),
        timestamp: new Date(),
        originalText,
        enhancedText: result.enhancedText,
        improvements: result.improvements,
        score: result.analytics.overallScore
      };

      setEnhancementHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10

      toast({
        title: "AI Enhancement Complete! ✨",
        description: `Enhanced with ${Math.round(result.analytics.overallScore)}% improvement score`,
      });

    } catch (error) {
      console.error('AI Enhancement failed:', error);
      toast({
        title: "Enhancement Failed",
        description: "Failed to enhance content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAccept = () => {
    if (enhancementResult) {
      onAccept(enhancementResult.enhancedText);
      onClose();

      toast({
        title: "Enhancement Accepted! 🎉",
        description: "Your content has been enhanced with AI improvements.",
      });
    }
  };

  const handleReject = () => {
    onReject?.();
    onClose();

    toast({
      title: "Enhancement Rejected",
      description: "Original content has been kept.",
    });
  };

  const generateMockEnhancementResult = (
    text: string,
    mode: string,
    tone: string,
    creativity: number,
    context: any
  ): EnhancementResult => {
    // Enhanced mock result generation based on mode and parameters
    let enhancedText = text;

    // Apply enhancements based on selected mode
    switch (mode) {
      case 'comprehensive':
        enhancedText = `🚀 ${enhancedText}\n\nWhat do you think? Share your thoughts below! 💬\n\n#${context.category || 'Content'} #SocialMedia`;
        break;
      case 'engagement':
        enhancedText = `${enhancedText}\n\n🤔 What's your take on this? Drop your thoughts in the comments!\n\n👇 Tag a friend who needs to see this!`;
        break;
      case 'platform':
        const platformTags = {
          instagram: '#Instagram #ContentCreation #SocialMedia',
          tiktok: '#TikTok #Viral #Trending',
          youtube: '#YouTube #Tutorial #LearnWithUs',
          linkedin: '#LinkedIn #Business #Professional',
          facebook: '#Facebook #Community #Connect'
        };
        enhancedText = `${enhancedText}\n\n${platformTags[context.platform as keyof typeof platformTags] || '#SocialMedia'}`;
        break;
      case 'tone':
        const toneEmojis = {
          professional: '💼',
          casual: '😊',
          friendly: '🤗',
          authoritative: '⚡',
          humorous: '😂',
          inspirational: '✨'
        };
        enhancedText = `${toneEmojis[tone as keyof typeof toneEmojis]} ${enhancedText}`;
        break;
    }

    return {
      enhancedText,
      improvements: [
        {
          type: 'engagement',
          description: 'Added engaging call-to-action and questions',
          before: text.substring(0, 30),
          after: enhancedText.substring(0, 30),
          impact: 'high',
          confidence: 0.92
        },
        {
          type: 'platform',
          description: 'Optimized for platform-specific formatting',
          before: text,
          after: enhancedText,
          impact: 'medium',
          confidence: 0.87
        },
        {
          type: 'seo',
          description: 'Added relevant hashtags for discoverability',
          before: text,
          after: enhancedText,
          impact: 'medium',
          confidence: 0.89
        }
      ],
      suggestions: [
        {
          type: 'improvement',
          message: 'Consider adding emojis to increase visual appeal',
          action: 'Add relevant emojis'
        },
        {
          type: 'opportunity',
          message: 'This content performs well with questions at the end',
          action: 'Add engagement question'
        },
        {
          type: 'warning',
          message: 'Text length is optimal for this platform',
          action: 'Keep current length'
        }
      ],
      analytics: {
        readabilityScore: Math.floor(Math.random() * 20) + 75,
        engagementPotential: Math.floor(Math.random() * 30) + 70,
        seoScore: Math.floor(Math.random() * 25) + 65,
        platformOptimization: Math.floor(Math.random() * 20) + 80,
        overallScore: Math.floor(Math.random() * 20) + 80
      },
      metadata: {
        processingTime: Math.floor(Math.random() * 500) + 1500,
        modelUsed: 'gpt-4-turbo',
        tokensUsed: Math.floor(Math.random() * 200) + 300,
        version: '2.1.0'
      }
    };
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getImprovementIcon = (type: string) => {
    switch (type) {
      case 'grammar': return <MessageSquare className="h-4 w-4" />;
      case 'engagement': return <Target className="h-4 w-4" />;
      case 'seo': return <TrendingUp className="h-4 w-4" />;
      case 'tone': return <Wand2 className="h-4 w-4" />;
      case 'platform': return <Sparkles className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'improvement': return <ThumbsUp className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'opportunity': return <Lightbulb className="h-4 w-4 text-blue-600" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-purple-600" />
              <span>AI Content Enhancement</span>
              <Badge variant="secondary" className="text-xs">
                {field}
              </Badge>
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {context.platform || 'Multi-platform'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {context.contentType || 'General'}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-[70vh] overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="enhance" className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4" />
                <span>Enhance</span>
              </TabsTrigger>
              <TabsTrigger value="compare" className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>Compare</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center space-x-2">
                <History className="h-4 w-4" />
                <span>History</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              {/* Enhance Tab */}
              <TabsContent value="enhance" className="h-full overflow-y-auto space-y-6">
                <div className="space-y-6">
                  {/* Enhancement Mode Selection */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Enhancement Mode</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {ENHANCEMENT_MODES.map((mode) => {
                        const Icon = mode.icon;
                        return (
                          <Card
                            key={mode.id}
                            className={`cursor-pointer transition-all duration-200 ${
                              selectedMode === mode.id
                                ? 'ring-2 ring-purple-500 bg-purple-50'
                                : 'hover:shadow-md'
                            }`}
                            onClick={() => setSelectedMode(mode.id)}
                          >
                            <CardContent className="p-4 text-center">
                              <Icon className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                              <h4 className="font-medium text-sm">{mode.name}</h4>
                              <p className="text-xs text-gray-600 mt-1">{mode.description}</p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Advanced Settings */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Advanced Settings</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                      >
                        {showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {showAdvanced ? 'Hide' : 'Show'}
                      </Button>
                    </div>

                    <AnimatePresence>
                      {showAdvanced && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-4 overflow-hidden"
                        >
                          {/* Tone Selection */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium">Writing Tone</Label>
                              <Select value={selectedTone} onValueChange={setSelectedTone}>
                                <SelectTrigger className="mt-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TONE_OPTIONS.map((tone) => (
                                    <SelectItem key={tone.value} value={tone.value}>
                                      {tone.label} - {tone.description}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Creativity Level */}
                            <div>
                              <Label className="text-sm font-medium">
                                Creativity Level: {Math.round(creativityLevel[0] * 100)}%
                              </Label>
                              <Slider
                                value={creativityLevel}
                                onValueChange={setCreativityLevel}
                                max={1}
                                min={0}
                                step={0.1}
                                className="mt-2"
                              />
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Conservative</span>
                                <span>Creative</span>
                              </div>
                            </div>
                          </div>

                          {/* Platform Context */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                              <Switch id="platform-optimize" defaultChecked />
                              <Label htmlFor="platform-optimize" className="text-sm">
                                Platform-specific optimization
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch id="audience-target" defaultChecked />
                              <Label htmlFor="audience-target" className="text-sm">
                                Audience targeting
                              </Label>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Original Text Display */}
                  <div>
                    <Label className="text-sm font-medium">Original Text</Label>
                    <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-gray-900 text-sm whitespace-pre-wrap">{originalText}</p>
                    </div>
                  </div>

                  {/* Enhancement Button */}
                  <div className="flex justify-center">
                    <Button
                      onClick={handleEnhance}
                      disabled={isEnhancing || !originalText.trim()}
                      size="lg"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {isEnhancing ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Enhancing with AI...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          Enhance Content
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Enhancement Result */}
                  {enhancementResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <Card className="border-purple-200 bg-purple-50">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center space-x-2">
                              <Zap className="h-5 w-5 text-purple-600" />
                              <span>AI Enhancement Result</span>
                            </CardTitle>
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                              {Math.round(enhancementResult.analytics.overallScore)}% Improvement
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Enhanced Text */}
                          <div>
                            <Label className="text-sm font-medium">Enhanced Text</Label>
                            <div className="mt-2 p-3 bg-white border border-purple-200 rounded-lg">
                              <p className="text-gray-900 whitespace-pre-wrap">{enhancementResult.enhancedText}</p>
                            </div>
                          </div>

                          {/* Key Improvements */}
                          <div>
                            <Label className="text-sm font-medium">Key Improvements</Label>
                            <div className="mt-2 space-y-2">
                              {enhancementResult.improvements.map((improvement, index) => (
                                <div key={index} className="flex items-start space-x-3 p-3 bg-white border border-purple-200 rounded-lg">
                                  <div className="flex-shrink-0 mt-0.5">
                                    {getImprovementIcon(improvement.type)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="font-medium text-sm capitalize">{improvement.type}</span>
                                      <Badge className={`text-xs ${getImpactColor(improvement.impact)}`}>
                                        {improvement.impact} impact
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {Math.round(improvement.confidence * 100)}% confidence
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600">{improvement.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Suggestions */}
                          <div>
                            <Label className="text-sm font-medium">AI Suggestions</Label>
                            <div className="mt-2 space-y-2">
                              {enhancementResult.suggestions.map((suggestion, index) => (
                                <div key={index} className="flex items-start space-x-3 p-3 bg-white border border-purple-200 rounded-lg">
                                  <div className="flex-shrink-0 mt-0.5">
                                    {getSuggestionIcon(suggestion.type)}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm text-gray-900">{suggestion.message}</p>
                                    {suggestion.action && (
                                      <p className="text-xs text-purple-600 mt-1">{suggestion.action}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </div>
              </TabsContent>

              {/* Compare Tab */}
              <TabsContent value="compare" className="h-full overflow-y-auto space-y-6">
                {enhancementResult ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-center space-x-4 mb-6">
                      <Button
                        variant={comparisonView === 'original' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setComparisonView('original')}
                      >
                        Original
                      </Button>
                      <Button
                        variant={comparisonView === 'split' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setComparisonView('split')}
                      >
                        Split View
                      </Button>
                      <Button
                        variant={comparisonView === 'enhanced' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setComparisonView('enhanced')}
                      >
                        Enhanced
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                      {/* Original Text */}
                      {(comparisonView === 'original' || comparisonView === 'split') && (
                        <Card className="h-full">
                          <CardHeader>
                            <CardTitle className="text-base flex items-center space-x-2">
                              <X className="h-4 w-4 text-red-500" />
                              <span>Original Text</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Textarea
                              value={originalText}
                              readOnly
                              className="min-h-[300px] resize-none border-red-200 bg-red-50"
                            />
                          </CardContent>
                        </Card>
                      )}

                      {/* Enhanced Text */}
                      {(comparisonView === 'enhanced' || comparisonView === 'split') && (
                        <Card className="h-full">
                          <CardHeader>
                            <CardTitle className="text-base flex items-center space-x-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span>Enhanced Text</span>
                              <Badge variant="secondary" className="text-xs">
                                +{Math.round(enhancementResult.analytics.overallScore)}%
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Textarea
                              value={enhancementResult.enhancedText}
                              readOnly
                              className="min-h-[300px] resize-none border-green-200 bg-green-50"
                            />
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Generate an enhancement first to see the comparison</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="h-full overflow-y-auto space-y-6">
                {enhancementResult ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600 mb-2">
                            {enhancementResult.analytics.overallScore}%
                          </div>
                          <div className="text-sm text-gray-600">Overall Score</div>
                          <Progress value={enhancementResult.analytics.overallScore} className="mt-2" />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600 mb-2">
                            {enhancementResult.analytics.readabilityScore}%
                          </div>
                          <div className="text-sm text-gray-600">Readability</div>
                          <Progress value={enhancementResult.analytics.readabilityScore} className="mt-2" />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600 mb-2">
                            {enhancementResult.analytics.engagementPotential}%
                          </div>
                          <div className="text-sm text-gray-600">Engagement</div>
                          <Progress value={enhancementResult.analytics.engagementPotential} className="mt-2" />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600 mb-2">
                            {enhancementResult.analytics.seoScore}%
                          </div>
                          <div className="text-sm text-gray-600">SEO Score</div>
                          <Progress value={enhancementResult.analytics.seoScore} className="mt-2" />
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Settings className="h-5 w-5" />
                          <span>Processing Details</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Processing Time:</span>
                            <span className="ml-2 font-medium">{enhancementResult.metadata.processingTime}ms</span>
                          </div>
                          <div>
                            <span className="text-gray-600">AI Model:</span>
                            <span className="ml-2 font-medium">{enhancementResult.metadata.modelUsed}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Tokens Used:</span>
                            <span className="ml-2 font-medium">{enhancementResult.metadata.tokensUsed}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Version:</span>
                            <span className="ml-2 font-medium">{enhancementResult.metadata.version}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Generate an enhancement to view analytics</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="h-full overflow-y-auto space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Enhancement History</h3>

                  {enhancementHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No enhancement history yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {enhancementHistory.map((entry) => (
                        <Card key={entry.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-sm text-gray-600">
                                    {entry.timestamp.toLocaleDateString()} {entry.timestamp.toLocaleTimeString()}
                                  </span>
                                  <Badge variant="secondary" className="text-xs">
                                    {Math.round(entry.score)}% improvement
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-900 line-clamp-2">{entry.enhancedText}</p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <span className="text-xs text-gray-500">
                                    {entry.improvements.length} improvements made
                                  </span>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm">
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button variant="outline" onClick={handleReject}>
              <X className="h-4 w-4 mr-2" />
              Reject & Keep Original
            </Button>

            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleEnhance} disabled={isEnhancing}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>

              <Button
                onClick={handleAccept}
                disabled={!enhancementResult}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                <Check className="h-4 w-4 mr-2" />
                Accept Enhancement
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
