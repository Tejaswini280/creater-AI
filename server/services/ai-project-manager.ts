import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { addDays, format, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { storage } from '../storage';
import { 
  aiProjects, 
  aiGeneratedContent, 
  aiContentCalendar,
  aiEngagementPatterns,
  type InsertAiProject,
  type InsertAiGeneratedContent,
  type InsertAiContentCalendar,
  type AiProject,
  type AiGeneratedContent,
  type AiContentCalendar
} from '@shared/schema';
import { db } from '../db';
import { eq, and, desc, asc } from 'drizzle-orm';

interface ProjectCreationData {
  title: string;
  description?: string;
  projectType: string;
  duration: number;
  customDuration?: number;
  targetChannels: string[];
  contentFrequency: string;
  targetAudience?: string;
  brandVoice?: string;
  contentGoals?: string[];
  // Enhanced fields for multi-select support
  contentCategory: string[];
  contentType: string[];
  channelType: string[];
  contentTitle?: string;
  contentDescription?: string;
  tags?: string[];
  aiSettings?: {
    creativity?: number;
    formality?: number;
    hashtagCount?: number;
    includeEmojis?: boolean;
    includeCallToAction?: boolean;
  };
  userId: string;
  status: string;
  startDate?: string;
}

interface ContentGenerationResult {
  contentItems: AiGeneratedContent[];
  calendarEntries: AiContentCalendar[];
}

interface OptimalTimesRequest {
  platforms: string[];
  category: string;
  timezone?: string;
}

interface ProjectAnalytics {
  totalContent: number;
  totalCalendarEntries: number;
  contentByPlatform: Record<string, number>;
  contentByType: Record<string, number>;
  engagementPredictions: {
    average: number;
    byPlatform: Record<string, number>;
  };
  optimalPostingTimes: Record<string, string[]>;
  projectHealth: {
    score: number;
    recommendations: string[];
  };
}

class AIProjectManager {
  private openai: OpenAI;
  private gemini: GoogleGenerativeAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  /**
   * Create a new AI project
   */
  async createProject(data: ProjectCreationData): Promise<AiProject> {
    try {
      const projectData: InsertAiProject = {
        userId: data.userId,
        title: data.title,
        description: data.description,
        projectType: data.projectType,
        duration: data.duration,
        customDuration: data.customDuration,
        targetChannels: data.targetChannels,
        contentFrequency: data.contentFrequency,
        targetAudience: data.targetAudience,
        brandVoice: data.brandVoice,
        contentGoals: data.contentGoals,
        // Enhanced fields
        contentTitle: data.contentTitle,
        contentDescription: data.contentDescription,
        channelType: data.channelType?.[0] || 'multi-platform', // Use first selected or default
        tags: data.tags,
        aiSettings: data.aiSettings,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: this.calculateEndDate(data.startDate, data.duration)
      };

      const [project] = await db.insert(aiProjects).values(projectData).returning();
      return project;
    } catch (error) {
      console.error('Error creating AI project:', error);
      throw new Error('Failed to create AI project');
    }
  }

  /**
   * Generate content and calendar for a project
   */
  async generateProjectContent(params: {
    aiProjectId: number;
    userId: string;
    projectData: ProjectCreationData;
  }): Promise<ContentGenerationResult> {
    try {
      const { aiProjectId, userId, projectData } = params;

      // Calculate total content pieces needed
      const totalContentPieces = this.calculateContentPieces(
        projectData.duration,
        projectData.contentFrequency
      );

      // Generate content ideas using AI
      const contentIdeas = await this.generateContentIdeas({
        projectType: projectData.projectType,
        targetChannels: projectData.targetChannels,
        totalPieces: totalContentPieces,
        targetAudience: projectData.targetAudience,
        brandVoice: projectData.brandVoice,
        contentGoals: projectData.contentGoals,
        aiSettings: projectData.aiSettings,
        // Enhanced fields for multi-select support
        contentCategory: projectData.contentCategory,
        contentType: projectData.contentType,
        channelType: projectData.channelType,
        contentTitle: projectData.contentTitle,
        contentDescription: projectData.contentDescription,
        tags: projectData.tags,
        duration: projectData.duration
      });

      // Generate content items
      const contentItems: AiGeneratedContent[] = [];
      const calendarEntries: AiContentCalendar[] = [];

      const startDate = projectData.startDate ? new Date(projectData.startDate) : new Date();
      const frequencyDays = this.getFrequencyDays(projectData.contentFrequency);

      for (let i = 0; i < totalContentPieces; i++) {
        const dayNumber = Math.floor(i / projectData.targetChannels.length) + 1;
        const scheduledDate = addDays(startDate, (dayNumber - 1) * frequencyDays);
        const idea = contentIdeas[i % contentIdeas.length];
        const platform = projectData.targetChannels[i % projectData.targetChannels.length];

        // Generate platform-specific content
        const platformContent = await this.generatePlatformContent({
          idea,
          platform,
          projectType: projectData.projectType,
          scheduledDate,
          aiSettings: projectData.aiSettings,
          channelType: projectData.channelType,
          contentTitle: projectData.contentTitle,
          contentDescription: projectData.contentDescription
        });

        // Create content item
        const contentData: InsertAiGeneratedContent = {
          aiProjectId,
          userId,
          title: platformContent.title,
          description: platformContent.description,
          content: platformContent.content,
          platform,
          contentType: platformContent.contentType,
          status: 'draft',
          scheduledDate,
          hashtags: platformContent.hashtags,
          metadata: platformContent.metadata,
          aiModel: 'gemini-2.5-flash',
          generationPrompt: platformContent.generationPrompt,
          confidence: platformContent.confidence,
          engagementPrediction: platformContent.engagementPrediction,
          // Enhanced fields for day-based content management
          dayNumber,
          isPaused: false,
          isStopped: false,
          canPublish: true,
          publishOrder: (i % projectData.targetChannels.length) + 1,
          contentVersion: 1,
          lastRegeneratedAt: null
        };

        const [contentItem] = await db.insert(aiGeneratedContent).values(contentData).returning();
        contentItems.push(contentItem);

        // Create calendar entry
        const calendarData: InsertAiContentCalendar = {
          aiProjectId,
          contentId: contentItem.id,
          userId,
          scheduledDate,
          scheduledTime: platformContent.optimalTime,
          platform,
          contentType: platformContent.contentType,
          status: 'scheduled',
          optimalPostingTime: true,
          engagementScore: platformContent.engagementScore,
          aiOptimized: true,
          metadata: {
            optimalTime: platformContent.optimalTime,
            engagementStrategy: platformContent.engagementStrategy,
            visualElements: platformContent.visualElements,
            callToAction: platformContent.callToAction,
            channelType: projectData.channelType,
            contentTitle: projectData.contentTitle,
            tags: projectData.tags
          }
        };

        const [calendarEntry] = await db.insert(aiContentCalendar).values(calendarData).returning();
        calendarEntries.push(calendarEntry);
      }

      return { contentItems, calendarEntries };
    } catch (error) {
      console.error('Error generating project content:', error);
      throw new Error('Failed to generate project content');
    }
  }

  /**
   * Get user's AI projects
   */
  async getUserProjects(userId: string, options: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<AiProject[]> {
    try {
      const { status, limit = 20, offset = 0 } = options;

      let query = db.select().from(aiProjects).where(eq(aiProjects.userId, userId));

      if (status) {
        query = query.where(and(eq(aiProjects.userId, userId), eq(aiProjects.status, status)));
      }

      const projects = await query
        .orderBy(desc(aiProjects.createdAt))
        .limit(limit)
        .offset(offset);

      return projects;
    } catch (error) {
      console.error('Error fetching user projects:', error);
      throw new Error('Failed to fetch user projects');
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(projectId: number, userId: string): Promise<AiProject | null> {
    try {
      const [project] = await db
        .select()
        .from(aiProjects)
        .where(and(eq(aiProjects.id, projectId), eq(aiProjects.userId, userId)));

      return project || null;
    } catch (error) {
      console.error('Error fetching project by ID:', error);
      throw new Error('Failed to fetch project');
    }
  }

  /**
   * Update project
   */
  async updateProject(projectId: number, updateData: Partial<ProjectCreationData>): Promise<AiProject> {
    try {
      const [updatedProject] = await db
        .update(aiProjects)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(aiProjects.id, projectId))
        .returning();

      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      throw new Error('Failed to update project');
    }
  }

  /**
   * Get project content
   */
  async getProjectContent(projectId: number, userId: string): Promise<AiGeneratedContent[]> {
    try {
      const content = await db
        .select()
        .from(aiGeneratedContent)
        .where(and(
          eq(aiGeneratedContent.aiProjectId, projectId),
          eq(aiGeneratedContent.userId, userId)
        ))
        .orderBy(asc(aiGeneratedContent.scheduledDate));

      return content;
    } catch (error) {
      console.error('Error fetching project content:', error);
      throw new Error('Failed to fetch project content');
    }
  }

  /**
   * Get project calendar
   */
  async getProjectCalendar(projectId: number, userId: string): Promise<AiContentCalendar[]> {
    try {
      const calendar = await db
        .select()
        .from(aiContentCalendar)
        .where(and(
          eq(aiContentCalendar.aiProjectId, projectId),
          eq(aiContentCalendar.userId, userId)
        ))
        .orderBy(asc(aiContentCalendar.scheduledDate));

      return calendar;
    } catch (error) {
      console.error('Error fetching project calendar:', error);
      throw new Error('Failed to fetch project calendar');
    }
  }

  /**
   * Regenerate project content
   */
  async regenerateProjectContent(params: {
    projectId: number;
    userId: string;
    regenerateType: 'content' | 'calendar' | 'both';
    newDuration?: number;
    newFrequency?: string;
  }): Promise<ContentGenerationResult> {
    try {
      const { projectId, userId, regenerateType, newDuration, newFrequency } = params;

      // Get existing project
      const project = await this.getProjectById(projectId, userId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Update project if new duration or frequency provided
      if (newDuration || newFrequency) {
        await this.updateProject(projectId, {
          duration: newDuration || project.duration,
          contentFrequency: newFrequency || project.contentFrequency
        });
      }

      // Delete existing content and calendar if regenerating
      if (regenerateType === 'content' || regenerateType === 'both') {
        await db.delete(aiGeneratedContent).where(eq(aiGeneratedContent.aiProjectId, projectId));
        await db.delete(aiContentCalendar).where(eq(aiContentCalendar.aiProjectId, projectId));
      }

      // Regenerate content and calendar
      const result = await this.generateProjectContent({
        aiProjectId: projectId,
        userId,
        projectData: {
          ...project,
          duration: newDuration || project.duration,
          contentFrequency: newFrequency || project.contentFrequency
        }
      });

      return result;
    } catch (error) {
      console.error('Error regenerating project content:', error);
      throw new Error('Failed to regenerate project content');
    }
  }

  /**
   * Get optimal posting times
   */
  async getOptimalPostingTimes(params: OptimalTimesRequest): Promise<Record<string, string[]>> {
    try {
      const { platforms, category, timezone = 'UTC' } = params;

      // Try to get existing patterns from database
      const existingPatterns = await db
        .select()
        .from(aiEngagementPatterns)
        .where(and(
          eq(aiEngagementPatterns.platform, platforms[0]),
          eq(aiEngagementPatterns.category, category)
        ));

      if (existingPatterns.length > 0) {
        const result: Record<string, string[]> = {};
        platforms.forEach(platform => {
          const pattern = existingPatterns.find(p => p.platform === platform);
          result[platform] = pattern ? pattern.optimalTimes as string[] : this.getFallbackOptimalTimes(platform);
        });
        return result;
      }

      // Generate optimal times using AI
      const optimalTimes = await this.generateOptimalTimesWithAI(platforms, category, timezone);

      // Store patterns in database for future use
      for (const [platform, times] of Object.entries(optimalTimes)) {
        await db.insert(aiEngagementPatterns).values({
          platform,
          category,
          optimalTimes: times,
          engagementScore: 0.8, // Default score
          sampleSize: 100 // Default sample size
        });
      }

      return optimalTimes;
    } catch (error) {
      console.error('Error getting optimal posting times:', error);
      // Return fallback times
      const result: Record<string, string[]> = {};
      platforms.forEach(platform => {
        result[platform] = this.getFallbackOptimalTimes(platform);
      });
      return result;
    }
  }

  /**
   * Get project analytics
   */
  async getProjectAnalytics(projectId: number, userId: string): Promise<ProjectAnalytics> {
    try {
      const content = await this.getProjectContent(projectId, userId);
      const calendar = await this.getProjectCalendar(projectId, userId);

      // Calculate analytics
      const contentByPlatform: Record<string, number> = {};
      const contentByType: Record<string, number> = {};
      let totalEngagement = 0;

      content.forEach(item => {
        contentByPlatform[item.platform] = (contentByPlatform[item.platform] || 0) + 1;
        contentByType[item.contentType] = (contentByType[item.contentType] || 0) + 1;
        
        if (item.engagementPrediction) {
          const prediction = item.engagementPrediction as any;
          totalEngagement += prediction.average || 0;
        }
      });

      const averageEngagement = content.length > 0 ? totalEngagement / content.length : 0;

      // Calculate project health score
      const healthScore = this.calculateProjectHealthScore(content, calendar);
      const recommendations = this.generateProjectRecommendations(content, calendar);

      return {
        totalContent: content.length,
        totalCalendarEntries: calendar.length,
        contentByPlatform,
        contentByType,
        engagementPredictions: {
          average: averageEngagement,
          byPlatform: this.calculateEngagementByPlatform(content)
        },
        optimalPostingTimes: await this.getOptimalPostingTimes({
          platforms: Object.keys(contentByPlatform),
          category: 'general'
        }),
        projectHealth: {
          score: healthScore,
          recommendations
        }
      };
    } catch (error) {
      console.error('Error getting project analytics:', error);
      throw new Error('Failed to get project analytics');
    }
  }

  /**
   * Extend project with additional days
   */
  async extendProject(params: {
    projectId: number;
    userId: string;
    additionalDays: number;
  }): Promise<ContentGenerationResult> {
    try {
      const { projectId, userId, additionalDays } = params;

      // Get existing project
      const project = await this.getProjectById(projectId, userId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Update project duration
      const newDuration = project.duration + additionalDays;
      const newEndDate = addDays(project.startDate, newDuration - 1);
      
      await this.updateProject(projectId, {
        duration: newDuration,
        endDate: newEndDate
      });

      // Get existing content to determine the last day
      const existingContent = await this.getProjectContent(projectId, userId);
      const lastDay = existingContent.length > 0 
        ? Math.max(...existingContent.map(c => c.dayNumber || 0))
        : 0;

      // Generate additional content for the new days
      const additionalContentPieces = additionalDays * project.targetChannels.length;
      const contentIdeas = await this.generateContentIdeas({
        projectType: project.projectType,
        targetChannels: project.targetChannels,
        totalPieces: additionalContentPieces,
        targetAudience: project.targetAudience,
        brandVoice: project.brandVoice,
        contentGoals: project.contentGoals,
        aiSettings: project.aiSettings,
        contentCategory: [project.projectType], // Use project type as category
        contentType: ['post'], // Default content type
        channelType: project.targetChannels,
        contentTitle: project.contentTitle,
        contentDescription: project.contentDescription,
        tags: project.tags,
        duration: additionalDays
      });

      const contentItems: AiGeneratedContent[] = [];
      const calendarEntries: AiContentCalendar[] = [];

      const startDate = addDays(project.startDate, lastDay);
      const frequencyDays = this.getFrequencyDays(project.contentFrequency);

      for (let i = 0; i < additionalContentPieces; i++) {
        const dayNumber = lastDay + Math.floor(i / project.targetChannels.length) + 1;
        const scheduledDate = addDays(startDate, Math.floor(i / project.targetChannels.length) * frequencyDays);
        const idea = contentIdeas[i % contentIdeas.length];
        const platform = project.targetChannels[i % project.targetChannels.length];

        // Generate platform-specific content
        const platformContent = await this.generatePlatformContent({
          idea,
          platform,
          projectType: project.projectType,
          scheduledDate,
          aiSettings: project.aiSettings,
          channelType: project.channelType,
          contentTitle: project.contentTitle,
          contentDescription: project.contentDescription
        });

        // Create content item
        const contentData: InsertAiGeneratedContent = {
          aiProjectId: projectId,
          userId,
          title: platformContent.title,
          description: platformContent.description,
          content: platformContent.content,
          platform,
          contentType: platformContent.contentType,
          status: 'draft',
          scheduledDate,
          hashtags: platformContent.hashtags,
          metadata: platformContent.metadata,
          aiModel: 'gemini-2.5-flash',
          generationPrompt: platformContent.generationPrompt,
          confidence: platformContent.confidence,
          engagementPrediction: platformContent.engagementPrediction,
          dayNumber,
          isPaused: false,
          isStopped: false,
          canPublish: true,
          publishOrder: (i % project.targetChannels.length) + 1,
          contentVersion: 1,
          lastRegeneratedAt: null
        };

        const [contentItem] = await db.insert(aiGeneratedContent).values(contentData).returning();
        contentItems.push(contentItem);

        // Create calendar entry
        const calendarData: InsertAiContentCalendar = {
          aiProjectId: projectId,
          contentId: contentItem.id,
          userId,
          scheduledDate,
          scheduledTime: platformContent.optimalTime,
          platform,
          contentType: platformContent.contentType,
          status: 'scheduled',
          optimalPostingTime: true,
          engagementScore: platformContent.engagementScore,
          aiOptimized: true,
          metadata: {
            optimalTime: platformContent.optimalTime,
            engagementStrategy: platformContent.engagementStrategy,
            visualElements: platformContent.visualElements,
            callToAction: platformContent.callToAction,
            channelType: project.channelType,
            contentTitle: project.contentTitle,
            tags: project.tags
          }
        };

        const [calendarEntry] = await db.insert(aiContentCalendar).values(calendarData).returning();
        calendarEntries.push(calendarEntry);
      }

      return { contentItems, calendarEntries };
    } catch (error) {
      console.error('Error extending project:', error);
      throw new Error('Failed to extend project');
    }
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: number, userId: string): Promise<void> {
    try {
      // Delete calendar entries first
      await db.delete(aiContentCalendar).where(eq(aiContentCalendar.aiProjectId, projectId));
      
      // Delete content
      await db.delete(aiGeneratedContent).where(eq(aiGeneratedContent.aiProjectId, projectId));
      
      // Delete project
      await db.delete(aiProjects).where(and(
        eq(aiProjects.id, projectId),
        eq(aiProjects.userId, userId)
      ));
    } catch (error) {
      console.error('Error deleting project:', error);
      throw new Error('Failed to delete project');
    }
  }

  // Private helper methods

  private calculateEndDate(startDate: string | undefined, duration: number): Date {
    const start = startDate ? new Date(startDate) : new Date();
    return addDays(start, duration);
  }

  private calculateContentPieces(duration: number, frequency: string): number {
    const frequencyDays = this.getFrequencyDays(frequency);
    return Math.ceil(duration / frequencyDays);
  }

  private getFrequencyDays(frequency: string): number {
    const frequencyMap = {
      'daily': 1,
      'weekly': 7,
      'bi-weekly': 14,
      'monthly': 30
    };
    return frequencyMap[frequency as keyof typeof frequencyMap] || 7;
  }

  private async generateContentIdeas(params: {
    projectType: string;
    targetChannels: string[];
    totalPieces: number;
    targetAudience?: string;
    brandVoice?: string;
    contentGoals?: string[];
    aiSettings?: any;
    contentCategory: string[];
    contentType: string[];
    channelType: string[];
    contentTitle?: string;
    contentDescription?: string;
    tags?: string[];
    duration?: number;
  }): Promise<Array<{ topic: string; angle: string; targetAudience: string; contentType: string }>> {
    try {
      const prompt = `
        Generate ${params.totalPieces} creative content ideas for a ${params.projectType} social media project.

        Project Details:
        - Content Title: ${params.contentTitle || 'Not specified'}
        - Content Description: ${params.contentDescription || 'Not specified'}
        - Content Categories: ${params.contentCategory.join(', ')}
        - Content Types: ${params.contentType.join(', ')}
        - Channel Types: ${params.channelType.join(', ')}
        - Tags: ${params.tags?.join(', ') || 'Not specified'}
        - Duration: ${params.duration || 'Not specified'} days
        - Platforms: ${params.targetChannels.join(', ')}
        - Target Audience: ${params.targetAudience || 'General audience'}
        - Brand Voice: ${params.brandVoice || 'Professional'}
        - Content Goals: ${params.contentGoals?.join(', ') || 'Engagement and awareness'}

        Requirements:
        - Generate content for the selected content categories: ${params.contentCategory.join(', ')}
        - Create content using the specified types: ${params.contentType.join(', ')}
        - Optimize for the selected channel types: ${params.channelType.join(', ')}
        - Consider optimal posting times for maximum engagement
        - Align with the specified content title and description
        - Incorporate relevant tags: ${params.tags?.join(', ') || 'none specified'}
        - Create content series that spans the ${params.duration} day duration
        - Each piece should build on the previous content in the series

        For each idea, provide:
        1. A compelling topic/title
        2. A unique angle or perspective
        3. Target audience description
        4. Content type (post, reel, short, story, video, blog)

        Return as JSON array with format:
        [
          {
            "topic": "Creative topic title",
            "angle": "Unique perspective or approach",
            "targetAudience": "Specific audience description",
            "contentType": "post"
          }
        ]

        Make each idea engaging, platform-appropriate, and aligned with current trends.
      `;

      // Use Gemini API instead of OpenAI
      const { GeminiService } = await import('../services/gemini');
      const response = await GeminiService.generateText(prompt, {
        temperature: 0.8,
        maxTokens: 2000,
        systemInstruction: 'You are a creative social media strategist with expertise in content planning and audience engagement. Generate innovative, trend-aware content ideas that drive engagement and consider optimal posting strategies.'
      });

      if (!response) throw new Error('No content generated');

      // Try to parse JSON from the response
      let ideas;
      try {
        ideas = JSON.parse(response);
      } catch (parseError) {
        // If direct parsing fails, try to extract JSON from the response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          ideas = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse JSON from Gemini response');
        }
      }

      return Array.isArray(ideas) ? ideas : [];
    } catch (error) {
      console.error('Error generating content ideas:', error);
      return this.getFallbackContentIdeas(params.projectType, params.totalPieces);
    }
  }

  private async generatePlatformContent(params: {
    idea: { topic: string; angle: string; targetAudience: string; contentType: string };
    platform: string;
    projectType: string;
    scheduledDate: Date;
    aiSettings?: any;
    channelType?: string;
    contentTitle?: string;
    contentDescription?: string;
  }): Promise<{
    title: string;
    description: string;
    content: string;
    contentType: string;
    hashtags: string[];
    optimalTime: string;
    engagementScore: number;
    metadata: any;
    generationPrompt: string;
    confidence: number;
    engagementPrediction: any;
    engagementStrategy: string;
    visualElements: string[];
    callToAction: string;
  }> {
    try {
      const platformConfig = this.getPlatformConfig(params.platform);
      
      const prompt = `
        Create ${params.idea.contentType || platformConfig.contentType} content for ${params.platform} based on this idea:

        Project Context:
        - Main Content Title: ${params.contentTitle || 'Not specified'}
        - Content Description: ${params.contentDescription || 'Not specified'}
        - Channel Type: ${params.channelType || params.platform}

        Content Details:
        - Topic: ${params.idea.topic}
        - Angle: ${params.idea.angle}
        - Target Audience: ${params.idea.targetAudience}
        - Project Type: ${params.projectType}
        - Scheduled Date: ${format(params.scheduledDate, 'MMMM d, yyyy')}

        Style: ${platformConfig.style}
        Max Length: ${platformConfig.maxLength} characters
        Content Type: ${params.idea.contentType || platformConfig.contentType}

        Generate:
        1. A compelling title (max 100 characters)
        2. An engaging description/caption (max ${platformConfig.maxLength} characters)
        3. Full content text optimized for the content type
        4. 5-10 relevant hashtags
        5. Platform-specific metadata
        6. Optimal posting time for maximum engagement
        7. Engagement prediction based on content type and audience
        8. Visual elements suggestions
        9. Call to action appropriate for the content type

        Return as JSON:
        {
          "title": "Compelling title",
          "description": "Engaging description with emojis and call-to-action",
          "content": "Full content text optimized for ${params.idea.contentType || platformConfig.contentType}",
          "hashtags": ["#hashtag1", "#hashtag2", ...],
          "optimalTime": "HH:MM",
          "engagementScore": 0.85,
          "metadata": {
            "optimalPostingTime": "suggested time",
            "engagementStrategy": "strategy description",
            "visualElements": ["element1", "element2"],
            "callToAction": "specific CTA"
          },
          "generationPrompt": "prompt used",
          "confidence": 0.9,
          "engagementPrediction": {
            "average": 85,
            "likes": 120,
            "comments": 15,
            "shares": 8
          }
        }
      `;

      // Use Gemini API instead of OpenAI
      const { GeminiService } = await import('../services/gemini');
      const response = await GeminiService.generateText(prompt, {
        temperature: 0.7,
        maxTokens: 1500,
        systemInstruction: `You are a ${params.platform} content specialist with deep knowledge of platform algorithms, audience behavior, and engagement strategies. Create content that maximizes reach and engagement for ${params.idea.contentType || platformConfig.contentType} content.`
      });

      if (!response) throw new Error('No content generated');

      // Try to parse JSON from the response
      let result;
      try {
        result = JSON.parse(response);
      } catch (parseError) {
        // If direct parsing fails, try to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse JSON from Gemini response');
        }
      }
      return {
        title: result.title,
        description: result.description,
        content: result.content,
        contentType: params.idea.contentType || platformConfig.contentType,
        hashtags: result.hashtags || [],
        optimalTime: result.optimalTime || '12:00',
        engagementScore: result.engagementScore || 0.8,
        metadata: result.metadata || {},
        generationPrompt: result.generationPrompt || prompt,
        confidence: result.confidence || 0.9,
        engagementPrediction: result.engagementPrediction || { average: 80 },
        engagementStrategy: result.metadata?.engagementStrategy || 'Engage with comments',
        visualElements: result.metadata?.visualElements || ['High-quality image'],
        callToAction: result.metadata?.callToAction || 'Share your thoughts!'
      };
    } catch (error) {
      console.error('Error generating platform content:', error);
      return this.getFallbackPlatformContent(params);
    }
  }

  private getPlatformConfig(platform: string) {
    const configs = {
      instagram: {
        contentType: 'post',
        style: 'Visual storytelling with engaging captions and relevant hashtags',
        maxLength: 2200
      },
      facebook: {
        contentType: 'post',
        style: 'Community-focused content with longer-form descriptions',
        maxLength: 63206
      },
      tiktok: {
        contentType: 'short',
        style: 'Trendy, short-form video content with viral potential',
        maxLength: 300
      },
      youtube: {
        contentType: 'video',
        style: 'Educational or entertaining video content with detailed descriptions',
        maxLength: 5000
      },
      linkedin: {
        contentType: 'post',
        style: 'Professional, industry-focused content with business insights',
        maxLength: 3000
      }
    };

    return configs[platform as keyof typeof configs] || configs.instagram;
  }

  private async generateOptimalTimesWithAI(platforms: string[], category: string, timezone: string): Promise<Record<string, string[]>> {
    try {
      const prompt = `
        Based on current social media analytics and trends for ${category} content, 
        provide optimal posting times for each platform:
        
        Platforms: ${platforms.join(', ')}
        Timezone: ${timezone}
        
        Consider:
        - Platform-specific audience behavior
        - Content category performance patterns
        - Time zone considerations
        - Day of week patterns
        - Seasonal trends
        
        Return as JSON:
        {
          "instagram": ["09:00", "12:00", "17:00"],
          "facebook": ["09:00", "13:00", "15:00"],
          ...
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a social media analytics expert with access to real-time platform data and audience behavior insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No posting times generated');

      return JSON.parse(content);
    } catch (error) {
      console.error('Error generating optimal times with AI:', error);
      const result: Record<string, string[]> = {};
      platforms.forEach(platform => {
        result[platform] = this.getFallbackOptimalTimes(platform);
      });
      return result;
    }
  }

  private getFallbackOptimalTimes(platform: string): string[] {
    const defaultTimes = {
      instagram: ['09:00', '12:00', '17:00'],
      facebook: ['09:00', '13:00', '15:00'],
      tiktok: ['06:00', '10:00', '19:00'],
      youtube: ['14:00', '20:00'],
      linkedin: ['08:00', '12:00', '17:00']
    };

    return defaultTimes[platform as keyof typeof defaultTimes] || ['09:00', '17:00'];
  }

  private getFallbackContentIdeas(projectType: string, count: number): Array<{ topic: string; angle: string; targetAudience: string }> {
    const fallbackIdeas = {
      fitness: [
        { topic: "5-Minute Morning Workout", angle: "Quick routines for busy professionals", targetAudience: "Working adults with limited time" },
        { topic: "Healthy Meal Prep Tips", angle: "Budget-friendly nutrition strategies", targetAudience: "Health-conscious individuals" },
        { topic: "Workout Motivation", angle: "Overcoming fitness plateaus", targetAudience: "Fitness enthusiasts" }
      ],
      business: [
        { topic: "Startup Success Stories", angle: "Lessons from failed ventures", targetAudience: "Entrepreneurs and business owners" },
        { topic: "Digital Marketing Trends", angle: "2024 strategies that work", targetAudience: "Marketing professionals" },
        { topic: "Leadership Development", angle: "Building high-performing teams", targetAudience: "Managers and executives" }
      ],
      lifestyle: [
        { topic: "Minimalist Living", angle: "Decluttering for mental clarity", targetAudience: "People seeking simplicity" },
        { topic: "Sustainable Living", angle: "Easy eco-friendly swaps", targetAudience: "Environmentally conscious individuals" },
        { topic: "Productivity Hacks", angle: "Time management for busy lives", targetAudience: "Professionals and students" }
      ]
    };

    const categoryIdeas = fallbackIdeas[projectType as keyof typeof fallbackIdeas] || fallbackIdeas.lifestyle;
    const result = [];
    
    for (let i = 0; i < count; i++) {
      result.push(categoryIdeas[i % categoryIdeas.length]);
    }
    
    return result;
  }

  private getFallbackPlatformContent(params: {
    idea: { topic: string; angle: string; targetAudience: string };
    platform: string;
    projectType: string;
    scheduledDate: Date;
  }): any {
    const platformConfig = this.getPlatformConfig(params.platform);
    const emoji = this.getPlatformEmoji(params.platform);

    return {
      title: `${emoji} ${params.idea.topic}`,
      description: `${params.idea.angle}\n\nPerfect for: ${params.idea.targetAudience}\n\n#${params.projectType} #content #socialmedia`,
      content: `${params.idea.topic}\n\n${params.idea.angle}\n\nPerfect for: ${params.idea.targetAudience}`,
      contentType: platformConfig.contentType,
      hashtags: [`#${params.projectType}`, '#content', '#socialmedia', '#trending'],
      optimalTime: '12:00',
      engagementScore: 0.7,
      metadata: {
        optimalPostingTime: '12:00',
        engagementStrategy: 'Ask questions to encourage comments',
        visualElements: ['High-quality image', 'Engaging caption'],
        callToAction: 'Share your thoughts in the comments!'
      },
      generationPrompt: 'Fallback content generation',
      confidence: 0.6,
      engagementPrediction: { average: 70 },
      engagementStrategy: 'Engage with comments',
      visualElements: ['High-quality image'],
      callToAction: 'Share your thoughts!'
    };
  }

  private getPlatformEmoji(platform: string): string {
    const emojis = {
      instagram: '📸',
      facebook: '👥',
      tiktok: '🎵',
      youtube: '🎥',
      linkedin: '💼'
    };
    return emojis[platform as keyof typeof emojis] || '📱';
  }

  private calculateProjectHealthScore(content: AiGeneratedContent[], calendar: AiContentCalendar[]): number {
    let score = 0;
    
    // Content diversity (30 points)
    const platforms = new Set(content.map(c => c.platform));
    const types = new Set(content.map(c => c.contentType));
    score += Math.min(30, (platforms.size * 10) + (types.size * 5));
    
    // Calendar coverage (25 points)
    const calendarCoverage = calendar.length / content.length;
    score += Math.min(25, calendarCoverage * 25);
    
    // AI optimization (25 points)
    const aiOptimized = calendar.filter(c => c.aiOptimized).length;
    score += Math.min(25, (aiOptimized / calendar.length) * 25);
    
    // Engagement predictions (20 points)
    const avgEngagement = content.reduce((sum, c) => {
      const prediction = c.engagementPrediction as any;
      return sum + (prediction?.average || 0);
    }, 0) / content.length;
    score += Math.min(20, (avgEngagement / 100) * 20);
    
    return Math.round(score);
  }

  private generateProjectRecommendations(content: AiGeneratedContent[], calendar: AiContentCalendar[]): string[] {
    const recommendations = [];
    
    if (content.length < 7) {
      recommendations.push('Consider adding more content pieces for better coverage');
    }
    
    const platforms = new Set(content.map(c => c.platform));
    if (platforms.size < 2) {
      recommendations.push('Diversify your content across more platforms');
    }
    
    const aiOptimized = calendar.filter(c => c.aiOptimized).length;
    if (aiOptimized / calendar.length < 0.8) {
      recommendations.push('Enable AI optimization for more calendar entries');
    }
    
    const avgEngagement = content.reduce((sum, c) => {
      const prediction = c.engagementPrediction as any;
      return sum + (prediction?.average || 0);
    }, 0) / content.length;
    
    if (avgEngagement < 70) {
      recommendations.push('Focus on improving content engagement through better captions and hashtags');
    }
    
    return recommendations;
  }

  private calculateEngagementByPlatform(content: AiGeneratedContent[]): Record<string, number> {
    const engagementByPlatform: Record<string, number[]> = {};
    
    content.forEach(item => {
      const prediction = item.engagementPrediction as any;
      const engagement = prediction?.average || 0;
      
      if (!engagementByPlatform[item.platform]) {
        engagementByPlatform[item.platform] = [];
      }
      engagementByPlatform[item.platform].push(engagement);
    });
    
    const result: Record<string, number> = {};
    Object.entries(engagementByPlatform).forEach(([platform, engagements]) => {
      result[platform] = engagements.reduce((sum, val) => sum + val, 0) / engagements.length;
    });
    
    return result;
  }
}

export const aiProjectManager = new AIProjectManager();
