

import ContentPlanner from '../components/social-media/ContentPlanner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export default function TestPlanner() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // WebSocket for real-time updates
  const { sendMessage } = useWebSocketSingleton({
    onMessage: (message) => {
      if (message.type === 'content_scheduled' ||
          message.type === 'content_updated' ||
          message.type === 'content_deleted') {
        console.log('Real-time content update received:', message);
        refetch(); // Refresh data when content changes
      }
    }
  });

  // Fetch scheduled content from database
  const { data: contentResponse, isLoading, refetch } = useQuery({
    queryKey: ['/api/content/scheduled'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/content/scheduled');
        if (response.ok) {
          const data = await response.json();
          return data;
        } else {
          console.error('Failed to fetch scheduled content:', response.status);
          // Fallback to regular content if scheduled endpoint doesn't exist
          const fallbackResponse = await apiRequest('GET', '/api/content');
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            return fallbackData;
          }
          return { content: [], success: true, total: 0 };
        }
      } catch (error) {
        console.error('Error fetching scheduled content:', error);
        return { content: [], success: true, total: 0 };
      }
    },
    enabled: isAuthenticated && !authLoading
  });

  // Extract content array from response
  const scheduledPosts = contentResponse?.scheduledContent || [];

  // Mock data for demo when no real data exists
  const getMockPosts = () => {
    const now = new Date();
    return [
      {
        id: '1',
        title: 'Weekly Tech Review',
        caption: 'Latest tech news and updates for creators',
        contentType: 'video',
        platform: 'youtube',
        scheduledAt: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        status: 'scheduled',
        media: []
      },
      {
        id: '2',
        title: 'Instagram Story Series',
        caption: 'Behind the scenes content creation',
        contentType: 'story',
        platform: 'instagram',
        scheduledAt: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 hours from now
        status: 'scheduled',
        media: []
      },
      {
        id: '3',
        title: 'LinkedIn Article',
        caption: 'Content creation tips for professionals',
        contentType: 'post',
        platform: 'linkedin',
        scheduledAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        status: 'draft',
        media: []
      },
      {
        id: '4',
        title: 'TikTok Dance Tutorial',
        caption: 'Learn the latest dance moves',
        contentType: 'video',
        platform: 'tiktok',
        scheduledAt: new Date(now.getTime() + 48 * 60 * 60 * 1000), // Day after tomorrow
        status: 'scheduled',
        media: []
      }
    ];
  };

  // Transform content to match ContentPlanner interface, use mock data if empty
  const transformedPosts = scheduledPosts.length > 0
    ? scheduledPosts.map((item: any) => ({
        id: item.id.toString(),
        title: item.title || 'Untitled Post',
        caption: item.description || '',
        contentType: item.contentType || 'post',
        platform: item.platform || 'youtube',
        scheduledAt: item.scheduledAt ? new Date(item.scheduledAt) : new Date(),
        status: item.status || 'draft',
        media: item.media || []
      }))
    : getMockPosts();

  const handleEditPost = async (post: any) => {
    console.log('Edit post:', post);
    // Navigate to content studio for editing
    window.location.href = `/content-studio?id=${post.id}`;
  };

  const handleDeletePost = async (postId: string) => {
    console.log('Delete post:', postId);
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const response = await apiRequest('DELETE', `/api/content/${postId}`);
      if (response.ok) {
        toast({
          title: "Post Deleted",
          description: "The post has been successfully deleted.",
        });
        refetch(); // Refresh the data
      } else {
        throw new Error('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicatePost = async (post: any) => {
    console.log('Duplicate post:', post);

    try {
      const duplicateData = {
        title: `${post.title} (Copy)`,
        description: post.caption,
        platform: post.platform,
        contentType: post.contentType,
        status: 'draft',
        tags: [],
        scheduledAt: null
      };

      const response = await apiRequest('POST', '/api/content', duplicateData);
      if (response.ok) {
        toast({
          title: "Post Duplicated",
          description: `"${post.title}" has been duplicated successfully.`,
        });
        refetch(); // Refresh the data
      } else {
        throw new Error('Failed to duplicate post');
      }
    } catch (error) {
      console.error('Error duplicating post:', error);
      toast({
        title: "Duplicate Failed",
        description: "Failed to duplicate the post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReschedulePost = async (postId: string, newDate: Date) => {
    console.log('Reschedule post:', postId, 'to:', newDate);

    try {
      const response = await apiRequest('PUT', `/api/content/${postId}`, {
        scheduledAt: newDate.toISOString()
      });

      if (response.ok) {
        toast({
          title: "Post Rescheduled",
          description: `Post rescheduled to ${newDate.toLocaleString()}.`,
        });
        refetch(); // Refresh the data
      } else {
        throw new Error('Failed to reschedule post');
      }
    } catch (error) {
      console.error('Error rescheduling post:', error);
      toast({
        title: "Reschedule Failed",
        description: "Failed to reschedule the post. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = '/login';
    return null;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading content planner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Content Planner</h1>
              <p className="text-gray-600">
                Plan and schedule your content across all platforms • {transformedPosts.length} posts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowLeft className="h-4 w-4 mr-2 rotate-180" />
              )}
              Refresh
            </Button>
            <Button onClick={() => setLocation('/content-studio')}>
              Create New Post
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span>Loading scheduled content...</span>
          </div>
        ) : (
          <ContentPlanner
            posts={transformedPosts}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
            onDuplicatePost={handleDuplicatePost}
            onReschedulePost={handleReschedulePost}
          />
        )}
      </div>
    </div>
  );
}
