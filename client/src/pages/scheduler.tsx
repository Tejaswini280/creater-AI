import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Calendar as CalendarIcon, Clock, Plus, Youtube, Instagram, Facebook, Edit, Trash2, CheckSquare, Square, MoreHorizontal, Download, Upload, Zap, RotateCcw, X, Eye, Brain, FileText } from "lucide-react";
import { format, startOfWeek, endOfWeek, isWithinInterval, isSameDay } from "date-fns";

export default function Scheduler() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'thisWeek'>('all');
  const [editingContent, setEditingContent] = useState<any>(null);
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());
  const [scheduleForm, setScheduleForm] = useState({
    title: "",
    description: "",
    platform: "youtube",
    contentType: "video",
    scheduledAt: "",
    recurrence: "none",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    seriesEndDate: "",
    duration: "1",
    tone: "professional",
    targetAudience: "",
    timeDistribution: "mixed"
  });

  // Bulk operations state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);


  // Development helper: Set test token if no token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Set test token for development
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      }));
      console.log('🔧 Development: Test token set for scheduler');
    }
  }, []);

  // Check if content is series content
  const isSeriesContent = (content: any) => {
    return content?.metadata?.durationGeneration === true;
  };

  const { data: scheduledContentResponse, isLoading } = useQuery({
    queryKey: ['/api/content/scheduled'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/content/scheduled');
      return await response.json();
    },
    retry: false,
  });

  // Extract the scheduled content array from the API response
  const scheduledContent = scheduledContentResponse?.scheduledContent || [];

  const scheduleContentMutation = useMutation({
    mutationFn: async (contentData: any) => {
      const response = await apiRequest('POST', '/api/content/schedule', {
        title: contentData.title,
        description: contentData.description,
        platform: contentData.platform,
        contentType: contentData.contentType,
        scheduledAt: contentData.scheduledAt
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Content Scheduled!",
        description: "Your content has been scheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/content/scheduled'] });
      setShowScheduleForm(false);
      setEditingContent(null);
      setScheduleForm({
        title: "",
        description: "",
        platform: "youtube",
        contentType: "video",
        scheduledAt: "",
        recurrence: "none",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        seriesEndDate: "",
        duration: "1",
        tone: "professional",
        targetAudience: "",
        timeDistribution: "mixed"
      });
      setSelectedDate(undefined);
      setSelectedTime("12:00");
    },
    onError: (error: any) => {
      console.error('Schedule content error:', error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to schedule content. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update scheduled content mutation
  const updateScheduledContentMutation = useMutation({
    mutationFn: async (contentData: any) => {
      const response = await apiRequest('PUT', `/api/content/schedule/${contentData.id}`, {
        title: contentData.title,
        description: contentData.description,
        platform: contentData.platform,
        contentType: contentData.contentType,
        scheduledAt: contentData.scheduledAt
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Content Updated!",
        description: "Your scheduled content has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/content/scheduled'] });
      setShowScheduleForm(false);
      setEditingContent(null);
      setScheduleForm({
        title: "",
        description: "",
        platform: "youtube",
        contentType: "video",
        scheduledAt: "",
        recurrence: "none",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        seriesEndDate: "",
        duration: "1",
        tone: "professional",
        targetAudience: "",
        timeDistribution: "mixed"
      });
      setSelectedDate(undefined);
      setSelectedTime("12:00");
    },
    onError: (error: any) => {
      console.error('Update scheduled content error:', error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update scheduled content. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete scheduled content mutation
  const deleteScheduledContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const response = await apiRequest('DELETE', `/api/content/schedule/${contentId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Content Deleted!",
        description: "Your scheduled content has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/content/scheduled'] });
    },
    onError: (error: any) => {
      console.error('Delete scheduled content error:', error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete scheduled content. Please try again.",
        variant: "destructive",
      });
    },
  });


  // Bulk operations
  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds: string[] = filteredContent.map((item: any) => String(item.id));
      const newSet = new Set<string>(allIds);
      setSelectedItems(newSet);
      setShowBulkActions(true);
    } else {
      setSelectedItems(new Set());
      setShowBulkActions(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedItems.size} scheduled content item(s)? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setBulkActionLoading(true);
    try {
      const deletePromises = Array.from(selectedItems).map(async (itemId) => {
        const response = await apiRequest('DELETE', `/api/content/schedule/${itemId}`);
        return response.json();
      });

      await Promise.all(deletePromises);

      toast({
        title: "Bulk Delete Completed",
        description: `Successfully deleted ${selectedItems.size} content items.`,
      });

      setSelectedItems(new Set());
      setShowBulkActions(false);
      queryClient.invalidateQueries({ queryKey: ['/api/content/scheduled'] });
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Bulk Delete Failed",
        description: "Some items may not have been deleted. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkReschedule = async () => {
    if (selectedItems.size === 0 || !selectedDate || !selectedTime) return;

    setBulkActionLoading(true);
    try {
      const newScheduledTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')} ${selectedTime}`).toISOString();

      const reschedulePromises = Array.from(selectedItems).map(async (itemId) => {
        const response = await apiRequest('PUT', `/api/content/schedule/${itemId}`, {
          scheduledAt: newScheduledTime
        });
        return response.json();
      });

      await Promise.all(reschedulePromises);

      toast({
        title: "Bulk Reschedule Completed",
        description: `Successfully rescheduled ${selectedItems.size} content items.`,
      });

      setSelectedItems(new Set());
      setShowBulkActions(false);
      queryClient.invalidateQueries({ queryKey: ['/api/content/scheduled'] });
    } catch (error: any) {
      console.error('Bulk reschedule error:', error);
      toast({
        title: "Bulk Reschedule Failed",
        description: "Some items may not have been rescheduled. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkPublish = async () => {
    if (selectedItems.size === 0) return;

    setBulkActionLoading(true);
    try {
      const publishPromises = Array.from(selectedItems).map(async (itemId) => {
        const response = await apiRequest('PUT', `/api/content/${itemId}/publish`);
        return response.json();
      });

      await Promise.all(publishPromises);

      toast({
        title: "Bulk Publish Completed",
        description: `Successfully published ${selectedItems.size} content items.`,
      });

      setSelectedItems(new Set());
      setShowBulkActions(false);
      queryClient.invalidateQueries({ queryKey: ['/api/content/scheduled'] });
    } catch (error: any) {
      console.error('Bulk publish error:', error);
      toast({
        title: "Bulk Publish Failed",
        description: "Some items may not have been published. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Handle edit content
  const handleEditContent = (content: any) => {
    setEditingContent(content);
    setScheduleForm({
      title: content.title || "",
      description: content.description || "",
      platform: content.platform || "youtube",
      contentType: content.contentType || "video",
      scheduledAt: content.scheduledAt || "",
      recurrence: content.recurrence || "none",
      timezone: content.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      seriesEndDate: content.seriesEndDate || "",
      duration: content.duration || "1",
      tone: content.tone || "professional",
      targetAudience: content.targetAudience || "",
      timeDistribution: content.timeDistribution || "mixed"
    });
    
    // Parse the scheduled date and time
    if (content.scheduledAt) {
      const scheduledDate = new Date(content.scheduledAt);
      setSelectedDate(scheduledDate);
      setSelectedTime(format(scheduledDate, 'HH:mm'));
    }
    
    setShowScheduleForm(true);
  };

  // Handle delete content
  const handleDeleteContent = (contentId: string) => {
    if (window.confirm('Are you sure you want to delete this scheduled content? This action cannot be undone.')) {
      deleteScheduledContentMutation.mutate(contentId);
    }
  };

  const handleScheduleContent = () => {
    if (!scheduleForm.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your content.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Please select a date and time for scheduling.",
        variant: "destructive",
      });
      return;
    }

    // Show warning for non-series content scheduling
    toast({
      title: "Series Content Recommended",
      description: "For best results, we recommend scheduling content through the New Project page after generating series content.",
      variant: "default",
    });

    // Create scheduled date time with proper timezone handling
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const timeStr = selectedTime;
    
    // Parse time to get hours and minutes
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // Create date using the selected date and time
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);
    
    // Add buffer to ensure it's in the future (add 2 minutes to be safe)
    const now = new Date();
    const minFutureTime = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes from now
    
    if (scheduledDateTime <= minFutureTime) {
      // Automatically adjust to 2 minutes from now if the selected time is too close
      const adjustedTime = new Date(now.getTime() + 2 * 60 * 1000);
      scheduledDateTime.setTime(adjustedTime.getTime());
      
      toast({
        title: "Time Adjusted",
        description: `Scheduled time was adjusted to ${format(scheduledDateTime, 'h:mm a')} to ensure it's in the future.`,
        variant: "default",
      });
    }

    // Validate series end date if recurrence is set
    if (scheduleForm.recurrence !== 'none' && scheduleForm.seriesEndDate) {
      const endDate = new Date(scheduleForm.seriesEndDate);
      if (endDate <= scheduledDateTime) {
        toast({
          title: "Error",
          description: "Series end date must be after the start date.",
          variant: "destructive",
        });
        return;
      }
    }

    const schedulingData = {
      ...scheduleForm,
      scheduledAt: scheduledDateTime.toISOString(),
      recurrence: scheduleForm.recurrence || 'none',
      timezone: scheduleForm.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      seriesEndDate: scheduleForm.seriesEndDate || null
    };
    
    if (editingContent) {
      // Update existing scheduled content
      updateScheduledContentMutation.mutate({
        ...schedulingData,
        id: editingContent.id
      });
    } else {
      // Create new scheduled content
      scheduleContentMutation.mutate(schedulingData);
    }
  };


  // Filter content based on active filter
  const filteredContent = scheduledContent?.filter((item: any) => {
    if (activeFilter === 'all') return true;
    
    if (activeFilter === 'thisWeek') {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
      const scheduledDate = new Date(item.scheduledAt);
      
      return isWithinInterval(scheduledDate, { start: weekStart, end: weekEnd });
    }
    
    return true;
  }) || [];

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return <Youtube className="w-5 h-5 text-red-600" />;
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-600" />;
      case 'facebook':
        return <Facebook className="w-5 h-5 text-blue-600" />;
      default:
        return <CalendarIcon className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatScheduledTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM dd, yyyy 'at' h:mm a");
  };

  const timeSlots = [
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <CalendarIcon className="w-8 h-8 mr-3 text-primary" />
                Content Scheduler
              </h1>
              <p className="text-gray-600">Schedule and manage your content across all platforms</p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/enhanced-scheduler'}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Zap className="w-4 h-4 mr-2" />
                Enhanced Scheduler
              </Button>
              <Button 
                onClick={() => setShowScheduleForm(!showScheduleForm)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule Content
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Scheduler Notice */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">🚀 Enhanced Scheduler Available!</h3>
              <p className="text-purple-800 mb-4">
                Experience our new advanced scheduling system with AI-powered optimization, bulk operations, 
                recurring schedules, template library, and comprehensive weekly/monthly planning tools.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className="flex items-center space-x-2 text-sm text-purple-700">
                  <Calendar className="w-4 h-4" />
                  <span>Advanced Calendar</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-purple-700">
                  <Upload className="w-4 h-4" />
                  <span>Bulk Scheduler</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-purple-700">
                  <RotateCcw className="w-4 h-4" />
                  <span>Recurring Rules</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-purple-700">
                  <FileText className="w-4 h-4" />
                  <span>Template Library</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-purple-700">
                  <Brain className="w-4 h-4" />
                  <span>AI Optimization</span>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  onClick={() => window.location.href = '/enhanced-scheduler'}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Try Enhanced Scheduler
                </Button>
                <Button
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  onClick={() => window.open('/enhanced-scheduler', '_blank')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Features
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Series Scheduling Notice */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-sm font-bold">i</span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-purple-900 mb-1">Series Content Scheduling</h3>
              <p className="text-sm text-purple-800">
                For optimal content management, we recommend scheduling content through the New Project page after generating series content.
                This ensures consistent theming and proper distribution across your selected timeframe.
              </p>
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  onClick={() => window.location.href = '/new-project-enhanced'}
                >
                  Go to New Project
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {showBulkActions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkDelete}
                    disabled={bulkActionLoading}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkReschedule}
                    disabled={bulkActionLoading || !selectedDate || !selectedTime}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    Reschedule Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkPublish}
                    disabled={bulkActionLoading}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Publish Selected
                  </Button>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedItems(new Set());
                  setShowBulkActions(false);
                }}
                disabled={bulkActionLoading}
              >
                Clear Selection
              </Button>
            </div>
            {selectedDate && selectedTime && (
              <div className="mt-2 text-sm text-blue-700">
                Selected items will be rescheduled to: {format(selectedDate, "PPP")} at {selectedTime}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Schedule Form */}
          {showScheduleForm && (
            <div className="lg:col-span-1">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {editingContent ? (
                      <>
                        <Edit className="w-5 h-5 mr-2" />
                        Edit Scheduled Content
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 mr-2" />
                        Schedule New Content
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Title</label>
                    <Input
                      placeholder="Enter content title..."
                      value={scheduleForm.title}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Description</label>
                    <Textarea
                      placeholder="Describe your content..."
                      value={scheduleForm.description}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Platform</label>
                      <Select
                        value={scheduleForm.platform}
                        onValueChange={(value) => setScheduleForm({ ...scheduleForm, platform: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Type</label>
                      <Select
                        value={scheduleForm.contentType}
                        onValueChange={(value) => setScheduleForm({ ...scheduleForm, contentType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="short">Short/Reel</SelectItem>
                          <SelectItem value="image">Image Post</SelectItem>
                          <SelectItem value="text">Text Post</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Schedule Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Schedule Time</label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Advanced Scheduling Options */}
                  <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Recurrence</label>
                        <Select
                          value={scheduleForm.recurrence}
                          onValueChange={(value) => setScheduleForm({ ...scheduleForm, recurrence: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Repeat</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="weekdays">Weekdays Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Timezone</label>
                        <Select
                          value={scheduleForm.timezone}
                          onValueChange={(value) => setScheduleForm({ ...scheduleForm, timezone: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">Eastern Time</SelectItem>
                            <SelectItem value="America/Chicago">Central Time</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                            <SelectItem value="Europe/London">London</SelectItem>
                            <SelectItem value="Europe/Paris">Paris</SelectItem>
                            <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                            <SelectItem value="Australia/Sydney">Sydney</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {scheduleForm.recurrence !== 'none' && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Series End Date</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {scheduleForm.seriesEndDate ? format(new Date(scheduleForm.seriesEndDate), "PPP") : <span>End date (optional)</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={scheduleForm.seriesEndDate ? new Date(scheduleForm.seriesEndDate) : undefined}
                              onSelect={(date) => setScheduleForm({ ...scheduleForm, seriesEndDate: date ? date.toISOString() : "" })}
                              disabled={(date) => date < (selectedDate || new Date())}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}

                    <div className="flex space-x-2">
                    <Button
                      onClick={handleScheduleContent}
                      className="flex-1"
                      disabled={scheduleContentMutation.isPending || updateScheduledContentMutation.isPending}
                    >
                      {(scheduleContentMutation.isPending || updateScheduledContentMutation.isPending) ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editingContent ? 'Updating...' : 'Scheduling...'}
                        </div>
                      ) : (
                        <>
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {editingContent ? 'Update' : 'Schedule'}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowScheduleForm(false);
                        setEditingContent(null);
                        setScheduleForm({
                          title: "",
                          description: "",
                          platform: "youtube",
                          contentType: "video",
                            scheduledAt: "",
                            recurrence: "none",
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                            seriesEndDate: "",
                            duration: "1",
                            tone: "professional",
                            targetAudience: "",
                            timeDistribution: "mixed"
                        });
                        setSelectedDate(undefined);
                        setSelectedTime("12:00");
                      }}
                    >
                      Cancel
                    </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Scheduled Content List */}
          <div className={showScheduleForm ? "lg:col-span-2" : "lg:col-span-3"}>
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                  <CardTitle>Scheduled Content</CardTitle>
                    {filteredContent.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="select-all"
                          checked={selectedItems.size === filteredContent.length && filteredContent.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="select-all" className="text-sm text-gray-600 cursor-pointer">
                          Select All
                        </label>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant={activeFilter === 'thisWeek' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setActiveFilter('thisWeek')}
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      This Week
                    </Button>
                    <Button 
                      variant={activeFilter === 'all' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setActiveFilter('all')}
                    >
                      All Scheduled
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                        </div>
                        <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : !filteredContent || filteredContent.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {activeFilter === 'thisWeek' ? 'No content scheduled this week' : 'No scheduled content'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {activeFilter === 'thisWeek' 
                        ? 'Schedule content for this week to see it here' 
                        : 'Schedule your first piece of content to see it here'
                      }
                    </p>
                    <Button onClick={() => setShowScheduleForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Schedule Content
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredContent.map((item: any) => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getPlatformIcon(item.platform)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{item.title}</h4>
                          {isSeriesContent(item) && (
                            <Badge variant="outline" className="bg-purple-100 text-purple-700 text-xs">
                              Series
                            </Badge>
                          )}
                            {item.recurrence && item.recurrence !== 'none' && (
                              <Badge className="bg-purple-100 text-purple-800 text-xs flex items-center">
                                <RotateCcw className="w-3 h-3 mr-1" />
                                {item.recurrence}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 capitalize">
                            {item.platform} • {item.contentType}
                            {item.timezone && item.timezone !== Intl.DateTimeFormat().resolvedOptions().timeZone && (
                              <span className="ml-2 text-xs bg-gray-100 px-1 py-0.5 rounded">
                                {item.timezone.split('/')[1]}
                              </span>
                            )}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {formatScheduledTime(item.scheduledAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                            {item.status}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleEditContent(item)}
                            disabled={updateScheduledContentMutation.isPending || deleteScheduledContentMutation.isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteContent(item.id)}
                            disabled={updateScheduledContentMutation.isPending || deleteScheduledContentMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Calendar View */}
        <Card className="bg-white shadow-sm mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Content Calendar</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Series Content</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Regular Content</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Calendar
                  mode="single"
                  selected={calendarDate}
                  onSelect={setCalendarDate}
                  numberOfMonths={1}
                  modifiers={{
                    hasContent: (day: Date) =>
                      (scheduledContent || []).some((item: any) => isSameDay(new Date(item.scheduledAt), day)),
                    hasDurationContent: (day: Date) =>
                      (scheduledContent || []).some((item: any) => 
                        isSameDay(new Date(item.scheduledAt), day) && 
                        item.metadata?.durationGeneration
                      ),
                    hasRegularContent: (day: Date) =>
                      (scheduledContent || []).some((item: any) => 
                        isSameDay(new Date(item.scheduledAt), day) && 
                        !item.metadata?.durationGeneration
                      ),
                  }}
                  modifiersClassNames={{
                    hasContent:
                      "relative after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary",
                    hasDurationContent:
                      "relative after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-green-500",
                    hasRegularContent:
                      "relative after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-blue-500",
                  }}
                />
              </div>
              <div className="lg:col-span-2">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">
                      {calendarDate ? format(calendarDate, "PPP") : "Select a date"}
                    </h3>
                    <div className="text-sm text-gray-500">
                      {(scheduledContent || []).filter((item: any) =>
                        calendarDate ? isSameDay(new Date(item.scheduledAt), calendarDate) : false
                      ).length}{" "}
                      scheduled
                    </div>
                  </div>
                  <div className="space-y-3">
                    {(() => {
                      const itemsForDay = (scheduledContent || []).filter((item: any) =>
                        calendarDate ? isSameDay(new Date(item.scheduledAt), calendarDate) : false
                      );
                      if (itemsForDay.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            No content scheduled for this day
                          </div>
                        );
                      }
                      return itemsForDay.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(item.id)}
                              onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                              {getPlatformIcon(item.platform)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                              <div className="font-medium text-gray-900">{item.title}</div>
                                {item.metadata?.durationGeneration && (
                                  <Badge className="bg-green-100 text-green-800 text-xs flex items-center">
                                    <Zap className="w-3 h-3 mr-1" />
                                    Day {item.metadata.dayNumber}
                                  </Badge>
                                )}
                                {item.recurrence && item.recurrence !== 'none' && (
                                  <Badge className="bg-purple-100 text-purple-800 text-xs flex items-center">
                                    <RotateCcw className="w-3 h-3 mr-1" />
                                    {item.recurrence}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 capitalize">
                                {item.platform} • {item.contentType}
                                {item.metadata?.tone && (
                                  <span className="ml-2 text-xs bg-gray-100 px-1 py-0.5 rounded">
                                    {item.metadata.tone}
                                  </span>
                                )}
                                {item.timezone && item.timezone !== Intl.DateTimeFormat().resolvedOptions().timeZone && (
                                  <span className="ml-2 text-xs bg-gray-100 px-1 py-0.5 rounded">
                                    {item.timezone.split('/')[1]}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-600">{formatScheduledTime(item.scheduledAt)}</span>
                            <Badge className={`text-xs ${getStatusColor(item.status)}`}>{item.status}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditContent(item)}
                              disabled={updateScheduledContentMutation.isPending || deleteScheduledContentMutation.isPending}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteContent(item.id)}
                              disabled={updateScheduledContentMutation.isPending || deleteScheduledContentMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}