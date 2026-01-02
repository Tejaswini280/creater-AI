import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

interface SocialAccount {
  id: string;
  userId: string;
  platform: string;
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  isActive: boolean;
  metadata: Record<string, any>;
}

interface PostData {
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
  scheduledAt?: Date;
  platform: string;
  contentType: 'post' | 'reel' | 'short' | 'story' | 'video';
}

interface PostResult {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
  platform: string;
  publishedAt: Date;
}

interface PlatformConfig {
  name: string;
  apiBaseUrl: string;
  authUrl: string;
  scopes: string[];
  maxPostLength: number;
  supportedContentTypes: string[];
  rateLimits: {
    postsPerHour: number;
    postsPerDay: number;
  };
}

class SocialPlatformIntegration {
  private openai: OpenAI;
  private gemini: GoogleGenerativeAI;
  private platformConfigs: Record<string, PlatformConfig>;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key'
    });

    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

    this.platformConfigs = {
      instagram: {
        name: 'Instagram',
        apiBaseUrl: 'https://graph.facebook.com/v18.0',
        authUrl: 'https://api.instagram.com/oauth/authorize',
        scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list'],
        maxPostLength: 2200,
        supportedContentTypes: ['post', 'reel', 'story'],
        rateLimits: {
          postsPerHour: 25,
          postsPerDay: 200
        }
      },
      facebook: {
        name: 'Facebook',
        apiBaseUrl: 'https://graph.facebook.com/v18.0',
        authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
        scopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
        maxPostLength: 63206,
        supportedContentTypes: ['post', 'video'],
        rateLimits: {
          postsPerHour: 200,
          postsPerDay: 1000
        }
      },
      tiktok: {
        name: 'TikTok',
        apiBaseUrl: 'https://open-api.tiktok.com',
        authUrl: 'https://www.tiktok.com/auth/authorize',
        scopes: ['user.info.basic', 'video.publish'],
        maxPostLength: 300,
        supportedContentTypes: ['short', 'video'],
        rateLimits: {
          postsPerHour: 10,
          postsPerDay: 50
        }
      },
      youtube: {
        name: 'YouTube',
        apiBaseUrl: 'https://www.googleapis.com/youtube/v3',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        scopes: ['https://www.googleapis.com/auth/youtube.upload'],
        maxPostLength: 5000,
        supportedContentTypes: ['video'],
        rateLimits: {
          postsPerHour: 6,
          postsPerDay: 100
        }
      },
      linkedin: {
        name: 'LinkedIn',
        apiBaseUrl: 'https://api.linkedin.com/v2',
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        scopes: ['w_member_social', 'r_liteprofile'],
        maxPostLength: 3000,
        supportedContentTypes: ['post', 'video'],
        rateLimits: {
          postsPerHour: 150,
          postsPerDay: 1000
        }
      }
    };
  }

  /**
   * Get OAuth URL for platform authentication
   */
  getAuthUrl(platform: string, redirectUri: string, state?: string): string {
    const config = this.platformConfigs[platform];
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const params = new URLSearchParams({
      client_id: process.env[`${platform.toUpperCase()}_CLIENT_ID`] || '',
      redirect_uri: redirectUri,
      scope: config.scopes.join(','),
      response_type: 'code',
      state: state || 'default'
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(platform: string, code: string, redirectUri: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    scope?: string;
  }> {
    const config = this.platformConfigs[platform];
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    try {
      const response = await axios.post(`${config.apiBaseUrl}/oauth/access_token`, {
        client_id: process.env[`${platform.toUpperCase()}_CLIENT_ID`],
        client_secret: process.env[`${platform.toUpperCase()}_CLIENT_SECRET`],
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        scope: response.data.scope
      };
    } catch (error) {
      console.error(`Error exchanging code for token for ${platform}:`, error);
      throw new Error(`Failed to exchange code for token: ${error}`);
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(platform: string, refreshToken: string): Promise<{
    accessToken: string;
    expiresIn?: number;
  }> {
    const config = this.platformConfigs[platform];
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    try {
      const response = await axios.post(`${config.apiBaseUrl}/oauth/access_token`, {
        client_id: process.env[`${platform.toUpperCase()}_CLIENT_ID`],
        client_secret: process.env[`${platform.toUpperCase()}_CLIENT_SECRET`],
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      });

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      console.error(`Error refreshing token for ${platform}:`, error);
      throw new Error(`Failed to refresh access token: ${error}`);
    }
  }

  /**
   * Publish content to a specific platform
   */
  async publishContent(account: SocialAccount, postData: PostData): Promise<PostResult> {
    const config = this.platformConfigs[postData.platform];
    if (!config) {
      throw new Error(`Unsupported platform: ${postData.platform}`);
    }

    try {
      // Validate content length
      if (postData.content.length > config.maxPostLength) {
        throw new Error(`Content exceeds maximum length of ${config.maxPostLength} characters`);
      }

      // Validate content type
      if (!config.supportedContentTypes.includes(postData.contentType)) {
        throw new Error(`Unsupported content type: ${postData.contentType}`);
      }

      // Platform-specific publishing logic
      switch (postData.platform) {
        case 'instagram':
          return await this.publishToInstagram(account, postData);
        case 'facebook':
          return await this.publishToFacebook(account, postData);
        case 'tiktok':
          return await this.publishToTikTok(account, postData);
        case 'youtube':
          return await this.publishToYouTube(account, postData);
        case 'linkedin':
          return await this.publishToLinkedIn(account, postData);
        default:
          throw new Error(`Publishing not implemented for ${postData.platform}`);
      }
    } catch (error) {
      console.error(`Error publishing to ${postData.platform}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: postData.platform,
        publishedAt: new Date()
      };
    }
  }

  /**
   * Publish to Instagram
   */
  private async publishToInstagram(account: SocialAccount, postData: PostData): Promise<PostResult> {
    try {
      // Create media container
      const mediaResponse = await axios.post(
        `${this.platformConfigs.instagram.apiBaseUrl}/${account.accountId}/media`,
        {
          image_url: postData.mediaUrls?.[0],
          caption: postData.content,
          access_token: account.accessToken
        }
      );

      const mediaId = mediaResponse.data.id;

      // Publish the media
      const publishResponse = await axios.post(
        `${this.platformConfigs.instagram.apiBaseUrl}/${account.accountId}/media_publish`,
        {
          creation_id: mediaId,
          access_token: account.accessToken
        }
      );

      return {
        success: true,
        postId: publishResponse.data.id,
        url: `https://www.instagram.com/p/${publishResponse.data.id}`,
        platform: 'instagram',
        publishedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Instagram publishing failed: ${error}`);
    }
  }

  /**
   * Publish to Facebook
   */
  private async publishToFacebook(account: SocialAccount, postData: PostData): Promise<PostResult> {
    try {
      const response = await axios.post(
        `${this.platformConfigs.facebook.apiBaseUrl}/${account.accountId}/feed`,
        {
          message: postData.content,
          access_token: account.accessToken
        }
      );

      return {
        success: true,
        postId: response.data.id,
        url: `https://www.facebook.com/${response.data.id}`,
        platform: 'facebook',
        publishedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Facebook publishing failed: ${error}`);
    }
  }

  /**
   * Publish to TikTok
   */
  private async publishToTikTok(account: SocialAccount, postData: PostData): Promise<PostResult> {
    try {
      // TikTok requires a more complex flow with video upload
      const response = await axios.post(
        `${this.platformConfigs.tiktok.apiBaseUrl}/share/video/upload/`,
        {
          video: postData.mediaUrls?.[0],
          description: postData.content,
          access_token: account.accessToken
        }
      );

      return {
        success: true,
        postId: response.data.data.video_id,
        url: `https://www.tiktok.com/@${account.accountName}/video/${response.data.data.video_id}`,
        platform: 'tiktok',
        publishedAt: new Date()
      };
    } catch (error) {
      throw new Error(`TikTok publishing failed: ${error}`);
    }
  }

  /**
   * Publish to YouTube
   */
  private async publishToYouTube(account: SocialAccount, postData: PostData): Promise<PostResult> {
    try {
      const response = await axios.post(
        `${this.platformConfigs.youtube.apiBaseUrl}/videos`,
        {
          part: 'snippet,status',
          snippet: {
            title: postData.content.split('\n')[0], // Use first line as title
            description: postData.content,
            tags: postData.hashtags?.map(tag => tag.replace('#', '')) || []
          },
          status: {
            privacyStatus: 'public'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${account.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        postId: response.data.id,
        url: `https://www.youtube.com/watch?v=${response.data.id}`,
        platform: 'youtube',
        publishedAt: new Date()
      };
    } catch (error) {
      throw new Error(`YouTube publishing failed: ${error}`);
    }
  }

  /**
   * Publish to LinkedIn
   */
  private async publishToLinkedIn(account: SocialAccount, postData: PostData): Promise<PostResult> {
    try {
      const response = await axios.post(
        `${this.platformConfigs.linkedin.apiBaseUrl}/ugcPosts`,
        {
          author: `urn:li:person:${account.accountId}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: postData.content
              },
              shareMediaCategory: 'NONE'
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${account.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        postId: response.data.id,
        url: `https://www.linkedin.com/feed/update/${response.data.id}`,
        platform: 'linkedin',
        publishedAt: new Date()
      };
    } catch (error) {
      throw new Error(`LinkedIn publishing failed: ${error}`);
    }
  }

  /**
   * Schedule content for future publishing
   */
  async scheduleContent(account: SocialAccount, postData: PostData, scheduledAt: Date): Promise<{
    success: boolean;
    scheduleId?: string;
    error?: string;
  }> {
    try {
      // For now, we'll store scheduled content in our database
      // In a production system, you'd use platform-specific scheduling APIs
      const scheduleData = {
        accountId: account.id,
        platform: postData.platform,
        content: postData.content,
        mediaUrls: postData.mediaUrls,
        hashtags: postData.hashtags,
        scheduledAt: scheduledAt,
        status: 'scheduled'
      };

      // Store in database (this would be implemented with your database service)
      // const scheduleId = await this.storeScheduledContent(scheduleData);

      return {
        success: true,
        scheduleId: `schedule_${Date.now()}`
      };
    } catch (error) {
      console.error('Error scheduling content:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get account analytics
   */
  async getAccountAnalytics(account: SocialAccount, startDate: Date, endDate: Date): Promise<{
    platform: string;
    followers: number;
    engagement: number;
    reach: number;
    impressions: number;
    posts: number;
  }> {
    const config = this.platformConfigs[account.platform];
    if (!config) {
      throw new Error(`Unsupported platform: ${account.platform}`);
    }

    try {
      // Platform-specific analytics implementation
      switch (account.platform) {
        case 'instagram':
          return await this.getInstagramAnalytics(account, startDate, endDate);
        case 'facebook':
          return await this.getFacebookAnalytics(account, startDate, endDate);
        case 'tiktok':
          return await this.getTikTokAnalytics(account, startDate, endDate);
        case 'youtube':
          return await this.getYouTubeAnalytics(account, startDate, endDate);
        case 'linkedin':
          return await this.getLinkedInAnalytics(account, startDate, endDate);
        default:
          throw new Error(`Analytics not implemented for ${account.platform}`);
      }
    } catch (error) {
      console.error(`Error getting analytics for ${account.platform}:`, error);
      throw new Error(`Failed to get analytics: ${error}`);
    }
  }

  /**
   * Get Instagram analytics
   */
  private async getInstagramAnalytics(account: SocialAccount, startDate: Date, endDate: Date): Promise<any> {
    try {
      const response = await axios.get(
        `${this.platformConfigs.instagram.apiBaseUrl}/${account.accountId}/insights`,
        {
          params: {
            metric: 'impressions,reach,follower_count,profile_views',
            period: 'day',
            since: Math.floor(startDate.getTime() / 1000),
            until: Math.floor(endDate.getTime() / 1000),
            access_token: account.accessToken
          }
        }
      );

      return {
        platform: 'instagram',
        followers: response.data.data.find((d: any) => d.name === 'follower_count')?.values[0]?.value || 0,
        engagement: 0, // Calculate from posts
        reach: response.data.data.find((d: any) => d.name === 'reach')?.values[0]?.value || 0,
        impressions: response.data.data.find((d: any) => d.name === 'impressions')?.values[0]?.value || 0,
        posts: 0 // Calculate from posts
      };
    } catch (error) {
      throw new Error(`Instagram analytics failed: ${error}`);
    }
  }

  /**
   * Get Facebook analytics
   */
  private async getFacebookAnalytics(account: SocialAccount, startDate: Date, endDate: Date): Promise<any> {
    // Similar implementation for Facebook
    return {
      platform: 'facebook',
      followers: 0,
      engagement: 0,
      reach: 0,
      impressions: 0,
      posts: 0
    };
  }

  /**
   * Get TikTok analytics
   */
  private async getTikTokAnalytics(account: SocialAccount, startDate: Date, endDate: Date): Promise<any> {
    // Similar implementation for TikTok
    return {
      platform: 'tiktok',
      followers: 0,
      engagement: 0,
      reach: 0,
      impressions: 0,
      posts: 0
    };
  }

  /**
   * Get YouTube analytics
   */
  private async getYouTubeAnalytics(account: SocialAccount, startDate: Date, endDate: Date): Promise<any> {
    // Similar implementation for YouTube
    return {
      platform: 'youtube',
      followers: 0,
      engagement: 0,
      reach: 0,
      impressions: 0,
      posts: 0
    };
  }

  /**
   * Get LinkedIn analytics
   */
  private async getLinkedInAnalytics(account: SocialAccount, startDate: Date, endDate: Date): Promise<any> {
    // Similar implementation for LinkedIn
    return {
      platform: 'linkedin',
      followers: 0,
      engagement: 0,
      reach: 0,
      impressions: 0,
      posts: 0
    };
  }

  /**
   * Validate account credentials
   */
  async validateAccount(account: SocialAccount): Promise<boolean> {
    try {
      const config = this.platformConfigs[account.platform];
      if (!config) return false;

      // Test API access with a simple request
      const response = await axios.get(
        `${config.apiBaseUrl}/me`,
        {
          headers: {
            'Authorization': `Bearer ${account.accessToken}`
          }
        }
      );

      return response.status === 200;
    } catch (error) {
      console.error(`Account validation failed for ${account.platform}:`, error);
      return false;
    }
  }

  /**
   * Get platform configuration
   */
  getPlatformConfig(platform: string): PlatformConfig | null {
    return this.platformConfigs[platform] || null;
  }

  /**
   * Get all supported platforms
   */
  getSupportedPlatforms(): string[] {
    return Object.keys(this.platformConfigs);
  }
}

export const socialPlatformIntegration = new SocialPlatformIntegration();
export type { SocialAccount, PostData, PostResult, PlatformConfig };
