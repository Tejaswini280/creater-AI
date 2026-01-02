import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Filter,
  Grid,
  List,
  BarChart3
} from 'lucide-react';
import { ContentCard } from './ContentCard';
import { CalendarDay } from './CalendarDay';
import { CalendarFilters } from './CalendarFilters';
import { CalendarStats } from './CalendarStats';

interface ContentCalendarViewProps {
  projectId: number;
  days: ContentDay[];
  onContentAction: (contentId: number, action: string, data?: any) => void;
  onExtendProject: () => void;
}

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

type ViewMode = 'month' | 'week' | 'list';
type FilterType = 'all' | 'published' | 'unpublished' | 'paused' | 'stopped';

export function ContentCalendarView({ 
  projectId, 
  days, 
  onContentAction, 
  onExtendProject 
}: ContentCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDay, setSelectedDay] = useState<ContentDay | null>(null);

  // Filter days based on current filter
  const filteredDays = days.filter(day => {
    switch (filter) {
      case 'published':
        return day.publishedContent > 0;
      case 'unpublished':
        return day.unpublishedContent > 0;
      case 'paused':
        return day.pausedContent > 0;
      case 'stopped':
        return day.stoppedContent > 0;
      default:
        return true;
    }
  });

  // Get calendar days for the current month
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const dayData = filteredDays.find(d => 
        d.date.getDate() === current.getDate() && 
        d.date.getMonth() === current.getMonth() && 
        d.date.getFullYear() === current.getFullYear()
      );
      
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === new Date().toDateString(),
        dayData
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = getCalendarDays();

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getWeekDays = () => {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  };

  const getTotalStats = () => {
    return filteredDays.reduce((acc, day) => ({
      totalContent: acc.totalContent + day.totalContent,
      publishedContent: acc.publishedContent + day.publishedContent,
      unpublishedContent: acc.unpublishedContent + day.unpublishedContent,
      pausedContent: acc.pausedContent + day.pausedContent,
      stoppedContent: acc.stoppedContent + day.stoppedContent
    }), {
      totalContent: 0,
      publishedContent: 0,
      unpublishedContent: 0,
      pausedContent: 0,
      stoppedContent: 0
    });
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Content Calendar</h2>
          <Badge variant="outline">
            {filteredDays.length} days • {stats.totalContent} content
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExtendProject}
          >
            <Plus className="h-4 w-4 mr-2" />
            Extend Project
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <CalendarFilters
          filter={filter}
          onFilterChange={setFilter}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Calendar Stats */}
      <CalendarStats stats={stats} />

      {/* View Mode Toggle */}
      <div className="flex items-center space-x-2">
        <Button
          variant={viewMode === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('month')}
        >
          <Grid className="h-4 w-4 mr-2" />
          Month
        </Button>
        <Button
          variant={viewMode === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('week')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Week
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('list')}
        >
          <List className="h-4 w-4 mr-2" />
          List
        </Button>
      </div>

      {/* Calendar Content */}
      {viewMode === 'month' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{getMonthName(currentDate)}</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Week day headers */}
              {getWeekDays().map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((day, index) => (
                <CalendarDay
                  key={index}
                  day={day}
                  onDayClick={setSelectedDay}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'week' && (
        <Card>
          <CardHeader>
            <CardTitle>Week View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Week View</h3>
              <p className="text-gray-500">Week view will be implemented here</p>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredDays.map(day => (
            <Card key={day.dayNumber}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Day {day.dayNumber} - {day.date.toLocaleDateString()}</span>
                  <Badge variant="outline">
                    {day.totalContent} content
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {day.content.map(content => (
                    <ContentCard
                      key={content.id}
                      content={content}
                      onAction={onContentAction}
                      compact={true}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Day Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Day {selectedDay.dayNumber} - {selectedDay.date.toLocaleDateString()}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDay(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {selectedDay.content.map(content => (
                  <ContentCard
                    key={content.id}
                    content={content}
                    onAction={onContentAction}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
