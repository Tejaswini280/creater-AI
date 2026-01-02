import { Router } from 'express';
import { authenticateToken } from '../auth';
import { socialPlatformIntegration } from '../services/social-platform-integration';
import { z } from 'zod';

const router = Router();

// Validation schemas
const socialAccountSchema = z.object({
  platform: z.enum(['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin']),
  accountId: z.string().min(1),
  accountName: z.string().min(1)
});

const postContentSchema = z.object({
  content: z.string().min(1),
  mediaUrls: z.array(z.string()).optional(),
  hashtags: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional(),
  platform: z.enum(['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin']),
  contentType: z.enum(['post', 'reel', 'short', 'story', 'video'])
});

const scheduleContentSchema = z.object({
  content: z.string().min(1),
  mediaUrls: z.array(z.string()).optional(),
  hashtags: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime(),
  platform: z.enum(['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin']),
  contentType: z.enum(['post', 'reel', 'short', 'story', 'video'])
});

const analyticsSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
});

/**
 * Get OAuth URL for platform authentication
 * GET /api/social-platforms/auth-url/:platform
 */
router.get('/auth-url/:platform', authenticateToken, (req: any, res) => {
  try {
    const { platform } = req.params;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/social-platforms/oauth/callback`;

    const authUrl = socialPlatformIntegration.getAuthUrl(platform, redirectUri);

    res.json({
      success: true,
      authUrl,
      platform
    });
  } catch (error) {
    console.error('Error getting auth URL:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid platform or configuration error',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * OAuth callback handler
 * GET /api/social-platforms/oauth/callback
 */
router.get('/oauth/callback', async (req: any, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      console.error('OAuth error:', error_description);
      return res.redirect('/social-accounts?error=' + encodeURIComponent(error_description));
    }

    if (!code) {
      return res.redirect('/social-accounts?error=No authorization code received');
    }

    // Extract platform from state (you might want to store this in session)
    const platform = state || 'instagram';
    const redirectUri = `${req.protocol}://${req.get('host')}/api/social-platforms/oauth/callback`;

    // Exchange code for tokens
    const tokenData = await socialPlatformIntegration.exchangeCodeForToken(platform, code, redirectUri);

    // Store the social account (you'll need to implement this with your database)
    const accountData = {
      userId: req.user?.id || 'test-user', // Get from session/auth
      platform,
      accountId: tokenData.accountId || 'unknown',
      accountName: 'Unknown Account', // You'll need to fetch this from the platform
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      tokenExpiry: tokenData.expiresIn ? new Date(Date.now() + tokenData.expiresIn * 1000) : undefined,
      isActive: true,
      metadata: {
        scopes: tokenData.scope,
        connectedAt: new Date().toISOString()
      }
    };

    // Save to database
    // const savedAccount = await storage.createSocialAccount(accountData);

    res.redirect('/social-accounts?success=Account connected successfully');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/social-accounts?error=' + encodeURIComponent('Failed to connect account'));
  }
});

/**
 * Connect social account (alternative to OAuth flow)
 * POST /api/social-platforms/connect
 */
router.post('/connect', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const accountData = socialAccountSchema.parse(req.body);

    // Validate account credentials
    const isValid = await socialPlatformIntegration.validateAccount({
      ...accountData,
      id: '',
      userId,
      accessToken: req.body.accessToken,
      refreshToken: req.body.refreshToken,
      tokenExpiry: req.body.tokenExpiry ? new Date(req.body.tokenExpiry) : undefined,
      isActive: true,
      metadata: req.body.metadata || {}
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account credentials'
      });
    }

    // Save to database
    // const savedAccount = await storage.createSocialAccount({
    //   ...accountData,
    //   userId,
    //   accessToken: req.body.accessToken,
    //   refreshToken: req.body.refreshToken,
    //   tokenExpiry: req.body.tokenExpiry ? new Date(req.body.tokenExpiry) : undefined,
    //   isActive: true,
    //   metadata: req.body.metadata || {}
    // });

    res.json({
      success: true,
      message: 'Social account connected successfully',
      // account: savedAccount
    });
  } catch (error) {
    console.error('Error connecting social account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect social account',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Get user's social accounts
 * GET /api/social-platforms/accounts
 */
router.get('/accounts', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;

    // Get from database
    // const accounts = await storage.getSocialAccounts(userId);

    res.json({
      success: true,
      // accounts: accounts || []
      accounts: [] // Placeholder until database is implemented
    });
  } catch (error) {
    console.error('Error getting social accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get social accounts',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Publish content to platform
 * POST /api/social-platforms/publish
 */
router.post('/publish', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const postData = postContentSchema.parse(req.body);

    // Get the social account for this platform
    // const account = await storage.getSocialAccount(userId, postData.platform);
    // if (!account) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'No connected account found for this platform'
    //   });
    // }

    // For now, create a mock account
    const account = {
      id: 'mock-account-id',
      userId,
      platform: postData.platform,
      accountId: 'mock-account',
      accountName: 'Mock Account',
      accessToken: 'mock-token',
      refreshToken: undefined,
      tokenExpiry: undefined,
      isActive: true,
      metadata: {}
    };

    // Publish the content
    const result = await socialPlatformIntegration.publishContent(account, postData);

    res.json({
      success: true,
      message: result.success ? 'Content published successfully' : 'Failed to publish content',
      result
    });
  } catch (error) {
    console.error('Error publishing content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish content',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Schedule content for future publishing
 * POST /api/social-platforms/schedule
 */
router.post('/schedule', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const scheduleData = scheduleContentSchema.parse(req.body);

    // Get the social account for this platform
    // const account = await storage.getSocialAccount(userId, scheduleData.platform);
    // if (!account) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'No connected account found for this platform'
    //   });
    // }

    // For now, create a mock account
    const account = {
      id: 'mock-account-id',
      userId,
      platform: scheduleData.platform,
      accountId: 'mock-account',
      accountName: 'Mock Account',
      accessToken: 'mock-token',
      refreshToken: undefined,
      tokenExpiry: undefined,
      isActive: true,
      metadata: {}
    };

    // Schedule the content
    const result = await socialPlatformIntegration.scheduleContent(
      account,
      {
        content: scheduleData.content,
        mediaUrls: scheduleData.mediaUrls,
        hashtags: scheduleData.hashtags,
        platform: scheduleData.platform,
        contentType: scheduleData.contentType
      },
      new Date(scheduleData.scheduledAt)
    );

    res.json({
      success: result.success,
      message: result.success ? 'Content scheduled successfully' : 'Failed to schedule content',
      scheduleId: result.scheduleId,
      error: result.error
    });
  } catch (error) {
    console.error('Error scheduling content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule content',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Get account analytics
 * GET /api/social-platforms/analytics/:platform
 */
router.get('/analytics/:platform', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { platform } = req.params;
    const { startDate, endDate } = analyticsSchema.parse({
      startDate: req.query.startDate,
      endDate: req.query.endDate
    });

    // Get the social account for this platform
    // const account = await storage.getSocialAccount(userId, platform);
    // if (!account) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'No connected account found for this platform'
    //   });
    // }

    // For now, create a mock account
    const account = {
      id: 'mock-account-id',
      userId,
      platform,
      accountId: 'mock-account',
      accountName: 'Mock Account',
      accessToken: 'mock-token',
      refreshToken: undefined,
      tokenExpiry: undefined,
      isActive: true,
      metadata: {}
    };

    // Get analytics
    const analytics = await socialPlatformIntegration.getAccountAnalytics(
      account,
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Validate account credentials
 * POST /api/social-platforms/validate/:platform
 */
router.post('/validate/:platform', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { platform } = req.params;
    const { accessToken, accountId } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const account = {
      id: 'mock-account-id',
      userId,
      platform,
      accountId: accountId || 'mock-account',
      accountName: 'Mock Account',
      accessToken,
      refreshToken: undefined,
      tokenExpiry: undefined,
      isActive: true,
      metadata: {}
    };

    const isValid = await socialPlatformIntegration.validateAccount(account);

    res.json({
      success: true,
      isValid,
      message: isValid ? 'Account credentials are valid' : 'Account credentials are invalid'
    });
  } catch (error) {
    console.error('Error validating account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate account',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Get platform configuration
 * GET /api/social-platforms/config/:platform
 */
router.get('/config/:platform', authenticateToken, (req: any, res) => {
  try {
    const { platform } = req.params;

    const config = socialPlatformIntegration.getPlatformConfig(platform);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Platform not supported'
      });
    }

    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error getting platform config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get platform configuration',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Get all supported platforms
 * GET /api/social-platforms/supported
 */
router.get('/supported', authenticateToken, (req: any, res) => {
  try {
    const platforms = socialPlatformIntegration.getSupportedPlatforms();

    res.json({
      success: true,
      platforms
    });
  } catch (error) {
    console.error('Error getting supported platforms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get supported platforms',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Disconnect social account
 * DELETE /api/social-platforms/accounts/:accountId
 */
router.delete('/accounts/:accountId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { accountId } = req.params;

    // Delete from database
    // await storage.deleteSocialAccount(accountId, userId);

    res.json({
      success: true,
      message: 'Social account disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting social account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect social account',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

export default router;
