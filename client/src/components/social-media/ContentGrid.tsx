import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Grid3X3, 
  List, 
  Search, 
  Calendar,
  Plus,
  RefreshCw
} from 'lucide-react';
import { ContentCard, ContentItem } from './ContentCard';
import { useToast } from '@/hooks/use-toast';

interface ContentGridProps {
  contents: ContentItem[];
  onContentAction: (contentId: number, action: string, data?: any) => Promise<void>;
  onExtendProject: (days: number) => Promise<void>;
  onRefresh: () => Promise<void>;
  isProjectActive?: boolean;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'draft' | 'scheduled' | 'published' | 'paused' | 'deleted';
type PlatformFilter = 'all' | 'instagram' | 'youtube' | 'tiktok' | 'linkedin' | 'facebook' | 'twitter';

export const ContentGrid: React.FC<ContentGridProps> = ({
  contents,
  onContentAction,
  onExtendProject,
  onRefresh,
  isProjectActive = true,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Filter and search contents
  const filteredContents = useMemo(() => {
    return contents.filter(content => {
      const matchesSearch = content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          content.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || content.status === statusFilter;
      const matchesPlatform = platformFilter === 'all' || content.platform.toLowerCase() === platformFilter;
      
      return matchesSearch && matchesStatus && matchesPlatform;
    });
  }, [contents, searchTerm, statusFilter, platformFilter]);

  // Group contents by day for better organization
  const groupedContents = useMemo(() => {
    const groups: { [key: number]: ContentItem[] } = {};
    filteredContents.forEach(content => {
      if (!groups[content.dayNumber]) {
        groups[content.dayNumber] = [];
      }
      groups[content.dayNumber].push(content);
    });
    return groups;
  }, [filteredContents]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast({
        title: "Refreshed",
        description: "Content has been refreshed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh content",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleContentAction = async (content: ContentItem, action: string, data?: any) => {
    try {
      await onContentAction(content.id, action, data);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} content`,
        variant: "destructive"
      });
    }
  };

  const getStatusCounts = () => {
    const counts = contents.reduce((acc, content) => {
      acc[content.status] = (acc[content.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Content Calendar</h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {filteredContents.length} content{filteredContents.length !== 1 ? 's' : ''}
            </Badge>
            {!isProjectActive && (
              <Badge variant="secondary" className="text-sm">
                Project Inactive
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExtendProject(7)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Extend +7 Days
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status ({contents.length})</SelectItem>
              <SelectItem value="draft">Draft ({statusCounts.draft || 0})</SelectItem>
              <SelectItem value="scheduled">Scheduled ({statusCounts.scheduled || 0})</SelectItem>
              <SelectItem value="published">Published ({statusCounts.published || 0})</SelectItem>
              <SelectItem value="paused">Paused ({statusCounts.paused || 0})</SelectItem>
              <SelectItem value="deleted">Deleted ({statusCounts.deleted || 0})</SelectItem>
            </SelectContent>
          </Select>

          {/* Platform Filter */}
          <Select value={platformFilter} onValueChange={(value: PlatformFilter) => setPlatformFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content Display */}
      <div className="space-y-6">
        {Object.keys(groupedContents).length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' || platformFilter !== 'all'
                ? 'Try adjusting your filters to see more content.'
                : 'Create your first content to get started.'}
            </p>
            {!searchTerm && statusFilter === 'all' && platformFilter === 'all' && (
              <Button onClick={() => onExtendProject(7)}>
                <Plus className="h-4 w-4 mr-2" />
                Generate Content
              </Button>
            )}
          </div>
        ) : (
          Object.entries(groupedContents)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([dayNumber, dayContents]) => (
              <div key={dayNumber} className="space-y-4">
                {/* Day Header */}
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Day {dayNumber}
                  </h3>
                  <Badge variant="outline" className="text-sm">
                    {dayContents.length} content{dayContents.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Content Cards */}
                <div className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'space-y-4'
                }>
                  <AnimatePresence>
                    {dayContents.map((content) => (
                      <ContentCard
                        key={content.id}
                        content={content}
                        onView={(content) => handleContentAction(content, 'view')}
                        onEdit={(content) => handleContentAction(content, 'edit')}
                        onRecreate={(content) => handleContentAction(content, 'recreate')}
                        onRegenerate={(content) => handleContentAction(content, 'regenerate')}
                        onUpdate={(content) => handleContentAction(content, 'update')}
                        onStop={(content) => handleContentAction(content, 'stop')}
                        onPlay={(content) => handleContentAction(content, 'play')}
                        onPause={(content) => handleContentAction(content, 'pause')}
                        onDelete={(content) => handleContentAction(content, 'delete')}
                        isProjectActive={isProjectActive}
                        className={viewMode === 'list' ? 'max-w-4xl' : ''}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default ContentGrid;
