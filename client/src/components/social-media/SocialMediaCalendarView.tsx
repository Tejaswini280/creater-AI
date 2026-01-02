import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isPast, isFuture } from 'date-fns';
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
  Clock,
  Play,
  Pause,
  StopCircle,
  Edit,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialMediaCalendarViewProps {
  projectId: number;
  content: any[];
  calendar: any[];
  onContentAction: (contentId: number, action: string, data?: any) => void;
  onExtendProject: () => void;
  onRegenerateContent: () => void;
  isLoading?: boolean;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  content: any[];
  dayNumber?: number;
}

type ViewMode = 'month' | 'week' | 'list';
type FilterType = 'all' | 'scheduled' | 'published' | 'draft' | 'paused' | 'stopped';

export function SocialMediaCalendarView({ 
  projectId, 
  content, 
  calendar, 
  onContentAction, 
  onExtendProject,
  onRegenerateContent,
  isLoading = false
}: SocialMediaCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  // Filter content based on current filter
  const filteredContent = useCallback(() => {
    if (filter === 'all') return content;
    return content.filter(item => {
      switch (filter) {
        case 'scheduled':
          return item.status === 'scheduled' && !item.isPaused && !item.isStopped;
        case 'published':
          return item.status === 'published';
        case 'draft':
          return item.status === 'draft';
        case 'paused':
          return item.isPaused;
        case 'stopped':
          return item.isStopped;
        default:
          return true;
      }
    });
  }, [content, filter]);

  // Get calendar days for the current month
  const getCalendarDays = useCallback((): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = startOfMonth(currentDate);
    const lastDay = endOfMonth(currentDate);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const dayContent = filteredContent().filter(item => {
        if (!item.scheduledDate) return false;
        const itemDate = new Date(item.scheduledDate);
        return isSameDay(itemDate, current);
      });
      
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: isToday(current),
        isPast: isPast(current),
        isFuture: isFuture(current),
        content: dayContent,
        dayNumber: dayContent.length > 0 ? dayContent[0].dayNumber : undefined
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentDate, filteredContent]);

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
    const filtered = filteredContent();
    return {
      totalContent: filtered.length,
      scheduledContent: filtered.filter(c => c.status === 'scheduled' && !c.isPaused && !c.isStopped).length,
      publishedContent: filtered.filter(c => c.status === 'published').length,
      draftContent: filtered.filter(c => c.status === 'draft').length,
      pausedContent: filtered.filter(c => c.isPaused).length,
      stoppedContent: filtered.filter(c => c.isStopped).length
    };
  };

  const stats = getTotalStats();

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

  const getStatusBadge = (item: any) => {
    if (item.isStopped) {
      return <Badge variant="destructive" className="text-xs">Stopped</Badge>;
    }
    if (item.isPaused) {
      return <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">Paused</Badge>;
    }
    if (item.status === 'published') {
      return <Badge variant="default" className="text-xs bg-green-50 text-green-700">Published</Badge>;
    }
    if (item.status === 'scheduled') {
      return <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">Scheduled</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Draft</Badge>;
  };

  const handleContentAction = async (contentId: number, action: string, data?: any) => {
    try {
      await onContentAction(contentId, action, data);
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Content Calendar</h2>
          <Badge variant="outline">
            {stats.totalContent} content • {calendarDays.filter(d => d.content.length > 0).length} days
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
            onClick={onRegenerateContent}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
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
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'All', count: stats.totalContent },
                    { value: 'scheduled', label: 'Scheduled', count: stats.scheduledContent },
                    { value: 'published', label: 'Published', count: stats.publishedContent },
                    { value: 'draft', label: 'Draft', count: stats.draftContent },
                    { value: 'paused', label: 'Paused', count: stats.pausedContent },
                    { value: 'stopped', label: 'Stopped', count: stats.stoppedContent }
                  ].map((filterOption) => (
                    <Button
                      key={filterOption.value}
                      variant={filter === filterOption.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(filterOption.value as FilterType)}
                      className="flex items-center gap-2"
                    >
                      {filterOption.label}
                      <Badge variant="secondary" className="ml-1">
                        {filterOption.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.totalContent}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{stats.scheduledContent}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-green-600">{stats.publishedContent}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-gray-600">{stats.draftContent}</p>
              </div>
              <Edit className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paused</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pausedContent}</p>
              </div>
              <Pause className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

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
                <motion.div
                  key={index}
                  className={`p-2 min-h-[100px] border rounded-lg cursor-pointer transition-all ${
                    day.isCurrentMonth 
                      ? 'bg-white hover:bg-gray-50' 
                      : 'bg-gray-50 text-gray-400'
                  } ${
                    day.isToday 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : ''
                  } ${
                    day.content.length > 0 
                      ? 'border-blue-200 bg-blue-50/50' 
                      : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedDay(day)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${
                      day.isToday ? 'text-blue-600' : ''
                    }`}>
                      {day.date.getDate()}
                    </span>
                    {day.content.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {day.content.length}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Content preview */}
                  <div className="space-y-1">
                    {day.content.slice(0, 2).map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="flex items-center gap-1 text-xs p-1 bg-white rounded border"
                      >
                        <span>{getPlatformIcon(item.platform)}</span>
                        <span className="truncate flex-1">{item.title}</span>
                        {getStatusBadge(item)}
                      </div>
                    ))}
                    {day.content.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{day.content.length - 2} more
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'list' && (
        <div className="space-y-4">
          {calendarDays
            .filter(day => day.content.length > 0)
            .map(day => (
              <Card key={day.date.toISOString()}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      {format(day.date, 'EEEE, MMMM d, yyyy')}
                      {day.dayNumber && (
                        <Badge variant="outline" className="ml-2">
                          Day {day.dayNumber}
                        </Badge>
                      )}
                    </span>
                    <Badge variant="outline">
                      {day.content.length} content
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {day.content.map(item => (
                      <Card key={item.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{getPlatformIcon(item.platform)}</span>
                              <div>
                                <div className="font-medium">{item.title}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  {item.scheduledDate ? format(new Date(item.scheduledDate), 'HH:mm') : 'Not scheduled'}
                                  <span>•</span>
                                  {item.contentType}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(item)}
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleContentAction(item.id, 'play')}
                                  disabled={item.isPaused || item.isStopped}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleContentAction(item.id, 'pause')}
                                  disabled={item.isPaused || item.isStopped}
                                >
                                  <Pause className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleContentAction(item.id, 'edit')}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleContentAction(item.id, 'regenerate')}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleContentAction(item.id, 'delete')}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Day Detail Modal */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-xl font-semibold">
                  {format(selectedDay.date, 'EEEE, MMMM d, yyyy')}
                  {selectedDay.dayNumber && (
                    <Badge variant="outline" className="ml-2">
                      Day {selectedDay.dayNumber}
                    </Badge>
                  )}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDay(null)}
                >
                  ×
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {selectedDay.content.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDay.content.map(item => (
                      <Card key={item.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{getPlatformIcon(item.platform)}</span>
                              <div>
                                <div className="font-medium">{item.title}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  {item.scheduledDate ? format(new Date(item.scheduledDate), 'HH:mm') : 'Not scheduled'}
                                  <span>•</span>
                                  {item.contentType}
                                  {item.aiGenerated && (
                                    <Badge variant="outline" className="ml-2">
                                      <Sparkles className="h-3 w-3 mr-1" />
                                      AI Generated
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(item)}
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleContentAction(item.id, 'play')}
                                  disabled={item.isPaused || item.isStopped}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleContentAction(item.id, 'pause')}
                                  disabled={item.isPaused || item.isStopped}
                                >
                                  <Pause className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleContentAction(item.id, 'edit')}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleContentAction(item.id, 'regenerate')}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleContentAction(item.id, 'delete')}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          {item.description && (
                            <div className="mt-3 text-sm text-gray-600">
                              {item.description}
                            </div>
                          )}
                          {item.hashtags && item.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {item.hashtags.slice(0, 5).map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {item.hashtags.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{item.hashtags.length - 5} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Content</h3>
                    <p className="text-gray-500">No content scheduled for this day</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
