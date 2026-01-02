import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Upload, Download, Trash2, Search, Filter, Image, Video, FileText, Folder } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { useState, useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

interface Asset {
  id: string;
  filename: string;
  originalName: string;
  mimeType?: string;
  mimetype?: string; // Backend uses this field
  size: number;
  url: string;
  category?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
    thumbnail?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  uploadedAt?: string; // Backend uses this field
}

export default function Assets() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Predefined categories that should always be available
  const predefinedCategories = [
    'general',
    'thumbnails', 
    'videos',
    'images',
    'documents',
    'templates',
    'audio',
    'other'
  ];

  const { data: assets, isLoading, refetch } = useQuery({
    queryKey: ['/api/assets'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/assets');
      return await response.json();
    },
    retry: false,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMimeType = (asset: Asset): string => {
    return (asset.mimeType as string) || (asset.mimetype as string) || '';
  };

  const getAssetIcon = (asset: Asset) => {
    const mimeType = getMimeType(asset);
    if (!mimeType) return <FileText className="w-8 h-8 text-gray-500" />;
    
    if (mimeType.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-500" />;
    } else if (mimeType.startsWith('video/')) {
      return <Video className="w-8 h-8 text-purple-500" />;
    } else if (mimeType.startsWith('text/')) {
      return <FileText className="w-8 h-8 text-green-500" />;
    } else {
      return <FileText className="w-8 h-8 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category?: string) => {
    if (!category) return <Folder className="w-4 h-4" />;
    
    switch (category.toLowerCase()) {
      case 'thumbnails':
      case 'images':
        return <Image className="w-4 h-4" />;
      case 'videos':
        return <Video className="w-4 h-4" />;
      case 'templates':
      case 'documents':
        return <FileText className="w-4 h-4" />;
      case 'audio':
        return <FileText className="w-4 h-4" />;
      case 'general':
      case 'other':
      default:
        return <Folder className="w-4 h-4" />;
    }
  };

  const handleDelete = async (assetId: string) => {
    try {
      await apiRequest('DELETE', `/api/assets/${assetId}`);
      refetch();
      toast({
        title: "Asset deleted",
        description: "The asset has been removed successfully.",
      });
    } catch (error) {
      if (isUnauthorizedError(error as Error)) {
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
        description: "Failed to delete asset.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = (asset: Asset) => {
    const link = document.createElement('a');
    link.href = asset.url || '#';
    link.download = asset.originalName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: `${asset.originalName || 'File'} is being downloaded.`,
    });
  };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Automatically determine category based on file type
      let category = 'general';
      if (file.type.startsWith('image/')) {
        category = 'images';
      } else if (file.type.startsWith('video/')) {
        category = 'videos';
      } else if (file.type.startsWith('audio/')) {
        category = 'audio';
      } else if (file.type === 'application/pdf' || file.type.startsWith('text/')) {
        category = 'documents';
      }
      
      console.log('Uploading file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        category: category
      });
      
      formData.append('category', category);

      const response = await apiRequest('POST', '/api/upload', formData);

      const result = await response.json();

             if (result.success) {
         toast({
           title: "Upload successful",
           description: `${file.name} has been uploaded successfully as ${category} category.`,
         });
         refetch(); // Refresh the assets list
       } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const displayAssets = (assets?.assets as Asset[]) || [];
  
  // Debug logging for filtering
  console.log('Filtering assets:', {
    totalAssets: displayAssets.length,
    categoryFilter,
    searchQuery,
    assets: displayAssets.map(a => ({ name: a.originalName, category: a.category }))
  });
  
  const filteredAssets = displayAssets.filter((asset: Asset) => {
    const matchesSearch = (asset.originalName?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                         (asset.filename?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    // Improved category matching with better debugging
    let matchesCategory = true;
    if (categoryFilter !== "all") {
      const assetCategory = asset.category?.toLowerCase() || 'general';
      const filterCategory = categoryFilter.toLowerCase();
      matchesCategory = assetCategory === filterCategory;
      
      // Debug logging for category filtering
      console.log(`Asset: ${asset.originalName}`);
      console.log(`  - Asset category: "${asset.category}" (normalized: "${assetCategory}")`);
      console.log(`  - Filter category: "${categoryFilter}" (normalized: "${filterCategory}")`);
      console.log(`  - Matches: ${matchesCategory}`);
    }
    
    return matchesSearch && matchesCategory;
  });
  
  console.log('Filtered assets count:', filteredAssets.length);

  // Get categories from uploaded files
  const uploadedCategories = Array.from(new Set(displayAssets.map((asset: Asset) => asset.category).filter(Boolean)));
  
  // Combine uploaded categories with predefined ones, removing duplicates and ensuring all are strings
  const categories = Array.from(new Set([...uploadedCategories, ...predefinedCategories]))
    .filter((category): category is string => Boolean(category))
    .sort();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar (desktop) */}
      {!isMobile && <Sidebar />}

      {/* Mobile Sidebar Drawer */}
      {isMobile && (
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetContent side="left" className="p-0 w-[18rem]">
            <Sidebar />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        onTouchStart={(e) => {
          if (!isMobile) return;
          const t = e.touches[0];
          touchStartXRef.current = t.clientX;
          touchStartYRef.current = t.clientY;
        }}
        onTouchEnd={(e) => {
          if (!isMobile) return;
          const sx = touchStartXRef.current;
          const sy = touchStartYRef.current;
          touchStartXRef.current = null;
          touchStartYRef.current = null;
          if (sx == null || sy == null) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - sx;
          const dy = Math.abs(t.clientY - sy);
          const edgeSwipe = sx < 30;
          const horizontalEnough = Math.abs(dx) > 60 && dy < 40;
          if (edgeSwipe && horizontalEnough && dx > 0) setIsMobileSidebarOpen(true);
          if (isMobileSidebarOpen && horizontalEnough && dx < -60) setIsMobileSidebarOpen(false);
        }}
      >
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open navigation"
                  className="md:hidden"
                  onClick={() => setIsMobileSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <h2 className="text-2xl font-bold text-gray-900">Assets</h2>
              <p className="text-gray-600">Manage your uploaded files and media assets.</p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button 
                className="flex items-center space-x-2 active:scale-[0.98] touch-manipulation"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4" />
                <span>{isUploading ? "Uploading..." : "Upload Asset"}</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,application/pdf,text/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </header>

        {/* Assets Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Filters */}
          <div className="mb-6 flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(category)}
                      <span className="capitalize">{category || 'general'}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <Skeleton className="w-full h-32 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <div className="flex space-x-2">
                          <Skeleton className="h-6 w-6" />
                          <Skeleton className="h-6 w-6" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredAssets.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
                <p className="text-gray-500">
                  {searchQuery || categoryFilter !== "all" 
                    ? "Try adjusting your search or filters"
                    : "Upload your first asset to get started"
                  }
                </p>
              </div>
            ) : (
              filteredAssets.map((asset: Asset) => (
                <Card key={asset.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Asset Preview */}
                      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        {getMimeType(asset).startsWith('image/') ? (
                          <img
                            src={asset.url}
                            alt={asset.originalName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                              ((e.currentTarget as HTMLElement).nextElementSibling as HTMLElement)!.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="absolute inset-0 flex items-center justify-center" style={{ display: getMimeType(asset).startsWith('image/') ? 'none' : 'flex' }}>
                          {getAssetIcon(asset)}
                        </div>
                      </div>

                      {/* Asset Info */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {asset.originalName || 'Untitled'}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(asset.size || 0)}
                            </p>
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            <div className="flex items-center space-x-1">
                              {getCategoryIcon(asset.category)}
                              <span className="capitalize">{asset.category || 'general'}</span>
                            </div>
                          </Badge>
                          {asset.metadata?.width && asset.metadata?.height && (
                            <Badge variant="outline" className="text-xs">
                              {asset.metadata.width}×{asset.metadata.height}
                            </Badge>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownload(asset)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(asset.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
} 