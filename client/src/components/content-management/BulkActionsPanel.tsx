import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Play, 
  Pause, 
  Square, 
  X,
  Filter,
  AlertTriangle
} from 'lucide-react';

interface BulkActionsPanelProps {
  onAction: (action: string, filters?: any) => void;
  onClose: () => void;
  projectStats: {
    totalContent: number;
    publishedContent: number;
    unpublishedContent: number;
    pausedContent: number;
    stoppedContent: number;
  };
}

export function BulkActionsPanel({ onAction, onClose, projectStats }: BulkActionsPanelProps) {
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [filters, setFilters] = useState({
    dayNumbers: [] as number[],
    platforms: [] as string[],
    statuses: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);

  const actions = [
    {
      id: 'play_all',
      label: 'Play All',
      description: 'Resume all paused and stopped content',
      icon: Play,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      disabled: projectStats.pausedContent === 0 && projectStats.stoppedContent === 0
    },
    {
      id: 'pause_all',
      label: 'Pause All',
      description: 'Pause all active content',
      icon: Pause,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      disabled: projectStats.pausedContent === projectStats.totalContent
    },
    {
      id: 'stop_all',
      label: 'Stop All',
      description: 'Stop all content from publishing',
      icon: Square,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      disabled: projectStats.stoppedContent === projectStats.totalContent
    },
    {
      id: 'stop_unpublished',
      label: 'Stop Unpublished',
      description: 'Stop only unpublished content from publishing',
      icon: Square,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      disabled: projectStats.unpublishedContent === 0
    },
    {
      id: 'pause_unpublished',
      label: 'Pause Unpublished',
      description: 'Pause only unpublished content',
      icon: Pause,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      disabled: projectStats.unpublishedContent === 0
    }
  ];

  const platforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'];
  const statuses = ['draft', 'scheduled', 'published', 'paused', 'stopped', 'failed'];

  const handleAction = async () => {
    if (!selectedAction) return;

    setIsLoading(true);
    try {
      await onAction(selectedAction, filters);
      onClose();
    } catch (error) {
      console.error('Error performing bulk action:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFilter = (type: 'dayNumbers' | 'platforms' | 'statuses', value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value as never)
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value as never]
    }));
  };

  const hasFilters = filters.dayNumbers.length > 0 || filters.platforms.length > 0 || filters.statuses.length > 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Bulk Actions</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Project Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{projectStats.totalContent}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{projectStats.publishedContent}</div>
            <div className="text-sm text-gray-600">Published</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{projectStats.unpublishedContent}</div>
            <div className="text-sm text-gray-600">Unpublished</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{projectStats.pausedContent}</div>
            <div className="text-sm text-gray-600">Paused</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{projectStats.stoppedContent}</div>
            <div className="text-sm text-gray-600">Stopped</div>
          </div>
        </div>

        {/* Action Selection */}
        <div className="space-y-3">
          <h3 className="font-medium">Select Action</h3>
          <div className="grid gap-2">
            {actions.map((action) => (
              <div
                key={action.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedAction === action.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !action.disabled && setSelectedAction(action.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${action.bgColor}`}>
                    <action.icon className={`h-4 w-4 ${action.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{action.label}</div>
                    <div className="text-sm text-gray-600">{action.description}</div>
                  </div>
                  {action.disabled && (
                    <Badge variant="secondary" className="text-xs">
                      No applicable content
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <h3 className="font-medium">Filters (Optional)</h3>
          
          {/* Day Numbers Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Day Numbers</label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                <Button
                  key={day}
                  size="sm"
                  variant={filters.dayNumbers.includes(day) ? "default" : "outline"}
                  onClick={() => toggleFilter('dayNumbers', day)}
                >
                  Day {day}
                </Button>
              ))}
            </div>
          </div>

          {/* Platforms Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <Button
                  key={platform}
                  size="sm"
                  variant={filters.platforms.includes(platform) ? "default" : "outline"}
                  onClick={() => toggleFilter('platforms', platform)}
                >
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={filters.statuses.includes(status) ? "default" : "outline"}
                  onClick={() => toggleFilter('statuses', status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Summary */}
        {selectedAction && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="font-medium">Action Summary</span>
            </div>
            <div className="text-sm text-gray-600">
              <p>Action: <strong>{actions.find(a => a.id === selectedAction)?.label}</strong></p>
              {hasFilters && (
                <p>Filters: {filters.dayNumbers.length} days, {filters.platforms.length} platforms, {filters.statuses.length} statuses</p>
              )}
              <p>This action will be applied to all matching content items.</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            disabled={!selectedAction || isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? 'Processing...' : 'Execute Action'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
