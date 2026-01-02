import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { addDays, format, parseISO } from 'date-fns';
import { db } from '../db';
import { socialPosts, projects } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

interface ProjectData {
  id: number;
  name: string;
  description?: string;
  type: string;
  platform?: string;
  channelTypes?: string[];
  targetAudience?: string;
  estimatedDuration?: string;
  tags?: string[];
  metadata?: any;
}

interface ContentGenerationParams {
  projectId: number;
  userId: string;
  projectData: ProjectData;
  contentType: string[];
  channelTypes: string[];
  contentFrequency: string;
  duration: string;
  customStartDate?: string;
  customEndDate?: string;
  postingStrategy: string;
  customPostingTimes?: string[];
}

interface GeneratedContent {
  title: string;
  description: string;
  caption: string;
  hashtags: string[];
  emojis: string[];
  contentType: string;
  platform: string;
  scheduledAt: Date;
  optimalTime: string;
  engagementScore: number;
  metadata: any;
}

export class AISchedulingService {
  private openai: OpenAI;
  private gemini: GoogleGenerativeAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  /**
   * Automatically generate and schedule content for a social media project
   */
  async scheduleProjectContent(params: ContentGenerationParams): Promise<{
    success: boolean;
    contentCount: number;
    scheduledPosts: any[];
    message: string;
  }> {
    try {
      const {
        projectId,
        userId,
        projectData,
        contentType,
        channelTypes,
        contentFrequency,
        duration,
        customStartDate,
        customEndDate,
        postingStrategy,
        customPostingTimes
      } = params;

      console.log('🤖 Starting AI scheduling for project:', projectId);

      // Calculate content schedule
      const schedule = this.calculateContentSchedule({
        duration,
        contentFrequency,
        customStartDate,
        customEndDate,
        channelTypes,
        postingStrategy,
        customPostingTimes
      });

      console.log('📅 Generated schedule:', schedule.length, 'posts');

      // Generate content for each scheduled post
      const generatedContent: GeneratedContent[] = [];
      
      for (let i = 0; i < schedule.length; i++) {
        const scheduleItem = schedule[i];
        
        try {
          const content = await this.generateContentForSchedule({
            projectData,
            contentType: contentType[i % contentType.length],
            channelType: scheduleItem.platform,
            scheduledDate: scheduleItem.scheduledDate,
            optimalTime: scheduleItem.optimalTime,
            dayNumber: i + 1,
            totalDays: schedule.length
          });

          generatedContent.push(content);
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error generating content for day ${i + 1}:`, error);
          // Continue with other content generation
        }
      }

      console.log('✅ Generated', generatedContent.length, 'content pieces');

      // Create social posts in database
      const createdPosts = [];
      for (const content of generatedContent) {
        try {
          const postData = {
            userId,
            projectId,
            title: content.title,
            caption: content.caption,
            description: content.description,
            hashtags: content.hashtags,
            emojis: content.emojis,
            contentType: content.contentType,
            platform: content.platform,
            status: 'scheduled',
            scheduledAt: content.scheduledAt,
            metadata: {
              ...content.metadata,
              aiGenerated: true,
              optimalTime: content.optimalTime,
              engagementScore: content.engagementScore,
              autoScheduled: true,
              projectId,
              generatedAt: new Date().toISOString()
            }
          };

          const [createdPost] = await db.insert(socialPosts).values(postData).returning();
          createdPosts.push(createdPost);
        } catch (error) {
          console.error('Error creating social post:', error);
        }
      }

      console.log('💾 Created', createdPosts.length, 'social posts in database');

      return {
        success: true,
        contentCount: createdPosts.length,
        scheduledPosts: createdPosts,
        message: `Successfully generated and scheduled ${createdPosts.length} posts for your project`
      };

    } catch (error) {
      console.error('Error in AI scheduling service:', error);
      throw new Error('Failed to schedule project content');
    }
  }

  /**
   * Calculate content schedule based on project parameters
   */
  private calculateContentSchedule(params: {
    duration: string;
    contentFrequency: string;
    customStartDate?: string;
    customEndDate?: string;
    channelTypes: string[];
    postingStrategy: string;
    customPostingTimes?: string[];
  }) {
    const {
      duration,
      contentFrequency,
      customStartDate,
      customEndDate,
      channelTypes,
      postingStrategy,
      customPostingTimes
    } = params;

    // Calculate total days
    let totalDays = 7; // default
    if (duration === '15days') totalDays = 15;
    else if (duration === '30days') totalDays = 30;
    else if (duration === 'custom' && customStartDate && customEndDate) {
      const start = parseISO(customStartDate);
      const end = parseISO(customEndDate);
      totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Calculate posting frequency
    let frequencyDays = 1; // daily
    if (contentFrequency === 'alternate') frequencyDays = 2;
    else if (contentFrequency === 'weekly') frequencyDays = 7;

    // Calculate total posts needed
    const totalPosts = Math.ceil(totalDays / frequencyDays);

    // Generate schedule
    const schedule = [];
    const startDate = customStartDate ? parseISO(customStartDate) : new Date();

    for (let i = 0; i < totalPosts; i++) {
      const scheduledDate = addDays(startDate, i * frequencyDays);
      const platform = channelTypes[i % channelTypes.length];
      const optimalTime = this.calculateOptimalTime(platform, postingStrategy, customPostingTimes);

      schedule.push({
        platform,
        scheduledDate,
        optimalTime,
        dayNumber: i + 1
      });
    }

    return schedule;
  }

  /**
   * Calculate optimal posting time for a platform
   */
  private calculateOptimalTime(
    platform: string, 
    postingStrategy: string, 
    customPostingTimes?: string[]
  ): string {
    if (customPostingTimes && customPostingTimes.length > 0) {
      return customPostingTimes[0]; // Use first custom time
    }

    const optimalTimes = {
      instagram: ['09:00', '12:00', '17:00'],
      facebook: ['09:00', '13:00', '15:00'],
      tiktok: ['06:00', '10:00', '19:00'],
      youtube: ['14:00', '20:00'],
      linkedin: ['08:00', '12:00', '17:00'],
      twitter: ['09:00', '15:00', '18:00']
    };

    const platformTimes = optimalTimes[platform as keyof typeof optimalTimes] || ['09:00', '17:00'];
    
    // Select time based on posting strategy
    if (postingStrategy === 'optimal') {
      return platformTimes[0]; // Best time
    } else if (postingStrategy === 'consistent') {
      return platformTimes[1] || platformTimes[0]; // Consistent time
    } else if (postingStrategy === 'burst') {
      return platformTimes[2] || platformTimes[0]; // Peak time
    }

    return platformTimes[0];
  }

  /**
   * Generate content for a specific schedule item
   */
  private async generateContentForSchedule(params: {
    projectData: ProjectData;
    contentType: string;
    channelType: string;
    scheduledDate: Date;
    optimalTime: string;
    dayNumber: number;
    totalDays: number;
  }): Promise<GeneratedContent> {
    const {
      projectData,
      contentType,
      channelType,
      scheduledDate,
      optimalTime,
      dayNumber,
      totalDays
    } = params;

    try {
      // Use Gemini for content generation
      const model = this.gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = this.buildContentGenerationPrompt({
        projectData,
        contentType,
        channelType,
        dayNumber,
        totalDays,
        scheduledDate
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();

      // Parse AI response
      const parsedContent = this.parseAIResponse(content, {
        contentType,
        channelType,
        scheduledDate,
        optimalTime,
        dayNumber
      });

      return parsedContent;

    } catch (error) {
      console.error('Error generating content with AI:', error);
      
      // Fallback content generation
      return this.generateFallbackContent({
        projectData,
        contentType,
        channelType,
        scheduledDate,
        optimalTime,
        dayNumber
      });
    }
  }

  /**
   * Build prompt for AI content generation
   */
  private buildContentGenerationPrompt(params: {
    projectData: ProjectData;
    contentType: string;
    channelType: string;
    dayNumber: number;
    totalDays: number;
    scheduledDate: Date;
  }): string {
    const {
      projectData,
      contentType,
      channelType,
      dayNumber,
      totalDays,
      scheduledDate
    } = params;

    return `
You are a social media content creator specializing in ${projectData.type} content. Generate engaging content for ${channelType}.

Project: ${projectData.name}
Description: ${projectData.description || 'No description provided'}
Content Type: ${contentType}
Platform: ${channelType}
Day: ${dayNumber} of ${totalDays}
Scheduled Date: ${format(scheduledDate, 'yyyy-MM-dd')}
Target Audience: ${projectData.targetAudience || 'General audience'}
Tags: ${projectData.tags?.join(', ') || 'None'}

Generate content that:
1. Is engaging and platform-appropriate for ${channelType}
2. Follows ${contentType} format
3. Is relevant to the project theme
4. Includes appropriate hashtags and emojis
5. Has a clear call-to-action
6. Is optimized for the ${dayNumber} day of the campaign

Return your response in this JSON format:
{
  "title": "Compelling title for the content",
  "description": "Brief description of the content",
  "caption": "Full social media caption with emojis",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
  "emojis": ["😊", "🚀", "💡"],
  "engagementScore": 85,
  "metadata": {
    "tone": "engaging",
    "callToAction": "Follow for more tips!",
    "visualElements": "Eye-catching graphics",
    "targetAudience": "${projectData.targetAudience || 'General audience'}"
  }
}
`;
  }

  /**
   * Parse AI response into structured content
   */
  private parseAIResponse(
    content: string, 
    context: {
      contentType: string;
      channelType: string;
      scheduledDate: Date;
      optimalTime: string;
      dayNumber: number;
    }
  ): GeneratedContent {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          title: parsed.title || `Day ${context.dayNumber} Content`,
          description: parsed.description || '',
          caption: parsed.caption || parsed.title || '',
          hashtags: parsed.hashtags || [],
          emojis: parsed.emojis || [],
          contentType: context.contentType,
          platform: context.channelType,
          scheduledAt: context.scheduledDate,
          optimalTime: context.optimalTime,
          engagementScore: parsed.engagementScore || 75,
          metadata: {
            ...parsed.metadata,
            aiGenerated: true,
            dayNumber: context.dayNumber,
            generatedAt: new Date().toISOString()
          }
        };
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
    }

    // Fallback if parsing fails
    return this.generateFallbackContent({
      projectData: { name: 'Project', type: 'social-media' },
      contentType: context.contentType,
      channelType: context.channelType,
      scheduledDate: context.scheduledDate,
      optimalTime: context.optimalTime,
      dayNumber: context.dayNumber
    });
  }

  /**
   * Generate fallback content when AI fails
   */
  private generateFallbackContent(params: {
    projectData: ProjectData;
    contentType: string;
    channelType: string;
    scheduledDate: Date;
    optimalTime: string;
    dayNumber: number;
  }): GeneratedContent {
    const {
      projectData,
      contentType,
      channelType,
      scheduledDate,
      optimalTime,
      dayNumber
    } = params;

    const contentTemplates = {
      post: {
        title: `Day ${dayNumber}: ${projectData.name}`,
        caption: `Exciting content coming your way! Day ${dayNumber} of our ${projectData.name} series. Stay tuned for more! 🚀`,
        hashtags: ['#content', '#series', '#day' + dayNumber],
        emojis: ['🚀', '💡', '✨']
      },
      reel: {
        title: `Reel ${dayNumber}: ${projectData.name}`,
        caption: `Quick tip for you! Day ${dayNumber} of our ${projectData.name} series. Swipe up for more! 👆`,
        hashtags: ['#reel', '#tip', '#day' + dayNumber],
        emojis: ['👆', '💡', '🎬']
      },
      story: {
        title: `Story ${dayNumber}: ${projectData.name}`,
        caption: `Behind the scenes! Day ${dayNumber} of our ${projectData.name} series. Tap to see more! 👆`,
        hashtags: ['#story', '#behindthescenes', '#day' + dayNumber],
        emojis: ['👆', '📱', '✨']
      }
    };

    const template = contentTemplates[contentType as keyof typeof contentTemplates] || contentTemplates.post;

    return {
      title: template.title,
      description: `Content for day ${dayNumber} of ${projectData.name}`,
      caption: template.caption,
      hashtags: template.hashtags,
      emojis: template.emojis,
      contentType,
      platform: channelType,
      scheduledAt: scheduledDate,
      optimalTime,
      engagementScore: 70,
      metadata: {
        aiGenerated: true,
        fallbackContent: true,
        dayNumber,
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Get optimal posting times for multiple platforms
   */
  async getOptimalPostingTimes(platforms: string[], category: string): Promise<Record<string, string[]>> {
    try {
      const prompt = `
Based on current social media analytics and trends for ${category} content, 
provide optimal posting times for each platform:

Platforms: ${platforms.join(', ')}

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
  "tiktok": ["06:00", "10:00", "19:00"],
  "youtube": ["14:00", "20:00"],
  "linkedin": ["08:00", "12:00", "17:00"],
  "twitter": ["09:00", "15:00", "18:00"]
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
      
      // Fallback to default times
      const defaultTimes = {
        instagram: ['09:00', '12:00', '17:00'],
        facebook: ['09:00', '13:00', '15:00'],
        tiktok: ['06:00', '10:00', '19:00'],
        youtube: ['14:00', '20:00'],
        linkedin: ['08:00', '12:00', '17:00'],
        twitter: ['09:00', '15:00', '18:00']
      };

      const result: Record<string, string[]> = {};
      platforms.forEach(platform => {
        result[platform] = defaultTimes[platform as keyof typeof defaultTimes] || ['09:00', '17:00'];
      });
      
      return result;
    }
  }
}

export const aiSchedulingService = new AISchedulingService();
