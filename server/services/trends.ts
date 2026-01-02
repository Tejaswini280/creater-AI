import { EventEmitter } from 'events';

export interface TrendData {
  name: string;
  category: string;
  platform: string;
  growthRate: number;
  volume: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  keywords: string[];
  hashtags: string[];
  relatedTrends: string[];
  peakTime?: Date;
  duration: number;
  engagement: number;
  reach: number;
}

export interface TrendAnalysis {
  trend: TrendData;
  opportunity: 'high' | 'medium' | 'low';
  relevance: number;
  suggestedContent: string[];
  optimalTiming: Date;
  riskLevel: 'low' | 'medium' | 'high';
  competitors: string[];
}

export interface TrendingTopicsRequest {
  niche: string;
  platform: string;
  timeframe: 'daily' | 'weekly' | 'monthly';
  limit?: number;
  minGrowthRate?: number;
  excludeTrends?: string[];
}

export class TrendsService extends EventEmitter {
  private trendsCache: Map<string, TrendData[]> = new Map();
  private updateInterval: NodeJS.Timeout;

  constructor() {
    super();
    this.startTrendUpdates();
  }

  async getTrendingTopics(request: TrendingTopicsRequest): Promise<TrendData[]> {
    const cacheKey = this.generateCacheKey(request);
    
    if (this.trendsCache.has(cacheKey)) {
      const cached = this.trendsCache.get(cacheKey)!;
      if (this.isCacheValid(cached)) {
        return this.filterTrends(cached, request);
      }
    }

    const trends = await this.fetchTrendingTopics(request);
    this.trendsCache.set(cacheKey, trends);
    
    return this.filterTrends(trends, request);
  }

  async analyzeTrend(trendName: string, platform: string): Promise<TrendAnalysis> {
    const trend = await this.getTrendData(trendName, platform);
    if (!trend) {
      throw new Error(`Trend ${trendName} not found for platform ${platform}`);
    }

          return {
      trend,
      opportunity: this.assessOpportunity(trend),
      relevance: this.calculateRelevance(trend),
      suggestedContent: this.generateContentSuggestions(trend),
      optimalTiming: this.calculateOptimalTiming(trend),
      riskLevel: this.assessRisk(trend),
      competitors: await this.identifyCompetitors(trend)
    };
  }

  private async fetchTrendingTopics(request: TrendingTopicsRequest): Promise<TrendData[]> {
    const mockTrends: TrendData[] = [
      {
        name: 'AI Content Creation',
        category: 'technology',
        platform: request.platform,
        growthRate: 0.85,
        volume: 15000,
        sentiment: 'positive',
        keywords: ['AI', 'content', 'creation', 'automation', 'tools'],
        hashtags: ['#AIContent', '#ContentCreation', '#Automation', '#TechTrends'],
        relatedTrends: ['ChatGPT', 'Content Marketing', 'Digital Tools'],
        peakTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        duration: 7,
        engagement: 0.12,
        reach: 50000
      }
    ];

    if (request.niche) {
      return mockTrends.filter(trend => 
        trend.category === request.niche || 
        trend.keywords.some(keyword => 
          keyword.toLowerCase().includes(request.niche.toLowerCase())
        )
      );
    }

    return mockTrends;
  }

  private async getTrendData(trendName: string, platform: string): Promise<TrendData | null> {
    const trends = await this.fetchTrendingTopics({
      niche: '',
      platform,
      timeframe: 'daily'
    });

    return trends.find(trend => 
      trend.name.toLowerCase() === trendName.toLowerCase()
    ) || null;
  }

  private assessOpportunity(trend: TrendData): 'high' | 'medium' | 'low' {
    const score = (trend.growthRate * 0.4) + (trend.engagement * 0.3) + (trend.volume / 20000 * 0.3);
    
    if (score > 0.7) return 'high';
    if (score > 0.4) return 'medium';
    return 'low';
  }

  private calculateRelevance(trend: TrendData): number {
    let relevance = 0.5;
    
    if (trend.engagement > 0.1) relevance += 0.2;
    if (trend.sentiment === 'positive') relevance += 0.2;
    if (trend.duration < 7) relevance += 0.1;
    
    return Math.min(1, relevance);
  }

  private generateContentSuggestions(trend: TrendData): string[] {
    return [
      `How-to guide about ${trend.name}`,
      `Latest updates on ${trend.name}`,
      `Expert opinion on ${trend.name}`,
      `Beginner's guide to ${trend.name}`
    ];
  }

  private calculateOptimalTiming(trend: TrendData): Date {
    return trend.peakTime || new Date(Date.now() + 2 * 60 * 60 * 1000);
  }

  private assessRisk(trend: TrendData): 'low' | 'medium' | 'high' {
    let riskScore = 0;
    
    if (trend.growthRate > 0.8) riskScore += 0.3;
    if (trend.duration < 3) riskScore += 0.4;
    if (trend.sentiment === 'negative') riskScore += 0.3;
    
    if (riskScore > 0.6) return 'high';
    if (riskScore > 0.3) return 'medium';
    return 'low';
  }

  private async identifyCompetitors(trend: TrendData): Promise<string[]> {
    return ['Competitor A', 'Competitor B', 'Competitor C'];
  }

  private startTrendUpdates(): void {
    this.updateInterval = setInterval(async () => {
      await this.updateTrendsCache();
    }, 15 * 60 * 1000);
  }

  private async updateTrendsCache(): Promise<void> {
    for (const [key, trends] of this.trendsCache.entries()) {
      if (!this.isCacheValid(trends)) {
        this.trendsCache.delete(key);
      }
    }

    this.emit('trendsUpdated', {
      timestamp: new Date(),
      cacheSize: this.trendsCache.size
    });
  }

  private generateCacheKey(request: TrendingTopicsRequest): string {
    return `${request.niche}_${request.platform}_${request.timeframe}`;
  }

  private isCacheValid(trends: TrendData[]): boolean {
    const maxAge = 10 * 60 * 1000;
    return trends.length > 0 && 
           (Date.now() - trends[0].peakTime!.getTime()) < maxAge;
  }

  private filterTrends(trends: TrendData[], request: TrendingTopicsRequest): TrendData[] {
    let filtered = trends;

    if (request.minGrowthRate) {
      filtered = filtered.filter(trend => trend.growthRate >= request.minGrowthRate);
    }

    if (request.excludeTrends) {
      filtered = filtered.filter(trend => 
        !request.excludeTrends!.includes(trend.name)
      );
    }

    if (request.limit) {
      filtered = filtered.slice(0, request.limit);
    }

    return filtered.sort((a, b) => b.growthRate - a.growthRate);
  }

  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.removeAllListeners();
  }
}