import { apiClient } from './apiClient';

export interface EnhancedContentRequest {
  projectName: string;
  contentName: string;
  contentDescription: string;
  contentType: string;
  channelType: string;
  targetAudience: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  preferences?: {
    avoidRepetition?: boolean;
    optimizeScheduling?: boolean;
    includeEngagementPrediction?: boolean;
    themeDiversity?: boolean;
  };
}

export interface EnhancedContentItem {
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
  theme?: string;
  format?: string;
  engagementPrediction: {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
  };
  uniquenessScore?: number;
  optimalTime?: string;
  confidence?: number;
}

export interface EngagementPredictionRequest {
  platform: string;
  contentType: string;
  category: string;
  contentTitle: string;
  contentDescription: string;
  hashtags: string[];
  targetAudience: string;
  scheduledDate: string;
}

export interface OptimalTimingRequest {
  platform: string;
  category: string;
  timezone?: string;
}

export interface ContentTheme {
  id: string;
  name: string;
  angle: string;
  format: string;
  keywords: string[];
  engagementMultiplier: number;
}

class EnhancedContentApi {
  /**
   * Generate unique, non-repetitive content with optimal scheduling
   */
  async generateEnhancedContent(request: EnhancedContentRequest): Promise<{
    success: boolean;
    contentItems: EnhancedContentItem[];
    metadata: {
      generatedAt: string;
      model: string;
      totalItems: number;
      diversityScore?: number;
      themesUsed?: string[];
      userId?: string;
      preferences?: any;
    };
    message: string;
  }> {
    try {
      const response = await apiClient.post('/enhanced-content/generate', request);
      return response.data;
    } catch (error) {
      console.error('Error generating enhanced content:', error);
      throw new Error('Failed to generate enhanced content');
    }
  }

  /**
   * Predict engagement for specific content
   */
  async predictEngagement(request: EngagementPredictionRequest): Promise<{
    success: boolean;
    prediction: {
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
    };
    message: string;
  }> {
    try {
      const response = await apiClient.post('/enhanced-content/predict-engagement', request);
      return response.data;
    } catch (error) {
      console.error('Error predicting engagement:', error);
      throw new Error('Failed to predict engagement');
    }
  }

  /**
   * Analyze optimal posting times for platform and category
   */
  async analyzeOptimalTiming(request: OptimalTimingRequest): Promise<{
    success: boolean;
    analysis: {
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
    };
    message: string;
  }> {
    try {
      const response = await apiClient.post('/enhanced-content/analyze-timing', request);
      return response.data;
    } catch (error) {
      console.error('Error analyzing optimal timing:', error);
      throw new Error('Failed to analyze optimal timing');
    }
  }

  /**
   * Get available content themes and formats
   */
  async getContentThemes(): Promise<{
    success: boolean;
    themes: ContentTheme[];
    message: string;
  }> {
    try {
      const response = await apiClient.get('/enhanced-content/themes');
      return response.data;
    } catch (error) {
      console.error('Error retrieving content themes:', error);
      throw new Error('Failed to retrieve content themes');
    }
  }

  /**
   * Store engagement data for future analysis
   */
  async storeEngagementData(data: {
    platform: string;
    category: string;
    contentType: string;
    postingTime: string;
    engagement: {
      likes: number;
      comments: number;
      shares: number;
      reach: number;
    };
    contentLength: number;
    hashtagCount: number;
    titleLength: number;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await apiClient.post('/enhanced-content/store-engagement', data);
      return response.data;
    } catch (error) {
      console.error('Error storing engagement data:', error);
      throw new Error('Failed to store engagement data');
    }
  }

  /**
   * Generate content with specific theme preferences
   */
  async generateThemedContent(
    request: EnhancedContentRequest,
    preferredThemes?: string[]
  ): Promise<{
    success: boolean;
    contentItems: EnhancedContentItem[];
    metadata: any;
    message: string;
  }> {
    try {
      const themedRequest = {
        ...request,
        preferences: {
          ...request.preferences,
          preferredThemes
        }
      };
      
      const response = await apiClient.post('/enhanced-content/generate', themedRequest);
      return response.data;
    } catch (error) {
      console.error('Error generating themed content:', error);
      throw new Error('Failed to generate themed content');
    }
  }

  /**
   * Regenerate content for specific days with different themes
   */
  async regenerateContentDays(
    projectId: string,
    dayNumbers: number[],
    newThemes?: string[]
  ): Promise<{
    success: boolean;
    contentItems: EnhancedContentItem[];
    message: string;
  }> {
    try {
      const response = await apiClient.post('/enhanced-content/regenerate-days', {
        projectId,
        dayNumbers,
        newThemes
      });
      return response.data;
    } catch (error) {
      console.error('Error regenerating content days:', error);
      throw new Error('Failed to regenerate content days');
    }
  }

  /**
   * Get content diversity analysis
   */
  async getContentDiversityAnalysis(projectId: string): Promise<{
    success: boolean;
    analysis: {
      diversityScore: number;
      themeDistribution: Record<string, number>;
      formatDistribution: Record<string, number>;
      keywordDiversity: number;
      recommendations: string[];
    };
    message: string;
  }> {
    try {
      const response = await apiClient.get(`/enhanced-content/diversity-analysis/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting diversity analysis:', error);
      throw new Error('Failed to get diversity analysis');
    }
  }
}

export const enhancedContentApi = new EnhancedContentApi();
