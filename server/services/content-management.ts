import { db } from '../db';
import { 
  aiProjects, 
  aiGeneratedContent, 
  aiContentCalendar, 
  projectContentManagement,
  contentActionHistory,
  type AiProject,
  type AiGeneratedContent,
  type ProjectContentManagement,
  type InsertAiGeneratedContent,
  type InsertProjectContentManagement,
  type InsertContentActionHistory
} from '../../shared/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { addDays, format, startOfDay } from 'date-fns';

export interface ContentGenerationRequest {
  projectId: number;
  userId: string;
  totalDays: number;
  contentPerDay?: number;
  startDate?: Date;
  platforms: string[];
  contentType: string;
  aiSettings?: any;
}

export interface ContentCard {
  id: number;
  title: string;
  description: string;
  content: string;
  platform: string;
  contentType: string;
  status: string;
  dayNumber: number;
  scheduledDate: Date | null;
  publishedAt: Date | null;
  isPaused: boolean;
  isStopped: boolean;
  canPublish: boolean;
  publishOrder: number;
  contentVersion: number;
  lastRegeneratedAt: Date | null;
  hashtags: string[];
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectContentOverview {
  projectId: number;
  projectName: string;
  totalDays: number;
  currentDay: number;
  contentPerDay: number;
  isPaused: boolean;
  isStopped: boolean;
  canPublishUnpublished: boolean;
  totalContent: number;
  publishedContent: number;
  unpublishedContent: number;
  pausedContent: number;
  stoppedContent: number;
  days: ContentDay[];
}

export interface ContentDay {
  dayNumber: number;
  date: Date;
  content: ContentCard[];
  totalContent: number;
  publishedContent: number;
  unpublishedContent: number;
  pausedContent: number;
  stoppedContent: number;
}

export class ContentManagementService {
  /**
   * Generate content for a project with daily organization
   */
  async generateProjectContent(request: ContentGenerationRequest): Promise<{
    success: boolean;
    projectId: number;
    totalContentGenerated: number;
    contentByDay: { [dayNumber: number]: ContentCard[] };
  }> {
    try {
      const { projectId, userId, totalDays, contentPerDay = 1, startDate = new Date(), platforms, contentType, aiSettings } = request;

      // Get the project details
      const project = await db.select().from(aiProjects).where(eq(aiProjects.id, projectId)).limit(1);
      if (!project.length) {
        throw new Error('Project not found');
      }

      // Create or update project content management record
      const existingManagement = await db.select()
        .from(projectContentManagement)
        .where(eq(projectContentManagement.aiProjectId, projectId))
        .limit(1);

      let managementRecord: ProjectContentManagement;
      if (existingManagement.length > 0) {
        // Update existing record
        await db.update(projectContentManagement)
          .set({
            totalDays,
            contentPerDay,
            lastContentGeneratedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(projectContentManagement.aiProjectId, projectId));
        
        managementRecord = { ...existingManagement[0], totalDays, contentPerDay };
      } else {
        // Create new management record
        const newManagement: InsertProjectContentManagement = {
          aiProjectId: projectId,
          userId,
          totalDays,
          contentPerDay,
          originalDuration: totalDays,
          lastContentGeneratedAt: new Date()
        };
        
        const inserted = await db.insert(projectContentManagement).values(newManagement).returning();
        managementRecord = inserted[0];
      }

      // Generate content for each day
      const contentByDay: { [dayNumber: number]: ContentCard[] } = {};
      let totalContentGenerated = 0;

      for (let day = 1; day <= totalDays; day++) {
        const dayDate = addDays(startDate, day - 1);
        const dayContent: ContentCard[] = [];

        for (let contentIndex = 0; contentIndex < contentPerDay; contentIndex++) {
          for (const platform of platforms) {
            // Generate content using AI (you can integrate with your existing AI services)
            const generatedContent = await this.generateContentForDay({
              projectId,
              userId,
              dayNumber: day,
              platform,
              contentType,
              aiSettings,
              projectData: project[0]
            });

            // Insert content into database
            const contentData: InsertAiGeneratedContent = {
              aiProjectId: projectId,
              userId,
              title: generatedContent.title,
              description: generatedContent.description,
              content: generatedContent.content,
              platform,
              contentType,
              status: 'draft',
              scheduledDate: dayDate,
              dayNumber: day,
              publishOrder: contentIndex,
              hashtags: generatedContent.hashtags || [],
              metadata: generatedContent.metadata || {},
              aiModel: 'gemini-2.5-flash',
              generationPrompt: generatedContent.prompt,
              confidence: generatedContent.confidence
            };

            const insertedContent = await db.insert(aiGeneratedContent).values(contentData).returning();
            const contentCard = this.mapToContentCard(insertedContent[0]);
            dayContent.push(contentCard);
            totalContentGenerated++;

            // Create calendar entry
            await db.insert(aiContentCalendar).values({
              aiProjectId: projectId,
              contentId: insertedContent[0].id,
              userId,
              scheduledDate: dayDate,
              scheduledTime: this.getOptimalPostingTime(platform),
              platform,
              contentType,
              status: 'scheduled',
              optimalPostingTime: true,
              engagementScore: generatedContent.engagementScore || 0.8
            });
          }
        }

        contentByDay[day] = dayContent;
      }

      return {
        success: true,
        projectId,
        totalContentGenerated,
        contentByDay
      };
    } catch (error) {
      console.error('Error generating project content:', error);
      throw new Error('Failed to generate project content');
    }
  }

  /**
   * Get project content overview with daily organization
   */
  async getProjectContentOverview(projectId: number, userId: string): Promise<ProjectContentOverview> {
    try {
      // Get project details
      const project = await db.select().from(aiProjects).where(eq(aiProjects.id, projectId)).limit(1);
      if (!project.length) {
        throw new Error('Project not found');
      }

      // Get project management details
      const management = await db.select()
        .from(projectContentManagement)
        .where(eq(projectContentManagement.aiProjectId, projectId))
        .limit(1);

      if (!management.length) {
        throw new Error('Project content management not found');
      }

      // Get all content for the project
      const allContent = await db.select()
        .from(aiGeneratedContent)
        .where(eq(aiGeneratedContent.aiProjectId, projectId))
        .orderBy(asc(aiGeneratedContent.dayNumber), asc(aiGeneratedContent.publishOrder));

      // Organize content by day
      const days: ContentDay[] = [];
      const contentByDay: { [dayNumber: number]: ContentCard[] } = {};

      for (let day = 1; day <= management[0].totalDays; day++) {
        const dayContent = allContent
          .filter(c => c.dayNumber === day)
          .map(c => this.mapToContentCard(c));

        contentByDay[day] = dayContent;

        const dayStats = this.calculateDayStats(dayContent);
        days.push({
          dayNumber: day,
          date: dayContent[0]?.scheduledDate || new Date(),
          content: dayContent,
          ...dayStats
        });
      }

      // Calculate overall stats
      const totalContent = allContent.length;
      const publishedContent = allContent.filter(c => c.status === 'published').length;
      const unpublishedContent = allContent.filter(c => c.status === 'draft' || c.status === 'scheduled').length;
      const pausedContent = allContent.filter(c => c.isPaused).length;
      const stoppedContent = allContent.filter(c => c.isStopped).length;

      return {
        projectId,
        projectName: project[0].title,
        totalDays: management[0].totalDays,
        currentDay: management[0].currentDay,
        contentPerDay: management[0].contentPerDay,
        isPaused: management[0].isPaused,
        isStopped: management[0].isStopped,
        canPublishUnpublished: management[0].canPublishUnpublished,
        totalContent,
        publishedContent,
        unpublishedContent,
        pausedContent,
        stoppedContent,
        days
      };
    } catch (error) {
      console.error('Error getting project content overview:', error);
      throw new Error('Failed to get project content overview');
    }
  }

  /**
   * Perform content action (play, pause, stop, delete, edit, regenerate, update)
   */
  async performContentAction(
    contentId: number,
    userId: string,
    action: 'play' | 'pause' | 'stop' | 'delete' | 'edit' | 'regenerate' | 'update',
    data?: any
  ): Promise<{ success: boolean; message: string; content?: ContentCard }> {
    try {
      // Get current content
      const content = await db.select()
        .from(aiGeneratedContent)
        .where(and(eq(aiGeneratedContent.id, contentId), eq(aiGeneratedContent.userId, userId)))
        .limit(1);

      if (!content.length) {
        throw new Error('Content not found');
      }

      const currentContent = content[0];
      const previousStatus = currentContent.status;

      let updateData: Partial<AiGeneratedContent> = {};
      let newStatus = previousStatus;

      switch (action) {
        case 'play':
          updateData = {
            isPaused: false,
            isStopped: false,
            status: currentContent.scheduledDate ? 'scheduled' : 'draft'
          };
          newStatus = updateData.status || previousStatus;
          break;

        case 'pause':
          updateData = {
            isPaused: true,
            status: 'paused'
          };
          newStatus = 'paused';
          break;

        case 'stop':
          updateData = {
            isStopped: true,
            isPaused: false,
            status: 'stopped'
          };
          newStatus = 'stopped';
          break;

        case 'delete':
          await db.delete(aiGeneratedContent).where(eq(aiGeneratedContent.id, contentId));
          await this.logContentAction(contentId, userId, action, previousStatus, 'deleted', data);
          return { success: true, message: 'Content deleted successfully' };

        case 'edit':
          updateData = {
            title: data.title || currentContent.title,
            description: data.description || currentContent.description,
            content: data.content || currentContent.content,
            hashtags: data.hashtags || currentContent.hashtags,
            metadata: data.metadata || currentContent.metadata,
            updatedAt: new Date()
          };
          break;

        case 'regenerate':
          // Regenerate content using AI
          const regeneratedContent = await this.regenerateContent(currentContent, data);
          updateData = {
            title: regeneratedContent.title,
            description: regeneratedContent.description,
            content: regeneratedContent.content,
            hashtags: regeneratedContent.hashtags,
            metadata: regeneratedContent.metadata,
            contentVersion: currentContent.contentVersion + 1,
            lastRegeneratedAt: new Date(),
            updatedAt: new Date()
          };
          break;

        case 'update':
          updateData = {
            ...data,
            updatedAt: new Date()
          };
          break;
      }

      if (Object.keys(updateData).length > 0) {
        await db.update(aiGeneratedContent)
          .set(updateData)
          .where(eq(aiGeneratedContent.id, contentId));

        // Log the action
        await this.logContentAction(contentId, userId, action, previousStatus, newStatus, data);

        // Get updated content
        const updatedContent = await db.select()
          .from(aiGeneratedContent)
          .where(eq(aiGeneratedContent.id, contentId))
          .limit(1);

        return {
          success: true,
          message: `Content ${action}ed successfully`,
          content: this.mapToContentCard(updatedContent[0])
        };
      }

      return { success: true, message: 'Action completed successfully' };
    } catch (error) {
      console.error('Error performing content action:', error);
      throw new Error(`Failed to ${action} content`);
    }
  }

  /**
   * Extend project content for additional days
   */
  async extendProjectContent(
    projectId: number,
    userId: string,
    additionalDays: number,
    platforms: string[],
    contentType: string,
    aiSettings?: any
  ): Promise<{ success: boolean; message: string; newContentCount: number }> {
    try {
      // Get project and management details
      const project = await db.select().from(aiProjects).where(eq(aiProjects.id, projectId)).limit(1);
      if (!project.length) {
        throw new Error('Project not found');
      }

      const management = await db.select()
        .from(projectContentManagement)
        .where(eq(projectContentManagement.aiProjectId, projectId))
        .limit(1);

      if (!management.length) {
        throw new Error('Project content management not found');
      }

      const currentTotalDays = management[0].totalDays;
      const newTotalDays = currentTotalDays + additionalDays;

      // Update management record
      await db.update(projectContentManagement)
        .set({
          totalDays: newTotalDays,
          extendedDays: management[0].extendedDays + additionalDays,
          extensionHistory: [
            ...(management[0].extensionHistory as any[] || []),
            {
              extendedDays: additionalDays,
              extendedAt: new Date(),
              previousTotalDays: currentTotalDays,
              newTotalDays
            }
          ],
          calendarUpdatedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(projectContentManagement.aiProjectId, projectId));

      // Generate content for the new days
      const startDate = new Date();
      let newContentCount = 0;

      for (let day = currentTotalDays + 1; day <= newTotalDays; day++) {
        for (let contentIndex = 0; contentIndex < management[0].contentPerDay; contentIndex++) {
          for (const platform of platforms) {
            const generatedContent = await this.generateContentForDay({
              projectId,
              userId,
              dayNumber: day,
              platform,
              contentType,
              aiSettings,
              projectData: project[0]
            });

            const contentData: InsertAiGeneratedContent = {
              aiProjectId: projectId,
              userId,
              title: generatedContent.title,
              description: generatedContent.description,
              content: generatedContent.content,
              platform,
              contentType,
              status: 'draft',
              scheduledDate: addDays(startDate, day - 1),
              dayNumber: day,
              publishOrder: contentIndex,
              hashtags: generatedContent.hashtags || [],
              metadata: generatedContent.metadata || {},
              aiModel: 'gemini-2.5-flash',
              generationPrompt: generatedContent.prompt,
              confidence: generatedContent.confidence
            };

            await db.insert(aiGeneratedContent).values(contentData);
            newContentCount++;
          }
        }
      }

      return {
        success: true,
        message: `Project extended by ${additionalDays} days successfully`,
        newContentCount
      };
    } catch (error) {
      console.error('Error extending project content:', error);
      throw new Error('Failed to extend project content');
    }
  }

  /**
   * Bulk operations for content management
   */
  async performBulkAction(
    projectId: number,
    userId: string,
    action: 'pause_all' | 'stop_all' | 'play_all' | 'stop_unpublished' | 'pause_unpublished',
    filters?: { dayNumbers?: number[]; platforms?: string[]; statuses?: string[] }
  ): Promise<{ success: boolean; message: string; affectedCount: number }> {
    try {
      let whereConditions = eq(aiGeneratedContent.aiProjectId, projectId);

      if (filters?.dayNumbers) {
        whereConditions = and(whereConditions, 
          // Add day number filter logic here
        );
      }

      if (filters?.platforms) {
        whereConditions = and(whereConditions, 
          // Add platform filter logic here
        );
      }

      if (filters?.statuses) {
        whereConditions = and(whereConditions, 
          // Add status filter logic here
        );
      }

      let updateData: Partial<AiGeneratedContent> = {};
      let affectedCount = 0;

      switch (action) {
        case 'pause_all':
          updateData = { isPaused: true, status: 'paused' };
          break;
        case 'stop_all':
          updateData = { isStopped: true, isPaused: false, status: 'stopped' };
          break;
        case 'play_all':
          updateData = { isPaused: false, isStopped: false };
          break;
        case 'stop_unpublished':
          updateData = { 
            isStopped: true, 
            isPaused: false, 
            status: 'stopped',
            canPublish: false 
          };
          whereConditions = and(whereConditions, 
            // Add unpublished filter logic here
          );
          break;
        case 'pause_unpublished':
          updateData = { 
            isPaused: true, 
            status: 'paused',
            canPublish: false 
          };
          whereConditions = and(whereConditions, 
            // Add unpublished filter logic here
          );
          break;
      }

      if (Object.keys(updateData).length > 0) {
        const result = await db.update(aiGeneratedContent)
          .set(updateData)
          .where(whereConditions)
          .returning({ id: aiGeneratedContent.id });

        affectedCount = result.length;
      }

      return {
        success: true,
        message: `Bulk ${action} completed successfully`,
        affectedCount
      };
    } catch (error) {
      console.error('Error performing bulk action:', error);
      throw new Error(`Failed to perform bulk ${action}`);
    }
  }

  // Private helper methods

  private async generateContentForDay(params: {
    projectId: number;
    userId: string;
    dayNumber: number;
    platform: string;
    contentType: string;
    aiSettings?: any;
    projectData: AiProject;
  }): Promise<{
    title: string;
    description: string;
    content: string;
    hashtags?: string[];
    metadata?: any;
    prompt?: string;
    confidence?: number;
    engagementScore?: number;
  }> {
    // This would integrate with your existing AI services
    // For now, returning mock data
    return {
      title: `Day ${params.dayNumber} - ${params.platform} Content`,
      description: `Generated content for day ${params.dayNumber} on ${params.platform}`,
      content: `This is the generated content for day ${params.dayNumber} on ${params.platform}. It's designed to engage your audience and drive results.`,
      hashtags: [`#day${params.dayNumber}`, `#${params.platform}`, '#content'],
      metadata: { platform: params.platform, day: params.dayNumber },
      prompt: `Generate ${params.contentType} content for ${params.platform}`,
      confidence: 0.85,
      engagementScore: 0.8
    };
  }

  private async regenerateContent(content: AiGeneratedContent, data?: any): Promise<{
    title: string;
    description: string;
    content: string;
    hashtags?: string[];
    metadata?: any;
  }> {
    // This would integrate with your existing AI services for regeneration
    // For now, returning updated mock data
    return {
      title: `${content.title} (Regenerated)`,
      description: content.description,
      content: `${content.content}\n\n[This content has been regenerated for better engagement]`,
      hashtags: content.hashtags || [],
      metadata: content.metadata || {}
    };
  }

  private async logContentAction(
    contentId: number,
    userId: string,
    action: string,
    previousStatus: string,
    newStatus: string,
    metadata?: any
  ): Promise<void> {
    const actionData: InsertContentActionHistory = {
      contentId,
      userId,
      action,
      previousStatus,
      newStatus,
      metadata
    };

    await db.insert(contentActionHistory).values(actionData);
  }

  private mapToContentCard(content: AiGeneratedContent): ContentCard {
    return {
      id: content.id,
      title: content.title,
      description: content.description || '',
      content: content.content,
      platform: content.platform,
      contentType: content.contentType,
      status: content.status,
      dayNumber: content.dayNumber,
      scheduledDate: content.scheduledDate,
      publishedAt: content.publishedAt,
      isPaused: content.isPaused,
      isStopped: content.isStopped,
      canPublish: content.canPublish,
      publishOrder: content.publishOrder,
      contentVersion: content.contentVersion,
      lastRegeneratedAt: content.lastRegeneratedAt,
      hashtags: content.hashtags || [],
      metadata: content.metadata || {},
      createdAt: content.createdAt,
      updatedAt: content.updatedAt
    };
  }

  private calculateDayStats(content: ContentCard[]): {
    totalContent: number;
    publishedContent: number;
    unpublishedContent: number;
    pausedContent: number;
    stoppedContent: number;
  } {
    return {
      totalContent: content.length,
      publishedContent: content.filter(c => c.status === 'published').length,
      unpublishedContent: content.filter(c => c.status === 'draft' || c.status === 'scheduled').length,
      pausedContent: content.filter(c => c.isPaused).length,
      stoppedContent: content.filter(c => c.isStopped).length
    };
  }

  private getOptimalPostingTime(platform: string): string {
    // This would integrate with your engagement patterns data
    const optimalTimes: { [key: string]: string } = {
      instagram: '09:00',
      facebook: '12:00',
      twitter: '17:00',
      linkedin: '08:00',
      tiktok: '18:00',
      youtube: '14:00'
    };
    return optimalTimes[platform] || '12:00';
  }
}

export const contentManagementService = new ContentManagementService();
