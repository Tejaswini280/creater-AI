import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  DragHandle,
  Eye,
  Send,
  Pause,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Move,
  RotateCcw,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, addWeeks, subWeeks } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  platform: string;
  scheduledAt: Date;
  duration: number; // minutes
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  priority: 'low' | 'medium' | 'high';
  aiGenerated?: boolean;
  tags?: string[];
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
  };
}

interface AnimatedCalendarProps {
  events: CalendarEvent[];
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventCreate?: (event: Partial<CalendarEvent>) => void;
  onEventDelete?: (eventId: string) => void;
  onEventMove?: (eventId: string, newDate: Date) => void;
  currentDate?: Date;
  view?: 'week' | 'month' | 'day';
  className?: string;
}

const EVENT_COLORS = {
  draft: 'bg-gray-100 border-gray-300 text-gray-700',
  scheduled: 'bg-blue-100 border-blue-300 text-blue-700',
  published: 'bg-green-100 border-green-300 text-green-700',
  failed: 'bg-red-100 border-red-300 text-red-700'
};

const PRIORITY_COLORS = {
  low: 'bg-green-50 border-green-200 text-green-700',
  medium: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  high: 'bg-red-50 border-red-200 text-red-700'
};

const PLATFORM_COLORS = {
  instagram: 'bg-pink-100 text-pink-700',
  facebook: 'bg-blue-100 text-blue-700',
  twitter: 'bg-sky-100 text-sky-700',
  linkedin: 'bg-blue-100 text-blue-800',
  youtube: 'bg-red-100 text-red-700',
  tiktok: 'bg-black text-white'
};

export default function AnimatedCalendar({
  events,
  onEventUpdate,
  onEventCreate,
  onEventDelete,
  onEventMove,
  currentDate = new Date(),
  view = 'week',
  className = ''
}: AnimatedCalendarProps) {
  const { toast } = useToast();

  // State management
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [currentViewDate, setCurrentViewDate] = useState(currentDate);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [calendarView, setCalendarView] = useState<'week' | 'month' | 'day'>(view);

  const calendarRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Calculate calendar dates based on view
  const getCalendarDates = useCallback(() => {
    switch (calendarView) {
      case 'day':
        return [currentViewDate];
      case 'week':
        return eachDayOfInterval({
          start: startOfWeek(currentViewDate, { weekStartsOn: 1 }),
          end: endOfWeek(currentViewDate, { weekStartsOn: 1 })
        });
      case 'month':
        const start = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), 1);
        const end = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 0);
        return eachDayOfInterval({ start, end });
      default:
        return [];
    }
  }, [currentViewDate, calendarView]);

  const calendarDates = getCalendarDates();

  // Get events for a specific date
  const getEventsForDate = useCallback((date: Date) => {
    return events.filter(event => isSameDay(event.scheduledAt, date))
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  }, [events]);

  // Navigate calendar
  const navigateCalendar = (direction: 'prev' | 'next') => {
    const amount = direction === 'next' ? 1 : -1;

    switch (calendarView) {
      case 'day':
        setCurrentViewDate(addDays(currentViewDate, amount));
        break;
      case 'week':
        setCurrentViewDate(addWeeks(currentViewDate, amount));
        break;
      case 'month':
        setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + amount, 1));
        break;
    }
  };

  // Handle drag start
  const handleDragStart = (event: CalendarEvent) => {
    setDraggedEvent(event);
    setIsDragging(true);
  };

  // Handle drag end
  const handleDragEnd = (event: any, info: PanInfo) => {
    if (draggedEvent && dragOverDate && !isSameDay(draggedEvent.scheduledAt, dragOverDate)) {
      // Move event to new date
      const newDateTime = new Date(dragOverDate);
      newDateTime.setHours(draggedEvent.scheduledAt.getHours());
      newDateTime.setMinutes(draggedEvent.scheduledAt.getMinutes());

      onEventMove?.(draggedEvent.id, newDateTime);

      toast({
        title: "Event Moved",
        description: `${draggedEvent.title} moved to ${format(newDateTime, 'MMM d, h:mm a')}`,
      });
    }

    setDraggedEvent(null);
    setDragOverDate(null);
    setIsDragging(false);
  };

  // Handle drop zone enter/leave
  const handleDropZoneEnter = (date: Date) => {
    if (isDragging) {
      setDragOverDate(date);
    }
  };

  const handleDropZoneLeave = () => {
    setDragOverDate(null);
  };

  // Create new event
  const handleCreateEvent = (date: Date, timeSlot?: string) => {
    const newEvent: Partial<CalendarEvent> = {
      title: 'New Event',
      description: '',
      platform: 'instagram',
      scheduledAt: timeSlot ? new Date(`${format(date, 'yyyy-MM-dd')}T${timeSlot}:00`) : date,
      duration: 30,
      status: 'draft',
      priority: 'medium'
    };

    onEventCreate?.(newEvent);
    setSelectedEvent(newEvent as CalendarEvent);
    setShowEventDialog(true);
  };

  // Delete event
  const handleDeleteEvent = (eventId: string) => {
    onEventDelete?.(eventId);
    setSelectedEvent(null);

    toast({
      title: "Event Deleted",
      description: "The event has been removed from your calendar.",
      variant: "destructive",
    });
  };

  // Update event
  const handleUpdateEvent = (updatedEvent: CalendarEvent) => {
    onEventUpdate?.(updatedEvent);
    setSelectedEvent(updatedEvent);

    toast({
      title: "Event Updated",
      description: `${updatedEvent.title} has been updated.`,
    });
  };

  // Get event status icon
  const getEventStatusIcon = (status: CalendarEvent['status']) => {
    switch (status) {
      case 'published': return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'scheduled': return <Clock className="h-3 w-3 text-blue-600" />;
      case 'failed': return <XCircle className="h-3 w-3 text-red-600" />;
      default: return <Edit className="h-3 w-3 text-gray-600" />;
    }
  };

  // Get platform icon/color
  const getPlatformColor = (platform: string) => {
    return PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS] || 'bg-gray-100 text-gray-700';
  };

  // Animation variants
  const eventVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 10, scale: 0.95 }
  };

  const calendarVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateCalendar('prev')}
                className="hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <h2 className="text-xl font-semibold">
                {calendarView === 'day' && format(currentViewDate, 'MMMM d, yyyy')}
                {calendarView === 'week' && `Week of ${format(currentViewDate, 'MMM d, yyyy')}`}
                {calendarView === 'month' && format(currentViewDate, 'MMMM yyyy')}
              </h2>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateCalendar('next')}
                className="hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              {/* View Toggle */}
              <div className="flex rounded-lg border border-gray-200">
                {(['day', 'week', 'month'] as const).map((viewType) => (
                  <Button
                    key={viewType}
                    variant={calendarView === viewType ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCalendarView(viewType)}
                    className="rounded-none first:rounded-l-lg last:rounded-r-lg"
                  >
                    {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Today Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentViewDate(new Date())}
                disabled={isSameDay(currentViewDate, new Date())}
              >
                Today
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <motion.div
        ref={calendarRef}
        variants={calendarVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="grid gap-4"
        style={{
          gridTemplateColumns: calendarView === 'month' ? 'repeat(auto-fill, minmax(200px, 1fr))' :
                              calendarView === 'week' ? 'repeat(7, 1fr)' : '1fr'
        }}
      >
        {calendarDates.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isCurrentDay = isToday(date);
          const isSelectedDay = isSameDay(date, selectedDate);
          const isDragOver = dragOverDate && isSameDay(date, dragOverDate);

          return (
            <motion.div
              key={date.toISOString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`min-h-[200px] border rounded-lg p-3 transition-all duration-200 ${
                isCurrentDay ? 'border-blue-500 bg-blue-50' :
                isSelectedDay ? 'border-gray-400 bg-gray-50' :
                isDragOver ? 'border-green-500 bg-green-50' :
                'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedDate(date)}
              onDragOver={(e) => {
                e.preventDefault();
                handleDropZoneEnter(date);
              }}
              onDragLeave={handleDropZoneLeave}
              onDrop={(e) => {
                e.preventDefault();
                handleDragEnd(e, { point: { x: 0, y: 0 }, delta: { x: 0, y: 0 }, offset: { x: 0, y: 0 }, velocity: { x: 0, y: 0 } });
              }}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-3">
                <div className={`flex items-center space-x-2 ${
                  isCurrentDay ? 'text-blue-600 font-semibold' : 'text-gray-900'
                }`}>
                  <span className="text-sm font-medium">
                    {calendarView === 'month' ? format(date, 'd') : format(date, 'EEE d')}
                  </span>
                  {isCurrentDay && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateEvent(date);
                  }}
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Events List */}
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {dayEvents.map((event) => {
                    const isDraggedEvent = draggedEvent?.id === event.id;

                    return (
                      <motion.div
                        key={event.id}
                        layout
                        layoutId={event.id}
                        variants={eventVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        drag
                        dragControls={dragControls}
                        dragElastic={0.1}
                        dragConstraints={calendarRef}
                        onDragStart={() => handleDragStart(event)}
                        onDragEnd={handleDragEnd}
                        whileDrag={{
                          scale: 1.05,
                          zIndex: 50,
                          boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
                        }}
                        className={`p-2 rounded border cursor-move transition-all duration-200 ${
                          EVENT_COLORS[event.status]
                        } ${isDraggedEvent ? 'opacity-50' : 'hover:shadow-md'}`}
                      >
                        <div className="flex items-start space-x-2">
                          {/* Drag Handle */}
                          <div className="mt-0.5">
                            <DragHandle className="h-3 w-3 text-gray-400" />
                          </div>

                          {/* Event Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-xs truncate">{event.title}</h4>
                              {getEventStatusIcon(event.status)}
                            </div>

                            <div className="flex items-center space-x-2 mb-1">
                              <Badge className={`text-xs ${getPlatformColor(event.platform)}`}>
                                {event.platform}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {format(event.scheduledAt, 'h:mm a')}
                              </span>
                            </div>

                            {event.aiGenerated && (
                              <Badge variant="outline" className="text-xs">
                                <Zap className="h-2 w-2 mr-1" />
                                AI Generated
                              </Badge>
                            )}
                          </div>

                          {/* Event Actions */}
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                                setShowEventDialog(true);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-red-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Event</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{event.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteEvent(event.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>

                        {/* Priority Indicator */}
                        <div className={`mt-2 h-1 rounded-full ${
                          event.priority === 'high' ? 'bg-red-400' :
                          event.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                        }`} />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Empty State */}
                {dayEvents.length === 0 && (
                  <div className="text-center py-4">
                    <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No events scheduled</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Event Details Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>{selectedEvent?.title || 'New Event'}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              {/* Event Status & Platform */}
              <div className="flex items-center space-x-2">
                <Badge className={EVENT_COLORS[selectedEvent.status]}>
                  {selectedEvent.status}
                </Badge>
                <Badge className={getPlatformColor(selectedEvent.platform)}>
                  {selectedEvent.platform}
                </Badge>
                {selectedEvent.aiGenerated && (
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Zap className="h-3 w-3" />
                    <span>AI Generated</span>
                  </Badge>
                )}
              </div>

              {/* Scheduled Time */}
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>
                  {format(selectedEvent.scheduledAt, 'MMMM d, yyyy')} at {format(selectedEvent.scheduledAt, 'h:mm a')}
                </span>
              </div>

              {/* Description */}
              {selectedEvent.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                </div>
              )}

              {/* Engagement Metrics */}
              {selectedEvent.engagement && (
                <div>
                  <h4 className="font-medium mb-2">Engagement</h4>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-blue-600">
                        {selectedEvent.engagement.likes.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Likes</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-600">
                        {selectedEvent.engagement.comments.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Comments</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-purple-600">
                        {selectedEvent.engagement.shares.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Shares</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-orange-600">
                        {selectedEvent.engagement.reach.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Reach</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedEvent.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEventDialog(false)}
                >
                  Close
                </Button>

                {selectedEvent.status === 'draft' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      handleUpdateEvent({ ...selectedEvent, status: 'scheduled' });
                      setShowEventDialog(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                )}

                {selectedEvent.status === 'scheduled' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      handleUpdateEvent({ ...selectedEvent, status: 'published' });
                      setShowEventDialog(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Publish Now
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragging && draggedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-10 z-40 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Drag Preview */}
      <AnimatePresence>
        {draggedEvent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-4 left-4 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 pointer-events-none"
          >
            <div className="flex items-center space-x-2">
              <Move className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">{draggedEvent.title}</span>
              <Badge className={getPlatformColor(draggedEvent.platform)}>
                {draggedEvent.platform}
              </Badge>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Calendar Legend Component
export function CalendarLegend() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Calendar Legend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
            <span>Draft</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
            <span>Scheduled</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
            <span>Published</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
            <span>Failed</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <h4 className="font-medium mb-2">Priority Levels</h4>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-1 bg-green-400 rounded"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-1 bg-yellow-400 rounded"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-1 bg-red-400 rounded"></div>
              <span>High</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Actions Component
export function CalendarQuickActions({
  onCreateEvent,
  onBulkSchedule,
  onBulkPublish,
  selectedEvents = []
}: {
  onCreateEvent?: () => void;
  onBulkSchedule?: (eventIds: string[]) => void;
  onBulkPublish?: (eventIds: string[]) => void;
  selectedEvents?: string[];
}) {
  const [selectedAction, setSelectedAction] = useState<'schedule' | 'publish' | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center space-x-2">
          <Zap className="h-5 w-5" />
          <span>Quick Actions</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Button
            onClick={onCreateEvent}
            className="w-full justify-start"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Event
          </Button>

          {selectedEvents.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                {selectedEvents.length} event{selectedEvents.length > 1 ? 's' : ''} selected
              </div>

              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onBulkSchedule?.(selectedEvents);
                    setSelectedAction('schedule');
                  }}
                  className="flex-1"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule All
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onBulkPublish?.(selectedEvents);
                    setSelectedAction('publish');
                  }}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Publish All
                </Button>
              </div>
            </div>
          )}

          {/* Bulk Action Progress */}
          {selectedAction && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-3"
            >
              <div className="flex items-center space-x-2 text-sm text-blue-700">
                <RotateCcw className="h-4 w-4 animate-spin" />
                <span>
                  {selectedAction === 'schedule' ? 'Scheduling' : 'Publishing'} {selectedEvents.length} events...
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
