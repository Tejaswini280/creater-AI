import { Router } from 'express';
import { authenticateToken } from '../auth';
import { aiProjectManager } from '../services/ai-project-manager';
import { z } from 'zod';

const router = Router();

// Validation schema for bulk content generation
const bulkGenerationSchema = z.object({
  projectId: z.number().optional(),
  contentTitle: z.string().min(1, 'Content title is required'),
  contentType: z.string().min(1, 'Content type is required'),
  platform: z.string().min(1, 'Platform is required'),
  schedulingDuration: z.enum(['1week', '15days', '30days']),
  startDate: z.string().min(1, 'Start date is required'),
  targetAudience: z.string().optional().default('general audience'),
  tone: z.string().optional().default('engaging')
});

/**
 * Bulk generate and schedule content for a project
 * POST /api/content/bulk-generate-schedule
 */
router.post('/bulk-generate-schedule', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Validate request body
    const validationResult = bulkGenerationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      });
    }

    const {
      projectId,
      contentTitle,
      contentType,
      platform,
      schedulingDuration,
      startDate,
      targetAudience,
      tone
    } = validationResult.data;

    // Calculate duration in days
    const durationDays = schedulingDuration === '1week' ? 7 :
                        schedulingDuration === '15days' ? 15 : 30;

    // Create AI project data
    const projectData = {
      title: contentTitle,
      description: `AI-generated content series for ${contentTitle}`,
      projectType: contentType,
      duration: durationDays,
      targetChannels: [platform],
      contentFrequency: 'daily',
      targetAudience,
      brandVoice: tone,
      contentGoals: ['engagement', 'awareness'],
      contentCategory: [contentType],
      contentType: [contentType],
      channelType: [platform],
      contentTitle,
      contentDescription: `${durationDays}-day content series for ${contentTitle}`,
      tags: [contentType, platform, 'ai-generated'],
      aiSettings: {
        creativity: 0.8,
        formality: 0.6,
        hashtagCount: 5,
        includeEmojis: true,
        includeCallToAction: true
      },
      userId,
      status: 'active',
      startDate
    };

    let aiProject;
    
    // Create or use existing project
    if (projectId) {
      aiProject = await aiProjectManager.getProjectById(projectId, userId);
      if (!aiProject) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }
    } else {
      // Create new AI project
      aiProject = await aiProjectManager.createProject(projectData);
    }

    // Generate content and calendar
    const result = await aiProjectManager.generateProjectContent({
      aiProjectId: aiProject.id,
      userId,
      projectData
    });

    // Get project analytics
    const analytics = await aiProjectManager.getProjectAnalytics(aiProject.id, userId);

    res.json({
      success: true,
      message: 'Bulk content generated and scheduled successfully',
      data: {
        project: aiProject,
        totalItems: result.contentItems.length + result.calendarEntries.length,
        generatedContent: result.contentItems,
        scheduledContent: result.calendarEntries,
        analytics,
        metadata: {
          duration: durationDays,
          platform,
          contentType,
          generatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Bulk content generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate bulk content',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Generate content series for duration-based planning
 * POST /api/content/generate-duration
 */
router.post('/generate-duration', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const {
      topic,
      duration,
      platform,
      contentType,
      tone,
      targetAudience,
      startDate,
      timeDistribution
    } = req.body;

    if (!topic || !duration || !platform) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: topic, duration, platform'
      });
    }

    // Create project data for series generation
    const projectData = {
      title: topic,
      description: `${duration}-day content series for ${topic}`,
      projectType: contentType || 'general',
      duration: parseInt(duration),
      targetChannels: [platform],
      contentFrequency: 'daily',
      targetAudience: targetAudience || 'general audience',
      brandVoice: tone || 'engaging',
      contentGoals: ['engagement', 'growth'],
      contentCategory: [contentType || 'general'],
      contentType: [contentType || 'post'],
      channelType: [platform],
      contentTitle: topic,
      contentDescription: `${duration}-day content series`,
      tags: [contentType || 'general', platform, 'series'],
      aiSettings: {
        creativity: 0.8,
        formality: tone === 'professional' ? 0.8 : 0.5,
        hashtagCount: 5,
        includeEmojis: true,
        includeCallToAction: true
      },
      userId,
      status: 'active',
      startDate: startDate || new Date().toISOString()
    };

    // Create AI project
    const aiProject = await aiProjectManager.createProject(projectData);

    // Generate content series
    const result = await aiProjectManager.generateProjectContent({
      aiProjectId: aiProject.id,
      userId,
      projectData
    });

    res.json({
      success: true,
      message: 'Content series generated successfully',
      data: {
        project: aiProject,
        generatedContent: result.contentItems,
        calendarEntries: result.calendarEntries,
        summary: {
          totalDays: parseInt(duration),
          totalContent: result.contentItems.length,
          platform,
          contentType: contentType || 'general'
        }
      }
    });

  } catch (error) {
    console.error('Series generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate content series',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Preview content series before generation
 * POST /api/content/preview-duration
 */
router.post('/preview-duration', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const {
      topic,
      duration,
      platform,
      contentType,
      tone,
      targetAudience,
      startDate
    } = req.body;

    if (!topic || !duration || !platform) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: topic, duration, platform'
      });
    }

    // Generate preview data (simplified version)
    const durationDays = parseInt(duration);
    const preview = [];

    for (let i = 1; i <= Math.min(durationDays, 5); i++) {
      const date = new Date(startDate || new Date());
      date.setDate(date.getDate() + (i - 1));

      preview.push({
        day: i,
        date: date.toISOString().split('T')[0],
        title: `${topic} - Day ${i}`,
        contentType: contentType || 'post',
        platform,
        description: `Engaging ${contentType || 'post'} content for day ${i} of your ${topic} series`,
        estimatedEngagement: Math.floor(Math.random() * 500) + 200
      });
    }

    res.json({
      success: true,
      data: {
        preview,
        summary: {
          totalDays: durationDays,
          platform,
          contentType: contentType || 'post',
          estimatedTotalEngagement: preview.reduce((sum, item) => sum + item.estimatedEngagement, 0)
        }
      }
    });

  } catch (error) {
    console.error('Preview generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate preview',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Schedule series content
 * POST /api/content/schedule-series
 */
router.post('/schedule-series', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { contentIds } = req.body;

    if (!contentIds || !Array.isArray(contentIds)) {
      return res.status(400).json({
        success: false,
        message: 'Content IDs array is required'
      });
    }

    // Update content status to scheduled
    const { db } = await import('../db');
    const { aiGeneratedContent } = await import('@shared/schema');
    const { eq, and, inArray } = await import('drizzle-orm');

    const scheduledItems = await db
      .update(aiGeneratedContent)
      .set({
        status: 'scheduled',
        updatedAt: new Date()
      })
      .where(and(
        inArray(aiGeneratedContent.id, contentIds),
        eq(aiGeneratedContent.userId, userId),
        eq(aiGeneratedContent.status, 'draft')
      ))
      .returning();

    res.json({
      success: true,
      message: `Successfully scheduled ${scheduledItems.length} content items`,
      scheduledItems
    });

  } catch (error) {
    console.error('Schedule series error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule series content',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Get series content for a user
 * GET /api/content/series
 */
router.get('/series', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const { db } = await import('../db');
    const { aiGeneratedContent } = await import('@shared/schema');
    const { eq, desc } = await import('drizzle-orm');

    const seriesContent = await db
      .select()
      .from(aiGeneratedContent)
      .where(eq(aiGeneratedContent.userId, userId))
      .orderBy(desc(aiGeneratedContent.createdAt))
      .limit(50);

    res.json({
      success: true,
      seriesContent
    });

  } catch (error) {
    console.error('Get series content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get series content',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Test endpoint for debugging
 * POST /api/test/bulk-endpoint
 */
router.post('/test/bulk-endpoint', async (req, res) => {
  res.json({
    success: true,
    message: 'Bulk content generation endpoint is working',
    timestamp: new Date().toISOString()
  });
});

export default router;