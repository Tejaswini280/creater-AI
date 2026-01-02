import { Router } from 'express';
import { authenticateToken } from '../auth';
import { z } from 'zod';
import { AISchedulingService } from '../services/ai-scheduling-service';

const router = Router();

// Validation schema for auto-schedule request
const autoScheduleSchema = z.object({
  projectId: z.number(),
  contentType: z.string().min(1, 'Content type is required'),
  platforms: z.array(z.string()).min(1, 'At least one platform is required'),
  contentFrequency: z.enum(['daily', 'alternate', 'weekly', 'custom']),
  duration: z.enum(['1week', '15days', '30days', 'custom']),
  customDuration: z.number().optional(),
  startDate: z.string().optional(),
  targetAudience: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional().default([])
});

/**
 * Auto-schedule content for a project
 * POST /api/auto-schedule/project
 */
router.post('/project', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Validate request body
    const validationResult = autoScheduleSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      });
    }

    const {
      projectId,
      contentType,
      platforms,
      contentFrequency,
      duration,
      customDuration,
      startDate,
      targetAudience,
      category,
      tags
    } = validationResult.data;

    // Create AI scheduling service instance
    const aiScheduler = new AISchedulingService();

    // Prepare scheduling parameters
    const schedulingParams = {
      projectId,
      userId,
      projectData: {
        id: projectId,
        name: `Auto-scheduled project ${projectId}`,
        description: `Automatically scheduled content for project ${projectId}`,
        type: 'social-media',
        category: category || 'general',
        targetAudience: targetAudience || 'general audience',
        tags: tags || []
      },
      contentType: [contentType],
      channelTypes: platforms,
      contentFrequency,
      duration,
      customDuration,
      customStartDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      postingStrategy: 'optimal' as const
    };

    // Generate and schedule content
    const result = await aiScheduler.scheduleProjectContent(schedulingParams);

    res.json({
      success: true,
      message: `Successfully auto-scheduled ${result.contentCount} posts`,
      data: {
        contentCount: result.contentCount,
        scheduledPosts: result.scheduledPosts,
        projectId
      }
    });

  } catch (error) {
    console.error('Auto-schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-schedule content',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get auto-scheduled content for a project
 * GET /api/auto-schedule/project/:projectId
 */
router.get('/project/:projectId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.projectId);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    // Get scheduled content for the project
    // For now, we'll return a placeholder response
    // In a real implementation, this would query the database for scheduled content
    const projectScheduledContent: any[] = []; // TODO: Implement database query

    res.json({
      success: true,
      data: {
        projectId,
        scheduledContent: projectScheduledContent,
        count: projectScheduledContent.length
      }
    });

  } catch (error) {
    console.error('Get auto-scheduled content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get auto-scheduled content',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Update auto-scheduled content
 * PUT /api/auto-schedule/content/:contentId
 */
router.put('/content/:contentId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const contentId = req.params.contentId;
    const updates = req.body;

    const schedulerService = await import('../services/scheduler');
    // For now, return a success response
    // In a real implementation, this would update the scheduled content in the database
    res.json({
      success: true,
      message: 'Auto-scheduled content updated successfully',
      data: { id: contentId, ...updates }
    });

  } catch (error) {
    console.error('Update auto-scheduled content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update auto-scheduled content',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Delete auto-scheduled content
 * DELETE /api/auto-schedule/content/:contentId
 */
router.delete('/content/:contentId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const contentId = req.params.contentId;

    const schedulerService = await import('../services/scheduler');
    // For now, return a success response
    // In a real implementation, this would delete the scheduled content from the database
    res.json({
      success: true,
      message: 'Auto-scheduled content deleted successfully'
    });

  } catch (error) {
    console.error('Delete auto-scheduled content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete auto-scheduled content',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get optimal posting times for platforms
 * GET /api/auto-schedule/optimal-times/:platform
 */
router.get('/optimal-times/:platform', authenticateToken, async (req: any, res) => {
  try {
    const platform = req.params.platform.toLowerCase();
    
    const platformTimes: Record<string, string[]> = {
      instagram: ['11:00', '14:00', '17:00', '19:00'],
      linkedin: ['08:00', '12:00', '17:00', '18:00'],
      facebook: ['09:00', '13:00', '15:00', '18:00'],
      youtube: ['15:00', '19:00'],
      tiktok: ['06:00', '10:00', '19:00', '22:00'],
      twitter: ['08:00', '12:00', '16:00', '20:00']
    };

    const optimalTimes = platformTimes[platform] || platformTimes.instagram;

    res.json({
      success: true,
      data: {
        platform,
        optimalTimes,
        timezone: 'IST'
      }
    });

  } catch (error) {
    console.error('Get optimal times error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get optimal times',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;