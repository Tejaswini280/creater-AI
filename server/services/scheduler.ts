import { nanoid } from 'nanoid';
import cron from 'node-cron';
import { storage } from '../storage';
import { db } from '../db';
import { content } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

export interface ScheduledContent {
  id: string;
  userId: string;
  title: string;
  description: string;
  content: string;
  platform: 'linkedin' | 'youtube' | 'instagram' | 'twitter' | 'tiktok';
  status: 'scheduled' | 'published' | 'failed' | 'cancelled';
  scheduledAt: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    mediaUrl?: string;
    tags?: string[];
    visibility?: 'public' | 'connections' | 'private';
    category?: string;
  };
}

export interface ScheduleConfig {
  timezone: string;
  optimalTimes: {
    linkedin: string[];
    youtube: string[];
    instagram: string[];
    twitter: string[];
    tiktok: string[];
  };
  frequency: 'daily' | 'weekly' | 'monthly';
  autoRetry: boolean;
  maxRetries: number;
}

export class ContentSchedulerService {
  private static instance: ContentSchedulerService;
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();
  private scheduleConfig: ScheduleConfig = {
    timezone: 'UTC',
    optimalTimes: {
      linkedin: ['09:00', '12:00', '17:00'],
      youtube: ['15:00', '19:00', '21:00'],
      instagram: ['11:00', '14:00', '18:00'],
      twitter: ['08:00', '12:00', '16:00', '20:00'],
      tiktok: ['12:00', '16:00', '19:00', '22:00']
    },
    frequency: 'daily',
    autoRetry: true,
    maxRetries: 3
  };

  public static getInstance(): ContentSchedulerService {
    if (!ContentSchedulerService.instance) {
      ContentSchedulerService.instance = new ContentSchedulerService();
    }
    return ContentSchedulerService.instance;
  }

  /**
   * Initialize the scheduler service and start monitoring
   */
  public async initialize(): Promise<void> {
    console.log('🚀 Initializing Content Scheduler Service...');
    
    try {
      // Load existing scheduled content and reschedule jobs
      await this.loadExistingSchedules();
      
      // Start monitoring for new scheduled content
      this.startMonitoring();
      
      console.log('✅ Content Scheduler Service initialized successfully');
    } catch (error) {
      console.error('❌ FATAL: Content Scheduler Service initialization failed:', error);
      console.error('   Scheduler will NOT start until database schema is fixed');
      console.error('   Run pending migrations to resolve this issue');
      console.error('   DO NOT mask this error - it indicates a critical schema problem');
      
      // DO NOT start monitoring if schema is incomplete
      // This prevents continuous error spam and false sense of functionality
      throw error; // Re-throw to prevent application from starting with broken scheduler
    }
  }

  /**
   * Load existing scheduled content from database and reschedule jobs
   */
  private async loadExistingSchedules(): Promise<void> {
    try {
      // Verify database connection and schema before querying
      console.log('📋 Checking database schema for scheduler...');
      
      // CRITICAL: Check ALL columns that the scheduler actually uses
      // This prevents false positives where verification passes but queries fail
      const requiredColumns = [
        'id', 'user_id', 'title', 'description', 'script', 
        'platform', 'status', 'scheduled_at', 'created_at', 'updated_at'
      ];
      
      // FIXED: Use proper SQL query with explicit column list (no positional parameters)
      // Build the IN clause dynamically to avoid parameter binding issues
      const columnList = requiredColumns.map(col => `'${col}'`).join(', ');
      const schemaCheck = await db.execute(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'content' 
        AND column_name IN (${columnList})
      `);
      
      const foundColumns = schemaCheck.map((row: any) => row.column_name);
      const missingColumns = requiredColumns.filter(col => !foundColumns.includes(col));
      
      if (missingColumns.length > 0) {
        const errorMsg = `Content table schema is incomplete. Missing required columns: ${missingColumns.join(', ')}`;
        console.error('❌ ' + errorMsg);
        console.error('   Found columns:', foundColumns.join(', '));
        console.error('   Required columns:', requiredColumns.join(', '));
        console.error('   Run migrations to fix schema before starting scheduler');
        throw new Error(errorMsg);
      }
      
      console.log(`✅ Database schema verified - all ${requiredColumns.length} required columns present`);
      
      const scheduledContent = await db
        .select()
        .from(content)
        .where(and(
          eq(content.status, 'scheduled')
        ));

      console.log(`📅 Found ${scheduledContent.length} scheduled content items to reschedule`);

      for (const item of scheduledContent) {
        if (item.scheduledAt && new Date(item.scheduledAt) > new Date()) {
          this.scheduleJob({
            id: item.id.toString(),
            userId: item.userId,
            title: item.title,
            description: item.description || '',
            content: item.script || '',
            platform: item.platform as any,
            status: 'scheduled',
            scheduledAt: new Date(item.scheduledAt),
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
            metadata: item.metadata as any
          });
        }
      }
    } catch (error) {
      console.error('❌ FATAL: Cannot load existing schedules due to schema error:', error);
      console.error('   Scheduler initialization FAILED - schema must be fixed before starting');
      console.error('   This is NOT expected - it indicates missing database migrations');
      throw error; // Re-throw to prevent scheduler from starting with incomplete schema
    }
  }

  /**
   * Start monitoring for database changes (polling approach)
   */
  private startMonitoring(): void {
    // Check for new scheduled content every minute
    cron.schedule('* * * * *', async () => {
      try {
        await this.checkForNewSchedules();
      } catch (error) {
        console.error('Error in monitoring task:', error);
      }
    });
  }

  /**
   * Check for newly scheduled content that needs job creation
   */
  private async checkForNewSchedules(): Promise<void> {
    try {
      const scheduledContent = await db
        .select()
        .from(content)
        .where(and(
          eq(content.status, 'scheduled')
        ));

      for (const item of scheduledContent) {
        const jobId = `content_${item.id}`;
        
        // Only schedule if job doesn't exist and scheduled time is in future
        if (!this.scheduledJobs.has(jobId) && 
            item.scheduledAt && 
            new Date(item.scheduledAt) > new Date()) {
          
          this.scheduleJob({
            id: item.id.toString(),
            userId: item.userId,
            title: item.title,
            description: item.description || '',
            content: item.script || '',
            platform: item.platform as any,
            status: 'scheduled',
            scheduledAt: new Date(item.scheduledAt),
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
            metadata: item.metadata as any
          });
        }
      }
    } catch (error) {
      console.error('Error checking for new schedules:', error);
    }
  }
  public async scheduleContent(content: Omit<ScheduledContent, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduledContent> {
    try {
      const scheduledContent: ScheduledContent = {
        id: nanoid(),
        ...content,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to database using storage service
      await storage.createScheduledContent({
        userId: scheduledContent.userId,
        title: scheduledContent.title,
        description: scheduledContent.description,
        platform: scheduledContent.platform,
        contentType: 'video', // Default content type
        scheduledAt: scheduledContent.scheduledAt,
        status: 'scheduled',
        script: scheduledContent.content,
        metadata: scheduledContent.metadata
      });

      // Schedule the job
      this.scheduleJob(scheduledContent);

      return scheduledContent;
    } catch (error) {
      console.error('Error scheduling content:', error);
      throw new Error('Failed to schedule content');
    }
  }

  /**
   * Schedule a cron job for content publishing
   */
  private scheduleJob(content: ScheduledContent): void {
    const jobId = `content_${content.id}`;
    
    // Cancel existing job if it exists
    if (this.scheduledJobs.has(jobId)) {
      this.scheduledJobs.get(jobId)?.stop();
      this.scheduledJobs.delete(jobId);
    }

    // Create cron expression from scheduled date
    const cronExpression = this.dateToCronExpression(content.scheduledAt);
    
    const job = cron.schedule(cronExpression, async () => {
      try {
        await this.publishContent(content);
      } catch (error) {
        console.error(`Error publishing scheduled content ${content.id}:`, error);
        await this.handlePublishError(content, error);
      }
    }, {
      scheduled: true,
      timezone: this.scheduleConfig.timezone
    });

    this.scheduledJobs.set(jobId, job);
    console.log(`Scheduled content ${content.id} for ${content.scheduledAt}`);
  }

  /**
   * Convert date to cron expression
   */
  private dateToCronExpression(date: Date): string {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    
    // Use specific date format for one-time execution
    return `${minute} ${hour} ${day} ${month} *`;
  }

  /**
   * Publish scheduled content
   */
  private async publishContent(content: ScheduledContent): Promise<void> {
    try {
      console.log(`Publishing content ${content.id} to ${content.platform}`);

      // Update status to publishing
      await storage.updateScheduledContent(content.id, {
        status: 'published',
        publishedAt: new Date(),
        updatedAt: new Date()
      });

      // Publish to platform
      switch (content.platform) {
        case 'linkedin':
          await this.publishToLinkedIn(content);
          break;
        case 'youtube':
          await this.publishToYouTube(content);
          break;
        case 'instagram':
          await this.publishToInstagram(content);
          break;
        case 'twitter':
          await this.publishToTwitter(content);
          break;
        case 'tiktok':
          await this.publishToTikTok(content);
          break;
        default:
          throw new Error(`Unsupported platform: ${content.platform}`);
      }

      console.log(`Successfully published content ${content.id}`);
    } catch (error) {
      console.error(`Failed to publish content ${content.id}:`, error);
      throw error;
    }
  }

  /**
   * Publish to LinkedIn
   */
  private async publishToLinkedIn(content: ScheduledContent): Promise<void> {
    try {
      // Get user's LinkedIn access token
      const user = await storage.getUserById(content.userId);
      if (!user?.linkedinAccessToken) {
        throw new Error('LinkedIn access token not found');
      }

      // Import LinkedIn service
      const { LinkedInService } = await import('./linkedin');
      const linkedinService = LinkedInService.getInstance();

      await linkedinService.publishPost(user.linkedinAccessToken, {
        id: user.linkedinProfileId || content.userId,
        content: content.content,
        visibility: content.metadata?.visibility as 'public' | 'connections' || 'public',
        media: content.metadata?.mediaUrl ? {
          type: 'image',
          url: content.metadata.mediaUrl
        } : undefined
      });
    } catch (error) {
      console.error('LinkedIn publish error:', error);
      throw error;
    }
  }

  /**
   * Publish to YouTube
   */
  private async publishToYouTube(content: ScheduledContent): Promise<void> {
    try {
      // Get user's YouTube credentials
      const user = await storage.getUserById(content.userId);
      if (!user?.youtubeAccessToken) {
        throw new Error('YouTube access token not found');
      }

      // Import YouTube service
      const { YouTubeService } = await import('./youtube');
      const youtubeService = new YouTubeService();

      await youtubeService.uploadVideo({
        title: content.title,
        description: content.description,
        content: content.content,
        accessToken: user.youtubeAccessToken,
        metadata: content.metadata
      });
    } catch (error) {
      console.error('YouTube publish error:', error);
      throw error;
    }
  }

  /**
   * Publish to Instagram
   */
  private async publishToInstagram(content: ScheduledContent): Promise<void> {
    try {
      // Instagram API integration would go here
      // For now, simulate successful publishing
      console.log(`Simulating Instagram publish for content ${content.id}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Instagram publish error:', error);
      throw error;
    }
  }

  /**
   * Publish to Twitter
   */
  private async publishToTwitter(content: ScheduledContent): Promise<void> {
    try {
      // Twitter API integration would go here
      // For now, simulate successful publishing
      console.log(`Simulating Twitter publish for content ${content.id}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Twitter publish error:', error);
      throw error;
    }
  }

  /**
   * Publish to TikTok
   */
  private async publishToTikTok(content: ScheduledContent): Promise<void> {
    try {
      // TikTok API integration would go here
      // For now, simulate successful publishing
      console.log(`Simulating TikTok publish for content ${content.id}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('TikTok publish error:', error);
      throw error;
    }
  }

  /**
   * Handle publishing errors
   */
  private async handlePublishError(content: ScheduledContent, error: any): Promise<void> {
    try {
      const retryCount = (content.metadata?.retryCount as number) || 0;
      
      if (this.scheduleConfig.autoRetry && retryCount < this.scheduleConfig.maxRetries) {
        // Retry with exponential backoff
        const backoffMinutes = Math.pow(2, retryCount) * 15; // 15, 30, 60 minutes
        const retryTime = new Date(Date.now() + backoffMinutes * 60 * 1000);
        
        await storage.updateScheduledContent(content.id, {
          status: 'scheduled',
          scheduledAt: retryTime,
          updatedAt: new Date(),
          metadata: {
            ...content.metadata,
            retryCount: retryCount + 1,
            lastError: error.message
          }
        });

        // Reschedule the job
        const updatedContent = await storage.getScheduledContent(content.id);
        if (updatedContent) {
          this.scheduleJob(updatedContent);
        }
      } else {
        // Mark as failed
        await storage.updateScheduledContent(content.id, {
          status: 'failed',
          updatedAt: new Date(),
          metadata: {
            ...content.metadata,
            lastError: error.message
          }
        });
      }
    } catch (updateError) {
      console.error('Error handling publish failure:', updateError);
    }
  }

  /**
   * Get scheduled content for user
   */
  public async getScheduledContent(userId: string, status?: string): Promise<ScheduledContent[]> {
    try {
      return await storage.getScheduledContent(userId, status);
    } catch (error) {
      console.error('Error fetching scheduled content:', error);
      throw new Error('Failed to fetch scheduled content');
    }
  }

  /**
   * Cancel scheduled content
   */
  public async cancelScheduledContent(contentId: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      const content = await storage.getScheduledContentById(contentId);
      if (!content || content.userId !== userId) {
        throw new Error('Content not found or access denied');
      }

      // Cancel the job
      const jobId = `content_${contentId}`;
      if (this.scheduledJobs.has(jobId)) {
        this.scheduledJobs.get(jobId)?.stop();
        this.scheduledJobs.delete(jobId);
      }

      // Update status
      await storage.updateScheduledContent(contentId, {
        status: 'cancelled',
        updatedAt: new Date()
      });

      console.log(`Cancelled scheduled content ${contentId}`);
    } catch (error) {
      console.error('Error cancelling scheduled content:', error);
      throw new Error('Failed to cancel scheduled content');
    }
  }

  /**
   * Reschedule content
   */
  public async rescheduleContent(contentId: string, userId: string, newScheduledAt: Date): Promise<ScheduledContent> {
    try {
      // Verify ownership
      const content = await storage.getScheduledContentById(contentId);
      if (!content || content.userId !== userId) {
        throw new Error('Content not found or access denied');
      }

      // Cancel existing job
      const jobId = `content_${contentId}`;
      if (this.scheduledJobs.has(jobId)) {
        this.scheduledJobs.get(jobId)?.stop();
        this.scheduledJobs.delete(jobId);
      }

      // Update schedule
      const updatedContent = await storage.updateScheduledContent(contentId, {
        scheduledAt: newScheduledAt,
        status: 'scheduled',
        updatedAt: new Date()
      });

      // Reschedule the job
      if (updatedContent) {
        this.scheduleJob(updatedContent);
      }

      return updatedContent;
    } catch (error) {
      console.error('Error rescheduling content:', error);
      throw new Error('Failed to reschedule content');
    }
  }

  /**
   * Get optimal posting times for platform
   */
  public getOptimalTimes(platform: string): string[] {
    return this.scheduleConfig.optimalTimes[platform as keyof typeof this.scheduleConfig.optimalTimes] || [];
  }

  /**
   * Suggest optimal posting time
   */
  public suggestOptimalTime(platform: string, date: Date = new Date()): Date {
    const optimalTimes = this.getOptimalTimes(platform);
    if (optimalTimes.length === 0) {
      return date;
    }

    // Get next optimal time
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    for (const timeStr of optimalTimes) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const optimalTime = new Date(today);
      optimalTime.setHours(hours, minutes, 0, 0);
      
      if (optimalTime > now) {
        return optimalTime;
      }
    }

    // If no optimal time today, use first optimal time tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [hours, minutes] = optimalTimes[0].split(':').map(Number);
    tomorrow.setHours(hours, minutes, 0, 0);
    
    return tomorrow;
  }

  /**
   * Bulk schedule content
   */
  public async bulkScheduleContent(contents: Omit<ScheduledContent, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<ScheduledContent[]> {
    try {
      const scheduledContents: ScheduledContent[] = [];
      
      for (const content of contents) {
        const scheduled = await this.scheduleContent(content);
        scheduledContents.push(scheduled);
      }
      
      return scheduledContents;
    } catch (error) {
      console.error('Error bulk scheduling content:', error);
      throw new Error('Failed to bulk schedule content');
    }
  }

  /**
   * Get scheduling analytics
   */
  public async getSchedulingAnalytics(userId: string): Promise<{
    totalScheduled: number;
    totalPublished: number;
    totalFailed: number;
    successRate: number;
    averageEngagement: number;
    platformBreakdown: Record<string, number>;
  }> {
    try {
      const allContent = await storage.getScheduledContent(userId);
      
      const analytics = {
        totalScheduled: allContent.length,
        totalPublished: allContent.filter(c => c.status === 'published').length,
        totalFailed: allContent.filter(c => c.status === 'failed').length,
        successRate: 0,
        averageEngagement: 0,
        platformBreakdown: {} as Record<string, number>
      };

      // Calculate success rate
      if (analytics.totalScheduled > 0) {
        analytics.successRate = (analytics.totalPublished / analytics.totalScheduled) * 100;
      }

      // Calculate platform breakdown
      allContent.forEach(content => {
        analytics.platformBreakdown[content.platform] = (analytics.platformBreakdown[content.platform] || 0) + 1;
      });

      return analytics;
    } catch (error) {
      console.error('Error getting scheduling analytics:', error);
      throw new Error('Failed to get scheduling analytics');
    }
  }

  /**
   * Initialize scheduler on startup
   */
  public async initializeScheduler(): Promise<void> {
    try {
      console.log('Initializing content scheduler...');
      
      // Load all scheduled content from database
      const allScheduledContent = await storage.getAllScheduledContent();
      
      // Schedule jobs for all pending content
      for (const content of allScheduledContent) {
        if (content.status === 'scheduled' && content.scheduledAt > new Date()) {
          this.scheduleJob(content);
        }
      }
      
      console.log(`Scheduled ${allScheduledContent.length} content items`);
    } catch (error) {
      console.error('Error initializing scheduler:', error);
    }
  }

  /**
   * Clean up completed jobs
   */
  public cleanupCompletedJobs(): void {
    const now = new Date();
    
    for (const [jobId, job] of this.scheduledJobs.entries()) {
      // Remove jobs that have already run
      if (jobId.includes('content_')) {
        const contentId = jobId.replace('content_', '');
        // This is a simplified check - in production you'd check the actual scheduled time
        this.scheduledJobs.delete(jobId);
      }
    }
  }
} 