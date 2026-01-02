import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  CheckCircle, 
  Clock, 
  Pause, 
  Square, 
  Calendar,
  TrendingUp,
  Target
} from 'lucide-react';

interface ProjectStatsProps {
  totalContent: number;
  publishedContent: number;
  unpublishedContent: number;
  pausedContent: number;
  stoppedContent: number;
  totalDays: number;
  currentDay: number;
}

export function ProjectStats({
  totalContent,
  publishedContent,
  unpublishedContent,
  pausedContent,
  stoppedContent,
  totalDays,
  currentDay
}: ProjectStatsProps) {
  const completionPercentage = totalContent > 0 ? (publishedContent / totalContent) * 100 : 0;
  const dayProgress = totalDays > 0 ? (currentDay / totalDays) * 100 : 0;
  const activeContent = totalContent - pausedContent - stoppedContent;

  const stats = [
    {
      title: 'Total Content',
      value: totalContent,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Published',
      value: publishedContent,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Unpublished',
      value: unpublishedContent,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Paused',
      value: pausedContent,
      icon: Pause,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Stopped',
      value: stoppedContent,
      icon: Square,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Active',
      value: activeContent,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="grid gap-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="text-center">
            <CardContent className="p-4">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.bgColor} mb-2`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.title}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Content Completion Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Content Completion</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Published Content</span>
                <span className="text-sm text-gray-600">
                  {publishedContent} / {totalContent}
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
              <div className="text-sm text-gray-600">
                {completionPercentage.toFixed(1)}% complete
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Day Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Project Timeline</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Day</span>
                <span className="text-sm text-gray-600">
                  {currentDay} / {totalDays}
                </span>
              </div>
              <Progress value={dayProgress} className="h-2" />
              <div className="text-sm text-gray-600">
                {dayProgress.toFixed(1)}% through project
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Content Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Published</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{publishedContent}</span>
                <span className="text-sm text-gray-500">
                  ({totalContent > 0 ? ((publishedContent / totalContent) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Unpublished</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{unpublishedContent}</span>
                <span className="text-sm text-gray-500">
                  ({totalContent > 0 ? ((unpublishedContent / totalContent) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Paused</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{pausedContent}</span>
                <span className="text-sm text-gray-500">
                  ({totalContent > 0 ? ((pausedContent / totalContent) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">Stopped</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{stoppedContent}</span>
                <span className="text-sm text-gray-500">
                  ({totalContent > 0 ? ((stoppedContent / totalContent) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
