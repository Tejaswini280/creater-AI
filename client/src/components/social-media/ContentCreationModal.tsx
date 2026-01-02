import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Image,
  Video,
  Calendar,
  Hash,
  Sparkles,
  Save,
  Send,
  Clock,
  Target,
  Users,
  Eye,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { socialPostApi, aiContentApi, projectApi } from '@/lib/socialMediaApi';

interface ContentCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: number;
  editContent?: any;
}

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', icon: '📸', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { value: 'facebook', label: 'Facebook', icon: '👥', color: 'bg-blue-600' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵', color: 'bg-black' },
  { value: 'youtube', label: 'YouTube', icon: '🎬', color: 'bg-red-600' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼', color: 'bg-blue-700' },
  { value: 'twitter', label: 'Twitter', icon: '🐦', color: 'bg-sky-500' }
];

const CONTENT_TYPES = [
  { value: 'post', label: 'Post', icon: '📝' },
  { value: 'reel', label: 'Reel/Short', icon: '🎥' },
  { value: 'story', label: 'Story', icon: '📱' },
  { value: 'video', label: 'Video', icon: '🎬' }
];

export default function ContentCreationModal({
  isOpen,
  onClose,
  projectId,
  editContent
}: ContentCreationModalProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    title: '',
    caption: '',
    hashtags: [] as string[],
    emojis: [] as string[],
    contentType: 'post',
    platform: 'instagram',
    scheduledAt: '',
    aiGenerated: false,
    mediaUrls: [] as string[],
    projectId: projectId || undefined
  });

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  const [isScheduling, setIsScheduling] = useState(false);
  const [useAI, setUseAI] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects for selection
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectApi.getProjects(),
  });

  // Fetch hashtag suggestions
  const { data: hashtagSuggestions = [] } = useQuery({
    queryKey: ['hashtags', selectedPlatforms[0]],
    queryFn: () => aiContentApi.getHashtagSuggestions(selectedPlatforms[0] || 'instagram', undefined, 20),
    enabled: selectedPlatforms.length > 0
  });

  // Mutations
  const createContentMutation = useMutation({
    mutationFn: socialPostApi.createSocialPost,
    onSuccess: (newContent) => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      toast({
        title: "Content Created",
        description: `"${newContent.title}" has been created successfully`,
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error creating content:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateContentMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) =>
      socialPostApi.updateSocialPost(id, updates),
    onSuccess: (updatedContent) => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      toast({
        title: "Content Updated",
        description: `"${updatedContent.title}" has been updated successfully`,
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error updating content:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const aiGenerationMutation = useMutation({
    mutationFn: (params: any) => aiContentApi.generateAiContentSuggestion(params),
    onSuccess: (suggestion) => {
      setFormData(prev => ({
        ...prev,
        caption: suggestion.content,
        aiGenerated: true
      }));
      toast({
        title: "AI Content Generated",
        description: "AI has generated content for your post",
      });
    },
    onError: (error) => {
      console.error('Error generating AI content:', error);
      toast({
        title: "AI Generation Failed",
        description: "Failed to generate AI content. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize form data when editing
  useEffect(() => {
    if (editContent) {
      setFormData({
        title: editContent.title || '',
        caption: editContent.caption || '',
        hashtags: editContent.hashtags || [],
        emojis: editContent.emojis || [],
        contentType: editContent.contentType || 'post',
        platform: editContent.platform || 'instagram',
        scheduledAt: editContent.scheduledAt || '',
        aiGenerated: editContent.aiGenerated || false,
        mediaUrls: editContent.mediaUrls || [],
        projectId: editContent.projectId
      });
      setSelectedPlatforms([editContent.platform || 'instagram']);
    } else if (projectId) {
      setFormData(prev => ({ ...prev, projectId }));
    }
  }, [editContent, projectId]);

  const handleClose = () => {
    setFormData({
      title: '',
      caption: '',
      hashtags: [],
      emojis: [],
      contentType: 'post',
      platform: 'instagram',
      scheduledAt: '',
      aiGenerated: false,
      mediaUrls: [],
      projectId: projectId || undefined
    });
    setSelectedPlatforms(['instagram']);
    setActiveTab('basic');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const contentData = {
      ...formData,
      hashtags: formData.hashtags.filter(tag => tag.trim() !== ''),
      emojis: formData.emojis.filter(emoji => emoji.trim() !== ''),
    };

    if (editContent) {
      updateContentMutation.mutate({ id: editContent.id, updates: contentData });
    } else {
      createContentMutation.mutate(contentData);
    }
  };

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleHashtagAdd = (hashtag: string) => {
    if (!formData.hashtags.includes(hashtag) && formData.hashtags.length < 30) {
      setFormData(prev => ({
        ...prev,
        hashtags: [...prev.hashtags, hashtag]
      }));
    }
  };

  const handleHashtagRemove = (hashtag: string) => {
    setFormData(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter(h => h !== hashtag)
    }));
  };

  const generateAIContent = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title before generating AI content",
        variant: "destructive",
      });
      return;
    }

    aiGenerationMutation.mutate({
      suggestionType: 'caption',
      platform: selectedPlatforms[0],
      context: {
        title: formData.title,
        contentType: formData.contentType,
        targetAudience: projects.find(p => p.id === formData.projectId)?.targetAudience
      },
      projectId: formData.projectId
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{editContent ? 'Edit Content' : 'Create New Content'}</span>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter content title..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="project">Project (Optional)</Label>
                  <Select
                    value={formData.projectId?.toString() || ''}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      projectId: value ? parseInt(value) : undefined
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No project</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contentType">Content Type</Label>
                  <Select
                    value={formData.contentType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, contentType: value }))}
                  >
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

                <div>
                  <Label>Platforms</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {PLATFORMS.map((platform) => (
                      <Button
                        key={platform.value}
                        type="button"
                        variant={selectedPlatforms.includes(platform.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePlatformToggle(platform.value)}
                        className="text-xs"
                      >
                        {platform.icon} {platform.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="caption">Caption</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="useAI"
                    checked={useAI}
                    onCheckedChange={setUseAI}
                  />
                  <Label htmlFor="useAI" className="text-sm">Use AI</Label>
                  {useAI && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={generateAIContent}
                      disabled={aiGenerationMutation.isPending}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {aiGenerationMutation.isPending ? 'Generating...' : 'Generate'}
                    </Button>
                  )}
                </div>
              </div>

              <Textarea
                id="caption"
                value={formData.caption}
                onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                placeholder="Write your caption here..."
                rows={6}
              />

              {formData.aiGenerated && (
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Generated
                </Badge>
              )}

              <div>
                <Label>Hashtags</Label>
                <div className="flex flex-wrap gap-1 mt-2 mb-3">
                  {formData.hashtags.map((hashtag, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer"
                           onClick={() => handleHashtagRemove(hashtag)}>
                      {hashtag} ×
                    </Badge>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <Input
                    placeholder="Add hashtag..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        if (input.value.trim()) {
                          handleHashtagAdd(input.value.trim());
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm">
                    <Hash className="h-4 w-4" />
                  </Button>
                </div>

                {hashtagSuggestions.length > 0 && (
                  <div className="mt-3">
                    <Label className="text-sm text-gray-600">Suggested hashtags:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {hashtagSuggestions.slice(0, 10).map((suggestion, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => handleHashtagAdd(suggestion.hashtag)}
                        >
                          {suggestion.hashtag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              <div>
                <Label>Media Files</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Image className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">
                    Drag and drop media files here, or click to browse
                  </p>
                  <div className="flex justify-center space-x-2">
                    <Button type="button" variant="outline">
                      <Image className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                    <Button type="button" variant="outline">
                      <Video className="h-4 w-4 mr-2" />
                      Upload Video
                    </Button>
                  </div>
                </div>

                {formData.mediaUrls.length > 0 && (
                  <div className="mt-4">
                    <Label>Uploaded Files:</Label>
                    <div className="space-y-2 mt-2">
                      {formData.mediaUrls.map((url, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{url.split('/').pop()}</span>
                          <Button type="button" variant="ghost" size="sm">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="scheduling"
                    checked={isScheduling}
                    onCheckedChange={setIsScheduling}
                  />
                  <Label htmlFor="scheduling">Schedule for later</Label>
                </div>

                {isScheduling && (
                  <div className="flex-1">
                    <Label htmlFor="scheduledAt">Schedule Date & Time</Label>
                    <Input
                      id="scheduledAt"
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              {!isScheduling && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 text-blue-700">
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">Ready to publish now</span>
                  </div>
                  <p className="text-blue-600 text-sm mt-1">
                    Content will be published immediately after creation
                  </p>
                </div>
              )}

              {isScheduling && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-700">
                    <Calendar className="h-5 w-5" />
                    <span className="font-medium">Scheduled for later</span>
                  </div>
                  <p className="text-green-600 text-sm mt-1">
                    Content will be published at the scheduled time
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createContentMutation.isPending || updateContentMutation.isPending}
            >
              {createContentMutation.isPending || updateContentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editContent ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {editContent ? <Save className="h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  {editContent ? 'Update Content' : 'Create Content'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
