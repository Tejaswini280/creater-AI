import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdvancedCalendarOptimizer from '../advanced-calendar-optimizer';

// Mock OpenAI
vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify([
                {
                  time: '09:00',
                  engagementScore: 85,
                  reasoning: 'Peak morning engagement for professional content',
                  platform: 'linkedin',
                  category: 'business'
                },
                {
                  time: '12:00',
                  engagementScore: 80,
                  reasoning: 'Lunch break engagement',
                  platform: 'linkedin',
                  category: 'business'
                }
              ])
            }
          }]
        })
      }
    }
  }))
}));

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({}))
}));

describe('AdvancedCalendarOptimizer', () => {
  let optimizer: AdvancedCalendarOptimizer;

  beforeEach(() => {
    optimizer = new AdvancedCalendarOptimizer();
  });

  describe('generateOptimalSchedule', () => {
    it('should generate optimal schedule with valid parameters', async () => {
      const params = {
        platforms: ['instagram', 'linkedin'],
        categories: ['fitness', 'business'],
        duration: 7,
        contentFrequency: 'daily' as const,
        targetAudience: 'Young professionals',
        timezone: 'UTC',
        preferences: {
          avoidWeekends: false,
          preferEvenings: false,
          maxPostsPerDay: 3
        }
      };

      const result = await optimizer.generateOptimalSchedule(params);

      expect(result).toHaveProperty('optimizedSchedule');
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('metadata');
      expect(result.optimizedSchedule).toBeInstanceOf(Array);
      expect(result.insights).toHaveProperty('bestPerformingTimes');
      expect(result.insights).toHaveProperty('platformRecommendations');
      expect(result.insights).toHaveProperty('categoryInsights');
      expect(result.metadata).toHaveProperty('totalSlots');
      expect(result.metadata).toHaveProperty('averageEngagementScore');
      expect(result.metadata).toHaveProperty('optimizationLevel');
    });

    it('should handle different content frequencies correctly', async () => {
      const dailyParams = {
        platforms: ['instagram'],
        categories: ['fitness'],
        duration: 7,
        contentFrequency: 'daily' as const,
        targetAudience: 'Fitness enthusiasts'
      };

      const alternateParams = {
        platforms: ['instagram'],
        categories: ['fitness'],
        duration: 7,
        contentFrequency: 'alternate' as const,
        targetAudience: 'Fitness enthusiasts'
      };

      const dailyResult = await optimizer.generateOptimalSchedule(dailyParams);
      const alternateResult = await optimizer.generateOptimalSchedule(alternateParams);

      expect(dailyResult.metadata.totalSlots).toBeGreaterThan(alternateResult.metadata.totalSlots);
    });

    it('should respect maxPostsPerDay preference', async () => {
      const params = {
        platforms: ['instagram'],
        categories: ['fitness'],
        duration: 7,
        contentFrequency: 'daily' as const,
        targetAudience: 'Fitness enthusiasts',
        preferences: {
          maxPostsPerDay: 1
        }
      };

      const result = await optimizer.generateOptimalSchedule(params);
      expect(result.metadata.totalSlots).toBeLessThanOrEqual(7);
    });
  });

  describe('getPlatformOptimalTimes', () => {
    it('should return optimal times for a specific platform and category', async () => {
      const result = await optimizer.getPlatformOptimalTimes('linkedin', 'business', 'UTC');
      
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toMatch(/^\d{2}:\d{2}$/); // Should be in HH:MM format
    });

    it('should handle different timezones', async () => {
      const utcResult = await optimizer.getPlatformOptimalTimes('instagram', 'fitness', 'UTC');
      const estResult = await optimizer.getPlatformOptimalTimes('instagram', 'fitness', 'America/New_York');
      
      expect(utcResult).toBeInstanceOf(Array);
      expect(estResult).toBeInstanceOf(Array);
    });
  });

  describe('analyzeEngagementPatterns', () => {
    it('should analyze engagement patterns from historical data', async () => {
      const historicalData = [
        { platform: 'instagram', time: '09:00', engagement: 85 },
        { platform: 'instagram', time: '18:00', engagement: 92 },
        { platform: 'linkedin', time: '12:00', engagement: 78 }
      ];

      const result = await optimizer.analyzeEngagementPatterns(historicalData);

      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('optimalTimes');
      expect(result.insights).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it('should handle empty historical data', async () => {
      const result = await optimizer.analyzeEngagementPatterns([]);

      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('optimalTimes');
    });
  });

  describe('calculateContentSlots', () => {
    it('should calculate correct number of slots for daily frequency', () => {
      const optimizer = new AdvancedCalendarOptimizer();
      // Access private method through any type
      const calculateSlots = (optimizer as any).calculateContentSlots;
      
      const dailySlots = calculateSlots(7, 'daily', 3);
      expect(dailySlots).toBe(7); // 7 days, max 3 per day = 7 slots

      const weeklySlots = calculateSlots(14, 'weekly', 2);
      expect(weeklySlots).toBe(4); // 14 days / 7 = 2 weeks, max 2 per week = 4 slots
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock OpenAI to throw an error
      const mockOpenAI = vi.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockRejectedValue(new Error('API Error'))
          }
        }
      }));
      
      vi.doMock('openai', () => ({
        OpenAI: mockOpenAI
      }));

      const params = {
        platforms: ['instagram'],
        categories: ['fitness'],
        duration: 7,
        contentFrequency: 'daily' as const,
        targetAudience: 'Fitness enthusiasts'
      };

      // Should not throw, should return fallback data
      const result = await optimizer.generateOptimalSchedule(params);
      expect(result).toHaveProperty('optimizedSchedule');
      expect(result.optimizedSchedule.length).toBeGreaterThan(0);
    });
  });
});
