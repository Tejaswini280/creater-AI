import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Calendar as CalendarIcon,
  Clock,
  Eye,
  Edit3,
  Trash2,
  Copy,
  Share2,
  Filter,
  Grid3X3,
  CalendarDays,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  ChevronLeft,
  ChevronRight,
  Plus,
  Video
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from "date-fns";

interface ScheduledPost {
  id: string;
  title: string;
  caption: string;
  contentType: 'post' | 'reel' | 'short' | 'story' | 'video';
  platform: 'instagram' | 'facebook' | 'linkedin' | 'youtube' | 'tiktok';
  scheduledAt: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  media?: string[];
}

interface ContentPlannerProps {
  posts: ScheduledPost[];
  onEditPost: (post: ScheduledPost) => void;
  onDeletePost: (postId: string) => void;
  onDuplicatePost: (post: ScheduledPost) => void;
  onReschedulePost: (postId: string, newDate: Date) => void;
}

interface Platform {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface ViewMode {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PLATFORMS: Platform[] = [
  { value: 'all', label: 'All Platforms', icon: Grid3X3, color: 'text-gray-600' },
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { value: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
  { value: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-600' },
  { value: 'tiktok', label: 'TikTok', icon: Video, color: 'text-black' },
];

const VIEW_MODES: ViewMode[] = [
  { value: 'week', label: 'Week View', icon: CalendarDays },
  { value: 'month', label: 'Month View', icon: CalendarDays },
];

export default function ContentPlanner({
  posts,
  onEditPost,
  onDeletePost,
  onDuplicatePost,
  onReschedulePost
}: ContentPlannerProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [draggedPost, setDraggedPost] = useState<ScheduledPost | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const filteredPosts = posts.filter(post => 
    selectedPlatform === 'all' || post.platform === selectedPlatform
  );

  const getPostsForDate = (date: Date) => {
    return filteredPosts.filter(post => isSameDay(post.scheduledAt, date));
  };

  const handleDragStart = (e: React.DragEvent, post: ScheduledPost) => {
    setDraggedPost(post);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    if (draggedPost) {
      onReschedulePost(draggedPost.id, targetDate);
      setDraggedPost(null);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const getPlatformIcon = (platform: string) => {
    const platformData = PLATFORMS.find(p => p.value === platform);
    if (platformData?.icon) {
      const IconComponent = platformData.icon;
      return <IconComponent className={`h-4 w-4 ${platformData.color}`} />;
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Content Planner</h2>
          <div className="flex items-center gap-2">
            {VIEW_MODES.map((mode) => {
              const IconComponent = mode.icon;
              return (
                <Button
                  key={mode.value}
                  variant={viewMode === mode.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode(mode.value as 'week' | 'month')}
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {mode.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by platform" />
            </SelectTrigger>
            <SelectContent>
              {PLATFORMS.map((platform) => {
                const IconComponent = platform.icon;
                return (
                  <SelectItem key={platform.value} value={platform.value}>
                    <div className="flex items-center gap-2">
                      <IconComponent className={`h-4 w-4 ${platform.color}`} />
                      {platform.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Button onClick={() => {
            // Create a new post with default values
            const newPost: ScheduledPost = {
              id: Date.now().toString(),
              title: 'New Post',
              caption: '',
              contentType: 'post',
              platform: 'instagram',
              scheduledAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
              status: 'draft',
              media: []
            };
            onEditPost(newPost);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigateWeek('prev')}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous Week
        </Button>

        <div className="text-center">
          <h3 className="text-lg font-semibold">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h3>
        </div>

        <Button variant="outline" onClick={() => navigateWeek('next')}>
          Next Week
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Week View Calendar */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-8 gap-4">
          {/* Time column */}
          <div className="space-y-2">
            <div className="h-12"></div> {/* Header spacer */}
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="h-16 text-xs text-gray-500 text-right pr-2 pt-1">
                {i === 0 ? '12 AM' : i === 12 ? '12 PM' : i > 12 ? `${i - 12} PM` : `${i} AM`}
              </div>
            ))}
          </div>

          {/* Days columns */}
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="space-y-2">
              {/* Day header */}
              <div className="h-12 text-center">
                <div className="text-sm font-medium text-gray-900">
                  {format(day, 'EEE')}
                </div>
                <div className={`text-lg font-bold ${
                  isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-700'
                }`}>
                  {format(day, 'd')}
                </div>
              </div>

              {/* Time slots */}
              {Array.from({ length: 24 }, (_, hour) => (
                <div
                  key={hour}
                  className="h-16 border border-gray-200 bg-gray-50 relative"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, new Date(day.setHours(hour, 0, 0, 0)))}
                >
                  {/* Posts for this time slot */}
                  {getPostsForDate(day).map((post) => {
                    const postHour = post.scheduledAt.getHours();
                    if (postHour === hour) {
                      return (
                        <div
                          key={post.id}
                          className="absolute left-0 right-0 mx-1 p-2 bg-white border rounded shadow-sm cursor-move"
                          draggable
                          onDragStart={(e) => handleDragStart(e, post)}
                          style={{
                            top: `${(post.scheduledAt.getMinutes() / 60) * 100}%`,
                            height: '60px',
                            zIndex: 10
                          }}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            {getPlatformIcon(post.platform)}
                            <Badge variant="outline" className="text-xs">
                              {post.contentType}
                            </Badge>
                          </div>
                          <div className="text-xs font-medium truncate">
                            {post.title}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => onEditPost(post)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => onDuplicatePost(post)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => onDeletePost(post.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Month View Calendar */}
      {viewMode === 'month' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Month View - {format(currentDate, 'MMMM yyyy')}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
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
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Month Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center font-medium text-gray-600 text-sm">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {(() => {
                const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                const startDate = new Date(monthStart);
                startDate.setDate(startDate.getDate() - monthStart.getDay());

                const days = [];
                let currentDay = new Date(startDate);

                for (let i = 0; i < 42; i++) {
                  const dayPosts = getPostsForDate(currentDay);
                  const isCurrentMonth = currentDay.getMonth() === currentDate.getMonth();
                  const isToday = isSameDay(currentDay, new Date());

                  days.push(
                    <div
                      key={currentDay.toISOString()}
                      className={`min-h-[100px] p-1 border border-gray-200 ${
                        isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                      } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div className="text-sm font-medium mb-1 text-center">
                        {currentDay.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayPosts.slice(0, 3).map(post => (
                          <div
                            key={post.id}
                            className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate cursor-pointer hover:bg-blue-200"
                            onClick={() => onEditPost(post)}
                            title={`${post.title} - ${format(post.scheduledAt, 'h:mm a')}`}
                          >
                            {getPlatformIcon(post.platform)}
                            {post.title}
                          </div>
                        ))}
                        {dayPosts.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayPosts.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );

                  currentDay = new Date(currentDay);
                  currentDay.setDate(currentDay.getDate() + 1);
                }

                return days;
              })()}
            </div>

            {/* Month Statistics */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredPosts.filter(post =>
                    post.scheduledAt.getMonth() === currentDate.getMonth() &&
                    post.scheduledAt.getFullYear() === currentDate.getFullYear()
                  ).length}
                </div>
                <div className="text-sm text-gray-600">Posts This Month</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {filteredPosts.filter(post =>
                    post.status === 'scheduled' &&
                    post.scheduledAt.getMonth() === currentDate.getMonth() &&
                    post.scheduledAt.getFullYear() === currentDate.getFullYear()
                  ).length}
                </div>
                <div className="text-sm text-gray-600">Scheduled</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredPosts.filter(post =>
                    post.status === 'draft' &&
                    post.scheduledAt.getMonth() === currentDate.getMonth() &&
                    post.scheduledAt.getFullYear() === currentDate.getFullYear()
                  ).length}
                </div>
                <div className="text-sm text-gray-600">Drafts</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(filteredPosts
                    .filter(post =>
                      post.scheduledAt.getMonth() === currentDate.getMonth() &&
                      post.scheduledAt.getFullYear() === currentDate.getFullYear()
                    )
                    .map(post => post.platform)
                  ).size}
                </div>
                <div className="text-sm text-gray-600">Platforms</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredPosts
              .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
              .map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {getPlatformIcon(post.platform)}
                    <div>
                      <div className="font-medium">{post.title}</div>
                      <div className="text-sm text-gray-600">
                        {format(post.scheduledAt, 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(post.status)}>
                      {post.status}
                    </Badge>
                    <Badge variant="outline">
                      {post.contentType}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditPost(post)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDuplicatePost(post)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeletePost(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

            {filteredPosts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No scheduled posts found</p>
                <p className="text-sm">Create your first post to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
