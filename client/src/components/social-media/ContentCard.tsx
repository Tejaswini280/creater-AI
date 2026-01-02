import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Play, 
  Pause, 
  Square, 
  Edit, 
  RotateCcw, 
  Save, 
  Trash2, 
  MoreVertical,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  Target,
  Users,
  Zap,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

export interface ContentItem {
  id: number;
  dayNumber: number;
  title: string;
  description: string;
  platform: string;
  contentType: string;
  status: 'draft' | 'scheduled' | 'published' | 'paused' | 'deleted';
  scheduledTime?: string;
  publishedAt?: string;
  hashtags?: string[];
  metadata?: {
    aiGenerated?: boolean;
    engagementPrediction?: {
      average: number;
      platform: string;
    };
    targetAudience?: string;
    optimalPostingTime?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface ContentCardProps {
  content: ContentItem;
  onView: (content: ContentItem) => void;
  onEdit: (content: ContentItem) => void;
  onRecreate: (content: ContentItem) => void;
  onRegenerate: (content: ContentItem) => void;
  onUpdate: (content: ContentItem) => void;
  onStop: (content: ContentItem) => void;
  onPlay: (content: ContentItem) => void;
  onPause: (content: ContentItem) => void;
  onDelete: (content: ContentItem) => void;
  isProjectActive?: boolean;
  className?: string;
}

const platformIcons: Record<string, string> = {
  instagram: '📷',
  youtube: '📺',
  tiktok: '🎵',
  linkedin: '💼',
  facebook: '👥',
  twitter: '🐦',
  pinterest: '📌'
};

const statusConfig = {
  draft: {
    label: 'Draft',
    icon: Edit,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    dotColor: 'bg-gray-400'
  },
  scheduled: {
    label: 'Scheduled',
    icon: Clock,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    dotColor: 'bg-blue-400'
  },
  published: {
    label: 'Published',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200',
    dotColor: 'bg-green-400'
  },
  paused: {
    label: 'Paused',
    icon: Pause,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    dotColor: 'bg-yellow-400'
  },
  deleted: {
    label: 'Deleted',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
    dotColor: 'bg-red-400'
  }
};

export const ContentCard: React.FC<ContentCardProps> = ({
  content,
  onView,
  onEdit,
  onRecreate,
  onRegenerate,
  onUpdate,
  onStop,
  onPlay,
  onPause,
  onDelete,
  isProjectActive = true,
  className = ''
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const statusInfo = statusConfig[content.status];
  const StatusIcon = statusInfo.icon;
  const platformIcon = platformIcons[content.platform.toLowerCase()] || '📱';

  // Determine available actions based on content status
  const canEdit = content.status !== 'published' && content.status !== 'deleted';
  const canDelete = content.status !== 'published' && content.status !== 'deleted';
  const canStop = content.status === 'scheduled' || content.status === 'paused';
  const canPlay = content.status === 'paused' || content.status === 'draft';
  const canPause = content.status === 'scheduled';
  const canRecreate = content.status !== 'published' && content.status !== 'deleted';
  const canRegenerate = content.status !== 'published' && content.status !== 'deleted';

  const handleAction = async (action: string) => {
    setIsLoading(true);
    try {
      switch (action) {
        case 'view':
          onView(content);
          break;
        case 'edit':
          onEdit(content);
          break;
        case 'recreate':
          onRecreate(content);
          break;
        case 'regenerate':
          onRegenerate(content);
          break;
        case 'update':
          onUpdate(content);
          break;
        case 'stop':
          setShowStopDialog(true);
          break;
        case 'play':
          onPlay(content);
          break;
        case 'pause':
          setShowPauseDialog(true);
          break;
        case 'delete':
          setShowDeleteDialog(true);
          break;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform action",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmAction = async (action: string) => {
    setIsLoading(true);
    try {
      switch (action) {
        case 'delete':
          onDelete(content);
          setShowDeleteDialog(false);
          break;
        case 'stop':
          onStop(content);
          setShowStopDialog(false);
          break;
        case 'pause':
          onPause(content);
          setShowPauseDialog(false);
          break;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform action",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`group ${className}`}
      >
        <Card 
          className={`
            relative overflow-hidden transition-all duration-300 hover:shadow-lg
            ${!isProjectActive ? 'opacity-60' : ''}
            ${content.status === 'deleted' ? 'opacity-50' : ''}
            ${content.status === 'published' ? 'ring-2 ring-green-200' : ''}
          `}
        >
          {/* Status Indicator */}
          <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${statusInfo.dotColor}`} />
          
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{platformIcon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg font-semibold truncate">
                      Day {content.dayNumber}
                    </CardTitle>
                    {content.metadata?.aiGenerated && (
                      <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200">
                        <Sparkles className="h-3 w-3 mr-1 text-purple-600" />
                        AI
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base font-medium text-gray-900 mb-1 truncate">
                    {content.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{content.scheduledTime || 'No specific time'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${statusInfo.color}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusInfo.label}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {content.contentType}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Content Description */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700 line-clamp-3">
                {content.description}
              </p>
            </div>

            {/* Hashtags */}
            {content.hashtags && content.hashtags.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Zap className="h-4 w-4" />
                  <span>Hashtags</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {content.hashtags.slice(0, 4).map((hashtag) => (
                    <Badge key={hashtag} variant="secondary" className="text-xs">
                      #{hashtag}
                    </Badge>
                  ))}
                  {content.hashtags.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{content.hashtags.length - 4}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* AI Metadata */}
            {content.metadata && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-xs text-gray-600">Engagement</div>
                    <div className="text-sm font-medium">
                      {content.metadata.engagementPrediction?.average || 0}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-xs text-gray-600">Audience</div>
                    <div className="text-sm font-medium truncate">
                      {content.metadata.targetAudience || 'General'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                {canPlay && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction('play')}
                    disabled={isLoading}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Play
                  </Button>
                )}
                {canPause && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction('pause')}
                    disabled={isLoading}
                    className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                )}
                {canStop && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction('stop')}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Square className="h-4 w-4 mr-1" />
                    Stop
                  </Button>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={isLoading}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleAction('view')}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  
                  {canEdit && (
                    <DropdownMenuItem onClick={() => handleAction('edit')}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Content
                    </DropdownMenuItem>
                  )}
                  
                  {canRecreate && (
                    <DropdownMenuItem onClick={() => handleAction('recreate')}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Recreate Variation
                    </DropdownMenuItem>
                  )}
                  
                  {canRegenerate && (
                    <DropdownMenuItem onClick={() => handleAction('regenerate')}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate All
                    </DropdownMenuItem>
                  )}
                  
                  {canEdit && (
                    <DropdownMenuItem onClick={() => handleAction('update')}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </DropdownMenuItem>
                  )}
                  
                  {(canStop || canPlay || canPause || canDelete) && (
                    <>
                      <DropdownMenuSeparator />
                      
                      {canStop && (
                        <DropdownMenuItem 
                          onClick={() => handleAction('stop')}
                          className="text-red-600"
                        >
                          <Square className="h-4 w-4 mr-2" />
                          Stop Publishing
                        </DropdownMenuItem>
                      )}
                      
                      {canPlay && (
                        <DropdownMenuItem onClick={() => handleAction('play')}>
                          <Play className="h-4 w-4 mr-2" />
                          Resume Publishing
                        </DropdownMenuItem>
                      )}
                      
                      {canPause && (
                        <DropdownMenuItem onClick={() => handleAction('pause')}>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause Publishing
                        </DropdownMenuItem>
                      )}
                      
                      {canDelete && (
                        <DropdownMenuItem 
                          onClick={() => handleAction('delete')}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Content
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirmation Dialogs */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Content
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this content? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => confirmAction('delete')}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Square className="h-5 w-5 text-red-500" />
              Stop Publishing
            </DialogTitle>
            <DialogDescription>
              This will stop the content from being published. You can resume it later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStopDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => confirmAction('stop')}
              disabled={isLoading}
            >
              {isLoading ? 'Stopping...' : 'Stop Publishing'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pause className="h-5 w-5 text-yellow-500" />
              Pause Publishing
            </DialogTitle>
            <DialogDescription>
              This will pause the content from being published on its scheduled time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPauseDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={() => confirmAction('pause')}
              disabled={isLoading}
              className="text-yellow-600 hover:text-yellow-700"
            >
              {isLoading ? 'Pausing...' : 'Pause Publishing'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContentCard;
