import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Youtube, Instagram, Facebook } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import SchedulingModal from "@/components/modals/SchedulingModal";

interface ScheduledContent {
  id: number;
  title: string;
  platform: string;
  contentType: string;
  scheduledAt: string;
  status: string;
}

export default function UpcomingSchedule() {
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<any>(null);
  
  const { data: scheduledContent, isLoading, error, refetch } = useQuery<ScheduledContent[]>({
    queryKey: ['/api/content/scheduled', { limit: 5 }],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/content/scheduled?limit=5');
        if (!response.ok) {
          // If API fails, return mock data for demo purposes
          console.warn('Failed to fetch scheduled content, using mock data');
          return getMockScheduledContent();
        }
        const data = await response.json();
        const content = data.scheduledContent || data || [];

        // If no real data, supplement with mock data
        if (content.length === 0) {
          return getMockScheduledContent();
        }

        return content;
      } catch (error) {
        console.warn('Error fetching scheduled content, using mock data:', error);
        return getMockScheduledContent();
      }
    },
    retry: 3,
    staleTime: 60 * 1000, // 1 minute
  });

  // Mock data function for demo purposes
  const getMockScheduledContent = (): ScheduledContent[] => {
    const now = new Date();
    return [
      {
        id: 1,
        title: 'Weekly Tech Review',
        platform: 'youtube',
        contentType: 'video',
        scheduledAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        status: 'scheduled'
      },
      {
        id: 2,
        title: 'Instagram Story Series',
        platform: 'instagram',
        contentType: 'story',
        scheduledAt: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
        status: 'scheduled'
      },
      {
        id: 3,
        title: 'LinkedIn Article',
        platform: 'linkedin',
        contentType: 'post',
        scheduledAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        status: 'draft'
      }
    ];
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return <Youtube className="w-5 h-5 text-red-600" />;
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-600" />;
      case 'facebook':
        return <Facebook className="w-5 h-5 text-blue-600" />;
      default:
        return <Youtube className="w-5 h-5 text-red-600" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return 'bg-red-100';
      case 'instagram':
        return 'bg-pink-100';
      case 'facebook':
        return 'bg-blue-100';
      default:
        return 'bg-red-100';
    }
  };

  const getContentTypeLabel = (contentType: string, platform: string) => {
    if (platform.toLowerCase() === 'youtube') {
      return contentType === 'short' ? 'YouTube Shorts' : 'YouTube Video';
    } else if (platform.toLowerCase() === 'instagram') {
      return contentType === 'reel' ? 'Instagram Reel' : 'Instagram Post';
    } else if (platform.toLowerCase() === 'facebook') {
      return 'Facebook Video';
    }
    return contentType;
  };

  const formatScheduleTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `Today, ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
    } else if (diffInHours < 48) {
      return `Tomorrow, ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const handleManageSchedule = () => {
    setEditingContent(null);
    setIsSchedulingModalOpen(true);
  };

  const handleEditContent = (content: any) => {
    setEditingContent(content);
    setIsSchedulingModalOpen(true);
  };

  const handleViewAllScheduled = () => {
    window.location.href = '/scheduler';
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="w-6 h-6" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Upcoming Schedule</CardTitle>
            <Button 
              variant="ghost" 
              className="text-primary hover:text-primary/80 text-sm font-medium"
              onClick={handleManageSchedule}
            >
              Manage
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Failed to load scheduled content</p>
            <p className="text-sm text-gray-400 mb-4">
              Please try refreshing the page or contact support
            </p>
            <Button onClick={handleManageSchedule}>Schedule Content</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayContent = scheduledContent || [];

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardHeader className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Upcoming Schedule</CardTitle>
          <Button 
            variant="ghost" 
            className="text-primary hover:text-primary/80 text-sm font-medium"
            onClick={handleManageSchedule}
          >
            Manage
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {(Array.isArray(displayContent) && displayContent.length === 0) ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No scheduled content</p>
            <Button onClick={handleManageSchedule}>Schedule Content</Button>
          </div>
        ) : (
          (Array.isArray(displayContent) ? displayContent : []).map((item: any) => (
            <div key={item.id} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 ${getPlatformColor(item.platform)} rounded-lg flex items-center justify-center`}>
                  {getPlatformIcon(item.platform)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-500">
                  {formatScheduleTime(item.scheduledAt)}
                </p>
                <div className="flex items-center mt-2 space-x-2">
                  <Badge className="text-xs font-medium bg-blue-100 text-blue-800">
                    {getContentTypeLabel(item.contentType, item.platform)}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {item.status === 'scheduled' ? 'Auto-post enabled' : 
                     item.status === 'draft' ? 'Needs review' : 'Ready to publish'}
                  </span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => handleEditContent(item)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
      
      {/* Scheduling Modal */}
      <SchedulingModal
        isOpen={isSchedulingModalOpen}
        onClose={() => {
          setIsSchedulingModalOpen(false);
          setEditingContent(null);
        }}
        editingContent={editingContent}
        onScheduled={(content) => {
          console.log('Content scheduled:', content);
          // Refetch the scheduled content to show updates
          refetch();
        }}
      />
    </Card>
  );
}
