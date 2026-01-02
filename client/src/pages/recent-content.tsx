import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Eye, Heart, MoreHorizontal, Plus, Search, Filter, Calendar, TrendingUp, Edit, BarChart3, Trash2, Copy } from "lucide-react";
import ContentCreationModal from "@/components/modals/ContentCreationModal";

export default function RecentContent() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Navigation handlers
  const handleEditContent = (contentId: string) => {
    setLocation(`/content-studio?id=${contentId}`);
  };

  const handleViewAnalytics = (contentId: string) => {
    setLocation(`/analytics?content=${contentId}`);
  };

  const duplicateContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      try {
        const response = await apiRequest('POST', `/api/content/${contentId}/duplicate`);
        return await response.json();
      } catch (primaryError) {
        // Fallback: duplicate via create if duplicate endpoint not available
        const cached = queryClient.getQueryData<any[]>(['/api/content']) || [];
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
      const previous = queryClient.getQueryData<any[]>(['/api/content']);
      if (previous && Array.isArray(previous)) {
        const source = previous.find((c) => String(c.id) === String(contentId));
        const optimisticCopy = source ? { ...source, id: `temp-${Date.now()}`, title: `${source.title} (Copy)`, status: 'draft' } : null;
        if (optimisticCopy) {
          queryClient.setQueryData<any[]>(['/api/content'], [optimisticCopy, ...previous]);
        }
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['/api/content'], ctx.previous);
      }
      toast({ title: "Duplicate failed", description: "Please try again.", variant: "destructive" });
    },
    onSuccess: (data) => {
      const created = (data && (data.content || data)) as any;
      if (created && created.id) {
        const prev = queryClient.getQueryData<any[]>(['/api/content']) || [];
        if (Array.isArray(prev)) {
          const next = [created, ...prev.filter((c) => String(c.id) !== String(created.id) && !String(c.id).startsWith('temp-'))];
          queryClient.setQueryData(['/api/content'], next);
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
      const previous = queryClient.getQueryData<any[]>(['/api/content']);
      if (previous && Array.isArray(previous)) {
        queryClient.setQueryData<any[]>(['/api/content'], previous.filter((c) => String(c.id) !== String(contentId)));
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['/api/content'], ctx.previous);
      }
      toast({ title: "Delete failed", description: "Please try again.", variant: "destructive" });
    },
    onSuccess: (_data, contentId) => {
      const prev = queryClient.getQueryData<any[]>(['/api/content']);
      if (prev && Array.isArray(prev)) {
        queryClient.setQueryData(['/api/content'], prev.filter((c) => String(c.id) !== String(contentId)));
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

  const { data: contentResponse, isLoading } = useQuery({
    queryKey: ['/api/content'],
    retry: false,
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found for content fetch, using test token for development');
        localStorage.setItem('token', 'test-token');
      }
      
      const response = await apiRequest('GET', '/api/content');
      return await response.json();
    }
  });

  // Extract content array from the API response
  let content: any[] = [];
  if (contentResponse) {
    if (Array.isArray(contentResponse)) {
      content = contentResponse;
    } else if (contentResponse.content && Array.isArray(contentResponse.content)) {
      content = contentResponse.content;
    }
  }

  // Filter content based on search and filters
  const filteredContent = content.filter((item: any) => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesPlatform = platformFilter === "all" || item.platform === platformFilter;
    
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformImage = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return '/youtube-icon.png';
      case 'instagram':
        return '/instagram-icon.png';
      case 'facebook':
        return '/facebook-icon.png';
      case 'linkedin':
        return '/linkedin-icon.png';
      default:
        return '/default-platform.png';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return '🎥';
      case 'instagram':
        return '📸';
      case 'facebook':
        return '📘';
      case 'linkedin':
        return '💼';
      default:
        return '📄';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <CardHeader className="p-6">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex space-x-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recent Content</h1>
            <p className="text-gray-600 mt-2">Manage and view all your content across platforms</p>
          </div>
          <Button 
            onClick={() => setIsContentModalOpen(true)}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Content
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">Total Content</p>
                  <p className="text-xl font-semibold text-gray-900">{content.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">Published</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {content.filter((item: any) => item.status === 'published').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Eye className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">Total Views</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {content.reduce((total: number, item: any) => total + (item.metadata?.views || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Heart className="w-5 h-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">Total Likes</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {content.reduce((total: number, item: any) => total + (item.metadata?.likes || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 mr-2" />
              Status: {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-full md:w-48">
              Platform: {platformFilter === 'all' ? 'All' : platformFilter.charAt(0).toUpperCase() + platformFilter.slice(1)}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content Grid */}
      {filteredContent.length === 0 ? (
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No content found</h3>
            <p className="text-gray-600 mb-6">
              {content.length === 0 
                ? "You haven't created any content yet. Start by creating your first piece of content."
                : "No content matches your current filters. Try adjusting your search or filters."
              }
            </p>
            {content.length === 0 && (
              <Button 
                onClick={() => setIsContentModalOpen(true)}
                className="bg-primary text-white hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Content
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map((item: any) => (
            <Card key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getPlatformIcon(item.platform)}</span>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {item.title}
                      </CardTitle>
                      <p className="text-sm text-gray-500 capitalize">
                        {item.platform} • {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
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
              </CardHeader>
              
              <CardContent className="p-6 pt-0">
                {/* Thumbnail (lazy) */}
                <img
                  src={item.thumbnailUrl || '/default-platform.png'}
                  alt="Content thumbnail"
                  loading="lazy"
                  decoding="async"
                  width={320}
                  height={180}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="w-full h-40 object-cover rounded-md mb-4"
                />
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {item.description || "No description available"}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <Badge className={`text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Badge>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    {item.metadata?.views && (
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {item.metadata.views.toLocaleString()}
                      </span>
                    )}
                    {item.metadata?.likes && (
                      <span className="flex items-center">
                        <Heart className="w-3 h-3 mr-1" />
                        {item.metadata.likes.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEditContent(item.id)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewAnalytics(item.id)}
                  >
                    Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Content Creation Modal */}
      <ContentCreationModal
        isOpen={isContentModalOpen}
        onClose={() => setIsContentModalOpen(false)}
        onContentCreated={(content) => {
          console.log('Content created:', content);
        }}
      />
    </div>
  );
} 