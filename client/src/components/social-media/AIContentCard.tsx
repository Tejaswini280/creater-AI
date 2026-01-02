import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Play,
  Pause,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Calendar,
  TrendingUp,
  Heart,
  MessageCircle,
  Share2,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isPast } from 'date-fns';
import { socialPostApi, aiContentApi } from '@/lib/socialMediaApi';

interface AIContentCardProps {
  content: {
    id: number;
    userId: string;
    projectId?: number;
    title: string;
    caption?: string;
    hashtags?: string[];
    emojis?: string[];
    contentType: 'post' | 'reel' | 'short' | 'story' | 'video';
    status: 'draft' | 'scheduled' | 'published' | 'paused' | 'failed';
    scheduledAt?: string;
    publishedAt?: string;
    thumbnailUrl?: string;
    mediaUrls?: string[];
    aiGenerated: boolean;
    platform?: string;
    engagement?: {
      likes: number;
      comments: number;
      shares: number;
      views: number;
    };
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
  };
  onEdit?: (contentId: number, updates: Partial<any>) => void;
  onDelete?: (contentId: number) => void;
  onPublishNow?: (contentId: number) => void;
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

const STATUS_CONFIG = {
  draft: {
    color: 'bg-gray-100 text-gray-800',
    icon: Edit,
    label: 'Draft'
  },
  scheduled: {
    color: 'bg-blue-100 text-blue-800',
    icon: Clock,
    label: 'Scheduled'
  },
  published: {
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    label: 'Published'
  },
  paused: {
    color: 'bg-yellow-100 text-yellow-800',
    icon: Pause,
    label: 'Paused'
  },
  failed: {
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
    label: 'Failed'
  }
};

export default function AIContentCard({ 
  content, 
  onEdit, 
  onDelete, 
  onPublishNow 
}: AIContentCardProps) {
  // Validate content exists and has required fields
  if (!content || !content.id) {
    console.warn('AIContentCard: Invalid content provided', content);
    return null;
  }
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: content.title,
    caption: content.caption || '',
    hashtags: (content.hashtags || []).join(', ')
  });
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  const queryClient = useQueryClient();

  // Mutations for content operations
  const updateContentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      try {
        // First try to update as a social post
        return await socialPostApi.updateSocialPost(id, updates);
      } catch (error: any) {
        // If social post update fails (404), try updating as regular content
        if (error.status === 404) {
          const response = await fetch(`/api/content/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(updates),
          });
          
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error('Content not found in database. It may have been deleted or never existed.');
            }
            throw new Error(`Server error: ${response.status}`);
          }
          
          const data = await response.json();
          return data.content || data.data;
        }
        throw error;
      }
    },
    onSuccess: (updatedContent) => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      queryClient.invalidateQueries({ queryKey: ['all-content'] });
      onEdit?.(updatedContent.id, updatedContent);
      toast({
        title: "Content Updated",
        description: "Content has been updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Error updating content:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        // First try to delete as a social post
        return await socialPostApi.deleteSocialPost(id);
      } catch (error: any) {
        // If social post delete fails (404), try deleting as regular content
        if (error.status === 404) {
          const response = await fetch(`/api/content/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          
          if (!response.ok) {
            throw new Error('Content not found');
          }
          
          return await response.json();
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      onDelete?.(content.id);
      toast({
        title: "Content Deleted",
        description: "Content has been deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting content:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const publishContentMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        // First try to publish as a social post
        return await socialPostApi.publishSocialPost(id);
      } catch (error: any) {
        // If social post publish fails (404), try updating as regular content
        if (error.status === 404) {
          const response = await fetch(`/api/content/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ 
              content_status: 'published',
              published_at: new Date().toISOString()
            }),
          });
          
          if (!response.ok) {
            throw new Error('Content not found');
          }
          
          const data = await response.json();
          return { id: data.data.id, ...data.data };
        }
        throw error;
      }
    },
    onSuccess: (updatedContent) => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      onPublishNow?.(updatedContent.id);
      toast({
        title: "Content Published",
        description: "Content has been published successfully",
      });
    },
    onError: (error) => {
      console.error('Error publishing content:', error);
      toast({
        title: "Publishing Failed",
        description: "Failed to publish content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const regenerateContentMutation = useMutation({
    mutationFn: (params: any) => aiContentApi.generateAiContentSuggestion(params),
    onSuccess: (suggestion) => {
      // Update the content with the new suggestion
      const updates = {
        caption: suggestion.content,
        aiGenerated: true,
        metadata: {
          ...content.metadata,
          lastRegenerated: new Date().toISOString(),
          regeneratedBy: 'ai'
        }
      };
      updateContentMutation.mutate({ id: content.id, updates });
      toast({
        title: "Content Regenerated",
        description: "AI has generated new content for this post",
      });
    },
    onError: (error) => {
      console.error('Error regenerating content:', error);
      toast({
        title: "Regeneration Failed",
        description: "Failed to regenerate content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const StatusIcon = STATUS_CONFIG[content.status].icon;
  const scheduledDate = content.scheduledAt ? parseISO(content.scheduledAt) : new Date();
  const isOverdue = content.status === 'scheduled' && content.scheduledAt && isPast(scheduledDate);

  // Handle AI regeneration
  const handleRegenerate = () => {
    regenerateContentMutation.mutate({
      suggestionType: 'caption',
      platform: 'instagram', // Default platform, could be made configurable
      context: {
        title: content.title,
        contentType: content.contentType,
        currentCaption: content.caption
      },
      projectId: content.projectId
    });
  };

  // Handle status change
  const handleStatusChange = (newStatus: string) => {
    updateContentMutation.mutate({ id: content.id, updates: { status: newStatus } });
  };

  // Handle edit save
  const handleEditSave = () => {
    const updates = {
      title: editForm.title,
      caption: editForm.caption,
      hashtags: editForm.hashtags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    };
    updateContentMutation.mutate({ id: content.id, updates });
  };

  // Handle publish now
  const handlePublishNow = () => {
    publishContentMutation.mutate(content.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{CONTENT_TYPE_ICONS[content.contentType]}</span>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-lg line-clamp-1">{content.title}</h4>
              {content.aiGenerated && (
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              {content.platform && (
                <Badge className={`${PLATFORM_COLORS[content.platform as keyof typeof PLATFORM_COLORS] || 'bg-gray-500'} text-white text-xs`}>
                  {content.platform}
                </Badge>
              )}
              <Badge className={`${STATUS_CONFIG[content.status].color} text-xs`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {STATUS_CONFIG[content.status].label}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Content
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowDetails(!showDetails)}>
              <Eye className="h-4 w-4 mr-2" />
              {showDetails ? 'Hide Details' : 'View Details'}
            </DropdownMenuItem>
            {content.status === 'draft' && (
              <DropdownMenuItem onClick={handlePublishNow}>
                <Play className="h-4 w-4 mr-2" />
                Publish Now
              </DropdownMenuItem>
            )}
            {content.status === 'scheduled' && (
              <DropdownMenuItem onClick={() => handleStatusChange('paused')}>
                <Pause className="h-4 w-4 mr-2" />
                Pause Schedule
              </DropdownMenuItem>
            )}
            {content.status === 'paused' && (
              <DropdownMenuItem onClick={() => handleStatusChange('scheduled')}>
                <Play className="h-4 w-4 mr-2" />
                Resume Schedule
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={handleRegenerate}
              disabled={regenerateContentMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${regenerateContentMutation.isPending ? 'animate-spin' : ''}`} />
              Regenerate with AI
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => deleteContentMutation.mutate(content.id)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content Preview */}
      <div className="mb-4">
        <p className="text-sm text-gray-700 line-clamp-3">{content.caption || 'No caption available'}</p>

        {(content.hashtags || []).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {(content.hashtags || []).slice(0, 3).map((tag, index) => (
              <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                #{tag}
              </span>
            ))}
            {(content.hashtags || []).length > 3 && (
              <span className="text-xs text-gray-500">+{(content.hashtags || []).length - 3} more</span>
            )}
          </div>
        )}
      </div>

      {/* Media Display */}
      {(content.thumbnailUrl || content.mediaUrls) && (
        <div className="mb-4">
          {content.mediaUrls && content.mediaUrls.length > 0 ? (
            <div className="space-y-2">
              {content.mediaUrls.length === 1 ? (
                // Single media item
                <div className="relative">
                  {content.mediaUrls[0].includes('video') || content.mediaUrls[0].includes('mp4') || content.mediaUrls[0].includes('webm') ? (
                    <video
                      src={content.mediaUrls[0]}
                      controls
                      className="w-full h-48 object-cover rounded-lg"
                      poster={content.thumbnailUrl}
                    />
                  ) : (
                    <img
                      src={content.mediaUrls[0]}
                      alt={content.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                </div>
              ) : (
                // Multiple media items
                <div className="grid grid-cols-2 gap-2">
                  {content.mediaUrls.slice(0, 4).map((url, index) => (
                    <div key={index} className="relative">
                      {url.includes('video') || url.includes('mp4') || url.includes('webm') ? (
                        <video
                          src={url}
                          controls
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <img
                          src={url}
                          alt={`${content.title} - Media ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      )}
                      {index === 3 && content.mediaUrls && content.mediaUrls.length > 4 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                          <span className="text-white text-sm font-medium">
                            +{content.mediaUrls.length - 4} more
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : content.thumbnailUrl ? (
            // Fallback to thumbnail
            <img
              src={content.thumbnailUrl}
              alt={content.title}
              className="w-full h-32 object-cover rounded-lg"
            />
          ) : null}
        </div>
      )}

      {/* Engagement Metrics */}
      {content.engagement && (
        <div className="grid grid-cols-4 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <Heart className="h-4 w-4 mx-auto mb-1 text-red-500" />
            <div className="text-sm font-semibold">{content.engagement.likes.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Likes</div>
          </div>
          <div className="text-center">
            <MessageCircle className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <div className="text-sm font-semibold">{content.engagement.comments.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Comments</div>
          </div>
          <div className="text-center">
            <Share2 className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <div className="text-sm font-semibold">{content.engagement.shares.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Shares</div>
          </div>
          <div className="text-center">
            <Eye className="h-4 w-4 mx-auto mb-1 text-purple-500" />
            <div className="text-sm font-semibold">{content.engagement.views.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Views</div>
          </div>
        </div>
      )}

      {/* Scheduling Info */}
      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span>
            {content.status === 'scheduled' ? 'Scheduled for ' : 'Published '}
            {content.scheduledAt ? format(scheduledDate, 'MMM d, yyyy \'at\' h:mm a') : 'Not scheduled'}
          </span>
        </div>
        {content.metadata?.engagementRate && (
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-4 w-4" />
            <span>{content.metadata.engagementRate}% engagement</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {content.status === 'draft' && (
            <Button size="sm" onClick={handlePublishNow}>
              <Play className="h-4 w-4 mr-2" />
              Publish Now
            </Button>
          )}
          {content.status === 'scheduled' && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange('paused')}>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          {content.status === 'paused' && (
            <Button size="sm" onClick={() => handleStatusChange('scheduled')}>
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleRegenerate}
            disabled={regenerateContentMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${regenerateContentMutation.isPending ? 'animate-spin' : ''}`} />
            {regenerateContentMutation.isPending ? 'Generating...' : 'Regenerate'}
          </Button>
        </div>

        {content.status === 'published' && content.metadata?.platformUrl && (
          <Button size="sm" variant="outline" asChild>
            <a href={content.metadata.platformUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Post
            </a>
          </Button>
        )}
      </div>

      {/* Detailed View */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-sm mb-2">AI Metadata</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Confidence:</span>
                    <span className="ml-2">{content.metadata?.confidence || 'N/A'}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Best Time:</span>
                    <span className="ml-2">{content.metadata?.bestPostingTime || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Target Audience:</span>
                    <span className="ml-2">{content.metadata?.targetAudience || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <span className="ml-2">{content.metadata?.category || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {content.metadata?.recommendations && (
                <div>
                  <h5 className="font-medium text-sm mb-2">AI Recommendations</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {content.metadata.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></div>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-caption">Caption</Label>
              <Textarea
                id="edit-caption"
                value={editForm.caption}
                onChange={(e) => setEditForm(prev => ({ ...prev, caption: e.target.value }))}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="edit-hashtags">Hashtags (comma-separated)</Label>
              <Input
                id="edit-hashtags"
                value={editForm.hashtags}
                onChange={(e) => setEditForm(prev => ({ ...prev, hashtags: e.target.value }))}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// Batch operations component for multiple content cards
export function ContentCardBatchActions({
  selectedIds,
  onBatchStatusChange,
  onBatchDelete,
  onBatchRegenerate
}: {
  selectedIds: string[];
  onBatchStatusChange: (status: string) => void;
  onBatchDelete: () => void;
  onBatchRegenerate: () => void;
}) {
  if (selectedIds.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50"
    >
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">
          {selectedIds.length} content{selectedIds.length > 1 ? 's' : ''} selected
        </span>
        <div className="flex items-center space-x-2">
          <Button size="sm" onClick={() => onBatchStatusChange('scheduled')}>
            <Play className="h-4 w-4 mr-2" />
            Schedule
          </Button>
          <Button size="sm" variant="outline" onClick={() => onBatchStatusChange('paused')}>
            <Pause className="h-4 w-4 mr-2" />
            Pause
          </Button>
          <Button size="sm" variant="outline" onClick={onBatchRegenerate}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
          <Button size="sm" variant="destructive" onClick={onBatchDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
