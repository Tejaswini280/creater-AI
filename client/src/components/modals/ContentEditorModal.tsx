import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  X, 
  RotateCcw, 
  Eye, 
  RefreshCw,
  Target,
  Zap,
  Hash
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: any;
  onSave: (contentId: number, updates: any) => void;
  onRegenerate?: (contentId: number) => void;
  onRecreate?: (contentId: number) => void;
  onPreview?: (content: any) => void;
}

export default function ContentEditorModal({
  isOpen,
  onClose,
  content,
  onSave,
  onRegenerate,
  onRecreate,
  onPreview
}: ContentEditorModalProps) {
  const [editedContent, setEditedContent] = useState({
    title: '',
    description: '',
    content: '',
    platform: '',
    contentType: '',
    hashtags: [] as string[],
    status: 'draft'
  });
  const [hashtagInput, setHashtagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (content) {
      setEditedContent({
        title: content.title || '',
        description: content.description || '',
        content: content.content || '',
        platform: content.platform || '',
        contentType: content.contentType || '',
        hashtags: content.hashtags || [],
        status: content.status || 'draft'
      });
    }
  }, [content]);

  const handleSave = async () => {
    if (!content?.id) return;

    setIsSaving(true);
    try {
      await onSave(content.id, editedContent);
      toast({
        title: "Success",
        description: "Content updated successfully"
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save content",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!content?.id || !onRegenerate) return;

    try {
      await onRegenerate(content.id);
      toast({
        title: "Success",
        description: "Content regenerated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate content",
        variant: "destructive"
      });
    }
  };

  const handleRecreate = async () => {
    if (!content?.id || !onRecreate) return;

    try {
      await onRecreate(content.id);
      toast({
        title: "Success",
        description: "Content recreated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to recreate content",
        variant: "destructive"
      });
    }
  };

  const addHashtag = () => {
    if (hashtagInput.trim() && !editedContent.hashtags.includes(hashtagInput.trim())) {
      setEditedContent(prev => ({
        ...prev,
        hashtags: [...prev.hashtags, hashtagInput.trim()]
      }));
      setHashtagInput('');
    }
  };

  const removeHashtag = (hashtag: string) => {
    setEditedContent(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter(h => h !== hashtag)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addHashtag();
    }
  };

  if (!content) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Edit Content</DialogTitle>
              <DialogDescription>
                Modify your content details and settings
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {onPreview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPreview(editedContent)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editedContent.title}
                  onChange={(e) => setEditedContent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter content title"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editedContent.status}
                  onValueChange={(value) => setEditedContent(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editedContent.description}
                onChange={(e) => setEditedContent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter content description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={editedContent.content}
                onChange={(e) => setEditedContent(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter your content"
                rows={6}
              />
            </div>
          </div>

          {/* Platform and Type */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select
                  value={editedContent.platform}
                  onValueChange={(value) => setEditedContent(prev => ({ ...prev, platform: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="contentType">Content Type</Label>
                <Select
                  value={editedContent.contentType}
                  onValueChange={(value) => setEditedContent(prev => ({ ...prev, contentType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="post">Post</SelectItem>
                    <SelectItem value="reel">Reel</SelectItem>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Hashtags */}
          <div className="space-y-4">
            <Label>Hashtags</Label>
            <div className="flex gap-2">
              <Input
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add hashtag"
              />
              <Button onClick={addHashtag} variant="outline">
                <Hash className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {editedContent.hashtags.map((hashtag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeHashtag(hashtag)}
                >
                  #{hashtag} ×
                </Badge>
              ))}
            </div>
          </div>

          {/* Content Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-500" />
                <span>Platform: {editedContent.platform}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-gray-500" />
                <span>Type: {editedContent.contentType}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-2">
            {onRegenerate && (
              <Button
                variant="outline"
                onClick={handleRegenerate}
                disabled={isSaving}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            )}
            {onRecreate && (
              <Button
                variant="outline"
                onClick={handleRecreate}
                disabled={isSaving}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recreate
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
