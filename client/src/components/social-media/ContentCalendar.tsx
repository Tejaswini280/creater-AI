import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Play, Pause, Edit, Trash2, Plus, RefreshCw, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';
import { Project } from '@/lib/socialMediaApi';

interface ContentCard {
  id: string;
  title: string;
  description: string;
  platform: string;
  contentType: 'post' | 'reel' | 'short' | 'story' | 'video';
  status: 'draft' | 'scheduled' | 'published' | 'paused' | 'failed';
  scheduledAt: Date;
  publishedAt?: Date;
  thumbnailUrl?: string;
  aiGenerated: boolean;
  hashtags: string[];
  metadata: Record<string, any>;
}

interface ContentCalendarProps {
  project: Project;
  onContentUpdate: (content: ContentCard) => void;
  onContentDelete: (contentId: string) => void;
  onContentCreate: (content: Omit<ContentCard, 'id'>) => void;
  onProjectUpdate?: (project: Project) => void;
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

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  published: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800'
};

export default function ContentCalendar({ 
  project, 
  onContentUpdate, 
  onContentDelete, 
  onContentCreate,
  onProjectUpdate 
}: ContentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [contentCards, setContentCards] = useState<ContentCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentCard | null>(null);
  const { toast } = useToast();

  // Generate AI content calendar based on project settings
  const generateAICalendar = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
        projectId: project.id.toString(),
        platforms: project.platform ? [project.platform] : ['instagram'],
        category: project.type || 'general',
        duration: typeof project.estimatedDuration === 'string' 
          ? parseInt(project.estimatedDuration.replace('days', '')) || 30
          : project.estimatedDuration || 30,
        contentFrequency: 'weekly',
        startDate: selectedDate.toISOString()
        })
      });

      if (!response.ok) throw new Error('Failed to generate calendar');

      const { contentCards: generatedCards } = await response.json();
      setContentCards(generatedCards);
      
      toast({
        title: "AI Calendar Generated",
        description: `Generated ${generatedCards.length} content pieces for your project`,
      });
    } catch (error) {
      console.error('Error generating AI calendar:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI calendar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Get content for selected date
  const getContentForDate = (date: Date) => {
    return contentCards.filter(card => 
      isSameDay(parseISO(card.scheduledAt.toString()), date)
    );
  };

  // Get content for current week
  const getContentForWeek = () => {
    const start = startOfWeek(selectedDate);
    const end = endOfWeek(selectedDate);
    return contentCards.filter(card => {
      const cardDate = parseISO(card.scheduledAt.toString());
      return cardDate >= start && cardDate <= end;
    });
  };

  // Handle content status change
  const handleStatusChange = async (contentId: string, newStatus: ContentCard['status']) => {
    const content = contentCards.find(c => c.id === contentId);
    if (!content) return;

    const updatedContent = { ...content, status: newStatus };
    
    try {
      const response = await fetch(`/api/content/${contentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update content');

      setContentCards(prev => prev.map(c => c.id === contentId ? updatedContent : c));
      onContentUpdate(updatedContent);
      
      toast({
        title: "Status Updated",
        description: `Content status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating content status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update content status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle AI enhancement
  const handleAIEnhancement = async (contentId: string, field: string) => {
    const content = contentCards.find(c => c.id === contentId);
    if (!content) return;

    try {
      const response = await fetch('/api/ai/enhance-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          contentId,
          field,
          currentValue: content[field as keyof ContentCard],
          context: {
            title: content.title,
            description: content.description,
            platform: content.platform,
            contentType: content.contentType,
            hashtags: content.hashtags
          }
        })
      });

      if (!response.ok) throw new Error('Failed to enhance content');

      const { enhancedValue } = await response.json();
      const updatedContent = { ...content, [field]: enhancedValue };
      
      setContentCards(prev => prev.map(c => c.id === contentId ? updatedContent : c));
      onContentUpdate(updatedContent);
      
      toast({
        title: "AI Enhanced",
        description: `${field} has been enhanced with AI`,
      });
    } catch (error) {
      console.error('Error enhancing content:', error);
      toast({
        title: "Enhancement Failed",
        description: "Failed to enhance content. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Content Card Component
  const ContentCard = ({ content }: { content: ContentCard }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{CONTENT_TYPE_ICONS[content.contentType]}</span>
          <div>
            <h4 className="font-semibold text-sm">{content.title}</h4>
            <div className="flex items-center space-x-2">
              <Badge className={`text-xs ${PLATFORM_COLORS[content.platform as keyof typeof PLATFORM_COLORS] || 'bg-gray-500'}`}>
                {content.platform}
              </Badge>
              <Badge className={`text-xs ${STATUS_COLORS[content.status]}`}>
                {content.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditingContent(content)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onContentDelete(content.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{content.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-500">
            {format(parseISO(content.scheduledAt.toString()), 'MMM d, h:mm a')}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {content.status === 'draft' && (
            <Button
              size="sm"
              onClick={() => handleStatusChange(content.id, 'scheduled')}
            >
              <Play className="h-4 w-4 mr-1" />
              Schedule
            </Button>
          )}
          {content.status === 'scheduled' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange(content.id, 'paused')}
            >
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          )}
          {content.status === 'paused' && (
            <Button
              size="sm"
              onClick={() => handleStatusChange(content.id, 'scheduled')}
            >
              <Play className="h-4 w-4 mr-1" />
              Resume
            </Button>
          )}
        </div>
      </div>

      {content.hashtags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {content.hashtags.slice(0, 3).map((tag, index) => (
            <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
              #{tag}
            </span>
          ))}
          {content.hashtags.length > 3 && (
            <span className="text-xs text-gray-500">+{content.hashtags.length - 3} more</span>
          )}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{project.name}</h2>
          <p className="text-gray-600">{project.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={generateAICalendar}
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate AI Calendar'}
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center space-x-2">
        <Button
          variant={viewMode === 'calendar' ? 'default' : 'outline'}
          onClick={() => setViewMode('calendar')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Calendar View
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          onClick={() => setViewMode('list')}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          List View
        </Button>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </div>
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">
              Content for {format(selectedDate, 'MMMM d, yyyy')}
            </h3>
            <div className="space-y-4">
              <AnimatePresence>
                {getContentForDate(selectedDate).map((content) => (
                  <ContentCard key={content.id} content={content} />
                ))}
              </AnimatePresence>
              {getContentForDate(selectedDate).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No content scheduled for this date
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">All Content</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {contentCards.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Create Content Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Content</DialogTitle>
            <DialogDescription>
              Add new content to your project calendar
            </DialogDescription>
          </DialogHeader>
          <CreateContentForm
            project={project}
            onContentCreate={(content) => {
              onContentCreate(content);
              setShowCreateModal(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Content Modal */}
      {editingContent && (
        <Dialog open={!!editingContent} onOpenChange={() => setEditingContent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Content</DialogTitle>
              <DialogDescription>
                Update your content details and scheduling
              </DialogDescription>
            </DialogHeader>
            <EditContentForm
              content={editingContent}
              onContentUpdate={(updatedContent) => {
                setContentCards(prev => prev.map(c => c.id === updatedContent.id ? updatedContent : c));
                onContentUpdate(updatedContent);
                setEditingContent(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Create Content Form Component
function CreateContentForm({ 
  project, 
  onContentCreate 
}: { 
  project: Project; 
  onContentCreate: (content: Omit<ContentCard, 'id'>) => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    platform: project.platform || 'instagram',
    contentType: 'post' as ContentCard['contentType'],
    scheduledAt: new Date(),
    hashtags: [] as string[]
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
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="platform">Platform</Label>
          <Select
            value={formData.platform}
            onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(project.platform ? [project.platform] : []).map((platform) => (
                <SelectItem key={platform} value={platform}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="contentType">Content Type</Label>
          <Select
            value={formData.contentType}
            onValueChange={(value) => setFormData(prev => ({ ...prev, contentType: value as ContentCard['contentType'] }))}
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

      <div className="flex justify-end space-x-2">
        <Button type="submit">Create Content</Button>
      </div>
    </form>
  );
}

// Edit Content Form Component
function EditContentForm({ 
  content, 
  onContentUpdate 
}: { 
  content: ContentCard; 
  onContentUpdate: (content: ContentCard) => void;
}) {
  const [formData, setFormData] = useState({
    title: content.title,
    description: content.description,
    platform: content.platform,
    contentType: content.contentType,
    scheduledAt: parseISO(content.scheduledAt.toString()),
    hashtags: content.hashtags
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContentUpdate({
      ...content,
      title: formData.title,
      description: formData.description,
      platform: formData.platform,
      contentType: formData.contentType,
      scheduledAt: formData.scheduledAt,
      hashtags: formData.hashtags
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <div className="flex items-center space-x-2">
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {/* Handle AI enhancement */}}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <div className="flex items-center space-x-2">
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {/* Handle AI enhancement */}}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit">Update Content</Button>
      </div>
    </form>
  );
}
