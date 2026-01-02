import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Bot, Play, Pause, TrendingUp, Zap, Settings, Activity } from "lucide-react";

export default function AIAgentDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pipeline");
  const [pipelineConfig, setPipelineConfig] = useState({
    niche: "",
    platforms: ["youtube"],
    frequency: "daily",
    contentTypes: ["video"]
  });
  const [trendConfig, setTrendConfig] = useState({
    keywords: "",
    platforms: ["youtube"],
    alertThreshold: 70
  });

  const createPipelineAgentMutation = useMutation({
    mutationFn: async () => {
      const config = {
        ...pipelineConfig,
        keywords: pipelineConfig.niche.split(',').map(k => k.trim())
      };
      const response = await apiRequest('POST', '/api/ai/agents/content-pipeline', config);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Content Pipeline Agent Created!",
        description: `Agent ${data.agentId} is now running autonomous content creation.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/agents'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Agent Creation Failed",
        description: "Failed to create content pipeline agent.",
        variant: "destructive",
      });
    },
  });

  const createTrendAgentMutation = useMutation({
    mutationFn: async () => {
      const config = {
        ...trendConfig,
        keywords: trendConfig.keywords.split(',').map(k => k.trim())
      };
      const response = await apiRequest('POST', '/api/ai/agents/trend-analysis', config);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Trend Analysis Agent Created!",
        description: `Agent ${data.agentId} is now monitoring trends in real-time.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/agents'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Agent Creation Failed",
        description: "Failed to create trend analysis agent.",
        variant: "destructive",
      });
    },
  });

  const handleCreatePipelineAgent = () => {
    if (!pipelineConfig.niche.trim()) {
      toast({
        title: "Niche Required",
        description: "Please specify your content niche.",
        variant: "destructive",
      });
      return;
    }
    createPipelineAgentMutation.mutate();
  };

  const handleCreateTrendAgent = () => {
    if (!trendConfig.keywords.trim()) {
      toast({
        title: "Keywords Required",
        description: "Please specify keywords to monitor.",
        variant: "destructive",
      });
      return;
    }
    createTrendAgentMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center text-emerald-900">
            <Bot className="w-5 h-5 mr-2 text-emerald-600" />
            AI Agent Control Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-1 mb-4">
            <Button
              variant={activeTab === "pipeline" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("pipeline")}
              className="flex items-center space-x-1"
            >
              <Zap className="w-4 h-4" />
              <span>Content Pipeline</span>
            </Button>
            <Button
              variant={activeTab === "trends" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("trends")}
              className="flex items-center space-x-1"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Trend Monitor</span>
            </Button>
            <Button
              variant={activeTab === "status" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("status")}
              className="flex items-center space-x-1"
            >
              <Activity className="w-4 h-4" />
              <span>Agent Status</span>
            </Button>
          </div>

          {activeTab === "pipeline" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Autonomous Content Pipeline Agent</h3>
              <p className="text-sm text-gray-600">
                Creates complete content workflows: research → script → thumbnail → scheduling
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Content Niche</label>
                  <Input
                    placeholder="e.g., tech reviews, cooking, fitness"
                    value={pipelineConfig.niche}
                    onChange={(e) => setPipelineConfig(prev => ({ ...prev, niche: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Posting Frequency</label>
                  <Select 
                    value={pipelineConfig.frequency} 
                    onValueChange={(value) => setPipelineConfig(prev => ({ ...prev, frequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="every-other-day">Every Other Day</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleCreatePipelineAgent}
                disabled={createPipelineAgentMutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {createPipelineAgentMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating Agent...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Play className="w-4 h-4" />
                    <span>Launch Content Pipeline Agent</span>
                  </div>
                )}
              </Button>
            </div>
          )}

          {activeTab === "trends" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Real-time Trend Analysis Agent</h3>
              <p className="text-sm text-gray-600">
                Monitors trending topics and alerts you to viral opportunities instantly
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Keywords to Monitor</label>
                  <Input
                    placeholder="AI, technology, viral, trending (comma-separated)"
                    value={trendConfig.keywords}
                    onChange={(e) => setTrendConfig(prev => ({ ...prev, keywords: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Alert Threshold</label>
                  <Select 
                    value={trendConfig.alertThreshold.toString()} 
                    onValueChange={(value) => setTrendConfig(prev => ({ ...prev, alertThreshold: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">Low Sensitivity (50)</SelectItem>
                      <SelectItem value="70">Medium Sensitivity (70)</SelectItem>
                      <SelectItem value="85">High Sensitivity (85)</SelectItem>
                      <SelectItem value="95">Very High Sensitivity (95)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleCreateTrendAgent}
                disabled={createTrendAgentMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createTrendAgentMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating Agent...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Start Trend Monitoring Agent</span>
                  </div>
                )}
              </Button>
            </div>
          )}

          {activeTab === "status" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Active AI Agents</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="font-medium">Content Pipeline Agent</p>
                      <p className="text-sm text-gray-600">Creating daily tech content</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Running</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="font-medium">Trend Analysis Agent</p>
                      <p className="text-sm text-gray-600">Monitoring AI keywords</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Monitoring</Badge>
                </div>
                
                <p className="text-sm text-gray-500 text-center py-4">
                  Agents will appear here once created and will run continuously in the background.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}