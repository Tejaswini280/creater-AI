import { Router } from 'express';
import { authenticateToken } from '../auth';
import { enhancedProjectCreationService } from '../services/enhanced-project-creation';
import { z } from 'zod';

const router = Router();

// Validation schemas
const projectBasicsSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters').max(255),
  description: z.string().optional(),
  contentType: z.string().min(1, 'Content type is required'),
  channelTypes: z.array(z.string()).min(1, 'At least one channel is required'),
  category: z.string().min(1, 'Category is required'),
  duration: z.enum(['1week', '15days', '30days', 'custom']),
  customDuration: z.number().min(1).max(365).optional(),
  contentFrequency: z.enum(['daily', 'alternate', 'weekly', 'custom']),
  calendarPreference: z.enum(['ai-generated', 'custom']),
  aiEnhancement: z.boolean().default(true),
  targetAudience: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  notificationsEnabled: z.boolean().default(true),
  status: z.enum(['draft', 'active', 'inactive']).default('draft')
});

const contentCreationSchema = z.object({
  title: z.string().min(1, 'Content title is required'),
  caption: z.string().optional().default(''),
  contentType: z.string().min(1, 'Content type is required'),
  hashtags: z.array(z.string()).default([]),
  emojis: z.array(z.string()).default([]),
  media: z.array(z.any()).default([]),
  platforms: z.array(z.any()).default([]),
  isScheduled: z.boolean().default(false),
  scheduledAt: z.string().optional(),
  status: z.string().default('draft')
});

const enhancedProjectSchema = z.object({
  projectBasics: projectBasicsSchema,
  contentCreation: contentCreationSchema,
  schedulingOptions: z.object({
    startDate: z.string().optional(),
    duration: z.string().optional(),
    bulkGeneration: z.boolean().default(false)
  }).optional()
});

/**
 * Save project basics (Step 1 of 2)
 * POST /api/enhanced-projects/save-basics
 */
router.post('/save-basics', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const validationResult = projectBasicsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project basics data',
        errors: validationResult.error.errors
      });
    }

    const projectBasics = validationResult.data;
    const savedBasics = await enhancedProjectCreationService.saveProjectBasics(userId, projectBasics);

    res.json({
      success: true,
      message: 'Project basics saved successfully',
      data: savedBasics
    });

  } catch (error) {
    console.error('Save project basics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save project basics',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Save content creation (Step 2 of 2)
 * POST /api/enhanced-projects/save-content
 */
router.post('/save-content', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const validationResult = contentCreationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content creation data',
        errors: validationResult.error.errors
      });
    }

    const contentCreation = validationResult.data;
    const savedContent = await enhancedProjectCreationService.saveContentCreation(userId, contentCreation);

    res.json({
      success: true,
      message: 'Content creation saved successfully',
      data: savedContent
    });

  } catch (error) {
    console.error('Save content creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save content creation',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Create complete enhanced project
 * POST /api/enhanced-projects/create
 */
router.post('/create', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const validationResult = enhancedProjectSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project data',
        errors: validationResult.error.errors
      });
    }

    const { projectBasics, contentCreation, schedulingOptions } = validationResult.data;

    // Convert scheduledAt string to Date if provided
    const processedContentCreation = {
      ...contentCreation,
      scheduledAt: contentCreation.scheduledAt ? new Date(contentCreation.scheduledAt) : undefined
    };

    const processedSchedulingOptions = schedulingOptions ? {
      ...schedulingOptions,
      startDate: schedulingOptions.startDate ? new Date(schedulingOptions.startDate) : undefined
    } : undefined;

    const result = await enhancedProjectCreationService.createEnhancedProject({
      userId,
      projectBasics,
      contentCreation: processedContentCreation,
      schedulingOptions: processedSchedulingOptions
    });

    res.status(201).json({
      success: true,
      message: 'Enhanced project created successfully',
      data: result
    });

  } catch (error) {
    console.error('Create enhanced project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create enhanced project',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Get project insights and analytics
 * GET /api/enhanced-projects/:id/insights
 */
router.get('/:id/insights', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    const insights = await enhancedProjectCreationService.getProjectInsights(projectId, userId);

    res.json({
      success: true,
      data: insights
    });

  } catch (error) {
    console.error('Get project insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get project insights',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Update enhanced project
 * PUT /api/enhanced-projects/:id
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

    const updates = req.body;
    const updatedProject = await enhancedProjectCreationService.updateEnhancedProject({
      projectId,
      userId,
      updates
    });

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject
    });

  } catch (error) {
    console.error('Update enhanced project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Delete enhanced project
 * DELETE /api/enhanced-projects/:id
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

    await enhancedProjectCreationService.deleteEnhancedProject(projectId, userId);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete enhanced project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Validate project data
 * POST /api/enhanced-projects/validate
 */
router.post('/validate', authenticateToken, async (req: any, res) => {
  try {
    const { step, data } = req.body;

    let validationResult;
    
    if (step === 'basics') {
      validationResult = projectBasicsSchema.safeParse(data);
    } else if (step === 'content') {
      validationResult = contentCreationSchema.safeParse(data);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid validation step'
      });
    }

    if (validationResult.success) {
      res.json({
        success: true,
        message: 'Validation passed',
        data: validationResult.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors
      });
    }

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Validation failed',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

export default router;