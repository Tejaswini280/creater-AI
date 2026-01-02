import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Hash,
  Clock,
  TrendingUp,
  Target,
  Lightbulb,
  MessageSquare,
  Calendar,
  RefreshCw,
  Copy,
  Check,
  Loader2,
  Wand2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { aiContentApi, socialPostApi } from '@/lib/socialMediaApi';

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', icon: '📸' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'youtube', label: 'YouTube', icon: '🎬' },
  { value: 'facebook', label: 'Facebook', icon: '👥' },
  { value: 'twitter', label: 'Twitter', icon: '🐦' }
];

const CONTENT_TYPES = [
  { value: 'caption', label: 'Caption', icon: '📝' },
  { value: 'hashtags', label: 'Hashtags', icon: '🏷️' },
  { value: 'best_time', label: 'Best Posting Time', icon: '⏰' },
  { value: 'content_idea', label: 'Content Ideas', icon: '💡' }
];

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState('suggestions');
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [selectedContentType, setSelectedContentType] = useState('caption');
  const [userInput, setUserInput] = useState('');
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch hashtag suggestions
  const { data: hashtags = [], isLoading: hashtagsLoading } = useQuery({
    queryKey: ['hashtags', selectedPlatform],
    queryFn: () => aiContentApi.getHashtagSuggestions(selectedPlatform, undefined, 20),
    enabled: activeTab === 'hashtags'
  });

  // Fetch AI content suggestions
  const { data: aiSuggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: () => aiContentApi.getAiContentSuggestions(undefined, 10),
    enabled: activeTab === 'suggestions'
  });

  // Generate AI content mutation
  const generateContentMutation = useMutation({
    mutationFn: (params: any) => aiContentApi.generateAiContentSuggestion(params),
    onSuccess: (suggestion) => {
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
      toast({
        title: "AI Content Generated",
        description: "New AI-powered content has been created!",
      });
      setUserInput('');
    },
    onError: (error) => {
      console.error('Error generating AI content:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateContent = () => {
    if (!userInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter some context or topic for AI generation.",
        variant: "destructive",
      });
      return;
    }

    generateContentMutation.mutate({
      suggestionType: selectedContentType,
      platform: selectedPlatform,
      context: {
        userInput: userInput,
        contentType: selectedContentType,
        targetAudience: 'general audience' // Could be made configurable
      }
    });
  };

  const handleCopyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set(prev).add(id));
      toast({
        title: "Copied!",
        description: "Content copied to clipboard.",
      });

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const getOptimalPostingTimes = (platform: string) => {
    const times = {
      instagram: ['9:00 AM', '2:00 PM', '7:00 PM'],
      tiktok: ['6:00 PM', '8:00 PM', '10:00 PM'],
      linkedin: ['8:00 AM', '12:00 PM', '5:00 PM'],
      youtube: ['2:00 PM', '6:00 PM', '8:00 PM'],
      facebook: ['1:00 PM', '3:00 PM', '7:00 PM'],
      twitter: ['8:00 AM', '12:00 PM', '6:00 PM']
    };
    return times[platform as keyof typeof times] || times.instagram;
  };

  const renderContentGeneration = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="platform">Platform</Label>
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLATFORMS.map((platform) => (
                <SelectItem key={platform.value} value={platform.value}>
                  {platform.icon} {platform.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="contentType">Content Type</Label>
          <Select value={selectedContentType} onValueChange={setSelectedContentType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="userInput">
          Context or Topic {selectedContentType === 'hashtags' ? '(Optional)' : ''}
        </Label>
        <Textarea
          id="userInput"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={
            selectedContentType === 'caption'
              ? "Describe your content topic, mood, or target audience..."
              : selectedContentType === 'hashtags'
              ? "Enter your content topic for relevant hashtags..."
              : "Describe your content idea or target audience..."
          }
          rows={4}
          required={selectedContentType !== 'hashtags'}
        />
      </div>

      <Button
        onClick={handleGenerateContent}
        disabled={generateContentMutation.isPending}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
      >
        {generateContentMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating AI Content...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate with AI
          </>
        )}
      </Button>

      {/* AI Generated Results */}
      {aiSuggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent AI Generations</h3>
          {aiSuggestions.slice(0, 5).map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {suggestion.suggestionType}
                      </Badge>
                      <Badge variant="outline">
                        {suggestion.platform}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.confidence}% confidence
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToClipboard(suggestion.content, suggestion.id.toString())}
                    >
                      {copiedItems.has(suggestion.id.toString()) ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {suggestion.content}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderHashtags = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="hashtagPlatform">Platform</Label>
        <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLATFORMS.map((platform) => (
              <SelectItem key={platform.value} value={platform.value}>
                {platform.icon} {platform.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hashtagsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <span className="ml-2">Loading hashtag suggestions...</span>
        </div>
      ) : hashtags.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Trending Hashtags</h3>
            <Badge variant="secondary">
              {hashtags.length} suggestions
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {hashtags.map((hashtag, index) => (
              <motion.div
                key={hashtag.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Hash className="h-4 w-4 text-purple-500" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyToClipboard(hashtag.hashtag, hashtag.id.toString())}
                      >
                        {copiedItems.has(hashtag.id.toString()) ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <p className="font-medium text-sm">{hashtag.hashtag}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>Trend: {hashtag.trendScore}</span>
                      <span>Usage: {hashtag.usageCount.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Hash className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No hashtag suggestions available for {selectedPlatform}</p>
        </div>
      )}
    </div>
  );

  const renderPostingTimes = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="timePlatform">Platform</Label>
        <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLATFORMS.map((platform) => (
              <SelectItem key={platform.value} value={platform.value}>
                {platform.icon} {platform.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-purple-500" />
            <span>Optimal Posting Times for {PLATFORMS.find(p => p.value === selectedPlatform)?.label}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getOptimalPostingTimes(selectedPlatform).map((time, index) => (
              <motion.div
                key={time}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="text-center">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      {time}
                    </div>
                    <div className="text-sm text-gray-600">
                      {index === 0 ? 'Morning Peak' : index === 1 ? 'Afternoon Peak' : 'Evening Peak'}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => handleCopyToClipboard(time, `time-${index}`)}
                    >
                      {copiedItems.has(`time-${index}`) ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      Copy Time
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-purple-50 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">💡 Pro Tips</h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Post consistently during these peak hours for maximum engagement</li>
              <li>• Consider your audience's timezone when scheduling</li>
              <li>• Test different times and track performance</li>
              <li>• Weekends often have different optimal times than weekdays</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Content Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 mb-2">+24%</div>
            <p className="text-sm text-gray-600">
              Engagement increase with AI-optimized content
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <span>Hashtag Effectiveness</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 mb-2">78%</div>
            <p className="text-sm text-gray-600">
              Higher reach with AI-suggested hashtags
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              <span>Optimal Timing</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 mb-2">3.2x</div>
            <p className="text-sm text-gray-600">
              More engagement during optimal posting times
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <span>AI Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Content Strategy</p>
                <p className="text-sm text-gray-600">
                  Focus on educational content with storytelling elements for better engagement
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Hashtag Strategy</p>
                <p className="text-sm text-gray-600">
                  Mix trending hashtags with niche-specific ones for balanced reach
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Posting Schedule</p>
                <p className="text-sm text-gray-600">
                  Maintain consistency with 3-5 posts per week during peak engagement times
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Social Media Assistant
          </h1>
          <p className="text-gray-600">AI-powered content creation and optimization tools</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="suggestions">Content Generation</TabsTrigger>
          <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
          <TabsTrigger value="times">Posting Times</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-6">
          {renderContentGeneration()}
        </TabsContent>

        <TabsContent value="hashtags" className="space-y-6">
          {renderHashtags()}
        </TabsContent>

        <TabsContent value="times" className="space-y-6">
          {renderPostingTimes()}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {renderInsights()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
