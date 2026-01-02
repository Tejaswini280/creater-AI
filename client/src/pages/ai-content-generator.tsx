import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Copy, 
  Sparkles, 
  Instagram, 
  Youtube, 
  Music, 
  Hash, 
  Image, 
  MessageSquare,
  Bot,
  Play,
  Pause,
  TrendingUp,
  Zap,
  Settings,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Eye,
  BarChart3,
  Calendar,
  Users,
  Target
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';

interface AIGenerationResult {
  success: boolean;
  content?: string;
  ideas?: string[];
  thumbnailIdeas?: string[];
  hashtags?: string[];
  caption?: string;
  agentId?: string;
  taskId?: string;
}

interface Agent {
  id: string;
  name: string;
  type: string;
  capabilities: string[];
  status: 'idle' | 'busy' | 'completed' | 'failed';
  performance: {
    tasksCompleted: number;
    successRate: number;
    avgResponseTime: number;
  };
  lastActivity?: string;
}

interface WorkflowTask {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
}

export default function AIContentGenerator() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('generator');
  
  // Content Generation State
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [duration, setDuration] = useState('30 seconds');
  const [tone, setTone] = useState('engaging');
  const [audience, setAudience] = useState('general');
  const [result, setResult] = useState<AIGenerationResult | null>(null);
  
  // Agent Orchestrator State
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeAgents, setActiveAgents] = useState(4);
  const [runningWorkflows, setRunningWorkflows] = useState(1);
  const [completedTasks, setCompletedTasks] = useState(124);
  const [avgResponseTime, setAvgResponseTime] = useState('2.8s');
  
  // Workflow State
  const [workflows, setWorkflows] = useState<WorkflowTask[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  
  // Agent Creation State
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentType, setNewAgentType] = useState('content_strategist');
  const [newAgentCapabilities, setNewAgentCapabilities] = useState<string[]>([]);

  // Initialize agents and workflows
  useEffect(() => {
    initializeAgents();
    initializeWorkflows();
    // Set up real-time updates
    const interval = setInterval(() => {
      updateAgentMetrics();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const initializeAgents = () => {
    const defaultAgents: Agent[] = [
      {
        id: 'content-strategist-1',
        name: 'Content Strategist',
        type: 'content_strategist',
        capabilities: ['market analysis', 'trend detection', 'audience insights'],
        status: 'idle',
        performance: {
          tasksCompleted: 45,
          successRate: 94,
          avgResponseTime: 2.3
        },
        lastActivity: '2 minutes ago'
      },
      {
        id: 'creative-director-1',
        name: 'Creative Director',
        type: 'creative_director',
        capabilities: ['visual design', 'brand alignment', 'style guidance'],
        status: 'busy',
        performance: {
          tasksCompleted: 32,
          successRate: 97,
          avgResponseTime: 1.6
        },
        lastActivity: 'Active now'
      },
      {
        id: 'script-writer-1',
        name: 'Script Writer',
        type: 'script_writer',
        capabilities: ['content scripting', 'narrative development', 'success data'],
        status: 'idle',
        performance: {
          tasksCompleted: 28,
          successRate: 91,
          avgResponseTime: 3.1
        },
        lastActivity: '5 minutes ago'
      },
      {
        id: 'performance-optimizer-1',
        name: 'Performance Optimizer',
        type: 'performance_optimizer',
        capabilities: ['ab testing', 'optimization recommendations'],
        status: 'idle',
        performance: {
          tasksCompleted: 19,
          successRate: 88,
          avgResponseTime: 4.2
        },
        lastActivity: '1 minute ago'
      }
    ];
    setAgents(defaultAgents);
  };

  const initializeWorkflows = () => {
    const defaultWorkflows: WorkflowTask[] = [
      {
        id: 'content-pipeline-1',
        name: 'Content Creation Pipeline',
        status: 'running',
        progress: 65,
        result: null
      },
      {
        id: 'trend-analysis-1',
        name: 'Trend Analysis & Research',
        status: 'completed',
        progress: 100,
        result: 'Found 5 trending topics in your niche'
      },
      {
        id: 'optimization-1',
        name: 'Performance Optimization',
        status: 'pending',
        progress: 0
      }
    ];
    setWorkflows(defaultWorkflows);
  };

  const updateAgentMetrics = () => {
    // Simulate real-time updates
    setCompletedTasks(prev => prev + Math.floor(Math.random() * 3));
    setAvgResponseTime(`${(2.5 + Math.random() * 1).toFixed(1)}s`);
  };

  const generateContent = async (type: string) => {
    if (!topic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let endpoint = '';
      let payload: any = { topic, platform, tone, audience };

      switch (type) {
        case 'instagram':
          endpoint = '/api/ai/generate-instagram';
          break;
        case 'youtube':
          endpoint = '/api/ai/generate-youtube';
          payload.duration = duration;
          break;
        case 'tiktok':
          endpoint = '/api/ai/generate-tiktok';
          break;
        case 'ideas':
          endpoint = '/api/ai/generate-ideas';
          payload.niche = topic;
          payload.count = 10;
          break;
        case 'thumbnails':
          endpoint = '/api/ai/generate-thumbnails';
          payload.title = topic;
          break;
        case 'hashtags':
          endpoint = '/api/ai/generate-hashtags';
          payload.content = topic;
          break;
        default:
          throw new Error('Invalid generation type');
      }

      const response = await apiRequest('POST', endpoint, payload);
      const data = await response.json();

      if (data.success) {
        setResult(data);
        toast({
          title: "Success",
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} generated successfully!`
        });
      } else {
        throw new Error(data.message || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async () => {
    if (!newAgentName.trim()) {
    toast({
      title: "Error",
      description: "Please enter an agent name",
      variant: "destructive"
    });
      return;
    }

    try {
      const response = await apiRequest('POST', '/api/ai/agents/create', {
        name: newAgentName,
        type: newAgentType,
        capabilities: newAgentCapabilities,
        userId: user?.id
      });
      
      const data = await response.json();
      
      if (data.success) {
        const newAgent: Agent = {
          id: data.id,
          name: newAgentName,
          type: newAgentType,
          capabilities: newAgentCapabilities,
          status: 'idle',
          performance: {
            tasksCompleted: 0,
            successRate: 100,
            avgResponseTime: 0
          },
          lastActivity: 'Just created'
        };
        
        setAgents(prev => [...prev, newAgent]);
        setNewAgentName('');
        setNewAgentCapabilities([]);
        toast({
          title: "Success",
          description: "Agent created successfully!"
        });
      }
    } catch (error) {
      console.error('Agent creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create agent",
        variant: "destructive"
      });
    }
  };

  const startWorkflow = async (workflowType: string) => {
    try {
      const response = await apiRequest('POST', '/api/ai/workflows/start', {
        type: workflowType,
        config: {
          topic,
          platform,
          agents: agents.filter(a => a.status === 'idle').map(a => a.id)
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Workflow started successfully!"
        });
        // Update workflow status
        setWorkflows(prev => prev.map(w => 
          w.id === data.workflowId 
            ? { ...w, status: 'running', progress: 10 }
            : w
        ));
      }
    } catch (error) {
      console.error('Workflow start error:', error);
      toast({
        title: "Error",
        description: "Failed to start workflow",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Success",
      description: "Copied to clipboard!"
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'busy':
      case 'running':
        return <Activity className="h-4 w-4 text-orange-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle':
        return 'bg-blue-100 text-blue-800';
      case 'busy':
      case 'running':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-600 flex items-center gap-2">
            <Sparkles className="h-8 w-8" />
            AI Content Generator
          </h1>
          <p className="text-gray-600 mt-1">
            Cutting-edge AI features for complete content automation
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Feature Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('generator')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'generator'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles className="h-4 w-4 inline mr-2" />
          Text-to-AI
        </button>
        <button
          onClick={() => setActiveTab('orchestrator')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'orchestrator'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Bot className="h-4 w-4 inline mr-2" />
          AI Orchestrator
        </button>
        <button
          onClick={() => setActiveTab('multimodal')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'multimodal'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Zap className="h-4 w-4 inline mr-2" />
          Multimodal AI
        </button>
      </div>
    </div>
  );
}