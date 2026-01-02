import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Zap, 
  Copy, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Target,
  Search,
  Eye,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface OptimizationResult {
  success: boolean;
  optimizedContent?: string;
  platformAdjustments?: Record<string, string>;
  seoSuggestions?: {
    keywords: string[];
    title: string;
    metaDescription: string;
  };
  improvementsSummary?: string[];
  message?: string;
}

export default function ContentOptimization() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  
  // Form state
  const [rawContent, setRawContent] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);

  // Available options
  const availablePlatforms = ['YouTube', 'LinkedIn', 'Instagram', 'TikTok', 'Twitter', 'Facebook', 'Blog', 'Email'];
  const availableGoals = ['Engagement', 'Reach', 'Conversion', 'SEO', 'Clarity'];

  const handlePlatformChange = (platform: string, checked: boolean) => {
    if (checked) {
      setPlatforms(prev => [...prev, platform]);
    } else {
      setPlatforms(prev => prev.filter(p => p !== platform));
    }
  };

  const handleGoalChange = (goal: string, checked: boolean) => {
    if (checked) {
      setGoals(prev => [...prev, goal]);
    } else {
      setGoals(prev => prev.filter(g => g !== goal));
    }
  };

  const optimizeContent = async () => {
    // Validate content is not empty
    if (!rawContent.trim()) {
      toast.error('Please enter content to optimize');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/optimize-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rawContent,
          platforms,
          goals
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        toast.success('Content optimized successfully!');
      } else {
        throw new Error(data.message || 'Optimization failed');
      }
    } catch (error) {
      console.error('Optimization error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to optimize content';
      setResult({
        success: false,
        message: errorMessage
      });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const isContentEmpty = !rawContent.trim();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-green-600 flex items-center gap-2">
            <Zap className="h-8 w-8" />
            Content Optimization
          </h1>
          <p className="text-gray-600 mt-1">
            Optimize your content for maximum impact across platforms
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Content to Optimize
            </CardTitle>
            <CardDescription>
              Enter your content and select optimization parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="content">Content to Optimize *</Label>
              <Textarea
                id="content"
                placeholder="Paste your content here for optimization..."
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                className="mt-1 min-h-[120px]"
                rows={6}
              />
              {isContentEmpty && (
                <p className="text-sm text-red-500 mt-1">Content is required</p>
              )}
            </div>

            <div>
              <Label className="font-medium">Platforms</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {availablePlatforms.map((platform) => (
                  <label key={platform} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={platforms.includes(platform)}
                      onChange={(e) => handlePlatformChange(platform, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">{platform}</span>
                  </label>
                ))}
              </div>
              {platforms.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {platforms.map((platform) => (
                    <Badge key={platform} variant="secondary" className="text-xs">
                      {platform}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="font-medium">Optimization Goals</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {availableGoals.map((goal) => (
                  <label key={goal} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={goals.includes(goal)}
                      onChange={(e) => handleGoalChange(goal, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">{goal}</span>
                  </label>
                ))}
              </div>
              {goals.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {goals.map((goal) => (
                    <Badge key={goal} variant="outline" className="text-xs">
                      {goal}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <Button
              onClick={optimizeContent}
              disabled={loading || isContentEmpty}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Optimize Content
            </Button>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Optimization Results
            </CardTitle>
            <CardDescription>
              AI-optimized content and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-center py-8">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin text-green-500" />
                <p className="text-gray-600">Optimizing content with AI...</p>
              </div>
            )}

            {result && result.success && (
              <div className="space-y-6">
                {/* Optimized Content */}
                {result.optimizedContent && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <Label className="font-medium">Optimized Content</Label>
                      </div>
                      <Button
                        onClick={() => copyToClipboard(result.optimizedContent!)}
                        size="sm"
                        variant="outline"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm">{result.optimizedContent}</pre>
                    </div>
                  </div>
                )}

                {/* Before vs After Comparison */}
                {rawContent && result.optimizedContent && (
                  <div>
                    <Label className="font-medium flex items-center gap-2 mb-2">
                      <ArrowRight className="h-4 w-4" />
                      Before vs After
                    </Label>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Original ({rawContent.length} chars)</p>
                        <div className="bg-gray-50 p-3 rounded text-sm max-h-32 overflow-y-auto">
                          {rawContent.substring(0, 200)}...
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Optimized ({result.optimizedContent.length} chars)</p>
                        <div className="bg-green-50 p-3 rounded text-sm max-h-32 overflow-y-auto">
                          {result.optimizedContent.substring(0, 200)}...
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Platform Adjustments */}
                {result.platformAdjustments && Object.keys(result.platformAdjustments).length > 0 && (
                  <div>
                    <Label className="font-medium flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4" />
                      Platform-Specific Tips
                    </Label>
                    <div className="space-y-2">
                      {Object.entries(result.platformAdjustments).map(([platform, tip]) => (
                        <div key={platform} className="bg-blue-50 p-3 rounded-lg">
                          <p className="font-medium text-sm text-blue-800">{platform}</p>
                          <p className="text-sm text-blue-700">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SEO Suggestions */}
                {result.seoSuggestions && (
                  <div>
                    <Label className="font-medium flex items-center gap-2 mb-2">
                      <Search className="h-4 w-4" />
                      SEO Suggestions
                    </Label>
                    <div className="bg-purple-50 p-4 rounded-lg space-y-3">
                      <div>
                        <p className="font-medium text-sm text-purple-800">Recommended Title</p>
                        <p className="text-sm text-purple-700">{result.seoSuggestions.title}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-purple-800">Meta Description</p>
                        <p className="text-sm text-purple-700">{result.seoSuggestions.metaDescription}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-purple-800">Keywords</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {result.seoSuggestions.keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Improvements Summary */}
                {result.improvementsSummary && result.improvementsSummary.length > 0 && (
                  <div>
                    <Label className="font-medium mb-2 block">Key Improvements</Label>
                    <div className="space-y-2">
                      {result.improvementsSummary.map((improvement, index) => (
                        <div key={index} className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{improvement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {result && !result.success && result.message && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <Label className="font-medium text-red-600">Optimization Failed</Label>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-700">{result.message}</p>
                </div>
              </div>
            )}

            {!loading && !result && (
              <div className="text-center py-8 text-gray-500">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter your content and click "Optimize Content" to get AI-powered improvements</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}