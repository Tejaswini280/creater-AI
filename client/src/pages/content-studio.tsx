import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Video, FileText, Mic, Image, Calendar, Youtube, Instagram, Facebook, Edit, FolderOpen } from "lucide-react";
import AIGenerationModal from "@/components/modals/AIGenerationModal";
import QuickActionsModal from "@/components/modals/QuickActionsModal";
import SchedulingModal from "@/components/modals/SchedulingModal";
import ContentWorkspaceModal from "@/components/modals/ContentWorkspaceModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ContentStudio() {
  const { toast } = useToast();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["youtube"]);
  const [contentType, setContentType] = useState("video");
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
    platform: "youtube",
    contentType: "video",
    status: "draft",
    projectId: undefined as number | undefined
  });
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  
  // Project context state
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [projectLoading, setProjectLoading] = useState(false);

  // Quick Actions Modal States
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isQuickActionsModalOpen, setIsQuickActionsModalOpen] = useState(false);
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);
  const [activeQuickAction, setActiveQuickAction] = useState<'createVideo' | 'aiVoiceover' | 'brandKit' | 'nicheFinder' | null>(null);
  
  // Content Workspace Modal States
  const [isContentWorkspaceOpen, setIsContentWorkspaceOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);

  // Handle URL parameters for editing content and project filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const contentId = urlParams.get('id');
    const projectId = urlParams.get('projectId');
    
    if (contentId) {
      setEditingContentId(contentId);
    }
    
    if (projectId) {
      const projectIdNum = parseInt(projectId);
      // Store projectId for content creation
      setNewContent(prev => ({ ...prev, projectId: projectIdNum }));
      
      // Fetch project details for header display
      fetchProjectDetails(projectIdNum);
    }
  }, []);
  
  // Fetch project details when projectId changes
  const fetchProjectDetails = async (projectId: number) => {
    setProjectLoading(true);
    try {
      const response = await apiRequest('GET', `/api/projects/${projectId}`);
      if (response.ok) {
        const projectData = await response.json();
        if (projectData.success && projectData.project) {
          setCurrentProject(projectData.project);
        } else {
          console.warn('Project not found or invalid response:', projectData);
          // Clear project context if project doesn't exist
          setCurrentProject(null);
          setNewContent(prev => ({ ...prev, projectId: undefined }));
          // Remove projectId from URL
          const url = new URL(window.location.href);
          url.searchParams.delete('projectId');
          window.history.replaceState({}, '', url.toString());
        }
      } else if (response.status === 404) {
        console.warn('Project not found (404):', projectId);
        // Clear project context if project doesn't exist
        setCurrentProject(null);
        setNewContent(prev => ({ ...prev, projectId: undefined }));
        // Remove projectId from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('projectId');
        window.history.replaceState({}, '', url.toString());
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
      // Clear project context on error
      setCurrentProject(null);
      setNewContent(prev => ({ ...prev, projectId: undefined }));
    } finally {
      setProjectLoading(false);
    }
  };

  const { data: contentResponse, isLoading } = useQuery({
    queryKey: ['/api/content', newContent.projectId],
    retry: false,
    queryFn: async () => {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔍 No token found for content fetch, using test token for development');
        localStorage.setItem('token', 'test-token');
      }
      
      // If we have a projectId, fetch project-specific content ONLY
      if (newContent.projectId) {
        try {
          console.log('🔍 Fetching project-specific content for project:', newContent.projectId);
          const response = await apiRequest('GET', `/api/projects/${newContent.projectId}/content`);
          if (response.ok) {
            const data = await response.json();
            console.log('🔍 Project content fetched successfully:', data);
            return data;
          } else {
            console.error('🔍 Failed to fetch project content:', response.status, response.statusText);
            // Don't fallback to all content - return empty result instead
            return { content: [], success: true, total: 0 };
          }
        } catch (error) {
          console.error('🔍 Error fetching project content:', error);
          // Don't fallback to all content - return empty result instead
          return { content: [], success: true, total: 0 };
        }
      } else {
        // Only fetch all content when no projectId is specified
        console.log('🔍 No projectId specified, fetching all content');
        const response = await apiRequest('GET', '/api/content');
        return await response.json();
      }
    }
  });

  // Extract content array from the API response
  // Handle both cases: proper response structure and direct array response
  let content: any[] = [];
  if (contentResponse) {
    if (Array.isArray(contentResponse)) {
      // Direct array response (fallback case)
      content = contentResponse;
    } else if (contentResponse.content && Array.isArray(contentResponse.content)) {
      // Proper response structure
      content = contentResponse.content;
    }
  }
  
  // Additional project ID validation filter to ensure only project content is shown
  let filteredContent = content;
  if (newContent.projectId) {
    filteredContent = content.filter((item: any) => {
      // Ensure content belongs to this project - handle both string and number IDs
      const itemProjectId = item.projectId;
      const currentProjectId = newContent.projectId;
      
      // Convert both to strings for comparison to handle type mismatches
      const belongsToProject = itemProjectId?.toString() === currentProjectId?.toString();
      
      if (!belongsToProject) {
        console.warn('🔍 Content item filtered out - wrong project:', {
          contentId: item.id,
          contentProjectId: itemProjectId,
          currentProjectId: currentProjectId,
          title: item.title,
          comparison: `${itemProjectId?.toString()} === ${currentProjectId?.toString()}`
        });
      }
      return belongsToProject;
    });
    
    console.log('🔍 Content filtering results:', {
      originalCount: content.length,
      filteredCount: filteredContent.length,
      projectId: newContent.projectId
    });
  }
  
  // Debug logging for project filtering
  console.log('🔍 Content Studio content debug:', {
    projectId: newContent.projectId,
    contentResponse,
    originalContent: content,
    filteredContent,
    contentLength: content.length,
    filteredLength: filteredContent.length
  });

  // Populate form when editing content
  useEffect(() => {
    if (editingContentId && filteredContent.length > 0) {
      const contentToEdit = filteredContent.find(item => item.id.toString() === editingContentId);
      if (contentToEdit) {
        setNewContent({
          title: contentToEdit.title || "",
          description: contentToEdit.description || "",
          platform: contentToEdit.platform || "youtube",
          contentType: contentToEdit.contentType || "video",
          status: contentToEdit.status || "draft",
          projectId: newContent.projectId // Preserve projectId
        });
        setSelectedPlatforms([contentToEdit.platform || "youtube"]);
        setContentType(contentToEdit.contentType || "video");
      }
    }
  }, [editingContentId, filteredContent]);

  const createContentMutation = useMutation({
    mutationFn: async (contentData: any) => {
      console.log('🔍 Creating content with data:', contentData);
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      console.log('🔍 Token from localStorage:', token);
      
      if (!token) {
        console.log('🔍 No token found, using test token for development');
        // For development/testing, use a test token if no real token exists
        localStorage.setItem('token', 'test-token');
      }
      
      const response = await apiRequest('POST', '/api/content', contentData);
      console.log('🔍 API response status:', response.status);
      const responseData = await response.json();
      console.log('🔍 API response data:', responseData);
      return responseData;
    },
    onSuccess: (data) => {
      console.log('Content creation successful:', data);
      toast({
        title: "Content Created!",
        description: "Your content has been saved as a draft.",
      });
      // Invalidate project-specific content queries
      if (newContent.projectId) {
        queryClient.invalidateQueries({ queryKey: ['/api/content', newContent.projectId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      }
      setNewContent({
        title: "",
        description: "",
        platform: "youtube",
        contentType: "video",
        status: "draft",
        projectId: newContent.projectId // Preserve projectId
      });
      setEditingContentId(null);
    },
    onError: (error: any) => {
      console.error('Content creation error:', error);
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateContentMutation = useMutation({
    mutationFn: async (contentData: any) => {
      console.log('🔍 Updating content with data:', contentData);
      
      const token = localStorage.getItem('token');
      if (!token) {
        localStorage.setItem('token', 'test-token');
      }
      
      const response = await apiRequest('PUT', `/api/content/${editingContentId}`, contentData);
      console.log('🔍 Update API response status:', response.status);
      const responseData = await response.json();
      console.log('🔍 Update API response data:', responseData);
      return responseData;
    },
    onSuccess: (data) => {
      console.log('Content update successful:', data);
      toast({
        title: "Content Updated!",
        description: "Your content has been updated successfully.",
      });
      // Invalidate project-specific content queries
      if (newContent.projectId) {
        queryClient.invalidateQueries({ queryKey: ['/api/content', newContent.projectId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      }
      setNewContent({
        title: "",
        description: "",
        platform: "youtube",
        contentType: "video",
        status: "draft",
        projectId: newContent.projectId
      });
      setEditingContentId(null);
    },
    onError: (error: any) => {
      console.error('Content update error:', error);
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const publishContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      console.log('🔍 Publishing content with ID:', contentId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        localStorage.setItem('token', 'test-token');
      }
      
      const response = await apiRequest('PUT', `/api/content/${contentId}/publish`);
      console.log('🔍 Publish API response status:', response.status);
      const responseData = await response.json();
      console.log('🔍 Publish API response data:', responseData);
      return responseData;
    },
    onSuccess: (data) => {
      console.log('Content published successful:', data);
      console.log('🔍 Invalidating content queries...');
      // Invalidate project-specific content queries
      if (newContent.projectId) {
        queryClient.invalidateQueries({ queryKey: ['/api/content', newContent.projectId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      }
      console.log('🔍 Content queries invalidated');
      toast({
        title: "Content Published!",
        description: "Your content has been published successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Content publish error:', error);
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to publish content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateContent = () => {
    if (!newContent.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your content.",
        variant: "destructive",
      });
      return;
    }

    if (editingContentId) {
      updateContentMutation.mutate(newContent);
    } else {
      createContentMutation.mutate(newContent);
    }
  };

  const handleEditContent = (contentItem: any) => {
    setEditingContentId(contentItem.id);
    setNewContent({
      title: contentItem.title || "",
      description: contentItem.description || "",
      platform: contentItem.platform || "youtube",
      contentType: contentItem.contentType || "video",
      status: contentItem.status || "draft",
      projectId: contentItem.projectId || newContent.projectId // Preserve projectId
    });
    setSelectedPlatforms([contentItem.platform || "youtube"]);
    setContentType(contentItem.contentType || "video");
  };

  const handlePublishContent = (contentId: string) => {
    publishContentMutation.mutate(contentId);
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
        return <Video className="w-5 h-5" />;
    }
  };

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

  // Quick Actions Handlers
  const handleGenerateScript = () => {
    setIsAIModalOpen(true);
  };

  const handleAIVoiceover = () => {
    setActiveQuickAction('aiVoiceover');
    setIsQuickActionsModalOpen(true);
  };

  const handleCreateThumbnail = () => {
    console.log('🎨 Generate Thumbnail button clicked in Content Studio');
    console.log('📊 Current newContent:', newContent);
    
    // Create a new content item with the current form data for thumbnail generation
    const thumbnailContent = {
      id: `temp-${Date.now()}`,
      title: newContent.title || "Untitled Content",
      description: newContent.description || "",
      platform: newContent.platform || "youtube",
      contentType: newContent.contentType || "video",
      status: "draft",
      thumbnailUrl: null
    };
    
    console.log('🖼️ Created thumbnail content:', thumbnailContent);
    setSelectedContent(thumbnailContent);
    setIsContentWorkspaceOpen(true);
  };

  const handleSchedulePost = () => {
    setIsSchedulingModalOpen(true);
  };

  const handleOpenContentWorkspace = (content: any) => {
    setSelectedContent(content);
    setIsContentWorkspaceOpen(true);
  };

  const handleContentUpdate = (updatedContent: any) => {
    // Update the content in the list
    // Invalidate project-specific content queries
    if (newContent.projectId) {
      queryClient.invalidateQueries({ queryKey: ['/api/content', newContent.projectId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
    }
    setSelectedContent(updatedContent);
  };

  const PLATFORM_OPTIONS = [
    { value: "youtube", label: "YouTube" },
    { value: "instagram", label: "Instagram" },
    { value: "facebook", label: "Facebook" },
  ];

  const ALL_OPTION = { value: "all", label: "All Platforms" } as const;

  const getPlatformLabel = (value: string) => {
    const found = PLATFORM_OPTIONS.find(p => p.value === value);
    if (found) return found.label;
    if (value === "all") return ALL_OPTION.label;
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const togglePlatform = (value: string) => {
    setSelectedPlatforms((prev) => {
      const next = prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value];
      if (next.length > 0) {
        setNewContent((c) => ({ ...c, platform: next[0] }));
      }
      return next;
    });
  };

  // Apply platform filtering to the already project-filtered content
  const platformFilteredContent = filteredContent
    .filter((item: any) => selectedPlatform === 'all' || item.platform?.toLowerCase() === selectedPlatform);

  const availablePlatforms: string[] = Array.from(
    new Set([
      ...PLATFORM_OPTIONS.map(p => p.value),
      ...filteredContent.map((c: any) => (c.platform || "").toLowerCase()).filter(Boolean)
    ])
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {projectLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  Loading Project...
                </div>
              ) : currentProject ? (
                `${currentProject.name} - Content Studio`
              ) : (
                'Content Studio'
              )}
            </h1>
            <p className="text-gray-600">
              {projectLoading ? (
                'Loading project details...'
              ) : currentProject ? (
                `Create, manage, and publish content for ${currentProject.name}`
              ) : (
                'Create, manage, and publish your content across all platforms'
              )}
            </p>
            {newContent.projectId && (
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="outline" className="text-sm px-3 py-1 bg-blue-50 border-blue-200 text-blue-700">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Working in {currentProject ? currentProject.name : `Project #${newContent.projectId}`}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNewContent(prev => ({ ...prev, projectId: undefined }));
                    setCurrentProject(null);
                    // Remove projectId from URL
                    const url = new URL(window.location.href);
                    url.searchParams.delete('projectId');
                    window.history.replaceState({}, '', url.toString());
                  }}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Exit Project
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Content Creation Form */}
                  <div className="lg:col-span-1">
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      {editingContentId ? (
                        <>
                          <Edit className="w-5 h-5 mr-2" />
                          Edit Content
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5 mr-2" />
                          Create New Content
                        </>
                      )}
                    </CardTitle>
                    {newContent.projectId && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-sm px-2 py-1 bg-blue-50 border-blue-200 text-blue-700">
                          <FolderOpen className="w-4 h-4 mr-1" />
                          {projectLoading ? 'Loading...' : currentProject ? currentProject.name : `Project #${newContent.projectId}`} Content
                        </Badge>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Title</label>
                      <Input
                        placeholder="Enter content title..."
                        value={newContent.title}
                        onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Description</label>
                      <Textarea
                        placeholder="Describe your content..."
                        value={newContent.description}
                        onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Platforms</label>
                      <div className="flex flex-wrap gap-3">
                        {PLATFORM_OPTIONS.map((p) => (
                          <label key={p.value} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={selectedPlatforms.includes(p.value)}
                              onCheckedChange={() => togglePlatform(p.value)}
                            />
                            {p.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Content Type</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "video", label: "Video" },
                          { value: "short", label: "Short/Reel" },
                          { value: "image", label: "Image Post" },
                          { value: "text", label: "Text Post" },
                        ].map((ct) => (
                          <Button key={ct.value} variant={newContent.contentType === ct.value ? "default" : "outline"} size="sm" onClick={() => setNewContent({ ...newContent, contentType: ct.value })}>
                            {ct.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={async () => {
                        if (!newContent.title.trim()) {
                          toast({ title: "Error", description: "Please enter a title for your content.", variant: "destructive" });
                          return;
                        }
                        if (editingContentId) {
                          updateContentMutation.mutate(newContent);
                          return;
                        }

                        // Navigate to recorder page with context
                        const params = new URLSearchParams();
                        if (newContent.title) params.set('title', newContent.title);
                        if (newContent.description) params.set('description', newContent.description);
                        if (newContent.platform) params.set('platform', newContent.platform);
                        if (newContent.contentType) params.set('contentType', newContent.contentType);
                        if (newContent.projectId) params.set('projectId', newContent.projectId.toString());
                        params.set('returnTo', 'content-studio'); // Add return navigation

                        const recorderUrl = `/recorder${params.toString() ? '?' + params.toString() : ''}`;
                        window.location.href = recorderUrl;
                      }}
                      className="w-full"
                      disabled={createContentMutation.isPending || updateContentMutation.isPending}
                    >
                      {(createContentMutation.isPending || updateContentMutation.isPending) ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editingContentId ? 'Updating...' : 'Creating...'}
                        </div>
                      ) : (
                        <>
                          {editingContentId ? (
                            <>
                              <Edit className="w-4 h-4 mr-2" />
                              Update Content
                            </>
                          ) : (
                            <>
                              <Video className="w-4 h-4 mr-2" />
                              Start Recording
                            </>
                          )}
                        </>
                      )}
                    </Button>

                    {editingContentId && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingContentId(null);
                          setNewContent({
                            title: "",
                            description: "",
                            platform: "youtube",
                            contentType: "video",
                            status: "draft",
                            projectId: newContent.projectId
                          });
                        }}
                        className="w-full"
                      >
                        Cancel Edit
                      </Button>
                    )}

                    {/* Quick Actions */}
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={handleGenerateScript}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Generate Script
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={handleAIVoiceover}
                        >
                          <Mic className="w-4 h-4 mr-2" />
                          AI Voiceover
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={handleCreateThumbnail}
                        >
                          <Image className="w-4 h-4 mr-2" />
                          Generate Thumbnail
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={handleSchedulePost}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule Post
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                  </div>

                  {/* Content List */}
                  <div className="lg:col-span-2">
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <CardTitle>Your Content</CardTitle>
                      <div className="w-full sm:w-auto">
                        <Select value={selectedPlatform} onValueChange={(v) => setSelectedPlatform(v || 'all')}>
                          <SelectTrigger className="w-56">
                            <div className="flex items-center gap-2">
                              {selectedPlatform === "youtube" && <Youtube className="w-4 h-4 text-red-600" />}
                              {selectedPlatform === "instagram" && <Instagram className="w-4 h-4 text-pink-600" />}
                              {selectedPlatform === "facebook" && <Facebook className="w-4 h-4 text-blue-600" />}
                              {selectedPlatform === "all" && <Video className="w-4 h-4 text-gray-500" />}
                              <SelectValue placeholder={ALL_OPTION.label} />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ALL_OPTION.value}>{ALL_OPTION.label}</SelectItem>
                            {availablePlatforms.map((p) => (
                              <SelectItem key={p} value={p}>{getPlatformLabel(p)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                            <div className="w-16 h-12 bg-gray-200 rounded animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : !filteredContent || filteredContent.length === 0 ? (
                      <div className="text-center py-12">
                        <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {newContent.projectId ? 'No content in this project yet' : 'No content yet'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                          {newContent.projectId 
                            ? `Create your first piece of content for ${currentProject?.name || `Project #${newContent.projectId}`}`
                            : 'Create your first piece of content to get started'
                          }
                        </p>
                        <Button onClick={() => setNewContent({ ...newContent, title: "My First Video", projectId: newContent.projectId })}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Content
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {platformFilteredContent.map((item: any) => (
                          <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                            <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              {getPlatformIcon(item.platform)}
                            </div>
                            <div className="flex-1">
                              <h4 
                                className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => handleOpenContentWorkspace(item)}
                              >
                                {item.title}
                              </h4>
                              <p className="text-sm text-gray-500 capitalize">
                                {item.platform} • {item.contentType}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                                  {item.status}
                                </Badge>
                                {item.scheduledAt && (
                                  <span className="text-xs text-gray-500">
                                    Scheduled: {new Date(item.scheduledAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditContent(item)}
                                disabled={publishContentMutation.isPending}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handlePublishContent(item.id)}
                                disabled={publishContentMutation.isPending}
                              >
                                {publishContentMutation.isPending ? 'Publishing...' : 'Publish'}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                  </div>
        </div>

        {/* Quick Actions Modals */}
      <AIGenerationModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        initialTopic=""
      />
      
      <QuickActionsModal
        isOpen={isQuickActionsModalOpen}
        onClose={() => {
          setIsQuickActionsModalOpen(false);
          setActiveQuickAction(null);
        }}
        actionType={activeQuickAction}
      />
      
      <SchedulingModal
        isOpen={isSchedulingModalOpen}
        onClose={() => setIsSchedulingModalOpen(false)}
        editingContent={null}
        onScheduled={(scheduledContent) => {
          toast({
            title: "Content Scheduled!",
            description: "Your content has been scheduled successfully.",
          });
          setIsSchedulingModalOpen(false);
        }}
      />
      
      {/* Content Workspace Modal */}
      <ContentWorkspaceModal
        isOpen={isContentWorkspaceOpen}
        onClose={() => setIsContentWorkspaceOpen(false)}
        content={selectedContent}
        onContentUpdate={handleContentUpdate}
      />
      </div>
    </div>
  );
}