import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Copy, Sparkles, Instagram, Youtube, Music, Hash, Image, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface AIGenerationResult {
  success: boolean;
  content?: string;
  ideas?: string[];
  thumbnailIdeas?: string[];
  hashtags?: string[];
  caption?: string;
}

export function ClassicScripts() {
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [duration, setDuration] = useState('30 seconds');
  const [result, setResult] = useState<AIGenerationResult | null>(null);
  const [activeTab, setActiveTab] = useState('content');

  const generateContent = async (type: string) => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setLoading(true);
    try {
      let endpoint = '';
      let payload: any = { topic };

      switch (type) {
        case 'instagram':
          endpoint = '/api/ai/generate-instagram';
          break;
        case 'youtube':
          endpoint = '/api/ai/generate-youtube';
          payload.duration = duration;
          break;
        case 'tiktok':
          endpoint = '/api/ai/generate-tiktok';
          break;
        case 'ideas':
          endpoint = '/api/ai/generate-ideas';
          payload.niche = topic;
          payload.platform = platform;
          payload.count = 5;
          break;
        case 'thumbnails':
          endpoint = '/api/ai/generate-thumbnails';
          payload.title = topic;
          break;
        case 'hashtags':
          endpoint = '/api/ai/generate-hashtags';
          payload.content = topic;
          payload.platform = platform;
          break;
        case 'caption':
          endpoint = '/api/ai/generate-caption';
          payload.platform = platform;
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        toast.success('Content generated successfully!');
      } else {
        toast.success('Content generated with fallback');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Content Generator
          </CardTitle>
          <CardDescription>
            Generate ready-to-post content for Instagram, YouTube, and TikTok
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic or Idea</Label>
              <Input
                id="topic"
                placeholder="e.g., Morning workout routine, Healthy breakfast ideas"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {platform === 'youtube' && (
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30 seconds">30 seconds</SelectItem>
                  <SelectItem value="60 seconds">1 minute</SelectItem>
                  <SelectItem value="2 minutes">2 minutes</SelectItem>
                  <SelectItem value="5 minutes">5 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={() => generateContent('instagram')}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Instagram className="h-4 w-4" />
              Instagram
            </Button>
            <Button
              onClick={() => generateContent('youtube')}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Youtube className="h-4 w-4" />
              YouTube
            </Button>
            <Button
              onClick={() => generateContent('tiktok')}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Music className="h-4 w-4" />
              TikTok
            </Button>
            <Button
              onClick={() => generateContent('ideas')}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Ideas
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => generateContent('thumbnails')}
              disabled={loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Image className="h-4 w-4" />
              Thumbnails
            </Button>
            <Button
              onClick={() => generateContent('hashtags')}
              disabled={loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Hash className="h-4 w-4" />
              Hashtags
            </Button>
            <Button
              onClick={() => generateContent('caption')}
              disabled={loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Caption
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated Content
              <Badge variant={result.success ? "default" : "secondary"}>
                {result.success ? "AI Generated" : "Fallback"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="ideas">Ideas</TabsTrigger>
                <TabsTrigger value="thumbnails">Thumbnails</TabsTrigger>
                <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                {(result.content || result.caption) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Generated Script/Caption</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(result.content || result.caption || '')}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                    <Textarea
                      value={result.content || result.caption}
                      readOnly
                      className="min-h-[200px]"
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ideas" className="space-y-4">
                {result.ideas && (
                  <div className="space-y-2">
                    <Label>Content Ideas</Label>
                    <div className="space-y-2">
                      {result.ideas.map((idea, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <span className="flex-1">{idea}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(idea)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="thumbnails" className="space-y-4">
                {result.thumbnailIdeas && (
                  <div className="space-y-2">
                    <Label>Thumbnail Ideas</Label>
                    <div className="space-y-2">
                      {result.thumbnailIdeas.map((idea, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <span className="flex-1">{idea}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(idea)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="hashtags" className="space-y-4">
                {result.hashtags && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Generated Hashtags</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(result.hashtags?.join(' ') || '')}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy All
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.hashtags.map((hashtag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => copyToClipboard(hashtag)}
                        >
                          {hashtag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 animate-spin text-purple-500" />
              <span>Generating amazing content...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}