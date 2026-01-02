import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  CheckCircle, 
  Clock, 
  Pause, 
  Square, 
  TrendingUp 
} from 'lucide-react';

interface CalendarStatsProps {
  stats: {
    totalContent: number;
    publishedContent: number;
    unpublishedContent: number;
    pausedContent: number;
    stoppedContent: number;
  };
}

export function CalendarStats({ stats }: CalendarStatsProps) {
  const completionRate = stats.totalContent > 0 ? (stats.publishedContent / stats.totalContent) * 100 : 0;
  const activeContent = stats.totalContent - stats.pausedContent - stats.stoppedContent;

  const statItems = [
    {
      title: 'Total Content',
      value: stats.totalContent,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Published',
      value: stats.publishedContent,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Unpublished',
      value: stats.unpublishedContent,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Paused',
      value: stats.pausedContent,
      icon: Pause,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Stopped',
      value: stats.stoppedContent,
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statItems.map((item, index) => (
        <Card key={index} className="text-center">
          <CardContent className="p-4">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${item.bgColor} mb-2`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <div className="text-2xl font-bold">{item.value}</div>
            <div className="text-sm text-gray-600">{item.title}</div>
          </CardContent>
        </Card>
      ))}

      {/* Completion Rate Card */}
      <Card className="col-span-2 md:col-span-3 lg:col-span-6">
        <CardHeader>
          <CardTitle className="text-center">Content Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {completionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">
              {stats.publishedContent} of {stats.totalContent} content pieces published
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
