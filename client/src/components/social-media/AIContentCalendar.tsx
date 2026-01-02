import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  CheckCircle2,
  AlertCircle,
  RefreshCw, 
  Filter,
  Search,
  Grid,
  List,
  ChevronLeft, 
  ChevronRight,
  Plus,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface ContentItem {
  id: number;
  title: string;
  description: string;
  content: string;
  platform: string;
  contentType: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledDate: string;
  hashtags: string[];
  metadata: any;
  engagementPrediction?: {
    average: number;
    likes: number;
    comments: number;
    shares: number;
  };
}

interface CalendarEntry {
  id: number;
  contentId: number;
  scheduledDate: string;
  scheduledTime: string;
  platform: string;
  contentType: string;
  status: 'scheduled' | 'published' | 'failed';
  optimalPostingTime: boolean;
  engagementScore: number;
  aiOptimized: boolean;
  metadata: any;
}

interface AIContentCalendarProps {
  projectId: number;
  content: ContentItem[];
  calendar: CalendarEntry[];
  onContentUpdate: (contentId: number, updates: Partial<ContentItem>) => void;
  onCalendarUpdate: (calendarId: number, updates: Partial<CalendarEntry>) => void;
  onContentDelete: (contentId: number) => void;
  onRegenerateContent: () => void;
}

const PLATFORM_COLORS = {
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  facebook: 'bg-gradient-to-r from-blue-500 to-blue-600',
  linkedin: 'bg-gradient-to-r from-blue-600 to-blue-700',
  tiktok: 'bg-gradient-to-r from-black to-gray-800',
  youtube: 'bg-gradient-to-r from-red-500 to-red-600',
  twitter: 'bg-gradient-to-r from-blue-400 to-blue-500'
};

const PLATFORM_ICONS = {
  instagram: '📸',
  facebook: '📘',
  linkedin: '💼',
  tiktok: '🎵',
  youtube: '📺',
  twitter: '🐦'
};

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  published: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800'
};

export default function AIContentCalendar({ 
  projectId, 
  content,
  calendar,
  onContentUpdate, 
  onCalendarUpdate,
  onContentDelete,
  onRegenerateContent
}: AIContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedItem, setDraggedItem] = useState<CalendarEntry | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const filteredCalendar = calendar.filter(entry => {
    const matchesPlatform = filterPlatform === 'all' || entry.platform === filterPlatform;
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      content.find(c => c.id === entry.contentId)?.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesPlatform && matchesStatus && matchesSearch;
  });

  const getCalendarEntriesForDate = useCallback((date: Date) => {
    return filteredCalendar.filter(entry => 
      isSameDay(parseISO(entry.scheduledDate), date)
    );
  }, [filteredCalendar]);

  const handleDragStart = (e: React.DragEvent, entry: CalendarEntry) => {
    setDraggedItem(entry);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    const newScheduledDate = format(targetDate, 'yyyy-MM-dd');
    
    try {
      await onCalendarUpdate(draggedItem.id, {
        scheduledDate: newScheduledDate
      });
        
        toast({
        title: "Success",
        description: "Content rescheduled successfully",
        });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reschedule content",
        variant: "destructive"
      });
    }
    
    setDraggedItem(null);
  };

  const handleTimeChange = async (entryId: number, newTime: string) => {
    try {
      await onCalendarUpdate(entryId, {
        scheduledTime: newTime
      });
      
        toast({
        title: "Success",
        description: "Scheduled time updated",
        });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update scheduled time",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = async (entryId: number, newStatus: string) => {
    try {
      await onCalendarUpdate(entryId, {
        status: newStatus as any
      });
      
        toast({
        title: "Success",
        description: "Status updated successfully",
        });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  const renderCalendarHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <h2 className="text-2xl font-bold text-gray-900">Content Calendar</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            <Grid className="h-4 w-4 mr-1" />
            Week
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            <List className="h-4 w-4 mr-1" />
            Month
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
          onClick={() => setShowFilters(!showFilters)}
          >
          <Filter className="h-4 w-4 mr-1" />
          Filters
          </Button>
          
          <Button
            variant="outline"
            size="sm"
          onClick={onRegenerateContent}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Regenerate
        </Button>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center min-w-[120px]">
            <div className="font-medium">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderFilters = () => (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 p-4 bg-gray-50 rounded-lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Content</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search content..."
                  className="pl-10"
                />
        </div>
      </div>

            <div>
              <Label>Platform</Label>
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {Object.entries(PLATFORM_ICONS).map(([platform, icon]) => (
                <SelectItem key={platform} value={platform}>
                      <span className="flex items-center">
                        <span className="mr-2">{icon}</span>
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
            </div>

            <div>
              <Label>Status</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
            </SelectTrigger>
            <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderWeekView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day, index) => (
          <div key={index} className="space-y-2">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600">
                {format(day, 'EEE')}
              </div>
              <div className={`text-lg font-bold ${
                isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {format(day, 'd')}
              </div>
            </div>
            
            <div
              className="min-h-[200px] p-2 border border-gray-200 rounded-lg bg-gray-50"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
            >
              <div className="space-y-2">
                {getCalendarEntriesForDate(day).map((entry) => {
                  const contentItem = content.find(c => c.id === entry.contentId);
                  if (!contentItem) return null;

                  return (
                    <motion.div
                      key={entry.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, entry)}
                      className="p-2 bg-white rounded border shadow-sm cursor-move hover:shadow-md transition-shadow"
                      whileHover={{ scale: 1.02 }}
                      whileDrag={{ scale: 1.05, rotate: 2 }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            {PLATFORM_ICONS[entry.platform as keyof typeof PLATFORM_ICONS]}
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${STATUS_COLORS[entry.status]}`}
                          >
                            {entry.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(entry.id, 'published')}
                          >
                            <CheckCircle2 className="h-3 w-3" />
              </Button>
          <Button
                            variant="ghost"
            size="sm"
                            onClick={() => onContentDelete(entry.contentId)}
          >
                            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {contentItem.title}
                      </div>
                      
                      <div className="text-xs text-gray-600 mb-2">
                        {entry.scheduledTime}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          {entry.contentType}
                        </Badge>
                        
                        {entry.aiOptimized && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-purple-50 text-purple-700"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            AI
                          </Badge>
                      )}
                    </div>
                    </motion.div>
          );
        })}
      </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMonthView = () => (
    <div className="space-y-4">
      {filteredCalendar.map((entry) => {
        const contentItem = content.find(c => c.id === entry.contentId);
        if (!contentItem) return null;

        return (
          <Card key={entry.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">
                      {PLATFORM_ICONS[entry.platform as keyof typeof PLATFORM_ICONS]}
                    </span>
                    <div>
                      <h3 className="font-medium text-gray-900">{contentItem.title}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{format(parseISO(entry.scheduledDate), 'MMM d, yyyy')}</span>
                        <span>•</span>
                        <span>{entry.scheduledTime}</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {contentItem.description}
                  </p>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${STATUS_COLORS[entry.status]}`}
                    >
                      {entry.status}
                      </Badge>
                    <Badge variant="outline" className="text-xs">
                      {entry.contentType}
                      </Badge>
                    {entry.aiOptimized && (
                      <Badge 
                        variant="outline"
                        className="text-xs bg-purple-50 text-purple-700"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        AI Optimized
                      </Badge>
                      )}
                    </div>
                    
                  {contentItem.hashtags && contentItem.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {contentItem.hashtags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                          </Badge>
                        ))}
                      {contentItem.hashtags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                          +{contentItem.hashtags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                <div className="flex items-center space-x-2">
                  <Select
                    value={entry.scheduledTime}
                    onValueChange={(value) => handleTimeChange(entry.id, value)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return (
                          <SelectItem key={hour} value={`${hour}:00`}>
                            {hour}:00
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  
                    <Button
                      variant="ghost"
                      size="sm"
                    onClick={() => handleStatusChange(entry.id, 'published')}
                    >
                    <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  
                    <Button
                      variant="ghost"
                      size="sm"
                    onClick={() => onContentDelete(entry.contentId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
          </div>
        </CardContent>
      </Card>
        );
      })}
              </div>
  );

  return (
    <div className="space-y-6">
      {renderCalendarHeader()}
      {renderFilters()}
      
      <div className="bg-white rounded-lg border">
        {viewMode === 'week' ? renderWeekView() : renderMonthView()}
              </div>
    </div>
  );
}
