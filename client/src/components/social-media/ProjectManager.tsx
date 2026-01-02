import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Play,
  Pause,
  Edit,
  Trash2,
  Calendar,
  Eye,
  EyeOff,
  Clock,
  Users,
  Target,
  MoreVertical,
  Archive,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import EnhancedProjectDetailsModal from '@/components/modals/EnhancedProjectDetailsModal';
import { projectApi, Project } from '@/lib/socialMediaApi';
import EnhancedProjectCreationFlow from './EnhancedProjectCreationFlow';

// Using Project type from socialMediaApi

interface ProjectManagerProps {
  projects?: Project[];
  onProjectUpdate?: (project: Project) => void;
  onProjectDelete?: (projectId: string) => void;
}

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  archived: 'bg-gray-100 text-gray-800'
};

const STATUS_ICONS = {
  active: Play,
  paused: Pause,
  completed: Calendar,
  archived: Archive
};

export default function ProjectManager({
  projects: propProjects,
  onProjectUpdate
}: ProjectManagerProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const queryClient = useQueryClient();

  // Fetch projects using React Query
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectApi.getProjects(),
    initialData: propProjects || [],
    enabled: !propProjects, // Only fetch if no projects prop provided
  });

  // Mutations for project operations

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Project> }) =>
      projectApi.updateProject(id, updates),
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onProjectUpdate?.(updatedProject);
      if (selectedProject?.id === updatedProject.id) {
        setSelectedProject(updatedProject);
      }
    },
    onError: (error) => {
      console.error('Error updating project:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: projectApi.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project Deleted",
        description: "Project has been deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting project:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter projects based on search and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Handle project status change
  const handleStatusChange = (projectId: number, newStatus: Project['status']) => {
    updateProjectMutation.mutate({ id: projectId, updates: { status: newStatus } });
  };

  // Handle project extension
  const handleExtendProject = () => {
    // For now, just show a toast. In real implementation, you'd have duration field
    toast({
      title: "Feature Coming Soon",
      description: "Project extension will be available in the next update",
    });
  };

  // Handle project visibility toggle
  const handleVisibilityToggle = (projectId: number, isPublic: boolean) => {
    updateProjectMutation.mutate({ id: projectId, updates: { isPublic } });
  };

  // Handle project deletion
  const handleProjectDelete = (projectId: number) => {
    deleteProjectMutation.mutate(projectId);
  };

  // Project Card Component
  const ProjectCard = ({ project }: { project: Project }) => {
    const StatusIcon = STATUS_ICONS[project.status as keyof typeof STATUS_ICONS] || STATUS_ICONS.active;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold">{project.name}</h3>
              <Badge className={`text-xs ${STATUS_COLORS[project.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.active}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {project.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>

            <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{project.estimatedDuration || 'Ongoing'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{project.platform || 'Multiple'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Target className="h-4 w-4" />
                <span>{project.type}</span>
              </div>
            </div>

            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {project.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {project.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{project.tags.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            <div className="text-sm text-gray-600">
              Created {format(new Date(project.createdAt), 'MMM d, yyyy')}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedProject(project)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setEditingProject(project);
                setShowEditModal(true);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Project
              </DropdownMenuItem>
              {project.status === 'active' && (
                <DropdownMenuItem onClick={() => handleStatusChange(project.id, 'paused')}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Project
                </DropdownMenuItem>
              )}
              {project.status === 'paused' && (
                <DropdownMenuItem onClick={() => handleStatusChange(project.id, 'active')}>
                  <Play className="h-4 w-4 mr-2" />
                  Resume Project
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleExtendProject}>
                <Calendar className="h-4 w-4 mr-2" />
                Extend by 7 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleVisibilityToggle(project.id, !project.isPublic)}>
                {project.isPublic ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {project.isPublic ? 'Make Private' : 'Make Public'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleProjectDelete(project.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedProject(project)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              View Calendar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingProject(project);
                setShowEditModal(true);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
          
          <div className="flex items-center space-x-1">
            {project.status === 'active' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange(project.id, 'paused')}
              >
                <Pause className="h-4 w-4" />
              </Button>
            )}
            {project.status === 'paused' && (
              <Button
                size="sm"
                onClick={() => handleStatusChange(project.id, 'active')}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Manager</h1>
          <p className="text-gray-600">Manage your social media content projects</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </div>

      {/* Projects Grid/List */}
      <div className={
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
      }>
        <AnimatePresence>
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </AnimatePresence>
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">No projects found</div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Project
          </Button>
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <EnhancedProjectDetailsModal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          project={selectedProject}
          onProjectUpdate={(_projectId, updates) => {
            if (onProjectUpdate) {
              // Convert the updates to a full project object
              const updatedProject = { ...selectedProject, ...updates };
              onProjectUpdate(updatedProject);
            }
          }}
        />
      )}

      {/* Create Project Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="flex-shrink-0 p-6 pb-0">
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Set up a new content project with AI-powered features
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto scroll-smooth">
            <EnhancedProjectCreationFlow
              onProjectCreate={async (project) => {
                try {
                  setShowCreateModal(false);
                  
                  // Show loading toast
                  toast({
                    title: "Creating Project...",
                    description: "Saving project and generating content...",
                  });

                  // Transform project data for API
                  const projectData = {
                    name: project.projectName || project.name || 'Untitled Project',
                    description: project.projectDescription || project.description || '',
                    type: Array.isArray(project.contentType) ? project.contentType.join(', ') : (project.contentType || project.type || 'social-media'),
                    platform: Array.isArray(project.channelType) ? project.channelType.join(', ') : (project.channelType || project.platform || 'instagram'),
                    targetAudience: project.targetAudience || '',
                    estimatedDuration: project.duration || project.estimatedDuration || '1week',
                    tags: project.tags || [],
                    isPublic: project.isPublic || false,
                    metadata: {
                      contentType: Array.isArray(project.contentType) ? project.contentType : [project.contentType || 'post'],
                      channelType: Array.isArray(project.channelType) ? project.channelType : [project.channelType || 'instagram'],
                      contentFrequency: project.contentFrequency || 'daily',
                      aiEnhancement: true,
                      createdAt: new Date().toISOString()
                    }
                  };

                  // Calculate total days from start and end dates
                  const startDate = new Date(project.customStartDate || new Date());
                  const endDate = new Date(project.customEndDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
                  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                  const contentSettings = {
                    totalDays: totalDays,
                    contentPerDay: 1, // Default to 1 content per day
                    platforms: Array.isArray(project.channelType) ? project.channelType : (project.channelType ? [project.channelType] : ['instagram']),
                    contentType: Array.isArray(project.contentType) ? (project.contentType[0] || 'post') : (project.contentType || 'post'),
                    startDate: project.customStartDate || new Date().toISOString()
                  };

                  // Debug: Log the data being sent
                  console.log('Project data being sent:', projectData);
                  console.log('Content settings being sent:', contentSettings);
                  
                  // Call the API to create project with content generation
                  const token = localStorage.getItem('token');
                  const response = await fetch('/api/projects/create-with-content', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      ...projectData,
                      contentSettings
                    })
                  });

                  if (!response.ok) {
                    const errorData = await response.json();
                    console.error('API Error Response:', errorData);
                    console.error('Request data that failed:', { projectData, contentSettings });
                    throw new Error(errorData.message || `Failed to create project: ${response.status} ${response.statusText}`);
                  }

                  const result = await response.json();
                  
                  // Show success message
                  toast({
                    title: "Project Created Successfully!",
                    description: `"${project.projectName}" has been created with ${result.contentItems?.length || 0} generated content items.`,
                  });

                  // Invalidate queries to refresh data
                  queryClient.invalidateQueries({ queryKey: ['projects'] });
                  queryClient.invalidateQueries({ queryKey: ['all-content'] });

                } catch (error) {
                  console.error('Error creating project:', error);
                  toast({
                    title: "Project Creation Failed",
                    description: error instanceof Error ? error.message : "Failed to create project. Please try again.",
                    variant: "destructive"
                  });
                  setShowCreateModal(true); // Reopen the modal on error
                }
              }}
              onCancel={() => setShowCreateModal(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Project Modal */}
      {editingProject && (
        <Dialog open={showEditModal} onOpenChange={() => setShowEditModal(false)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update your project details and settings
              </DialogDescription>
            </DialogHeader>
            <EditProjectForm
              project={editingProject}
              onProjectUpdate={(updatedProject) => {
                onProjectUpdate?.(updatedProject);
                setShowEditModal(false);
                setEditingProject(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


// Edit Project Form Component
function EditProjectForm({ 
  project, 
  onProjectUpdate 
}: { 
  project: Project; 
  onProjectUpdate: (project: Project) => void;
}) {
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || '',
    type: project.type,
    platform: project.platform || '',
    targetAudience: project.targetAudience || '',
    estimatedDuration: project.estimatedDuration || '',
    tags: project.tags || [],
    isPublic: project.isPublic
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onProjectUpdate({
      ...project,
      ...formData,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit">Update Project</Button>
      </div>
    </form>
  );
}
