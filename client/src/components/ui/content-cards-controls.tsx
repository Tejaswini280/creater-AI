import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Share,
  Copy,
  ExternalLink,
  Sparkles,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin
} from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ContentCard {
  id: string;
  title: string;
  description: string;
  platform: string;
  contentType: 'post' | 'reel' | 'short' | 'story' | 'video';
  status: 'draft' | 'scheduled' | 'published' | 'paused' | 'failed';
  scheduledAt: string;
  publishedAt?: string;
  thumbnailUrl?: string;
  aiGenerated: boolean;
  hashtags: string[];
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
  };
  metadata?: Record<string, any>;
}

interface ContentCardsControlsProps {
  contentCards: ContentCard[];
  onContentUpdate?: (content: ContentCard) => void;
  onContentDelete?: (contentId: string) => void;
  onContentPublish?: (contentId: string) => void;
  onContentPause?: (contentId: string) => void;
  onContentResume?: (contentId: string) => void;
  onContentEdit?: (contentId: string) => void;
  onContentDuplicate?: (contentId: string) => void;
  loading?: boolean;
}

const PLATFORM_COLORS = {
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  facebook: 'bg-blue-600',
  tiktok: 'bg-black',
  youtube: 'bg-red-600',
  linkedin: 'bg-blue-700',
  twitter: 'bg-sky-500'
};

const PLATFORM_ICONS = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  linkedin: Linkedin,
  twitter: Twitter,
  tiktok: () => <span className="text-lg">🎵</span>
};

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  published: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800'
};

const STATUS_ICONS = {
  draft: Edit,
  scheduled: Calendar,
  published: CheckCircle,
  paused: Pause,
  failed: AlertCircle
};

const CONTENT_TYPE_ICONS = {
  post: '📝',
  reel: '🎬',
  short: '⚡',
  story: '📱',
  video: '🎥'
};

export default function ContentCardsControls({
  contentCards,
  onContentUpdate,
  onContentDelete,
  onContentPublish,
  onContentPause,
  onContentResume,
  onContentEdit,
  onContentDuplicate,
  loading = false
}: ContentCardsControlsProps) {
  const { toast } = useToast();
  const [selectedContent, setSelectedContent] = useState<ContentCard | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleStatusChange = async (contentId: string, newStatus: ContentCard['status']) => {
    setActionLoading(contentId);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const content = contentCards.find(c => c.id === contentId);
      if (!content) return;

      const updatedContent = { ...content, status: newStatus };

      onContentUpdate?.(updatedContent);

      toast({
        title: "Status Updated",
        description: `Content status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update content status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (contentId: string) => {
    setActionLoading(contentId);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      onContentDelete?.(contentId);

      toast({
        title: "Content Deleted",
        description: "Content has been successfully deleted",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete content",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublish = async (contentId: string) => {
    setActionLoading(contentId);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const content = contentCards.find(c => c.id === contentId);
      if (!content) return;

      const updatedContent = {
        ...content,
        status: 'published' as const,
        publishedAt: new Date().toISOString()
      };

      onContentUpdate?.(updatedContent);

      toast({
        title: "Content Published! 🎉",
        description: `Successfully published to ${content.platform}`,
      });
    } catch (error) {
      toast({
        title: "Publish Failed",
        description: "Failed to publish content",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async (contentId: string) => {
    setActionLoading(contentId);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      onContentDuplicate?.(contentId);

      toast({
        title: "Content Duplicated",
        description: "Content has been successfully duplicated",
      });
    } catch (error) {
      toast({
        title: "Duplicate Failed",
        description: "Failed to duplicate content",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const ContentCardComponent = ({ content }: { content: ContentCard }) => {
    const StatusIcon = STATUS_ICONS[content.status];
    const PlatformIcon = PLATFORM_ICONS[content.platform as keyof typeof PLATFORM_ICONS] || (() => <span>📱</span>);
    const isLoading = actionLoading === content.id;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="group hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div className={`w-10 h-10 rounded-lg ${PLATFORM_COLORS[content.platform as keyof typeof PLATFORM_COLORS] || 'bg-gray-500'} flex items-center justify-center flex-shrink-0`}>
                  <PlatformIcon className="h-5 w-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-sm truncate">{content.title}</h3>
                    {content.aiGenerated && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge className={`text-xs ${STATUS_COLORS[content.status]}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {content.status}
                    </Badge>

                    <Badge variant="outline" className="text-xs">
                      {content.contentType}
                    </Badge>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreVertical className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSelectedContent(content)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onContentEdit?.(content.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicate(content.id)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => window.open(`https://${content.platform}.com`, '_blank')}
                    className="text-blue-600"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on {content.platform}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(content.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {content.description}
            </p>

            {/* Engagement Metrics */}
            {content.engagement && (
              <div className="flex items-center space-x-4 mb-4 text-xs text-gray-500">
                {content.engagement.likes !== undefined && (
                  <span>❤️ {content.engagement.likes}</span>
                )}
                {content.engagement.comments !== undefined && (
                  <span>💬 {content.engagement.comments}</span>
                )}
                {content.engagement.shares !== undefined && (
                  <span>🔄 {content.engagement.shares}</span>
                )}
                {content.engagement.views !== undefined && (
                  <span>👁️ {content.engagement.views}</span>
                )}
              </div>
            )}

            {/* Scheduling Info */}
            <div className="flex items-center space-x-2 mb-4 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>
                {content.status === 'published' && content.publishedAt
                  ? `Published ${format(new Date(content.publishedAt), 'MMM d, h:mm a')}`
                  : content.status === 'scheduled'
                  ? `Scheduled for ${format(new Date(content.scheduledAt), 'MMM d, h:mm a')}`
                  : content.status === 'draft'
                  ? 'Draft'
                  : content.status
                }
              </span>
            </div>

            {/* Hashtags */}
            {content.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {content.hashtags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                    #{tag}
                  </Badge>
                ))}
                {content.hashtags.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    +{content.hashtags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {content.status === 'draft' && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange(content.id, 'scheduled')}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Schedule
                  </Button>
                )}

                {content.status === 'scheduled' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(content.id, 'paused')}
                      disabled={isLoading}
                    >
                      <Pause className="h-3 w-3 mr-1" />
                      Pause
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handlePublish(content.id)}
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Share className="h-3 w-3 mr-1" />
                      )}
                      Publish
                    </Button>
                  </>
                )}

                {content.status === 'paused' && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange(content.id, 'scheduled')}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Resume
                  </Button>
                )}

                {content.status === 'published' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`https://${content.platform}.com`, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                )}
              </div>

              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedContent(content)}
                  disabled={isLoading}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onContentEdit?.(content.id)}
                  disabled={isLoading}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="h-3 bg-gray-300 rounded w-full"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                <div className="flex space-x-2">
                  <div className="h-6 bg-gray-300 rounded w-16"></div>
                  <div className="h-6 bg-gray-300 rounded w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {contentCards.map((content) => (
          <ContentCardComponent key={content.id} content={content} />
        ))}
      </AnimatePresence>

      {contentCards.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-gray-500 text-lg mb-4">No content found</div>
            <p className="text-gray-400 text-sm mb-6">
              Create your first content piece to get started with your social media strategy.
            </p>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate AI Content
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Content Preview Modal */}
      <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Content Preview</span>
            </DialogTitle>
          </DialogHeader>

          {selectedContent && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg ${PLATFORM_COLORS[selectedContent.platform as keyof typeof PLATFORM_COLORS] || 'bg-gray-500'} flex items-center justify-center`}>
                  <span className="text-white text-xl">
                    {CONTENT_TYPE_ICONS[selectedContent.contentType]}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{selectedContent.title}</h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {selectedContent.platform} • {selectedContent.contentType}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Content</h4>
                <p className="text-gray-900">{selectedContent.description}</p>
              </div>

              {selectedContent.hashtags.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Hashtags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedContent.hashtags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Status: <Badge className={STATUS_COLORS[selectedContent.status]}>{selectedContent.status}</Badge></span>
                <span>AI Generated: {selectedContent.aiGenerated ? 'Yes' : 'No'}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
