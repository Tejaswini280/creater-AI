import { Router } from 'express';
import { authenticateToken } from '../auth';
import { storage } from '../storage';
import { aiProjectManager } from '../services/ai-project-manager';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createAiProjectSchema = z.object({
  title: z.string().min(1, 'Project title is required'),
  description: z.string().optional(),
  projectType: z.string().min(1, 'Project type is required'),
  duration: z.number().min(1).max(365),
  customDuration: z.number().min(1).max(365).optional(),
  targetChannels: z.array(z.string()).min(1, 'At least one target channel is required'),
  contentFrequency: z.enum(['daily', 'weekly', 'bi-weekly', 'monthly']),
  targetAudience: z.string().optional(),
  brandVoice: z.enum(['professional', 'casual', 'humorous', 'inspirational', 'educational', 'conversational']).optional(),
  contentGoals: z.array(z.string()).optional(),
  // Enhanced fields for multi-select support
  contentCategory: z.array(z.string()).min(1, 'At least one content category is required'),
  contentType: z.array(z.string()).min(1, 'At least one content type is required'),
  channelType: z.array(z.string()).min(1, 'At least one channel type is required'),
  contentTitle: z.string().min(1, 'Content title is required'),
  contentDescription: z.string().optional(),
  tags: z.array(z.string()).optional(),
  aiSettings: z.object({
    creativity: z.number().min(0).max(1).optional(),
    formality: z.number().min(0).max(1).optional(),
    hashtagCount: z.number().min(1).max(30).optional(),
    includeEmojis: z.boolean().optional(),
    includeCallToAction: z.boolean().optional(),
  }).optional(),
  startDate: z.string().optional(),
});

const updateAiProjectSchema = createAiProjectSchema.partial();

const regenerateContentSchema = z.object({
  aiProjectId: z.number().min(1),
  regenerateType: z.enum(['content', 'calendar', 'both']).default('both'),
  newDuration: z.number().min(1).max(365).optional(),
  newFrequency: z.enum(['daily', 'weekly', 'bi-weekly', 'monthly']).optional(),
});

const getOptimalTimesSchema = z.object({
  platforms: z.array(z.string()).min(1),
  category: z.string().min(1),
  timezone: z.string().optional().default('UTC'),
});

/**
 * Create a new AI-driven project
 * POST /api/ai-projects
 */
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Validate request body
    const validationResult = createAiProjectSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      });
    }

    const projectData = validationResult.data;

    // Create the AI project
    const aiProject = await aiProjectManager.createProject({
      ...projectData,
      userId,
      status: 'draft'
    });

    // Generate initial content and calendar
    const { contentItems, calendarEntries } = await aiProjectManager.generateProjectContent({
      aiProjectId: aiProject.id,
      userId,
      projectData
    });

    res.status(201).json({
      success: true,
      message: 'AI project created successfully',
      data: {
        project: aiProject,
        contentItems,
        calendarEntries,
        metadata: {
          totalContent: contentItems.length,
          totalCalendarEntries: calendarEntries.length,
          generatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error creating AI project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create AI project',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Get all AI projects for a user
 * GET /api/ai-projects
 */
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 20, offset = 0 } = req.query;

    const projects = await aiProjectManager.getUserProjects(userId, {
      status: status as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.json({
      success: true,
      data: projects,
      metadata: {
        total: projects.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });

  } catch (error) {
    console.error('Error fetching AI projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI projects',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Get a specific AI project with content and calendar
 * GET /api/ai-projects/:id
 */
router.get('/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    const project = await aiProjectManager.getProjectById(projectId, userId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get project content and calendar
    const content = await aiProjectManager.getProjectContent(projectId, userId);
    const calendar = await aiProjectManager.getProjectCalendar(projectId, userId);

    res.json({
      success: true,
      data: {
        project,
        content,
        calendar,
        metadata: {
          totalContent: content.length,
          totalCalendarEntries: calendar.length,
          lastUpdated: project.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Error fetching AI project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI project',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Update an AI project
 * PUT /api/ai-projects/:id
 */
router.put('/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    // Validate request body
    const validationResult = updateAiProjectSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      });
    }

    const updateData = validationResult.data;

    // Check if project exists and user owns it
    const existingProject = await aiProjectManager.getProjectById(projectId, userId);
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Update the project
    const updatedProject = await aiProjectManager.updateProject(projectId, updateData);

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject
    });

  } catch (error) {
    console.error('Error updating AI project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update AI project',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Regenerate content and/or calendar for a project
 * POST /api/ai-projects/:id/regenerate
 */
router.post('/:id/regenerate', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    // Validate request body
    const validationResult = regenerateContentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      });
    }

    const { regenerateType, newDuration, newFrequency } = validationResult.data;

    // Check if project exists and user owns it
    const existingProject = await aiProjectManager.getProjectById(projectId, userId);
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Regenerate content and/or calendar
    const result = await aiProjectManager.regenerateProjectContent({
      projectId,
      userId,
      regenerateType,
      newDuration,
      newFrequency
    });

    res.json({
      success: true,
      message: 'Content regenerated successfully',
      data: result,
      metadata: {
        regenerateType,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error regenerating project content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate project content',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Get optimal posting times for platforms and category
 * POST /api/ai-projects/optimal-times
 */
router.post('/optimal-times', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Validate request body
    const validationResult = getOptimalTimesSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      });
    }

    const { platforms, category, timezone } = validationResult.data;

    // Get optimal posting times
    const optimalTimes = await aiProjectManager.getOptimalPostingTimes({
      platforms,
      category,
      timezone
    });

    res.json({
      success: true,
      data: optimalTimes,
      metadata: {
        platforms,
        category,
        timezone,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting optimal posting times:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get optimal posting times',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Delete an AI project
 * DELETE /api/ai-projects/:id
 */
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    // Check if project exists and user owns it
    const existingProject = await aiProjectManager.getProjectById(projectId, userId);
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Delete the project (this will cascade delete content and calendar)
    await aiProjectManager.deleteProject(projectId, userId);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting AI project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete AI project',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Get project analytics and insights
 * GET /api/ai-projects/:id/analytics
 */
router.get('/:id/analytics', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    // Check if project exists and user owns it
    const existingProject = await aiProjectManager.getProjectById(projectId, userId);
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get project analytics
    const analytics = await aiProjectManager.getProjectAnalytics(projectId, userId);

    res.json({
      success: true,
      data: analytics,
      metadata: {
        projectId,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting project analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get project analytics',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Update project content status
 * PUT /api/ai-projects/:id/content/:contentId
 */
router.put('/:id/content/:contentId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.id);
    const contentId = parseInt(req.params.contentId);

    if (isNaN(projectId) || isNaN(contentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project or content ID'
      });
    }

    // Check if project exists and user owns it
    const existingProject = await aiProjectManager.getProjectById(projectId, userId);
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const { status, title, description, hashtags, scheduledDate } = req.body;

    // Update content item
    const { db } = await import('../db');
    const { aiGeneratedContent } = await import('@shared/schema');
    const { eq, and } = await import('drizzle-orm');

    const updateData: any = {};
    if (status) updateData.status = status;
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (hashtags) updateData.hashtags = hashtags;
    if (scheduledDate) updateData.scheduledDate = new Date(scheduledDate);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const [updatedContent] = await db
      .update(aiGeneratedContent)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(and(
        eq(aiGeneratedContent.id, contentId),
        eq(aiGeneratedContent.aiProjectId, projectId),
        eq(aiGeneratedContent.userId, userId)
      ))
      .returning();

    if (!updatedContent) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      message: 'Content updated successfully',
      data: updatedContent
    });

  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update content',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Delete project content
 * DELETE /api/ai-projects/:id/content/:contentId
 */
router.delete('/:id/content/:contentId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.id);
    const contentId = parseInt(req.params.contentId);

    if (isNaN(projectId) || isNaN(contentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project or content ID'
      });
    }

    // Check if project exists and user owns it
    const existingProject = await aiProjectManager.getProjectById(projectId, userId);
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const { db } = await import('../db');
    const { aiGeneratedContent } = await import('@shared/schema');
    const { eq, and } = await import('drizzle-orm');

    const [deletedContent] = await db
      .delete(aiGeneratedContent)
      .where(and(
        eq(aiGeneratedContent.id, contentId),
        eq(aiGeneratedContent.aiProjectId, projectId),
        eq(aiGeneratedContent.userId, userId)
      ))
      .returning();

    if (!deletedContent) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete content',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Update calendar entry
 * PUT /api/ai-projects/:id/calendar/:calendarId
 */
router.put('/:id/calendar/:calendarId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.id);
    const calendarId = parseInt(req.params.calendarId);

    if (isNaN(projectId) || isNaN(calendarId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project or calendar ID'
      });
    }

    // Check if project exists and user owns it
    const existingProject = await aiProjectManager.getProjectById(projectId, userId);
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const { status, scheduledDate, scheduledTime } = req.body;

    // Update calendar entry
    const { db } = await import('../db');
    const { aiContentCalendar } = await import('@shared/schema');
    const { eq, and } = await import('drizzle-orm');

    const updateData: any = {};
    if (status) updateData.status = status;
    if (scheduledDate) updateData.scheduledDate = new Date(scheduledDate);
    if (scheduledTime) updateData.scheduledTime = scheduledTime;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const [updatedCalendar] = await db
      .update(aiContentCalendar)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(and(
        eq(aiContentCalendar.id, calendarId),
        eq(aiContentCalendar.aiProjectId, projectId),
        eq(aiContentCalendar.userId, userId)
      ))
      .returning();

    if (!updatedCalendar) {
      return res.status(404).json({
        success: false,
        message: 'Calendar entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Calendar entry updated successfully',
      data: updatedCalendar
    });

  } catch (error) {
    console.error('Error updating calendar entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update calendar entry',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Extend project with additional days
 * POST /api/ai-projects/:id/extend
 */
router.post('/:id/extend', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.id);
    const { additionalDays = 7 } = req.body;

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    if (additionalDays < 1 || additionalDays > 30) {
      return res.status(400).json({
        success: false,
        message: 'Additional days must be between 1 and 30'
      });
    }

    // Check if project exists and user owns it
    const existingProject = await aiProjectManager.getProjectById(projectId, userId);
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Extend the project
    const result = await aiProjectManager.extendProject({
      projectId,
      userId,
      additionalDays
    });

    res.json({
      success: true,
      message: 'Project extended successfully',
      data: result,
      metadata: {
        additionalDays,
        extendedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error extending project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extend project',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Quick project actions (start, pause, stop, resume)
 * POST /api/ai-projects/:id/action
 */
router.post('/:id/action', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.id);
    const { action } = req.body;

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    if (!['start', 'pause', 'stop', 'resume'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be one of: start, pause, stop, resume'
      });
    }

    // Check if project exists and user owns it
    const existingProject = await aiProjectManager.getProjectById(projectId, userId);
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Determine new status based on action
    let newStatus = existingProject.status;
    switch (action) {
      case 'start':
        newStatus = 'active';
        break;
      case 'pause':
        newStatus = 'paused';
        break;
      case 'stop':
        newStatus = 'stopped';
        break;
      case 'resume':
        newStatus = 'active';
        break;
    }

    // Update project status
    const updatedProject = await aiProjectManager.updateProject(projectId, { status: newStatus });

    res.json({
      success: true,
      message: `Project ${action}ed successfully`,
      data: updatedProject
    });

  } catch (error) {
    console.error('Error performing project action:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform project action',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

export default router;
