import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../db';
import { aiEngagementPatterns, socialPosts } from '@shared/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

interface EngagementData {
  platform: string;
  contentType: string;
  category: string;
  postingTime: string;
  dayOfWeek: number;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
  };
  contentLength: number;
  hashtagCount: number;
  titleLength: number;
}

interface OptimalTimingAnalysis {
  platform: string;
  category: string;
  bestTimes: string[];
  bestDays: number[];
  engagementScore: number;
  confidence: number;
  sampleSize: number;
  trends: {
    hourly: Record<string, number>;
    daily: Record<string, number>;
    seasonal: Record<string, number>;
  };
}

interface ContentPerformancePrediction {
  predictedEngagement: {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
  };
  optimalPostingTime: string;
  optimalPostingDay: number;
  confidence: number;
  factors: {
    timeFactor: number;
    contentFactor: number;
    platformFactor: number;
    audienceFactor: number;
  };
}

export class AIEngagementAnalyzer {
  private static genAI: GoogleGenerativeAI | null = null;
  private static engagementCache: Map<string, OptimalTimingAnalysis> = new Map();
  private static cacheExpiry: Map<string, number> = new Map();
  private static CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  static initialize() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  /**
   * Analyze historical engagement data to find optimal posting patterns
   */
  static async analyzeOptimalTiming(
    platform: string,
    category: string,
    timezone: string = 'UTC'
  ): Promise<OptimalTimingAnalysis> {
    const cacheKey = `${platform}-${category}-${timezone}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.engagementCache.get(cacheKey)!;
    }

    try {
      // Get historical data from database
      const historicalData = await this.getHistoricalEngagementData(platform, category);
      
      if (historicalData.length === 0) {
        // No historical data, use AI to generate optimal times
        return await this.generateOptimalTimingWithAI(platform, category, timezone);
      }

      // Analyze patterns from historical data
      const analysis = await this.analyzeEngagementPatterns(historicalData, platform, category);
      
      // Cache the result
      this.engagementCache.set(cacheKey, analysis);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing optimal timing:', error);
      return await this.generateOptimalTimingWithAI(platform, category, timezone);
    }
  }

  /**
   * Predict engagement for new content
   */
  static async predictContentEngagement(params: {
    platform: string;
    contentType: string;
    category: string;
    contentTitle: string;
    contentDescription: string;
    hashtags: string[];
    targetAudience: string;
    scheduledDate: Date;
  }): Promise<ContentPerformancePrediction> {
    try {
      // Get optimal timing analysis
      const timingAnalysis = await this.analyzeOptimalTiming(params.platform, params.category);
      
      // Calculate content factors
      const contentFactors = this.analyzeContentFactors(params);
      
      // Calculate platform factors
      const platformFactors = this.calculatePlatformFactors(params.platform, params.contentType);
      
      // Calculate audience factors
      const audienceFactors = await this.calculateAudienceFactors(params.targetAudience, params.platform);
      
      // Calculate time factors
      const timeFactors = this.calculateTimeFactors(params.scheduledDate, timingAnalysis);
      
      // Generate prediction using AI
      const prediction = await this.generateEngagementPrediction({
        ...params,
        timingAnalysis,
        contentFactors,
        platformFactors,
        audienceFactors,
        timeFactors
      });

      return prediction;
    } catch (error) {
      console.error('Error predicting content engagement:', error);
      return this.getFallbackPrediction(params);
    }
  }

  private static async getHistoricalEngagementData(
    platform: string,
    category: string,
    daysBack: number = 90
  ): Promise<EngagementData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    try {
      const posts = await db
        .select()
        .from(socialPosts)
        .where(
          and(
            eq(socialPosts.platform, platform),
            eq(socialPosts.category, category),
            gte(socialPosts.createdAt, startDate)
          )
        )
        .orderBy(desc(socialPosts.createdAt))
        .limit(1000);

      return posts.map(post => ({
        platform: post.platform,
        contentType: post.contentType,
        category: post.category,
        postingTime: post.scheduledTime || '18:00',
        dayOfWeek: new Date(post.createdAt).getDay(),
        engagement: {
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0,
          reach: post.reach || 0
        },
        contentLength: post.content?.length || 0,
        hashtagCount: post.hashtags?.length || 0,
        titleLength: post.title?.length || 0
      }));
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }
  }

  private static async analyzeEngagementPatterns(
    data: EngagementData[],
    platform: string,
    category: string
  ): Promise<OptimalTimingAnalysis> {
    // Group data by time slots
    const hourlyEngagement: Record<string, number[]> = {};
    const dailyEngagement: Record<string, number[]> = {};
    
    data.forEach(item => {
      const hour = item.postingTime.split(':')[0];
      const day = item.dayOfWeek.toString();
      
      const engagementScore = this.calculateEngagementScore(item.engagement);
      
      if (!hourlyEngagement[hour]) hourlyEngagement[hour] = [];
      if (!dailyEngagement[day]) dailyEngagement[day] = [];
      
      hourlyEngagement[hour].push(engagementScore);
      dailyEngagement[day].push(engagementScore);
    });

    // Calculate average engagement by hour
    const hourlyAverages: Record<string, number> = {};
    Object.entries(hourlyEngagement).forEach(([hour, scores]) => {
      hourlyAverages[hour] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });

    // Calculate average engagement by day
    const dailyAverages: Record<string, number> = {};
    Object.entries(dailyEngagement).forEach(([day, scores]) => {
      dailyAverages[day] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });

    // Find best times and days
    const bestTimes = this.findTopEngagementTimes(hourlyAverages, 3);
    const bestDays = this.findTopEngagementDays(dailyAverages, 3);
    
    const overallEngagementScore = data.reduce((sum, item) => 
      sum + this.calculateEngagementScore(item.engagement), 0) / data.length;

    return {
      platform,
      category,
      bestTimes,
      bestDays,
      engagementScore: overallEngagementScore,
      confidence: Math.min(0.95, 0.6 + (data.length / 100) * 0.3),
      sampleSize: data.length,
      trends: {
        hourly: hourlyAverages,
        daily: dailyAverages,
        seasonal: {} // Could be enhanced with seasonal analysis
      }
    };
  }

  private static calculateEngagementScore(engagement: { likes: number; comments: number; shares: number; reach: number }): number {
    // Weighted engagement score
    const likesWeight = 0.3;
    const commentsWeight = 0.4;
    const sharesWeight = 0.2;
    const reachWeight = 0.1;

    const normalizedLikes = Math.min(engagement.likes / 1000, 1);
    const normalizedComments = Math.min(engagement.comments / 100, 1);
    const normalizedShares = Math.min(engagement.shares / 50, 1);
    const normalizedReach = Math.min(engagement.reach / 5000, 1);

    return (
      normalizedLikes * likesWeight +
      normalizedComments * commentsWeight +
      normalizedShares * sharesWeight +
      normalizedReach * reachWeight
    );
  }

  private static findTopEngagementTimes(hourlyAverages: Record<string, number>, count: number): string[] {
    return Object.entries(hourlyAverages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, count)
      .map(([hour]) => `${hour}:00`);
  }

  private static findTopEngagementDays(dailyAverages: Record<string, number>, count: number): number[] {
    return Object.entries(dailyAverages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, count)
      .map(([day]) => parseInt(day));
  }

  private static async generateOptimalTimingWithAI(
    platform: string,
    category: string,
    timezone: string
  ): Promise<OptimalTimingAnalysis> {
    if (!this.genAI) {
      return this.getFallbackOptimalTiming(platform, category);
    }

    const prompt = `Analyze optimal posting times for ${platform} content in the ${category} category.

Consider:
- Platform-specific user behavior patterns
- Content category engagement trends
- Timezone: ${timezone}
- Industry best practices
- Peak user activity hours

Provide optimal posting times and days based on platform research and engagement patterns.

Format as JSON:
{
  "bestTimes": ["18:00", "19:00", "20:00"],
  "bestDays": [1, 3, 5],
  "engagementScore": 0.75,
  "confidence": 0.8,
  "sampleSize": 0,
  "trends": {
    "hourly": {"18": 0.8, "19": 0.9, "20": 0.85},
    "daily": {"1": 0.7, "3": 0.8, "5": 0.75},
    "seasonal": {}
  }
}`;

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          platform,
          category,
          bestTimes: data.bestTimes || ['18:00', '19:00', '20:00'],
          bestDays: data.bestDays || [1, 3, 5],
          engagementScore: data.engagementScore || 0.75,
          confidence: data.confidence || 0.8,
          sampleSize: data.sampleSize || 0,
          trends: data.trends || { hourly: {}, daily: {}, seasonal: {} }
        };
      }
    } catch (error) {
      console.error('Error generating optimal timing with AI:', error);
    }

    return this.getFallbackOptimalTiming(platform, category);
  }

  private static getFallbackOptimalTiming(platform: string, category: string): OptimalTimingAnalysis {
    const fallbackTimes: Record<string, string[]> = {
      instagram: ['18:00', '19:00', '20:00'],
      youtube: ['15:00', '18:00', '20:00'],
      tiktok: ['19:00', '20:00', '21:00'],
      linkedin: ['08:00', '12:00', '17:00'],
      facebook: ['13:00', '15:00', '19:00']
    };

    return {
      platform,
      category,
      bestTimes: fallbackTimes[platform] || fallbackTimes.instagram,
      bestDays: [1, 3, 5], // Monday, Wednesday, Friday
      engagementScore: 0.7,
      confidence: 0.6,
      sampleSize: 0,
      trends: {
        hourly: {},
        daily: {},
        seasonal: {}
      }
    };
  }

  private static analyzeContentFactors(params: {
    contentTitle: string;
    contentDescription: string;
    hashtags: string[];
  }): { titleFactor: number; descriptionFactor: number; hashtagFactor: number } {
    const titleLength = params.contentTitle.length;
    const descriptionLength = params.contentDescription.length;
    const hashtagCount = params.hashtags.length;

    // Optimal ranges based on platform research
    const titleFactor = this.calculateFactor(titleLength, 40, 60, 0.1);
    const descriptionFactor = this.calculateFactor(descriptionLength, 100, 200, 0.1);
    const hashtagFactor = this.calculateFactor(hashtagCount, 8, 12, 0.1);

    return { titleFactor, descriptionFactor, hashtagFactor };
  }

  private static calculateFactor(value: number, min: number, max: number, bonus: number): number {
    if (value >= min && value <= max) {
      return 1.0 + bonus;
    } else if (value < min) {
      return 1.0 - (min - value) / min * 0.1;
    } else {
      return 1.0 - (value - max) / max * 0.05;
    }
  }

  private static calculatePlatformFactors(platform: string, contentType: string): number {
    const platformMultipliers: Record<string, number> = {
      instagram: 1.0,
      youtube: 1.2,
      tiktok: 1.3,
      linkedin: 0.8,
      facebook: 0.9
    };

    const contentMultipliers: Record<string, number> = {
      video: 1.2,
      image: 1.0,
      text: 0.9,
      carousel: 1.1,
      story: 1.0
    };

    return (platformMultipliers[platform] || 1.0) * (contentMultipliers[contentType] || 1.0);
  }

  private static async calculateAudienceFactors(targetAudience: string, platform: string): Promise<number> {
    // This could be enhanced with actual audience analysis
    const audienceEngagement: Record<string, number> = {
      'gen-z': 1.3,
      'millennials': 1.1,
      'gen-x': 0.9,
      'boomers': 0.8,
      'professionals': 1.0,
      'students': 1.2,
      'entrepreneurs': 1.1
    };

    return audienceEngagement[targetAudience.toLowerCase()] || 1.0;
  }

  private static calculateTimeFactors(
    scheduledDate: Date,
    timingAnalysis: OptimalTimingAnalysis
  ): { timeFactor: number; dayFactor: number } {
    const hour = scheduledDate.getHours();
    const dayOfWeek = scheduledDate.getDay();
    const timeString = `${hour}:00`;

    const timeFactor = timingAnalysis.trends.hourly[hour.toString()] || 0.7;
    const dayFactor = timingAnalysis.trends.daily[dayOfWeek.toString()] || 0.7;

    return { timeFactor, dayFactor };
  }

  private static async generateEngagementPrediction(params: any): Promise<ContentPerformancePrediction> {
    if (!this.genAI) {
      return this.getFallbackPrediction(params);
    }

    const prompt = `Predict engagement for social media content with these parameters:

Platform: ${params.platform}
Content Type: ${params.contentType}
Category: ${params.category}
Title: ${params.contentTitle}
Description: ${params.contentDescription}
Hashtags: ${params.hashtags.join(', ')}
Target Audience: ${params.targetAudience}

Content Factors:
- Title Factor: ${params.contentFactors.titleFactor}
- Description Factor: ${params.contentFactors.descriptionFactor}
- Hashtag Factor: ${params.contentFactors.hashtagFactor}

Platform Factor: ${params.platformFactors}
Audience Factor: ${params.audienceFactors}
Time Factor: ${params.timeFactors.timeFactor}
Day Factor: ${params.timeFactors.dayFactor}

Predict realistic engagement metrics and optimal posting time.

Format as JSON:
{
  "predictedEngagement": {
    "likes": 250,
    "comments": 35,
    "shares": 18,
    "reach": 1200
  },
  "optimalPostingTime": "19:00",
  "optimalPostingDay": 3,
  "confidence": 0.85,
  "factors": {
    "timeFactor": 0.9,
    "contentFactor": 1.1,
    "platformFactor": 1.2,
    "audienceFactor": 1.0
  }
}`;

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error generating engagement prediction:', error);
    }

    return this.getFallbackPrediction(params);
  }

  private static getFallbackPrediction(params: any): ContentPerformancePrediction {
    const baseEngagement = {
      likes: 150,
      comments: 20,
      shares: 10,
      reach: 600
    };

    const multiplier = params.platformFactors * params.audienceFactors * params.timeFactors.timeFactor;

    return {
      predictedEngagement: {
        likes: Math.round(baseEngagement.likes * multiplier),
        comments: Math.round(baseEngagement.comments * multiplier),
        shares: Math.round(baseEngagement.shares * multiplier),
        reach: Math.round(baseEngagement.reach * multiplier)
      },
      optimalPostingTime: '18:00',
      optimalPostingDay: 3,
      confidence: 0.6,
      factors: {
        timeFactor: params.timeFactors.timeFactor,
        contentFactor: 1.0,
        platformFactor: params.platformFactors,
        audienceFactor: params.audienceFactors
      }
    };
  }

  private static isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? Date.now() < expiry : false;
  }

  /**
   * Store engagement data for future analysis
   */
  static async storeEngagementData(data: {
    platform: string;
    category: string;
    contentType: string;
    postingTime: string;
    engagement: { likes: number; comments: number; shares: number; reach: number };
    contentLength: number;
    hashtagCount: number;
    titleLength: number;
  }): Promise<void> {
    try {
      await db.insert(aiEngagementPatterns).values({
        platform: data.platform,
        category: data.category,
        optimalTimes: [data.postingTime],
        engagementScore: this.calculateEngagementScore(data.engagement),
        sampleSize: 1,
        metadata: {
          contentType: data.contentType,
          contentLength: data.contentLength,
          hashtagCount: data.hashtagCount,
          titleLength: data.titleLength,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error storing engagement data:', error);
    }
  }
}

// Initialize the service
AIEngagementAnalyzer.initialize();
