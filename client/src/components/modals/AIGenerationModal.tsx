import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Loader2, 
  Sparkles, 
  FileText, 
  Video, 
  Camera, 
  Mic, 
  Copy, 
  Download,
  RefreshCw,
  Send,
  Bot,
  Lightbulb,
  Hash
} from "lucide-react";

interface AIGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
}

interface GenerationFormData {
  topic: string;
  platform: string;
  contentType: string;
  tone: string;
  duration: string;
  targetAudience: string;
  keywords: string;
}

const PLATFORMS = [
  { value: 'youtube', label: 'YouTube', icon: Video },
  { value: 'instagram', label: 'Instagram', icon: Camera },
  { value: 'tiktok', label: 'TikTok', icon: Video },
  { value: 'linkedin', label: 'LinkedIn', icon: FileText },
  { value: 'twitter', label: 'Twitter', icon: FileText },
];

const CONTENT_TYPES = [
  { value: 'script', label: 'Video Script', icon: FileText },
  { value: 'description', label: 'Description', icon: FileText },
  { value: 'title', label: 'Title Ideas', icon: Lightbulb },
  { value: 'tags', label: 'Tags & Keywords', icon: Hash },
  { value: 'outline', label: 'Content Outline', icon: FileText },
];

const TONES = [
  'Professional', 'Casual', 'Friendly', 'Enthusiastic', 
  'Educational', 'Entertaining', 'Inspiring', 'Conversational'
];

const DURATIONS = [
  '15 seconds', '30 seconds', '60 seconds', '2-3 minutes', 
  '5-10 minutes', '10+ minutes'
];

export default function AIGenerationModal({ isOpen, onClose, initialTopic = '' }: AIGenerationModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('generate');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  
  const [formData, setFormData] = useState<GenerationFormData>({
    topic: initialTopic,
    platform: 'youtube',
    contentType: 'script',
    tone: 'Conversational',
    duration: '60 seconds',
    targetAudience: '',
    keywords: ''
  });

  useEffect(() => {
    if (initialTopic) {
      setFormData(prev => ({ ...prev, topic: initialTopic }));
    }
  }, [initialTopic]);

  const generateContentMutation = useMutation({
    mutationFn: async (data: GenerationFormData) => {
      const response = await apiRequest('POST', '/api/ai/generate-content', data);
      return await response.json();
    },
    onSuccess: (data) => {
      const text =
        // server returns nested content object: { content: { content: string } }
        (typeof data?.content?.content === 'string' && data.content.content)
        || (typeof data?.script === 'string' && data.script)
        || (typeof data?.result === 'string' && data.result)
        || (typeof data?.content === 'string' && data.content)
        || '';
      setGeneratedContent(text || 'Generated content would appear here');
      setActiveTab('result');
      toast({
        title: "Content Generated Successfully!",
        description: `Your ${formData.contentType} for ${formData.platform} is ready.`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const streamingGenerateMutation = useMutation({
    mutationFn: async (data: GenerationFormData) => {
      setIsStreaming(true);
      setGeneratedContent('');
      setActiveTab('result');

      // Build a prompt compatible with the backend streaming route
      const prompt = `Create ${data.contentType} content for ${data.platform} with the following specifications:\n- Tone: ${data.tone}\n- Duration: ${data.duration}\n- Target Audience: ${data.targetAudience}\n- Keywords: ${data.keywords}\n- Topic: ${data.topic}`;

      try {
        const response = await apiRequest('POST', '/api/ai/streaming-generate', {
          prompt,
          model: undefined,
          options: { platform: data.platform, contentType: data.contentType },
        });
        const json = await response.json();
        const text = (typeof json?.result === 'string' && json.result) || '';
        setGeneratedContent(text || 'Generated content would appear here');
      } catch (error) {
        console.error('Streaming error:', error);
        // Fallback to regular generation
        return generateContentMutation.mutateAsync(data);
      } finally {
        setIsStreaming(false);
      }
    },
  });

  const handleGenerate = (useStreaming = false) => {
    if (!formData.topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic for content generation.",
        variant: "destructive",
      });
      return;
    }

    if (useStreaming) {
      streamingGenerateMutation.mutate(formData);
    } else {
      generateContentMutation.mutate(formData);
    }
  };

  const handleCopyContent = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      toast({
        title: "Copied to Clipboard",
        description: "Generated content has been copied to your clipboard.",
      });
    }
  };

  const handleDownloadContent = () => {
    if (generatedContent) {
      const blob = new Blob([generatedContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formData.contentType}-${formData.platform}-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Content Downloaded",
        description: "Generated content has been saved to your device.",
      });
    }
  };

  const isGenerating = generateContentMutation.isPending || streamingGenerateMutation.isPending || isStreaming;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden" aria-describedby="ai-generation-description">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center">
            <Bot className="w-5 h-5 mr-2 text-purple-600" />
            AI Content Generator
          </DialogTitle>
          <DialogDescription id="ai-generation-description">
            Generate content ideas, scripts, thumbnails, and more using AI
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate" className="flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="result" className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Result
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate" className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto">
            {/* Topic Input */}
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-sm font-medium text-gray-700">
                Topic / Idea *
              </Label>
              <Input
                id="topic"
                type="text"
                placeholder="e.g., Morning productivity routine, AI tools for creators..."
                value={formData.topic}
                onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Be specific about what you want to create content about
              </p>
            </div>

            {/* Platform and Content Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Platform</Label>
                <Select value={formData.platform} onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((platform) => {
                      const Icon = platform.icon;
                      return (
                        <SelectItem key={platform.value} value={platform.value}>
                          <div className="flex items-center space-x-2">
                            <Icon className="w-4 h-4" />
                            <span>{platform.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Content Type</Label>
                <Select value={formData.contentType} onValueChange={(value) => setFormData(prev => ({ ...prev, contentType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-2">
                            <Icon className="w-4 h-4" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tone and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Tone</Label>
                <Select value={formData.tone} onValueChange={(value) => setFormData(prev => ({ ...prev, tone: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((tone) => (
                      <SelectItem key={tone} value={tone}>
                        {tone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Duration</Label>
                <Select value={formData.duration} onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((duration) => (
                      <SelectItem key={duration} value={duration}>
                        {duration}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <Label htmlFor="audience" className="text-sm font-medium text-gray-700">
                Target Audience
              </Label>
              <Input
                id="audience"
                type="text"
                placeholder="e.g., Young professionals, Tech enthusiasts, Fitness beginners..."
                value={formData.targetAudience}
                onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
              />
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label htmlFor="keywords" className="text-sm font-medium text-gray-700">
                Keywords (comma separated)
              </Label>
              <Input
                id="keywords"
                type="text"
                placeholder="e.g., productivity, morning routine, tips, habits"
                value={formData.keywords}
                onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
              />
            </div>

            {/* Generate Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleGenerate(true)}
                disabled={isGenerating}
                className="flex items-center"
              >
                <Send className="w-4 h-4 mr-2" />
                Stream Generate
              </Button>
              <Button
                type="button"
                onClick={() => handleGenerate(false)}
                disabled={isGenerating}
                className="bg-purple-600 text-white hover:bg-purple-700 flex items-center"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="result" className="space-y-4 mt-4">
            {/* Content Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">Generated Content</Label>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {formData.contentType} • {formData.platform}
                  </Badge>
                  {isStreaming && (
                    <Badge className="text-xs bg-purple-100 text-purple-800">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Streaming...
                    </Badge>
                  )}
                </div>
              </div>
              <Textarea
                ref={contentRef}
                value={generatedContent || (isGenerating ? 'Generating content...' : 'No content generated yet. Switch to Generate tab to create content.')}
                onChange={(e) => setGeneratedContent(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
                placeholder="Generated content will appear here..."
                readOnly={isGenerating}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerate(false)}
                  disabled={isGenerating}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Regenerate
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyContent}
                  disabled={!generatedContent || isGenerating}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadContent}
                  disabled={!generatedContent || isGenerating}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}