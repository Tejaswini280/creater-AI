import { Router } from 'express';
import { authenticateToken } from '../auth';
import { projectContentGenerator } from '../services/project-content-generator';
import { z } from 'zod';

const router = Router();

// Schema for project creation with content generation
const createProjectWithContentSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  type: z.string().min(1, 'Project type is required'),
  platform: z.string().optional(),
  targetAudience: z.string().optional(),
  estimatedDuration: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  metadata: z.record(z.any()).optional(),
  contentSettings: z.object({
    totalDays: z.number().min(1).max(365).default(7),
    contentPerDay: z.number().min(1).max(10).default(1),
    platforms: z.array(z.string()).min(1).default(['instagram']),
    contentType: z.string().default('post'),
    startDate: z.string().optional()
  })
});

/**
 * Create a new project with automatically generated content
 * POST /api/projects/create-with-content
 */
router.post('/create-with-content', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Validate request body
    const validationResult = createProjectWithContentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      });
    }

    const { contentSettings, ...projectData } = validationResult.data;

    // Create the project first
    const { db } = await import('../db');
    const { projects } = await import('../../shared/schema');
    
    const [createdProject] = await db.insert(projects).values({
      userId,
      name: projectData.name,
      description: projectData.description,
      type: projectData.type,
      template: null,
      platform: projectData.platform,
      targetAudience: projectData.targetAudience,
      estimatedDuration: projectData.estimatedDuration,
      tags: projectData.tags,
      isPublic: false,
      status: 'active',
      metadata: projectData.metadata
    }).returning();

    // Generate content for the project
    const contentResult = await projectContentGenerator.generateProjectContent({
      projectId: createdProject.id,
      userId,
      projectData: {
        name: projectData.name,
        description: projectData.description,
        type: projectData.type,
        platform: projectData.platform,
        targetAudience: projectData.targetAudience,
        estimatedDuration: projectData.estimatedDuration,
        tags: projectData.tags,
        metadata: projectData.metadata
      },
      contentSettings: {
        ...contentSettings,
        startDate: contentSettings.startDate ? new Date(contentSettings.startDate) : new Date()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Project created with content successfully',
      data: {
        project: createdProject,
        content: contentResult.contentItems,
        metadata: {
          totalContent: contentResult.totalGenerated,
          projectId: createdProject.id,
          generatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error creating project with content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project with content',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Get content for a specific project
 * GET /api/projects/:id/content
 */
router.get('/:id/content', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    const content = await projectContentGenerator.getProjectContent(projectId, userId);

    res.json({
      success: true,
      data: {
        content,
        total: content.length,
        projectId
      }
    });

  } catch (error) {
    console.error('Error fetching project content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project content',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Generate additional content for an existing project
 * POST /api/projects/:id/generate-content
 */
router.post('/:id/generate-content', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    const { totalDays = 7, contentPerDay = 1, platforms = ['instagram'], contentType = 'post' } = req.body;

    // Get project details
    const { db } = await import('../db');
    const { projects } = await import('../../shared/schema');
    const { eq, and } = await import('drizzle-orm');
    
    const [project] = await db.select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Generate additional content
    const contentResult = await projectContentGenerator.generateProjectContent({
      projectId,
      userId,
      projectData: {
        name: project.name,
        description: project.description,
        type: project.type,
        platform: project.platform,
        targetAudience: project.targetAudience,
        estimatedDuration: project.estimatedDuration,
        tags: project.tags,
        metadata: project.metadata
      },
      contentSettings: {
        totalDays,
        contentPerDay,
        platforms,
        contentType,
        startDate: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Additional content generated successfully',
      data: {
        content: contentResult.contentItems,
        metadata: {
          totalContent: contentResult.totalGenerated,
          projectId,
          generatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error generating additional content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate additional content',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

export default router;
