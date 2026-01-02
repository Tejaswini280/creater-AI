import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  TrendingUp,
  Hash,
  Music,
  Calendar,
  Clock,
  Lightbulb,
  BarChart3,
  Globe,
  Target,
  Loader2,
  Download,
  RefreshCw,
  ArrowLeft,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Twitter,
  Smartphone
} from "lucide-react";
import { useLocation } from "wouter";

interface TrendData {
  platform: string;
  trendingAudio: Array<{
    title: string;
    artist?: string;
    usage_count: number;
    engagement_rate: number;
    trend_velocity: 'rising' | 'stable' | 'declining';
    genre?: string;
  }>;
  trendingHashtags: Array<{
    hashtag: string;
    usage_count: number;
    engagement_rate: number;
    trend_velocity: 'rising' | 'stable' | 'declining';
    category?: string;
  }>;
  contentFormats: Array<{
    format: string;
    description: string;
    engagement_rate: number;
    best_practices: string[];
    examples: string[];
  }>;
  postIdeas: Array<{
    title: string;
    caption: string;
    visual_format: string;
    cta?: string;
    estimated_engagement: number;
  }>;
  metrics: {
    engagement_rate: number;
    reach_potential: number;
    virality_score: number;
    growth_velocity: number;
  };
  bestPostingTimes: Array<{
    day: string;
    time: string;
    engagement_multiplier: number;
  }>;
}

interface WeeklyTrendReport {
  week: string;
  generated_at: string;
  platforms: {
    instagram: TrendData;
    facebook: TrendData;
    linkedin: TrendData;
    youtube: TrendData;
    twitter: TrendData;
    tiktok: TrendData;
  };
  contentCalendar: Array<{
    date: string;
    platform: string;
    content_type: string;
    trend_reference: string;
    posting_idea: string;
    best_time: string;
  }>;
  regionalInsights?: {
    region: string;
    trending_topics: string[];
    cultural_context: string[];
  };
  competitorAnalysis?: {
    top_performing_content: string[];
    hashtag_strategies: string[];
    posting_patterns: string[];
  };
}

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { value: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
  { value: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-600' },
  { value: 'twitter', label: 'Twitter/X', icon: Twitter, color: 'text-black' },
  { value: 'tiktok', label: 'TikTok', icon: Smartphone, color: 'text-black' },
];

const REGIONS = [
  { value: 'global', label: 'Global' },
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'india', label: 'India' },
  { value: 'canada', label: 'Canada' },
  { value: 'australia', label: 'Australia' },
];

const INDUSTRIES = [
  { value: 'fitness', label: 'Fitness & Health' },
  { value: 'tech', label: 'Technology' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'business', label: 'Business' },
  { value: 'education', label: 'Education' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'food', label: 'Food & Beverage' },
  { value: 'fashion', label: 'Fashion & Beauty' },
  { value: 'travel', label: 'Travel' },
  { value: 'finance', label: 'Finance' },
];

export default function TrendAnalysis() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [trendReport, setTrendReport] = useState<WeeklyTrendReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('global');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [includeCompetitorAnalysis, setIncludeCompetitorAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Check authentication
  if (!isLoading && !isAuthenticated) {
    setLocation('/login');
    return null;
  }

  const generateTrendReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/trends/weekly-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          region: selectedRegion,
          industry: selectedIndustry || undefined,
          includeCompetitorAnalysis,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate trend report');
      }

      const data = await response.json();
      setTrendReport(data.data);
      
      toast({
        title: "Trend Report Generated!",
        description: "Your comprehensive social media trend analysis is ready.",
      });
    } catch (error) {
      console.error('Error generating trend report:', error);
      toast({
        title: "Error",
        description: "Failed to generate trend report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getTrendVelocityColor = (velocity: string) => {
    switch (velocity) {
      case 'rising': return 'text-green-600 bg-green-50';
      case 'stable': return 'text-blue-600 bg-blue-50';
      case 'declining': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPlatformIcon = (platform: string) => {
    const platformData = PLATFORMS.find(p => p.value === platform);
    if (!platformData) return Globe;
    return platformData.icon;
  };

  const getPlatformColor = (platform: string) => {
    const platformData = PLATFORMS.find(p => p.value === platform);
    return platformData?.color || 'text-gray-600';
  };

  const exportReport = () => {
    if (!trendReport) return;
    
    const dataStr = JSON.stringify(trendReport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `trend-report-${trendReport.week.replace(/\s+/g, '-').toLowerCase()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  Social Media Trend Analysis
                </h1>
                <p className="text-sm text-gray-600">Real-time trends and actionable content strategies</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {trendReport && (
                <Button
                  variant="outline"
                  onClick={exportReport}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </Button>
              )}
              <Badge variant="outline" className="text-sm px-3 py-1">
                AI-Powered Analysis
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Configuration Panel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Analysis Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <Label htmlFor="region">Region</Label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="industry">Industry (Optional)</Label>
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Industries</SelectItem>
                    {INDUSTRIES.map((industry) => (
                      <SelectItem key={industry.value} value={industry.value}>
                        {industry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="platform">Platform Focus</Label>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    {PLATFORMS.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        {platform.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={generateTrendReport}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="competitor-analysis"
                checked={includeCompetitorAnalysis}
                onChange={(e) => setIncludeCompetitorAnalysis(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="competitor-analysis" className="text-sm">
                Include competitor analysis (requires industry selection)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Trend Report Display */}
        {trendReport && (
          <div className="space-y-6">
            {/* Report Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {trendReport.week} - Trend Analysis Report
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Generated on {new Date(trendReport.generated_at).toLocaleDateString()} at{' '}
                      {new Date(trendReport.generated_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {selectedRegion.toUpperCase()} • {selectedIndustry || 'All Industries'}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Tabs for Different Views */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
                <TabsTrigger value="audio">Audio</TabsTrigger>
                <TabsTrigger value="formats">Formats</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(trendReport.platforms).map(([platform, data]) => {
                    if (selectedPlatform !== 'all' && selectedPlatform !== platform) return null;
                    
                    const IconComponent = getPlatformIcon(platform);
                    const colorClass = getPlatformColor(platform);
                    
                    return (
                      <Card key={platform}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 capitalize">
                            <IconComponent className={`h-5 w-5 ${colorClass}`} />
                            {platform}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                  {data.metrics.engagement_rate}%
                                </div>
                                <div className="text-xs text-gray-600">Engagement Rate</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                  {data.metrics.virality_score}
                                </div>
                                <div className="text-xs text-gray-600">Virality Score</div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-sm mb-2">Top Trending Hashtags</h4>
                              <div className="flex flex-wrap gap-1">
                                {data.trendingHashtags.slice(0, 3).map((hashtag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {hashtag.hashtag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-sm mb-2">Best Posting Time</h4>
                              <div className="text-sm text-gray-600">
                                {data.bestPostingTimes[0]?.day} at {data.bestPostingTimes[0]?.time}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Hashtags Tab */}
              <TabsContent value="hashtags" className="space-y-6">
                {Object.entries(trendReport.platforms).map(([platform, data]) => {
                  if (selectedPlatform !== 'all' && selectedPlatform !== platform) return null;
                  
                  const IconComponent = getPlatformIcon(platform);
                  const colorClass = getPlatformColor(platform);
                  
                  return (
                    <Card key={platform}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 capitalize">
                          <IconComponent className={`h-5 w-5 ${colorClass}`} />
                          {platform} - Trending Hashtags
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {data.trendingHashtags.map((hashtag, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-medium">{hashtag.hashtag}</div>
                                <div className="text-sm text-gray-600">
                                  {hashtag.usage_count.toLocaleString()} uses • {hashtag.engagement_rate}% engagement
                                </div>
                              </div>
                              <Badge className={getTrendVelocityColor(hashtag.trend_velocity)}>
                                {hashtag.trend_velocity}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>

              {/* Audio Tab */}
              <TabsContent value="audio" className="space-y-6">
                {Object.entries(trendReport.platforms).map(([platform, data]) => {
                  if (selectedPlatform !== 'all' && selectedPlatform !== platform) return null;
                  
                  const IconComponent = getPlatformIcon(platform);
                  const colorClass = getPlatformColor(platform);
                  
                  return (
                    <Card key={platform}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 capitalize">
                          <IconComponent className={`h-5 w-5 ${colorClass}`} />
                          {platform} - Trending Audio
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {data.trendingAudio.map((audio, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <Music className="h-8 w-8 text-purple-600 bg-purple-100 rounded-full p-2" />
                                <div>
                                  <div className="font-medium">{audio.title}</div>
                                  <div className="text-sm text-gray-600">
                                    {audio.artist && `by ${audio.artist} • `}
                                    {audio.usage_count.toLocaleString()} uses
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className={getTrendVelocityColor(audio.trend_velocity)}>
                                  {audio.trend_velocity}
                                </Badge>
                                <div className="text-sm text-gray-600 mt-1">
                                  {audio.engagement_rate}% engagement
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>

              {/* Content Formats Tab */}
              <TabsContent value="formats" className="space-y-6">
                {Object.entries(trendReport.platforms).map(([platform, data]) => {
                  if (selectedPlatform !== 'all' && selectedPlatform !== platform) return null;
                  
                  const IconComponent = getPlatformIcon(platform);
                  const colorClass = getPlatformColor(platform);
                  
                  return (
                    <Card key={platform}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 capitalize">
                          <IconComponent className={`h-5 w-5 ${colorClass}`} />
                          {platform} - Content Formats
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {data.contentFormats.map((format, i) => (
                            <div key={i} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-lg">{format.format}</h4>
                                <Badge variant="secondary">
                                  {format.engagement_rate}% engagement
                                </Badge>
                              </div>
                              <p className="text-gray-600 mb-4">{format.description}</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h5 className="font-medium text-sm mb-2">Best Practices</h5>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {format.best_practices.map((practice, j) => (
                                      <li key={j} className="flex items-start gap-2">
                                        <span className="text-green-600 mt-1">•</span>
                                        {practice}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <div>
                                  <h5 className="font-medium text-sm mb-2">Examples</h5>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {format.examples.map((example, j) => (
                                      <li key={j} className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-1">•</span>
                                        {example}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>

              {/* Content Calendar Tab */}
              <TabsContent value="calendar" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Weekly Content Calendar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {trendReport.contentCalendar.map((item, i) => {
                        const IconComponent = getPlatformIcon(item.platform);
                        const colorClass = getPlatformColor(item.platform);
                        
                        return (
                          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <IconComponent className={`h-5 w-5 ${colorClass} flex-shrink-0`} />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium">{item.posting_idea}</div>
                                <div className="text-sm text-gray-600">
                                  {item.date} • {item.best_time} • {item.content_type}
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className="flex-shrink-0">
                              {item.trend_reference}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="space-y-6">
                {trendReport.regionalInsights && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-blue-600" />
                        Regional Insights - {trendReport.regionalInsights.region}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-3">Trending Topics</h4>
                          <div className="space-y-2">
                            {trendReport.regionalInsights.trending_topics.map((topic, i) => (
                              <Badge key={i} variant="secondary" className="mr-2 mb-2">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-3">Cultural Context</h4>
                          <ul className="text-sm text-gray-600 space-y-2">
                            {trendReport.regionalInsights.cultural_context.map((context, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                {context}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {trendReport.competitorAnalysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        Competitor Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h4 className="font-medium mb-3">Top Performing Content</h4>
                          <ul className="text-sm text-gray-600 space-y-2">
                            {trendReport.competitorAnalysis.top_performing_content.map((content, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-green-600 mt-1">•</span>
                                {content}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-3">Hashtag Strategies</h4>
                          <ul className="text-sm text-gray-600 space-y-2">
                            {trendReport.competitorAnalysis.hashtag_strategies.map((strategy, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                {strategy}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-3">Posting Patterns</h4>
                          <ul className="text-sm text-gray-600 space-y-2">
                            {trendReport.competitorAnalysis.posting_patterns.map((pattern, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-purple-600 mt-1">•</span>
                                {pattern}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Post Ideas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-blue-600" />
                      AI-Generated Post Ideas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(trendReport.platforms).map(([platform, data]) => {
                        if (selectedPlatform !== 'all' && selectedPlatform !== platform) return null;
                        
                        return data.postIdeas.map((idea, i) => {
                          const IconComponent = getPlatformIcon(platform);
                          const colorClass = getPlatformColor(platform);
                          
                          return (
                            <div key={`${platform}-${i}`} className="border rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <IconComponent className={`h-4 w-4 ${colorClass}`} />
                                <span className="text-sm font-medium capitalize">{platform}</span>
                                <Badge variant="outline" className="text-xs">
                                  {idea.visual_format}
                                </Badge>
                              </div>
                              
                              <h4 className="font-medium mb-2">{idea.title}</h4>
                              <p className="text-sm text-gray-600 mb-3">{idea.caption}</p>
                              
                              <div className="flex items-center justify-between">
                                {idea.cta && (
                                  <span className="text-xs text-blue-600 font-medium">
                                    CTA: {idea.cta}
                                  </span>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  {idea.estimated_engagement}% est. engagement
                                </Badge>
                              </div>
                            </div>
                          );
                        });
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Empty State */}
        {!trendReport && !isGenerating && (
          <Card>
            <CardContent className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Generate Your Trend Analysis Report
              </h3>
              <p className="text-gray-600 mb-6">
                Get real-time social media trends, hashtags, and content strategies tailored to your needs.
              </p>
              <Button onClick={generateTrendReport} className="px-8">
                <TrendingUp className="h-4 w-4 mr-2" />
                Start Analysis
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}