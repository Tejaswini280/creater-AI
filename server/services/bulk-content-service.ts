import { AISuggestionsService, ContentSuggestionsRequest } from './ai-suggestions';
import { TrendsService } from './trends';
import { ContentSchedulerService, ScheduledContent } from './scheduler';
import { nanoid } from 'nanoid';

export interface BulkContentGenerationRequest {
  projectId: string;
  userId: string;
  contentTitle: string;
  contentType: string;
  platform: string;
  schedulingDuration: '1week' | '15days' | '30days';
  startDate?: string; // ISO string for the start date
  targetAudience?: string;
  tone?: string;
}

export interface BulkContentGenerationResult {
  success: boolean;
  generatedContent: GeneratedContentItem[];
  scheduledContent: ScheduledContent[];
  totalItems: number;
  message: string;
}

export interface GeneratedContentItem {
  id: string;
  title: string;
  caption: string;
  hashtags: string[];
  emojis: string[];
  contentType: string;
  platform: string;
  mediaSuggestions?: string[];
  scheduledAt?: Date;
  metadata: {
    trendAlignment?: string;
    engagementScore?: number;
    optimalPostingTime?: string;
  };
}

export class BulkContentService {
  private static instance: BulkContentService;
  private aiSuggestionsService: AISuggestionsService;
  private trendsService: TrendsService;
  private schedulerService: ContentSchedulerService;

  constructor() {
    this.aiSuggestionsService = new AISuggestionsService();
    this.trendsService = new TrendsService();
    this.schedulerService = ContentSchedulerService.getInstance();
  }

  public static getInstance(): BulkContentService {
    if (!BulkContentService.instance) {
      BulkContentService.instance = new BulkContentService();
    }
    return BulkContentService.instance;
  }

  /**
   * Generate and schedule bulk content based on duration
   */
  public async generateAndScheduleBulkContent(request: BulkContentGenerationRequest): Promise<BulkContentGenerationResult> {
    try {
      console.log(`🚀 Starting bulk content generation for project: ${request.projectId}`);
      console.log(`📅 Scheduling duration: ${request.schedulingDuration}`);

      // Get trending topics first
      const trendingTopics = await this.getRelevantTrends(request.contentTitle, request.platform);

      // Calculate number of content items based on duration
      const contentCount = this.getContentCountForDuration(request.schedulingDuration);

      console.log(`📊 Generating ${contentCount} content items`);

      // Generate content items
      const generatedContent = await this.generateContentItems(request, contentCount, trendingTopics);

      // Schedule content evenly across the duration
      const scheduledContent = await this.scheduleContentEvenly(request, generatedContent);

      return {
        success: true,
        generatedContent,
        scheduledContent,
        totalItems: generatedContent.length,
        message: `Successfully generated and scheduled ${generatedContent.length} content items for ${request.schedulingDuration}`
      };

    } catch (error) {
      console.error('❌ Bulk content generation failed:', error);
      throw new Error(`Failed to generate and schedule bulk content: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get relevant trending topics for content alignment
   */
  private async getRelevantTrends(contentTitle: string, platform: string): Promise<string[]> {
    try {
      const trendingRequest = {
        niche: contentTitle.toLowerCase(),
        platform: platform,
        timeframe: 'weekly' as const,
        limit: 5
      };

      const trends = await this.trendsService.getTrendingTopics(trendingRequest);
      return trends.map(trend => trend.name);
    } catch (error) {
      console.warn('Failed to fetch trends, using fallback:', error);
      return ['Trending Content', 'Viral Content', 'Engaging Content'];
    }
  }

  /**
   * Calculate content count based on scheduling duration
   */
  private getContentCountForDuration(duration: string): number {
    switch (duration) {
      case '1week':
        return 7; // One post per day
      case '15days':
        return 12; // 3 posts per week
      case '30days':
        return 24; // 6 posts per week
      default:
        return 7;
    }
  }

  /**
   * Generate content items with AI suggestions
   */
  private async generateContentItems(
    request: BulkContentGenerationRequest,
    count: number,
    trendingTopics: string[]
  ): Promise<GeneratedContentItem[]> {
    const contentItems: GeneratedContentItem[] = [];

    for (let i = 0; i < count; i++) {
      try {
        // Create variations for each content item
        const variationIndex = i % 3; // Cycle through variations
        const contentRequest: ContentSuggestionsRequest = {
          topic: `${request.contentTitle} - ${trendingTopics[i % trendingTopics.length]} - Variation ${variationIndex + 1}`,
          contentType: request.contentType as any,
          platform: request.platform as any,
          tone: (request.tone as 'casual' | 'professional' | 'funny' | 'inspirational' | 'educational') || 'casual',
          targetAudience: request.targetAudience || 'general audience'
        };

        const suggestions = await this.aiSuggestionsService.generateSuggestions(contentRequest);

        const contentItem: GeneratedContentItem = {
          id: nanoid(),
          title: suggestions.postTitle,
          caption: suggestions.caption,
          hashtags: suggestions.hashtags,
          emojis: suggestions.emojis,
          contentType: request.contentType,
          platform: request.platform,
          mediaSuggestions: this.generateMediaSuggestions(suggestions.caption),
          metadata: {
            trendAlignment: trendingTopics[i % trendingTopics.length],
            engagementScore: Math.random() * 0.3 + 0.7, // Mock engagement score
            optimalPostingTime: this.getOptimalPostingTime(request.platform, i)
          }
        };

        contentItems.push(contentItem);

        // Small delay to avoid overwhelming AI services
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.warn(`Failed to generate content item ${i + 1}, using fallback:`, error);

        // Fallback content generation
        const fallbackContent = this.generateFallbackContentItem(request, i, trendingTopics);
        contentItems.push(fallbackContent);
      }
    }

    return contentItems;
  }

  /**
   * Schedule content evenly across the selected duration
   */
  private async scheduleContentEvenly(
    request: BulkContentGenerationRequest,
    contentItems: GeneratedContentItem[]
  ): Promise<ScheduledContent[]> {
    const scheduledContent: ScheduledContent[] = [];
    const durationDays = this.getDurationInDays(request.schedulingDuration);

    // Use provided start date or default to today
    const startDate = request.startDate ? new Date(request.startDate) : new Date();
    // Ensure we start at 9 AM if no time was specified
    if (request.startDate && startDate.getHours() === 0 && startDate.getMinutes() === 0) {
      startDate.setHours(9, 0, 0, 0);
    }

    console.log(`📅 Scheduling content starting from: ${startDate.toISOString()}`);
    console.log(`📊 Duration: ${durationDays} days, Content items: ${contentItems.length}`);

    // Calculate interval between posts
    const intervalHours = Math.max(24, (durationDays * 24) / contentItems.length);

    for (let i = 0; i < contentItems.length; i++) {
      const scheduledDate = new Date(startDate);
      const hoursToAdd = Math.floor(i * intervalHours);
      const additionalDays = Math.floor(hoursToAdd / 24);
      const remainingHours = hoursToAdd % 24;

      scheduledDate.setDate(scheduledDate.getDate() + additionalDays);
      scheduledDate.setHours(9 + remainingHours, 0, 0, 0);

      // Adjust to optimal posting time for the platform
      const optimalTime = this.schedulerService.suggestOptimalTime(request.platform, scheduledDate);
      scheduledDate.setTime(optimalTime.getTime());

      const scheduledItem: Omit<ScheduledContent, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: request.userId,
        title: contentItems[i].title,
        description: contentItems[i].caption,
        content: contentItems[i].caption,
        platform: request.platform as any,
        status: 'scheduled',
        scheduledAt: scheduledDate,
        metadata: {
          tags: contentItems[i].hashtags,
          category: contentItems[i].contentType,
          mediaUrl: contentItems[i].mediaSuggestions?.[0],
          trendAlignment: contentItems[i].metadata.trendAlignment,
          engagementScore: contentItems[i].metadata.engagementScore
        }
      };

      try {
        const scheduled = await this.schedulerService.scheduleContent(scheduledItem);
        scheduledContent.push(scheduled);
        console.log(`✅ Scheduled content ${i + 1}/${contentItems.length} for ${scheduledDate.toISOString()}`);
      } catch (error) {
        console.error(`❌ Failed to schedule content ${i + 1}:`, error);
      }
    }

    return scheduledContent;
  }

  /**
   * Generate media suggestions based on content
   */
  private generateMediaSuggestions(caption: string): string[] {
    const mediaTypes = ['image', 'video', 'carousel', 'reel', 'story'];
    const suggestions = [];

    // Analyze caption for media type hints
    if (caption.toLowerCase().includes('tutorial') || caption.toLowerCase().includes('how to')) {
      suggestions.push('video', 'screenshots');
    } else if (caption.toLowerCase().includes('tips') || caption.toLowerCase().includes('list')) {
      suggestions.push('carousel', 'infographic');
    } else if (caption.toLowerCase().includes('behind the scenes') || caption.toLowerCase().includes('story')) {
      suggestions.push('video', 'reel');
    } else {
      suggestions.push('image', 'carousel');
    }

    return suggestions;
  }

  /**
   * Get optimal posting time for platform
   */
  private getOptimalPostingTime(platform: string, index: number): string {
    const optimalTimes: Record<string, string[]> = {
      'instagram': ['09:00', '12:00', '17:00', '19:00'],
      'youtube': ['15:00', '19:00', '21:00'],
      'linkedin': ['08:00', '12:00', '17:00'],
      'tiktok': ['12:00', '16:00', '19:00', '22:00'],
      'facebook': ['13:00', '15:00', '19:00']
    };

    const times = optimalTimes[platform] || ['12:00', '18:00'];
    return times[index % times.length];
  }

  /**
   * Get duration in days
   */
  private getDurationInDays(duration: string): number {
    switch (duration) {
      case '1week':
        return 7;
      case '15days':
        return 15;
      case '30days':
        return 30;
      default:
        return 7;
    }
  }

  /**
   * Generate fallback content item when AI fails
   */
  private generateFallbackContentItem(
    request: BulkContentGenerationRequest,
    index: number,
    trendingTopics: string[]
  ): GeneratedContentItem {
    return {
      id: nanoid(),
      title: `${request.contentTitle} - Post ${index + 1}`,
      caption: `Exciting content about ${request.contentTitle}! Stay tuned for more amazing insights and updates. #content #trending`,
      hashtags: ['#content', '#trending', '#viral', `#${request.contentTitle.replace(/\s+/g, '')}`],
      emojis: ['🚀', '✨', '💡', '🎯'],
      contentType: request.contentType,
      platform: request.platform,
      mediaSuggestions: ['image'],
      metadata: {
        trendAlignment: trendingTopics[index % trendingTopics.length],
        engagementScore: 0.8,
        optimalPostingTime: '12:00'
      }
    };
  }

  /**
   * Get bulk content generation progress
   */
  public async getGenerationProgress(projectId: string): Promise<{
    totalItems: number;
    generatedItems: number;
    scheduledItems: number;
    status: 'generating' | 'scheduling' | 'completed' | 'failed';
  }> {
    // This would track progress in a real implementation
    // For now, return mock progress
    return {
      totalItems: 7,
      generatedItems: 7,
      scheduledItems: 7,
      status: 'completed'
    };
  }
}
