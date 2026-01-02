import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';

interface CalendarFiltersProps {
  filter: 'all' | 'published' | 'unpublished' | 'paused' | 'stopped';
  onFilterChange: (filter: 'all' | 'published' | 'unpublished' | 'paused' | 'stopped') => void;
  onClose: () => void;
}

export function CalendarFilters({ filter, onFilterChange, onClose }: CalendarFiltersProps) {
  const filters = [
    {
      id: 'all',
      label: 'All Content',
      description: 'Show all content',
      color: 'bg-gray-100 text-gray-800'
    },
    {
      id: 'published',
      label: 'Published',
      description: 'Show only published content',
      color: 'bg-green-100 text-green-800'
    },
    {
      id: 'unpublished',
      label: 'Unpublished',
      description: 'Show only unpublished content',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'paused',
      label: 'Paused',
      description: 'Show only paused content',
      color: 'bg-yellow-100 text-yellow-800'
    },
    {
      id: 'stopped',
      label: 'Stopped',
      description: 'Show only stopped content',
      color: 'bg-red-100 text-red-800'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Calendar Filters</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Filter the calendar view to show specific types of content
          </p>
          
          <div className="grid gap-2">
            {filters.map((filterOption) => (
              <div
                key={filterOption.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  filter === filterOption.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onFilterChange(filterOption.id as any)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${filterOption.color}`}>
                    <div className="w-2 h-2 rounded-full bg-current"></div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{filterOption.label}</div>
                    <div className="text-sm text-gray-600">{filterOption.description}</div>
                  </div>
                  {filter === filterOption.id && (
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <div className="text-sm text-gray-600">
              <strong>Current Filter:</strong> {filters.find(f => f.id === filter)?.label}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
