import express from 'express';
import { authenticateToken } from '../auth';
import AdvancedCalendarOptimizer from '../services/advanced-calendar-optimizer';
import { z } from 'zod';

const router = express.Router();
const calendarOptimizer = new AdvancedCalendarOptimizer();

// Validation schemas
const optimizeScheduleSchema = z.object({
  platforms: z.array(z.string()).min(1),
  categories: z.array(z.string()).min(1),
  duration: z.number().min(1).max(365),
  contentFrequency: z.enum(['daily', 'alternate', 'weekly', 'custom']),
  targetAudience: z.string().min(1),
  timezone: z.string().optional().default('UTC'),
  preferences: z.object({
    avoidWeekends: z.boolean().optional(),
    preferEvenings: z.boolean().optional(),
    maxPostsPerDay: z.number().min(1).max(10).optional()
  }).optional()
});

const platformOptimalTimesSchema = z.object({
  platform: z.string(),
  category: z.string(),
  timezone: z.string().optional().default('UTC')
});

const analyzeEngagementSchema = z.object({
  historicalData: z.array(z.any())
});

/**
 * Generate optimal posting schedule
 * POST /api/advanced-calendar/optimize-schedule
 */
router.post('/optimize-schedule', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Validate request body
    const validationResult = optimizeScheduleSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      });
    }

    const params = validationResult.data;

    // Generate optimal schedule
    const result = await calendarOptimizer.generateOptimalSchedule(params);

    res.json({
      success: true,
      message: 'Optimal schedule generated successfully',
      data: result,
      metadata: {
        userId,
        generatedAt: new Date().toISOString(),
        requestParams: params
      }
    });

  } catch (error) {
    console.error('Error generating optimal schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate optimal schedule',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Get platform-specific optimal times
 * POST /api/advanced-calendar/platform-optimal-times
 */
router.post('/platform-optimal-times', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Validate request body
    const validationResult = platformOptimalTimesSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      });
    }

    const { platform, category, timezone } = validationResult.data;

    // Get platform optimal times
    const optimalTimes = await calendarOptimizer.getPlatformOptimalTimes(platform, category, timezone);

    res.json({
      success: true,
      message: 'Platform optimal times retrieved successfully',
      data: {
        platform,
        category,
        timezone,
        optimalTimes
      },
      metadata: {
        userId,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting platform optimal times:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get platform optimal times',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Analyze engagement patterns
 * POST /api/advanced-calendar/analyze-engagement
 */
router.post('/analyze-engagement', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Validate request body
    const validationResult = analyzeEngagementSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      });
    }

    const { historicalData } = validationResult.data;

    // Analyze engagement patterns
    const analysis = await calendarOptimizer.analyzeEngagementPatterns(historicalData);

    res.json({
      success: true,
      message: 'Engagement analysis completed successfully',
      data: analysis,
      metadata: {
        userId,
        analyzedAt: new Date().toISOString(),
        dataPoints: historicalData.length
      }
    });

  } catch (error) {
    console.error('Error analyzing engagement patterns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze engagement patterns',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Get calendar optimization insights
 * GET /api/advanced-calendar/insights
 */
router.get('/insights', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // This could be enhanced to fetch user-specific insights from database
    const insights = {
      generalTips: [
        'Post consistently at optimal times for maximum engagement',
        'Consider your audience\'s timezone when scheduling content',
        'Test different posting times to find what works best for your audience',
        'Use analytics to track performance and adjust your strategy',
        'Consider platform-specific best practices for each content type'
      ],
      platformRecommendations: {
        instagram: 'Best times: 9 AM, 12 PM, 6 PM, 8 PM',
        facebook: 'Best times: 9 AM, 1 PM, 3 PM, 6 PM',
        linkedin: 'Best times: 8 AM, 12 PM, 5 PM',
        tiktok: 'Best times: 6 AM, 10 AM, 7 PM, 9 PM',
        youtube: 'Best times: 2 PM, 4 PM, 8 PM'
      },
      categoryInsights: {
        fitness: 'Early morning and evening posts perform best',
        tech: 'Mid-morning and late afternoon posts get good engagement',
        business: 'Professional hours (9 AM - 5 PM) work well',
        entertainment: 'Evening posts (7 PM - 10 PM) are most effective',
        education: 'Afternoon and evening posts perform well'
      }
    };

    res.json({
      success: true,
      message: 'Calendar insights retrieved successfully',
      data: insights,
      metadata: {
        userId,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting calendar insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get calendar insights',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

export default router;
