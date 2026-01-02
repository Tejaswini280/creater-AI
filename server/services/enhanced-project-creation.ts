import { aiProjectManager } from './ai-project-manager';
import { storage } from '../storage';
import { db } from '../db';
import { projects, content, aiProjects, aiGeneratedContent } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

interface ProjectBasicsData {
  name: string;
  description?: string;
  contentType: string;
  channelTypes: string[];
  category: string;
  duration: '1week' | '15days' | '30days' | 'custom';
  customDuration?: number;
  contentFrequency: 'daily' | 'alternate' | 'weekly' | 'custom';
  calendarPreference: 'ai-generated' | 'custom';
  aiEnhancement: boolean;
  targetAudience?: string;
  tags: string[];
  isPublic: boolean;
  notificationsEnabled: boolean;
  status: 'draft' | 'active' | 'inactive';
}

interface ContentCreationData {
  title: string;
  caption: string;
  contentType: string;
  hashtags: string[];
  emojis: string[];
  media: any[];
  platforms: any[];
  isScheduled: boolean;
  scheduledAt?: Date;
  status: string;
}

interface EnhancedProjectResult {
  project: any;
  content?: any[];
  aiProject?: any;
  aiContent?: any[];
  scheduledContent?: any[];
  metadata: {
    totalItems: number;
    createdAt: string;
    workflow: 'enhanced-two-page';
    autoScheduled?: boolean;
  };
}

class EnhancedProjectCreationService {
  /**
   * Create a complete project with both basic and content data
   */
  async createEnhancedProject(params: {
    userId: string;
    projectBasics: ProjectBasicsData;
    contentCreation: ContentCreationData;
    schedulingOptions?: {
      startDate?: Date;
      duration?: string;
      bulkGeneration?: boolean;
    };
  }): Promise<EnhancedProjectResult> {
    const { userId, projectBasics, contentCreation, schedulingOptions } = params;

    try {
      // Step 1: Create the main project
      const projectData = {
        userId,
        name: projectBasics.name,
        description: projectBasics.description,
        type: projectBasics.contentType,
        platform: projectBasics.channelTypes[0] || null,
        targetAudience: projectBasics.targetAudience,
        estimatedDuration: this.getDurationString(projectBasics.duration, projectBasics.customDuration),
        tags: projectBasics.tags,
        isPublic: projectBasics.isPublic,
        status: projectBasics.status,
        metadata: {
          enhancedWorkflow: true,
          channelTypes: projectBasics.channelTypes,
          category: projectBasics.category,
          contentFrequency: projectBasics.contentFrequency,
          calendarPreference: projectBasics.calendarPreference,
          aiEnhancement: projectBasics.aiEnhancement,
          notificationsEnabled: projectBasics.notificationsEnabled,
          createdVia: 'enhanced-two-page-workflow',
          createdAt: new Date().toISOString(),
          schedulingPreferences: {
            autoSchedule: projectBasics.calendarPreference === 'ai-generated',
            timeZone: 'IST',
            preferredTimes: this.getOptimalTimesForPlatforms(projectBasics.channelTypes)
          }
        }
      };

      const project = await storage.createProject(projectData);

      // Step 2: Create initial content
      const contentData = {
        userId,
        projectId: project.id,
        title: contentCreation.title,
        description: contentCreation.caption,
        platform: projectBasics.channelTypes[0] || 'instagram',
        contentType: contentCreation.contentType,
        status: contentCreation.status,
        scheduledAt: contentCreation.scheduledAt,
        tags: contentCreation.hashtags,
        metadata: {
          hashtags: contentCreation.hashtags,
          emojis: contentCreation.emojis,
          media: contentCreation.media,
          platforms: contentCreation.platforms,
          isScheduled: contentCreation.isScheduled,
          enhancedWorkflow: true
        },
        aiGenerated: false
      };

      const initialContent = await storage.createContent(contentData);

      let aiProject = null;
      let aiContent: any[] = [];
      let scheduledContent: any[] = [];

      // Step 3: Create AI project and bulk content if requested
      if (projectBasics.aiEnhancement && schedulingOptions?.bulkGeneration) {
        const durationDays = this.getDurationInDays(projectBasics.duration, projectBasics.customDuration);
        
        const aiProjectData = {
          title: projectBasics.name,
          description: projectBasics.description || `AI-enhanced project for ${projectBasics.name}`,
          projectType: projectBasics.contentType,
          duration: durationDays,
          targetChannels: projectBasics.channelTypes,
          contentFrequency: projectBasics.contentFrequency,
          targetAudience: projectBasics.targetAudience,
          brandVoice: 'engaging',
          contentGoals: ['engagement', 'growth'],
          contentCategory: [projectBasics.category],
          contentType: [contentCreation.contentType],
          channelType: projectBasics.channelTypes,
          contentTitle: contentCreation.title,
          contentDescription: contentCreation.caption,
          tags: projectBasics.tags,
          aiSettings: {
            creativity: 0.8,
            formality: 0.6,
            hashtagCount: 5,
            includeEmojis: true,
            includeCallToAction: true
          },
          userId,
          status: 'active',
          startDate: schedulingOptions.startDate?.toISOString() || new Date().toISOString()
        };

        // Create AI project
        aiProject = await aiProjectManager.createProject(aiProjectData);

        // Generate AI content
        const aiResult = await aiProjectManager.generateProjectContent({
          aiProjectId: aiProject.id,
          userId,
          projectData: aiProjectData
        });

        aiContent = aiResult.contentItems;

        // Link AI project to main project
        await this.linkProjects(project.id, aiProject.id);
      }

      // Step 4: Auto-schedule content if calendar preference is AI-generated
      if (projectBasics.calendarPreference === 'ai-generated') {
        try {
          const { AISchedulingService } = await import('./ai-scheduling-service');
          const aiScheduler = new AISchedulingService();
          
          const schedulingParams = {
            projectId: project.id,
            userId,
            projectData: {
              name: projectBasics.name,
              description: projectBasics.description || '',
              category: projectBasics.category,
              targetAudience: projectBasics.targetAudience || 'general audience',
              tags: projectBasics.tags
            },
            contentType: [projectBasics.contentType],
            channelTypes: projectBasics.channelTypes,
            contentFrequency: projectBasics.contentFrequency,
            duration: projectBasics.duration,
            customStartDate: schedulingOptions?.startDate || new Date(),
            postingStrategy: 'optimal' as const
          };

          const schedulingResult = await aiScheduler.scheduleProjectContent(schedulingParams);
          scheduledContent = schedulingResult.scheduledPosts || [];
          
          console.log(`✅ Auto-scheduled ${scheduledContent.length} posts for project ${project.id}`);
        } catch (error) {
          console.error('Error auto-scheduling content:', error);
          // Continue without auto-scheduling - don't fail project creation
        }
      }

      const result: EnhancedProjectResult = {
        project,
        content: [initialContent],
        aiProject,
        aiContent,
        scheduledContent,
        metadata: {
          totalItems: 1 + aiContent.length + scheduledContent.length,
          createdAt: new Date().toISOString(),
          workflow: 'enhanced-two-page',
          autoScheduled: scheduledContent.length > 0
        }
      };

      return result;

    } catch (error) {
      console.error('Enhanced project creation error:', error);
      throw new Error(`Failed to create enhanced project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save project basics (Step 1)
   */
  async saveProjectBasics(userId: string, projectBasics: ProjectBasicsData): Promise<any> {
    // For now, we'll store this in memory/session
    // In a real implementation, you might want to save to a temporary table
    return {
      id: Date.now(), // Temporary ID
      ...projectBasics,
      userId,
      step: 'basics_completed',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Save content creation data (Step 2)
   */
  async saveContentCreation(userId: string, contentCreation: ContentCreationData): Promise<any> {
    return {
      id: Date.now(), // Temporary ID
      ...contentCreation,
      userId,
      step: 'content_completed',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Get project analytics and insights
   */
  async getProjectInsights(projectId: number, userId: string): Promise<any> {
    try {
      // Get main project
      const project = await storage.getProjectById(projectId, userId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Get project content
      const projectContent = await storage.getContentByProject(userId, projectId);

      // Get scheduled content
      let scheduledContent: any[] = [];
      try {
        // Import the scheduler service dynamically to avoid circular dependencies
        const schedulerModule = await import('../routes/scheduler');
        // For now, we'll skip this check to avoid import issues
        // scheduledContent = await schedulerModule.getScheduledContentForProject(projectId);
      } catch (error) {
        console.warn('Could not get scheduled content:', error);
      }

      // Check if there's a linked AI project
      let aiInsights = null;
      if (project.metadata?.aiProjectId) {
        try {
          aiInsights = await aiProjectManager.getProjectAnalytics(project.metadata.aiProjectId, userId);
        } catch (error) {
          console.warn('Could not get AI insights:', error);
        }
      }

      return {
        project,
        content: projectContent,
        scheduledContent,
        aiInsights,
        statistics: {
          totalContent: projectContent.length,
          published: projectContent.filter((c: any) => c.status === 'published').length,
          scheduled: projectContent.filter((c: any) => c.status === 'scheduled').length + scheduledContent.length,
          draft: projectContent.filter((c: any) => c.status === 'draft').length,
          autoScheduled: scheduledContent.length
        },
        metadata: {
          enhancedWorkflow: (project.metadata as any)?.enhancedWorkflow || false,
          autoScheduled: scheduledContent.length > 0,
          lastUpdated: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Get project insights error:', error);
      throw new Error(`Failed to get project insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update project with new data
   */
  async updateEnhancedProject(params: {
    projectId: number;
    userId: string;
    updates: Partial<ProjectBasicsData & ContentCreationData>;
  }): Promise<any> {
    const { projectId, userId, updates } = params;

    try {
      // Update main project
      const projectUpdates: any = {};
      
      if (updates.name) projectUpdates.name = updates.name;
      if (updates.description) projectUpdates.description = updates.description;
      if (updates.contentType) projectUpdates.type = updates.contentType;
      if (updates.targetAudience) projectUpdates.targetAudience = updates.targetAudience;
      if (updates.tags) projectUpdates.tags = updates.tags;
      if (updates.isPublic !== undefined) projectUpdates.isPublic = updates.isPublic;
      if (updates.status) projectUpdates.status = updates.status;

      // Update metadata
      const project = await storage.getProjectById(projectId, userId);
      if (project) {
        const currentMetadata = (project.metadata as any) || {};
        projectUpdates.metadata = {
          ...currentMetadata,
          ...updates,
          lastUpdated: new Date().toISOString()
        };
      }

      const updatedProject = await storage.updateProject(projectId, projectUpdates);

      return updatedProject;

    } catch (error) {
      console.error('Update enhanced project error:', error);
      throw new Error(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete enhanced project and all related data
   */
  async deleteEnhancedProject(projectId: number, userId: string): Promise<void> {
    try {
      // Get project to check for AI project link
      const project = await storage.getProjectById(projectId, userId);
      
      if (project?.metadata && (project.metadata as any).aiProjectId) {
        // Delete linked AI project
        try {
          await aiProjectManager.deleteProject((project.metadata as any).aiProjectId, userId);
        } catch (error) {
          console.warn('Could not delete linked AI project:', error);
        }
      }

      // Delete main project (this will cascade delete content)
      await storage.deleteProject(projectId, userId);

    } catch (error) {
      console.error('Delete enhanced project error:', error);
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods

  private getDurationString(duration: string, customDuration?: number): string {
    switch (duration) {
      case '1week': return '7 days';
      case '15days': return '15 days';
      case '30days': return '30 days';
      case 'custom': return `${customDuration || 7} days`;
      default: return '7 days';
    }
  }

  private getDurationInDays(duration: string, customDuration?: number): number {
    switch (duration) {
      case '1week': return 7;
      case '15days': return 15;
      case '30days': return 30;
      case 'custom': return customDuration || 7;
      default: return 7;
    }
  }

  private async linkProjects(mainProjectId: number, aiProjectId: number): Promise<void> {
    try {
      // Update main project metadata to include AI project link
      const project = await db.select().from(projects).where(eq(projects.id, mainProjectId)).limit(1);
      
      if (project.length > 0) {
        const currentMetadata = (project[0].metadata as any) || {};
        await db.update(projects)
          .set({
            metadata: {
              ...currentMetadata,
              aiProjectId,
              linkedAt: new Date().toISOString()
            },
            updatedAt: new Date()
          })
          .where(eq(projects.id, mainProjectId));
      }
    } catch (error) {
      console.warn('Could not link projects:', error);
    }
  }

  private getOptimalTimesForPlatforms(platforms: string[]): string[] {
    const platformTimes: Record<string, string[]> = {
      instagram: ['11:00', '14:00', '17:00', '19:00'],
      linkedin: ['08:00', '12:00', '17:00', '18:00'],
      facebook: ['09:00', '13:00', '15:00', '18:00'],
      youtube: ['15:00', '19:00'],
      tiktok: ['06:00', '10:00', '19:00', '22:00'],
      twitter: ['08:00', '12:00', '16:00', '20:00']
    };

    const allTimes = new Set<string>();
    platforms.forEach(platform => {
      const times = platformTimes[platform.toLowerCase()] || platformTimes.instagram;
      times.forEach(time => allTimes.add(time));
    });

    return Array.from(allTimes).sort();
  }
}

export const enhancedProjectCreationService = new EnhancedProjectCreationService();