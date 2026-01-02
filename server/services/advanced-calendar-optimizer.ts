import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface OptimalTimeSlot {
  time: string;
  engagementScore: number;
  reasoning: string;
  platform: string;
  category: string;
}

interface CalendarOptimizationResult {
  optimizedSchedule: OptimalTimeSlot[];
  insights: {
    bestPerformingTimes: string[];
    platformRecommendations: Record<string, string[]>;
    categoryInsights: Record<string, string>;
  };
  metadata: {
    totalSlots: number;
    averageEngagementScore: number;
    optimizationLevel: 'basic' | 'intermediate' | 'advanced';
  };
}

class AdvancedCalendarOptimizer {
  private openai: OpenAI;
  private gemini: GoogleGenerativeAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
    
    this.gemini = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
  }

  /**
   * Generate optimal posting schedule with advanced AI analysis
   */
  async generateOptimalSchedule(params: {
    platforms: string[];
    categories: string[];
    duration: number; // in days
    contentFrequency: 'daily' | 'alternate' | 'weekly' | 'custom';
    targetAudience: string;
    timezone?: string;
    preferences?: {
      avoidWeekends?: boolean;
      preferEvenings?: boolean;
      maxPostsPerDay?: number;
    };
  }): Promise<CalendarOptimizationResult> {
    try {
      const { platforms, categories, duration, contentFrequency, targetAudience, timezone = 'UTC', preferences = {} } = params;

      // Calculate total content slots needed
      const totalSlots = this.calculateContentSlots(duration, contentFrequency, preferences.maxPostsPerDay);

      // Generate AI-powered optimal times
      const optimalTimes = await this.generateAIOptimalTimes({
        platforms,
        categories,
        targetAudience,
        timezone,
        totalSlots,
        preferences
      });

      // Create optimized schedule
      const optimizedSchedule = this.createOptimizedSchedule(optimalTimes, totalSlots, duration);

      // Generate insights
      const insights = await this.generateScheduleInsights(optimizedSchedule, platforms, categories);

      return {
        optimizedSchedule,
        insights,
        metadata: {
          totalSlots,
          averageEngagementScore: this.calculateAverageEngagementScore(optimizedSchedule),
          optimizationLevel: this.determineOptimizationLevel(optimalTimes.length, platforms.length)
        }
      };
    } catch (error) {
      console.error('Error generating optimal schedule:', error);
      throw new Error('Failed to generate optimal schedule');
    }
  }

  /**
   * Calculate content slots based on frequency and duration
   */
  private calculateContentSlots(duration: number, frequency: string, maxPerDay?: number): number {
    const maxDaily = maxPerDay || 3;
    
    switch (frequency) {
      case 'daily':
        return Math.min(duration, duration * maxDaily);
      case 'alternate':
        return Math.min(Math.ceil(duration / 2), Math.ceil(duration / 2) * maxDaily);
      case 'weekly':
        return Math.min(Math.ceil(duration / 7), Math.ceil(duration / 7) * maxDaily);
      case 'custom':
        return Math.min(duration, duration * maxDaily);
      default:
        return Math.min(duration, duration * maxDaily);
    }
  }

  /**
   * Generate AI-powered optimal posting times
   */
  private async generateAIOptimalTimes(params: {
    platforms: string[];
    categories: string[];
    targetAudience: string;
    timezone: string;
    totalSlots: number;
    preferences: any;
  }): Promise<OptimalTimeSlot[]> {
    const { platforms, categories, targetAudience, timezone, totalSlots, preferences } = params;

    try {
      const prompt = `
        As a social media analytics expert, generate optimal posting times for the following parameters:
        
        Platforms: ${platforms.join(', ')}
        Categories: ${categories.join(', ')}
        Target Audience: ${targetAudience}
        Timezone: ${timezone}
        Total Content Slots: ${totalSlots}
        Preferences: ${JSON.stringify(preferences)}
        
        For each platform and category combination, provide:
        1. 3-5 optimal time slots with engagement scores (0-100)
        2. Reasoning for each time slot
        3. Consider platform-specific audience behavior
        4. Account for timezone differences
        5. Factor in content category performance patterns
        
        Return as JSON array:
        [
          {
            "time": "09:00",
            "engagementScore": 85,
            "reasoning": "Peak morning engagement for professional content",
            "platform": "linkedin",
            "category": "business"
          },
          ...
        ]
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a social media analytics expert with access to real-time platform data and audience behavior insights. Provide data-driven recommendations for optimal posting times.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No optimal times generated');

      return JSON.parse(content);
    } catch (error) {
      console.error('Error generating AI optimal times:', error);
      return this.getFallbackOptimalTimes(platforms, categories, totalSlots);
    }
  }

  /**
   * Create optimized schedule from optimal times
   */
  private createOptimizedSchedule(optimalTimes: OptimalTimeSlot[], totalSlots: number, duration: number): OptimalTimeSlot[] {
    const schedule: OptimalTimeSlot[] = [];
    const slotsPerDay = Math.ceil(totalSlots / duration);
    
    // Sort optimal times by engagement score
    const sortedTimes = optimalTimes.sort((a, b) => b.engagementScore - a.engagementScore);
    
    // Distribute slots across duration
    for (let day = 0; day < duration; day++) {
      const daySlots = Math.min(slotsPerDay, totalSlots - schedule.length);
      
      for (let slot = 0; slot < daySlots; slot++) {
        const timeIndex = (day * slotsPerDay + slot) % sortedTimes.length;
        const selectedTime = sortedTimes[timeIndex];
        
        schedule.push({
          ...selectedTime,
          time: this.adjustTimeForDay(selectedTime.time, day)
        });
      }
    }
    
    return schedule.slice(0, totalSlots);
  }

  /**
   * Adjust time for specific day (add variety)
   */
  private adjustTimeForDay(time: string, day: number): string {
    const [hours, minutes] = time.split(':').map(Number);
    const variation = (day % 3) * 30; // Add 0, 30, or 60 minutes variation
    const newMinutes = minutes + variation;
    
    if (newMinutes >= 60) {
      return `${(hours + 1) % 24}:${(newMinutes - 60).toString().padStart(2, '0')}`;
    }
    
    return `${hours}:${newMinutes.toString().padStart(2, '0')}`;
  }

  /**
   * Generate insights about the optimized schedule
   */
  private async generateScheduleInsights(schedule: OptimalTimeSlot[], platforms: string[], categories: string[]): Promise<any> {
    const bestPerformingTimes = schedule
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 5)
      .map(slot => slot.time);

    const platformRecommendations: Record<string, string[]> = {};
    platforms.forEach(platform => {
      const platformSlots = schedule.filter(slot => slot.platform === platform);
      platformRecommendations[platform] = platformSlots
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, 3)
        .map(slot => slot.time);
    });

    const categoryInsights: Record<string, string> = {};
    categories.forEach(category => {
      const categorySlots = schedule.filter(slot => slot.category === category);
      const avgScore = categorySlots.reduce((sum, slot) => sum + slot.engagementScore, 0) / categorySlots.length;
      
      if (avgScore > 80) {
        categoryInsights[category] = `Excellent performance expected for ${category} content`;
      } else if (avgScore > 60) {
        categoryInsights[category] = `Good performance expected for ${category} content`;
      } else {
        categoryInsights[category] = `Moderate performance expected for ${category} content`;
      }
    });

    return {
      bestPerformingTimes,
      platformRecommendations,
      categoryInsights
    };
  }

  /**
   * Calculate average engagement score
   */
  private calculateAverageEngagementScore(schedule: OptimalTimeSlot[]): number {
    if (schedule.length === 0) return 0;
    return schedule.reduce((sum, slot) => sum + slot.engagementScore, 0) / schedule.length;
  }

  /**
   * Determine optimization level based on data quality
   */
  private determineOptimizationLevel(timeSlots: number, platformCount: number): 'basic' | 'intermediate' | 'advanced' {
    if (timeSlots >= 20 && platformCount >= 3) return 'advanced';
    if (timeSlots >= 10 && platformCount >= 2) return 'intermediate';
    return 'basic';
  }

  /**
   * Fallback optimal times when AI fails
   */
  private getFallbackOptimalTimes(platforms: string[], categories: string[], totalSlots: number): OptimalTimeSlot[] {
    const fallbackTimes: OptimalTimeSlot[] = [];
    const baseTimes = ['09:00', '12:00', '15:00', '18:00', '20:00'];
    
    let slotIndex = 0;
    for (const platform of platforms) {
      for (const category of categories) {
        if (slotIndex >= totalSlots) break;
        
        const time = baseTimes[slotIndex % baseTimes.length];
        fallbackTimes.push({
          time,
          engagementScore: 70 + Math.random() * 20,
          reasoning: `Standard optimal time for ${platform} ${category} content`,
          platform,
          category
        });
        slotIndex++;
      }
    }
    
    return fallbackTimes.slice(0, totalSlots);
  }

  /**
   * Get platform-specific optimal times
   */
  async getPlatformOptimalTimes(platform: string, category: string, timezone: string = 'UTC'): Promise<string[]> {
    try {
      const prompt = `
        Provide the top 5 optimal posting times for ${platform} ${category} content in ${timezone} timezone.
        Consider platform-specific audience behavior and content category performance.
        
        Return as JSON array of time strings in HH:MM format:
        ["09:00", "12:00", "15:00", "18:00", "20:00"]
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a social media analytics expert. Provide data-driven optimal posting times.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 200
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No optimal times generated');

      return JSON.parse(content);
    } catch (error) {
      console.error('Error getting platform optimal times:', error);
      return ['09:00', '12:00', '15:00', '18:00', '20:00'];
    }
  }

  /**
   * Analyze engagement patterns and suggest improvements
   */
  async analyzeEngagementPatterns(historicalData: any[]): Promise<{
    insights: string[];
    recommendations: string[];
    optimalTimes: Record<string, string[]>;
  }> {
    try {
      const prompt = `
        Analyze the following social media engagement data and provide insights:
        
        Historical Data: ${JSON.stringify(historicalData)}
        
        Provide:
        1. Key insights about engagement patterns
        2. Specific recommendations for improvement
        3. Optimal posting times for each platform
        
        Return as JSON:
        {
          "insights": ["insight1", "insight2", ...],
          "recommendations": ["rec1", "rec2", ...],
          "optimalTimes": {
            "platform1": ["time1", "time2", ...],
            "platform2": ["time1", "time2", ...]
          }
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a social media analytics expert. Analyze engagement data and provide actionable insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No analysis generated');

      return JSON.parse(content);
    } catch (error) {
      console.error('Error analyzing engagement patterns:', error);
      return {
        insights: ['Insufficient data for analysis'],
        recommendations: ['Collect more engagement data for better insights'],
        optimalTimes: {}
      };
    }
  }
}

export default AdvancedCalendarOptimizer;
