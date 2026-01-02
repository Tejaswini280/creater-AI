import { Router } from 'express';
import { authenticateToken } from '../auth';
import { socialMediaIntegrations } from '../services/social-media-integrations';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

// Validation schemas
const postContentSchema = z.object({
  contentId: z.string().min(1),
  platform: z.string().min(1),
  scheduledDate: z.string().datetime().optional(),
  publishNow: z.boolean().default(false)
});

const validateCredentialsSchema = z.object({
  platform: z.string().min(1),
  accessToken: z.string().min(1),
  accountId: z.string().min(1),
  accountName: z.string().min(1)
});

const getAnalyticsSchema = z.object({
  platform: z.string().min(1),
  postId: z.string().optional(),
  dateRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime()
  }).optional()
});

const optimizeContentSchema = z.object({
  content: z.string().min(1),
  platform: z.string().min(1),
  metadata: z.record(z.any()).optional()
});

/**
 * Post content to social media platform
 * POST /api/social-media/post
 */
router.post('/post', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Validate request body
    const validationResult = postContentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      });
    }

    const { contentId, platform, scheduledDate, publishNow } = validationResult.data;

    // Get content from database
    const content = await storage.getContentById(parseInt(contentId));
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Get platform credentials
    const socialAccount = await storage.getSocialAccountByPlatform(userId, platform);
    if (!socialAccount) {
      return res.status(404).json({
        success: false,
        message: `No ${platform} account connected. Please connect your account first.`
      });
    }

    // Prepare post data
    const postData = {
      id: contentId,
      content: content.description || content.title,
      platform: platform,
      scheduledDate: scheduledDate || content.scheduledAt?.toISOString() || new Date().toISOString(),
      mediaUrls: content.videoUrl ? [content.videoUrl] : (content.thumbnailUrl ? [content.thumbnailUrl] : []),
      hashtags: content.tags || [],
      metadata: {
        title: content.title,
        contentType: content.contentType,
        ...content.metadata
      }
    };

    // Get platform credentials
    const credentials = {
      accessToken: socialAccount.accessToken || '',
      refreshToken: socialAccount.refreshToken,
      expiresAt: socialAccount.tokenExpiry,
      accountId: socialAccount.accountId,
      accountName: socialAccount.accountName
    };

    // Validate credentials
    const isValid = await socialMediaIntegrations.validateCredentials(platform, credentials);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired credentials. Please reconnect your account.'
      });
    }

    // Optimize content for platform
    const optimizedContent = await socialMediaIntegrations.optimizeContentForPlatform(
      postData.content,
      platform,
      postData.metadata
    );
    postData.content = optimizedContent;

    // Post to platform
    const result = await socialMediaIntegrations.postToPlatform(postData, credentials);

    if (result.success) {
      // Update content status in database
      await storage.updateContent(parseInt(contentId), {
        status: 'published',
        publishedAt: new Date(),
        metadata: {
          ...content.metadata,
          platformPostId: result.platformPostId,
          platformUrl: result.platformUrl,
          publishedAt: new Date().toISOString()
        }
      });

      res.json({
        success: true,
        message: `Content posted successfully to ${platform}`,
        data: {
          platformPostId: result.platformPostId,
          platformUrl: result.platformUrl,
          platform: platform,
          publishedAt: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Failed to post to ${platform}`,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error posting content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post content',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Validate platform credentials
 * POST /api/social-media/validate-credentials
 */
router.post('/validate-credentials', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Validate request body
    const validationResult = validateCredentialsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      });
    }

    const { platform, accessToken, accountId, accountName } = validationResult.data;

    // Validate credentials
    const credentials = {
      accessToken,
      accountId,
      accountName
    };

    const isValid = await socialMediaIntegrations.validateCredentials(platform, credentials);

    if (isValid) {
      // Save or update social account
      const existingAccount = await storage.getSocialAccountByPlatform(userId, platform);
      
      if (existingAccount) {
        await storage.updateSocialAccount(existingAccount.id, {
          accessToken,
          accountId,
          accountName,
          isActive: true
        });
      } else {
        await storage.createSocialAccount({
          userId,
          platform,
          accountId,
          accountName,
          accessToken,
          isActive: true
        });
      }

      res.json({
        success: true,
        message: `${platform} account connected successfully`
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your access token and try again.'
      });
    }

  } catch (error) {
    console.error('Error validating credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate credentials',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Get platform analytics
 * GET /api/social-media/analytics
 */
router.get('/analytics', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { platform, postId, startDate, endDate } = req.query;

    if (!platform) {
      return res.status(400).json({
        success: false,
        message: 'Platform is required'
      });
    }

    // Get platform credentials
    const socialAccount = await storage.getSocialAccountByPlatform(userId, platform);
    if (!socialAccount) {
      return res.status(404).json({
        success: false,
        message: `No ${platform} account connected`
      });
    }

    const credentials = {
      accessToken: socialAccount.accessToken || '',
      refreshToken: socialAccount.refreshToken,
      expiresAt: socialAccount.tokenExpiry,
      accountId: socialAccount.accountId,
      accountName: socialAccount.accountName
    };

    // Get analytics
    const analytics = await socialMediaIntegrations.getPlatformAnalytics(
      platform,
      credentials,
      postId as string
    );

    res.json({
      success: true,
      data: analytics
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
 * Get platform requirements
 * GET /api/social-media/requirements/:platform
 */
router.get('/requirements/:platform', authenticateToken, async (req: any, res) => {
  try {
    const { platform } = req.params;

    const requirements = socialMediaIntegrations.getPlatformRequirements(platform);

    if (!requirements) {
      return res.status(404).json({
        success: false,
        message: 'Platform not supported'
      });
    }

    res.json({
      success: true,
      data: {
        platform,
        requirements
      }
    });

  } catch (error) {
    console.error('Error getting platform requirements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get platform requirements',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Optimize content for platform
 * POST /api/social-media/optimize-content
 */
router.post('/optimize-content', authenticateToken, async (req: any, res) => {
  try {
    // Validate request body
    const validationResult = optimizeContentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      });
    }

    const { content, platform, metadata } = validationResult.data;

    // Optimize content
    const optimizedContent = await socialMediaIntegrations.optimizeContentForPlatform(
      content,
      platform,
      metadata
    );

    res.json({
      success: true,
      data: {
        originalContent: content,
        optimizedContent,
        platform,
        optimizedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error optimizing content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize content',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Get connected social accounts
 * GET /api/social-media/accounts
 */
router.get('/accounts', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const accounts = await storage.getSocialAccountsByUserId(userId);

    res.json({
      success: true,
      data: accounts.map(account => ({
        id: account.id,
        platform: account.platform,
        accountName: account.accountName,
        isActive: account.isActive,
        connectedAt: account.createdAt
      }))
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
 * Disconnect social account
 * DELETE /api/social-media/accounts/:id
 */
router.delete('/accounts/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const accountId = parseInt(req.params.id);

    if (isNaN(accountId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account ID'
      });
    }

    // Get account to verify ownership
    const account = await storage.getSocialAccountById(accountId);
    if (!account || account.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Deactivate account instead of deleting
    await storage.updateSocialAccount(accountId, {
      isActive: false
    });

    res.json({
      success: true,
      message: 'Account disconnected successfully'
    });

  } catch (error) {
    console.error('Error disconnecting account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect account',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Test platform connection
 * POST /api/social-media/test-connection
 */
router.post('/test-connection', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { platform } = req.body;

    if (!platform) {
      return res.status(400).json({
        success: false,
        message: 'Platform is required'
      });
    }

    // Get platform credentials
    const socialAccount = await storage.getSocialAccountByPlatform(userId, platform);
    if (!socialAccount) {
      return res.status(404).json({
        success: false,
        message: `No ${platform} account connected`
      });
    }

    const credentials = {
      accessToken: socialAccount.accessToken || '',
      refreshToken: socialAccount.refreshToken,
      expiresAt: socialAccount.tokenExpiry,
      accountId: socialAccount.accountId,
      accountName: socialAccount.accountName
    };

    // Test connection
    const isValid = await socialMediaIntegrations.validateCredentials(platform, credentials);

    res.json({
      success: true,
      data: {
        platform,
        connected: isValid,
        accountName: socialAccount.accountName,
        lastChecked: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test connection',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

export default router;
