import express from 'express';
import { authenticateToken } from '../auth';
import { TrendAnalysisService } from '../services/trendAnalysis';
import { validateInput } from '../middleware/validation';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const trendAnalysisSchema = z.object({
  region: z.string().optional().default('global'),
  industry: z.string().optional(),
  includeCompetitorAnalysis: z.boolean().optional().default(false),
  platforms: z.array(z.string()).optional()
});

const platformTrendsSchema = z.object({
  platform: z.enum(['instagram', 'facebook', 'linkedin', 'youtube', 'twitter', 'tiktok']),
  region: z.string().optional().default('global'),
  industry: z.string().optional()
});

// Generate comprehensive weekly trend report
router.post('/weekly-report', 
  authenticateToken, 
  validateInput(z.object({ body: trendAnalysisSchema })), 
  async (req: any, res) => {
    try {
      const { region, industry, includeCompetitorAnalysis } = req.body;
      
      console.log('🔍 Generating weekly trend report for user:', req.user.id);
      console.log('🔍 Parameters:', { region, industry, includeCompetitorAnalysis });
      
      const report = await TrendAnalysisService.generateWeeklyTrendReport(
        region,
        industry,
        includeCompetitorAnalysis
      );
      
      res.json({
        success: true,
        data: report,
        message: 'Weekly trend report generated successfully'
      });
      
    } catch (error) {
      console.error('❌ Error generating trend report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate trend report',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      });
    }
  }
);

// Get trends for a specific platform
router.post('/platform-trends',
  authenticateToken,
  validateInput(z.object({ body: platformTrendsSchema })),
  async (req: any, res) => {
    try {
      const { platform, region, industry } = req.body;
      
      console.log('🔍 Analyzing platform trends:', { platform, region, industry });
      
      // Generate a full report and extract the specific platform data
      const report = await TrendAnalysisService.generateWeeklyTrendReport(region, industry, false);
      const platformData = report.platforms[platform as keyof typeof report.platforms];
      
      if (!platformData) {
        return res.status(404).json({
          success: false,
          message: `Platform ${platform} not found in trend data`
        });
      }
      
      res.json({
        success: true,
        data: {
          platform,
          trends: platformData,
          generated_at: report.generated_at
        },
        message: `${platform} trends analyzed successfully`
      });
      
    } catch (error) {
      console.error('❌ Error analyzing platform trends:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze platform trends',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      });
    }
  }
);

// Get content calendar based on trends
router.get('/content-calendar',
  authenticateToken,
  async (req: any, res) => {
    try {
      const region = req.query.region || 'global';
      const industry = req.query.industry;
      
      console.log('📅 Generating content calendar for user:', req.user.id);
      
      const report = await TrendAnalysisService.generateWeeklyTrendReport(region, industry, false);
      
      res.json({
        success: true,
        data: {
          calendar: report.contentCalendar,
          week: report.week,
          generated_at: report.generated_at
        },
        message: 'Content calendar generated successfully'
      });
      
    } catch (error) {
      console.error('❌ Error generating content calendar:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate content calendar',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      });
    }
  }
);

// Get trending hashtags across all platforms
router.get('/trending-hashtags',
  authenticateToken,
  async (req: any, res) => {
    try {
      const region = req.query.region || 'global';
      const platform = req.query.platform;
      const limit = parseInt(req.query.limit as string) || 20;
      
      console.log('🏷️ Getting trending hashtags:', { region, platform, limit });
      
      const report = await TrendAnalysisService.generateWeeklyTrendReport(region, undefined, false);
      
      let allHashtags: any[] = [];
      
      if (platform) {
        // Get hashtags for specific platform
        const platformData = report.platforms[platform as keyof typeof report.platforms];
        if (platformData) {
          allHashtags = platformData.trendingHashtags.map(h => ({ ...h, platform }));
        }
      } else {
        // Get hashtags from all platforms
        Object.entries(report.platforms).forEach(([platformName, data]) => {
          if (data && data.trendingHashtags) {
            allHashtags.push(...data.trendingHashtags.map(h => ({ ...h, platform: platformName })));
          }
        });
      }
      
      // Sort by engagement rate and limit results
      const sortedHashtags = allHashtags
        .sort((a, b) => b.engagement_rate - a.engagement_rate)
        .slice(0, limit);
      
      res.json({
        success: true,
        data: {
          hashtags: sortedHashtags,
          total: sortedHashtags.length,
          generated_at: report.generated_at
        },
        message: 'Trending hashtags retrieved successfully'
      });
      
    } catch (error) {
      console.error('❌ Error getting trending hashtags:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get trending hashtags',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      });
    }
  }
);

// Get trending audio/music across platforms
router.get('/trending-audio',
  authenticateToken,
  async (req: any, res) => {
    try {
      const region = req.query.region || 'global';
      const platform = req.query.platform;
      const limit = parseInt(req.query.limit as string) || 20;
      
      console.log('🎵 Getting trending audio:', { region, platform, limit });
      
      const report = await TrendAnalysisService.generateWeeklyTrendReport(region, undefined, false);
      
      let allAudio: any[] = [];
      
      if (platform) {
        // Get audio for specific platform
        const platformData = report.platforms[platform as keyof typeof report.platforms];
        if (platformData) {
          allAudio = platformData.trendingAudio.map(a => ({ ...a, platform }));
        }
      } else {
        // Get audio from all platforms
        Object.entries(report.platforms).forEach(([platformName, data]) => {
          if (data && data.trendingAudio) {
            allAudio.push(...data.trendingAudio.map(a => ({ ...a, platform: platformName })));
          }
        });
      }
      
      // Sort by usage count and limit results
      const sortedAudio = allAudio
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, limit);
      
      res.json({
        success: true,
        data: {
          audio: sortedAudio,
          total: sortedAudio.length,
          generated_at: report.generated_at
        },
        message: 'Trending audio retrieved successfully'
      });
      
    } catch (error) {
      console.error('❌ Error getting trending audio:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get trending audio',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      });
    }
  }
);

// Get content format recommendations
router.get('/content-formats',
  authenticateToken,
  async (req: any, res) => {
    try {
      const region = req.query.region || 'global';
      const platform = req.query.platform;
      
      console.log('📱 Getting content format recommendations:', { region, platform });
      
      const report = await TrendAnalysisService.generateWeeklyTrendReport(region, undefined, false);
      
      let allFormats: any[] = [];
      
      if (platform) {
        // Get formats for specific platform
        const platformData = report.platforms[platform as keyof typeof report.platforms];
        if (platformData) {
          allFormats = platformData.contentFormats.map(f => ({ ...f, platform }));
        }
      } else {
        // Get formats from all platforms
        Object.entries(report.platforms).forEach(([platformName, data]) => {
          if (data && data.contentFormats) {
            allFormats.push(...data.contentFormats.map(f => ({ ...f, platform: platformName })));
          }
        });
      }
      
      // Sort by engagement rate
      const sortedFormats = allFormats.sort((a, b) => b.engagement_rate - a.engagement_rate);
      
      res.json({
        success: true,
        data: {
          formats: sortedFormats,
          total: sortedFormats.length,
          generated_at: report.generated_at
        },
        message: 'Content format recommendations retrieved successfully'
      });
      
    } catch (error) {
      console.error('❌ Error getting content formats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get content formats',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      });
    }
  }
);

// Get post ideas based on trends
router.get('/post-ideas',
  authenticateToken,
  async (req: any, res) => {
    try {
      const region = req.query.region || 'global';
      const platform = req.query.platform;
      const industry = req.query.industry;
      const limit = parseInt(req.query.limit as string) || 10;
      
      console.log('💡 Getting post ideas:', { region, platform, industry, limit });
      
      const report = await TrendAnalysisService.generateWeeklyTrendReport(region, industry, false);
      
      let allPostIdeas: any[] = [];
      
      if (platform) {
        // Get post ideas for specific platform
        const platformData = report.platforms[platform as keyof typeof report.platforms];
        if (platformData) {
          allPostIdeas = platformData.postIdeas.map(p => ({ ...p, platform }));
        }
      } else {
        // Get post ideas from all platforms
        Object.entries(report.platforms).forEach(([platformName, data]) => {
          if (data && data.postIdeas) {
            allPostIdeas.push(...data.postIdeas.map(p => ({ ...p, platform: platformName })));
          }
        });
      }
      
      // Sort by estimated engagement and limit results
      const sortedIdeas = allPostIdeas
        .sort((a, b) => b.estimated_engagement - a.estimated_engagement)
        .slice(0, limit);
      
      res.json({
        success: true,
        data: {
          ideas: sortedIdeas,
          total: sortedIdeas.length,
          generated_at: report.generated_at
        },
        message: 'Post ideas retrieved successfully'
      });
      
    } catch (error) {
      console.error('❌ Error getting post ideas:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get post ideas',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      });
    }
  }
);

// Get optimal posting times
router.get('/posting-times',
  authenticateToken,
  async (req: any, res) => {
    try {
      const region = req.query.region || 'global';
      const platform = req.query.platform;
      
      console.log('⏰ Getting optimal posting times:', { region, platform });
      
      const report = await TrendAnalysisService.generateWeeklyTrendReport(region, undefined, false);
      
      let allPostingTimes: any[] = [];
      
      if (platform) {
        // Get posting times for specific platform
        const platformData = report.platforms[platform as keyof typeof report.platforms];
        if (platformData) {
          allPostingTimes = platformData.bestPostingTimes.map(t => ({ ...t, platform }));
        }
      } else {
        // Get posting times from all platforms
        Object.entries(report.platforms).forEach(([platformName, data]) => {
          if (data && data.bestPostingTimes) {
            allPostingTimes.push(...data.bestPostingTimes.map(t => ({ ...t, platform: platformName })));
          }
        });
      }
      
      // Sort by engagement multiplier
      const sortedTimes = allPostingTimes.sort((a, b) => b.engagement_multiplier - a.engagement_multiplier);
      
      res.json({
        success: true,
        data: {
          posting_times: sortedTimes,
          total: sortedTimes.length,
          generated_at: report.generated_at
        },
        message: 'Optimal posting times retrieved successfully'
      });
      
    } catch (error) {
      console.error('❌ Error getting posting times:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get posting times',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      });
    }
  }
);

export default router;