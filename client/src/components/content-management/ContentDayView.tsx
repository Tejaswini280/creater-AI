import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  BarChart3,
  Play,
  Pause,
  Square,
  MoreVertical
} from 'lucide-react';
import { ContentCard } from './ContentCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ContentDay {
  dayNumber: number;
  date: Date;
  content: ContentCard[];
  totalContent: number;
  publishedContent: number;
  unpublishedContent: number;
  pausedContent: number;
  stoppedContent: number;
}

interface ContentCard {
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
}

interface ContentDayViewProps {
  day: ContentDay;
  onContentAction: (contentId: number, action: string, data?: any) => void;
  onViewDay: () => void;
  compact?: boolean;
}

export function ContentDayView({ day, onContentAction, onViewDay, compact = false }: ContentDayViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllContent, setShowAllContent] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDayStatusColor = () => {
    if (day.stoppedContent > 0) return 'text-red-600';
    if (day.pausedContent > 0) return 'text-yellow-600';
    if (day.publishedContent === day.totalContent) return 'text-green-600';
    if (day.unpublishedContent > 0) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getDayStatusText = () => {
    if (day.stoppedContent > 0) return 'Stopped';
    if (day.pausedContent > 0) return 'Paused';
    if (day.publishedContent === day.totalContent) return 'Completed';
    if (day.unpublishedContent > 0) return 'In Progress';
    return 'Not Started';
  };

  const handleDayAction = async (action: string) => {
    // Apply action to all content in this day
    for (const content of day.content) {
      await onContentAction(content.id, action);
    }
  };

  const visibleContent = showAllContent ? day.content : day.content.slice(0, 3);
  const hasMoreContent = day.content.length > 3;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <div>
                    <CardTitle className="text-lg">
                      Day {day.dayNumber}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      {formatDate(day.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    <Calendar className="h-3 w-3 mr-1" />
                    {day.totalContent} content
                  </Badge>
                  <Badge className={getDayStatusColor()}>
                    {getDayStatusText()}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDay();
                  }}
                >
                  View Details
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleDayAction('play')}>
                      <Play className="h-4 w-4 mr-2" />
                      Play All
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDayAction('pause')}>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause All
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDayAction('stop')}>
                      <Square className="h-4 w-4 mr-2" />
                      Stop All
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Day Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {day.publishedContent}
                </div>
                <div className="text-sm text-green-600">Published</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {day.unpublishedContent}
                </div>
                <div className="text-sm text-blue-600">Unpublished</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {day.pausedContent}
                </div>
                <div className="text-sm text-yellow-600">Paused</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {day.stoppedContent}
                </div>
                <div className="text-sm text-red-600">Stopped</div>
              </div>
            </div>

            {/* Content List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Content Items</h4>
                {hasMoreContent && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAllContent(!showAllContent)}
                  >
                    {showAllContent ? 'Show Less' : `Show All ${day.content.length}`}
                  </Button>
                )}
              </div>

              <div className="grid gap-3">
                {visibleContent.map((content) => (
                  <ContentCard
                    key={content.id}
                    content={content}
                    onAction={onContentAction}
                    compact={true}
                  />
                ))}
              </div>

              {hasMoreContent && !showAllContent && (
                <div className="text-center py-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAllContent(true)}
                  >
                    Show {day.content.length - 3} more content items
                  </Button>
                </div>
              )}
            </div>

            {/* Day Actions */}
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <div className="text-sm text-gray-500">
                {day.totalContent} content items • {day.publishedContent} published • {day.unpublishedContent} unpublished
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDayAction('play')}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Play All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDayAction('pause')}
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pause All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDayAction('stop')}
                >
                  <Square className="h-4 w-4 mr-1" />
                  Stop All
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
