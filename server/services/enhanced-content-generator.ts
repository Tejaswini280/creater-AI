import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../db';
import { aiEngagementPatterns } from '@shared/schema';

interface ContentTheme {
  id: string;
  name: string;
  angle: string;
  format: string;
  keywords: string[];
  engagementMultiplier: number;
  optimalTimeSlots: string[];
}

interface ContentDiversityTracker {
  usedThemes: Set<string>;
  usedFormats: Set<string>;
  usedKeywords: Set<string>;
  dailyThemes: Map<number, string>;
  weeklyPattern: string[];
}

interface EngagementPrediction {
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  optimalTime: string;
  confidence: number;
}

interface EnhancedContentItem {
  id: string;
  title: string;
  description: string;
  content: string;
  hashtags: string[];
  platform: string;
  contentType: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  dayNumber: number;
  aiGenerated: boolean;
  theme: string;
  format: string;
  engagementPrediction: EngagementPrediction;
  uniquenessScore: number;
  optimalTime: string;
}

export class EnhancedContentGenerator {
  private static genAI: GoogleGenerativeAI | null = null;
  private static contentThemes: ContentTheme[] = [];
  private static diversityTracker: ContentDiversityTracker = {
    usedThemes: new Set(),
    usedFormats: new Set(),
    usedKeywords: new Set(),
    dailyThemes: new Map(),
    weeklyPattern: []
  };

  static initialize() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.initializeContentThemes();
    }
  }

  private static initializeContentThemes(): void {
    this.contentThemes = [
      // Educational Themes
      {
        id: 'educational-tutorial',
        name: 'Educational Tutorial',
        angle: 'Step-by-step learning approach',
        format: 'Tutorial/How-to',
        keywords: ['learn', 'tutorial', 'guide', 'step-by-step', 'education'],
        engagementMultiplier: 1.2,
        optimalTimeSlots: ['14:00', '16:00', '19:00']
      },
      {
        id: 'educational-tips',
        name: 'Quick Tips & Tricks',
        angle: 'Bite-sized actionable advice',
        format: 'Tips/Advice',
        keywords: ['tips', 'tricks', 'hacks', 'quick', 'easy'],
        engagementMultiplier: 1.1,
        optimalTimeSlots: ['12:00', '15:00', '18:00']
      },
      {
        id: 'educational-deep-dive',
        name: 'Deep Dive Analysis',
        angle: 'Comprehensive exploration of topics',
        format: 'Analysis/Research',
        keywords: ['analysis', 'research', 'deep-dive', 'comprehensive', 'insights'],
        engagementMultiplier: 1.3,
        optimalTimeSlots: ['16:00', '20:00', '21:00']
      },

      // Entertainment Themes
      {
        id: 'entertainment-trending',
        name: 'Trending Topics',
        angle: 'Current viral content and trends',
        format: 'Trending/Viral',
        keywords: ['trending', 'viral', 'popular', 'buzz', 'hot'],
        engagementMultiplier: 1.4,
        optimalTimeSlots: ['18:00', '19:00', '20:00', '21:00']
      },
      {
        id: 'entertainment-storytelling',
        name: 'Storytelling',
        angle: 'Narrative-driven content',
        format: 'Story/Personal',
        keywords: ['story', 'personal', 'experience', 'journey', 'narrative'],
        engagementMultiplier: 1.2,
        optimalTimeSlots: ['19:00', '20:00', '21:00']
      },
      {
        id: 'entertainment-humor',
        name: 'Humor & Memes',
        angle: 'Light-hearted and funny content',
        format: 'Humor/Meme',
        keywords: ['funny', 'meme', 'humor', 'joke', 'comedy'],
        engagementMultiplier: 1.5,
        optimalTimeSlots: ['18:00', '19:00', '20:00', '21:00']
      },

      // Motivational Themes
      {
        id: 'motivational-inspiration',
        name: 'Inspirational Content',
        angle: 'Uplifting and motivational messages',
        format: 'Inspiration/Quote',
        keywords: ['inspiration', 'motivation', 'uplifting', 'positive', 'encourage'],
        engagementMultiplier: 1.1,
        optimalTimeSlots: ['07:00', '08:00', '12:00', '18:00']
      },
      {
        id: 'motivational-achievement',
        name: 'Success Stories',
        angle: 'Real achievements and milestones',
        format: 'Success Story',
        keywords: ['success', 'achievement', 'milestone', 'accomplishment', 'victory'],
        engagementMultiplier: 1.3,
        optimalTimeSlots: ['08:00', '12:00', '17:00', '19:00']
      },
      {
        id: 'motivational-challenge',
        name: 'Challenges & Goals',
        angle: 'Goal-setting and challenge content',
        format: 'Challenge/Goal',
        keywords: ['challenge', 'goal', 'target', 'objective', 'mission'],
        engagementMultiplier: 1.2,
        optimalTimeSlots: ['08:00', '12:00', '18:00', '19:00']
      },

      // Interactive Themes
      {
        id: 'interactive-poll',
        name: 'Polls & Questions',
        angle: 'Audience engagement through questions',
        format: 'Poll/Question',
        keywords: ['poll', 'question', 'vote', 'opinion', 'choice'],
        engagementMultiplier: 1.6,
        optimalTimeSlots: ['12:00', '15:00', '18:00', '19:00']
      },
      {
        id: 'interactive-behind-scenes',
        name: 'Behind the Scenes',
        angle: 'Exclusive behind-the-scenes content',
        format: 'Behind Scenes',
        keywords: ['behind-scenes', 'exclusive', 'process', 'making-of', 'backstage'],
        engagementMultiplier: 1.3,
        optimalTimeSlots: ['15:00', '18:00', '19:00', '20:00']
      },
      {
        id: 'interactive-community',
        name: 'Community Building',
        angle: 'Fostering community engagement',
        format: 'Community',
        keywords: ['community', 'together', 'unite', 'connect', 'engage'],
        engagementMultiplier: 1.2,
        optimalTimeSlots: ['12:00', '17:00', '18:00', '19:00']
      }
    ];
  }

  /**
   * Generate unique, non-repetitive content for each day
   */
  static async generateUniqueProjectContent(request: {
    projectName: string;
    contentName: string;
    contentDescription: string;
    contentType: string;
    channelType: string;
    targetAudience: string;
    startDate: string;
    endDate: string;
    totalDays: number;
  }): Promise<{
    contentItems: EnhancedContentItem[];
    metadata: {
      generatedAt: string;
      model: string;
      totalItems: number;
      diversityScore: number;
      themesUsed: string[];
    };
  }> {
    console.log('🎯 Generating unique, non-repetitive content...');
    
    if (!this.genAI) {
      throw new Error('Gemini API not initialized');
    }

    // Reset diversity tracker for new project
    this.resetDiversityTracker();

    const contentItems: EnhancedContentItem[] = [];
    const startDate = new Date(request.startDate);
    const themesUsed: string[] = [];

    // Generate content for each day
    for (let i = 0; i < request.totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      // Select unique theme for this day
      const selectedTheme = this.selectUniqueTheme(i + 1, request.contentType);
      themesUsed.push(selectedTheme.name);

      // Generate content with selected theme
      const contentItem = await this.generateContentForDay({
        ...request,
        dayNumber: i + 1,
        currentDate,
        selectedTheme
      });

      contentItems.push(contentItem);
    }

    const diversityScore = this.calculateDiversityScore();

    return {
      contentItems,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'gemini-pro-enhanced',
        totalItems: contentItems.length,
        diversityScore,
        themesUsed
      }
    };
  }

  private static resetDiversityTracker(): void {
    this.diversityTracker = {
      usedThemes: new Set(),
      usedFormats: new Set(),
      usedKeywords: new Set(),
      dailyThemes: new Map(),
      weeklyPattern: []
    };
  }

  private static selectUniqueTheme(dayNumber: number, contentType: string): ContentTheme {
    // Filter themes by content type compatibility
    const compatibleThemes = this.contentThemes.filter(theme => 
      this.isThemeCompatible(theme, contentType)
    );

    // Remove already used themes
    const availableThemes = compatibleThemes.filter(theme => 
      !this.diversityTracker.usedThemes.has(theme.id)
    );

    // If all themes used, reset and start over (for long projects)
    if (availableThemes.length === 0) {
      this.diversityTracker.usedThemes.clear();
      return this.selectRandomTheme(compatibleThemes);
    }

    // Select theme based on day pattern and engagement potential
    const selectedTheme = this.selectOptimalTheme(availableThemes, dayNumber);
    
    // Track usage
    this.diversityTracker.usedThemes.add(selectedTheme.id);
    this.diversityTracker.usedFormats.add(selectedTheme.format);
    this.diversityTracker.dailyThemes.set(dayNumber, selectedTheme.id);
    selectedTheme.keywords.forEach(keyword => 
      this.diversityTracker.usedKeywords.add(keyword)
    );

    return selectedTheme;
  }

  private static isThemeCompatible(theme: ContentTheme, contentType: string): boolean {
    const compatibilityMap: Record<string, string[]> = {
      'fitness': ['educational-tutorial', 'motivational-inspiration', 'motivational-challenge', 'interactive-poll'],
      'tech': ['educational-tutorial', 'educational-tips', 'educational-deep-dive', 'entertainment-trending'],
      'business': ['educational-tips', 'motivational-achievement', 'interactive-community', 'educational-deep-dive'],
      'lifestyle': ['entertainment-storytelling', 'motivational-inspiration', 'interactive-behind-scenes', 'entertainment-humor'],
      'education': ['educational-tutorial', 'educational-tips', 'educational-deep-dive', 'interactive-poll'],
      'entertainment': ['entertainment-trending', 'entertainment-storytelling', 'entertainment-humor', 'interactive-poll']
    };

    const compatibleThemes = compatibilityMap[contentType] || Object.keys(compatibilityMap).flatMap(key => compatibilityMap[key]);
    return compatibleThemes.includes(theme.id);
  }

  private static selectOptimalTheme(themes: ContentTheme[], dayNumber: number): ContentTheme {
    // Create weekly pattern for theme distribution
    const weeklyPattern = ['educational', 'entertainment', 'motivational', 'interactive', 'educational', 'entertainment', 'motivational'];
    const dayOfWeek = (dayNumber - 1) % 7;
    const preferredType = weeklyPattern[dayOfWeek];

    // Find themes matching preferred type
    const preferredThemes = themes.filter(theme => 
      theme.id.includes(preferredType)
    );

    if (preferredThemes.length > 0) {
      return this.selectRandomTheme(preferredThemes);
    }

    // Fallback to random selection
    return this.selectRandomTheme(themes);
  }

  private static selectRandomTheme(themes: ContentTheme[]): ContentTheme {
    return themes[Math.floor(Math.random() * themes.length)];
  }

  private static async generateContentForDay(params: {
    projectName: string;
    contentName: string;
    contentDescription: string;
    contentType: string;
    channelType: string;
    targetAudience: string;
    dayNumber: number;
    currentDate: Date;
    selectedTheme: ContentTheme;
  }): Promise<EnhancedContentItem> {
    const { selectedTheme, dayNumber, currentDate } = params;

    const prompt = this.buildEnhancedPrompt(params, selectedTheme);
    
    const model = this.genAI!.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error(`No response from Gemini for day ${dayNumber}`);
    }

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Invalid JSON response from Gemini for day ${dayNumber}`);
    }

    const contentData = JSON.parse(jsonMatch[0]);

    // Calculate optimal posting time
    const optimalTime = await this.calculateOptimalPostingTime(
      params.channelType,
      params.contentType,
      selectedTheme,
      currentDate
    );

    // Generate engagement prediction
    const engagementPrediction = await this.predictEngagement(
      params.channelType,
      params.contentType,
      selectedTheme,
      contentData
    );

    // Calculate uniqueness score
    const uniquenessScore = this.calculateUniquenessScore(contentData, dayNumber);

    return {
      id: `${params.channelType}-${params.contentType}-day-${dayNumber}-${Date.now()}`,
      title: contentData.title,
      description: contentData.description,
      content: contentData.content,
      hashtags: contentData.hashtags,
      platform: params.channelType,
      contentType: params.contentType,
      scheduledDate: currentDate.toISOString().split('T')[0],
      scheduledTime: optimalTime,
      status: 'scheduled',
      dayNumber,
      aiGenerated: true,
      theme: selectedTheme.name,
      format: selectedTheme.format,
      engagementPrediction,
      uniquenessScore,
      optimalTime
    };
  }

  private static buildEnhancedPrompt(params: any, theme: ContentTheme): string {
    return `Generate unique social media content for day ${params.dayNumber} with the following specifications:

PROJECT CONTEXT:
- Project: ${params.projectName}
- Content Focus: ${params.contentName}
- Description: ${params.contentDescription}
- Content Type: ${params.contentType}
- Platform: ${params.channelType}
- Target Audience: ${params.targetAudience}

THEME REQUIREMENTS:
- Theme: ${theme.name}
- Angle: ${theme.angle}
- Format: ${theme.format}
- Keywords to include: ${theme.keywords.join(', ')}

CONTENT REQUIREMENTS:
1. Create a COMPLETELY UNIQUE title that hasn't been used before (include day number and relevant emoji)
2. Write an engaging description (2-3 sentences) that hooks the audience
3. Generate full content (3-4 paragraphs) with actionable, valuable information
4. Include 8-12 highly relevant hashtags that haven't been overused
5. Ensure the content follows the ${theme.format} format
6. Make it engaging and shareable for maximum reach

UNIQUENESS REQUIREMENTS:
- Avoid repetitive topics or angles from previous days
- Use fresh perspectives and new insights
- Include unique examples or case studies
- Ensure content stands out from typical posts

Format as JSON:
{
  "title": "Day ${params.dayNumber}: [Unique Compelling Title with Emoji]",
  "description": "Engaging description that hooks the audience...",
  "content": "Full content with actionable tips and unique insights...",
  "hashtags": ["#unique1", "#unique2", "#unique3", ...]
}`;
  }

  private static async calculateOptimalPostingTime(
    platform: string,
    contentType: string,
    theme: ContentTheme,
    date: Date
  ): Promise<string> {
    try {
      // Try to get historical data from database
      const historicalData = await db
        .select()
        .from(aiEngagementPatterns)
        .where(
          and(
            eq(aiEngagementPatterns.platform, platform),
            eq(aiEngagementPatterns.category, contentType)
          )
        )
        .limit(1);

      if (historicalData.length > 0) {
        const optimalTimes = historicalData[0].optimalTimes as string[];
        return optimalTimes[Math.floor(Math.random() * optimalTimes.length)];
      }

      // Use theme-specific optimal times
      if (theme.optimalTimeSlots.length > 0) {
        return theme.optimalTimeSlots[Math.floor(Math.random() * theme.optimalTimeSlots.length)];
      }

      // Fallback to platform-specific times
      const fallbackTimes = this.getFallbackOptimalTimes(platform, contentType);
      return fallbackTimes[Math.floor(Math.random() * fallbackTimes.length)];
    } catch (error) {
      console.error('Error calculating optimal posting time:', error);
      return '18:00'; // Default fallback
    }
  }

  private static getFallbackOptimalTimes(platform: string, contentType: string): string[] {
    const timeSlots: Record<string, Record<string, string[]>> = {
      instagram: {
        fitness: ['07:00', '12:00', '18:00', '20:00'],
        tech: ['09:00', '15:00', '19:00', '21:00'],
        education: ['08:00', '14:00', '18:00', '20:00'],
        business: ['08:00', '12:00', '17:00', '19:00'],
        lifestyle: ['09:00', '15:00', '19:00', '21:00'],
        entertainment: ['18:00', '20:00', '21:00', '22:00'],
        default: ['09:00', '15:00', '19:00', '21:00']
      },
      youtube: {
        education: ['14:00', '16:00', '19:00', '20:00'],
        tech: ['15:00', '18:00', '20:00', '21:00'],
        entertainment: ['18:00', '20:00', '21:00', '22:00'],
        fitness: ['07:00', '18:00', '20:00', '21:00'],
        default: ['15:00', '18:00', '20:00', '21:00']
      },
      tiktok: {
        entertainment: ['18:00', '20:00', '21:00', '22:00'],
        fitness: ['07:00', '18:00', '20:00', '21:00'],
        education: ['12:00', '15:00', '18:00', '19:00'],
        default: ['19:00', '20:00', '21:00', '22:00']
      },
      linkedin: {
        business: ['08:00', '12:00', '17:00', '18:00'],
        tech: ['09:00', '14:00', '17:00', '19:00'],
        education: ['08:00', '14:00', '17:00', '19:00'],
        default: ['09:00', '14:00', '17:00', '19:00']
      },
      facebook: {
        business: ['09:00', '12:00', '15:00', '17:00'],
        entertainment: ['19:00', '20:00', '21:00', '22:00'],
        default: ['13:00', '15:00', '19:00', '20:00']
      }
    };

    const platformTimes = timeSlots[platform] || timeSlots.instagram;
    return platformTimes[contentType] || platformTimes.default;
  }

  private static async predictEngagement(
    platform: string,
    contentType: string,
    theme: ContentTheme,
    contentData: any
  ): Promise<EngagementPrediction> {
    // Base engagement metrics by platform
    const baseMetrics: Record<string, { likes: number; comments: number; shares: number; reach: number }> = {
      instagram: { likes: 200, comments: 30, shares: 15, reach: 800 },
      youtube: { likes: 150, comments: 25, shares: 20, reach: 1200 },
      tiktok: { likes: 300, comments: 40, shares: 25, reach: 1500 },
      linkedin: { likes: 100, comments: 15, shares: 10, reach: 600 },
      facebook: { likes: 80, comments: 12, shares: 8, reach: 500 }
    };

    const base = baseMetrics[platform] || baseMetrics.instagram;

    // Apply theme multiplier
    const multiplier = theme.engagementMultiplier;

    // Apply content quality factors
    const titleLength = contentData.title?.length || 0;
    const descriptionLength = contentData.description?.length || 0;
    const hashtagCount = contentData.hashtags?.length || 0;

    const qualityMultiplier = this.calculateQualityMultiplier(titleLength, descriptionLength, hashtagCount);

    // Calculate final metrics
    const finalMultiplier = multiplier * qualityMultiplier;

    return {
      likes: Math.round(base.likes * finalMultiplier),
      comments: Math.round(base.comments * finalMultiplier),
      shares: Math.round(base.shares * finalMultiplier),
      reach: Math.round(base.reach * finalMultiplier),
      optimalTime: theme.optimalTimeSlots[0] || '18:00',
      confidence: Math.min(0.95, 0.7 + (finalMultiplier - 1) * 0.1)
    };
  }

  private static calculateQualityMultiplier(titleLength: number, descriptionLength: number, hashtagCount: number): number {
    let multiplier = 1.0;

    // Title length optimization (40-60 characters is optimal)
    if (titleLength >= 40 && titleLength <= 60) {
      multiplier += 0.1;
    } else if (titleLength < 20 || titleLength > 80) {
      multiplier -= 0.05;
    }

    // Description length optimization (100-200 characters is optimal)
    if (descriptionLength >= 100 && descriptionLength <= 200) {
      multiplier += 0.1;
    } else if (descriptionLength < 50) {
      multiplier -= 0.05;
    }

    // Hashtag count optimization (8-12 hashtags is optimal)
    if (hashtagCount >= 8 && hashtagCount <= 12) {
      multiplier += 0.1;
    } else if (hashtagCount < 5 || hashtagCount > 15) {
      multiplier -= 0.05;
    }

    return Math.max(0.5, Math.min(2.0, multiplier));
  }

  private static calculateUniquenessScore(contentData: any, dayNumber: number): number {
    let score = 0.5; // Base score

    // Check for unique keywords
    const contentText = `${contentData.title} ${contentData.description} ${contentData.content}`.toLowerCase();
    const uniqueKeywords = this.diversityTracker.usedKeywords.size;
    const keywordDiversity = Math.min(1.0, uniqueKeywords / 20); // Normalize to 0-1
    score += keywordDiversity * 0.3;

    // Check for theme diversity
    const themeDiversity = this.diversityTracker.usedThemes.size / this.contentThemes.length;
    score += themeDiversity * 0.2;

    // Check for format diversity
    const formatDiversity = this.diversityTracker.usedFormats.size / 4; // Assuming 4 main formats
    score += formatDiversity * 0.2;

    // Bonus for day-specific uniqueness
    if (dayNumber > 1) {
      score += 0.1;
    }

    return Math.min(1.0, score);
  }

  private static calculateDiversityScore(): number {
    const themeDiversity = this.diversityTracker.usedThemes.size / this.contentThemes.length;
    const formatDiversity = this.diversityTracker.usedFormats.size / 4;
    const keywordDiversity = Math.min(1.0, this.diversityTracker.usedKeywords.size / 50);

    return (themeDiversity + formatDiversity + keywordDiversity) / 3;
  }
}

// Initialize the service
EnhancedContentGenerator.initialize();
