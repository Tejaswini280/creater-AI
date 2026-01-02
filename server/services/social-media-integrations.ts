import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface SocialMediaPost {
  id: string;
  content: string;
  platform: string;
  scheduledDate: string;
  mediaUrls?: string[];
  hashtags?: string[];
  metadata?: any;
}

interface PostResult {
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  error?: string;
  metadata?: any;
}

interface PlatformCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  accountId: string;
  accountName: string;
}

class SocialMediaIntegrations {
  private gemini: GoogleGenerativeAI;

  constructor() {
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  /**
   * Post content to Instagram
   */
  async postToInstagram(post: SocialMediaPost, credentials: PlatformCredentials): Promise<PostResult> {
    try {
      // Instagram Basic Display API or Instagram Graph API
      const response = await axios.post('https://graph.instagram.com/me/media', {
        image_url: post.mediaUrls?.[0] || '',
        caption: `${post.content}\n\n${post.hashtags?.join(' ') || ''}`,
        access_token: credentials.accessToken
      });

      return {
        success: true,
        platformPostId: response.data.id,
        platformUrl: `https://www.instagram.com/p/${response.data.id}`,
        metadata: response.data
      };
    } catch (error) {
      console.error('Instagram posting error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Post content to YouTube
   */
  async postToYouTube(post: SocialMediaPost, credentials: PlatformCredentials): Promise<PostResult> {
    try {
      // YouTube Data API v3
      const response = await axios.post('https://www.googleapis.com/youtube/v3/videos', {
        snippet: {
          title: post.metadata?.title || post.content.substring(0, 100),
          description: `${post.content}\n\n${post.hashtags?.join(' ') || ''}`,
          tags: post.hashtags?.map(tag => tag.replace('#', '')) || [],
          categoryId: '22' // People & Blogs
        },
        status: {
          privacyStatus: 'public'
        }
      }, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        platformPostId: response.data.id,
        platformUrl: `https://www.youtube.com/watch?v=${response.data.id}`,
        metadata: response.data
      };
    } catch (error) {
      console.error('YouTube posting error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Post content to TikTok
   */
  async postToTikTok(post: SocialMediaPost, credentials: PlatformCredentials): Promise<PostResult> {
    try {
      // TikTok for Developers API
      const response = await axios.post('https://open-api.tiktok.com/v2/post/publish/video/init/', {
        post_info: {
          title: post.metadata?.title || post.content.substring(0, 100),
          description: `${post.content}\n\n${post.hashtags?.join(' ') || ''}`,
          privacy_level: 'MUTUAL_FOLLOW_FRIENDS',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: post.metadata?.videoSize || 0,
          chunk_size: 10000000,
          total_chunk_count: 1
        }
      }, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        platformPostId: response.data.data.publish_id,
        platformUrl: `https://www.tiktok.com/@${credentials.accountName}/video/${response.data.data.publish_id}`,
        metadata: response.data
      };
    } catch (error) {
      console.error('TikTok posting error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Post content to LinkedIn
   */
  async postToLinkedIn(post: SocialMediaPost, credentials: PlatformCredentials): Promise<PostResult> {
    try {
      // LinkedIn API v2
      const response = await axios.post('https://api.linkedin.com/v2/ugcPosts', {
        author: `urn:li:person:${credentials.accountId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: `${post.content}\n\n${post.hashtags?.join(' ') || ''}`
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      }, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      return {
        success: true,
        platformPostId: response.data.id,
        platformUrl: `https://www.linkedin.com/feed/update/${response.data.id}`,
        metadata: response.data
      };
    } catch (error) {
      console.error('LinkedIn posting error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Post content to Facebook
   */
  async postToFacebook(post: SocialMediaPost, credentials: PlatformCredentials): Promise<PostResult> {
    try {
      // Facebook Graph API
      const response = await axios.post(`https://graph.facebook.com/v18.0/${credentials.accountId}/feed`, {
        message: `${post.content}\n\n${post.hashtags?.join(' ') || ''}`,
        access_token: credentials.accessToken
      });

      return {
        success: true,
        platformPostId: response.data.id,
        platformUrl: `https://www.facebook.com/${credentials.accountId}/posts/${response.data.id}`,
        metadata: response.data
      };
    } catch (error) {
      console.error('Facebook posting error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Post content to Twitter/X
   */
  async postToTwitter(post: SocialMediaPost, credentials: PlatformCredentials): Promise<PostResult> {
    try {
      // Twitter API v2
      const response = await axios.post('https://api.twitter.com/2/tweets', {
        text: `${post.content}\n\n${post.hashtags?.join(' ') || ''}`
      }, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        platformPostId: response.data.data.id,
        platformUrl: `https://twitter.com/${credentials.accountName}/status/${response.data.data.id}`,
        metadata: response.data
      };
    } catch (error) {
      console.error('Twitter posting error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Post content to any platform
   */
  async postToPlatform(post: SocialMediaPost, credentials: PlatformCredentials): Promise<PostResult> {
    switch (post.platform.toLowerCase()) {
      case 'instagram':
        return this.postToInstagram(post, credentials);
      case 'youtube':
        return this.postToYouTube(post, credentials);
      case 'tiktok':
        return this.postToTikTok(post, credentials);
      case 'linkedin':
        return this.postToLinkedIn(post, credentials);
      case 'facebook':
        return this.postToFacebook(post, credentials);
      case 'twitter':
        return this.postToTwitter(post, credentials);
      default:
        return {
          success: false,
          error: `Unsupported platform: ${post.platform}`
        };
    }
  }

  /**
   * Get platform analytics
   */
  async getPlatformAnalytics(platform: string, credentials: PlatformCredentials, postId?: string): Promise<any> {
    try {
      switch (platform.toLowerCase()) {
        case 'instagram':
          return this.getInstagramAnalytics(credentials, postId);
        case 'youtube':
          return this.getYouTubeAnalytics(credentials, postId);
        case 'tiktok':
          return this.getTikTokAnalytics(credentials, postId);
        case 'linkedin':
          return this.getLinkedInAnalytics(credentials, postId);
        case 'facebook':
          return this.getFacebookAnalytics(credentials, postId);
        case 'twitter':
          return this.getTwitterAnalytics(credentials, postId);
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      console.error(`Analytics error for ${platform}:`, error);
      throw error;
    }
  }

  /**
   * Get Instagram analytics
   */
  private async getInstagramAnalytics(credentials: PlatformCredentials, postId?: string): Promise<any> {
    const response = await axios.get(`https://graph.instagram.com/${postId || 'me'}/insights`, {
      params: {
        metric: 'impressions,reach,likes,comments,shares,saved',
        access_token: credentials.accessToken
      }
    });

    return {
      platform: 'instagram',
      metrics: response.data.data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get YouTube analytics
   */
  private async getYouTubeAnalytics(credentials: PlatformCredentials, postId?: string): Promise<any> {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'statistics',
        id: postId || 'me',
        key: credentials.accessToken
      }
    });

    return {
      platform: 'youtube',
      metrics: response.data.items[0]?.statistics || {},
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get TikTok analytics
   */
  private async getTikTokAnalytics(credentials: PlatformCredentials, postId?: string): Promise<any> {
    const response = await axios.get('https://open-api.tiktok.com/v2/video/query/', {
      params: {
        fields: 'id,title,cover_image_url,create_time,share_url,embed_url,like_count,comment_count,share_count,view_count',
        video_ids: postId || '',
        access_token: credentials.accessToken
      }
    });

    return {
      platform: 'tiktok',
      metrics: response.data.data || {},
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get LinkedIn analytics
   */
  private async getLinkedInAnalytics(credentials: PlatformCredentials, postId?: string): Promise<any> {
    const response = await axios.get(`https://api.linkedin.com/v2/socialActions/${postId}/statistics`, {
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    return {
      platform: 'linkedin',
      metrics: response.data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get Facebook analytics
   */
  private async getFacebookAnalytics(credentials: PlatformCredentials, postId?: string): Promise<any> {
    const response = await axios.get(`https://graph.facebook.com/v18.0/${postId || credentials.accountId}/insights`, {
      params: {
        metric: 'post_impressions,post_engaged_users,post_reactions_by_type_total',
        access_token: credentials.accessToken
      }
    });

    return {
      platform: 'facebook',
      metrics: response.data.data || {},
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get Twitter analytics
   */
  private async getTwitterAnalytics(credentials: PlatformCredentials, postId?: string): Promise<any> {
    const response = await axios.get(`https://api.twitter.com/2/tweets/${postId}/public_metrics`, {
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`
      }
    });

    return {
      platform: 'twitter',
      metrics: response.data.data?.public_metrics || {},
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate platform credentials
   */
  async validateCredentials(platform: string, credentials: PlatformCredentials): Promise<boolean> {
    try {
      switch (platform.toLowerCase()) {
        case 'instagram':
          await axios.get('https://graph.instagram.com/me', {
            params: { access_token: credentials.accessToken }
          });
          return true;
        case 'youtube':
          await axios.get('https://www.googleapis.com/youtube/v3/channels', {
            params: {
              part: 'snippet',
              mine: true,
              key: credentials.accessToken
            }
          });
          return true;
        case 'tiktok':
          await axios.get('https://open-api.tiktok.com/v2/user/info/', {
            params: { access_token: credentials.accessToken }
          });
          return true;
        case 'linkedin':
          await axios.get('https://api.linkedin.com/v2/me', {
            headers: {
              'Authorization': `Bearer ${credentials.accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0'
            }
          });
          return true;
        case 'facebook':
          await axios.get('https://graph.facebook.com/me', {
            params: { access_token: credentials.accessToken }
          });
          return true;
        case 'twitter':
          await axios.get('https://api.twitter.com/2/users/me', {
            headers: {
              'Authorization': `Bearer ${credentials.accessToken}`
            }
          });
          return true;
        default:
          return false;
      }
    } catch (error) {
      console.error(`Credential validation error for ${platform}:`, error);
      return false;
    }
  }

  /**
   * Get platform-specific posting requirements
   */
  getPlatformRequirements(platform: string): any {
    const requirements = {
      instagram: {
        maxCaptionLength: 2200,
        maxHashtags: 30,
        imageRequired: true,
        videoMaxLength: 60, // seconds
        supportedFormats: ['jpg', 'jpeg', 'png', 'mp4', 'mov']
      },
      youtube: {
        maxTitleLength: 100,
        maxDescriptionLength: 5000,
        videoRequired: true,
        videoMaxLength: 43200, // 12 hours
        supportedFormats: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm']
      },
      tiktok: {
        maxCaptionLength: 300,
        maxHashtags: 5,
        videoRequired: true,
        videoMaxLength: 180, // 3 minutes
        supportedFormats: ['mp4', 'mov', 'avi']
      },
      linkedin: {
        maxTextLength: 3000,
        maxHashtags: 5,
        imageOptional: true,
        videoMaxLength: 600, // 10 minutes
        supportedFormats: ['jpg', 'jpeg', 'png', 'mp4', 'mov']
      },
      facebook: {
        maxTextLength: 63206,
        maxHashtags: 30,
        imageOptional: true,
        videoMaxLength: 240, // 4 minutes
        supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov']
      },
      twitter: {
        maxTextLength: 280,
        maxHashtags: 10,
        imageOptional: true,
        videoMaxLength: 140, // 2 minutes 20 seconds
        supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov']
      }
    };

    return requirements[platform.toLowerCase()] || null;
  }

  /**
   * Optimize content for platform
   */
  async optimizeContentForPlatform(content: string, platform: string, metadata?: any): Promise<string> {
    try {
      const requirements = this.getPlatformRequirements(platform);
      if (!requirements) return content;

      const prompt = `
        Optimize this content for ${platform}:
        
        Content: ${content}
        Platform: ${platform}
        Requirements: ${JSON.stringify(requirements)}
        
        Make the content:
        1. Within character limits
        2. Platform-appropriate
        3. Engaging and optimized for the algorithm
        4. Include relevant hashtags (max ${requirements.maxHashtags || 10})
        5. Include a call-to-action if appropriate
        
        Return only the optimized content, no additional text.
      `;

      const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return response.text();
    } catch (error) {
      console.error('Content optimization error:', error);
      return content; // Return original content if optimization fails
    }
  }
}

export const socialMediaIntegrations = new SocialMediaIntegrations();
export type { SocialMediaPost, PostResult, PlatformCredentials };
