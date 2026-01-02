import { nanoid } from 'nanoid';

export interface LinkedInProfile {
  id: string;
  name: string;
  headline: string;
  profilePicture: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface LinkedInPost {
  id: string;
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
  };
  visibility: 'public' | 'connections';
  scheduledAt?: Date;
}

export interface LinkedInAnalytics {
  impressions: number;
  clicks: number;
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
}

export class LinkedInService {
  private static instance: LinkedInService;
  private linkedInConfig = {
    clientId: process.env.LINKEDIN_CLIENT_ID || 'mock_client_id',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || 'mock_client_secret',
    redirectUri: process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:5000/api/linkedin/callback',
    scope: ['w_member_social', 'r_liteprofile', 'r_emailaddress']
  };

  public static getInstance(): LinkedInService {
    if (!LinkedInService.instance) {
      LinkedInService.instance = new LinkedInService();
    }
    return LinkedInService.instance;
  }

  /**
   * Generate LinkedIn OAuth URL
   */
  public generateAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.linkedInConfig.clientId,
      redirect_uri: this.linkedInConfig.redirectUri,
      state: state,
      scope: this.linkedInConfig.scope.join(' ')
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  public async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      // In production, this would make a real API call to LinkedIn
      // For now, we'll simulate the OAuth flow
      if (process.env.NODE_ENV === 'production' && this.linkedInConfig.clientId !== 'mock_client_id') {
        const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            client_id: this.linkedInConfig.clientId,
            client_secret: this.linkedInConfig.clientSecret,
            redirect_uri: this.linkedInConfig.redirectUri,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to exchange code for token');
        }

        const data = await response.json();
        return {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in,
        };
      } else {
        // Development implementation
        return {
          accessToken: `mock_access_token_${nanoid()}`,
          refreshToken: `mock_refresh_token_${nanoid()}`,
          expiresIn: 3600,
        };
      }
    } catch (error) {
      console.error('LinkedIn token exchange error:', error);
      throw new Error('Failed to authenticate with LinkedIn');
    }
  }

  /**
   * Get LinkedIn user profile
   */
  public async getProfile(accessToken: string): Promise<LinkedInProfile> {
    try {
      if (process.env.NODE_ENV === 'production' && accessToken !== 'mock_access_token') {
        const response = await fetch('https://api.linkedin.com/v2/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch LinkedIn profile');
        }

        const profile = await response.json();
        
        // Get email address
        const emailResponse = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        });

        const emailData = await emailResponse.json();
        const email = emailData.elements?.[0]?.['handle~']?.emailAddress || '';

        return {
          id: profile.id,
          name: `${profile.localizedFirstName} ${profile.localizedLastName}`,
          headline: profile.localizedHeadline || '',
          profilePicture: profile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier || '',
          email: email,
          accessToken: accessToken,
          refreshToken: '', // Would be stored separately
          expiresAt: new Date(Date.now() + 3600 * 1000),
        };
      } else {
        // Mock profile for development
        return {
          id: `mock_linkedin_id_${nanoid()}`,
          name: 'John Doe',
          headline: 'Content Creator & Digital Marketer',
          profilePicture: 'https://via.placeholder.com/150',
          email: 'john.doe@example.com',
          accessToken: accessToken,
          refreshToken: `mock_refresh_token_${nanoid()}`,
          expiresAt: new Date(Date.now() + 3600 * 1000),
        };
      }
    } catch (error) {
      console.error('LinkedIn profile fetch error:', error);
      throw new Error('Failed to fetch LinkedIn profile');
    }
  }

  /**
   * Publish content to LinkedIn
   */
  public async publishPost(accessToken: string, post: LinkedInPost): Promise<{ id: string; url: string }> {
    try {
      if (process.env.NODE_ENV === 'production' && accessToken !== 'mock_access_token') {
        const postData: any = {
          author: `urn:li:person:${post.id}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: post.content,
              },
              shareMediaCategory: post.media ? 'IMAGE' : 'NONE',
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': post.visibility.toUpperCase(),
          },
        };

        if (post.media) {
          // Upload media first
          const mediaUploadResponse = await this.uploadMedia(accessToken, post.media);
          postData.specificContent['com.linkedin.ugc.ShareContent'].media = [{
            status: 'READY',
            description: {
              text: 'Content media',
            },
            media: mediaUploadResponse.asset,
          }];
        }

        const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
          body: JSON.stringify(postData),
        });

        if (!response.ok) {
          throw new Error('Failed to publish to LinkedIn');
        }

        const result = await response.json();
        return {
          id: result.id,
          url: `https://www.linkedin.com/feed/update/${result.id}/`,
        };
      } else {
        // Development implementation
        const postId = `mock_post_${nanoid()}`;
        return {
          id: postId,
          url: `https://www.linkedin.com/feed/update/${postId}/`,
        };
      }
    } catch (error) {
      console.error('LinkedIn publish error:', error);
      throw new Error('Failed to publish content to LinkedIn');
    }
  }

  /**
   * Upload media to LinkedIn
   */
  private async uploadMedia(accessToken: string, media: { type: 'image' | 'video'; url: string }): Promise<{ asset: string }> {
    try {
      // In production, this would handle actual media upload
      // For now, return a mock asset ID
      return {
        asset: `urn:li:digitalmediaAsset:${nanoid()}`,
      };
    } catch (error) {
      console.error('LinkedIn media upload error:', error);
      throw new Error('Failed to upload media to LinkedIn');
    }
  }

  /**
   * Get LinkedIn analytics
   */
  public async getAnalytics(accessToken: string, postId: string): Promise<LinkedInAnalytics> {
    try {
      if (process.env.NODE_ENV === 'production' && accessToken !== 'mock_access_token') {
        const response = await fetch(`https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${postId}&timeIntervals=(timeRange:(start:${Date.now() - 30 * 24 * 60 * 60 * 1000},end:${Date.now()}))`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch LinkedIn analytics');
        }

        const data = await response.json();
        return {
          impressions: data.totalShareStatistics?.impressionCount || 0,
          clicks: data.totalShareStatistics?.clickCount || 0,
          likes: data.totalShareStatistics?.likeCount || 0,
          comments: data.totalShareStatistics?.commentCount || 0,
          shares: data.totalShareStatistics?.shareCount || 0,
          engagement: data.totalShareStatistics?.engagement || 0,
        };
      } else {
        // Mock analytics for development
        return {
          impressions: Math.floor(Math.random() * 1000) + 100,
          clicks: Math.floor(Math.random() * 100) + 10,
          likes: Math.floor(Math.random() * 50) + 5,
          comments: Math.floor(Math.random() * 20) + 2,
          shares: Math.floor(Math.random() * 10) + 1,
          engagement: Math.floor(Math.random() * 5) + 1,
        };
      }
    } catch (error) {
      console.error('LinkedIn analytics error:', error);
      throw new Error('Failed to fetch LinkedIn analytics');
    }
  }

  /**
   * Search LinkedIn professionals
   */
  public async searchPeople(accessToken: string, query: string): Promise<any[]> {
    try {
      if (process.env.NODE_ENV === 'production' && accessToken !== 'mock_access_token') {
        const response = await fetch(`https://api.linkedin.com/v2/people/search?q=people&keywords=${encodeURIComponent(query)}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to search LinkedIn people');
        }

        const data = await response.json();
        return data.elements || [];
      } else {
        // Mock search results for development
        return [
          {
            id: `mock_person_1_${nanoid()}`,
            name: 'Jane Smith',
            headline: 'Marketing Manager',
            profilePicture: 'https://via.placeholder.com/150',
          },
          {
            id: `mock_person_2_${nanoid()}`,
            name: 'Mike Johnson',
            headline: 'Content Creator',
            profilePicture: 'https://via.placeholder.com/150',
          },
        ];
      }
    } catch (error) {
      console.error('LinkedIn people search error:', error);
      throw new Error('Failed to search LinkedIn people');
    }
  }

  /**
   * Send LinkedIn message
   */
  public async sendMessage(accessToken: string, recipientId: string, message: string): Promise<{ id: string }> {
    try {
      if (process.env.NODE_ENV === 'production' && accessToken !== 'mock_access_token') {
        const messageData = {
          recipients: [{
            person: {
              id: recipientId,
            },
          }],
          subject: 'Message from CreatorAI Studio',
          body: message,
        };

        const response = await fetch('https://api.linkedin.com/v2/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
          body: JSON.stringify(messageData),
        });

        if (!response.ok) {
          throw new Error('Failed to send LinkedIn message');
        }

        const result = await response.json();
        return { id: result.id };
      } else {
        // Mock message sending for development
        return { id: `mock_message_${nanoid()}` };
      }
    } catch (error) {
      console.error('LinkedIn message error:', error);
      throw new Error('Failed to send LinkedIn message');
    }
  }

  /**
   * Get trending content on LinkedIn
   */
  public async getTrendingContent(accessToken: string): Promise<any[]> {
    try {
      if (process.env.NODE_ENV === 'production' && accessToken !== 'mock_access_token') {
        // LinkedIn doesn't have a direct trending API, so we'll simulate it
        const response = await fetch('https://api.linkedin.com/v2/feedUpdates?q=networkShares&count=10', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch trending content');
        }

        const data = await response.json();
        return data.elements || [];
      } else {
        // Mock trending content for development
        return [
          {
            id: `mock_trending_1_${nanoid()}`,
            content: 'The future of AI in content creation',
            author: 'Tech Influencer',
            engagement: 1250,
            type: 'article',
          },
          {
            id: `mock_trending_2_${nanoid()}`,
            content: 'How to build a personal brand on LinkedIn',
            author: 'Marketing Expert',
            engagement: 890,
            type: 'video',
          },
        ];
      }
    } catch (error) {
      console.error('LinkedIn trending content error:', error);
      throw new Error('Failed to fetch trending content');
    }
  }

  /**
   * Refresh access token
   */
  public async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      if (process.env.NODE_ENV === 'production' && refreshToken !== 'mock_refresh_token') {
        const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: this.linkedInConfig.clientId,
            client_secret: this.linkedInConfig.clientSecret,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to refresh token');
        }

        const data = await response.json();
        return {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in,
        };
      } else {
        // Mock token refresh for development
        return {
          accessToken: `mock_access_token_${nanoid()}`,
          refreshToken: `mock_refresh_token_${nanoid()}`,
          expiresIn: 3600,
        };
      }
    } catch (error) {
      console.error('LinkedIn token refresh error:', error);
      throw new Error('Failed to refresh LinkedIn token');
    }
  }
}