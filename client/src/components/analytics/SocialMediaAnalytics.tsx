import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Download,
  RefreshCw,
  Target,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts';
import { format, subDays } from 'date-fns';
import { socialPostApi, socialAccountApi } from '@/lib/socialMediaApi';

// Removed unused interfaces and constants

export default function SocialMediaAnalytics() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [timeFrame, setTimeFrame] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch social media analytics using React Query
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ['social-analytics', timeFrame],
    queryFn: () => socialPostApi.getSocialMediaAnalytics(timeFrame),
  });

  // Fetch social accounts for platform filtering
  const { data: socialAccounts = [], isLoading: accountsLoading, refetch: refetchAccounts } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: () => socialAccountApi.getSocialAccounts(),
  });

  const isLoading = analyticsLoading || accountsLoading;

  // Transform API data to component format
  const analyticsData = analytics ? [{
    platform: 'all',
    followers: socialAccounts.length * 1000, // Mock data
    engagement: analytics.totalEngagement,
    reach: analytics.totalEngagement * 2, // Mock data
    impressions: analytics.totalEngagement * 3, // Mock data
    posts: analytics.totalPosts,
    growth: 12.5, // Mock data
    topPosts: analytics.topHashtags?.map((hashtag: any, index: number) => ({
      id: `post-${index}`,
      content: `Post with ${hashtag.hashtag}`,
      engagement: hashtag.engagement,
      reach: hashtag.usage * 100,
      publishedAt: new Date().toISOString()
    })) || [],
    engagementBreakdown: {
      likes: Math.floor(analytics.totalEngagement * 0.6),
      comments: Math.floor(analytics.totalEngagement * 0.2),
      shares: Math.floor(analytics.totalEngagement * 0.15),
      saves: Math.floor(analytics.totalEngagement * 0.05)
    },
    dailyStats: Array.from({ length: 30 }, (_, i) => ({
      date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
      followers: socialAccounts.length * 1000 + Math.floor(Math.random() * 100),
      engagement: Math.floor(analytics.totalEngagement / 30) + Math.floor(Math.random() * 50),
      reach: Math.floor(analytics.totalEngagement * 2 / 30) + Math.floor(Math.random() * 100),
      impressions: Math.floor(analytics.totalEngagement * 3 / 30) + Math.floor(Math.random() * 150)
    }))
  }] : [];

  // Calculate performance metrics
  const performanceMetrics = analytics ? {
    totalReach: analytics.totalEngagement * 2,
    totalEngagement: analytics.totalEngagement,
    engagementRate: analytics.averageEngagement,
    growthRate: 12.5, // Mock data
    bestPostingTime: analytics.bestPostingTimes?.[0]?.recommendation || '9:00 AM',
    topPerformingContent: analytics.topHashtags?.[0]?.hashtag || 'Top performing content',
    recommendations: [
      'Post more frequently on weekends',
      'Use trending hashtags for better reach',
      'Engage with comments to boost algorithm',
      'Post during peak hours for maximum engagement'
    ]
  } : null;


  // Handle time frame change
  const handleTimeFrameChange = (frame: '7d' | '30d' | '90d' | '1y') => {
    setTimeFrame(frame);
  };

  // Handle refresh function
  const handleRefresh = () => {
    refetchAnalytics();
    refetchAccounts();
  };

  // Prepare chart data
  const prepareChartData = () => {
    return analyticsData.map(platform => ({
      platform: platform.platform,
      followers: platform.followers,
      engagement: platform.engagement,
      reach: platform.reach,
      impressions: platform.impressions
    }));
  };

  const prepareTimeSeriesData = () => {
    // Combine daily stats from all platforms
    const timeSeriesMap = new Map();

    analyticsData.forEach(platform => {
      platform.dailyStats.forEach(stat => {
        const existing = timeSeriesMap.get(stat.date) || {
          date: stat.date,
          followers: 0,
          engagement: 0,
          reach: 0,
          impressions: 0
        };

        existing.followers += stat.followers;
        existing.engagement += stat.engagement;
        existing.reach += stat.reach;
        existing.impressions += stat.impressions;

        timeSeriesMap.set(stat.date, existing);
      });
    });

    return Array.from(timeSeriesMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Social Media Analytics</h1>
          <p className="text-gray-600">Track performance across all your social platforms</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          {['7d', '30d', '90d', '1y'].map((frame) => (
            <Button
              key={frame}
              variant={timeFrame === frame ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTimeFrameChange(frame as any)}
            >
              {frame}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      {performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceMetrics.totalReach.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +12.5% from last month
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceMetrics.totalEngagement.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +8.2% from last month
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceMetrics.engagementRate.toFixed(1)}%</div>
                <Progress value={performanceMetrics.engagementRate} className="mt-2" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceMetrics.growthRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Best posting time: {performanceMetrics.bestPostingTime}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Platform Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={prepareChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="engagement" fill="#8884d8" name="Engagement" />
                  <Bar dataKey="reach" fill="#82ca9d" name="Reach" />
                  <Bar dataKey="impressions" fill="#ffc658" name="Impressions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Engagement Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData.map((platform) => (
                  <div key={platform.platform} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{platform.platform}</span>
                      <span className="text-sm text-gray-600">{platform.engagement.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-center">
                        <Heart className="h-4 w-4 mx-auto mb-1" />
                        {platform.engagementBreakdown.likes}
                      </div>
                      <div className="text-center">
                        <MessageCircle className="h-4 w-4 mx-auto mb-1" />
                        {platform.engagementBreakdown.comments}
                      </div>
                      <div className="text-center">
                        <Share2 className="h-4 w-4 mx-auto mb-1" />
                        {platform.engagementBreakdown.shares}
                      </div>
                      <div className="text-center">
                        <Zap className="h-4 w-4 mx-auto mb-1" />
                        {platform.engagementBreakdown.saves}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.flatMap(platform => platform.topPosts)
                    .sort((a, b) => b.engagement - a.engagement)
                    .slice(0, 5)
                    .map((post, index) => (
                      <div key={post.id} className="flex items-start space-x-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div className="flex-1">
                          <p className="text-sm line-clamp-2">{post.content}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">{post.engagement} engagements</span>
                            <span className="text-xs text-gray-500">{post.reach} reach</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={prepareTimeSeriesData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="engagement" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="reach" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Insights & Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceMetrics && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Best Posting Time</h4>
                      <p className="text-blue-800">{performanceMetrics.bestPostingTime}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Top Performing Content</h4>
                      <p className="text-green-800 text-sm line-clamp-3">{performanceMetrics.topPerformingContent}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">AI Recommendations</h4>
                    <div className="space-y-2">
                      {performanceMetrics.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                          <p className="text-sm text-gray-700">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Platform</th>
                      <th className="text-right py-2">Followers</th>
                      <th className="text-right py-2">Engagement</th>
                      <th className="text-right py-2">Reach</th>
                      <th className="text-right py-2">Impressions</th>
                      <th className="text-right py-2">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.map((platform) => (
                      <tr key={platform.platform} className="border-b">
                        <td className="py-2 capitalize">{platform.platform}</td>
                        <td className="text-right py-2">{platform.followers.toLocaleString()}</td>
                        <td className="text-right py-2">{platform.engagement.toLocaleString()}</td>
                        <td className="text-right py-2">{platform.reach.toLocaleString()}</td>
                        <td className="text-right py-2">{platform.impressions.toLocaleString()}</td>
                        <td className="text-right py-2">
                          <span className={platform.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {platform.growth >= 0 ? '+' : ''}{platform.growth.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
