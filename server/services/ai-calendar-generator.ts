import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { addDays, format, startOfWeek, endOfWeek } from 'date-fns';

interface Project {
  id: string;
  name: string;
  description: string;
  type: string;
  platforms: string[];
  category: string;
  duration: number;
  customDuration?: number;
  contentFrequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  status: 'active' | 'paused' | 'completed' | 'archived';
}

interface ContentCard {
  id: string;
  title: string;
  description: string;
  platform: string;
  contentType: 'post' | 'reel' | 'short' | 'story' | 'video';
  status: 'draft' | 'scheduled' | 'published' | 'paused' | 'failed';
  scheduledAt: string;
  publishedAt?: string;
  thumbnailUrl?: string;
  aiGenerated: boolean;
  hashtags: string[];
  metadata: Record<string, any>;
}

interface CalendarGenerationRequest {
  projectId: string;
  platforms: string[];
  category: string;
  duration: number;
  contentFrequency: string;
  startDate: string;
}

class AICalendarGenerator {
  private openai: OpenAI;
  private gemini: GoogleGenerativeAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  /**
   * Generate AI-powered content calendar based on project settings
   */
  async generateCalendar(request: CalendarGenerationRequest): Promise<ContentCard[]> {
    try {
      // Calculate total number of content pieces needed
      const totalDays = request.duration;
      const frequencyMap = {
        'daily': 1,
        'weekly': 7,
        'bi-weekly': 14,
        'monthly': 30
      };
      
      const frequencyDays = frequencyMap[request.contentFrequency as keyof typeof frequencyMap] || 7;
      const totalContentPieces = Math.ceil(totalDays / frequencyDays);

      // Generate content ideas using AI
      const contentIdeas = await this.generateContentIdeas({
        category: request.category,
        platforms: request.platforms,
        totalPieces: totalContentPieces,
        frequency: request.contentFrequency
      });

      // Create content cards with optimal scheduling
      const contentCards: ContentCard[] = [];
      const startDate = new Date(request.startDate);

      for (let i = 0; i < totalContentPieces; i++) {
        const scheduledDate = addDays(startDate, i * frequencyDays);
        const idea = contentIdeas[i % contentIdeas.length];
        const platform = request.platforms[i % request.platforms.length];

        // Generate platform-specific content
        const platformContent = await this.generatePlatformContent({
          idea,
          platform,
          category: request.category,
          scheduledDate
        });

        contentCards.push({
          id: `content_${Date.now()}_${i}`,
          title: platformContent.title,
          description: platformContent.description,
          platform,
          contentType: platformContent.contentType,
          status: 'draft',
          scheduledAt: scheduledDate.toISOString(),
          aiGenerated: true,
          hashtags: platformContent.hashtags,
          metadata: {
            projectId: request.projectId,
            category: request.category,
            frequency: request.contentFrequency,
            generatedAt: new Date().toISOString(),
            aiModel: 'gpt-4o',
            ...platformContent.metadata
          }
        });
      }

      return contentCards;
    } catch (error) {
      console.error('Error generating AI calendar:', error);
      throw new Error('Failed to generate AI calendar');
    }
  }

  /**
   * Generate content ideas using AI
   */
  async generateContentIdeas(params: {
    category: string;
    platforms: string[];
    totalPieces: number;
    frequency: string;
  }): Promise<Array<{ topic: string; angle: string; targetAudience: string }>> {
    try {
      const prompt = `
        Generate ${params.totalPieces} creative content ideas for a ${params.category} social media project.
        
        Requirements:
        - Platforms: ${params.platforms.join(', ')}
        - Content frequency: ${params.frequency}
        - Category: ${params.category}
        
        For each idea, provide:
        1. A compelling topic/title
        2. A unique angle or perspective
        3. Target audience description
        
        Return as JSON array with format:
        [
          {
            "topic": "Creative topic title",
            "angle": "Unique perspective or approach",
            "targetAudience": "Specific audience description"
          }
        ]
        
        Make each idea engaging, platform-appropriate, and aligned with current trends.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a creative social media strategist with expertise in content planning and audience engagement. Generate innovative, trend-aware content ideas that drive engagement.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No content generated');

      // Parse JSON response
      const ideas = JSON.parse(content);
      return Array.isArray(ideas) ? ideas : [];
    } catch (error) {
      console.error('Error generating content ideas:', error);
      // Fallback to predefined ideas
      return this.getFallbackContentIdeas(params.category, params.totalPieces);
    }
  }

  /**
   * Generate platform-specific content
   */
  private async generatePlatformContent(params: {
    idea: { topic: string; angle: string; targetAudience: string };
    platform: string;
    category: string;
    scheduledDate: Date;
  }): Promise<{
    title: string;
    description: string;
    contentType: ContentCard['contentType'];
    hashtags: string[];
    metadata: Record<string, any>;
  }> {
    try {
      const platformPrompts = {
        instagram: {
          contentType: 'post' as ContentCard['contentType'],
          style: 'Visual storytelling with engaging captions and relevant hashtags',
          maxLength: 2200
        },
        facebook: {
          contentType: 'post' as ContentCard['contentType'],
          style: 'Community-focused content with longer-form descriptions',
          maxLength: 63206
        },
        tiktok: {
          contentType: 'short' as ContentCard['contentType'],
          style: 'Trendy, short-form video content with viral potential',
          maxLength: 300
        },
        youtube: {
          contentType: 'video' as ContentCard['contentType'],
          style: 'Educational or entertaining video content with detailed descriptions',
          maxLength: 5000
        },
        linkedin: {
          contentType: 'post' as ContentCard['contentType'],
          style: 'Professional, industry-focused content with business insights',
          maxLength: 3000
        }
      };

      const platformConfig = platformPrompts[params.platform as keyof typeof platformPrompts] || platformPrompts.instagram;

      const prompt = `
        Create ${platformConfig.contentType} content for ${params.platform} based on this idea:
        
        Topic: ${params.idea.topic}
        Angle: ${params.idea.angle}
        Target Audience: ${params.idea.targetAudience}
        Category: ${params.category}
        Scheduled Date: ${format(params.scheduledDate, 'MMMM d, yyyy')}
        
        Style: ${platformConfig.style}
        Max Length: ${platformConfig.maxLength} characters
        
        Generate:
        1. A compelling title (max 100 characters)
        2. An engaging description/caption (max ${platformConfig.maxLength} characters)
        3. 5-10 relevant hashtags
        4. Platform-specific metadata
        
        Return as JSON:
        {
          "title": "Compelling title",
          "description": "Engaging description with emojis and call-to-action",
          "hashtags": ["#hashtag1", "#hashtag2", ...],
          "metadata": {
            "optimalPostingTime": "suggested time",
            "engagementStrategy": "strategy description",
            "visualElements": ["element1", "element2"],
            "callToAction": "specific CTA"
          }
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a ${params.platform} content specialist with deep knowledge of platform algorithms, audience behavior, and engagement strategies. Create content that maximizes reach and engagement.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No content generated');

      const result = JSON.parse(content);
      return {
        title: result.title,
        description: result.description,
        contentType: platformConfig.contentType,
        hashtags: result.hashtags || [],
        metadata: result.metadata || {}
      };
    } catch (error) {
      console.error('Error generating platform content:', error);
      // Fallback content
      return this.getFallbackPlatformContent(params);
    }
  }

  /**
   * Generate optimal posting times for each platform
   */
  async generateOptimalPostingTimes(platforms: string[], category: string): Promise<Record<string, string[]>> {
    try {
      const prompt = `
        Based on current social media analytics and trends for ${category} content, 
        provide optimal posting times for each platform:
        
        Platforms: ${platforms.join(', ')}
        
        Consider:
        - Platform-specific audience behavior
        - Content category performance patterns
        - Time zone considerations (UTC)
        - Day of week patterns
        - Seasonal trends
        
        Return as JSON:
        {
          "instagram": ["9:00 AM", "12:00 PM", "5:00 PM"],
          "facebook": ["9:00 AM", "1:00 PM", "3:00 PM"],
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
      console.error('Error generating optimal posting times:', error);
      return this.getFallbackPostingTimes(platforms);
    }
  }

  /**
   * Enhance existing content with AI
   */
  async enhanceContent(params: {
    contentId: string;
    field: string;
    currentValue: any;
    context: {
      title: string;
      description: string;
      platform: string;
      contentType: string;
      hashtags: string[];
    };
  }): Promise<string> {
    try {
      const prompt = `
        Enhance the following ${params.field} for ${params.context.platform} ${params.context.contentType}:
        
        Current ${params.field}: ${params.currentValue}
        
        Context:
        - Title: ${params.context.title}
        - Description: ${params.context.description}
        - Platform: ${params.context.platform}
        - Content Type: ${params.context.contentType}
        - Hashtags: ${params.context.hashtags.join(', ')}
        
        Requirements:
        - Make it more engaging and platform-appropriate
        - Optimize for maximum reach and engagement
        - Maintain the original intent and message
        - Add relevant emojis and formatting
        - Ensure it follows platform best practices
        
        Return only the enhanced ${params.field}, no additional text.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a ${params.context.platform} content optimization expert. Enhance content to maximize engagement while maintaining authenticity.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0]?.message?.content || params.currentValue;
    } catch (error) {
      console.error('Error enhancing content:', error);
      return params.currentValue;
    }
  }

  /**
   * Fallback content ideas when AI fails
   */
  private getFallbackContentIdeas(category: string, count: number): Array<{ topic: string; angle: string; targetAudience: string }> {
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

    const categoryIdeas = fallbackIdeas[category as keyof typeof fallbackIdeas] || fallbackIdeas.lifestyle;
    const result = [];
    
    for (let i = 0; i < count; i++) {
      result.push(categoryIdeas[i % categoryIdeas.length]);
    }
    
    return result;
  }

  /**
   * Fallback platform content when AI fails
   */
  private getFallbackPlatformContent(params: {
    idea: { topic: string; angle: string; targetAudience: string };
    platform: string;
    category: string;
    scheduledDate: Date;
  }): {
    title: string;
    description: string;
    contentType: ContentCard['contentType'];
    hashtags: string[];
    metadata: Record<string, any>;
  } {
    const platformConfigs = {
      instagram: { contentType: 'post' as ContentCard['contentType'], emoji: '📸' },
      facebook: { contentType: 'post' as ContentCard['contentType'], emoji: '👥' },
      tiktok: { contentType: 'short' as ContentCard['contentType'], emoji: '🎵' },
      youtube: { contentType: 'video' as ContentCard['contentType'], emoji: '🎥' },
      linkedin: { contentType: 'post' as ContentCard['contentType'], emoji: '💼' }
    };

    const config = platformConfigs[params.platform as keyof typeof platformConfigs] || platformConfigs.instagram;

    return {
      title: `${config.emoji} ${params.idea.topic}`,
      description: `${params.idea.angle}\n\nPerfect for: ${params.idea.targetAudience}\n\n#${params.category} #content #socialmedia`,
      contentType: config.contentType,
      hashtags: [`#${params.category}`, '#content', '#socialmedia', '#trending'],
      metadata: {
        optimalPostingTime: '9:00 AM',
        engagementStrategy: 'Ask questions to encourage comments',
        visualElements: ['High-quality image', 'Engaging caption'],
        callToAction: 'Share your thoughts in the comments!'
      }
    };
  }

  /**
   * Analyze content performance and suggest optimizations
   */
  async analyzeContentPerformance(params: {
    contentId: string;
    platform: string;
    metrics: Record<string, any>;
  }): Promise<{
    insights: string[];
    recommendations: string[];
    score: number;
    trends: string[];
  }> {
    try {
      const prompt = `
        Analyze the performance of this ${params.platform} content and provide insights:
        
        Content ID: ${params.contentId}
        Platform: ${params.platform}
        Metrics: ${JSON.stringify(params.metrics)}
        
        Provide:
        1. Key performance insights
        2. Specific optimization recommendations
        3. Performance score (0-100)
        4. Trending opportunities
        
        Return as JSON:
        {
          "insights": ["insight1", "insight2", ...],
          "recommendations": ["recommendation1", "recommendation2", ...],
          "score": 85,
          "trends": ["trend1", "trend2", ...]
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a social media analytics expert with deep knowledge of platform algorithms and performance optimization.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No analysis generated');

      return JSON.parse(content);
    } catch (error) {
      console.error('Error analyzing content performance:', error);
      return {
        insights: ['Performance data not available'],
        recommendations: ['Focus on consistent posting', 'Engage with your audience'],
        score: 50,
        trends: ['Current trends not available']
      };
    }
  }

  /**
   * Generate hashtag suggestions for content
   */
  async generateHashtagSuggestions(params: {
    content: string;
    platform: string;
    category: string;
    count: number;
  }): Promise<string[]> {
    try {
      const prompt = `
        Generate ${params.count} relevant hashtags for this ${params.platform} content:
        
        Content: ${params.content}
        Platform: ${params.platform}
        Category: ${params.category}
        
        Requirements:
        - Mix of trending and niche hashtags
        - Platform-appropriate (Instagram: 5-10, TikTok: 3-5, etc.)
        - Include category-specific and general hashtags
        - Ensure hashtags are currently active and relevant
        
        Return as JSON array:
        ["#hashtag1", "#hashtag2", ...]
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a ${params.platform} hashtag specialist with knowledge of trending tags and platform-specific best practices.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No hashtags generated');

      const hashtags = JSON.parse(content);
      return Array.isArray(hashtags) ? hashtags : [];
    } catch (error) {
      console.error('Error generating hashtag suggestions:', error);
      return this.getFallbackHashtags(params.category, params.count);
    }
  }

  /**
   * Fallback posting times when AI fails
   */
  private getFallbackPostingTimes(platforms: string[]): Record<string, string[]> {
    const defaultTimes = {
      instagram: ['9:00 AM', '12:00 PM', '5:00 PM'],
      facebook: ['9:00 AM', '1:00 PM', '3:00 PM'],
      tiktok: ['6:00 AM', '10:00 AM', '7:00 PM'],
      youtube: ['2:00 PM', '8:00 PM'],
      linkedin: ['8:00 AM', '12:00 PM', '5:00 PM']
    };

    const result: Record<string, string[]> = {};
    platforms.forEach(platform => {
      result[platform] = defaultTimes[platform as keyof typeof defaultTimes] || ['9:00 AM', '5:00 PM'];
    });

    return result;
  }

  /**
   * Fallback hashtags when AI fails
   */
  private getFallbackHashtags(category: string, count: number): string[] {
    const categoryHashtags = {
      fitness: ['#fitness', '#workout', '#health', '#motivation', '#gym', '#wellness', '#fitlife', '#exercise'],
      business: ['#business', '#entrepreneur', '#startup', '#marketing', '#leadership', '#success', '#innovation', '#strategy'],
      lifestyle: ['#lifestyle', '#life', '#inspiration', '#motivation', '#selfcare', '#mindfulness', '#happiness', '#balance'],
      technology: ['#tech', '#innovation', '#digital', '#ai', '#future', '#startup', '#coding', '#software'],
      food: ['#food', '#cooking', '#recipe', '#delicious', '#healthy', '#foodie', '#chef', '#tasty']
    };

    const baseHashtags = categoryHashtags[category as keyof typeof categoryHashtags] || categoryHashtags.lifestyle;
    const generalHashtags = ['#viral', '#trending', '#content', '#socialmedia', '#instagram', '#follow'];
    
    const allHashtags = [...baseHashtags, ...generalHashtags];
    return allHashtags.slice(0, Math.min(count, allHashtags.length));
  }
}

export const aiCalendarGenerator = new AICalendarGenerator();
export type { CalendarGenerationRequest, ContentCard, Project };
