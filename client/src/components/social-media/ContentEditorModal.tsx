import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  X, 
  RefreshCw, 
  Sparkles, 
  Clock, 
  Target, 
  Users, 
  Zap,
  Calendar,
  Eye,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { ContentItem } from './ContentCard';
import { useToast } from '@/hooks/use-toast';

interface ContentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentItem | null;
  onSave: (contentId: number, updates: Partial<ContentItem>) => Promise<void>;
  onRegenerate: (contentId: number) => Promise<void>;
  onRecreate: (contentId: number) => Promise<void>;
  onPreview: (content: ContentItem) => void;
}

interface ContentFormData {
  title: string;
  description: string;
  platform: string;
  contentType: string;
  scheduledTime: string;
  hashtags: string[];
  status: string;
}

const platformOptions = [
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'youtube', label: 'YouTube', icon: '📺' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'facebook', label: 'Facebook', icon: '👥' },
  { value: 'twitter', label: 'Twitter', icon: '🐦' },
  { value: 'pinterest', label: 'Pinterest', icon: '📌' }
];

const contentTypeOptions = [
  { value: 'post', label: 'Post' },
  { value: 'story', label: 'Story' },
  { value: 'reel', label: 'Reel' },
  { value: 'video', label: 'Video' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'live', label: 'Live' }
];

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'paused', label: 'Paused' }
];

export const ContentEditorModal: React.FC<ContentEditorModalProps> = ({
  isOpen,
  onClose,
  content,
  onSave,
  onRegenerate,
  onRecreate,
  onPreview
}) => {
  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    description: '',
    platform: 'instagram',
    contentType: 'post',
    scheduledTime: '',
    hashtags: [],
    status: 'draft'
  });
  const [hashtagInput, setHashtagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const { toast } = useToast();

  // Initialize form data when content changes
  useEffect(() => {
    if (content) {
      setFormData({
        title: content.title,
        description: content.description,
        platform: content.platform,
        contentType: content.contentType,
        scheduledTime: content.scheduledTime || '',
        hashtags: content.hashtags || [],
        status: content.status
      });
      setHasChanges(false);
    }
  }, [content]);

  const handleInputChange = (field: keyof ContentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleHashtagAdd = () => {
    const hashtag = hashtagInput.trim().replace('#', '');
    if (hashtag && !formData.hashtags.includes(hashtag)) {
      handleInputChange('hashtags', [...formData.hashtags, hashtag]);
      setHashtagInput('');
    }
  };

  const handleHashtagRemove = (hashtag: string) => {
    handleInputChange('hashtags', formData.hashtags.filter(h => h !== hashtag));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleHashtagAdd();
    }
  };

  const handleSave = async () => {
    if (!content) return;

    setIsLoading(true);
    try {
      await onSave(content.id, formData);
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Content updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!content) return;

    setIsLoading(true);
    try {
      await onRegenerate(content.id);
      toast({
        title: "Success",
        description: "Content regenerated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate content",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecreate = async () => {
    if (!content) return;

    setIsLoading(true);
    try {
      await onRecreate(content.id);
      toast({
        title: "Success",
        description: "Content recreated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to recreate content",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = () => {
    if (content) {
      onPreview(content);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!content) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{platformOptions.find(p => p.value === formData.platform)?.icon}</span>
            Edit Content - Day {content.dayNumber}
          </DialogTitle>
          <DialogDescription>
            Modify your content details, scheduling, and settings
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter content title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select value={formData.platform} onValueChange={(value) => handleInputChange('platform', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {platformOptions.map(platform => (
                          <SelectItem key={platform.value} value={platform.value}>
                            <div className="flex items-center gap-2">
                              <span>{platform.icon}</span>
                              <span>{platform.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter content description"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contentType">Content Type</Label>
                    <Select value={formData.contentType} onValueChange={(value) => handleInputChange('contentType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {contentTypeOptions.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hashtags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Hashtags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add hashtag (without #)"
                    className="flex-1"
                  />
                  <Button onClick={handleHashtagAdd} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.hashtags.map((hashtag) => (
                    <Badge key={hashtag} variant="secondary" className="flex items-center gap-1">
                      #{hashtag}
                      <button
                        onClick={() => handleHashtagRemove(hashtag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Scheduling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledTime">Scheduled Time</Label>
                  <Input
                    id="scheduledTime"
                    type="datetime-local"
                    value={formData.scheduledTime}
                    onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                  />
                </div>
                
                {content.metadata && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="text-xs text-gray-600">Engagement Prediction</div>
                        <div className="text-sm font-medium">
                          {content.metadata.engagementPrediction?.average || 0}%
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="text-xs text-gray-600">Target Audience</div>
                        <div className="text-sm font-medium">
                          {content.metadata.targetAudience || 'General'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Content Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{platformOptions.find(p => p.value === formData.platform)?.icon}</span>
                    <div>
                      <h3 className="font-semibold">{formData.title}</h3>
                      <p className="text-sm text-gray-500">{formData.contentType}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{formData.description}</p>
                  {formData.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {formData.hashtags.map((hashtag) => (
                        <Badge key={hashtag} variant="secondary" className="text-xs">
                          #{hashtag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRegenerate}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
            <Button
              variant="outline"
              onClick={handleRecreate}
              disabled={isLoading}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Recreate
            </Button>
            <Button
              variant="outline"
              onClick={handlePreview}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading || !hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContentEditorModal;
