import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  RefreshCw,
  Calendar,
  BarChart3,
  Settings,
  Sparkles
} from 'lucide-react';
import EnhancedProjectDetailsModal from '@/components/social-media/EnhancedProjectDetailsModal';
import { ContentItem } from '@/components/social-media/ContentCard';

// Mock data for demonstration
const mockProject = {
  id: 1,
  name: "Fitness Content Series",
  description: "Daily Gym, Workout and Diet content for Instagram and YouTube",
  platform: "instagram",
  status: "active",
  type: "social-media",
  estimated_duration: "30days",
  tags: ["fitness", "health", "lifestyle"],
  created_at: "2025-09-11T00:00:00Z",
  updated_at: "2025-09-18T00:00:00Z"
};

const mockContents: ContentItem[] = [
  {
    id: 1,
    dayNumber: 1,
    title: "Morning Workout Motivation",
    description: "Start your day with energy! Here's a quick 15-minute morning routine that will boost your metabolism and set the right tone for the day. Perfect for busy schedules!",
    platform: "instagram",
    contentType: "post",
    status: "published",
    scheduledTime: "2025-09-19T07:00:00Z",
    publishedAt: "2025-09-19T07:00:00Z",
    hashtags: ["#morningworkout", "#fitness", "#motivation", "#healthylifestyle"],
    metadata: {
      aiGenerated: true,
      engagementPrediction: {
        average: 75,
        platform: "instagram"
      },
      targetAudience: "Fitness enthusiasts",
      optimalPostingTime: "2025-09-19T07:00:00Z"
    },
    createdAt: new Date("2025-09-11T00:00:00Z"),
    updatedAt: new Date("2025-09-19T07:00:00Z")
  },
  {
    id: 2,
    dayNumber: 2,
    title: "Healthy Breakfast Ideas",
    description: "Fuel your body right! These protein-packed breakfast options will keep you energized throughout the morning. Quick, easy, and delicious!",
    platform: "instagram",
    contentType: "carousel",
    status: "scheduled",
    scheduledTime: "2025-09-20T08:00:00Z",
    hashtags: ["#healthybreakfast", "#nutrition", "#protein", "#mealprep"],
    metadata: {
      aiGenerated: true,
      engagementPrediction: {
        average: 68,
        platform: "instagram"
      },
      targetAudience: "Health-conscious individuals",
      optimalPostingTime: "2025-09-20T08:00:00Z"
    },
    createdAt: new Date("2025-09-11T00:00:00Z"),
    updatedAt: new Date("2025-09-11T00:00:00Z")
  },
  {
    id: 3,
    dayNumber: 3,
    title: "Gym Workout Routine",
    description: "Full body strength training session! This 45-minute routine targets all major muscle groups. Perfect for intermediate fitness levels.",
    platform: "youtube",
    contentType: "video",
    status: "draft",
    hashtags: ["#gymworkout", "#strengthtraining", "#fullbody", "#fitness"],
    metadata: {
      aiGenerated: true,
      engagementPrediction: {
        average: 82,
        platform: "youtube"
      },
      targetAudience: "Gym goers",
      optimalPostingTime: "2025-09-21T18:00:00Z"
    },
    createdAt: new Date("2025-09-11T00:00:00Z"),
    updatedAt: new Date("2025-09-11T00:00:00Z")
  },
  {
    id: 4,
    dayNumber: 4,
    title: "Meal Prep Sunday",
    description: "Set yourself up for success! Here's how to prep healthy meals for the entire week in just 2 hours. Save time and eat better!",
    platform: "instagram",
    contentType: "reel",
    status: "paused",
    scheduledTime: "2025-09-22T10:00:00Z",
    hashtags: ["#mealprep", "#sundayprep", "#healthyeating", "#timesaving"],
    metadata: {
      aiGenerated: true,
      engagementPrediction: {
        average: 71,
        platform: "instagram"
      },
      targetAudience: "Busy professionals",
      optimalPostingTime: "2025-09-22T10:00:00Z"
    },
    createdAt: new Date("2025-09-11T00:00:00Z"),
    updatedAt: new Date("2025-09-11T00:00:00Z")
  },
  {
    id: 5,
    dayNumber: 5,
    title: "Rest Day Recovery",
    description: "Rest is just as important as training! Here are some gentle recovery activities to help your body heal and prepare for the next workout.",
    platform: "instagram",
    contentType: "post",
    status: "scheduled",
    scheduledTime: "2025-09-23T09:00:00Z",
    hashtags: ["#recovery", "#restday", "#selfcare", "#wellness"],
    metadata: {
      aiGenerated: true,
      engagementPrediction: {
        average: 63,
        platform: "instagram"
      },
      targetAudience: "Fitness enthusiasts",
      optimalPostingTime: "2025-09-23T09:00:00Z"
    },
    createdAt: new Date("2025-09-11T00:00:00Z"),
    updatedAt: new Date("2025-09-11T00:00:00Z")
  }
];

export default function ContentDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contents, setContents] = useState<ContentItem[]>(mockContents);
  const [isLoading, setIsLoading] = useState(false);

  const handleContentAction = async (contentId: number, action: string, data?: any) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update content based on action
    setContents(prev => prev.map(content => {
      if (content.id === contentId) {
        switch (action) {
          case 'play':
            return { ...content, status: 'scheduled' as const };
          case 'pause':
            return { ...content, status: 'paused' as const };
          case 'stop':
            return { ...content, status: 'draft' as const };
          case 'delete':
            return { ...content, status: 'deleted' as const };
          case 'regenerate':
            return { 
              ...content, 
              title: `${content.title} (Regenerated)`,
              description: `${content.description}\n\n[AI Regenerated - ${new Date().toLocaleString()}]`,
              updatedAt: new Date()
            };
          case 'recreate':
            return { 
              ...content, 
              title: `${content.title} (Variation)`,
              description: `[AI Generated Variation]\n${content.description}`,
              updatedAt: new Date()
            };
          case 'update':
            return { ...content, ...data, updatedAt: new Date() };
          default:
            return content;
        }
      }
      return content;
    }));
    
    setIsLoading(false);
  };

  const handleExtendProject = async (days: number) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate new content for extended days
    const newContents: ContentItem[] = [];
    const maxDay = Math.max(...contents.map(c => c.dayNumber));
    
    for (let i = 1; i <= days; i++) {
      const dayNumber = maxDay + i;
      newContents.push({
        id: contents.length + i,
        dayNumber,
        title: `Fitness Content - Day ${dayNumber}`,
        description: `AI-generated content for day ${dayNumber} of the fitness series. This content focuses on maintaining consistency and building healthy habits.`,
        platform: "instagram",
        contentType: "post",
        status: "draft",
        hashtags: ["#fitness", "#day" + dayNumber, "#ai-generated"],
        metadata: {
          aiGenerated: true,
          engagementPrediction: {
            average: Math.floor(Math.random() * 30) + 50,
            platform: "instagram"
          },
          targetAudience: "Fitness enthusiasts",
          optimalPostingTime: new Date(Date.now() + (dayNumber - 1) * 24 * 60 * 60 * 1000).toISOString()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    setContents(prev => [...prev, ...newContents]);
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const stats = {
    totalContent: contents.length,
    draftCount: contents.filter(c => c.status === 'draft').length,
    scheduledCount: contents.filter(c => c.status === 'scheduled').length,
    publishedCount: contents.filter(c => c.status === 'published').length,
    pausedCount: contents.filter(c => c.status === 'paused').length,
    deletedCount: contents.filter(c => c.status === 'deleted').length,
    totalDays: Math.max(...contents.map(c => c.dayNumber)),
    avgEngagement: Math.round(contents.reduce((acc, c) => acc + (c.metadata?.engagementPrediction?.average || 0), 0) / contents.length)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Management Demo</h1>
            <p className="text-gray-600 mt-2">
              Interactive demonstration of the enhanced content card system
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              <Sparkles className="h-4 w-4 mr-1" />
              AI-Powered
            </Badge>
            <Button onClick={() => setIsModalOpen(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              Open Project Details
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-900">{stats.totalContent}</div>
                  <div className="text-sm text-blue-700">Total Content</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-900">{stats.publishedCount}</div>
                  <div className="text-sm text-green-700">Published</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Pause className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-yellow-900">{stats.scheduledCount}</div>
                  <div className="text-sm text-yellow-700">Scheduled</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Square className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.draftCount}</div>
                  <div className="text-sm text-gray-700">Draft</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Demo Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => handleExtendProject(7)}
                disabled={isLoading}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Extend +7 Days
              </Button>
              <Button 
                onClick={handleRefresh}
                disabled={isLoading}
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Content
              </Button>
              <Button 
                onClick={() => setIsModalOpen(true)}
                variant="outline"
              >
                <Calendar className="h-4 w-4 mr-2" />
                View Full Project
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use the Demo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Content Card Actions:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Play/Pause:</strong> Toggle content publishing status</li>
                  <li>• <strong>Edit:</strong> Modify content details and scheduling</li>
                  <li>• <strong>Regenerate:</strong> Create new AI-generated content</li>
                  <li>• <strong>Recreate:</strong> Generate content variations</li>
                  <li>• <strong>Delete:</strong> Remove content (soft delete)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Project Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Extend Project:</strong> Add more content days</li>
                  <li>• <strong>Calendar View:</strong> See content scheduling</li>
                  <li>• <strong>Analytics:</strong> Track performance metrics</li>
                  <li>• <strong>Settings:</strong> Configure project options</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Project Details Modal */}
      <EnhancedProjectDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        project={mockProject}
        onProjectUpdate={(projectId, updates) => {
          console.log('Project updated:', projectId, updates);
        }}
      />
    </div>
  );
}
