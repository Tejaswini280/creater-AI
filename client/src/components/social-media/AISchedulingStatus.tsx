import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface AISchedulingStatusProps {
  projectId: number;
  onRefresh?: () => void;
}

interface SchedulingStatus {
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  totalScheduledPosts: number;
  aiGeneratedPosts: number;
  lastGenerated: number | null;
  scheduledPosts: Array<{
    id: number;
    title: string;
    platform: string;
    scheduledAt: string;
    status: string;
    aiGenerated: boolean;
  }>;
}

export default function AISchedulingStatus({ projectId, onRefresh }: AISchedulingStatusProps) {
  const [status, setStatus] = useState<SchedulingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/projects/${projectId}/ai-scheduling-status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch scheduling status');
      }

      const data = await response.json();
      setStatus(data.aiScheduling);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Poll for updates every 5 seconds if status is in progress
    const interval = setInterval(() => {
      if (status?.status === 'in_progress' || status?.status === 'pending') {
        fetchStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [projectId, status?.status]);

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-5 w-5 animate-spin" />;
    if (error) return <AlertCircle className="h-5 w-5 text-red-500" />;
    
    switch (status?.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    if (isLoading) return 'Loading status...';
    if (error) return 'Error loading status';
    
    switch (status?.status) {
      case 'completed':
        return 'AI scheduling completed';
      case 'in_progress':
        return 'AI is generating content...';
      case 'pending':
        return 'AI scheduling pending';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    if (error) return 'bg-red-100 text-red-800';
    if (isLoading) return 'bg-gray-100 text-gray-800';
    
    switch (status?.status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const progress = status ? (status.aiGeneratedPosts / Math.max(status.totalScheduledPosts, 1)) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {getStatusIcon()}
            AI Scheduling Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor()}>
              {getStatusText()}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchStatus}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-3"
          >
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </motion.div>
        )}

        {status && (
          <>
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Content Generation Progress</span>
                <span>{status.aiGeneratedPosts} / {status.totalScheduledPosts}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {status.totalScheduledPosts}
                </div>
                <div className="text-sm text-gray-600">Total Posts</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {status.aiGeneratedPosts}
                </div>
                <div className="text-sm text-gray-600">AI Generated</div>
              </div>
            </div>

            {/* Recent Posts */}
            {status.scheduledPosts.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Recent Scheduled Posts</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {status.scheduledPosts.slice(0, 5).map((post) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          post.aiGenerated ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <span className="truncate flex-1">{post.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Badge variant="outline" className="text-xs">
                          {post.platform}
                        </Badge>
                        <span>{new Date(post.scheduledAt).toLocaleDateString()}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Generated Time */}
            {status.lastGenerated && (
              <div className="text-xs text-gray-500 text-center">
                Last generated: {new Date(status.lastGenerated).toLocaleString()}
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStatus}
            disabled={isLoading}
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="flex-1"
            >
              Refresh Project
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
