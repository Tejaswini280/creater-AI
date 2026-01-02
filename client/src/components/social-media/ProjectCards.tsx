import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Eye,
  Calendar,
  Clock,
  Play,
  Pause,
  StopCircle,
  TrendingUp,
  Target,
  Zap,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EnhancedProjectDetailsModal from '@/components/modals/EnhancedProjectDetailsModal';

interface ProjectCard {
  id: number;
  title: string;
  description?: string;
  projectType: string;
  status: string;
  duration: number;
  targetChannels: string[];
  contentFrequency: string;
  startDate: string;
  endDate: string;
  contentTitle?: string;
  channelType?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface ProjectCardsProps {
  projects: ProjectCard[];
  onProjectUpdate?: (projectId: number, updates: any) => void;
  onProjectAction?: (projectId: number, action: string) => void;
}

export default function ProjectCards({
  projects,
  onProjectUpdate,
  onProjectAction
}: ProjectCardsProps) {
  const [selectedProject, setSelectedProject] = useState<ProjectCard | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Draft', color: 'bg-gray-100' },
      active: { variant: 'default' as const, label: 'Active', color: 'bg-green-100' },
      paused: { variant: 'outline' as const, label: 'Paused', color: 'bg-yellow-100' },
      completed: { variant: 'secondary' as const, label: 'Completed', color: 'bg-blue-100' },
      stopped: { variant: 'destructive' as const, label: 'Stopped', color: 'bg-red-100' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <Badge variant={config.variant} className={`${config.color} text-gray-800`}>
        {config.label}
      </Badge>
    );
  };

  const getPlatformIcon = (platform: string) => {
    const icons = {
      instagram: '📸',
      facebook: '👥',
      youtube: '🎥',
      tiktok: '🎵',
      linkedin: '💼',
      twitter: '🐦'
    };
    return icons[platform as keyof typeof icons] || '📱';
  };

  const getProjectTypeIcon = (type: string) => {
    const icons = {
      fitness: '💪',
      business: '💼',
      lifestyle: '🌟',
      technology: '💻',
      food: '🍳',
      travel: '✈️',
      fashion: '👗',
      education: '📚',
      entertainment: '🎬',
      finance: '💰'
    };
    return icons[type as keyof typeof icons] || '📋';
  };

  const calculateProgress = (project: ProjectCard) => {
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    const today = new Date();

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = today.getTime() - startDate.getTime();

    const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
    return Math.round(progress);
  };

  const getDaysRemaining = (project: ProjectCard) => {
    const endDate = new Date(project.endDate);
    const today = new Date();

    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const handleViewDetails = (project: ProjectCard) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const handleProjectAction = async (projectId: number, action: string) => {
    if (onProjectAction) {
      onProjectAction(projectId, action);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
        <p className="text-gray-500">Create your first AI-powered project to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const progress = calculateProgress(project);
          const daysRemaining = getDaysRemaining(project);
          const isOverdue = daysRemaining < 0;

          return (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getProjectTypeIcon(project.projectType)}</span>
                    <div>
                      <CardTitle className="text-lg line-clamp-1">
                        {project.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {project.description || project.contentTitle || 'No description'}
                      </CardDescription>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(project)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>

                      {project.status === 'active' && (
                        <DropdownMenuItem onClick={() => handleProjectAction(project.id, 'pause')}>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause Project
                        </DropdownMenuItem>
                      )}

                      {project.status === 'paused' && (
                        <DropdownMenuItem onClick={() => handleProjectAction(project.id, 'resume')}>
                          <Play className="h-4 w-4 mr-2" />
                          Resume Project
                        </DropdownMenuItem>
                      )}

                      {(project.status === 'active' || project.status === 'paused') && (
                        <DropdownMenuItem
                          onClick={() => handleProjectAction(project.id, 'stop')}
                          className="text-red-600"
                        >
                          <StopCircle className="h-4 w-4 mr-2" />
                          Stop Project
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(project.status)}
                  <Badge variant="outline" className="text-xs">
                    {project.contentFrequency}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Project Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(project.startDate).toLocaleDateString()}</span>
                    <span>
                      {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
                    </span>
                  </div>
                </div>

                {/* Target Channels */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Target className="h-4 w-4" />
                    <span>Platforms</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {project.targetChannels?.slice(0, 4).map((channel) => (
                      <Badge key={channel} variant="secondary" className="text-xs">
                        <span className="mr-1">{getPlatformIcon(channel)}</span>
                        {channel}
                      </Badge>
                    ))}
                    {project.targetChannels && project.targetChannels.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{project.targetChannels.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {project.tags && project.tags.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Zap className="h-4 w-4" />
                      <span>Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {project.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {project.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Project Stats */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{project.duration}</div>
                    <div className="text-xs text-gray-500">Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{project.targetChannels?.length || 0}</div>
                    <div className="text-xs text-gray-500">Platforms</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(project)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>

                  {project.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProjectAction(project.id, 'pause')}
                    >
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}

                  {project.status === 'paused' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProjectAction(project.id, 'resume')}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <EnhancedProjectDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          project={selectedProject}
          onProjectUpdate={onProjectUpdate}
        />
      )}
    </>
  );
}
