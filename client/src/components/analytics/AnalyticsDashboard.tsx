import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  Heart, 
  Download,
  Target,
  Brain,
  PieChart,
  DollarSign,
  Search,
  RefreshCw,
  Sparkles,
  Activity,
  Globe,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Cell,
  Pie
} from 'recharts';

interface AnalyticsData {
  views: number;
  engagement: number;
  subscribers: number;
  revenue: number;
  contentCount: number;
  avgEngagementRate: number;
  topPlatforms: Array<{ platform: string; views: number; engagement: number }>;
  recentContent: Array<{ title: string; views: number; engagement: number; platform: string }>;
  growthMetrics: {
    viewsGrowth: number;
    engagementGrowth: number;
    subscriberGrowth: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AnalyticsDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30D');
  const [activeTab, setActiveTab] = useState('overview');
  const [predictiveInput, setPredictiveInput] = useState({
    content: '',
    platform: 'youtube',
    audience: 'general'
  });
  const [competitorInput, setCompetitorInput] = useState({
    niche: '',
    platform: 'youtube'
  });
  const [monetizationInput, setMonetizationInput] = useState('');
  
  const { toast } = useToast();

  // Fetch analytics performance data
  const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ['analytics-performance', selectedPeriod],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/analytics/performance?period=${selectedPeriod}`);
      const data = await response.json();
      return data.analytics as AnalyticsData;
    },
    retry: false,
  });

  // Predictive analytics mutation
  const predictiveMutation = useMutation({
    mutationFn: async (data: typeof predictiveInput) => {
      const response = await apiRequest('POST', '/api/analytics/predict-performance', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Prediction Complete!",
        description: "AI-powered performance prediction generated.",
      });
    },
    onError: () => {
      toast({
        title: "Prediction Failed",
        description: "Failed to generate performance prediction.",
        variant: "destructive",
      });
    }
  });

  // Competitor analysis mutation
  const competitorMutation = useMutation({
    mutationFn: async (data: typeof competitorInput) => {
      const response = await apiRequest('POST', '/api/analytics/analyze-competitors', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Analysis Complete!",
        description: "Competitor intelligence gathered successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze competitors.",
        variant: "destructive",
      });
    }
  });

  // Monetization strategy mutation
  const monetizationMutation = useMutation({
    mutationFn: async (niche: string) => {
      const response = await apiRequest('POST', '/api/analytics/generate-monetization', {
        content: niche,
        audience: 'general',
        platform: 'youtube'
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Strategy Ready!",
        description: "Monetization strategy generated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Strategy Failed",
        description: "Failed to generate monetization strategy.",
        variant: "destructive",
      });
    }
  });

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!analyticsData) return [];
    
    return analyticsData.topPlatforms.map(platform => ({
      platform: platform.platform,
      views: platform.views,
      engagement: platform.engagement,
      engagementRate: platform.views > 0 ? (platform.engagement / platform.views) * 100 : 0
    }));
  };

  const preparePieData = () => {
    if (!analyticsData) return [];
    
    return analyticsData.topPlatforms.map((platform, index) => ({
      name: platform.platform,
      value: platform.views,
      color: COLORS[index % COLORS.length]
    }));
  };

  if (analyticsLoading) {
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600">Comprehensive insights and AI-powered analytics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7D">7 Days</SelectItem>
              <SelectItem value="30D">30 Days</SelectItem>
              <SelectItem value="90D">90 Days</SelectItem>
              <SelectItem value="1Y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => refetchAnalytics()} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Eye className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-700">Total Views</p>
                    <p className="text-2xl font-bold text-blue-900">{formatNumber(analyticsData.views)}</p>
                    <div className="flex items-center mt-1">
                      {getTrendIcon(analyticsData.growthMetrics.viewsGrowth)}
                      <span className={`text-sm ml-1 ${getTrendColor(analyticsData.growthMetrics.viewsGrowth)}`}>
                        {analyticsData.growthMetrics.viewsGrowth > 0 ? '+' : ''}{analyticsData.growthMetrics.viewsGrowth}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Heart className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-700">Engagement</p>
                    <p className="text-2xl font-bold text-green-900">{formatNumber(analyticsData.engagement)}</p>
                    <div className="flex items-center mt-1">
                      {getTrendIcon(analyticsData.growthMetrics.engagementGrowth)}
                      <span className={`text-sm ml-1 ${getTrendColor(analyticsData.growthMetrics.engagementGrowth)}`}>
                        {analyticsData.growthMetrics.engagementGrowth > 0 ? '+' : ''}{analyticsData.growthMetrics.engagementGrowth}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-purple-700">Subscribers</p>
                    <p className="text-2xl font-bold text-purple-900">{formatNumber(analyticsData.subscribers)}</p>
                    <div className="flex items-center mt-1">
                      {getTrendIcon(analyticsData.growthMetrics.subscriberGrowth)}
                      <span className={`text-sm ml-1 ${getTrendColor(analyticsData.growthMetrics.subscriberGrowth)}`}>
                        {analyticsData.growthMetrics.subscriberGrowth > 0 ? '+' : ''}{analyticsData.growthMetrics.subscriberGrowth}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-orange-700">Revenue</p>
                    <p className="text-2xl font-bold text-orange-900">${analyticsData.revenue.toFixed(2)}</p>
                    <div className="flex items-center mt-1">
                      <Target className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-orange-600 ml-1">{analyticsData.avgEngagementRate}% avg rate</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="predictive">AI Predictions</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="monetization">Monetization</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {analyticsData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Platform Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={prepareChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="platform" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="views" fill="#8884d8" name="Views" />
                      <Bar dataKey="engagement" fill="#82ca9d" name="Engagement" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Platform Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Platform Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={preparePieData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {preparePieData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Recent Content Performance */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Recent Content Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.recentContent.map((content, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">{index + 1}</Badge>
                          <div>
                            <p className="font-medium text-gray-900">{content.title}</p>
                            <p className="text-sm text-gray-600 capitalize">{content.platform}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatNumber(content.views)} views</p>
                          <p className="text-sm text-gray-600">{formatNumber(content.engagement)} engagement</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-900">
                <Brain className="w-5 h-5 mr-2 text-blue-600" />
                AI Performance Prediction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Content Title/Topic</label>
                  <Input
                    placeholder="e.g., Ultimate Guide to AI Tools"
                    value={predictiveInput.content}
                    onChange={(e) => setPredictiveInput(prev => ({ ...prev, content: e.target.value }))}
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Platform</label>
                  <Select 
                    value={predictiveInput.platform} 
                    onValueChange={(value) => setPredictiveInput(prev => ({ ...prev, platform: value }))}
                  >
                    <SelectTrigger className="border-blue-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Target Audience</label>
                  <Select 
                    value={predictiveInput.audience} 
                    onValueChange={(value) => setPredictiveInput(prev => ({ ...prev, audience: value }))}
                  >
                    <SelectTrigger className="border-blue-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="creators">Content Creators</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="tech">Tech Enthusiasts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={() => predictiveMutation.mutate(predictiveInput)}
                disabled={predictiveMutation.isPending || !predictiveInput.content}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {predictiveMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Analyzing Performance...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Predict Performance</span>
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {predictiveMutation.data?.result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-900">Predicted Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {formatNumber(predictiveMutation.data.result.predictedViews)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Confidence: {(predictiveMutation.data.result.confidence * 100).toFixed(0)}%
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900">Engagement Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">
                    {(predictiveMutation.data.result.engagementRate * 100).toFixed(1)}%
                  </p>
                  <Progress value={predictiveMutation.data.result.engagementRate * 100} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardHeader>
                  <CardTitle className="text-purple-900">Viral Potential</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-600">
                    {predictiveMutation.data.result.viralPotential}%
                  </p>
                  <Progress value={predictiveMutation.data.result.viralPotential} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="md:col-span-3 border-gray-200">
                <CardHeader>
                  <CardTitle>AI Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {predictiveMutation.data.result.recommendations?.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <p className="text-sm text-gray-700">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="competitors" className="space-y-6">
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-900">
                <Search className="w-5 h-5 mr-2 text-orange-600" />
                Competitor Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Niche to Analyze</label>
                  <Input
                    placeholder="e.g., tech reviews, cooking, fitness"
                    value={competitorInput.niche}
                    onChange={(e) => setCompetitorInput(prev => ({ ...prev, niche: e.target.value }))}
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Platform</label>
                  <Select 
                    value={competitorInput.platform} 
                    onValueChange={(value) => setCompetitorInput(prev => ({ ...prev, platform: value }))}
                  >
                    <SelectTrigger className="border-orange-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={() => competitorMutation.mutate(competitorInput)}
                disabled={competitorMutation.isPending || !competitorInput.niche}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                {competitorMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Analyzing Competitors...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4" />
                    <span>Analyze Competitor Landscape</span>
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {competitorMutation.data?.result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Top Competitors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {competitorMutation.data.result.topCompetitors?.map((competitor: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{competitor.name}</p>
                            <p className="text-sm text-gray-600">{competitor.strategy}</p>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800">
                            {competitor.followers}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-900">Content Gaps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {competitorMutation.data.result.contentGaps?.map((gap: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <p className="text-sm text-gray-700">{gap}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-purple-200">
                <CardHeader>
                  <CardTitle className="text-purple-900">Winning Strategies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {competitorMutation.data.result.winningStrategies?.map((strategy: string, index: number) => (
                      <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm font-medium text-gray-800">{strategy}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="monetization" className="space-y-6">
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center text-emerald-900">
                <DollarSign className="w-5 h-5 mr-2 text-emerald-600" />
                Monetization Strategy Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Your Content Niche</label>
                <Input
                  placeholder="e.g., tech reviews, cooking, fitness"
                  value={monetizationInput}
                  onChange={(e) => setMonetizationInput(e.target.value)}
                  className="border-emerald-200 focus:border-emerald-400"
                />
              </div>

              <Button
                onClick={() => monetizationMutation.mutate(monetizationInput)}
                disabled={monetizationMutation.isPending || !monetizationInput}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {monetizationMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating Strategy...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>Generate Monetization Strategy</span>
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {monetizationMutation.data?.result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Revenue Projections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {monetizationMutation.data.result.expectedRevenue?.sixMonth}
                        </p>
                        <p className="text-sm text-gray-600">6-Month Projection</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {monetizationMutation.data.result.expectedRevenue?.oneYear}
                        </p>
                        <p className="text-sm text-gray-600">1-Year Projection</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-900">Revenue Streams</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {monetizationMutation.data.result.revenueStreams?.slice(0, 3).map((stream: any, index: number) => (
                        <div key={index} className="p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-gray-900">{stream.type}</p>
                            <Badge className="bg-green-100 text-green-800">
                              {stream.potential}%
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{stream.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-purple-200">
                <CardHeader>
                  <CardTitle className="text-purple-900">Digital Product Ideas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {monetizationMutation.data.result.productIdeas?.map((product: string, index: number) => (
                      <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm font-medium text-gray-800">{product}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-indigo-200">
              <CardHeader>
                <CardTitle className="flex items-center text-indigo-900">
                  <Globe className="h-5 w-5 mr-2 text-indigo-600" />
                  Market Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <h4 className="font-medium text-indigo-900 mb-2">Trending Topics</h4>
                    <div className="space-y-2">
                      <Badge variant="outline">AI & Technology</Badge>
                      <Badge variant="outline">Sustainable Living</Badge>
                      <Badge variant="outline">Remote Work</Badge>
                    </div>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <h4 className="font-medium text-indigo-900 mb-2">Best Posting Times</h4>
                    <p className="text-sm text-gray-700">Weekdays: 2-4 PM, 7-9 PM</p>
                    <p className="text-sm text-gray-700">Weekends: 10 AM-12 PM, 6-8 PM</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-900">
                  <Clock className="h-5 w-5 mr-2 text-yellow-600" />
                  Optimization Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">Use eye-catching thumbnails with bright colors</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">Include trending hashtags in your niche</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">Engage with comments within the first hour</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">Cross-promote content across platforms</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;