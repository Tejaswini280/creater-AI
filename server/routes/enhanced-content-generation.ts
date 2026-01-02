import { Router } from 'express';
import { authenticateToken } from '../auth';
import { z } from 'zod';
import { EnhancedContentGenerator } from '../services/enhanced-content-generator';
import { AIEngagementAnalyzer } from '../services/ai-engagement-analyzer';

const router = Router();

// Validation schemas
const generateEnhancedContentSchema = z.object({
  projectName: z.string().min(1, 'Project name is required'),
  contentName: z.string().min(1, 'Content name is required'),
  contentDescription: z.string().min(1, 'Content description is required'),
  contentType: z.string().min(1, 'Content type is required'),
  channelType: z.string().min(1, 'Channel type is required'),
  targetAudience: z.string().min(1, 'Target audience is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  totalDays: z.number().min(1, 'Total days must be at least 1'),
  preferences: z.object({
    avoidRepetition: z.boolean().default(true),
    optimizeScheduling: z.boolean().default(true),
    includeEngagementPrediction: z.boolean().default(true),
    themeDiversity: z.boolean().default(true)
  }).optional()
});

const predictEngagementSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  contentType: z.string().min(1, 'Content type is required'),
  category: z.string().min(1, 'Category is required'),
  contentTitle: z.string().min(1, 'Content title is required'),
  contentDescription: z.string().min(1, 'Content description is required'),
  hashtags: z.array(z.string()).default([]),
  targetAudience: z.string().min(1, 'Target audience is required'),
  scheduledDate: z.string().min(1, 'Scheduled date is required')
});

const analyzeOptimalTimingSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  category: z.string().min(1, 'Category is required'),
  timezone: z.string().default('UTC')
});

/**
 * Generate enhanced unique content with optimal scheduling
 * POST /api/enhanced-content/generate
 */
router.post('/generate', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const params = generateEnhancedContentSchema.parse(req.body);

    console.log(`🎯 Generating enhanced content for user ${userId}...`);

    // Generate unique, non-repetitive content
    const result = await EnhancedContentGenerator.generateUniqueProjectContent({
      projectName: params.projectName,
      contentName: params.contentName,
      contentDescription: params.contentDescription,
      contentType: params.contentType,
      channelType: params.channelType,
      targetAudience: params.targetAudience,
      startDate: params.startDate,
      endDate: params.endDate,
      totalDays: params.totalDays
    });

    // Enhance with engagement predictions if requested
    if (params.preferences?.includeEngagementPrediction) {
      const enhancedContentItems = await Promise.all(
        result.contentItems.map(async (item) => {
          const engagementPrediction = await AIEngagementAnalyzer.predictContentEngagement({
            platform: item.platform,
            contentType: item.contentType,
            category: item.contentType,
            contentTitle: item.title,
            contentDescription: item.description,
            hashtags: item.hashtags,
            targetAudience: params.targetAudience,
            scheduledDate: new Date(item.scheduledDate)
          });

          return {
            ...item,
            engagementPrediction: {
              likes: engagementPrediction.predictedEngagement.likes,
              comments: engagementPrediction.predictedEngagement.comments,
              shares: engagementPrediction.predictedEngagement.shares,
              reach: engagementPrediction.predictedEngagement.reach
            },
            scheduledTime: engagementPrediction.optimalPostingTime,
            optimalTime: engagementPrediction.optimalPostingTime,
            confidence: engagementPrediction.confidence
          };
        })
      );

      result.contentItems = enhancedContentItems;
    }

    res.json({
      success: true,
      contentItems: result.contentItems,
      metadata: {
        ...result.metadata,
        userId,
        preferences: params.preferences
      },
      message: `Successfully generated ${result.contentItems.length} unique content items with optimal scheduling`
    });

  } catch (error) {
    console.error('Error generating enhanced content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate enhanced content',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : 'Content generation service temporarily unavailable. Please try again.'
    });
  }
});

/**
 * Predict engagement for specific content
 * POST /api/enhanced-content/predict-engagement
 */
router.post('/predict-engagement', authenticateToken, async (req: any, res) => {
  try {
    const params = predictEngagementSchema.parse(req.body);

    const prediction = await AIEngagementAnalyzer.predictContentEngagement({
      platform: params.platform,
      contentType: params.contentType,
      category: params.category,
      contentTitle: params.contentTitle,
      contentDescription: params.contentDescription,
      hashtags: params.hashtags,
      targetAudience: params.targetAudience,
      scheduledDate: new Date(params.scheduledDate)
    });

    res.json({
      success: true,
      prediction,
      message: 'Engagement prediction generated successfully'
    });

  } catch (error) {
    console.error('Error predicting engagement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict engagement',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : 'Engagement prediction service temporarily unavailable.'
    });
  }
});

/**
 * Analyze optimal posting times for platform and category
 * POST /api/enhanced-content/analyze-timing
 */
router.post('/analyze-timing', authenticateToken, async (req: any, res) => {
  try {
    const params = analyzeOptimalTimingSchema.parse(req.body);

    const analysis = await AIEngagementAnalyzer.analyzeOptimalTiming(
      params.platform,
      params.category,
      params.timezone
    );

    res.json({
      success: true,
      analysis,
      message: 'Optimal timing analysis completed successfully'
    });

  } catch (error) {
    console.error('Error analyzing optimal timing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze optimal timing',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : 'Timing analysis service temporarily unavailable.'
    });
  }
});

/**
 * Get content themes and formats
 * GET /api/enhanced-content/themes
 */
router.get('/themes', authenticateToken, async (req: any, res) => {
  try {
    // This would return available themes and formats
    const themes = [
      {
        id: 'educational-tutorial',
        name: 'Educational Tutorial',
        angle: 'Step-by-step learning approach',
        format: 'Tutorial/How-to',
        keywords: ['learn', 'tutorial', 'guide', 'step-by-step', 'education'],
        engagementMultiplier: 1.2
      },
      {
        id: 'entertainment-trending',
        name: 'Trending Topics',
        angle: 'Current viral content and trends',
        format: 'Trending/Viral',
        keywords: ['trending', 'viral', 'popular', 'buzz', 'hot'],
        engagementMultiplier: 1.4
      },
      {
        id: 'motivational-inspiration',
        name: 'Inspirational Content',
        angle: 'Uplifting and motivational messages',
        format: 'Inspiration/Quote',
        keywords: ['inspiration', 'motivation', 'uplifting', 'positive', 'encourage'],
        engagementMultiplier: 1.1
      },
      {
        id: 'interactive-poll',
        name: 'Polls & Questions',
        angle: 'Audience engagement through questions',
        format: 'Poll/Question',
        keywords: ['poll', 'question', 'vote', 'opinion', 'choice'],
        engagementMultiplier: 1.6
      }
    ];

    res.json({
      success: true,
      themes,
      message: 'Content themes retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving themes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve content themes',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : 'Theme service temporarily unavailable.'
    });
  }
});

/**
 * Store engagement data for future analysis
 * POST /api/enhanced-content/store-engagement
 */
router.post('/store-engagement', authenticateToken, async (req: any, res) => {
  try {
    const {
      platform,
      category,
      contentType,
      postingTime,
      engagement,
      contentLength,
      hashtagCount,
      titleLength
    } = req.body;

    await AIEngagementAnalyzer.storeEngagementData({
      platform,
      category,
      contentType,
      postingTime,
      engagement,
      contentLength,
      hashtagCount,
      titleLength
    });

    res.json({
      success: true,
      message: 'Engagement data stored successfully'
    });

  } catch (error) {
    console.error('Error storing engagement data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to store engagement data',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : 'Data storage service temporarily unavailable.'
    });
  }
});

export default router;
