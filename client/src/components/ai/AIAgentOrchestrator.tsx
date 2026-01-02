import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Activity, 
  Users, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Agent {
  id: string;
  name: string;
  status: 'idle' | 'busy' | 'error';
  capabilities: string[];
  performance: {
    tasksCompleted: number;
    averageResponseTime: number;
    successRate: number;
  };
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'completed' | 'failed';
  steps: WorkflowStep[];
  progress: number;
}

interface WorkflowStep {
  id: string;
  name: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
}

interface OrchestrationStats {
  activeAgents: number;
  runningWorkflows: number;
  completedTasks: number;
  averageResponseTime: number;
}

export const AIAgentOrchestrator: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [stats, setStats] = useState<OrchestrationStats>({
    activeAgents: 0,
    runningWorkflows: 0,
    completedTasks: 0,
    averageResponseTime: 0
  });
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAgents();
    loadWorkflows();
    loadStats();
  }, []);

  const loadAgents = async () => {
    try {
      // Mock data - in production, fetch from API
      const mockAgents: Agent[] = [
        {
          id: 'content-strategist',
          name: 'Content Strategist',
          status: 'idle',
          capabilities: ['market_analysis', 'trend_detection', 'audience_insights'],
          performance: {
            tasksCompleted: 45,
            averageResponseTime: 2.3,
            successRate: 94
          }
        },
        {
          id: 'creative-director',
          name: 'Creative Director',
          status: 'busy',
          capabilities: ['visual_design', 'brand_alignment', 'style_guidance'],
          performance: {
            tasksCompleted: 32,
            averageResponseTime: 1.8,
            successRate: 97
          }
        },
        {
          id: 'script-writer',
          name: 'Script Writer',
          status: 'idle',
          capabilities: ['content_scripting', 'narrative_development'],
          performance: {
            tasksCompleted: 28,
            averageResponseTime: 3.1,
            successRate: 91
          }
        },
        {
          id: 'performance-optimizer',
          name: 'Performance Optimizer',
          status: 'idle',
          capabilities: ['ab_testing', 'optimization_recommendations'],
          performance: {
            tasksCompleted: 19,
            averageResponseTime: 4.2,
            successRate: 88
          }
        }
      ];

      setAgents(mockAgents);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load agents',
        variant: 'destructive'
      });
    }
  };

  const loadWorkflows = async () => {
    try {
      // Mock data - in production, fetch from API
      const mockWorkflows: Workflow[] = [
        {
          id: 'content-pipeline-1',
          name: 'Content Creation Pipeline',
          description: 'End-to-end content creation workflow',
          status: 'running',
          progress: 65,
          steps: [
            {
              id: 'step-1',
              name: 'Market Analysis',
              agentId: 'content-strategist',
              status: 'completed',
              result: { trends: ['AI Content', 'Sustainability'] }
            },
            {
              id: 'step-2',
              name: 'Creative Design',
              agentId: 'creative-director',
              status: 'running'
            },
            {
              id: 'step-3',
              name: 'Script Writing',
              agentId: 'script-writer',
              status: 'pending'
            },
            {
              id: 'step-4',
              name: 'Performance Optimization',
              agentId: 'performance-optimizer',
              status: 'pending'
            }
          ]
        },
        {
          id: 'trend-analysis-1',
          name: 'Trend Analysis Workflow',
          description: 'Analyze trending topics and generate insights',
          status: 'completed',
          progress: 100,
          steps: [
            {
              id: 'step-1',
              name: 'Data Collection',
              agentId: 'content-strategist',
              status: 'completed'
            },
            {
              id: 'step-2',
              name: 'Analysis',
              agentId: 'performance-optimizer',
              status: 'completed'
            }
          ]
        }
      ];

      setWorkflows(mockWorkflows);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load workflows',
        variant: 'destructive'
      });
    }
  };

  const loadStats = async () => {
    try {
      // Mock data - in production, fetch from API
      const mockStats: OrchestrationStats = {
        activeAgents: 4,
        runningWorkflows: 1,
        completedTasks: 124,
        averageResponseTime: 2.8
      };

      setStats(mockStats);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load statistics',
        variant: 'destructive'
      });
    }
  };

  const startWorkflow = async (workflowId: string) => {
    setIsLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setWorkflows(prev => prev.map(w => 
        w.id === workflowId 
          ? { ...w, status: 'running' as const, progress: 0 }
          : w
      ));

      toast({
        title: 'Success',
        description: 'Workflow started successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start workflow',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pauseWorkflow = async (workflowId: string) => {
    try {
      // Mock API call
      setWorkflows(prev => prev.map(w => 
        w.id === workflowId 
          ? { ...w, status: 'draft' as const }
          : w
      ));

      toast({
        title: 'Success',
        description: 'Workflow paused'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to pause workflow',
        variant: 'destructive'
      });
    }
  };

  const stopWorkflow = async (workflowId: string) => {
    try {
      // Mock API call
      setWorkflows(prev => prev.map(w => 
        w.id === workflowId 
          ? { ...w, status: 'draft' as const, progress: 0 }
          : w
      ));

      toast({
        title: 'Success',
        description: 'Workflow stopped'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to stop workflow',
        variant: 'destructive'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'busy':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle':
        return 'bg-gray-100 text-gray-800';
      case 'busy':
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'error':
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Agent Orchestrator</h1>
          <p className="text-gray-600">Manage and monitor AI agents and workflows</p>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Bot className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Agents</p>
                <p className="text-2xl font-bold">{stats.activeAgents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Running Workflows</p>
                <p className="text-2xl font-bold">{stats.runningWorkflows}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                <p className="text-2xl font-bold">{stats.completedTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold">{stats.averageResponseTime}s</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      {getStatusIcon(agent.status)}
                      <span className="ml-2">{agent.name}</span>
                    </CardTitle>
                    <Badge className={getStatusColor(agent.status)}>
                      {agent.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Capabilities</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.capabilities.slice(0, 3).map((capability) => (
                          <Badge key={capability} variant="outline" className="text-xs">
                            {capability.replace('_', ' ')}
                          </Badge>
                        ))}
                        {agent.capabilities.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{agent.capabilities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Tasks Completed</p>
                        <p className="font-semibold">{agent.performance.tasksCompleted}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Success Rate</p>
                        <p className="font-semibold">{agent.performance.successRate}%</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Avg Response Time</p>
                      <p className="font-semibold">{agent.performance.averageResponseTime}s</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        {getStatusIcon(workflow.status)}
                        <span className="ml-2">{workflow.name}</span>
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(workflow.status)}>
                        {workflow.status}
                      </Badge>
                      {workflow.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => startWorkflow(workflow.id)}
                          disabled={isLoading}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {workflow.status === 'running' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => pauseWorkflow(workflow.id)}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => stopWorkflow(workflow.id)}
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workflow.status === 'running' && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span>{workflow.progress}%</span>
                        </div>
                        <Progress value={workflow.progress} className="h-2" />
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Workflow Steps</p>
                      <div className="space-y-2">
                        {workflow.steps.map((step) => (
                          <div
                            key={step.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center">
                              {getStatusIcon(step.status)}
                              <span className="ml-2 font-medium">{step.name}</span>
                            </div>
                            <Badge className={getStatusColor(step.status)}>
                              {step.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
