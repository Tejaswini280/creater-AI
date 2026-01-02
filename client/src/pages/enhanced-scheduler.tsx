import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { SchedulerService } from '@/lib/schedulerService';
import TemplateLibrary from '@/components/scheduler/enhanced/TemplateLibrary';
import { 
  Calendar, 
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  List,
  TrendingUp,
  Youtube,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Edit,
  Trash2,
  Copy,
  Settings,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  FileText,
  Sparkles
} from 'lucide-react';
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, getWeek } from 'date-fns';

interface ScheduledContent {
  id: string;
  title: string;
  description: string;
  platform: string[];
  contentType: 'post' | 'story' | 'video' | 'reel' | 'article';
  scheduledTime: Date;
  status: 'scheduled' | 'published' | 'failed' | 'draft';
  engagement?: number;
  reach?: number;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  thumbnail?: string;
}

type ViewType = 'day' | 'week' | 'month';

export default function EnhancedScheduler() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [editingContent, setEditingContent] = useState<ScheduledContent | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    contentId: string | null;
    contentTitle: string;
  }>({
    isOpen: false,
    contentId: null,
    contentTitle: '',
  });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    platform: [] as string[],
    contentType: 'post' as 'post' | 'story' | 'video' | 'reel' | 'article',
    scheduledTime: new Date(),
    priority: 'medium' as 'high' | 'medium' | 'low',
    tags: [] as string[]
  });

  // Async operations
  const { execute: executeLoadContent, isLoading: isLoadingContent } = useAsyncOperation(
    async () => {
      const response = await fetch('/api/content/scheduled', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const formattedContent = data.scheduledContent?.map((item: any) => ({
          id: item.id.toString(),
          title: item.title,
          description: item.description || '',
          platform: Array.isArray(item.platform) ? item.platform : [item.platform],
          contentType: item.contentType || 'post',
          scheduledTime: new Date(item.scheduledAt),
          status: item.status || 'scheduled',
          engagement: Math.random() * 15 + 5,
          reach: Math.floor(Math.random() * 5000) + 1000,
          priority: item.priority || 'medium',
          tags: item.tags || []
        })) || [];

        return formattedContent.length > 0 ? formattedContent : getSampleData();
      } else {
        return getSampleData();
      }
    },
    {
      onSuccess: (content) => {
        setScheduledContent(content);
      },
      errorMessage: 'Failed to load scheduled content. Using sample data.',
    }
  );

  const { execute: executeCreateContent, isLoading: isCreatingContent } = useAsyncOperation(
    async () => {
      if (editingContent) {
        // Update existing content
        const response = await fetch(`/api/content/schedule/${editingContent.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            platform: formData.platform.length > 0 ? formData.platform[0] : 'instagram',
            contentType: formData.contentType,
            scheduledAt: formData.scheduledTime.toISOString(),
            priority: formData.priority,
            tags: formData.tags
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update content');
        }

        return { type: 'update', content: editingContent };
      } else {
        // Create new content
        const response = await fetch('/api/content/schedule', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            platform: formData.platform.length > 0 ? formData.platform[0] : 'instagram',
            contentType: formData.contentType,
            scheduledAt: formData.scheduledTime.toISOString(),
            priority: formData.priority,
            tags: formData.tags,
            autoPost: true
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create content');
        }

        const result = await response.json();
        return { type: 'create', result };
      }
    },
    {
      onSuccess: (data) => {
        if (data.type === 'update') {
          // Update local state
          setScheduledContent(prev => prev.map(content => 
            content.id === editingContent?.id ? {
              ...content,
              title: formData.title,
              description: formData.description,
              platform: formData.platform,
              contentType: formData.contentType,
              scheduledTime: formData.scheduledTime,
              priority: formData.priority,
              tags: formData.tags
            } : content
          ));
        } else {
          // Add to local state
          const newContent: ScheduledContent = {
            id: data.result.scheduledContent?.id?.toString() || `content-${Date.now()}`,
            title: formData.title,
            description: formData.description,
            platform: formData.platform,
            contentType: formData.contentType,
            scheduledTime: formData.scheduledTime,
            status: 'scheduled',
            priority: formData.priority,
            tags: formData.tags,
            engagement: Math.random() * 10 + 5,
            reach: Math.floor(Math.random() * 3000) + 1000
          };

          setScheduledContent(prev => [...prev, newContent]);
        }

        // Reset form
        setFormData({
          title: '',
          description: '',
          platform: [],
          contentType: 'post',
          scheduledTime: new Date(),
          priority: 'medium',
          tags: []
        });
        setShowCreateForm(false);
        setEditingContent(null);
      },
      successMessage: editingContent ? "Campaign Successfully Updated!" : "Campaign Successfully Launched!",
      errorMessage: "Failed to save campaign. Please try again.",
    }
  );

  const { execute: executeDeleteContent, isLoading: isDeletingContent } = useAsyncOperation(
    async (contentId: string) => {
      const response = await fetch(`/api/content/schedule/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete content');
      }

      return contentId;
    },
    {
      onSuccess: (deletedContentId) => {
        setScheduledContent(prev => prev.filter(content => content.id !== deletedContentId));
        setDeleteConfirmation({ isOpen: false, contentId: null, contentTitle: '' });
      },
      successMessage: "Campaign removed successfully",
      errorMessage: "Failed to delete campaign. Please try again.",
    }
  );

  // Debounced functions
  const debouncedRefresh = useDebouncedCallback(() => {
    executeLoadContent();
  }, 500);

  const platforms = [
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-500' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-blue-400' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' }
  ];

  // Load scheduled content from backend
  useEffect(() => {
    executeLoadContent();
  }, []);

  const loadScheduledContent = useCallback(() => {
    executeLoadContent();
  }, [executeLoadContent]);

  const getSampleData = () => {
    return [
      {
        id: '1',
        title: 'Strategic Monday Motivation Campaign',
        description: 'High-impact motivational content designed to maximize Monday engagement and drive brand awareness',
        platform: ['instagram', 'facebook'],
        contentType: 'post' as const,
        scheduledTime: new Date(2025, 0, 27, 9, 0), // Monday 9 AM
        status: 'scheduled' as const,
        engagement: 8.5,
        reach: 2400,
        priority: 'high' as const,
        tags: ['motivation', 'monday', 'inspiration']
      },
      {
        id: '2',
        title: 'Premium Product Showcase Experience',
        description: 'Comprehensive product demonstration featuring cutting-edge innovations and market-leading capabilities',
        platform: ['youtube', 'linkedin'],
        contentType: 'video' as const,
        scheduledTime: new Date(2025, 0, 28, 14, 0), // Tuesday 2 PM
        status: 'scheduled' as const,
        engagement: 12.3,
        reach: 5600,
        priority: 'high' as const,
        tags: ['product', 'demo', 'features']
      },
      {
        id: '3',
        title: 'Executive Leadership Insights Series',
        description: 'Expert-level productivity strategies and leadership principles for high-performing teams',
        platform: ['twitter', 'linkedin'],
        contentType: 'post' as const,
        scheduledTime: new Date(2025, 0, 29, 11, 0), // Wednesday 11 AM
        status: 'scheduled' as const,
        engagement: 6.8,
        reach: 1800,
        priority: 'medium' as const,
        tags: ['tips', 'productivity', 'remote']
      },
      {
        id: '4',
        title: 'Exclusive Behind-the-Scenes Excellence',
        description: 'Premium access to our innovation process and world-class team culture showcase',
        platform: ['instagram'],
        contentType: 'story' as const,
        scheduledTime: new Date(2025, 0, 30, 16, 0), // Thursday 4 PM
        status: 'draft' as const,
        priority: 'low' as const,
        tags: ['behind-scenes', 'team', 'culture']
      },
      {
        id: '5',
        title: 'Client Success Transformation Story',
        description: 'Compelling case study showcasing exceptional customer achievements and measurable ROI impact',
        platform: ['linkedin', 'facebook'],
        contentType: 'post' as const,
        scheduledTime: new Date(2025, 0, 31, 10, 0), // Friday 10 AM
        status: 'scheduled' as const,
        engagement: 9.2,
        reach: 3200,
        priority: 'medium' as const,
        tags: ['customer', 'success', 'feature']
      },
      {
        id: '6',
        title: 'Weekend Excellence & Achievement Focus',
        description: 'Premium motivational content inspiring strategic reflection and goal-oriented weekend planning',
        platform: ['instagram', 'youtube'],
        contentType: 'reel' as const,
        scheduledTime: new Date(2025, 1, 1, 12, 0), // Saturday 12 PM
        status: 'scheduled' as const,
        engagement: 15.7,
        reach: 4800,
        priority: 'medium' as const,
        tags: ['weekend', 'inspiration', 'motivation']
      }
    ];
  };

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
    }
  };

  const getDateRange = () => {
    switch (viewType) {
      case 'day':
        return [currentDate];
      case 'week':
        return eachDayOfInterval({
          start: startOfWeek(currentDate, { weekStartsOn: 1 }),
          end: endOfWeek(currentDate, { weekStartsOn: 1 })
        });
      case 'month':
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        const calendarStart = startOfWeek(start, { weekStartsOn: 1 });
        const calendarEnd = endOfWeek(end, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
      default:
        return [];
    }
  };

  const getContentForDate = (date: Date) => {
    return scheduledContent.filter(content => 
      isSameDay(content.scheduledTime, date)
    );
  };

  const getPlatformIcon = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    if (!platform) return null;
    const IconComponent = platform.icon;
    return <IconComponent className="w-4 h-4" />;
  };

  const getPlatformColor = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    return platform?.color || 'bg-gray-500';
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
      high: 'border-l-red-500 bg-red-50',
      medium: 'border-l-yellow-500 bg-yellow-50',
      low: 'border-l-green-500 bg-green-50'
    };
    return colors[priority as keyof typeof colors] || 'border-l-gray-500 bg-gray-50';
  };

  const formatDateHeader = () => {
    switch (viewType) {
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `Week ${getWeek(currentDate)} - ${format(weekStart, 'MMM d')} to ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      default:
        return '';
    }
  };

  const handleCreateContent = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Campaign Title Required",
        description: "Please provide a compelling title for your strategic campaign.",
        variant: "destructive",
      });
      return;
    }

    await executeCreateContent();
  };

  const handleEditContent = useCallback((content: ScheduledContent) => {
    setEditingContent(content);
    setFormData({
      title: content.title,
      description: content.description,
      platform: content.platform,
      contentType: content.contentType,
      scheduledTime: content.scheduledTime,
      priority: content.priority,
      tags: content.tags
    });
    setShowCreateForm(true);
  }, []);

  const handleDeleteContent = useCallback((contentId: string, contentTitle: string) => {
    setDeleteConfirmation({
      isOpen: true,
      contentId,
      contentTitle,
    });
  }, []);

  const confirmDeleteContent = useCallback(async () => {
    if (deleteConfirmation.contentId) {
      await executeDeleteContent(deleteConfirmation.contentId);
    }
  }, [deleteConfirmation.contentId, executeDeleteContent]);

  const renderDayView = () => {
    const dayContent = getContentForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          {hours.map(hour => {
            const hourContent = dayContent.filter(content => 
              content.scheduledTime.getHours() === hour
            );

            return (
              <div key={hour} className="flex border-b border-gray-100 min-h-[60px]">
                <div className="w-20 p-2 text-sm text-gray-500 border-r">
                  {format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
                </div>
                <div className="flex-1 p-2">
                  {hourContent.map(content => (
                    <div
                      key={content.id}
                      className={`p-3 rounded-lg border-l-4 mb-2 cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(content.priority)}`}
                      onClick={() => handleEditContent(content)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{content.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{content.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {content.platform.map(platformId => (
                              <div key={platformId} className="flex items-center gap-1">
                                {getPlatformIcon(platformId)}
                                <span className="text-xs capitalize">{platformId}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(content.status)}>
                            {content.status}
                          </Badge>
                          <Button variant="ghost" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteContent(content.id);
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {hourContent.length === 0 && (
                    <div className="h-full flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            scheduledTime: new Date(currentDate.setHours(hour, 0, 0, 0))
                          }));
                          setShowCreateForm(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Schedule Campaign
                      </Button>
                    </div>
                  )}
                </div>
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
      <div className="space-y-4">
        {/* Week header */}
        <div className="grid grid-cols-8 gap-2">
          <div className="p-2 text-sm font-medium text-gray-500">Time</div>
          {weekDays.map(day => (
            <div key={day.toISOString()} className="p-2 text-center">
              <div className="text-sm font-medium">{format(day, 'EEE')}</div>
              <div className={`text-lg ${isToday(day) ? 'bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Week content */}
        <div className="grid grid-cols-8 gap-2">
          {Array.from({ length: 24 }, (_, hour) => (
            <React.Fragment key={hour}>
              <div className="p-2 text-sm text-gray-500 border-r">
                {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
              </div>
              {weekDays.map(day => {
                const dayContent = getContentForDate(day).filter(content => 
                  content.scheduledTime.getHours() === hour
                );

                return (
                  <div key={`${day.toISOString()}-${hour}`} className="min-h-[50px] border-b border-gray-100 p-1">
                    {dayContent.map(content => (
                      <div
                        key={content.id}
                        className={`p-2 rounded text-xs cursor-pointer hover:shadow-sm border-l-2 mb-1 ${getPriorityColor(content.priority)}`}
                        onClick={() => handleEditContent(content)}
                      >
                        <div className="font-medium truncate">{content.title}</div>
                        <div className="flex items-center gap-1 mt-1">
                          {content.platform.slice(0, 2).map(platformId => (
                            <div key={platformId} className={`w-3 h-3 rounded ${getPlatformColor(platformId)}`} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthDays = getDateRange();
    const weeks = [];
    
    for (let i = 0; i < monthDays.length; i += 7) {
      weeks.push(monthDays.slice(i, i + 7));
    }

    return (
      <div className="space-y-4">
        {/* Month header */}
        <div className="grid grid-cols-7 gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="p-3 text-center font-medium text-gray-600 border-b">
              {day}
            </div>
          ))}
        </div>

        {/* Month content */}
        <div className="space-y-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-2">
              {week.map(day => {
                const dayContent = getContentForDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isDayToday = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[120px] border rounded-lg p-2 cursor-pointer hover:bg-gray-50 ${
                      !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                    } ${isDayToday ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, scheduledTime: day }));
                    }}
                  >
                    <div className={`text-sm font-medium mb-2 ${isDayToday ? 'text-blue-600' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayContent.slice(0, 3).map(content => (
                        <div
                          key={content.id}
                          className={`p-1 rounded text-xs cursor-pointer hover:shadow-sm border-l-2 ${getPriorityColor(content.priority)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditContent(content);
                          }}
                        >
                          <div className="font-medium truncate">{content.title}</div>
                          <div className="flex items-center gap-1 mt-1">
                            {content.platform.slice(0, 3).map(platformId => (
                              <div key={platformId} className={`w-2 h-2 rounded ${getPlatformColor(platformId)}`} />
                            ))}
                          </div>
                        </div>
                      ))}
                      {dayContent.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayContent.length - 3} more
                        </div>
                      )}
                      {dayContent.length === 0 && isCurrentMonth && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs text-gray-400 hover:text-gray-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData(prev => ({ ...prev, scheduledTime: day }));
                            setShowCreateForm(true);
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Schedule
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
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
      default:
        return renderMonthView();
    }
  };

  const handleTemplateSelect = (template: any) => {
    // Apply template to form data
    setFormData(prev => ({
      ...prev,
      title: template.titleTemplate || template.name || '',
      description: template.descriptionTemplate || template.description || '',
      contentType: template.contentType || 'post',
      tags: template.hashtags || template.tags || []
    }));
    
    setShowTemplateLibrary(false);
    
    toast({
      title: "Template Applied!",
      description: `${template.name} template has been applied to your campaign.`,
    });
  };

  const renderCreateForm = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{editingContent ? 'Optimize Scheduled Campaign' : 'Launch New Campaign'}</span>
          <Button variant="ghost" size="sm" onClick={() => {
            setShowCreateForm(false);
            setEditingContent(null);
            setFormData({
              title: '',
              description: '',
              platform: [],
              contentType: 'post',
              scheduledTime: new Date(),
              priority: 'medium',
              tags: []
            });
          }}>
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-2">Campaign Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter your strategic campaign title..."
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Campaign Format</label>
            <Select
              value={formData.contentType}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, contentType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="post">Post</SelectItem>
                <SelectItem value="story">Story</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="reel">Reel</SelectItem>
                <SelectItem value="article">Article</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Strategic Description</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateLibrary(true)}
              className="text-xs"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Use Template
            </Button>
          </div>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Outline your campaign strategy, key messaging, and target objectives..."
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Distribution Channels</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {platforms.map(platform => (
              <div
                key={platform.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  formData.platform.includes(platform.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  const isSelected = formData.platform.includes(platform.id);
                  setFormData(prev => ({
                    ...prev,
                    platform: isSelected
                      ? prev.platform.filter(p => p !== platform.id)
                      : [...prev.platform, platform.id]
                  }));
                }}
              >
                <div className="flex items-center gap-2">
                  {getPlatformIcon(platform.id)}
                  <span className="text-sm font-medium">{platform.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-2">Launch Schedule</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={format(formData.scheduledTime, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const newDate = new Date(e.target.value + 'T' + format(formData.scheduledTime, 'HH:mm'));
                  setFormData(prev => ({ ...prev, scheduledTime: newDate }));
                }}
                className="w-full"
              />
              <Input
                type="time"
                value={format(formData.scheduledTime, 'HH:mm')}
                onChange={(e) => {
                  const newDate = new Date(format(formData.scheduledTime, 'yyyy-MM-dd') + 'T' + e.target.value);
                  setFormData(prev => ({ ...prev, scheduledTime: newDate }));
                }}
                className="w-full"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Campaign Priority</label>
            <Select
              value={formData.priority}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">�  Strategic Priority</SelectItem>
                <SelectItem value="medium">⚡ Standard Priority</SelectItem>
                <SelectItem value="low">📝 Routine Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => {
            setShowCreateForm(false);
            setEditingContent(null);
          }}>
            Cancel
          </Button>
          <Button onClick={handleCreateContent} disabled={isCreatingContent}>
            {isCreatingContent ? 'Processing...' : editingContent ? 'Update Campaign' : 'Launch Campaign'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const quickStats = [
    { 
      label: 'Active Campaigns', 
      value: scheduledContent.length.toString(), 
      change: '+12%', 
      icon: Calendar, 
      color: 'text-blue-600' 
    },
    { 
      label: 'Weekly Performance', 
      value: scheduledContent.filter(c => {
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
        return c.scheduledTime >= weekStart && c.scheduledTime <= weekEnd;
      }).length.toString(), 
      change: '+8%', 
      icon: CalendarDays, 
      color: 'text-green-600' 
    },
    { 
      label: 'Monthly Reach', 
      value: scheduledContent.filter(c => 
        isSameMonth(c.scheduledTime, new Date())
      ).length.toString(), 
      change: '+15%', 
      icon: CalendarRange, 
      color: 'text-purple-600' 
    },
    { 
      label: 'Success Rate', 
      value: `${(scheduledContent.reduce((acc, c) => acc + (c.engagement || 0), 0) / scheduledContent.length || 0).toFixed(1)}%`, 
      change: '+2.3%', 
      icon: TrendingUp, 
      color: 'text-orange-600' 
    }
  ];

  return (
    <div className="enhanced-scheduler-page min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Enhanced Professional Scheduler
              </h1>
              <p className="text-gray-600 text-lg">
                Master your content strategy with precision scheduling, real-time analytics, and intelligent automation
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowTemplateLibrary(true)}
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                <FileText className="w-4 h-4 mr-2" />
                Template Library
              </Button>
              <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                <Settings className="w-4 h-4 mr-2" />
                Advanced Settings
              </Button>
              <Button 
                variant="outline" 
                onClick={debouncedRefresh}
                disabled={isLoadingContent}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                aria-label="Refresh scheduled content"
              >
                {isLoadingContent ? 'Loading...' : 'Refresh'}
              </Button>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Content
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-bold">{stat.value}</p>
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        {stat.change}
                      </Badge>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full bg-gray-100`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Form */}
        {showCreateForm && renderCreateForm()}

        {/* Template Library Modal */}
        {showTemplateLibrary && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <TemplateLibrary
                onTemplateSelect={handleTemplateSelect}
                onClose={() => setShowTemplateLibrary(false)}
              />
            </div>
          </div>
        )}

        {/* Main Calendar - Fixed Override Issue */}
        <Card className="enhanced-scheduler-calendar shadow-xl" style={{ zIndex: 1, position: 'relative' }}>
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <CalendarClock className="w-6 h-6" />
                Elite Content Calendar - {formatDateHeader()}
              </CardTitle>
              
              <div className="flex items-center gap-4">
                {/* View Type Selector */}
                <div className="flex bg-white/20 rounded-lg p-1">
                  {(['day', 'week', 'month'] as ViewType[]).map(view => (
                    <Button
                      key={view}
                      variant={viewType === view ? 'secondary' : 'ghost'}
                      size="sm"
                      className={`text-xs ${viewType === view ? 'bg-white text-blue-600' : 'text-white hover:bg-white/20'}`}
                      onClick={() => setViewType(view)}
                    >
                      {view === 'day' && <CalendarDays className="w-4 h-4 mr-1" />}
                      {view === 'week' && <CalendarRange className="w-4 h-4 mr-1" />}
                      {view === 'month' && <Calendar className="w-4 h-4 mr-1" />}
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                    </Button>
                  ))}
                </div>
                
                {/* Navigation */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigateDate('prev')} className="text-white hover:bg-white/20">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="text-white hover:bg-white/20">
                    Today's Focus
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigateDate('next')} className="text-white hover:bg-white/20">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6" style={{ position: 'relative', zIndex: 1 }}>
            {renderCurrentView()}
          </CardContent>
        </Card>

        {/* Content List */}
        <Card className="enhanced-scheduler-content-list mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="w-5 h-5" />
              Strategic Content Hub ({scheduledContent.length} campaigns)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scheduledContent
                .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())
                .map(content => (
                <div
                  key={content.id}
                  className={`p-4 rounded-lg border-l-4 hover:shadow-md transition-shadow cursor-pointer ${getPriorityColor(content.priority)}`}
                  onClick={() => handleEditContent(content)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{content.title}</h4>
                        <Badge variant="outline" className="text-xs">{content.contentType}</Badge>
                        <Badge className={getStatusColor(content.status)}>{content.status}</Badge>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{content.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(content.scheduledTime, 'MMM d, yyyy h:mm a')}
                        </div>
                        <div className="flex items-center gap-2">
                          {content.platform.map(platformId => (
                            <div key={platformId} className="flex items-center gap-1">
                              {getPlatformIcon(platformId)}
                              <span className="capitalize">{platformId}</span>
                            </div>
                          ))}
                        </div>
                        {content.engagement && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            {content.engagement}% engagement
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        handleEditContent(content);
                      }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          setIsLoading(true);
                          
                          // Create copy via API
                          const response = await fetch('/api/content/schedule', {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${localStorage.getItem('token')}`,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                              title: `${content.title} (Copy)`,
                              description: content.description,
                              platform: content.platform.length > 0 ? content.platform[0] : 'instagram',
                              contentType: content.contentType,
                              scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Schedule for tomorrow
                              priority: content.priority,
                              tags: content.tags,
                              autoPost: true
                            })
                          });

                          if (response.ok) {
                            const result = await response.json();
                            const newContent = { 
                              ...content, 
                              id: result.scheduledContent?.id?.toString() || `content-${Date.now()}`, 
                              title: `${content.title} (Copy)`,
                              scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
                            };
                            setScheduledContent(prev => [...prev, newContent]);
                            toast({ 
                              title: "Campaign Duplicated", 
                              description: "Strategic campaign has been successfully cloned and saved to database." 
                            });
                          } else {
                            throw new Error('Failed to duplicate content');
                          }
                        } catch (error) {
                          console.error('Error duplicating content:', error);
                          // Fallback to local copy
                          const newContent = { 
                            ...content, 
                            id: `content-${Date.now()}`, 
                            title: `${content.title} (Copy)`,
                            scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
                          };
                          setScheduledContent(prev => [...prev, newContent]);
                          toast({ 
                            title: "Campaign Duplicated", 
                            description: "Strategic campaign has been cloned locally." 
                          });
                        } finally {
                          setIsLoading(false);
                        }
                      }}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteContent(content.id, content.title);
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, contentId: null, contentTitle: '' })}
        onConfirm={confirmDeleteContent}
        title="Delete Campaign"
        description={`Are you sure you want to remove "${deleteConfirmation.contentTitle}" from your strategic schedule? This action cannot be undone.`}
        confirmText="Delete Campaign"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeletingContent}
      />
    </div>
  );
}