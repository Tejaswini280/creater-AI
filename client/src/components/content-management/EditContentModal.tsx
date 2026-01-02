import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Hash, Save } from 'lucide-react';

interface EditContentModalProps {
  content: {
    id: number;
    title: string;
    description: string;
    content: string;
    platform: string;
    contentType: string;
    status: string;
    dayNumber: number;
    scheduledDate: Date | null;
    publishedAt: Date | null;
    isPaused: boolean;
    isStopped: boolean;
    canPublish: boolean;
    publishOrder: number;
    contentVersion: number;
    lastRegeneratedAt: Date | null;
    hashtags: string[];
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
  };
  onSave: (data: any) => void;
  onClose: () => void;
}

export function EditContentModal({ content, onSave, onClose }: EditContentModalProps) {
  const [formData, setFormData] = useState({
    title: content.title,
    description: content.description || '',
    content: content.content,
    hashtags: content.hashtags || []
  });
  const [newHashtag, setNewHashtag] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddHashtag = () => {
    if (newHashtag.trim() && !formData.hashtags.includes(newHashtag.trim())) {
      setFormData(prev => ({
        ...prev,
        hashtags: [...prev.hashtags, newHashtag.trim()]
      }));
      setNewHashtag('');
    }
  };

  const handleRemoveHashtag = (hashtag: string) => {
    setFormData(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter(h => h !== hashtag)
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddHashtag();
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Save className="h-5 w-5" />
            <span>Edit Content</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content Info */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{content.platform}</Badge>
              <Badge variant="outline">{content.contentType}</Badge>
              <Badge variant="outline">Day {content.dayNumber}</Badge>
            </div>
            <div className="text-sm text-gray-500">
              Version {content.contentVersion} • Last updated: {new Date(content.updatedAt).toLocaleDateString()}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter content title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter content description"
              rows={3}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Enter content text"
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          {/* Hashtags */}
          <div className="space-y-3">
            <Label>Hashtags</Label>
            
            {/* Current Hashtags */}
            {formData.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.hashtags.map((hashtag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center space-x-1"
                  >
                    <Hash className="h-3 w-3" />
                    <span>{hashtag}</span>
                    <button
                      onClick={() => handleRemoveHashtag(hashtag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add New Hashtag */}
            <div className="flex items-center space-x-2">
              <Input
                value={newHashtag}
                onChange={(e) => setNewHashtag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add hashtag"
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleAddHashtag}
                disabled={!newHashtag.trim() || formData.hashtags.includes(newHashtag.trim())}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold text-lg mb-2">{formData.title}</h3>
              {formData.description && (
                <p className="text-gray-600 mb-3">{formData.description}</p>
              )}
              <div className="whitespace-pre-wrap text-sm mb-3">{formData.content}</div>
              {formData.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.hashtags.map((hashtag, index) => (
                    <span key={index} className="text-blue-600 text-sm">
                      #{hashtag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Metadata Info */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Content Information</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Platform: <strong>{content.platform}</strong></p>
              <p>• Content Type: <strong>{content.contentType}</strong></p>
              <p>• Day Number: <strong>{content.dayNumber}</strong></p>
              <p>• Current Status: <strong>{content.status}</strong></p>
              {content.scheduledDate && (
                <p>• Scheduled: <strong>{new Date(content.scheduledDate).toLocaleString()}</strong></p>
              )}
              {content.publishedAt && (
                <p>• Published: <strong>{new Date(content.publishedAt).toLocaleString()}</strong></p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !formData.title.trim() || !formData.content.trim()}
            className="min-w-[100px]"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
