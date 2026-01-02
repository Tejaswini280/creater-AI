import { Router } from 'express';
import { authenticateToken } from '../auth';
import { storage } from '../storage';
import { z } from 'zod';

// Validation schemas
const createSocialPostSchema = z.object({
  title: z.string().min(1).max(255),
  caption: z.string().optional(),
  hashtags: z.array(z.string()).optional().default([]),
  emojis: z.array(z.string()).optional().default([]),
  contentType: z.enum(['post', 'reel', 'short', 'story', 'video']),
  status: z.enum(['draft', 'scheduled', 'published', 'failed']).optional().default('draft'),
  scheduledAt: z.string().datetime().optional(),
  publishedAt: z.string().datetime().optional(),
  thumbnailUrl: z.string().optional(),
  mediaUrls: z.array(z.string()).optional().default([]),
  aiGenerated: z.boolean().optional().default(false),
  projectId: z.number().optional(),
  metadata: z.record(z.any()).optional().default({})
});

const updateSocialPostSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  caption: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  emojis: z.array(z.string()).optional(),
  contentType: z.enum(['post', 'reel', 'short', 'story', 'video']).optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'failed']).optional(),
  scheduledAt: z.string().datetime().optional(),
  publishedAt: z.string().datetime().optional(),
  thumbnailUrl: z.string().optional(),
  mediaUrls: z.array(z.string()).optional(),
  aiGenerated: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
});

const socialPostsFiltersSchema = z.object({
  status: z.string().optional(),
  platform: z.string().optional(),
  projectId: z.number().optional(),
  limit: z.number().positive().optional(),
  offset: z.number().nonnegative().optional().default(0)
});

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * Create a new social post
 * POST /api/social-posts
 */
router.post('/', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const postData = createSocialPostSchema.parse(req.body);

    const socialPost = await storage.createSocialPost({
      ...postData,
      userId
    });

    res.status(201).json({
      success: true,
      message: 'Social post created successfully',
      post: socialPost
    });
  } catch (error) {
    console.error('Error creating social post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create social post',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Get user's social posts
 * GET /api/social-posts
 */
router.get('/', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const filters = socialPostsFiltersSchema.parse(req.query);

    const posts = await storage.getSocialPosts(userId, filters.limit, {
      status: filters.status,
      platform: filters.platform,
      projectId: filters.projectId
    });

    res.json({
      success: true,
      posts,
      total: posts.length
    });
  } catch (error) {
    console.error('Error getting social posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get social posts',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Get social post by ID
 * GET /api/social-posts/:id
 */
router.get('/:id', async (req: any, res) => {
  try {
    const postId = parseInt(req.params.id);

    const post = await storage.getSocialPostById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Social post not found'
      });
    }

    // Check if user owns this post
    if (post.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get related data
    const media = await storage.getPostMedia(postId);
    const schedules = await storage.getPostSchedules(postId);

    res.json({
      success: true,
      post: {
        ...post,
        media,
        schedules
      }
    });
  } catch (error) {
    console.error('Error getting social post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get social post',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Update social post
 * PUT /api/social-posts/:id
 */
router.put('/:id', async (req: any, res) => {
  try {
    const postId = parseInt(req.params.id);
    const updateData = updateSocialPostSchema.parse(req.body);

    const existingPost = await storage.getSocialPostById(postId);
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Social post not found'
      });
    }

    // Check if user owns this post
    if (existingPost.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updatedPost = await storage.updateSocialPost(postId, updateData);

    res.json({
      success: true,
      message: 'Social post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    console.error('Error updating social post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update social post',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Delete social post
 * DELETE /api/social-posts/:id
 */
router.delete('/:id', async (req: any, res) => {
  try {
    const postId = parseInt(req.params.id);

    const existingPost = await storage.getSocialPostById(postId);
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Social post not found'
      });
    }

    // Check if user owns this post
    if (existingPost.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await storage.deleteSocialPost(postId);

    res.json({
      success: true,
      message: 'Social post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting social post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete social post',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Publish social post now
 * POST /api/social-posts/:id/publish
 */
router.post('/:id/publish', async (req: any, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { platform } = req.body;

    const existingPost = await storage.getSocialPostById(postId);
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Social post not found'
      });
    }

    // Check if user owns this post
    if (existingPost.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update post status to published
    const updatedPost = await storage.updateSocialPost(postId, {
      status: 'published',
      publishedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Social post published successfully',
      post: updatedPost
    });
  } catch (error) {
    console.error('Error publishing social post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish social post',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Schedule social post
 * POST /api/social-posts/:id/schedule
 */
router.post('/:id/schedule', async (req: any, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { scheduledAt, platform } = req.body;

    const existingPost = await storage.getSocialPostById(postId);
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Social post not found'
      });
    }

    // Check if user owns this post
    if (existingPost.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update post with schedule information
    const updatedPost = await storage.updateSocialPost(postId, {
      status: 'scheduled',
      scheduledAt: new Date(scheduledAt).toISOString()
    });

    res.json({
      success: true,
      message: 'Social post scheduled successfully',
      post: updatedPost
    });
  } catch (error) {
    console.error('Error scheduling social post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule social post',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Get social media analytics
 * GET /api/social-posts/analytics
 */
router.get('/analytics/:period', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const period = req.params.period || '30d';

    const analytics = await storage.getSocialMediaAnalytics(userId, period);

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Error getting social media analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get social media analytics',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

export default router;
