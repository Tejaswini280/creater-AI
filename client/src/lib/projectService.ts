import { apiRequest } from './queryClient';
import { createTimezoneAwareDate } from '@/utils/dateUtils';

export interface ProjectData {
  id?: string;
  name: string;
  description?: string;
  contentType: string;
  category: string;
  targetAudience?: string;
  goals: string[];
  contentFormats: string[];
  postingFrequency: string;
  contentThemes: string[];
  brandVoice: string;
  contentLength: string;
  platforms: string[];
  aiTools?: string[];
  schedulingPreferences: {
    autoSchedule: boolean;
    timeZone: string;
    preferredTimes: string[];
  };
  startDate: string;
  duration: string;
  budget?: string;
  teamMembers?: string[];
  status?: 'draft' | 'active' | 'paused' | 'completed';
  createdAt?: string;
  updatedAt?: string;
}

export class ProjectService {
  static async createProject(projectData: ProjectData): Promise<ProjectData> {
    try {
      // Generate a unique ID for the project
      const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Ensure startDate is properly timezone-aware if provided
      let processedStartDate = projectData.startDate;
      if (projectData.startDate && projectData.schedulingPreferences?.timeZone) {
        processedStartDate = createTimezoneAwareDate(
          projectData.startDate, 
          projectData.schedulingPreferences.timeZone
        );
      }

      const completeProject: ProjectData = {
        ...projectData,
        id: projectId,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startDate: processedStartDate,
      };

      // Try to save to API first
      try {
        // Transform project data to match backend API schema
        const apiProjectData = {
          name: projectData.name,
          description: projectData.description || '',
          type: 'social-media', // Map contentType to backend type
          platform: projectData.platforms?.[0] || 'instagram', // Use first platform as primary
          targetAudience: projectData.targetAudience || '',
          estimatedDuration: projectData.duration || '',
          tags: [
            ...(projectData.platforms || []),
            ...(projectData.goals || []),
            ...(projectData.contentFormats || [])
          ].filter(Boolean),
          isPublic: false,
          status: 'active',
          metadata: {
            // Store all the detailed project wizard data in metadata
            originalData: projectData,
            contentType: projectData.contentType,
            category: projectData.category,
            goals: projectData.goals,
            contentFormats: projectData.contentFormats,
            postingFrequency: projectData.postingFrequency,
            contentThemes: projectData.contentThemes,
            brandVoice: projectData.brandVoice,
            contentLength: projectData.contentLength,
            platforms: projectData.platforms,
            aiTools: projectData.aiTools,
            schedulingPreferences: projectData.schedulingPreferences,
            startDate: projectData.startDate,
            budget: projectData.budget,
            teamMembers: projectData.teamMembers,
            createdViaWizard: true,
            wizardVersion: '1.0'
          }
        };

        console.log('Sending project data to API:', apiProjectData);
        
        const response = await apiRequest('POST', '/api/projects', apiProjectData);
        if (response.ok) {
          const apiResponse = await response.json();
          console.log('Project saved to API:', apiResponse);
          
          // Transform the API response back to our format
          const savedProject: ProjectData = {
            ...completeProject,
            id: apiResponse.project?.id?.toString() || completeProject.id,
            createdAt: apiResponse.project?.createdAt || completeProject.createdAt,
            updatedAt: apiResponse.project?.updatedAt || completeProject.updatedAt,
          };
          
          // Also save to localStorage as backup
          this.saveToLocalStorage(savedProject);
          
          return savedProject;
        } else {
          const errorText = await response.text();
          console.warn('API save failed with status:', response.status, errorText);
        }
      } catch (apiError) {
        console.warn('API save failed, using localStorage:', apiError);
      }

      // Fallback to localStorage
      this.saveToLocalStorage(completeProject);
      
      return completeProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error('Failed to create project');
    }
  }

  /**
   * Auto-schedule content for a project
   */
  static async autoScheduleProject(projectData: {
    projectId: number;
    contentType: string;
    platforms: string[];
    contentFrequency: string;
    duration: string;
    customDuration?: number;
    startDate?: string;
    targetAudience?: string;
    category?: string;
    tags?: string[];
  }): Promise<{
    success: boolean;
    contentCount: number;
    scheduledPosts: any[];
    message: string;
  }> {
    try {
      const response = await apiRequest('POST', '/api/auto-schedule/project', projectData);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to auto-schedule project');
      }
      
      return result.data;
    } catch (error) {
      console.error('Auto-schedule project error:', error);
      throw error;
    }
  }

  /**
   * Get auto-scheduled content for a project
   */
  static async getAutoScheduledContent(projectId: number): Promise<any[]> {
    try {
      const response = await apiRequest('GET', `/api/auto-schedule/project/${projectId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to get auto-scheduled content');
      }
      
      return result.data.scheduledContent;
    } catch (error) {
      console.error('Get auto-scheduled content error:', error);
      throw error;
    }
  }

  /**
   * Get optimal posting times for a platform
   */
  static async getOptimalTimes(platform: string): Promise<string[]> {
    try {
      const response = await apiRequest('GET', `/api/auto-schedule/optimal-times/${platform}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to get optimal times');
      }
      
      return result.data.optimalTimes;
    } catch (error) {
      console.error('Get optimal times error:', error);
      throw error;
    }
  }

  static async updateProject(projectId: string, updates: Partial<ProjectData>): Promise<ProjectData> {
    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Try to update via API first
      try {
        const response = await apiRequest('PUT', `/api/projects/${projectId}`, updatedData);
        if (response.ok) {
          const updatedProject = await response.json();
          
          // Also update localStorage
          this.updateInLocalStorage(projectId, updatedProject);
          
          return updatedProject;
        }
      } catch (apiError) {
        console.warn('API update failed, using localStorage:', apiError);
      }

      // Fallback to localStorage
      const localProjects = this.getLocalProjects();
      const projectIndex = localProjects.findIndex(p => p.id === projectId);
      
      if (projectIndex === -1) {
        throw new Error('Project not found');
      }

      const updatedProject = { ...localProjects[projectIndex], ...updatedData };
      localProjects[projectIndex] = updatedProject;
      
      localStorage.setItem('localProjects', JSON.stringify(localProjects));
      
      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      throw new Error('Failed to update project');
    }
  }

  static async getProject(projectId: string): Promise<ProjectData | null> {
    try {
      // Try to get from API first
      try {
        const response = await apiRequest('GET', `/api/projects/${projectId}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (apiError) {
        console.warn('API get failed, using localStorage:', apiError);
      }

      // Fallback to localStorage
      const localProjects = this.getLocalProjects();
      return localProjects.find(p => p.id === projectId) || null;
    } catch (error) {
      console.error('Error getting project:', error);
      return null;
    }
  }

  static async getAllProjects(): Promise<ProjectData[]> {
    try {
      // Try to get from API first
      try {
        const response = await apiRequest('GET', '/api/projects');
        if (response.ok) {
          const result = await response.json();
          return result.projects || [];
        }
      } catch (apiError) {
        console.warn('API get all failed, using localStorage:', apiError);
      }

      // Fallback to localStorage
      return this.getLocalProjects();
    } catch (error) {
      console.error('Error getting all projects:', error);
      return [];
    }
  }

  static async deleteProject(projectId: string): Promise<boolean> {
    try {
      // Try to delete from API first
      try {
        const response = await apiRequest('DELETE', `/api/projects/${projectId}`);
        if (response.ok) {
          // Also remove from localStorage
          this.removeFromLocalStorage(projectId);
          return true;
        }
      } catch (apiError) {
        console.warn('API delete failed, using localStorage:', apiError);
      }

      // Fallback to localStorage
      this.removeFromLocalStorage(projectId);
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }

  // Local storage helper methods
  private static saveToLocalStorage(project: ProjectData): void {
    const localProjects = this.getLocalProjects();
    localProjects.push(project);
    localStorage.setItem('localProjects', JSON.stringify(localProjects));
    localStorage.setItem('latestCreatedProject', JSON.stringify(project));
    
    // Trigger dashboard refresh
    window.dispatchEvent(new CustomEvent('refreshDashboardProjects'));
  }

  private static updateInLocalStorage(projectId: string, updatedProject: ProjectData): void {
    const localProjects = this.getLocalProjects();
    const projectIndex = localProjects.findIndex(p => p.id === projectId);
    
    if (projectIndex !== -1) {
      localProjects[projectIndex] = updatedProject;
      localStorage.setItem('localProjects', JSON.stringify(localProjects));
      
      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent('refreshDashboardProjects'));
    }
  }

  private static removeFromLocalStorage(projectId: string): void {
    const localProjects = this.getLocalProjects();
    const filteredProjects = localProjects.filter(p => p.id !== projectId);
    localStorage.setItem('localProjects', JSON.stringify(filteredProjects));
    
    // Trigger dashboard refresh
    window.dispatchEvent(new CustomEvent('refreshDashboardProjects'));
  }

  private static getLocalProjects(): ProjectData[] {
    try {
      const stored = localStorage.getItem('localProjects');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error parsing local projects:', error);
      return [];
    }
  }

  // Utility methods
  static generateProjectSummary(project: ProjectData): string {
    const platformCount = project.platforms.length;
    const goalCount = project.goals.length;
    const formatCount = project.contentFormats.length;
    
    return `${project.contentType} project targeting ${platformCount} platform${platformCount !== 1 ? 's' : ''} with ${goalCount} goal${goalCount !== 1 ? 's' : ''} and ${formatCount} content format${formatCount !== 1 ? 's' : ''}`;
  }

  static getProjectProgress(project: ProjectData): number {
    // Calculate project completion based on various factors
    let progress = 0;
    
    // Basic setup (40%)
    if (project.name && project.contentType && project.category) progress += 40;
    
    // Content strategy (30%)
    if (project.contentFormats.length > 0 && project.contentThemes.length > 0) progress += 30;
    
    // Platforms and integrations (20%)
    if (project.platforms.length > 0) progress += 20;
    
    // Timeline and budget (10%)
    if (project.startDate && project.duration) progress += 10;
    
    return Math.min(progress, 100);
  }

  static getNextSteps(project: ProjectData): string[] {
    const steps: string[] = [];
    
    if (project.status === 'draft') {
      steps.push('Start your project to begin content creation');
    }
    
    if (project.platforms.length > 0) {
      steps.push('Connect your social media accounts');
    }
    
    if (project.contentFormats.length > 0) {
      steps.push('Create your first piece of content');
    }
    
    if (project.schedulingPreferences.autoSchedule) {
      steps.push('Set up your posting schedule');
    }
    
    steps.push('Review and optimize your content strategy');
    
    return steps;
  }
}

export default ProjectService;