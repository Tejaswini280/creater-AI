import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Calendar, Hash } from 'lucide-react';

interface ExtendProjectModalProps {
  onExtend: (additionalDays: number, platforms: string[], contentType: string) => void;
  onClose: () => void;
}

export function ExtendProjectModal({ onExtend, onClose }: ExtendProjectModalProps) {
  const [additionalDays, setAdditionalDays] = useState(7);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  const [contentType, setContentType] = useState('post');
  const [customContentType, setCustomContentType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: '📷' },
    { id: 'facebook', name: 'Facebook', icon: '👥' },
    { id: 'twitter', name: 'Twitter', icon: '🐦' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵' },
    { id: 'youtube', name: 'YouTube', icon: '📺' }
  ];

  const contentTypes = [
    { id: 'post', name: 'Post' },
    { id: 'reel', name: 'Reel' },
    { id: 'short', name: 'Short' },
    { id: 'story', name: 'Story' },
    { id: 'video', name: 'Video' },
    { id: 'blog', name: 'Blog Post' },
    { id: 'custom', name: 'Custom' }
  ];

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleExtend = async () => {
    if (additionalDays <= 0 || selectedPlatforms.length === 0) {
      return;
    }

    setIsLoading(true);
    try {
      const finalContentType = contentType === 'custom' ? customContentType : contentType;
      await onExtend(additionalDays, selectedPlatforms, finalContentType);
    } catch (error) {
      console.error('Error extending project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const estimatedContent = additionalDays * selectedPlatforms.length;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Extend Project</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Additional Days */}
          <div className="space-y-2">
            <Label htmlFor="additionalDays" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Additional Days</span>
            </Label>
            <div className="flex items-center space-x-4">
              <Input
                id="additionalDays"
                type="number"
                min="1"
                max="365"
                value={additionalDays}
                onChange={(e) => setAdditionalDays(parseInt(e.target.value) || 1)}
                className="w-32"
              />
              <span className="text-sm text-gray-500">
                Add {additionalDays} more day{additionalDays !== 1 ? 's' : ''} to your project
              </span>
            </div>
          </div>

          {/* Platforms Selection */}
          <div className="space-y-3">
            <Label className="flex items-center space-x-2">
              <Hash className="h-4 w-4" />
              <span>Target Platforms</span>
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {platforms.map((platform) => (
                <div
                  key={platform.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedPlatforms.includes(platform.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handlePlatformToggle(platform.id)}
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedPlatforms.includes(platform.id)}
                      onChange={() => handlePlatformToggle(platform.id)}
                    />
                    <span className="text-lg">{platform.icon}</span>
                    <span className="font-medium">{platform.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Type */}
          <div className="space-y-3">
            <Label htmlFor="contentType">Content Type</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                {contentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {contentType === 'custom' && (
              <Input
                placeholder="Enter custom content type"
                value={customContentType}
                onChange={(e) => setCustomContentType(e.target.value)}
              />
            )}
          </div>

          {/* Extension Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Extension Summary</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>• Adding <strong>{additionalDays} day{additionalDays !== 1 ? 's' : ''}</strong> to your project</p>
              <p>• Generating content for <strong>{selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''}</strong>: {selectedPlatforms.map(p => platforms.find(pl => pl.id === p)?.name).join(', ')}</p>
              <p>• Content type: <strong>{contentType === 'custom' ? customContentType : contentTypes.find(t => t.id === contentType)?.name}</strong></p>
              <p>• Estimated new content pieces: <strong>{estimatedContent}</strong></p>
            </div>
          </div>

          {/* AI Settings Preview */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2 text-blue-900">AI Generation Settings</h4>
            <div className="text-sm text-blue-800">
              <p>Content will be generated using your project's AI settings and will maintain consistency with your existing content style and tone.</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleExtend}
            disabled={isLoading || additionalDays <= 0 || selectedPlatforms.length === 0 || (contentType === 'custom' && !customContentType.trim())}
            className="min-w-[120px]"
          >
            {isLoading ? 'Extending...' : `Extend Project (+${estimatedContent} content)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
