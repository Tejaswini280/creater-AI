import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Heart, Edit, BarChart3, Copy, Trash2, Video } from "lucide-react";
import ContentCreationModal from "@/components/modals/ContentCreationModal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function RecentContent() {
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Navigation handlers
  const handleEditContent = (contentId: string) => {
    window.location.href = `/content-studio?id=${contentId}`;
  };

  const handleViewAnalytics = (contentId: string) => {
    window.location.href = `/analytics?content=${contentId}`;
  };

  const duplicateContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      try {
        const response = await apiRequest('POST', `/api/content/${contentId}/duplicate`);
        return await response.json();
      } catch (primaryError) {
        // Fallback: duplicate client-side using cached item and create endpoint
        const cached = queryClient.getQueryData<any[]>(['/api/content', { limit: 5 }]) || [];
        const source = Array.isArray(cached) ? cached.find((c) => String(c.id) === String(contentId)) : null;
        if (!source) throw primaryError;
        const createPayload = {
          title: `${source.title ?? 'Untitled'} (Copy)`,
          description: source.description ?? null,
          platform: source.platform ?? 'youtube',
          contentType: source.contentType ?? 'video',
          status: 'draft',
          tags: source.tags ?? null,
          thumbnailUrl: source.thumbnailUrl ?? null,
          videoUrl: source.videoUrl ?? null,
        };
        const resp = await apiRequest('POST', '/api/content', createPayload);
        return await resp.json();
      }
    },
    onMutate: async (contentId: string) => {
      await queryClient.cancelQueries({ queryKey: ['/api/content'] });
      const previous = queryClient.getQueryData<any[]>(['/api/content', { limit: 5 }]);
      if (previous && Array.isArray(previous)) {
        const source = previous.find((c) => String(c.id) === String(contentId));
        const optimisticCopy = source ? { ...source, id: `temp-${Date.now()}`, title: `${source.title} (Copy)`, status: 'draft' } : null;
        if (optimisticCopy) {
          queryClient.setQueryData<any[]>(['/api/content', { limit: 5 }], [optimisticCopy, ...previous]);
        }
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['/api/content', { limit: 5 }], ctx.previous);
      }
      toast({ title: "Duplicate failed", description: "Please try again.", variant: "destructive" });
    },
    onSuccess: (data) => {
      // If server returned the created content, insert it at the top of cache
      const created = (data && (data.content || data)) as any;
      if (created && created.id) {
        const prev = queryClient.getQueryData<any[]>(['/api/content', { limit: 5 }]) || [];
        if (Array.isArray(prev)) {
          const next = [created, ...prev.filter((c) => String(c.id) !== String(created.id) && !String(c.id).startsWith('temp-'))];
          queryClient.setQueryData(['/api/content', { limit: 5 }], next);
        }
      }
      toast({ title: "Content duplicated", description: "A copy has been added to your list." });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
    }
  });

  const handleDuplicateContent = (contentId: string) => {
    if (!contentId) return;
    if (window.confirm('Are you sure you want to duplicate this content?')) {
      duplicateContentMutation.mutate(contentId);
    }
  };

  const deleteContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const response = await apiRequest('DELETE', `/api/content/${contentId}`);
      return await response.json();
    },
    onMutate: async (contentId: string) => {
      await queryClient.cancelQueries({ queryKey: ['/api/content'] });
      const previous = queryClient.getQueryData<any[]>(['/api/content', { limit: 5 }]);
      if (previous && Array.isArray(previous)) {
        queryClient.setQueryData<any[]>(['/api/content', { limit: 5 }], previous.filter((c) => String(c.id) !== String(contentId)));
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['/api/content', { limit: 5 }], ctx.previous);
      }
      toast({ title: "Delete failed", description: "Please try again.", variant: "destructive" });
    },
    onSuccess: (_data, contentId) => {
      // Ensure the cache reflects deletion
      const prev = queryClient.getQueryData<any[]>(['/api/content', { limit: 5 }]);
      if (prev && Array.isArray(prev)) {
        queryClient.setQueryData(['/api/content', { limit: 5 }], prev.filter((c) => String(c.id) !== String(contentId)));
      }
      toast({ title: "Content deleted", description: "The item was removed successfully." });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
    }
  });

  const handleDeleteContent = (contentId: string) => {
    if (!contentId) return;
    if (window.confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      deleteContentMutation.mutate(contentId);
    }
  };
  
  const { data: contentResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/content', { limit: 5 }],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/content?limit=50'); // Get more content to filter
      if (!response.ok) {
        throw new Error('Failed to fetch recent content');
      }
      const data = await response.json();
      // Backend returns { success, content: [...], total, ... }
      const allContent = Array.isArray(data) ? data : (data.content || []);
      
      // Show ALL content (both standalone and project-linked) in dashboard
      // This gives users a complete view of their recent content regardless of where it was created
      const recentContent = allContent
        .sort((a: any, b: any) => new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime())
        .slice(0, 5);
      
      return recentContent;
    },
    retry: 3,
    staleTime: 60 * 1000,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformImage = (platform: string, item: any) => {
    // Use actual thumbnail if available
    if (item.thumbnailUrl) {
      return item.thumbnailUrl;
    }
    
    // Use video thumbnail if it's a video content
    if (item.videoUrl && (item.contentType === 'video' || item.contentType === 'short' || item.contentType === 'reel')) {
      return item.videoUrl; // We'll use the video as thumbnail with poster
    }
    
    // Fallback to platform-specific images
    const imageMap = {
      youtube: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=80&h=60&fit=crop",
      instagram: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=80&h=60&fit=crop",
      facebook: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=80&h=60&fit=crop",
      tiktok: "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=80&h=60&fit=crop",
      linkedin: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=80&h=60&fit=crop"
    };
    return imageMap[platform as keyof typeof imageMap] || imageMap.youtube;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Recent Content</CardTitle>
            <Skeleton className="h-5 w-16" />
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-3">
              <Skeleton className="w-16 h-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
                <div className="flex space-x-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-6" />
              </div>
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
            <CardTitle className="text-lg font-semibold text-gray-900">Recent Content</CardTitle>
            <Button 
              variant="ghost" 
              className="text-primary hover:text-primary/80 text-sm font-medium"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">Failed to load recent content</p>
            <p className="text-sm text-gray-400 mb-4">Please try again or create new content</p>
            <Button onClick={() => setIsContentModalOpen(true)} className="bg-primary text-white hover:bg-primary/90">
              Create Content
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200 mb-0">
      <CardHeader className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Content</CardTitle>
          <Button 
            variant="ghost" 
            className="text-primary hover:text-primary/80 text-sm font-medium"
            onClick={() => window.location.href = '/content/recent'}
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4 pb-4">
        {!contentResponse || (Array.isArray(contentResponse) && contentResponse.length === 0) ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No content created yet</p>
            <Button 
              onClick={() => setIsContentModalOpen(true)}
              className="bg-primary text-white hover:bg-primary/90"
            >
              Create Your First Content
            </Button>
          </div>
        ) : (
          (Array.isArray(contentResponse) ? contentResponse : []).map((item: any) => (
            <div key={item.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              {/* Enhanced thumbnail/video preview */}
              <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-gray-100">
                {item.videoUrl && (item.contentType === 'video' || item.contentType === 'short' || item.contentType === 'reel') ? (
                  <video 
                    src={item.videoUrl}
                    poster={item.thumbnailUrl}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                ) : (
                  <img 
                    src={item.thumbnailUrl || getPlatformImage(item.platform, item)}
                    alt="Content thumbnail" 
                    loading="lazy"
                    decoding="async"
                    width={64}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Video play indicator */}
                {item.videoUrl && (item.contentType === 'video' || item.contentType === 'short' || item.contentType === 'reel') && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="w-6 h-6 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[6px] border-l-gray-800 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5"></div>
                    </div>
                  </div>
                )}
                
                {/* Content type badge */}
                <div className="absolute top-1 right-1">
                  {item.contentType === 'video' && <Video className="w-3 h-3 text-white drop-shadow" />}
                  {item.contentType === 'short' && <div className="w-3 h-3 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">S</div>}
                  {item.contentType === 'reel' && <div className="w-3 h-3 bg-purple-500 rounded text-white text-xs flex items-center justify-center font-bold">R</div>}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-500 capitalize">
                  {item.platform} • {item.contentType} • {formatDate(item.createdAt || item.created_at)}
                  {item.projectId && (
                    <span className="ml-2 text-blue-600">
                      • Project #{item.projectId}
                    </span>
                  )}
                </p>
                <div className="flex items-center space-x-4 mt-1">
                  {item.metadata?.views && (
                    <span className="text-xs text-gray-400 flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      {item.metadata.views}
                    </span>
                  )}
                  {item.metadata?.likes && (
                    <span className="text-xs text-gray-400 flex items-center">
                      <Heart className="w-3 h-3 mr-1" />
                      {item.metadata.likes}
                    </span>
                  )}
                  {item.videoUrl && (
                    <span className="text-xs text-green-600 flex items-center">
                      <Video className="w-3 h-3 mr-1" />
                      Video
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={`text-xs font-medium ${getStatusColor(item.status)}`}>
                  {item.status === 'draft' ? 'Scheduled' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditContent(item.id)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleViewAnalytics(item.id)}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analytics
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicateContent(item.id)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteContent(item.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </CardContent>
      
      {/* Content Creation Modal */}
      <ContentCreationModal
        isOpen={isContentModalOpen}
        onClose={() => setIsContentModalOpen(false)}
        onContentCreated={(content) => {
          console.log('Content created:', content);
          refetch();
        }}
      />
    </Card>
  );
}
