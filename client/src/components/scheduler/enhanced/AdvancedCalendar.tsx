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
  Download,
  Upload,
  Settings,
  BarChart3,
  Clock,
  Users,
  Target
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';

interface ScheduledContent {
  id: string;
  title: string;
  description: string;
  scheduledTime: Date;
  platform: string[];
  contentType: 'post' | 'story' | 'video' | 'reel' | 'article';
  status: 'scheduled' | 'published' | 'failed' | 'draft';
  performance?: {
    views: number;
    engagement: number;
    reach: number;
  };
  tags: string[];
  priority: 'low' | 'medium' | 'high';
}

type ViewType = 'day' | 'week' | 'month' | 'quarter';

interface AdvancedCalendarProps {
  onContentSelect?: (content: ScheduledContent) => void;
  onDateSelect?: (date: Date) => void;
  onCreateContent?: (date: Date) => void;
}

export default function AdvancedCalendar({ 
  onContentSelect, 
  onDateSelect, 
  onCreateContent 
}: AdvancedCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([]);
  const [filteredPlatforms, setFilteredPlatforms] = useState<string[]>([]);
  const [filteredContentTypes, setFilteredContentTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sample data - replace with API call
  useEffect(() => {
    const sampleContent: ScheduledContent[] = [
      {
        id: '1',
        title: 'Weekly Marketing Update',
        description: 'Share this week\'s marketing insights and tips',
        scheduledTime: new Date(2025, 0, 15, 10, 0),
        platform: ['linkedin', 'twitter'],
        contentType: 'post',
        status: 'scheduled',
        performance: { views: 1250, engagement: 8.5, reach: 980 },
        tags: ['marketing', 'tips', 'weekly'],
        priority: 'high'
      },
      {
        id: '2',
        title: 'Product Demo Video',
        description: 'Showcase new features in our latest product update',
        scheduledTime: new Date(2025, 0, 16, 14, 30),
        platform: ['youtube', 'instagram'],
        contentType: 'video',
        status: 'scheduled',
        tags: ['product', 'demo', 'features'],
        priority: 'medium'
      },
      {
        id: '3',
        title: 'Behind the Scenes Story',
        description: 'Show the team working on exciting new projects',
        scheduledTime: new Date(2025, 0, 17, 16, 0),
        platform: ['instagram', 'facebook'],
        contentType: 'story',
        status: 'draft',
        tags: ['team', 'behind-scenes', 'culture'],
        priority: 'low'
      },
      {
        id: '4',
        title: 'Industry Trends Article',
        description: 'Deep dive into 2025 content marketing trends',
        scheduledTime: new Date(2025, 0, 20, 9, 0),
        platform: ['linkedin', 'medium'],
        contentType: 'article',
        status: 'scheduled',
        tags: ['trends', 'industry', '2025'],
        priority: 'high'
      },
      {
        id: '5',
        title: 'Quick Tips Reel',
        description: '5 quick productivity tips for content creators',
        scheduledTime: new Date(2025, 0, 22, 12, 0),
        platform: ['instagram', 'tiktok'],
        contentType: 'reel',
        status: 'scheduled',
        tags: ['tips', 'productivity', 'creators'],
        priority: 'medium'
      }
    ];
    setScheduledContent(sampleContent);
  }, []);

  const navigateDate = (direction: 'prev' | 'next') => {
    switch (viewType) {
      case 'day':
        setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
        break;
      case 'quarter':
        setCurrentDate(direction === 'next' ? addMonths(currentDate, 3) : subMonths(currentDate, 3));
        break;
    }
  };

  const getDateRange = () => {
    switch (viewType) {
      case 'day':
        return [currentDate];
      case 'week':
        return eachDayOfInterval({
          start: startOfWeek(currentDate),
          end: endOfWeek(currentDate)
        });
      case 'month':
        return eachDayOfInterval({
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate)
        });
      case 'quarter':
        return eachDayOfInterval({
          start: startOfMonth(subMonths(currentDate, 1)),
          end: endOfMonth(addMonths(currentDate, 1))
        });
      default:
        return [];
    }
  };

  const getContentForDate = (date: Date) => {
    return scheduledContent.filter(content => 
      isSameDay(content.scheduledTime, date) &&
      (filteredPlatforms.length === 0 || content.platform.some(p => filteredPlatforms.includes(p))) &&
      (filteredContentTypes.length === 0 || filteredContentTypes.includes(content.contentType))
    );
  };

  const getPlatformColor = (platform: string) => {
    const colors = {
      instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
      facebook: 'bg-blue-600',
      twitter: 'bg-blue-400',
      linkedin: 'bg-blue-700',
      youtube: 'bg-red-600',
      tiktok: 'bg-black',
      medium: 'bg-green-600'
    };
    return colors[platform as keyof typeof colors] || 'bg-gray-500';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      published: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'border-l-red-500',
      medium: 'border-l-yellow-500',
      low: 'border-l-green-500'
    };
    return colors[priority as keyof typeof colors] || 'border-l-gray-500';
  };

  const formatDateHeader = () => {
    switch (viewType) {
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'week':
        return `${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'quarter':
        return `Q${Math.ceil((currentDate.getMonth() + 1) / 3)} ${currentDate.getFullYear()}`;
      default:
        return '';
    }
  };

  const renderDayView = () => {
    const dayContent = getContentForDate(currentDate);
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Time slots */}
          {Array.from({ length: 24 }, (_, hour) => {
            const timeSlotContent = dayContent.filter(content => 
              content.scheduledTime.getHours() === hour
            );
            
            return (
              <div key={hour} className="border rounded-lg p-3 min-h-[100px]">
                <div className="font-medium text-sm text-gray-600 mb-2">
                  {format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
                </div>
                <div className="space-y-2">
                  {timeSlotContent.map(content => (
                    <div
                      key={content.id}
                      className={`p-2 rounded border-l-4 cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(content.priority)}`}
                      onClick={() => onContentSelect?.(content)}
                    >
                      <div className="font-medium text-sm">{content.title}</div>
                      <div className="flex items-center gap-1 mt-1">
                        {content.platform.map(platform => (
                          <div
                            key={platform}
                            className={`w-4 h-4 rounded-full ${getPlatformColor(platform)}`}
                            title={platform}
                          />
                        ))}
                      </div>
                      <Badge className={`text-xs mt-1 ${getStatusColor(content.status)}`}>
                        {content.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-xs"
                  onClick={() => onCreateContent?.(new Date(currentDate.setHours(hour, 0, 0, 0)))}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Content
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getDateRange();
    
    return (
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {weekDays.map(day => (
          <div key={day.toISOString()} className="text-center font-medium p-2 border-b">
            <div className="text-sm text-gray-600">{format(day, 'EEE')}</div>
            <div className="text-lg">{format(day, 'd')}</div>
          </div>
        ))}
        
        {/* Content for each day */}
        {weekDays.map(day => {
          const dayContent = getContentForDate(day);
          
          return (
            <div key={day.toISOString()} className="min-h-[200px] border rounded p-2 space-y-1">
              {dayContent.map(content => (
                <div
                  key={content.id}
                  className={`p-1 rounded text-xs cursor-pointer hover:shadow-sm border-l-2 ${getPriorityColor(content.priority)}`}
                  onClick={() => onContentSelect?.(content)}
                >
                  <div className="font-medium truncate">{content.title}</div>
                  <div className="text-gray-500">{format(content.scheduledTime, 'h:mm a')}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {content.platform.slice(0, 2).map(platform => (
                      <div
                        key={platform}
                        className={`w-2 h-2 rounded-full ${getPlatformColor(platform)}`}
                      />
                    ))}
                    {content.platform.length > 2 && (
                      <span className="text-xs text-gray-400">+{content.platform.length - 2}</span>
                    )}
                  </div>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs mt-2"
                onClick={() => onCreateContent?.(day)}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthDays = getDateRange();
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);
    
    // Get all days including padding for complete weeks
    const calendarStart = startOfWeek(startDate);
    const calendarEnd = endOfWeek(endDate);
    const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-medium p-2 text-sm text-gray-600">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {allDays.map(day => {
          const dayContent = getContentForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[120px] border rounded p-1 cursor-pointer hover:bg-gray-50 ${
                !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
              } ${isToday ? 'bg-blue-50 border-blue-200' : ''} ${
                isSelected ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => {
                setSelectedDate(day);
                onDateSelect?.(day);
              }}
            >
              <div className="text-sm font-medium mb-1">{format(day, 'd')}</div>
              <div className="space-y-1">
                {dayContent.slice(0, 3).map(content => (
                  <div
                    key={content.id}
                    className={`p-1 rounded text-xs cursor-pointer hover:shadow-sm border-l-2 ${getPriorityColor(content.priority)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onContentSelect?.(content);
                    }}
                  >
                    <div className="font-medium truncate">{content.title}</div>
                    <div className="flex items-center gap-1">
                      {content.platform.slice(0, 3).map(platform => (
                        <div
                          key={platform}
                          className={`w-2 h-2 rounded-full ${getPlatformColor(platform)}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {dayContent.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayContent.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCurrentView = () => {
    switch (viewType) {
      case 'day':
        return renderDayView();
      case 'week':
        return renderWeekView();
      case 'month':
        return renderMonthView();
      case 'quarter':
        return renderMonthView(); // For now, use month view for quarter
      default:
        return renderMonthView();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Content Calendar
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* View Type Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['day', 'week', 'month', 'quarter'] as ViewType[]).map(view => (
                <Button
                  key={view}
                  variant={viewType === view ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs"
                  onClick={() => setViewType(view)}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </Button>
              ))}
            </div>
            
            {/* Action Buttons */}
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1" />
              Filter
            </Button>
            
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-1" />
              Import
            </Button>
            
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              New Content
            </Button>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <h3 className="text-lg font-semibold ml-4">{formatDateHeader()}</h3>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{scheduledContent.filter(c => c.status === 'scheduled').length} Scheduled</span>
            </div>
            <div className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              <span>{scheduledContent.filter(c => c.status === 'published').length} Published</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              <span>{scheduledContent.filter(c => c.priority === 'high').length} High Priority</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          renderCurrentView()
        )}
      </CardContent>
    </Card>
  );
}