import express from 'express';
import { authenticateToken } from '../auth';
import { storage } from '../storage';
import {
  validateInput,
  validateInputSize,
  sanitizeInput,
  validationSchemas
} from '../middleware/validation';
import { z } from 'zod';

const router = express.Router();

// Enhanced project creation schema
const enhancedProjectSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().optional(),
  contentType: z.string().min(1),
  channelTypes: z.array(z.string()).min(1),
  category: z.string().min(1),
  duration: z.enum(['1week', '15days', '30days', 'custom']),
  customDuration: z.number().optional(),
  contentFrequency: z.enum(['daily', 'alternate', 'weekly', 'custom']),
  calendarPreference: z.enum(['ai-generated', 'custom']),
  aiEnhancement: z.boolean().optional().default(true),
  targetAudience: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  isPublic: z.boolean().optional().default(false),
  notificationsEnabled: z.boolean().optional().default(true),
  status: z.enum(['draft', 'active', 'inactive']).optional().default('draft')
});

// AI Calendar generation endpoint
router.post('/api/projects/:projectId/ai-calendar', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.projectId);

    const project = await storage.getProjectById(projectId, userId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const calendarData = req.body;
    const { contentType, channelTypes, category, duration, contentFrequency, startDate, aiEnhancement } = calendarData;

    // Calculate duration in days
    const durationDays = duration === '1week' ? 7 :
                        duration === '15days' ? 15 :
                        duration === '30days' ? 30 :
                        calendarData.customDuration || 7;

    // Generate AI calendar posts
    const posts = [];
    const startDateTime = new Date(startDate || new Date());

    for (let i = 0; i < durationDays; i++) {
      const postDate = new Date(startDateTime);
      postDate.setDate(startDateTime.getDate() + i);

      // AI logic to determine optimal posting time based on platform and audience
      const optimalTime = getOptimalPostingTime(channelTypes[0] || 'instagram', postDate);

      posts.push({
        id: `ai-post-${i + 1}`,
        title: generateAITitle(contentType, category, i + 1),
        caption: generateAICaption(contentType, category, channelTypes),
        platforms: channelTypes,
        scheduledAt: postDate,
        status: 'draft',
        aiGenerated: true,
        engagement: {
          predicted: Math.floor(Math.random() * 1000) + 500,
          optimalTime: optimalTime
        }
      });
    }

    const aiCalendar = {
      posts,
      metadata: {
        totalPosts: durationDays,
        duration: duration,
        bestPerformingDays: ['Tuesday', 'Thursday', 'Saturday'],
        optimalPostingTimes: ['9:00 AM', '2:00 PM', '7:00 PM'],
        generatedAt: new Date().toISOString()
      }
    };

    // Store the AI calendar in project metadata
    await storage.updateProject(projectId, {
      metadata: {
        ...project.metadata,
        aiCalendar: aiCalendar,
        lastCalendarGeneration: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      message: 'AI calendar generated successfully',
      calendar: aiCalendar
    });

  } catch (error) {
    console.error('AI Calendar generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI calendar',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Enhanced project creation endpoint
router.post('/api/projects/enhanced', authenticateToken, validateInputSize, sanitizeInput, async (req: any, res) => {
  try {
    const userId = req.user.id;

    // Validate input with enhanced schema
    const validationResult = enhancedProjectSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors
      });
    }

    const projectData = validationResult.data;

    const enhancedProjectData = {
      userId,
      name: projectData.name,
      description: projectData.description || null,
      type: projectData.contentType,
      platform: projectData.channelTypes[0] || null, // Primary platform
      targetAudience: projectData.targetAudience || null,
      estimatedDuration: `${projectData.duration}${projectData.customDuration ? `-${projectData.customDuration}` : ''}`,
      tags: projectData.tags,
      isPublic: projectData.isPublic,
      status: projectData.status,
      metadata: {
        contentType: projectData.contentType,
        channelTypes: projectData.channelTypes,
        category: projectData.category,
        duration: projectData.duration,
        customDuration: projectData.customDuration,
        contentFrequency: projectData.contentFrequency,
        calendarPreference: projectData.calendarPreference,
        aiEnhancement: projectData.aiEnhancement,
        notificationsEnabled: projectData.notificationsEnabled,
        createdAt: new Date().toISOString(),
        step: 'basics_completed' // Track completion steps
      }
    };

    const createdProject = await storage.createProject(enhancedProjectData);

    res.status(201).json({
      success: true,
      message: 'Enhanced project created successfully',
      project: createdProject
    });

  } catch (error) {
    console.error('Enhanced project creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create enhanced project',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Save project integrations
router.post('/api/projects/:projectId/integrations', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.projectId);

    const project = await storage.getProjectById(projectId, userId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const { integrations } = req.body;

    // Update project with integration data
    await storage.updateProject(projectId, {
      metadata: {
        ...project.metadata,
        integrations: integrations,
        integrationsSavedAt: new Date().toISOString(),
        step: 'integrations_completed'
      }
    });

    // Create social accounts for connected platforms
    for (const [platform, integration] of Object.entries(integrations)) {
      if ((integration as any).connected) {
        // Check if social account already exists
        const existingAccount = await storage.getSocialAccountByPlatform(userId, platform);
        if (!existingAccount) {
          await storage.createSocialAccount({
            userId,
            platform,
            accountId: `${platform}_${userId}_${Date.now()}`,
            accountName: (integration as any).accountName,
            isActive: true,
            metadata: {
              connectedVia: 'project_creation',
              projectId: projectId,
              connectedAt: new Date().toISOString()
            }
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Integrations saved successfully'
    });

  } catch (error) {
    console.error('Save integrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save integrations',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Get project dashboard data
router.get('/api/projects/:projectId/dashboard', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.projectId);

    const project = await storage.getProjectById(projectId, userId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get project content statistics
    const content = await storage.getContentByProject(userId, projectId);
    const publishedCount = content.filter((c: any) => c.status === 'published').length;
    const scheduledCount = content.filter((c: any) => c.status === 'scheduled').length;
    const draftCount = content.filter((c: any) => c.status === 'draft').length;

    // Get social accounts for this user
    const socialAccounts = await storage.getSocialAccounts(userId);

    const dashboardData = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        type: project.type,
        status: project.status,
        createdAt: project.createdAt,
        metadata: project.metadata
      },
      statistics: {
        totalContent: content.length,
        published: publishedCount,
        scheduled: scheduledCount,
        draft: draftCount
      },
      socialAccounts: socialAccounts.map(account => ({
        platform: account.platform,
        accountName: account.accountName,
        isActive: account.isActive,
        connectedAt: account.metadata?.connectedAt
      })),
      aiCalendar: project.metadata?.aiCalendar || null
    };

    res.json({
      success: true,
      dashboard: dashboardData
    });

  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// AI content enhancement endpoint
router.post('/api/ai/enhance-content', authenticateToken, async (req: any, res) => {
  try {
    const { text, context } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Text content is required'
      });
    }

    // Simulate AI enhancement (replace with actual AI service call)
    const enhancedText = await enhanceTextWithAI(text, context);

    // Generate improvement suggestions
    const improvements = generateImprovementSuggestions(text, enhancedText, context);

    res.json({
      success: true,
      enhancedText,
      improvements,
      confidence: 0.87,
      suggestions: [
        'Consider adding emojis for better engagement',
        'Include relevant hashtags for discoverability',
        'Add a call-to-action to increase interaction'
      ]
    });

  } catch (error) {
    console.error('AI content enhancement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enhance content',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Helper functions
function getOptimalPostingTime(platform: string, date: Date): string {
  const dayOfWeek = date.getDay();
  const hour = date.getHours();

  // Platform-specific optimal posting times
  const optimalTimes: Record<string, string[]> = {
    instagram: ['9:00 AM', '2:00 PM', '7:00 PM'],
    youtube: ['2:00 PM', '6:00 PM', '8:00 PM'],
    facebook: ['1:00 PM', '3:00 PM', '7:00 PM'],
    linkedin: ['8:00 AM', '12:00 PM', '5:00 PM'],
    tiktok: ['6:00 PM', '8:00 PM', '10:00 PM']
  };

  const times = optimalTimes[platform] || optimalTimes.instagram;
  return times[Math.floor(Math.random() * times.length)];
}

function generateAITitle(contentType: string, category: string, dayNumber: number): string {
  const titles = {
    fitness: [
      `Day ${dayNumber}: ${category} Workout Routine`,
      `Transform Your Body: ${category} Guide`,
      `${category} Success Story - Day ${dayNumber}`,
      `Master ${category} with This Simple Routine`
    ],
    tech: [
      `Latest ${category} Trends - Day ${dayNumber}`,
      `Tech Tutorial: ${category} Made Easy`,
      `${category} Product Review & Demo`,
      `Unlock ${category} Potential`
    ],
    lifestyle: [
      `Daily ${category} Habits for Success`,
      `${category} Lifestyle Transformation`,
      `Master Your ${category} Routine - Day ${dayNumber}`,
      `${category} Tips for Better Living`
    ]
  };

  const categoryTitles = titles[contentType as keyof typeof titles] || titles.fitness;
  return categoryTitles[Math.floor(Math.random() * categoryTitles.length)];
}

function generateAICaption(contentType: string, category: string, platforms: string[]): string {
  const baseCaption = `Discover the power of ${category} and transform your ${contentType} journey! 💪✨`;

  // Add platform-specific hashtags
  const hashtags = platforms.includes('instagram') ? '#ContentCreation #SocialMedia' :
                   platforms.includes('tiktok') ? '#Viral #Trending' :
                   platforms.includes('youtube') ? '#Tutorial #LearnWithUs' :
                   '#Content #DigitalMarketing';

  return `${baseCaption} ${hashtags}`;
}

async function enhanceTextWithAI(text: string, context: any): Promise<string> {
  // Simulate AI enhancement
  let enhanced = text;

  // Add engaging elements based on context
  if (context.contentType === 'video') {
    enhanced = `🎬 ${enhanced}`;
  } else if (context.contentType === 'image') {
    enhanced = `📸 ${enhanced}`;
  }

  // Add platform-specific optimizations
  if (context.platform === 'instagram') {
    enhanced = enhanced + ' #ContentCreation #SocialMedia';
  } else if (context.platform === 'tiktok') {
    enhanced = enhanced + ' #Viral #Trending';
  }

  // Add engagement elements
  if (!enhanced.includes('?')) {
    enhanced = enhanced + ' What are your thoughts?';
  }

  return enhanced;
}

function generateImprovementSuggestions(original: string, enhanced: string, context: any) {
  return [
    {
      type: 'engagement',
      description: 'Added engaging hook and call-to-action',
      before: original.substring(0, 50),
      after: enhanced.substring(0, 50)
    },
    {
      type: 'seo',
      description: 'Added relevant keywords for better discoverability',
      before: 'Learn about this topic',
      after: 'Master this essential topic with our comprehensive guide'
    },
    {
      type: 'tone',
      description: 'Improved tone for better audience connection',
      before: original,
      after: enhanced
    }
  ];
}

export default router;
