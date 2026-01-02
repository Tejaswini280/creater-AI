import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Settings, AlertTriangle, Info } from 'lucide-react';

interface ProjectSettingsModalProps {
  projectId: number;
  currentSettings: {
    isPaused: boolean;
    isStopped: boolean;
    canPublishUnpublished: boolean;
  };
  onUpdate: (settings: any) => void;
  onClose: () => void;
}

export function ProjectSettingsModal({ 
  projectId, 
  currentSettings, 
  onUpdate, 
  onClose 
}: ProjectSettingsModalProps) {
  const [settings, setSettings] = useState(currentSettings);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      await onUpdate(settings);
    } catch (error) {
      console.error('Error updating project settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Project Settings</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Project Status</h3>
            
            {/* Pause Project */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="isPaused" className="text-base font-medium">
                  Pause Project
                </Label>
                <p className="text-sm text-gray-600">
                  Temporarily pause all content generation and publishing
                </p>
              </div>
              <Switch
                id="isPaused"
                checked={settings.isPaused}
                onCheckedChange={(checked) => handleSettingChange('isPaused', checked)}
              />
            </div>

            {/* Stop Project */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="isStopped" className="text-base font-medium">
                  Stop Project
                </Label>
                <p className="text-sm text-gray-600">
                  Completely stop the project and prevent all content publishing
                </p>
              </div>
              <Switch
                id="isStopped"
                checked={settings.isStopped}
                onCheckedChange={(checked) => handleSettingChange('isStopped', checked)}
              />
            </div>
          </div>

          {/* Publishing Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Publishing Settings</h3>
            
            {/* Allow Unpublished Publishing */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="canPublishUnpublished" className="text-base font-medium">
                  Allow Unpublished Content Publishing
                </Label>
                <p className="text-sm text-gray-600">
                  Allow unpublished content to be published automatically
                </p>
              </div>
              <Switch
                id="canPublishUnpublished"
                checked={settings.canPublishUnpublished}
                onCheckedChange={(checked) => handleSettingChange('canPublishUnpublished', checked)}
              />
            </div>
          </div>

          {/* Status Warnings */}
          {settings.isStopped && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">Project Stopped</h4>
                  <p className="text-sm text-red-700 mt-1">
                    This project is currently stopped. No content will be published until you restart it.
                  </p>
                </div>
              </div>
            </div>
          )}

          {settings.isPaused && !settings.isStopped && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Project Paused</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    This project is currently paused. Content generation and publishing are temporarily suspended.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Information */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Settings Information</h4>
                <div className="text-sm text-blue-700 mt-1 space-y-1">
                  <p>• <strong>Pause Project:</strong> Temporarily stops content generation and publishing</p>
                  <p>• <strong>Stop Project:</strong> Completely stops the project and prevents all publishing</p>
                  <p>• <strong>Allow Unpublished Publishing:</strong> Controls whether unpublished content can be published</p>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Current Settings Summary</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>• Project Status: <strong>{settings.isStopped ? 'Stopped' : settings.isPaused ? 'Paused' : 'Active'}</strong></p>
              <p>• Unpublished Publishing: <strong>{settings.canPublishUnpublished ? 'Enabled' : 'Disabled'}</strong></p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? 'Updating...' : 'Update Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
