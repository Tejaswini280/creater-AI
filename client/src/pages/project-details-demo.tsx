import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Calendar, Target, Zap } from 'lucide-react';
import EnhancedProjectDetailsModal from '@/components/modals/EnhancedProjectDetailsModal';

// Mock project data
const mockProject = {
  id: 45,
  title: "Fitness Journey 2025",
  description: "Fitness content series",
  projectType: "fitness",
  status: "active",
  duration: 7,
  targetChannels: ["instagram", "youtube"],
  contentFrequency: "daily",
  startDate: "2025-09-18",
  endDate: "2025-09-25",
  createdAt: "2025-09-18T00:00:00Z",
  updatedAt: "2025-09-18T00:00:00Z"
};

// Mock content data
const mockContent = [
  {
    id: 1,
    title: "Morning Workout Motivation",
    description: "Start your day with energy and motivation",
    content: "Good morning! 💪 Ready to crush your fitness goals today? Remember, every workout counts towards your journey to a healthier, stronger you. Let's make today amazing! #FitnessJourney #MorningMotivation #WorkoutWednesday",
    platform: "instagram",
    contentType: "post",
    status: "published",
    dayNumber: 1,
    isPaused: false,
    isStopped: false,
    canPublish: true,
    publishOrder: 1,
    contentVersion: 1,
    hashtags: ["FitnessJourney", "MorningMotivation", "WorkoutWednesday"],
    publishedAt: "2025-09-18T08:00:00Z",
    createdAt: "2025-09-18T00:00:00Z",
    updatedAt: "2025-09-18T08:00:00Z"
  },
  {
    id: 2,
    title: "Healthy Breakfast Ideas",
    description: "Nutritious breakfast recipes for fitness enthusiasts",
    content: "Fuel your body right! 🥗 Here are 5 quick and healthy breakfast ideas that will keep you energized throughout your workout. Protein-packed and delicious! #HealthyEating #FitnessNutrition #BreakfastIdeas",
    platform: "instagram",
    contentType: "post",
    status: "draft",
    dayNumber: 2,
    isPaused: false,
    isStopped: false,
    canPublish: true,
    publishOrder: 1,
    contentVersion: 1,
    hashtags: ["HealthyEating", "FitnessNutrition", "BreakfastIdeas"],
    createdAt: "2025-09-18T00:00:00Z",
    updatedAt: "2025-09-18T00:00:00Z"
  },
  {
    id: 3,
    title: "Workout Routine - Day 3",
    description: "Full body workout routine for day 3",
    content: "Day 3 of our fitness journey! 🏋️‍♀️ Today we're focusing on full body strength. This routine will target all major muscle groups and help you build lean muscle. Remember to maintain proper form! #FullBodyWorkout #StrengthTraining #FitnessJourney",
    platform: "youtube",
    contentType: "video",
    status: "scheduled",
    dayNumber: 3,
    isPaused: false,
    isStopped: false,
    canPublish: true,
    publishOrder: 1,
    contentVersion: 1,
    hashtags: ["FullBodyWorkout", "StrengthTraining", "FitnessJourney"],
    scheduledAt: "2025-09-20T18:00:00Z",
    createdAt: "2025-09-18T00:00:00Z",
    updatedAt: "2025-09-18T00:00:00Z"
  },
  {
    id: 4,
    title: "Recovery and Stretching",
    description: "Importance of recovery in fitness journey",
    content: "Recovery is just as important as the workout! 🧘‍♀️ Today we're focusing on stretching and recovery techniques. Your muscles need time to repair and grow stronger. Listen to your body! #Recovery #Stretching #FitnessRecovery",
    platform: "instagram",
    contentType: "reel",
    status: "paused",
    dayNumber: 4,
    isPaused: true,
    isStopped: false,
    canPublish: true,
    publishOrder: 1,
    contentVersion: 1,
    hashtags: ["Recovery", "Stretching", "FitnessRecovery"],
    createdAt: "2025-09-18T00:00:00Z",
    updatedAt: "2025-09-18T00:00:00Z"
  },
  {
    id: 5,
    title: "Nutrition Tips",
    description: "Essential nutrition tips for fitness success",
    content: "Nutrition is 70% of your fitness success! 🥗 Here are the essential nutrition tips that will help you reach your goals faster. Hydration, protein, and timing are key! #NutritionTips #FitnessNutrition #HealthyLifestyle",
    platform: "youtube",
    contentType: "short",
    status: "stopped",
    dayNumber: 5,
    isPaused: false,
    isStopped: true,
    canPublish: false,
    publishOrder: 1,
    contentVersion: 1,
    hashtags: ["NutritionTips", "FitnessNutrition", "HealthyLifestyle"],
    createdAt: "2025-09-18T00:00:00Z",
    updatedAt: "2025-09-18T00:00:00Z"
  }
];

export default function ProjectDetailsDemo() {
  const [showModal, setShowModal] = useState(false);

  // Mock API responses
  React.useEffect(() => {
    // Mock the API responses for the enhanced modal
    const originalFetch = window.fetch;
    window.fetch = async (url: string, options?: RequestInit) => {
      if (url.includes('/api/ai-projects/45')) {
        return new Response(JSON.stringify({
          data: {
            ...mockProject,
            content: mockContent
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return originalFetch(url, options);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Project Details Demo
          </h1>
          <p className="text-gray-600">
            Click "View Details" to see the enhanced project details window with content cards grouped by days.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💪</span>
                  <div>
                    <CardTitle className="text-lg line-clamp-1">
                      {mockProject.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {mockProject.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {mockProject.status}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {mockProject.contentFrequency}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Project Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">60%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{new Date(mockProject.startDate).toLocaleDateString()}</span>
                  <span>3 days left</span>
                </div>
              </div>

              {/* Target Channels */}
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Target className="h-4 w-4" />
                  <span>Platforms</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {mockProject.targetChannels.map((channel) => (
                    <Badge key={channel} variant="secondary" className="text-xs">
                      <span className="mr-1">
                        {channel === 'instagram' ? '📸' : '🎥'}
                      </span>
                      {channel}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Project Stats */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{mockProject.duration}</div>
                  <div className="text-xs text-gray-500">Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{mockProject.targetChannels.length}</div>
                  <div className="text-xs text-gray-500">Platforms</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(true)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Additional demo cards */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌟</span>
                  <div>
                    <CardTitle className="text-lg line-clamp-1">
                      Makeup Videos
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      Beginners Makeup Tutorial
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Click "View Details" to see the enhanced modal</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌅</span>
                  <div>
                    <CardTitle className="text-lg line-clamp-1">
                      Morning Routine
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      Morning Skincare Routine
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Enhanced project details coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Project Details Modal */}
        <EnhancedProjectDetailsModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          project={mockProject}
          onProjectUpdate={(projectId, updates) => {
            console.log('Project updated:', projectId, updates);
          }}
        />
      </div>
    </div>
  );
}
