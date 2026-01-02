import { google } from 'googleapis';

const youtube = google.youtube('v3');
const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI || `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/api/youtube/callback`
);

export class YouTubeService {
  static getAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.force-ssl'
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId,
      prompt: 'consent',
    });
  }

  static async exchangeCodeForTokens(code: string) {
    const { tokens } = await oauth2Client.getTokens(code);
    return tokens;
  }

  static async getChannelInfo(accessToken: string) {
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const response = await youtube.channels.list({
      auth: oauth2Client,
      part: ['snippet', 'statistics', 'brandingSettings'],
      mine: true,
    });

    return response.data.items?.[0] || null;
  }

  static async getChannelStats(accessToken: string) {
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const response = await youtube.channels.list({
      auth: oauth2Client,
      part: ['statistics'],
      mine: true,
    });

    const stats = response.data.items?.[0]?.statistics;
    
    return {
      subscriberCount: parseInt(stats?.subscriberCount || '0'),
      videoCount: parseInt(stats?.videoCount || '0'),
      viewCount: parseInt(stats?.viewCount || '0'),
    };
  }

  static async getChannelVideos(accessToken: string, maxResults: number = 20) {
    oauth2Client.setCredentials({ access_token: accessToken });
    
    // First get the uploads playlist ID
    const channelResponse = await youtube.channels.list({
      auth: oauth2Client,
      part: ['contentDetails'],
      mine: true,
    });

    const uploadsPlaylistId = channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    
    if (!uploadsPlaylistId) {
      return [];
    }

    // Get videos from uploads playlist
    const videosResponse = await youtube.playlistItems.list({
      auth: oauth2Client,
      part: ['snippet', 'contentDetails'],
      playlistId: uploadsPlaylistId,
      maxResults,
    });

    return videosResponse.data.items || [];
  }

  static async getVideoStats(accessToken: string, videoIds: string[]) {
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const response = await youtube.videos.list({
      auth: oauth2Client,
      part: ['statistics', 'snippet'],
      id: videoIds,
    });

    return response.data.items || [];
  }

  static async searchTrendingVideos(query: string, maxResults: number = 10) {
    const response = await youtube.search.list({
      auth: oauth2Client,
      part: ['snippet'],
      q: query,
      type: 'video',
      order: 'relevance',
      maxResults,
      key: process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY,
    });

    return response.data.items || [];
  }
}
