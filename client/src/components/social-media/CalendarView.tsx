import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, ChevronLeft, ChevronRight, Plus, Filter, Search, Grid, List, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameMonth,
  isSameDay,
  parseISO,
  isToday,
  isPast,
  isFuture
} from 'date-fns';
import AIContentCard, { ContentCardBatchActions } from './AIContentCard';
import { socialPostApi } from '@/lib/socialMediaApi';

// Using SocialPost type from socialMediaApi
type ContentItem = {
  id: number;
  userId: string;
  projectId?: number;
  title: string;
  caption?: string;
  hashtags: string[];
  emojis: string[];
  contentType: 'post' | 'reel' | 'short' | 'story' | 'video';
  status: 'draft' | 'scheduled' | 'published' | 'paused' | 'failed';
  scheduledAt?: string;
  publishedAt?: string;
  thumbnailUrl?: string;
  mediaUrls: string[];
  aiGenerated: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
};

interface CalendarViewProps {
  contents: ContentItem[];
  onContentUpdate: (contentId: string, updates: Partial<ContentItem>) => void;
  onContentDelete: (contentId: string) => void;
  onContentCreate: (content: Omit<ContentItem, 'id'>) => void;
  onBatchOperation: (operation: string, contentIds: string[]) => void;
}

const PLATFORM_COLORS = {
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  facebook: 'bg-blue-600',
  tiktok: 'bg-black',
  youtube: 'bg-red-600',
  linkedin: 'bg-blue-700',
  twitter: 'bg-sky-500'
};

const CONTENT_TYPE_ICONS = {
  post: '📝',
  reel: '🎬',
  short: '⚡',
  story: '📱',
  video: '🎥'
};

export default function CalendarView({
  contents,
  onContentUpdate,
  onContentDelete,
  onContentCreate,
  onBatchOperation
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedContents, setSelectedContents] = useState<number[]>([]);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  // Drag and drop state
  const [draggedContent, setDraggedContent] = useState<ContentItem | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);

  const queryClient = useQueryClient();

  // Mutations for content operations
  const updateContentMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) =>
      socialPostApi.updateSocialPost(id, updates),
    onSuccess: (updatedContent) => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      onContentUpdate?.(updatedContent.id.toString(), updatedContent);
    },
    onError: (error) => {
      console.error('Error updating content:', error);
    },
  });

  // Drag and drop handlers
  const handleDragStart = (content: ContentItem) => {
    setDraggedContent(content);
  };

  const handleDragEnd = () => {
    setDraggedContent(null);
    setDragOverDate(null);
  };

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    setDragOverDate(date);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();

    if (!draggedContent) return;

    // Update the content's scheduled date
    const newScheduledAt = new Date(date);
    newScheduledAt.setHours(9, 0, 0, 0); // Default to 9 AM

    updateContentMutation.mutate({
      id: draggedContent.id,
      updates: {
        scheduledAt: newScheduledAt.toISOString(),
        status: 'scheduled'
      }
    });

    setDraggedContent(null);
    setDragOverDate(null);
  };

  // Get days for current month view
  const getMonthDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  // Get days for current week view
  const getWeekDays = () => {
    const weekStart = startOfWeek(currentDate);
    const days = [];

    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }

    return days;
  };

  // Filter contents based on current filters
  const filteredContents = contents.filter(content => {
    const matchesPlatform = filterPlatform === 'all' || content.platform === filterPlatform;
    const matchesStatus = filterStatus === 'all' || content.status === filterStatus;
    const matchesSearch = !searchQuery ||
      content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.hashtags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesPlatform && matchesStatus && matchesSearch;
  });

  // Get contents for specific date
  const getContentsForDate = (date: Date) => {
    return filteredContents.filter(content =>
      isSameDay(parseISO(content.scheduledAt), date)
    );
  };

  // Handle date navigation
  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
      const newDate = new Date(currentDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
      setCurrentDate(newDate);
    }
  };

  // Handle content selection
  const handleContentSelect = (contentId: string, selected: boolean) => {
    if (selected) {
      setSelectedContents(prev => [...prev, contentId]);
    } else {
      setSelectedContents(prev => prev.filter(id => id !== contentId));
    }
  };

  // Handle batch operations
  const handleBatchOperation = (operation: string) => {
    if (selectedContents.length === 0) return;
    onBatchOperation(operation, selectedContents);
    setSelectedContents([]);
    setIsSelecting(false);
  };

  // Calendar day component
  const CalendarDay = ({ date, isCurrentMonth }: { date: Date; isCurrentMonth: boolean }) => {
    const dayContents = getContentsForDate(date);
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const isCurrentDay = isToday(date);
    const isDragOver = dragOverDate && isSameDay(date, dragOverDate);

    return (
      <motion.div
        className={`
          min-h-[120px] border border-gray-200 p-2 cursor-pointer transition-all
          ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
          ${isSelected ? 'ring-2 ring-blue-500' : ''}
          ${isCurrentDay ? 'bg-blue-50' : ''}
          ${isDragOver ? 'ring-2 ring-green-500 bg-green-50' : ''}
          hover:bg-gray-50
        `}
        onClick={() => setSelectedDate(date)}
        onDragOver={(e) => handleDragOver(e, date)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, date)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${
            isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
          } ${isCurrentDay ? 'text-blue-600 font-bold' : ''}`}>
            {format(date, 'd')}
          </span>
          {dayContents.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {dayContents.length}
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          {dayContents.slice(0, 3).map((content) => (
            <motion.div
              key={content.id}
              className={`
                text-xs p-1 rounded flex items-center space-x-1 cursor-move
                ${PLATFORM_COLORS[content.platform as keyof typeof PLATFORM_COLORS] || 'bg-gray-500'}
                text-white
              `}
              draggable
              onDragStart={() => handleDragStart(content)}
              onDragEnd={handleDragEnd}
              whileHover={{ scale: 1.05 }}
              whileDrag={{ scale: 1.1, zIndex: 1000 }}
            >
              <span>{CONTENT_TYPE_ICONS[content.contentType]}</span>
              <span className="truncate flex-1">{content.title}</span>
              {content.aiGenerated && (
                <span className="text-xs opacity-75">🤖</span>
              )}
            </motion.div>
          ))}

          {dayContents.length > 3 && (
            <div className="text-xs text-gray-500 text-center">
              +{dayContents.length - 3} more
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Week view component
  const WeekView = () => {
    const weekDays = getWeekDays();

    return (
      <div className="grid grid-cols-7 gap-4">
        {/* Day headers */}
        {weekDays.map((day, index) => (
          <div key={index} className="text-center p-4 border-b border-gray-200">
            <div className="font-medium text-gray-900">
              {format(day, 'EEE')}
            </div>
            <div className={`text-2xl font-bold ${
              isToday(day) ? 'text-blue-600' : 'text-gray-600'
            }`}>
              {format(day, 'd')}
            </div>
            {isToday(day) && (
              <Badge className="mt-1 text-xs">Today</Badge>
            )}
          </div>
        ))}

        {/* Day content */}
        {weekDays.map((day, index) => {
          const dayContents = getContentsForDate(day);

          return (
            <div key={index} className="min-h-[400px] border border-gray-200 rounded-lg p-4">
              <div className="space-y-3">
                {dayContents.map((content) => (
                  <motion.div
                    key={content.id}
                    className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span>{CONTENT_TYPE_ICONS[content.contentType]}</span>
                      <Badge className={`text-xs ${PLATFORM_COLORS[content.platform as keyof typeof PLATFORM_COLORS] || 'bg-gray-500'} text-white`}>
                        {content.platform}
                      </Badge>
                      {content.aiGenerated && (
                        <Badge variant="outline" className="text-xs">🤖 AI</Badge>
                      )}
                    </div>
                    <h4 className="font-medium text-sm line-clamp-2 mb-1">{content.title}</h4>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">{content.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{format(parseISO(content.scheduledAt), 'h:mm a')}</span>
                      <Badge variant="outline" className={`text-xs ${
                        content.status === 'scheduled' ? 'border-blue-500 text-blue-600' :
                        content.status === 'published' ? 'border-green-500 text-green-600' :
                        content.status === 'draft' ? 'border-gray-500 text-gray-600' :
                        'border-yellow-500 text-yellow-600'
                      }`}>
                        {content.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}

                {dayContents.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-8">
                    No content scheduled
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Month view component
  const MonthView = () => {
    const monthDays = getMonthDays();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {weekDays.map((day) => (
          <div key={day} className="p-4 text-center font-medium text-gray-600 border-b border-gray-200">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {monthDays.map((day, index) => (
          <CalendarDay
            key={index}
            date={day}
            isCurrentMonth={isSameMonth(day, currentDate)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Content Calendar</h2>
          <p className="text-gray-600">Plan and schedule your social media content</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            onClick={() => setViewMode('month')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Month
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            onClick={() => setViewMode('week')}
          >
            <Grid className="h-4 w-4 mr-2" />
            Week
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigateDate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-xl font-semibold">
            {viewMode === 'month'
              ? format(currentDate, 'MMMM yyyy')
              : `Week of ${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`
            }
          </h3>
          <Button variant="outline" onClick={() => navigateDate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsSelecting(!isSelecting)}
          >
            {isSelecting ? 'Cancel Selection' : 'Select Multiple'}
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Calendar View */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {viewMode === 'month' ? <MonthView /> : <WeekView />}
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Content for {format(selectedDate, 'MMMM d, yyyy')}
            </h3>
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Content
            </Button>
          </div>

          <div className="space-y-4">
            {getContentsForDate(selectedDate).map((content) => (
              <AIContentCard
                key={content.id}
                content={content}
                onStatusChange={(id, status) => onContentUpdate(id, { status })}
                onRegenerate={async (id) => {
                  // Implement regeneration logic
                  console.log('Regenerating content:', id);
                }}
                onEdit={(id, updates) => onContentUpdate(id, updates)}
                onDelete={onContentDelete}
                onPublishNow={async (id) => {
                  // Implement publish now logic
                  console.log('Publishing now:', id);
                }}
              />
            ))}

            {getContentsForDate(selectedDate).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No content scheduled for this date</p>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Content
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Batch Actions */}
      {isSelecting && selectedContents.length > 0 && (
        <ContentCardBatchActions
          selectedIds={selectedContents}
          onBatchStatusChange={(status) => handleBatchOperation(`status_${status}`)}
          onBatchDelete={() => handleBatchOperation('delete')}
          onBatchRegenerate={() => handleBatchOperation('regenerate')}
        />
      )}

      {/* Create Content Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule New Content</DialogTitle>
          </DialogHeader>
          <CreateContentForm
            selectedDate={selectedDate}
            onContentCreate={(content) => {
              onContentCreate(content);
              setShowCreateModal(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Create Content Form Component
function CreateContentForm({
  selectedDate,
  onContentCreate
}: {
  selectedDate: Date | null;
  onContentCreate: (content: Omit<ContentItem, 'id'>) => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    platform: 'instagram',
    contentType: 'post' as ContentItem['contentType'],
    scheduledAt: selectedDate ? format(selectedDate, "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    hashtags: [] as string[],
    projectId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContentCreate({
      ...formData,
      status: 'draft',
      aiGenerated: false,
      metadata: {}
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Title</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter content title..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter content description..."
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Platform</label>
          <Select
            value={formData.platform}
            onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Content Type</label>
          <Select
            value={formData.contentType}
            onValueChange={(value) => setFormData(prev => ({ ...prev, contentType: value as ContentItem['contentType'] }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="post">Post</SelectItem>
              <SelectItem value="reel">Reel</SelectItem>
              <SelectItem value="short">Short</SelectItem>
              <SelectItem value="story">Story</SelectItem>
              <SelectItem value="video">Video</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Schedule Date & Time</label>
        <Input
          type="datetime-local"
          value={formData.scheduledAt}
          onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Hashtags (comma-separated)</label>
        <Input
          value={formData.hashtags.join(', ')}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            hashtags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
          }))}
          placeholder="fitness, motivation, workout..."
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit">
          Schedule Content
        </Button>
      </div>
    </form>
  );
}
