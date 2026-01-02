import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share,
  Download,
  Filter,
  Calendar,
  Target,
  Zap,
  Brain,
  PieChart,
  LineChart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
  reach: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

interface TrendData {
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface AudienceInsight {
  category: string;
  value: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

interface CompetitorAnalysis {
  name: string;
  followers: number;
  engagementRate: number;
  growthRate: number;
  topContent: string[];
}

interface PredictionData {
  metric: string;
  current: number;
  predicted: number;
  confidence: number;
  timeframe: string;
}

export const AdvancedAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [audienceInsights, setAudienceInsights] = useState<AudienceInsight[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorAnalysis[]>([]);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const { toast } = useToast();

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeframe]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Mock data - in production, fetch from API
      const mockAnalytics: AnalyticsData = {
        views: 125000,
        likes: 8500,
        comments: 1200,
        shares: 2100,
        engagement: 0.085,
        reach: 45000,
        impressions: 180000,
        clicks: 3200,
        conversions: 180,
        revenue: 2500
      };

      const mockTrends: TrendData[] = [
        { name: 'Views', value: 125000, change: 12.5, trend: 'up' },
        { name: 'Engagement', value: 8.5, change: -2.3, trend: 'down' },
        { name: 'Reach', value: 45000, change: 18.7, trend: 'up' },
        { name: 'Revenue', value: 2500, change: 25.4, trend: 'up' }
      ];

      const mockAudienceInsights: AudienceInsight[] = [
        { category: '18-24', value: 31250, percentage: 25, trend: 'up' },
        { category: '25-34', value: 43750, percentage: 35, trend: 'stable' },
        { category: '35-44', value: 31250, percentage: 25, trend: 'down' },
        { category: '45-54', value: 18750, percentage: 15, trend: 'up' }
      ];

      const mockCompetitors: CompetitorAnalysis[] = [
        {
          name: 'Competitor A',
          followers: 100000,
          engagementRate: 0.08,
          growthRate: 0.15,
          topContent: ['How-to videos', 'Behind the scenes', 'Product reviews']
        },
        {
          name: 'Competitor B',
          followers: 75000,
          engagementRate: 0.12,
          growthRate: 0.22,
          topContent: ['Tutorials', 'Live streams', 'User testimonials']
        },
        {
          name: 'Competitor C',
          followers: 50000,
          engagementRate: 0.06,
          growthRate: 0.08,
          topContent: ['Educational content', 'Industry news', 'Expert interviews']
        }
      ];

      const mockPredictions: PredictionData[] = [
        {
          metric: 'Views',
          current: 125000,
          predicted: 145000,
          confidence: 0.85,
          timeframe: '30 days'
        },
        {
          metric: 'Engagement',
          current: 8.5,
          predicted: 9.2,
          confidence: 0.78,
          timeframe: '30 days'
        },
        {
          metric: 'Revenue',
          current: 2500,
          predicted: 3200,
          confidence: 0.82,
          timeframe: '30 days'
        }
      ];

      setAnalyticsData(mockAnalytics);
      setTrends(mockTrends);
      setAudienceInsights(mockAudienceInsights);
      setCompetitors(mockCompetitors);
      setPredictions(mockPredictions);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async (format: 'csv' | 'json' | 'xlsx') => {
    try {
      // Mock export functionality
      toast({
        title: 'Export Started',
        description: `Exporting data in ${format.toUpperCase()} format...`
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export analytics data',
        variant: 'destructive'
      });
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-gray-600">Comprehensive insights and predictions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            {selectedTimeframe}
          </Button>
          <Button size="sm" onClick={() => exportData('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold">{formatNumber(analyticsData?.views || 0)}</p>
                <div className="flex items-center mt-1">
                  {getTrendIcon('up')}
                  <span className="text-sm text-green-600 ml-1">+12.5%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                <p className="text-2xl font-bold">{(analyticsData?.engagement || 0) * 100}%</p>
                <div className="flex items-center mt-1">
                  {getTrendIcon('down')}
                  <span className="text-sm text-red-600 ml-1">-2.3%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reach</p>
                <p className="text-2xl font-bold">{formatNumber(analyticsData?.reach || 0)}</p>
                <div className="flex items-center mt-1">
                  {getTrendIcon('up')}
                  <span className="text-sm text-green-600 ml-1">+18.7%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold">${formatNumber(analyticsData?.revenue || 0)}</p>
                <div className="flex items-center mt-1">
                  {getTrendIcon('up')}
                  <span className="text-sm text-green-600 ml-1">+25.4%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trends.map((trend) => (
                    <div key={trend.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                        <span className="font-medium">{trend.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{formatNumber(trend.value)}</span>
                        <div className="flex items-center">
                          {getTrendIcon(trend.trend)}
                          <span className={`text-sm ml-1 ${getTrendColor(trend.trend)}`}>
                            {trend.change > 0 ? '+' : ''}{trend.change}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Engagement Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Engagement Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Heart className="h-4 w-4 text-red-500 mr-2" />
                      <span>Likes</span>
                    </div>
                    <span className="font-semibold">{formatNumber(analyticsData?.likes || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MessageCircle className="h-4 w-4 text-blue-500 mr-2" />
                      <span>Comments</span>
                    </div>
                    <span className="font-semibold">{formatNumber(analyticsData?.comments || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Share className="h-4 w-4 text-green-500 mr-2" />
                      <span>Shares</span>
                    </div>
                    <span className="font-semibold">{formatNumber(analyticsData?.shares || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 text-purple-500 mr-2" />
                      <span>Impressions</span>
                    </div>
                    <span className="font-semibold">{formatNumber(analyticsData?.impressions || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Audience Demographics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {audienceInsights.map((insight) => (
                  <div key={insight.category} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{insight.category}</span>
                      <div className="flex items-center">
                        {getTrendIcon(insight.trend)}
                        <span className="text-sm ml-1">{insight.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${insight.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{formatNumber(insight.value)} users</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitors.map((competitor) => (
              <Card key={competitor.name}>
                <CardHeader>
                  <CardTitle>{competitor.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Followers</span>
                      <span className="font-semibold">{formatNumber(competitor.followers)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Engagement</span>
                      <span className="font-semibold">{(competitor.engagementRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Growth</span>
                      <span className="font-semibold text-green-600">+{(competitor.growthRate * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Top Content</p>
                      <div className="space-y-1">
                        {competitor.topContent.slice(0, 2).map((content, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {content}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                AI Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.map((prediction) => (
                  <div key={prediction.metric} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{prediction.metric}</span>
                      <Badge variant="outline">
                        {(prediction.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Current</p>
                        <p className="font-semibold">{formatNumber(prediction.current)}</p>
                      </div>
                      <div className="text-center">
                        <Zap className="h-4 w-4 text-yellow-500 mx-auto" />
                        <p className="text-xs text-gray-600 mt-1">Predicted</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Future</p>
                        <p className="font-semibold text-green-600">{formatNumber(prediction.predicted)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Timeframe: {prediction.timeframe}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
