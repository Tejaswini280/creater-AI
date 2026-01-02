import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Play, Pause, StopCircle, Edit, Eye, RefreshCw, Sparkles, Trash2, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, PauseCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContentItem {
  id: number;
  title: string;
  description: string;
  platform: string;
  contentType: string;
  status: 'draft' | 'scheduled' | 'published' | 'paused' | 'stopped' | 'deleted';
  scheduledDate: string;
  scheduledTime?: string;
  hashtags: string[];
  metadata: any;
  dayNumber: number;
}

interface ContentCalendarViewProps {
  content: ContentItem[];
  onContentAction: (action: string, contentId: number, updates?: any) => void;
  onViewContent: (content: ContentItem) => void;
  onEditContent: (content: ContentItem) => void;
  currentMonth?: Date;
  onMonthChange?: (date: Date) => void;
}

export default function ContentCalendarView({
  content,
  onContentAction,
  onViewContent,
  onEditContent,
  currentMonth = new Date(),
  onMonthChange
}: ContentCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Draft', icon: AlertCircle },
      scheduled: { variant: 'default' as const, label: 'Scheduled', icon: Clock },
      published: { variant: 'default' as const, label: 'Published', icon: CheckCircle },
      paused: { variant: 'outline' as const, label: 'Paused', icon: PauseCircle },
      stopped: { variant: 'destructive' as const, label: 'Stopped', icon: StopCircle },
      deleted: { variant: 'destructive' as const, label: 'Deleted', icon: Trash2 }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPlatformIcon = (platform: string) => {
    const icons = {
      instagram: '📸',
      facebook: '👥',
      youtube: '🎥',
      tiktok: '🎵',
      linkedin: '💼',
      twitter: '🐦'
    };
    return icons[platform as keyof typeof icons] || '📱';
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getContentForDate = (date: Date) => {
    return content.filter(item => {
      const itemDate = new Date(item.scheduledDate);
      return itemDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    onMonthChange?.(newMonth);
  };

  const handleContentAction = async (action: string, contentId: number, updates?: any) => {
    try {
      await onContentAction(action, contentId, updates);
      toast({
        title: "Success",
        description: `Content ${action}ed successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} content`,
        variant: "destructive"
      });
    }
  };

  const days = getDaysInMonth(currentMonth);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 min-h-0">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {content.length} total content
          </Badge>
          <Badge variant="outline">
            {content.filter(c => c.status === 'published').length} published
          </Badge>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <div className="grid grid-cols-7 gap-px bg-gray-200 min-w-[600px]">
            {/* Day Headers */}
            {dayNames.map((day) => (
              <div key={day} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {days.map((date, index) => {
              if (!date) {
                return <div key={index} className="bg-white h-24"></div>;
              }
              
              const dayContent = getContentForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              
              return (
                <div
                  key={index}
                  className={`bg-white h-24 p-2 border-r border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    isToday ? 'bg-blue-50 border-blue-200' : ''
                  } ${isSelected ? 'bg-blue-100 border-blue-300' : ''}`}
                  onClick={() => setSelectedDate(date)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${
                      isToday ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </span>
                    {dayContent.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {dayContent.length}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Content Preview */}
                  <div className="space-y-1">
                    {dayContent.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewContent(item);
                        }}
                      >
                        <span>{getPlatformIcon(item.platform)}</span>
                        <span className="truncate flex-1">{item.title}</span>
                        {getStatusBadge(item.status)}
                      </div>
                    ))}
                    {dayContent.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayContent.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Content Details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Content for {selectedDate.toLocaleDateString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            {getContentForDate(selectedDate).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No content scheduled for this date
              </div>
            ) : (
              <div className="space-y-4">
                {getContentForDate(selectedDate).map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{getPlatformIcon(item.platform)}</span>
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.scheduledTime || 'No specific time'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(item.status)}
                          <Badge variant="outline">{item.contentType}</Badge>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-700 mb-3 line-clamp-2">
                        {item.description}
                      </div>
                      
                      {item.hashtags && item.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.hashtags.slice(0, 3).map((hashtag) => (
                            <Badge key={hashtag} variant="secondary" className="text-xs">
                              #{hashtag}
                            </Badge>
                          ))}
                          {item.hashtags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.hashtags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>Day {item.dayNumber}</span>
                          {item.metadata?.aiGenerated && (
                            <Badge variant="outline" className="text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI Generated
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewContent(item)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          
                          {item.status !== 'published' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEditContent(item)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          )}

                          {item.status === 'draft' || item.status === 'paused' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleContentAction('play', item.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Play
                            </Button>
                          ) : item.status === 'scheduled' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleContentAction('pause', item.id)}
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              <Pause className="h-4 w-4 mr-1" />
                              Pause
                            </Button>
                          ) : null}

                          {(item.status === 'scheduled' || item.status === 'paused') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleContentAction('stop', item.id)}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <StopCircle className="h-4 w-4 mr-1" />
                              Stop
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleContentAction('regenerate', item.id)}
                            className="flex items-center gap-1"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Regenerate
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleContentAction('recreate', item.id)}
                            className="flex items-center gap-1"
                          >
                            <Sparkles className="h-4 w-4" />
                            Recreate
                          </Button>

                          {item.status !== 'published' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleContentAction('delete', item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
