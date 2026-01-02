import { Router } from 'express';
import { authenticateToken } from '../auth';
import { aiCalendarGenerator } from '../services/ai-calendar-generator';
import { z } from 'zod';

const router = Router();

// Validation schemas
const generateCalendarSchema = z.object({
  projectId: z.string().min(1),
  platforms: z.array(z.string()).min(1),
  category: z.string().min(1),
  duration: z.number().min(1).max(365),
  contentFrequency: z.enum(['daily', 'weekly', 'bi-weekly', 'monthly']),
  startDate: z.string().datetime()
});

const enhanceContentSchema = z.object({
  contentId: z.string().min(1),
  field: z.string().min(1),
  currentValue: z.any(),
  context: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    platform: z.string().min(1),
    contentType: z.string().min(1),
    hashtags: z.array(z.string())
  })
});

const optimalTimesSchema = z.object({
  platforms: z.array(z.string()).min(1),
  category: z.string().min(1)
});

/**
 * Generate AI-powered content calendar
 * POST /api/ai/generate-calendar
 */
router.post('/generate-calendar', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    console.log('AI Calendar request received:', {
      body: req.body,
      userId: userId
    });
    
    // Validate request body
    const validationResult = generateCalendarSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error.errors);
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      });
    }

    const { projectId, platforms, category, duration, contentFrequency, startDate } = validationResult.data;

    // Generate AI calendar
    const contentCards = await aiCalendarGenerator.generateCalendar({
      projectId,
      platforms,
      category,
      duration,
      contentFrequency,
      startDate
    });

    res.json({
      success: true,
      message: 'AI calendar generated successfully',
      contentCards,
      metadata: {
        totalContent: contentCards.length,
        platforms: platforms,
        category: category,
        duration: duration,
        frequency: contentFrequency,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating AI calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI calendar',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Enhance content with AI
 * POST /api/ai/enhance-content
 */
router.post('/enhance-content', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Validate request body
    const validationResult = enhanceContentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      });
    }

    const { contentId, field, currentValue, context } = validationResult.data;

    // Ensure context has all required fields
    const validatedContext = {
      title: context.title,
      description: context.description,
      platform: context.platform,
      contentType: context.contentType,
      hashtags: context.hashtags
    };

    // Enhance content with AI
    const enhancedValue = await aiCalendarGenerator.enhanceContent({
      contentId,
      field,
      currentValue,
      context: validatedContext
    });

    res.json({
      success: true,
      message: 'Content enhanced successfully',
      enhancedValue,
      metadata: {
        field: field,
        contentId: contentId,
        enhancedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error enhancing content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enhance content',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Get optimal posting times for platforms
 * POST /api/ai/optimal-posting-times
 */
router.post('/optimal-posting-times', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Validate request body
    const validationResult = optimalTimesSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      });
    }

    const { platforms, category } = validationResult.data;

    // Generate optimal posting times
    const optimalTimes = await aiCalendarGenerator.generateOptimalPostingTimes(platforms, category);

    res.json({
      success: true,
      message: 'Optimal posting times generated successfully',
      optimalTimes,
      metadata: {
        platforms: platforms,
        category: category,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating optimal posting times:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate optimal posting times',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Get AI content suggestions for a specific topic
 * POST /api/ai/content-suggestions
 */
router.post('/content-suggestions', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { topic, platform, contentType, category } = req.body;

    if (!topic || !platform) {
      return res.status(400).json({
        success: false,
        message: 'Topic and platform are required'
      });
    }

    // Generate content suggestions using AI
    const suggestions = await aiCalendarGenerator.generateContentIdeas({
      category: category || 'general',
      platforms: [platform],
      totalPieces: 5,
      frequency: 'weekly'
    });

    // Filter and format suggestions for the specific topic
    const filteredSuggestions = suggestions
      .filter(idea => 
        idea.topic.toLowerCase().includes(topic.toLowerCase()) ||
        idea.angle.toLowerCase().includes(topic.toLowerCase())
      )
      .slice(0, 3);

    res.json({
      success: true,
      message: 'Content suggestions generated successfully',
      suggestions: filteredSuggestions,
      metadata: {
        topic: topic,
        platform: platform,
        contentType: contentType,
        category: category,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating content suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate content suggestions',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Analyze content performance and suggest optimizations
 * POST /api/ai/analyze-performance
 */
router.post('/analyze-performance', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { contentId, platform, metrics } = req.body;

    if (!contentId || !platform) {
      return res.status(400).json({
        success: false,
        message: 'Content ID and platform are required'
      });
    }

    // Analyze performance using AI
    const analysis = await aiCalendarGenerator.analyzeContentPerformance({
      contentId,
      platform,
      metrics: metrics || {}
    });

    res.json({
      success: true,
      message: 'Performance analysis completed successfully',
      analysis,
      metadata: {
        contentId: contentId,
        platform: platform,
        analyzedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error analyzing content performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze content performance',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Generate hashtag suggestions for content
 * POST /api/ai/hashtag-suggestions
 */
router.post('/hashtag-suggestions', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { content, platform, category, count = 10 } = req.body;

    if (!content || !platform) {
      return res.status(400).json({
        success: false,
        message: 'Content and platform are required'
      });
    }

    // Generate hashtag suggestions using AI
    const hashtags = await aiCalendarGenerator.generateHashtagSuggestions({
      content,
      platform,
      category: category || 'general',
      count: Math.min(count, 20) // Limit to 20 hashtags
    });

    res.json({
      success: true,
      message: 'Hashtag suggestions generated successfully',
      hashtags,
      metadata: {
        platform: platform,
        category: category,
        count: hashtags.length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating hashtag suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate hashtag suggestions',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

export default router;
