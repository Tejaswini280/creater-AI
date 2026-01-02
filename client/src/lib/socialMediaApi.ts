import { apiRequest } from './queryClient';

export interface Project {
  id: number;
  userId: string;
  name: string;
  description?: string;
  type: string;
  platform?: string;
  targetAudience?: string;
  estimatedDuration?: string;
  tags: string[];
  isPublic: boolean;
  status: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  type: string;
  platform?: string;
  targetAudience?: string;
  estimatedDuration?: string;
  tags: string[];
  isPublic: boolean;
  status: string;
  metadata?: any;
}

export interface SocialPost {
  id: number;
  userId: string;
  projectId?: number;
  title: string;
  caption?: string;
  hashtags: string[];
  emojis: string[];
  contentType: 'post' | 'reel' | 'short' | 'story' | 'video';
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledAt?: string;
  publishedAt?: string;
  thumbnailUrl?: string;
  mediaUrls: string[];
  aiGenerated: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface SocialAccount {
  id: number;
  userId: string;
  platform: string;
  accountId: string;
  accountName: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: string;
  isActive: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface HashtagSuggestion {
  id: number;
  platform: string;
  category: string;
  hashtag: string;
  trendScore: number;
  usageCount: number;
  isActive: boolean;
  metadata?: any;
  createdAt: string;
}

export interface AiContentSuggestion {
  id: number;
  userId: string;
  projectId?: number;
  suggestionType: 'caption' | 'hashtags' | 'best_time' | 'content_idea';
  platform: string;
  content: string;
  confidence: number;
  metadata?: any;
  createdAt: string;
}

// Project API functions
export const projectApi = {
  // Get user's projects
  getProjects: async (filters?: { status?: string; type?: string }): Promise<Project[]> => {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.type) queryParams.append('type', filters.type);

    const response = await apiRequest('GET', `/api/projects?${queryParams}`);
    const data = await response.json();
    return data.projects || [];
  },

  // Get project by ID
  getProjectById: async (projectId: number): Promise<Project> => {
    const response = await apiRequest('GET', `/api/projects/${projectId}`);
    const data = await response.json();
    return data.project;
  },

  // Create project
  createProject: async (projectData: CreateProjectRequest): Promise<Project> => {
    const response = await apiRequest('POST', '/api/projects', projectData);
    const data = await response.json();
    return data.project;
  },

  // Update project
  updateProject: async (projectId: number, updates: Partial<Project>): Promise<Project> => {
    const response = await apiRequest('PUT', `/api/projects/${projectId}`, updates);
    const data = await response.json();
    return data.project;
  },

  // Delete project
  deleteProject: async (projectId: number): Promise<void> => {
    await apiRequest('DELETE', `/api/projects/${projectId}`);
  }
};

// Social Post API functions
export const socialPostApi = {
  // Get social posts
  getSocialPosts: async (filters?: {
    status?: string;
    platform?: string;
    projectId?: number;
    limit?: number
  }): Promise<SocialPost[]> => {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.platform) queryParams.append('platform', filters.platform);
    if (filters?.projectId) queryParams.append('projectId', filters.projectId.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());

    const response = await apiRequest('GET', `/api/social-posts?${queryParams}`);
    const data = await response.json();
    return data.posts || [];
  },

  // Get social post by ID
  getSocialPostById: async (postId: number): Promise<SocialPost> => {
    const response = await apiRequest('GET', `/api/social-posts/${postId}`);
    const data = await response.json();
    return data.post;
  },

  // Create social post
  createSocialPost: async (postData: Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<SocialPost> => {
    const response = await apiRequest('POST', '/api/social-posts', postData);
    const data = await response.json();
    return data.post;
  },

  // Update social post
  updateSocialPost: async (postId: number, updates: Partial<SocialPost>): Promise<SocialPost> => {
    const response = await apiRequest('PUT', `/api/social-posts/${postId}`, updates);
    const data = await response.json();
    return data.post;
  },

  // Delete social post
  deleteSocialPost: async (postId: number): Promise<void> => {
    await apiRequest('DELETE', `/api/social-posts/${postId}`);
  },

  // Publish social post
  publishSocialPost: async (postId: number, platform?: string): Promise<SocialPost> => {
    const response = await apiRequest('POST', `/api/social-posts/${postId}/publish`, { platform });
    const data = await response.json();
    return data.post;
  },

  // Schedule social post
  scheduleSocialPost: async (postId: number, scheduledAt: string, platform?: string): Promise<SocialPost> => {
    const response = await apiRequest('POST', `/api/social-posts/${postId}/schedule`, { scheduledAt, platform });
    const data = await response.json();
    return data.post;
  },

  // Get social media analytics
  getSocialMediaAnalytics: async (period: string = '30d') => {
    const response = await apiRequest('GET', `/api/social-posts/analytics/${period}`);
    const data = await response.json();
    return data.analytics;
  }
};

// Social Account API functions
export const socialAccountApi = {
  // Get user's social accounts
  getSocialAccounts: async (): Promise<SocialAccount[]> => {
    const response = await apiRequest('GET', '/api/social-platforms/accounts');
    const data = await response.json();
    return data.accounts || [];
  },

  // Connect social account
  connectSocialAccount: async (accountData: {
    platform: string;
    accountId: string;
    accountName: string;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: string;
  }): Promise<SocialAccount> => {
    const response = await apiRequest('POST', '/api/social-platforms/connect', accountData);
    const data = await response.json();
    return data.account;
  },

  // Disconnect social account
  disconnectSocialAccount: async (accountId: number): Promise<void> => {
    await apiRequest('DELETE', `/api/social-platforms/accounts/${accountId}`);
  },

  // Get auth URL for platform
  getAuthUrl: async (platform: string): Promise<string> => {
    const response = await apiRequest('GET', `/api/social-platforms/auth-url/${platform}`);
    const data = await response.json();
    return data.authUrl;
  },

  // Publish content to platform
  publishContent: async (contentData: {
    content: string;
    mediaUrls?: string[];
    hashtags?: string[];
    platform: string;
    contentType: string;
  }) => {
    const response = await apiRequest('POST', '/api/social-platforms/publish', contentData);
    const data = await response.json();
    return data.result;
  },

  // Schedule content for platform
  scheduleContent: async (scheduleData: {
    content: string;
    mediaUrls?: string[];
    hashtags?: string[];
    scheduledAt: string;
    platform: string;
    contentType: string;
  }) => {
    const response = await apiRequest('POST', '/api/social-platforms/schedule', scheduleData);
    const data = await response.json();
    return data;
  },

  // Get platform analytics
  getPlatformAnalytics: async (platform: string, startDate: string, endDate: string) => {
    const response = await apiRequest('GET',
      `/api/social-platforms/analytics/${platform}?startDate=${startDate}&endDate=${endDate}`
    );
    const data = await response.json();
    return data.analytics;
  }
};

// AI Content API functions
export const aiContentApi = {
  // Get hashtag suggestions
  getHashtagSuggestions: async (platform: string, category?: string, limit: number = 10): Promise<HashtagSuggestion[]> => {
    const queryParams = new URLSearchParams();
    queryParams.append('platform', platform);
    if (category) queryParams.append('category', category);
    queryParams.append('limit', limit.toString());

    const response = await apiRequest('GET', `/api/social-ai/hashtags?${queryParams}`);
    const data = await response.json();
    return data.suggestions || [];
  },

  // Get AI content suggestions
  getAiContentSuggestions: async (projectId?: number, limit?: number): Promise<AiContentSuggestion[]> => {
    const queryParams = new URLSearchParams();
    if (projectId) queryParams.append('projectId', projectId.toString());
    if (limit) queryParams.append('limit', limit.toString());

    const response = await apiRequest('GET', `/api/social-ai/suggestions?${queryParams}`);
    const data = await response.json();
    return data.suggestions || [];
  },

  // Generate AI content suggestion
  generateAiContentSuggestion: async (params: {
    suggestionType: 'caption' | 'hashtags' | 'best_time' | 'content_idea';
    platform: string;
    context?: any;
    projectId?: number;
  }): Promise<AiContentSuggestion> => {
    const response = await apiRequest('POST', '/api/social-ai/generate', params);
    const data = await response.json();
    return data.suggestion;
  },

  // Create AI content suggestion
  createAiContentSuggestion: async (suggestionData: Omit<AiContentSuggestion, 'id' | 'createdAt'>): Promise<AiContentSuggestion> => {
    const response = await apiRequest('POST', '/api/social-ai/suggestions', suggestionData);
    const data = await response.json();
    return data.suggestion;
  },

  // Delete AI content suggestion
  deleteAiContentSuggestion: async (suggestionId: number): Promise<void> => {
    await apiRequest('DELETE', `/api/social-ai/suggestions/${suggestionId}`);
  },

  // Generate project content
  generateProjectContent: async (params: {
    contentType: string;
    contentTitle: string;
    contentDescription: string;
    channelType: string;
    startDate: string;
    endDate: string;
    targetAudience: string;
    projectTypes: string[];
  }) => {
    const response = await apiRequest('POST', '/api/social-ai/generate-project-content', params);
    const data = await response.json();
    return data;
  },

  // Advanced Calendar Optimization
  optimizeSchedule: async (params: {
    platforms: string[];
    categories: string[];
    duration: number;
    contentFrequency: 'daily' | 'alternate' | 'weekly' | 'custom';
    targetAudience: string;
    timezone?: string;
    preferences?: {
      avoidWeekends?: boolean;
      preferEvenings?: boolean;
      maxPostsPerDay?: number;
    };
  }) => {
    const response = await apiRequest('POST', '/api/advanced-calendar/optimize-schedule', params);
    const data = await response.json();
    return data;
  },

  getPlatformOptimalTimes: async (params: {
    platform: string;
    category: string;
    timezone?: string;
  }) => {
    const response = await apiRequest('POST', '/api/advanced-calendar/platform-optimal-times', params);
    const data = await response.json();
    return data;
  },

  analyzeEngagementPatterns: async (params: {
    historicalData: any[];
  }) => {
    const response = await apiRequest('POST', '/api/advanced-calendar/analyze-engagement', params);
    const data = await response.json();
    return data;
  },

  getCalendarInsights: async () => {
    const response = await apiRequest('GET', '/api/advanced-calendar/insights');
    const data = await response.json();
    return data;
  }
};
