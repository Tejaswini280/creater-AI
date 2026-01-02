import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Clock, CheckCircle, XCircle, Calendar, TrendingUp } from "lucide-react";

export function SchedulerStatus() {
  const [isOnline, setIsOnline] = useState(true);

  // Get scheduling analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/content/schedule/analytics'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/content/schedule/analytics');
      return await response.json();
    },
    retry: false,
  });

  // Get scheduled content
  const { data: scheduledData, isLoading: scheduledLoading } = useQuery({
    queryKey: ['/api/content/scheduled'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/content/scheduled');
      return await response.json();
    },
    retry: false,
  });

  const scheduledContent = scheduledData?.scheduledContent || [];
  const analyticsData = analytics?.analytics || {};

  // Calculate next scheduled content
  const nextScheduled = scheduledContent
    .filter((content: any) => new Date(content.scheduledAt) > new Date())
    .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Scheduler Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Scheduler Status</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Badge variant={isOnline ? "default" : "destructive"}>
              {isOnline ? "Online" : "Offline"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {isOnline ? "Active" : "Inactive"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Total Scheduled */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Scheduled</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {scheduledLoading ? "..." : scheduledContent.length}
          </div>
          <p className="text-xs text-muted-foreground">
            Content items scheduled
          </p>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analyticsLoading ? "..." : `${Math.round(analyticsData.successRate || 0)}%`}
          </div>
          <p className="text-xs text-muted-foreground">
            Published successfully
          </p>
        </CardContent>
      </Card>

      {/* Next Scheduled */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Next Scheduled</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium">
            {nextScheduled ? (
              <>
                <div className="truncate">{nextScheduled.title}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(nextScheduled.scheduledAt).toLocaleDateString()} at{" "}
                  {new Date(nextScheduled.scheduledAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">No content scheduled</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}