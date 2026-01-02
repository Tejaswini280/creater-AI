import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Sparkles, Brain, Target } from 'lucide-react';
import AIProjectForm from '@/components/social-media/AIProjectForm';

export default function SocialMediaProjectCreate() {
  const [, setLocation] = useLocation();
  const [createdProject, setCreatedProject] = useState<any>(null);
  const { toast } = useToast();

  const handleProjectCreated = (project: any) => {
    setCreatedProject(project);
    toast({
      title: "Success!",
      description: `AI project "${project.project.title}" created successfully with ${project.metadata.totalContent} content pieces`,
    });

    // Redirect to project details page
    setLocation(`/social-media-project/${project.project.id}`);
  };

  const handleCancel = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Brain className="h-4 w-4" />
            AI-Powered Content Creation
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Create Your Social Media Strategy
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Let AI generate optimized content and schedule it automatically across all your social media platforms.
            No manual planning required - everything is done for you.
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">AI Content Generation</h3>
                <p className="text-sm text-gray-600">
                  Automatically generate engaging content tailored to each platform and audience
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Smart Scheduling</h3>
                <p className="text-sm text-gray-600">
                  AI-optimized posting times for maximum engagement across all platforms
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Intelligent Insights</h3>
                <p className="text-sm text-gray-600">
                  Get AI-powered analytics and recommendations to improve your strategy
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Project Form */}
        <div className="max-w-6xl mx-auto">
          <AIProjectForm
            onProjectCreated={handleProjectCreated}
            onCancel={handleCancel}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p className="text-sm">
            ✨ Your AI assistant will handle content creation, optimization, and scheduling automatically
          </p>
        </div>
      </div>
    </div>
  );
}
