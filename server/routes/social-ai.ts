import { Router } from 'express';
import { authenticateToken } from '../auth';
import { storage } from '../storage';
import { z } from 'zod';
import { AISuggestionsService } from '../services/ai-suggestions';

// Validation schemas
const hashtagRequestSchema = z.object({
  platform: z.string(),
  category: z.string().optional(),
  limit: z.number().positive().optional().default(10)
});

const aiSuggestionRequestSchema = z.object({
  projectId: z.number().optional(),
  suggestionType: z.enum(['caption', 'hashtags', 'best_time', 'content_idea']),
  platform: z.string(),
  context: z.record(z.any()).optional()
});

const createHashtagSuggestionSchema = z.object({
  platform: z.string(),
  category: z.string(),
  hashtag: z.string().regex(/^#/),
  trendScore: z.number().min(0).max(100).optional().default(0),
  usageCount: z.number().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true)
});

const generateProjectContentSchema = z.object({
  projectName: z.string(),
  contentName: z.string(),
  contentType: z.string(),
  contentTitle: z.string().optional(), // Made optional since client sends contentName as title
  contentDescription: z.string(),
  channelType: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  targetAudience: z.string(),
  projectTypes: z.array(z.string()).optional().default([]),
  contentFrequency: z.string().optional().default('daily'),
  aiEnhancement: z.boolean().optional().default(true),
  engagementOptimization: z.boolean().optional().default(true),
  seasonalTrends: z.boolean().optional().default(false),
  competitorAnalysis: z.boolean().optional().default(false),
  postingStrategy: z.string().optional().default('optimal'),
  customPostingTimes: z.array(z.string()).optional().default([])
});

const router = Router();

// Test endpoint to check authentication
router.get('/test-auth', (req: any, res) => {
  console.log('🧪 Test auth endpoint called');
  res.json({
    success: true,
    message: 'Route is accessible!',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint with authentication
router.get('/test-auth-protected', authenticateToken, (req: any, res) => {
  console.log('🧪 Test auth protected endpoint called');
  res.json({
    success: true,
    message: 'Authentication working!',
    user: req.user
  });
});

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * Get hashtag suggestions
 * GET /api/social-ai/hashtags
 */
router.get('/hashtags', async (req: any, res) => {
  try {
    const params = hashtagRequestSchema.parse(req.query);

    const suggestions = await storage.getHashtagSuggestions(
      params.platform,
      params.category,
      params.limit
    );

    res.json({
      success: true,
      suggestions,
      total: suggestions.length
    });
  } catch (error) {
    console.error('Error getting hashtag suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hashtag suggestions',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Create hashtag suggestion (admin only)
 * POST /api/social-ai/hashtags
 */
router.post('/hashtags', async (req: any, res) => {
  try {
    // In a real implementation, you'd check for admin permissions
    const suggestionData = createHashtagSuggestionSchema.parse(req.body);

    const suggestion = await storage.createHashtagSuggestion(suggestionData);

    res.status(201).json({
      success: true,
      message: 'Hashtag suggestion created successfully',
      suggestion
    });
  } catch (error) {
    console.error('Error creating hashtag suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create hashtag suggestion',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Get AI content suggestions
 * GET /api/social-ai/suggestions
 */
router.get('/suggestions', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { projectId, limit } = req.query;

    const suggestions = await storage.getAiContentSuggestions(
      userId,
      projectId ? parseInt(projectId) : undefined,
      limit ? parseInt(limit) : undefined
    );

    res.json({
      success: true,
      suggestions,
      total: suggestions.length
    });
  } catch (error) {
    console.error('Error getting AI content suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI content suggestions',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Create AI content suggestion
 * POST /api/social-ai/suggestions
 */
router.post('/suggestions', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const suggestionData = req.body;

    const suggestion = await storage.createAiContentSuggestion({
      ...suggestionData,
      userId
    });

    res.status(201).json({
      success: true,
      message: 'AI content suggestion created successfully',
      suggestion
    });
  } catch (error) {
    console.error('Error creating AI content suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create AI content suggestion',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Generate AI target audience suggestions
 * POST /api/social-ai/generate-audience-suggestions
 */
router.post('/generate-audience-suggestions', authenticateToken, async (req: any, res) => {
  try {
    const { projectName, contentName, contentTypes, contentCategories, channelTypes } = req.body;

    // Validate required fields
    if (!projectName || !contentName || !contentTypes || !contentCategories || !channelTypes) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: projectName, contentName, contentTypes, contentCategories, channelTypes'
      });
    }

    console.log('🎯 Generating AI target audience suggestions...');
    
    const result = await AISuggestionsService.generateTargetAudienceSuggestions({
      projectName,
      contentName,
      contentTypes,
      contentCategories,
      channelTypes
    });

    res.json({
      success: true,
      suggestions: result.suggestions,
      metadata: result.metadata,
      message: 'AI target audience suggestions generated successfully'
    });
  } catch (error) {
    console.error('Error generating AI target audience suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI target audience suggestions',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : 'AI service temporarily unavailable. Please try again.'
    });
  }
});

/**
 * Generate AI content suggestion
 * POST /api/social-ai/generate
 */
router.post('/generate', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { suggestionType, platform, context, projectId } = req.body;

    // Mock AI generation (in real implementation, you'd call an AI service)
    let content = '';
    let confidence = '0';

    switch (suggestionType) {
      case 'caption':
        content = generateAICaption(platform, context);
        confidence = '0.85';
        break;
      case 'hashtags':
        content = generateAIHashtags(platform, context);
        confidence = '0.90';
        break;
      case 'best_time':
        content = getOptimalPostingTimeSimple(platform);
        confidence = '0.75';
        break;
      case 'content_idea':
        content = generateContentIdea(platform, context);
        confidence = '0.80';
        break;
      default:
        throw new Error('Invalid suggestion type');
    }

    // Save the suggestion
    const suggestion = await storage.createAiContentSuggestion({
      userId,
      projectId: projectId ? parseInt(projectId) : undefined,
      suggestionType,
      platform,
      content,
      confidence,
      metadata: {
        generatedAt: new Date().toISOString(),
        context: context || {}
      }
    });

    res.json({
      success: true,
      suggestion,
      message: 'AI content suggestion generated successfully'
    });
  } catch (error) {
    console.error('Error generating AI content suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI content suggestion',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * Delete AI content suggestion
 * DELETE /api/social-ai/suggestions/:id
 */
router.delete('/suggestions/:id', async (req: any, res) => {
  try {
    const suggestionId = parseInt(req.params.id);

    const existingSuggestion = await storage.getAiContentSuggestionById(suggestionId);
    if (!existingSuggestion) {
      return res.status(404).json({
        success: false,
        message: 'AI content suggestion not found'
      });
    }

    // Check if user owns this suggestion
    if (existingSuggestion.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await storage.deleteAiContentSuggestion(suggestionId);

    res.json({
      success: true,
      message: 'AI content suggestion deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting AI content suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete AI content suggestion',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Helper functions for AI generation (mock implementations)
function generateAICaption(platform: string, context: any): string {
  const baseCaptions = {
    instagram: [
      "Transforming ideas into reality ✨",
      "Behind the scenes of creativity 🎬",
      "Every day is a new opportunity 💫",
      "Building the future, one post at a time 🚀"
    ],
    tiktok: [
      "POV: You're unstoppable 💪",
      "This changed everything for me 🤯",
      "You won't believe what happened next...",
      "Real talk: This is what success looks like"
    ],
    linkedin: [
      "Here's what I've learned about scaling businesses 📈",
      "The future of work is here, and it's exciting",
      "Leadership lessons from the trenches",
      "Innovation doesn't happen by accident"
    ],
    youtube: [
      "In today's video, we're diving deep into...",
      "You asked, I answered! Here's everything you need to know",
      "This strategy changed my business forever",
      "The complete guide to mastering..."
    ]
  };

  const captions = baseCaptions[platform as keyof typeof baseCaptions] || baseCaptions.instagram;
  return captions[Math.floor(Math.random() * captions.length)];
}

function generateAIHashtags(platform: string, context: any): string {
  const hashtagSets = {
    instagram: ['#ContentCreation', '#SocialMedia', '#DigitalMarketing', '#Entrepreneur', '#BusinessGrowth'],
    tiktok: ['#Viral', '#Trending', '#FYP', '#ForYouPage', '#ContentCreator'],
    linkedin: ['#Leadership', '#Innovation', '#BusinessStrategy', '#ProfessionalDevelopment', '#Networking'],
    youtube: ['#Tutorial', '#LearnWithMe', '#HowTo', '#Educational', '#Knowledge']
  };

  const hashtags = hashtagSets[platform as keyof typeof hashtagSets] || hashtagSets.instagram;
  return hashtags.join(' ');
}

function getOptimalPostingTimeSimple(platform: string): string {
  const optimalTimes = {
    instagram: 'Best time: 11 AM - 1 PM or 7 PM - 9 PM',
    tiktok: 'Best time: 6 PM - 10 PM on weekdays',
    linkedin: 'Best time: 8 AM - 10 AM or 5 PM - 6 PM on weekdays',
    youtube: 'Best time: 2 PM - 4 PM on weekdays'
  };

  return optimalTimes[platform as keyof typeof optimalTimes] || optimalTimes.instagram;
}

function generateContentIdea(platform: string, context: any): string {
  const ideas = {
    instagram: [
      'Create a carousel post series about productivity hacks',
      'Share a transformation story with before/after visuals',
      'Host a Q&A session in Stories about your expertise',
      'Collaborate with another creator for cross-promotion'
    ],
    tiktok: [
      'Create a trending sound challenge related to your niche',
      'Share quick tips in a series format (1-3 minutes each)',
      'Behind-the-scenes of your daily routine',
      'React to comments and questions from followers'
    ],
    linkedin: [
      'Share industry insights with data-driven posts',
      'Write about lessons learned from recent projects',
      'Ask thought-provoking questions to spark discussion',
      'Share career advice based on your experience'
    ],
    youtube: [
      'Create an in-depth tutorial on your area of expertise',
      'Interview other professionals in your field',
      'Review tools/products you use regularly',
      'Create a series tackling common questions'
    ]
  };

  const platformIdeas = ideas[platform as keyof typeof ideas] || ideas.instagram;
  return platformIdeas[Math.floor(Math.random() * platformIdeas.length)];
}

/**
 * Generate project content
 * POST /api/social-ai/generate-project-content
 */
router.post('/generate-project-content', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    console.log('🔑 User ID:', userId);
    console.log('🍪 Cookies:', req.cookies);
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    
    const params = generateProjectContentSchema.parse(req.body);
    console.log('✅ Parsed params:', JSON.stringify(params, null, 2));

    // Calculate total days
    const startDate = new Date(params.startDate);
    const endDate = new Date(params.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    console.log(`🤖 Generating AI project content for ${totalDays} days...`);

    // Use AI service to generate content
    const result = await AISuggestionsService.generateProjectContent({
      projectName: params.projectName,
      contentName: params.contentName,
      contentDescription: params.contentDescription,
      contentType: params.contentType,
      channelType: params.channelType,
      targetAudience: params.targetAudience,
      startDate: params.startDate,
      endDate: params.endDate,
      totalDays: totalDays
    });

    console.log(`✅ Generated ${result.contentItems.length} content items`);

    res.json({
      success: true,
      contentItems: result.contentItems,
      metadata: {
        ...result.metadata,
        projectName: params.projectName
      },
      message: `Successfully generated ${result.contentItems.length} AI content items`
    });

  } catch (error) {
    console.error('❌ Error generating AI project content:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI project content',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : 'AI service temporarily unavailable. Please try again.'
    });
  }
});

/**
 * Generate unique AI content for each day
 * POST /api/social-ai/generate-unique-day-content
 */
router.post('/generate-unique-day-content', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const {
      baseProject,
      baseContent,
      contentDescription,
      category,
      platform,
      contentType,
      targetAudience,
      dayNumber,
      totalDays,
      aiSettings
    } = req.body;

    console.log(`🎯 Generating unique content for Day ${dayNumber} of ${totalDays}...`);

    // Use AI service to generate unique content for this specific day
    const { AISuggestionsService } = await import('../services/ai-suggestions');
    
    const uniqueContent = await AISuggestionsService.generateUniqueDayContent({
      baseProject,
      baseContent,
      contentDescription,
      category,
      platform,
      contentType,
      targetAudience,
      dayNumber,
      totalDays,
      aiSettings: aiSettings || {
        creativity: 0.9,
        uniqueness: 0.95,
        engagement: 0.85,
        hashtagCount: 12,
        includeEmojis: true,
        includeCallToAction: true
      }
    });

    res.json({
      success: true,
      uniqueContent,
      message: `Successfully generated unique content for Day ${dayNumber}`
    });

  } catch (error) {
    console.error('❌ Error generating unique day content:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate unique day content',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : 'AI service temporarily unavailable. Please try again.'
    });
  }
});

// Enhanced helper functions for content generation
function generateEnhancedContentTitle(params: any, dayNumber: number, contentIndex: number): string {
  const { contentType, contentTitle, aiEnhancement, seasonalTrends, competitorAnalysis } = params;
  
  const baseTitle = contentTitle;
  const variations = {
    fitness: [
      `💪 ${baseTitle} - Day ${dayNumber}: Morning Motivation`,
      `🏃‍♀️ ${baseTitle} - Day ${dayNumber}: Workout Wednesday`,
      `🥗 ${baseTitle} - Day ${dayNumber}: Nutrition Tips`,
      `💤 ${baseTitle} - Day ${dayNumber}: Recovery & Rest`,
      `🎯 ${baseTitle} - Day ${dayNumber}: Goal Setting`,
      `🔥 ${baseTitle} - Day ${dayNumber}: High Intensity`,
      `🧘‍♀️ ${baseTitle} - Day ${dayNumber}: Mindful Movement`,
      `💪 ${baseTitle} - Day ${dayNumber}: Strength Training`
    ],
    tech: [
      `💻 ${baseTitle} - Day ${dayNumber}: Tech Tutorial`,
      `🚀 ${baseTitle} - Day ${dayNumber}: Innovation Spotlight`,
      `🔧 ${baseTitle} - Day ${dayNumber}: Tool Review`,
      `📱 ${baseTitle} - Day ${dayNumber}: App Feature`,
      `🤖 ${baseTitle} - Day ${dayNumber}: AI Insights`,
      `⚡ ${baseTitle} - Day ${dayNumber}: Quick Tips`,
      `🔍 ${baseTitle} - Day ${dayNumber}: Deep Dive`,
      `🌟 ${baseTitle} - Day ${dayNumber}: Future Tech`
    ],
    education: [
      `📚 ${baseTitle} - Day ${dayNumber}: Study Tips`,
      `🎓 ${baseTitle} - Day ${dayNumber}: Learning Strategy`,
      `📝 ${baseTitle} - Day ${dayNumber}: Note Taking`,
      `🧠 ${baseTitle} - Day ${dayNumber}: Memory Techniques`,
      `💡 ${baseTitle} - Day ${dayNumber}: Study Hacks`,
      `🎯 ${baseTitle} - Day ${dayNumber}: Focus Methods`,
      `📖 ${baseTitle} - Day ${dayNumber}: Reading Tips`,
      `✍️ ${baseTitle} - Day ${dayNumber}: Writing Skills`
    ],
    business: [
      `💼 ${baseTitle} - Day ${dayNumber}: Business Strategy`,
      `📈 ${baseTitle} - Day ${dayNumber}: Growth Tips`,
      `🤝 ${baseTitle} - Day ${dayNumber}: Networking`,
      `💰 ${baseTitle} - Day ${dayNumber}: Financial Planning`,
      `🚀 ${baseTitle} - Day ${dayNumber}: Innovation`,
      `📊 ${baseTitle} - Day ${dayNumber}: Data Analysis`,
      `🎯 ${baseTitle} - Day ${dayNumber}: Goal Setting`,
      `💡 ${baseTitle} - Day ${dayNumber}: Creative Solutions`
    ],
    lifestyle: [
      `✨ ${baseTitle} - Day ${dayNumber}: Daily Inspiration`,
      `🌅 ${baseTitle} - Day ${dayNumber}: Morning Routine`,
      `🧘‍♀️ ${baseTitle} - Day ${dayNumber}: Mindfulness`,
      `🎨 ${baseTitle} - Day ${dayNumber}: Creative Expression`,
      `🌱 ${baseTitle} - Day ${dayNumber}: Personal Growth`,
      `🏠 ${baseTitle} - Day ${dayNumber}: Home Organization`,
      `☕ ${baseTitle} - Day ${dayNumber}: Self Care`,
      `🌟 ${baseTitle} - Day ${dayNumber}: Life Balance`
    ],
    entertainment: [
      `🎭 ${baseTitle} - Day ${dayNumber}: Fun Facts`,
      `🎬 ${baseTitle} - Day ${dayNumber}: Movie Review`,
      `🎵 ${baseTitle} - Day ${dayNumber}: Music Spotlight`,
      `🎮 ${baseTitle} - Day ${dayNumber}: Gaming Tips`,
      `😄 ${baseTitle} - Day ${dayNumber}: Humor & Memes`,
      `🎪 ${baseTitle} - Day ${dayNumber}: Entertainment News`,
      `🎨 ${baseTitle} - Day ${dayNumber}: Creative Content`,
      `🌟 ${baseTitle} - Day ${dayNumber}: Trending Topics`
    ],
    food: [
      `🍳 ${baseTitle} - Day ${dayNumber}: Recipe of the Day`,
      `🥗 ${baseTitle} - Day ${dayNumber}: Healthy Eating`,
      `👨‍🍳 ${baseTitle} - Day ${dayNumber}: Cooking Tips`,
      `🍽️ ${baseTitle} - Day ${dayNumber}: Meal Planning`,
      `🌶️ ${baseTitle} - Day ${dayNumber}: Spice Spotlight`,
      `🍰 ${baseTitle} - Day ${dayNumber}: Dessert Delights`,
      `🥘 ${baseTitle} - Day ${dayNumber}: Comfort Food`,
      `🍕 ${baseTitle} - Day ${dayNumber}: Quick Meals`
    ],
    travel: [
      `✈️ ${baseTitle} - Day ${dayNumber}: Destination Guide`,
      `🏖️ ${baseTitle} - Day ${dayNumber}: Beach Tips`,
      `🏔️ ${baseTitle} - Day ${dayNumber}: Adventure Travel`,
      `🏛️ ${baseTitle} - Day ${dayNumber}: Cultural Sites`,
      `📸 ${baseTitle} - Day ${dayNumber}: Photo Spots`,
      `🗺️ ${baseTitle} - Day ${dayNumber}: Travel Planning`,
      `🎒 ${baseTitle} - Day ${dayNumber}: Packing Tips`,
      `🌍 ${baseTitle} - Day ${dayNumber}: Hidden Gems`
    ],
    fashion: [
      `👗 ${baseTitle} - Day ${dayNumber}: Style Tips`,
      `✨ ${baseTitle} - Day ${dayNumber}: Fashion Trends`,
      `👠 ${baseTitle} - Day ${dayNumber}: Outfit Ideas`,
      `🎨 ${baseTitle} - Day ${dayNumber}: Color Coordination`,
      `💄 ${baseTitle} - Day ${dayNumber}: Beauty & Fashion`,
      `🛍️ ${baseTitle} - Day ${dayNumber}: Shopping Guide`,
      `🌟 ${baseTitle} - Day ${dayNumber}: Accessory Spotlight`,
      `👔 ${baseTitle} - Day ${dayNumber}: Professional Style`
    ],
    beauty: [
      `💄 ${baseTitle} - Day ${dayNumber}: Makeup Tutorial`,
      `✨ ${baseTitle} - Day ${dayNumber}: Skincare Routine`,
      `💅 ${baseTitle} - Day ${dayNumber}: Nail Art Ideas`,
      `🌸 ${baseTitle} - Day ${dayNumber}: Natural Beauty`,
      `💋 ${baseTitle} - Day ${dayNumber}: Lip Care Tips`,
      `👁️ ${baseTitle} - Day ${dayNumber}: Eye Makeup`,
      `🧴 ${baseTitle} - Day ${dayNumber}: Product Reviews`,
      `🌟 ${baseTitle} - Day ${dayNumber}: Beauty Hacks`
    ],
    gaming: [
      `🎮 ${baseTitle} - Day ${dayNumber}: Game Review`,
      `🏆 ${baseTitle} - Day ${dayNumber}: Gaming Tips`,
      `🎯 ${baseTitle} - Day ${dayNumber}: Strategy Guide`,
      `🎪 ${baseTitle} - Day ${dayNumber}: Gaming News`,
      `🎲 ${baseTitle} - Day ${dayNumber}: Game Mechanics`,
      `🏅 ${baseTitle} - Day ${dayNumber}: Achievement Guide`,
      `🎨 ${baseTitle} - Day ${dayNumber}: Game Art`,
      `🌟 ${baseTitle} - Day ${dayNumber}: Gaming Community`
    ],
    finance: [
      `💰 ${baseTitle} - Day ${dayNumber}: Investment Tips`,
      `📊 ${baseTitle} - Day ${dayNumber}: Market Analysis`,
      `💳 ${baseTitle} - Day ${dayNumber}: Budgeting Guide`,
      `🏦 ${baseTitle} - Day ${dayNumber}: Banking Tips`,
      `📈 ${baseTitle} - Day ${dayNumber}: Growth Strategies`,
      `💡 ${baseTitle} - Day ${dayNumber}: Financial Planning`,
      `🎯 ${baseTitle} - Day ${dayNumber}: Goal Setting`,
      `🌟 ${baseTitle} - Day ${dayNumber}: Wealth Building`
    ]
  };

  const typeVariations = variations[contentType as keyof typeof variations] || variations.fitness;
  let title = typeVariations[contentIndex % typeVariations.length];
  
  // Apply AI enhancements
  if (aiEnhancement) {
    title = enhanceTitleWithAI(title, contentType, dayNumber);
  }
  
  if (seasonalTrends) {
    title = addSeasonalElements(title, contentType);
  }
  
  if (competitorAnalysis) {
    title = addCompetitorInsights(title, contentType);
  }
  
  return title;
}

function generateContentTitle(contentType: string, baseTitle: string, dayNumber: number): string {
  const variations = {
    fitness: [
      `💪 ${baseTitle} - Day ${dayNumber}: Morning Motivation`,
      `🏃‍♀️ ${baseTitle} - Day ${dayNumber}: Workout Wednesday`,
      `🥗 ${baseTitle} - Day ${dayNumber}: Nutrition Tips`,
      `💤 ${baseTitle} - Day ${dayNumber}: Recovery & Rest`,
      `🎯 ${baseTitle} - Day ${dayNumber}: Goal Setting`
    ],
    tech: [
      `💻 ${baseTitle} - Day ${dayNumber}: Tech Tutorial`,
      `🚀 ${baseTitle} - Day ${dayNumber}: Innovation Spotlight`,
      `🔧 ${baseTitle} - Day ${dayNumber}: Tool Review`,
      `📱 ${baseTitle} - Day ${dayNumber}: App Feature`,
      `🤖 ${baseTitle} - Day ${dayNumber}: AI Insights`
    ],
    education: [
      `📚 ${baseTitle} - Day ${dayNumber}: Study Tips`,
      `🎓 ${baseTitle} - Day ${dayNumber}: Learning Strategy`,
      `📝 ${baseTitle} - Day ${dayNumber}: Note Taking`,
      `🧠 ${baseTitle} - Day ${dayNumber}: Memory Techniques`,
      `💡 ${baseTitle} - Day ${dayNumber}: Study Hacks`
    ],
    business: [
      `💼 ${baseTitle} - Day ${dayNumber}: Business Strategy`,
      `📈 ${baseTitle} - Day ${dayNumber}: Growth Tips`,
      `🤝 ${baseTitle} - Day ${dayNumber}: Networking`,
      `💰 ${baseTitle} - Day ${dayNumber}: Financial Planning`,
      `🚀 ${baseTitle} - Day ${dayNumber}: Innovation`
    ],
    lifestyle: [
      `✨ ${baseTitle} - Day ${dayNumber}: Daily Inspiration`,
      `🌅 ${baseTitle} - Day ${dayNumber}: Morning Routine`,
      `🧘‍♀️ ${baseTitle} - Day ${dayNumber}: Mindfulness`,
      `🎨 ${baseTitle} - Day ${dayNumber}: Creative Expression`,
      `🌱 ${baseTitle} - Day ${dayNumber}: Personal Growth`
    ],
    entertainment: [
      `🎭 ${baseTitle} - Day ${dayNumber}: Fun Facts`,
      `🎬 ${baseTitle} - Day ${dayNumber}: Movie Review`,
      `🎵 ${baseTitle} - Day ${dayNumber}: Music Spotlight`,
      `🎮 ${baseTitle} - Day ${dayNumber}: Gaming Tips`,
      `😄 ${baseTitle} - Day ${dayNumber}: Humor & Memes`
    ],
    food: [
      `🍳 ${baseTitle} - Day ${dayNumber}: Recipe of the Day`,
      `🥗 ${baseTitle} - Day ${dayNumber}: Healthy Eating`,
      `👨‍🍳 ${baseTitle} - Day ${dayNumber}: Cooking Tips`,
      `🍽️ ${baseTitle} - Day ${dayNumber}: Meal Planning`,
      `🌶️ ${baseTitle} - Day ${dayNumber}: Spice Spotlight`
    ],
    travel: [
      `✈️ ${baseTitle} - Day ${dayNumber}: Destination Guide`,
      `🏖️ ${baseTitle} - Day ${dayNumber}: Beach Tips`,
      `🏔️ ${baseTitle} - Day ${dayNumber}: Adventure Travel`,
      `🏛️ ${baseTitle} - Day ${dayNumber}: Cultural Sites`,
      `📸 ${baseTitle} - Day ${dayNumber}: Photo Spots`
    ]
  };

  const typeVariations = variations[contentType as keyof typeof variations] || variations.fitness;
  return typeVariations[dayNumber % typeVariations.length];
}

function generateContentDescription(contentType: string, baseDescription: string, targetAudience: string, dayNumber: number): string {
  const descriptions = {
    fitness: [
      `💪 Transform your fitness journey with day ${dayNumber} of our program. Perfect for ${targetAudience} looking to build strength and confidence.`,
      `🏃‍♀️ Discover the power of consistent movement with our day ${dayNumber} guide. Ideal for ${targetAudience} ready to level up.`,
      `🥗 Fuel your body right with day ${dayNumber} nutrition insights. Essential for ${targetAudience} committed to health.`
    ],
    tech: [
      `💻 Master the latest in technology with day ${dayNumber} of our series. Essential for ${targetAudience} staying ahead of the curve.`,
      `🚀 Explore cutting-edge innovations in day ${dayNumber}. Perfect for ${targetAudience} passionate about tech.`,
      `🔧 Get hands-on with powerful tools in day ${dayNumber}. Ideal for ${targetAudience} looking to optimize workflows.`
    ],
    education: [
      `📚 Accelerate your learning with day ${dayNumber} of our program. Essential for ${targetAudience} committed to growth.`,
      `🎓 Master effective study techniques in day ${dayNumber}. Perfect for ${targetAudience} pursuing excellence.`,
      `📝 Transform your note-taking skills with day ${dayNumber}. Ideal for ${targetAudience} maximizing retention.`
    ],
    business: [
      `💼 Scale your business with day ${dayNumber} of our series. Essential for ${targetAudience} driving growth and innovation.`,
      `📈 Master data-driven decisions in day ${dayNumber}. Perfect for ${targetAudience} optimizing performance.`,
      `🤝 Build powerful networks with day ${dayNumber}. Ideal for ${targetAudience} expanding their reach.`
    ],
    lifestyle: [
      `✨ Transform your daily routine with day ${dayNumber} of our program. Perfect for ${targetAudience} seeking balance and joy.`,
      `🌅 Start each day with purpose using day ${dayNumber}. Ideal for ${targetAudience} embracing mindfulness.`,
      `🧘‍♀️ Find inner peace with day ${dayNumber}. Great for ${targetAudience} prioritizing mental health.`
    ],
    entertainment: [
      `🎭 Discover amazing entertainment in day ${dayNumber} of our series. Perfect for ${targetAudience} seeking fun and relaxation.`,
      `🎬 Get the latest in movies and shows with day ${dayNumber}. Ideal for ${targetAudience} who love cinema.`,
      `🎵 Explore new music and artists in day ${dayNumber}. Great for ${targetAudience} passionate about music.`
    ],
    food: [
      `🍳 Master the kitchen with day ${dayNumber} of our program. Perfect for ${targetAudience} passionate about cooking.`,
      `🥗 Discover healthy eating with day ${dayNumber}. Ideal for ${targetAudience} prioritizing nutrition.`,
      `👨‍🍳 Learn professional techniques in day ${dayNumber}. Great for ${targetAudience} aspiring chefs.`
    ],
    travel: [
      `✈️ Explore the world with day ${dayNumber} of our series. Perfect for ${targetAudience} with wanderlust.`,
      `🏖️ Discover hidden gems in day ${dayNumber}. Ideal for ${targetAudience} seeking adventure.`,
      `🏔️ Conquer new heights with day ${dayNumber}. Great for ${targetAudience} embracing outdoor life.`
    ]
  };

  const typeDescriptions = descriptions[contentType as keyof typeof descriptions] || descriptions.fitness;
  return typeDescriptions[dayNumber % typeDescriptions.length];
}

function generateFullContent(contentType: string, baseTitle: string, baseDescription: string, targetAudience: string, dayNumber: number): string {
  return `Welcome to day ${dayNumber} of your ${baseTitle} journey! 

${baseDescription}

This content is specifically crafted for ${targetAudience} and designed to provide actionable insights and practical tips. Each day builds upon the previous content to create a comprehensive learning experience.

Key takeaways for today:
• Focus on consistency over perfection
• Track your progress and celebrate small wins
• Connect with others on the same journey
• Stay curious and keep learning

Remember: Every expert was once a beginner. Keep pushing forward! 💪

#${contentType} #day${dayNumber} #learning #growth #motivation`;
}

function generateHashtags(contentType: string, channel: string, title: string, dayNumber: number): string[] {
  const baseHashtags = [
    `#${contentType}`,
    `#${channel}`,
    `#${title.toLowerCase().replace(/\s+/g, '')}`,
    `#day${dayNumber}`,
    '#content',
    '#tips',
    '#learn',
    '#growth',
    '#motivation'
  ];

  const contentTypeHashtags = {
    fitness: ['#fitness', '#workout', '#health', '#wellness', '#strength'],
    tech: ['#technology', '#innovation', '#digital', '#coding', '#ai'],
    education: ['#education', '#learning', '#study', '#knowledge', '#academic'],
    business: ['#business', '#entrepreneur', '#leadership', '#strategy', '#success'],
    lifestyle: ['#lifestyle', '#wellness', '#mindfulness', '#selfcare', '#balance'],
    entertainment: ['#entertainment', '#fun', '#movies', '#music', '#gaming'],
    food: ['#food', '#cooking', '#recipe', '#nutrition', '#chef'],
    travel: ['#travel', '#wanderlust', '#adventure', '#explore', '#vacation']
  };

  const channelHashtags = {
    instagram: ['#instagram', '#insta', '#photo', '#visual'],
    facebook: ['#facebook', '#social', '#community', '#share'],
    linkedin: ['#linkedin', '#professional', '#career', '#networking'],
    tiktok: ['#tiktok', '#viral', '#trending', '#shortform'],
    youtube: ['#youtube', '#video', '#subscribe', '#creator']
  };

  const typeTags = contentTypeHashtags[contentType as keyof typeof contentTypeHashtags] || [];
  const channelTags = channelHashtags[channel as keyof typeof channelHashtags] || [];

  return [...baseHashtags, ...typeTags, ...channelTags].slice(0, 8);
}

function getOptimalPostingTime(channel: string, contentType: string): string {
  const timeSlots = {
    instagram: {
      fitness: ['07:00', '12:00', '18:00', '20:00'],
      tech: ['09:00', '15:00', '19:00', '21:00'],
      education: ['08:00', '14:00', '18:00', '20:00'],
      default: ['09:00', '15:00', '19:00', '21:00']
    },
    facebook: {
      default: ['13:00', '15:00', '19:00', '20:00']
    },
    linkedin: {
      business: ['08:00', '12:00', '17:00', '18:00'],
      default: ['09:00', '14:00', '17:00', '19:00']
    },
    tiktok: {
      entertainment: ['18:00', '20:00', '21:00'],
      default: ['19:00', '20:00', '21:00']
    },
    youtube: {
      education: ['14:00', '16:00', '19:00'],
      entertainment: ['18:00', '20:00', '21:00'],
      default: ['15:00', '18:00', '20:00']
    }
  };

  const channelTimes = timeSlots[channel as keyof typeof timeSlots] || timeSlots.instagram;
  const contentTimes = channelTimes[contentType as keyof typeof channelTimes] || channelTimes.default;
  return contentTimes[Math.floor(Math.random() * contentTimes.length)];
}

// Enhanced helper functions
function generateEnhancedContentDescription(params: any, dayNumber: number, contentIndex: number): string {
  const { contentType, contentDescription, targetAudience, aiEnhancement, seasonalTrends } = params;
  
  const descriptions = {
    fitness: [
      `💪 Transform your fitness journey with day ${dayNumber} of our program. Perfect for ${targetAudience} looking to build strength and confidence.`,
      `🏃‍♀️ Discover the power of consistent movement with our day ${dayNumber} guide. Ideal for ${targetAudience} ready to level up.`,
      `🥗 Fuel your body right with day ${dayNumber} nutrition insights. Essential for ${targetAudience} committed to health.`
    ],
    tech: [
      `💻 Master the latest in technology with day ${dayNumber} of our series. Essential for ${targetAudience} staying ahead of the curve.`,
      `🚀 Explore cutting-edge innovations in day ${dayNumber}. Perfect for ${targetAudience} passionate about tech.`,
      `🔧 Get hands-on with powerful tools in day ${dayNumber}. Ideal for ${targetAudience} looking to optimize workflows.`
    ],
    education: [
      `📚 Accelerate your learning with day ${dayNumber} of our program. Essential for ${targetAudience} committed to growth.`,
      `🎓 Master effective study techniques in day ${dayNumber}. Perfect for ${targetAudience} pursuing excellence.`,
      `📝 Transform your note-taking skills with day ${dayNumber}. Ideal for ${targetAudience} maximizing retention.`
    ],
    business: [
      `💼 Scale your business with day ${dayNumber} of our series. Essential for ${targetAudience} driving growth and innovation.`,
      `📈 Master data-driven decisions in day ${dayNumber}. Perfect for ${targetAudience} optimizing performance.`,
      `🤝 Build powerful networks with day ${dayNumber}. Ideal for ${targetAudience} expanding their reach.`
    ],
    lifestyle: [
      `✨ Transform your daily routine with day ${dayNumber} of our program. Perfect for ${targetAudience} seeking balance and joy.`,
      `🌅 Start each day with purpose using day ${dayNumber}. Ideal for ${targetAudience} embracing mindfulness.`,
      `🧘‍♀️ Find inner peace with day ${dayNumber}. Great for ${targetAudience} prioritizing mental health.`
    ],
    entertainment: [
      `🎭 Discover amazing entertainment in day ${dayNumber} of our series. Perfect for ${targetAudience} seeking fun and relaxation.`,
      `🎬 Get the latest in movies and shows with day ${dayNumber}. Ideal for ${targetAudience} who love cinema.`,
      `🎵 Explore new music and artists in day ${dayNumber}. Great for ${targetAudience} passionate about music.`
    ],
    food: [
      `🍳 Master the kitchen with day ${dayNumber} of our program. Perfect for ${targetAudience} passionate about cooking.`,
      `🥗 Discover healthy eating with day ${dayNumber}. Ideal for ${targetAudience} prioritizing nutrition.`,
      `👨‍🍳 Learn professional techniques in day ${dayNumber}. Great for ${targetAudience} aspiring chefs.`
    ],
    travel: [
      `✈️ Explore the world with day ${dayNumber} of our series. Perfect for ${targetAudience} with wanderlust.`,
      `🏖️ Discover hidden gems in day ${dayNumber}. Ideal for ${targetAudience} seeking adventure.`,
      `🏔️ Conquer new heights with day ${dayNumber}. Great for ${targetAudience} embracing outdoor life.`
    ],
    fashion: [
      `👗 Elevate your style with day ${dayNumber} of our fashion guide. Perfect for ${targetAudience} expressing their personality.`,
      `✨ Discover the latest trends in day ${dayNumber}. Ideal for ${targetAudience} staying fashion-forward.`,
      `🎨 Master color coordination with day ${dayNumber}. Great for ${targetAudience} creating stunning looks.`
    ],
    beauty: [
      `💄 Transform your beauty routine with day ${dayNumber} of our guide. Perfect for ${targetAudience} enhancing their natural beauty.`,
      `✨ Discover skincare secrets in day ${dayNumber}. Ideal for ${targetAudience} achieving glowing skin.`,
      `🌟 Master makeup techniques with day ${dayNumber}. Great for ${targetAudience} expressing creativity.`
    ],
    gaming: [
      `🎮 Level up your gaming skills with day ${dayNumber} of our guide. Perfect for ${targetAudience} dominating the leaderboards.`,
      `🏆 Discover winning strategies in day ${dayNumber}. Ideal for ${targetAudience} competitive gamers.`,
      `🎯 Master game mechanics with day ${dayNumber}. Great for ${targetAudience} improving their gameplay.`
    ],
    finance: [
      `💰 Build wealth with day ${dayNumber} of our financial guide. Perfect for ${targetAudience} securing their future.`,
      `📊 Master investment strategies in day ${dayNumber}. Ideal for ${targetAudience} growing their portfolio.`,
      `💡 Learn budgeting techniques with day ${dayNumber}. Great for ${targetAudience} managing their money.`
    ]
  };

  const typeDescriptions = descriptions[contentType as keyof typeof descriptions] || descriptions.fitness;
  let description = typeDescriptions[contentIndex % typeDescriptions.length];
  
  if (aiEnhancement) {
    description = enhanceDescriptionWithAI(description, contentType, targetAudience);
  }
  
  if (seasonalTrends) {
    description = addSeasonalContext(description, contentType);
  }
  
  return description;
}

function generateEnhancedFullContent(params: any, dayNumber: number, contentIndex: number): string {
  const { contentType, contentTitle, contentDescription, targetAudience, aiEnhancement, seasonalTrends } = params;
  
  let content = `Welcome to day ${dayNumber} of your ${contentTitle} journey! 

${contentDescription}

This content is specifically crafted for ${targetAudience} and designed to provide actionable insights and practical tips. Each day builds upon the previous content to create a comprehensive learning experience.

Key takeaways for today:
• Focus on consistency over perfection
• Track your progress and celebrate small wins
• Connect with others on the same journey
• Stay curious and keep learning

Remember: Every expert was once a beginner. Keep pushing forward! 💪`;

  if (aiEnhancement) {
    content = enhanceContentWithAI(content, contentType, dayNumber);
  }
  
  if (seasonalTrends) {
    content = addSeasonalTips(content, contentType);
  }
  
  return content;
}

function generateEnhancedHashtags(params: any, dayNumber: number, contentIndex: number): string[] {
  const { contentType, channelType, contentTitle } = params;
  
  const baseHashtags = [
    `#${contentType}`,
    `#${channelType}`,
    `#${contentTitle.toLowerCase().replace(/\s+/g, '')}`,
    `#day${dayNumber}`,
    '#content',
    '#tips',
    '#learn',
    '#growth',
    '#motivation'
  ];

  const contentTypeHashtags = {
    fitness: ['#fitness', '#workout', '#health', '#wellness', '#strength', '#motivation'],
    tech: ['#technology', '#innovation', '#digital', '#coding', '#ai', '#future'],
    education: ['#education', '#learning', '#study', '#knowledge', '#academic', '#skills'],
    business: ['#business', '#entrepreneur', '#leadership', '#strategy', '#success', '#growth'],
    lifestyle: ['#lifestyle', '#wellness', '#mindfulness', '#selfcare', '#balance', '#happiness'],
    entertainment: ['#entertainment', '#fun', '#movies', '#music', '#gaming', '#viral'],
    food: ['#food', '#cooking', '#recipe', '#nutrition', '#chef', '#delicious'],
    travel: ['#travel', '#wanderlust', '#adventure', '#explore', '#vacation', '#wanderlust'],
    fashion: ['#fashion', '#style', '#outfit', '#trends', '#beauty', '#ootd'],
    beauty: ['#beauty', '#makeup', '#skincare', '#glow', '#selfcare', '#beautyhacks'],
    gaming: ['#gaming', '#gamer', '#esports', '#streaming', '#gamingcommunity', '#gaminglife'],
    finance: ['#finance', '#money', '#investment', '#budgeting', '#wealth', '#financialfreedom']
  };

  const channelHashtags = {
    instagram: ['#instagram', '#insta', '#photo', '#visual', '#instagood'],
    facebook: ['#facebook', '#social', '#community', '#share', '#facebook'],
    linkedin: ['#linkedin', '#professional', '#career', '#networking', '#business'],
    tiktok: ['#tiktok', '#viral', '#trending', '#shortform', '#fyp'],
    youtube: ['#youtube', '#video', '#subscribe', '#creator', '#youtuber']
  };

  const typeTags = contentTypeHashtags[contentType as keyof typeof contentTypeHashtags] || [];
  const channelTags = channelHashtags[channelType as keyof typeof channelHashtags] || [];

  return [...baseHashtags, ...typeTags, ...channelTags].slice(0, 10);
}

function getEnhancedOptimalPostingTime(params: any, date: Date): string {
  const { channelType, contentType, postingStrategy, customPostingTimes } = params;
  
  const timeSlots = {
    instagram: {
      fitness: ['07:00', '12:00', '18:00', '20:00'],
      tech: ['09:00', '15:00', '19:00', '21:00'],
      education: ['08:00', '14:00', '18:00', '20:00'],
      business: ['08:00', '12:00', '17:00', '19:00'],
      lifestyle: ['09:00', '15:00', '19:00', '21:00'],
      entertainment: ['18:00', '20:00', '21:00'],
      food: ['12:00', '18:00', '19:00', '20:00'],
      travel: ['09:00', '15:00', '18:00', '20:00'],
      fashion: ['10:00', '15:00', '19:00', '21:00'],
      beauty: ['10:00', '15:00', '19:00', '21:00'],
      gaming: ['18:00', '20:00', '21:00', '22:00'],
      finance: ['08:00', '12:00', '17:00', '19:00'],
      default: ['09:00', '15:00', '19:00', '21:00']
    },
    facebook: {
      business: ['09:00', '12:00', '15:00', '17:00'],
      entertainment: ['19:00', '20:00', '21:00'],
      default: ['13:00', '15:00', '19:00', '20:00']
    },
    linkedin: {
      business: ['08:00', '12:00', '17:00', '18:00'],
      tech: ['09:00', '14:00', '17:00', '19:00'],
      education: ['08:00', '14:00', '17:00', '19:00'],
      finance: ['08:00', '12:00', '17:00', '18:00'],
      default: ['09:00', '14:00', '17:00', '19:00']
    },
    tiktok: {
      entertainment: ['18:00', '20:00', '21:00'],
      gaming: ['19:00', '20:00', '21:00', '22:00'],
      fitness: ['07:00', '18:00', '20:00'],
      beauty: ['10:00', '19:00', '21:00'],
      food: ['12:00', '18:00', '20:00'],
      default: ['19:00', '20:00', '21:00']
    },
    youtube: {
      education: ['14:00', '16:00', '19:00'],
      tech: ['15:00', '18:00', '20:00'],
      entertainment: ['18:00', '20:00', '21:00'],
      gaming: ['19:00', '20:00', '21:00'],
      fitness: ['07:00', '18:00', '20:00'],
      default: ['15:00', '18:00', '20:00']
    }
  };

  const channelTimes = timeSlots[channelType as keyof typeof timeSlots] || timeSlots.instagram;
  const contentTimes = channelTimes[contentType as keyof typeof channelTimes] || channelTimes.default;
  
  // Apply strategy-based time selection
  if (postingStrategy === 'consistent') {
    return contentTimes[0]; // Always use first time for consistency
  } else if (postingStrategy === 'burst') {
    return contentTimes[contentTimes.length - 1]; // For burst mode, use later times
  } else if (postingStrategy === 'custom' && customPostingTimes && customPostingTimes.length > 0) {
    return customPostingTimes[Math.floor(Math.random() * customPostingTimes.length)];
  }
  
  // Optimal strategy - consider day of week and content type
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  if (isWeekend && (contentType === 'entertainment' || contentType === 'gaming')) {
    return contentTimes[contentTimes.length - 1]; // Later times for weekend entertainment
  }
  
  return contentTimes[Math.floor(Math.random() * contentTimes.length)];
}

function generateEnhancedEngagementPrediction(params: any, dayNumber: number) {
  const { contentType, channelType, aiEnhancement, engagementOptimization, seasonalTrends, competitorAnalysis } = params;
  
  const baseEngagement = {
    fitness: { likes: 150, comments: 25, shares: 15 },
    tech: { likes: 200, comments: 30, shares: 20 },
    education: { likes: 180, comments: 35, shares: 25 },
    business: { likes: 120, comments: 20, shares: 15 },
    lifestyle: { likes: 160, comments: 28, shares: 18 },
    entertainment: { likes: 250, comments: 40, shares: 30 },
    food: { likes: 220, comments: 32, shares: 22 },
    travel: { likes: 190, comments: 30, shares: 20 },
    fashion: { likes: 200, comments: 35, shares: 25 },
    beauty: { likes: 180, comments: 30, shares: 20 },
    gaming: { likes: 300, comments: 50, shares: 35 },
    finance: { likes: 100, comments: 15, shares: 10 }
  };

  const platformMultiplier = {
    instagram: 1.2,
    facebook: 1.0,
    linkedin: 0.8,
    tiktok: 1.5,
    youtube: 1.3
  };

  const base = baseEngagement[contentType as keyof typeof baseEngagement] || baseEngagement.fitness;
  const platformMult = platformMultiplier[channelType as keyof typeof platformMultiplier] || 1.0;
  const aiMultiplier = aiEnhancement ? 1.3 : 1.0;
  const engagementMultiplier = engagementOptimization ? 1.2 : 1.0;
  const seasonalMultiplier = seasonalTrends ? 1.1 : 1.0;
  const competitorMultiplier = competitorAnalysis ? 1.05 : 1.0;

  return {
    likes: Math.floor(base.likes * platformMult * aiMultiplier * engagementMultiplier * seasonalMultiplier * competitorMultiplier * (0.8 + Math.random() * 0.4)),
    comments: Math.floor(base.comments * platformMult * aiMultiplier * engagementMultiplier * seasonalMultiplier * competitorMultiplier * (0.8 + Math.random() * 0.4)),
    shares: Math.floor(base.shares * platformMult * aiMultiplier * engagementMultiplier * seasonalMultiplier * competitorMultiplier * (0.8 + Math.random() * 0.4)),
    reach: Math.floor((base.likes + base.comments + base.shares) * 3 * platformMult * aiMultiplier * engagementMultiplier * seasonalMultiplier * competitorMultiplier * (0.8 + Math.random() * 0.4))
  };
}

function calculateEngagementScore(params: any, dayNumber: number) {
  const { contentType, channelType, aiEnhancement, engagementOptimization, seasonalTrends, competitorAnalysis } = params;
  
  let score = 0;
  
  // Base score from content type
  const contentTypeScores = {
    fitness: 0.8, tech: 0.9, education: 0.85, business: 0.7,
    lifestyle: 0.8, entertainment: 1.0, food: 0.9, travel: 0.85,
    fashion: 0.9, beauty: 0.85, gaming: 1.0, finance: 0.6
  };
  
  score += contentTypeScores[contentType as keyof typeof contentTypeScores] || 0.8;
  
  // Platform score
  const platformScores = {
    instagram: 0.9, facebook: 0.7, linkedin: 0.8, tiktok: 1.0, youtube: 0.95
  };
  
  score += platformScores[channelType as keyof typeof platformScores] || 0.8;
  
  // AI enhancement bonus
  if (aiEnhancement) score += 0.2;
  if (engagementOptimization) score += 0.15;
  if (seasonalTrends) score += 0.1;
  if (competitorAnalysis) score += 0.1;
  
  return Math.min(score, 1.0);
}

// AI enhancement helper functions
function enhanceTitleWithAI(title: string, contentType: string, dayNumber: number): string {
  // Add AI-enhanced elements to titles
  const aiEnhancements = {
    fitness: ['Proven', 'Science-Backed', 'Expert-Approved', 'Results-Driven'],
    tech: ['Cutting-Edge', 'Innovative', 'Advanced', 'Next-Gen'],
    education: ['Master', 'Expert', 'Professional', 'Advanced'],
    business: ['Strategic', 'Data-Driven', 'Proven', 'Expert'],
    lifestyle: ['Transformative', 'Life-Changing', 'Inspiring', 'Empowering'],
    entertainment: ['Viral', 'Trending', 'Must-See', 'Epic'],
    food: ['Gourmet', 'Chef-Quality', 'Restaurant-Style', 'Professional'],
    travel: ['Exclusive', 'Hidden', 'Secret', 'Insider'],
    fashion: ['Stylish', 'Trendy', 'Chic', 'Fashionable'],
    beauty: ['Glowing', 'Radiant', 'Flawless', 'Stunning'],
    gaming: ['Pro', 'Elite', 'Master', 'Champion'],
    finance: ['Smart', 'Strategic', 'Wealth-Building', 'Profitable']
  };
  
  const enhancements = aiEnhancements[contentType as keyof typeof aiEnhancements] || aiEnhancements.fitness;
  const enhancement = enhancements[dayNumber % enhancements.length];
  
  return title.replace(/Day \d+:/, `Day ${dayNumber}: ${enhancement}`);
}

function addSeasonalElements(title: string, contentType: string): string {
  const currentMonth = new Date().getMonth();
  const seasonalElements = {
    winter: ['Winter', 'Holiday', 'Cozy', 'Warm'],
    spring: ['Spring', 'Fresh', 'New', 'Blooming'],
    summer: ['Summer', 'Hot', 'Bright', 'Sunny'],
    fall: ['Fall', 'Autumn', 'Cozy', 'Crisp']
  };
  
  let season = 'winter';
  if (currentMonth >= 2 && currentMonth <= 4) season = 'spring';
  else if (currentMonth >= 5 && currentMonth <= 7) season = 'summer';
  else if (currentMonth >= 8 && currentMonth <= 10) season = 'fall';
  
  const elements = seasonalElements[season as keyof typeof seasonalElements];
  const element = elements[Math.floor(Math.random() * elements.length)];
  
  return title.replace(/Day \d+:/, `Day ${title.match(/\d+/)?.[0]}: ${element}`);
}

function addCompetitorInsights(title: string, contentType: string): string {
  // Add competitive insights to titles
  const insights = ['Trending', 'Popular', 'Viral', 'Hot', 'In-Demand'];
  const insight = insights[Math.floor(Math.random() * insights.length)];
  
  return title.replace(/Day \d+:/, `Day ${title.match(/\d+/)?.[0]}: ${insight}`);
}

function enhanceDescriptionWithAI(description: string, contentType: string, targetAudience: string): string {
  // Add AI-enhanced elements to descriptions
  const aiElements = {
    fitness: ['scientifically proven', 'expert-recommended', 'results-driven'],
    tech: ['cutting-edge', 'innovative', 'advanced'],
    education: ['comprehensive', 'expert-led', 'proven methods'],
    business: ['strategic', 'data-driven', 'professional'],
    lifestyle: ['transformative', 'life-changing', 'inspiring'],
    entertainment: ['viral', 'trending', 'must-see'],
    food: ['gourmet', 'chef-quality', 'restaurant-style'],
    travel: ['exclusive', 'hidden gems', 'insider tips'],
    fashion: ['stylish', 'trendy', 'chic'],
    beauty: ['glowing', 'radiant', 'flawless'],
    gaming: ['pro-level', 'elite', 'champion'],
    finance: ['smart', 'strategic', 'wealth-building']
  };
  
  const elements = aiElements[contentType as keyof typeof aiElements] || aiElements.fitness;
  const element = elements[Math.floor(Math.random() * elements.length)];
  
  return description.replace(/Perfect for/, `${element} and perfect for`);
}

function addSeasonalContext(description: string, contentType: string): string {
  const currentMonth = new Date().getMonth();
  const seasonalContext = {
    winter: ['winter season', 'holiday time', 'cozy months'],
    spring: ['spring season', 'fresh start', 'new beginnings'],
    summer: ['summer season', 'hot months', 'bright days'],
    fall: ['fall season', 'autumn months', 'crisp air']
  };
  
  let season = 'winter';
  if (currentMonth >= 2 && currentMonth <= 4) season = 'spring';
  else if (currentMonth >= 5 && currentMonth <= 7) season = 'summer';
  else if (currentMonth >= 8 && currentMonth <= 10) season = 'fall';
  
  const context = seasonalContext[season as keyof typeof seasonalContext];
  const seasonText = context[Math.floor(Math.random() * context.length)];
  
  return description + ` Perfect for the ${seasonText}!`;
}

function enhanceContentWithAI(content: string, contentType: string, dayNumber: number): string {
  // Add AI-enhanced elements to content
  const aiTips = {
    fitness: ['💡 Pro tip: Consistency beats intensity every time!', '🔥 Challenge yourself with progressive overload!', '⚡ Remember: Rest is part of the process!'],
    tech: ['🚀 Stay ahead with the latest updates!', '💡 Pro tip: Always test in a safe environment!', '⚡ Remember: Security first, features second!'],
    education: ['📚 Pro tip: Active recall beats passive reading!', '🧠 Challenge yourself with spaced repetition!', '⚡ Remember: Understanding beats memorization!'],
    business: ['💼 Pro tip: Data drives decisions!', '📈 Challenge yourself with measurable goals!', '⚡ Remember: Customer value comes first!'],
    lifestyle: ['✨ Pro tip: Small changes create big results!', '🌱 Challenge yourself with daily habits!', '⚡ Remember: Progress over perfection!'],
    entertainment: ['🎭 Pro tip: Authenticity resonates!', '🎬 Challenge yourself with creative risks!', '⚡ Remember: Fun is the ultimate goal!'],
    food: ['👨‍🍳 Pro tip: Fresh ingredients make all the difference!', '🍳 Challenge yourself with new techniques!', '⚡ Remember: Taste is subjective!'],
    travel: ['✈️ Pro tip: Local experiences beat tourist traps!', '🗺️ Challenge yourself with off-the-beaten-path!', '⚡ Remember: Safety first, adventure second!'],
    fashion: ['👗 Pro tip: Confidence is your best accessory!', '✨ Challenge yourself with new styles!', '⚡ Remember: Personal style is unique!'],
    beauty: ['💄 Pro tip: Skincare is the foundation!', '✨ Challenge yourself with new looks!', '⚡ Remember: Natural beauty shines through!'],
    gaming: ['🎮 Pro tip: Practice makes perfect!', '🏆 Challenge yourself with harder difficulties!', '⚡ Remember: Have fun while improving!'],
    finance: ['💰 Pro tip: Start early, compound interest!', '📊 Challenge yourself with smart investments!', '⚡ Remember: Risk management is key!']
  };
  
  const tips = aiTips[contentType as keyof typeof aiTips] || aiTips.fitness;
  const tip = tips[dayNumber % tips.length];
  
  return content + `\n\n${tip}`;
}

function addSeasonalTips(content: string, contentType: string): string {
  const currentMonth = new Date().getMonth();
  const seasonalTips = {
    winter: ['❄️ Winter tip: Stay consistent even when it\'s cold!', '🔥 Cozy up with warm, comforting content!', '🎄 Holiday season is perfect for themed content!'],
    spring: ['🌸 Spring tip: Fresh starts and new beginnings!', '🌱 Perfect time for growth and renewal!', '☀️ Bright, optimistic content performs well!'],
    summer: ['☀️ Summer tip: Light, energetic content works best!', '🏖️ Vacation and travel content is trending!', '🌞 Bright, colorful visuals are key!'],
    fall: ['🍂 Fall tip: Cozy, warm content resonates!', '🎃 Perfect for themed and seasonal content!', '🍁 Rich, warm colors perform well!']
  };
  
  let season = 'winter';
  if (currentMonth >= 2 && currentMonth <= 4) season = 'spring';
  else if (currentMonth >= 5 && currentMonth <= 7) season = 'summer';
  else if (currentMonth >= 8 && currentMonth <= 10) season = 'fall';
  
  const tips = seasonalTips[season as keyof typeof seasonalTips];
  const tip = tips[Math.floor(Math.random() * tips.length)];
  
  return content + `\n\n${tip}`;
}

export default router;
