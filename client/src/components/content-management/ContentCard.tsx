import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Square, 
  Trash2, 
  Edit, 
  RotateCcw, 
  Save, 
  MoreVertical,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar,
  Hash,
  ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditContentModal } from './EditContentModal';
import { useToast } from '@/hooks/use-toast';

interface ContentCardProps {
  content: {
    id: number;
    title: string;
    description: string;
    content: string;
    platform: string;
    contentType: string;
    status: string;
    dayNumber: number;
    scheduledDate: Date | null;
    publishedAt: Date | null;
    isPaused: boolean;
    isStopped: boolean;
    canPublish: boolean;
    publishOrder: number;
    contentVersion: number;
    lastRegeneratedAt: Date | null;
    hashtags: string[];
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
  };
  onAction: (contentId: number, action: string, data?: any) => void;
  compact?: boolean;
}

export function ContentCard({ content, onAction, compact = false }: ContentCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getStatusIcon = () => {
    switch (content.status) {
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'draft':
        return <Edit className="h-4 w-4 text-gray-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'stopped':
        return <Square className="h-4 w-4 text-red-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (content.status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'stopped':
        return 'bg-red-100 text-red-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformColor = () => {
    const colors: { [key: string]: string } = {
      instagram: 'bg-pink-100 text-pink-800',
      facebook: 'bg-blue-100 text-blue-800',
      twitter: 'bg-sky-100 text-sky-800',
      linkedin: 'bg-blue-100 text-blue-800',
      tiktok: 'bg-black text-white',
      youtube: 'bg-red-100 text-red-800'
    };
    return colors[content.platform] || 'bg-gray-100 text-gray-800';
  };

  const handleAction = async (action: string, data?: any) => {
    setIsLoading(true);
    try {
      await onAction(content.id, action, data);
    } catch (error) {
      console.error(`Error ${action}ing content:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not scheduled';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
      <Card className={`${compact ? 'p-3' : ''} hover:shadow-md transition-shadow`}>
        <CardHeader className={compact ? 'pb-2' : ''}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className={`${compact ? 'text-sm' : 'text-base'} truncate`}>
                {content.title}
              </CardTitle>
              {!compact && content.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {truncateText(content.description, 100)}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2 ml-2">
              {getStatusIcon()}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {content.status === 'draft' && (
                    <DropdownMenuItem onClick={() => handleAction('play')}>
                      <Play className="h-4 w-4 mr-2" />
                      Play
                    </DropdownMenuItem>
                  )}
                  {!content.isPaused && content.status !== 'stopped' && (
                    <DropdownMenuItem onClick={() => handleAction('pause')}>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </DropdownMenuItem>
                  )}
                  {content.isPaused && (
                    <DropdownMenuItem onClick={() => handleAction('play')}>
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </DropdownMenuItem>
                  )}
                  {!content.isStopped && (
                    <DropdownMenuItem onClick={() => handleAction('stop')}>
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </DropdownMenuItem>
                  )}
                  {content.isStopped && (
                    <DropdownMenuItem onClick={() => handleAction('play')}>
                      <Play className="h-4 w-4 mr-2" />
                      Restart
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction('regenerate')}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Regenerate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleAction('delete')}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className={compact ? 'pt-0' : ''}>
          <div className="space-y-3">
            {/* Status and Platform Badges */}
            <div className="flex items-center space-x-2 flex-wrap">
              <Badge className={getStatusColor()}>
                {content.status}
              </Badge>
              <Badge className={getPlatformColor()}>
                {content.platform}
              </Badge>
              <Badge variant="outline">
                {content.contentType}
              </Badge>
              {content.isPaused && (
                <Badge variant="secondary">
                  <Pause className="h-3 w-3 mr-1" />
                  Paused
                </Badge>
              )}
              {content.isStopped && (
                <Badge variant="destructive">
                  <Square className="h-3 w-3 mr-1" />
                  Stopped
                </Badge>
              )}
            </div>

            {/* Content Preview */}
            {!compact && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-700">
                  {truncateText(content.content, 200)}
                </p>
              </div>
            )}

            {/* Hashtags */}
            {content.hashtags && content.hashtags.length > 0 && (
              <div className="flex items-center space-x-1 flex-wrap">
                <Hash className="h-3 w-3 text-gray-400" />
                {content.hashtags.slice(0, 5).map((tag, index) => (
                  <span key={index} className="text-xs text-blue-600">
                    #{tag}
                  </span>
                ))}
                {content.hashtags.length > 5 && (
                  <span className="text-xs text-gray-400">
                    +{content.hashtags.length - 5} more
                  </span>
                )}
              </div>
            )}

            {/* Scheduling Info */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {content.scheduledDate ? formatDate(content.scheduledDate) : 'Not scheduled'}
                  </span>
                </div>
                {content.publishedAt && (
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Published {formatDate(content.publishedAt)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span>v{content.contentVersion}</span>
                {content.lastRegeneratedAt && (
                  <span className="text-gray-400">
                    Regenerated {formatDate(content.lastRegeneratedAt)}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {!compact && (
              <div className="flex items-center space-x-2 pt-2 border-t">
                {content.status === 'draft' && (
                  <Button
                    size="sm"
                    onClick={() => handleAction('play')}
                    disabled={isLoading}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Play
                  </Button>
                )}
                {!content.isPaused && content.status !== 'stopped' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction('pause')}
                    disabled={isLoading}
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                )}
                {content.isPaused && (
                  <Button
                    size="sm"
                    onClick={() => handleAction('play')}
                    disabled={isLoading}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Resume
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEditModal(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction('regenerate')}
                  disabled={isLoading}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Regenerate
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {showEditModal && (
        <EditContentModal
          content={content}
          onSave={(data) => {
            handleAction('edit', data);
            setShowEditModal(false);
          }}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}
