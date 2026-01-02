import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  Target, 
  Zap, 
  BarChart3,
  Calendar,
  Users,
  Globe,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import { format, addHours, addDays, startOfWeek, endOfWeek } from 'date-fns';

interface OptimalTime {
  platform: string;
  time: string;
  day: string;
  engagementScore: number;
  audienceSize: number;
  competitionLevel: 'low' | 'medium' | 'high';
  confidence: number;
}

interface ContentSuggestion {
  id: string;
  title: string;
  description: string;
  contentType: 'post' | 'story' | 'video' | 'reel' | 'article';
  platforms: string[];
  suggestedTime: Date;
  reasoning: string;
  expectedEngagement: number;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  aiConfidence: number;
}

interface AudienceInsight {
  platform: string;
  peakHours: string[];
  activeTimeZones: string[];
  demographics: {
    ageGroups: { range: string; percentage: number }[];
    interests: string[];
    behavior: string;
  };
  engagementPatterns: {
    bestDays: string[];
    contentPreferences: string[];
    responseTime: string;
  };
}

interface SmartSchedulerProps {
  onScheduleContent?: (suggestions: ContentSuggestion[]) => void;
  onClose?: () => void;
}

export default function SmartScheduler({ onScheduleContent, onClose }: SmartSchedulerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [optimalTimes, setOptimalTimes] = useState<OptimalTime[]>([]);
  const [contentSuggestions, setContentSuggestions] = useState<ContentSuggestion[]>([]);
  const [audienceInsights, setAudienceInsights] = useState<AudienceInsight[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [currentView, setCurrentView] = useState<'analysis' | 'suggestions' | 'insights'>('analysis');

  const platforms = [
    { id: 'instagram', name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { id: 'facebook', name: 'Facebook', color: 'bg-blue-600' },
    { id: 'twitter', name: 'Twitter', color: 'bg-blue-400' },
    { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-700' },
    { id: 'youtube', name: 'YouTube', color: 'bg-red-600' },
    { id: 'tiktok', name: 'TikTok', color: 'bg-black' }
  ];

  // Simulate AI analysis
  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate progress
    const progressSteps = [
      { step: 20, message: 'Analyzing audience behavior...' },
      { step: 40, message: 'Identifying optimal posting times...' },
      { step: 60, message: 'Generating content suggestions...' },
      { step: 80, message: 'Calculating engagement predictions...' },
      { step: 100, message: 'Analysis complete!' }
    ];

    for (const { step } of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalysisProgress(step);
    }

    // Generate sample data
    generateOptimalTimes();
    generateContentSuggestions();
    generateAudienceInsights();

    setIsAnalyzing(false);
  };

  const generateOptimalTimes = () => {
    const sampleTimes: OptimalTime[] = [
      {
        platform: 'instagram',
        time: '11:00 AM',
        day: 'Tuesday',
        engagementScore: 8.7,
        audienceSize: 2400,
        competitionLevel: 'medium',
        confidence: 92
      },
      {
        platform: 'instagram',
        time: '7:00 PM',
        day: 'Thursday',
        engagementScore: 9.2,
        audienceSize: 3100,
        competitionLevel: 'low',
        confidence: 95
      },
      {
        platform: 'linkedin',
        time: '9:00 AM',
        day: 'Wednesday',
        engagementScore: 7.8,
        audienceSize: 1800,
        competitionLevel: 'high',
        confidence: 88
      },
      {
        platform: 'youtube',
        time: '3:00 PM',
        day: 'Saturday',
        engagementScore: 8.9,
        audienceSize: 4200,
        competitionLevel: 'medium',
        confidence: 91
      },
      {
        platform: 'twitter',
        time: '12:00 PM',
        day: 'Monday',
        engagementScore: 6.5,
        audienceSize: 1200,
        competitionLevel: 'high',
        confidence: 82
      }
    ];
    setOptimalTimes(sampleTimes);
  };

  const generateContentSuggestions = () => {
    const suggestions: ContentSuggestion[] = [
      {
        id: '1',
        title: 'Weekly Productivity Tips',
        description: 'Share 5 quick productivity hacks for remote workers',
        contentType: 'post',
        platforms: ['linkedin', 'twitter'],
        suggestedTime: new Date(2025, 0, 29, 9, 0), // Wednesday 9 AM
        reasoning: 'Professional audience is most active on weekday mornings. Productivity content performs 40% better on LinkedIn.',
        expectedEngagement: 8.7,
        priority: 'high',
        tags: ['productivity', 'tips', 'remote-work'],
        aiConfidence: 94
      },
      {
        id: '2',
        title: 'Behind the Scenes: Team Meeting',
        description: 'Show your team brainstorming session in action',
        contentType: 'story',
        platforms: ['instagram', 'facebook'],
        suggestedTime: new Date(2025, 0, 30, 19, 0), // Thursday 7 PM
        reasoning: 'Stories get 60% more engagement in evening hours. Behind-the-scenes content builds authentic connections.',
        expectedEngagement: 9.2,
        priority: 'high',
        tags: ['behind-scenes', 'team', 'authentic'],
        aiConfidence: 91
      },
      {
        id: '3',
        title: 'Product Demo: New Feature',
        description: 'Walkthrough of the latest feature update',
        contentType: 'video',
        platforms: ['youtube', 'linkedin'],
        suggestedTime: new Date(2025, 1, 1, 15, 0), // Saturday 3 PM
        reasoning: 'Weekend video content has 25% less competition. Product demos perform best with detailed explanations.',
        expectedEngagement: 8.9,
        priority: 'medium',
        tags: ['product', 'demo', 'features'],
        aiConfidence: 89
      },
      {
        id: '4',
        title: 'Quick Tutorial: Time Management',
        description: '60-second tutorial on effective time blocking',
        contentType: 'reel',
        platforms: ['instagram', 'tiktok'],
        suggestedTime: new Date(2025, 0, 31, 11, 0), // Friday 11 AM
        reasoning: 'Short-form educational content peaks during lunch breaks. Tutorial reels have 3x higher save rates.',
        expectedEngagement: 7.8,
        priority: 'medium',
        tags: ['tutorial', 'time-management', 'education'],
        aiConfidence: 87
      },
      {
        id: '5',
        title: 'Industry Trends Analysis',
        description: 'Deep dive into 2025 content marketing trends',
        contentType: 'article',
        platforms: ['linkedin', 'medium'],
        suggestedTime: new Date(2025, 1, 3, 10, 0), // Monday 10 AM
        reasoning: 'Long-form content performs best early in the week. Industry analysis drives thought leadership engagement.',
        expectedEngagement: 6.9,
        priority: 'low',
        tags: ['trends', 'analysis', 'industry'],
        aiConfidence: 85
      }
    ];
    setContentSuggestions(suggestions);
  };

  const generateAudienceInsights = () => {
    const insights: AudienceInsight[] = [
      {
        platform: 'instagram',
        peakHours: ['11:00 AM', '7:00 PM', '9:00 PM'],
        activeTimeZones: ['EST', 'PST', 'GMT'],
        demographics: {
          ageGroups: [
            { range: '25-34', percentage: 45 },
            { range: '35-44', percentage: 30 },
            { range: '18-24', percentage: 25 }
          ],
          interests: ['Technology', 'Business', 'Lifestyle', 'Education'],
          behavior: 'Highly engaged with visual content, prefers authentic behind-the-scenes posts'
        },
        engagementPatterns: {
          bestDays: ['Tuesday', 'Thursday', 'Saturday'],
          contentPreferences: ['Stories', 'Reels', 'Carousel posts'],
          responseTime: '2-4 hours'
        }
      },
      {
        platform: 'linkedin',
        peakHours: ['9:00 AM', '12:00 PM', '5:00 PM'],
        activeTimeZones: ['EST', 'CST', 'GMT'],
        demographics: {
          ageGroups: [
            { range: '35-44', percentage: 40 },
            { range: '25-34', percentage: 35 },
            { range: '45-54', percentage: 25 }
          ],
          interests: ['Professional Development', 'Industry News', 'Leadership', 'Innovation'],
          behavior: 'Values thought leadership content, engages with professional insights'
        },
        engagementPatterns: {
          bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
          contentPreferences: ['Articles', 'Professional posts', 'Industry updates'],
          responseTime: '1-3 hours'
        }
      }
    ];
    setAudienceInsights(insights);
  };

  useEffect(() => {
    runAIAnalysis();
  }, []);

  const toggleSuggestionSelection = (suggestionId: string) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(suggestionId)) {
      newSelected.delete(suggestionId);
    } else {
      newSelected.add(suggestionId);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleScheduleSelected = () => {
    const selected = contentSuggestions.filter(s => selectedSuggestions.has(s.id));
    onScheduleContent?.(selected);
  };

  const getPlatformIcon = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    return platform ? (
      <div className={`w-4 h-4 rounded ${platform.color}`} title={platform.name} />
    ) : null;
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderAnalysisView = () => (
    <div className="space-y-6">
      {isAnalyzing ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold mb-2">AI Analysis in Progress</h3>
          <p className="text-gray-600 mb-6">Analyzing your audience and content performance...</p>
          <div className="max-w-md mx-auto">
            <Progress value={analysisProgress} className="mb-2" />
            <p className="text-sm text-gray-500">{analysisProgress}% complete</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Analysis Complete!</h3>
            <p className="text-gray-600">AI has analyzed your content and audience patterns</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{optimalTimes.length}</div>
              <div className="text-sm text-gray-600">Optimal Times</div>
            </Card>
            
            <Card className="p-4 text-center">
              <Lightbulb className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{contentSuggestions.length}</div>
              <div className="text-sm text-gray-600">Content Ideas</div>
            </Card>
            
            <Card className="p-4 text-center">
              <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{audienceInsights.length}</div>
              <div className="text-sm text-gray-600">Platform Insights</div>
            </Card>
            
            <Card className="p-4 text-center">
              <Target className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(optimalTimes.reduce((acc, t) => acc + t.confidence, 0) / optimalTimes.length)}%
              </div>
              <div className="text-sm text-gray-600">Avg Confidence</div>
            </Card>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4">
            <Button onClick={() => setCurrentView('suggestions')}>
              <Lightbulb className="w-4 h-4 mr-2" />
              View Suggestions
            </Button>
            <Button variant="outline" onClick={() => setCurrentView('insights')}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Audience Insights
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderSuggestionsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">AI Content Suggestions</h3>
          <p className="text-gray-600">Optimized content ideas based on your audience analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCurrentView('analysis')}>
            Back to Analysis
          </Button>
          {selectedSuggestions.size > 0 && (
            <Button onClick={handleScheduleSelected}>
              Schedule Selected ({selectedSuggestions.size})
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {contentSuggestions.map(suggestion => (
          <Card 
            key={suggestion.id} 
            className={`cursor-pointer transition-all ${
              selectedSuggestions.has(suggestion.id) ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
            }`}
            onClick={() => toggleSuggestionSelection(suggestion.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{suggestion.title}</h4>
                    <Badge className={getPriorityColor(suggestion.priority)}>
                      {suggestion.priority} priority
                    </Badge>
                    <Badge variant="outline">{suggestion.contentType}</Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{suggestion.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Suggested Time</div>
                      <div className="text-sm text-gray-600">
                        {format(suggestion.suggestedTime, 'EEE, MMM d')} at {format(suggestion.suggestedTime, 'h:mm a')}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-700">Expected Engagement</div>
                      <div className="text-sm text-gray-600">{suggestion.expectedEngagement}%</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-700">AI Confidence</div>
                      <div className="text-sm text-gray-600">{suggestion.aiConfidence}%</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-gray-700">Platforms:</span>
                    {suggestion.platforms.map(platformId => (
                      <div key={platformId} className="flex items-center gap-1">
                        {getPlatformIcon(platformId)}
                        <span className="text-sm text-gray-600 capitalize">{platformId}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">AI Reasoning:</div>
                    <div className="text-sm text-gray-600">{suggestion.reasoning}</div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-3">
                    {suggestion.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="ml-4">
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                    selectedSuggestions.has(suggestion.id)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedSuggestions.has(suggestion.id) && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderInsightsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Audience Insights</h3>
          <p className="text-gray-600">Deep dive into your audience behavior and preferences</p>
        </div>
        <Button variant="outline" onClick={() => setCurrentView('analysis')}>
          Back to Analysis
        </Button>
      </div>

      {/* Optimal Times */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Optimal Posting Times
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {optimalTimes.map((time, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {getPlatformIcon(time.platform)}
                  <div>
                    <div className="font-medium capitalize">{time.platform}</div>
                    <div className="text-sm text-gray-600">{time.day}s at {time.time}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-sm font-medium">{time.engagementScore}</div>
                    <div className="text-xs text-gray-500">Engagement</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-medium">{time.audienceSize.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Audience</div>
                  </div>
                  
                  <Badge className={getCompetitionColor(time.competitionLevel)}>
                    {time.competitionLevel} competition
                  </Badge>
                  
                  <div className="text-center">
                    <div className="text-sm font-medium">{time.confidence}%</div>
                    <div className="text-xs text-gray-500">Confidence</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Platform Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {audienceInsights.map(insight => (
          <Card key={insight.platform}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 capitalize">
                {getPlatformIcon(insight.platform)}
                {insight.platform} Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h5 className="font-medium mb-2">Peak Hours</h5>
                <div className="flex flex-wrap gap-2">
                  {insight.peakHours.map(hour => (
                    <Badge key={hour} variant="outline">{hour}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Best Days</h5>
                <div className="flex flex-wrap gap-2">
                  {insight.engagementPatterns.bestDays.map(day => (
                    <Badge key={day} variant="secondary">{day}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Age Demographics</h5>
                <div className="space-y-2">
                  {insight.demographics.ageGroups.map(group => (
                    <div key={group.range} className="flex items-center justify-between">
                      <span className="text-sm">{group.range} years</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-blue-500 rounded-full" 
                            style={{ width: `${group.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{group.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Content Preferences</h5>
                <div className="flex flex-wrap gap-2">
                  {insight.engagementPatterns.contentPreferences.map(pref => (
                    <Badge key={pref} className="bg-green-100 text-green-800">{pref}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Behavior Pattern</h5>
                <p className="text-sm text-gray-600">{insight.demographics.behavior}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Smart Scheduler
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {currentView === 'analysis' && renderAnalysisView()}
        {currentView === 'suggestions' && renderSuggestionsView()}
        {currentView === 'insights' && renderInsightsView()}
      </CardContent>
    </Card>
  );
}