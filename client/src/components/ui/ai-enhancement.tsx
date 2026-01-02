import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Check, X, RotateCcw, Wand2, Lightbulb, Target, MessageSquare } from 'lucide-react';

interface AIEnhancementProps {
  text: string;
  onAccept: (enhancedText: string) => void;
  onReject?: () => void;
  context?: {
    contentType?: string;
    platform?: string;
    targetAudience?: string;
  };
  placeholder?: string;
  className?: string;
}

interface AIEnhancementResult {
  enhancedText: string;
  improvements: {
    type: 'grammar' | 'engagement' | 'relevance' | 'seo' | 'tone';
    description: string;
    before: string;
    after: string;
  }[];
  confidence: number;
  suggestions: string[];
}

export const AIEnhancement: React.FC<AIEnhancementProps> = ({
  text,
  onAccept,
  onReject,
  context = {},
  placeholder = "Describe your content...",
  className = ""
}) => {
  const { toast } = useToast();
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementResult, setEnhancementResult] = useState<AIEnhancementResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleEnhance = async () => {
    if (!text.trim()) {
      toast({
        title: "No Content to Enhance",
        description: "Please enter some text before using AI enhancement.",
        variant: "destructive",
      });
      return;
    }

    setIsEnhancing(true);

    try {
      // Simulate AI enhancement API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock AI enhancement result
      const result: AIEnhancementResult = {
        enhancedText: generateEnhancedText(text, context),
        improvements: [
          {
            type: 'engagement',
            description: 'Added engaging hook and call-to-action',
            before: text.substring(0, 50),
            after: '🚀 ' + text.substring(0, 45) + ' - What do you think?'
          },
          {
            type: 'grammar',
            description: 'Improved sentence structure and clarity',
            before: 'This is good content',
            after: 'This engaging content delivers exceptional value'
          },
          {
            type: 'seo',
            description: 'Added relevant keywords for better discoverability',
            before: 'Learn about this topic',
            after: 'Master this essential topic with our comprehensive guide'
          }
        ],
        confidence: 0.87,
        suggestions: [
          'Consider adding a question to encourage comments',
          'Include relevant hashtags for better reach',
          'Add emojis to make it more visually appealing'
        ]
      };

      setEnhancementResult(result);
      setShowPreview(true);

      toast({
        title: "AI Enhancement Complete!",
        description: "Review the enhanced version and choose to accept or reject the changes.",
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
      setEnhancementResult(null);
      setShowPreview(false);
      toast({
        title: "Enhancement Accepted",
        description: "Your content has been enhanced with AI improvements.",
      });
    }
  };

  const handleReject = () => {
    setEnhancementResult(null);
    setShowPreview(false);
    onReject?.();
    toast({
      title: "Enhancement Rejected",
      description: "The original content has been kept.",
    });
  };

  const generateEnhancedText = (originalText: string, context: any): string => {
    // Mock AI enhancement logic
    let enhanced = originalText;

    // Add engaging elements based on context
    if (context.contentType === 'video') {
      enhanced = `🎬 ${enhanced}`;
    } else if (context.contentType === 'image') {
      enhanced = `📸 ${enhanced}`;
    }

    // Add platform-specific optimizations
    if (context.platform === 'instagram') {
      enhanced = enhanced + ' #ContentCreation #SocialMedia';
    } else if (context.platform === 'tiktok') {
      enhanced = enhanced + ' #Viral #Trending';
    }

    // Add engagement elements
    if (!enhanced.includes('?')) {
      enhanced = enhanced + ' What are your thoughts?';
    }

    return enhanced;
  };

  const getImprovementIcon = (type: string) => {
    switch (type) {
      case 'grammar':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'engagement':
        return <Target className="w-4 h-4 text-green-600" />;
      case 'relevance':
        return <Lightbulb className="w-4 h-4 text-yellow-600" />;
      case 'seo':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'tone':
        return <Wand2 className="w-4 h-4 text-indigo-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Enhancement Button */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">
          Description
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={handleEnhance}
          disabled={isEnhancing || !text.trim()}
          className="flex items-center gap-2"
        >
          {isEnhancing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              Enhancing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-purple-600" />
              Enhance with AI
            </>
          )}
        </Button>
      </div>

      {/* Enhancement Preview */}
      {showPreview && enhancementResult && (
        <Card className="mb-4 border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI Enhancement Preview
              </CardTitle>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {Math.round(enhancementResult.confidence * 100)}% Confidence
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enhanced Text */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Enhanced Version:</h4>
              <div className="p-3 bg-white border border-purple-200 rounded-lg">
                <p className="text-gray-900">{enhancementResult.enhancedText}</p>
              </div>
            </div>

            {/* Improvements */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Key Improvements:</h4>
              <div className="space-y-2">
                {enhancementResult.improvements.map((improvement, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-white border border-purple-200 rounded">
                    {getImprovementIcon(improvement.type)}
                    <div className="flex-1">
                      <span className="text-sm font-medium capitalize text-gray-900">
                        {improvement.type}
                      </span>
                      <p className="text-xs text-gray-600 mt-1">{improvement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            {enhancementResult.suggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Suggestions:</h4>
                <ul className="space-y-1">
                  {enhancementResult.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleAccept}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Accept Enhancement
              </Button>
              <Button
                variant="outline"
                onClick={handleReject}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Keep Original
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIEnhancement;
