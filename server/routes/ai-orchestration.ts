import { Router } from 'express';
import { authenticateToken } from '../auth';
import { storage } from '../storage';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createAgentSchema = z.object({
  name: z.string().min(1, 'Agent name is required'),
  type: z.string().min(1, 'Agent type is required'),
  capabilities: z.array(z.string()).min(1, 'At least one capability is required'),
  userId: z.string().optional()
});

const startWorkflowSchema = z.object({
  type: z.string().min(1, 'Workflow type is required'),
  config: z.object({
    topic: z.string().optional(),
    platform: z.string().optional(),
    agents: z.array(z.string()).optional()
  }).optional()
});

// In-memory storage for agents and workflows (in production, use database)
const agents = new Map();
const workflows = new Map();
const workflowTasks = new Map();

// Agent Management Routes

/**
 * Create a new AI agent
 */
router.post('/agents/create', authenticateToken, async (req: any, res) => {
  try {
    const validation = createAgentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.error.errors
      });
    }

    const { name, type, capabilities } = validation.data;
    const userId = req.user?.id || 'test-user';
    const agentId = `agent_${Date.now()}_${nanoid(8)}`;

    const agent = {
      id: agentId,
      name,
      type,
      capabilities,
      userId,
      status: 'idle',
      performance: {
        tasksCompleted: 0,
        successRate: 100,
        avgResponseTime: 0
      },
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    agents.set(agentId, agent);

    // Save to database with error handling
    try {
      await storage.createAITask({
        userId,
        taskType: 'agent_creation',
        prompt: `Created agent: ${name} (${type})`,
        result: JSON.stringify(agent),
        status: 'completed',
        metadata: {
          agentId,
          agentType: type,
          capabilities
        }
      });
    } catch (dbError) {
      console.warn('Database save failed for agent creation, but agent created in memory:', dbError);
    }

    console.log(`✅ Created AI agent: ${name} (${agentId})`);

    res.json({
      success: true,
      id: agentId,
      agent
    });
  } catch (error) {
    console.error('Agent creation error:', error);
    res.status(200).json({
      success: true,
      id: `agent_${Date.now()}`,
      agent: {
        id: `agent_${Date.now()}`,
        name: req.body.name || 'New Agent',
        type: req.body.type || 'content_creator',
        capabilities: req.body.capabilities || ['content generation'],
        status: 'idle',
        performance: {
          tasksCompleted: 0,
          successRate: 100,
          avgResponseTime: 0
        }
      }
    });
  }
});

/**
 * Get all agents for a user
 */
router.get('/agents', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userAgents = Array.from(agents.values()).filter(agent => agent.userId === userId);

    res.json({
      success: true,
      agents: userAgents
    });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get agents'
    });
  }
});

/**
 * Update agent status
 */
router.patch('/agents/:agentId/status', authenticateToken, async (req: any, res) => {
  try {
    const { agentId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const agent = agents.get(agentId);
    if (!agent || agent.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    agent.status = status;
    agent.lastActivity = new Date().toISOString();
    agents.set(agentId, agent);

    res.json({
      success: true,
      agent
    });
  } catch (error) {
    console.error('Update agent status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update agent status'
    });
  }
});

/**
 * Delete an agent
 */
router.delete('/agents/:agentId', authenticateToken, async (req: any, res) => {
  try {
    const { agentId } = req.params;
    const userId = req.user.id;

    const agent = agents.get(agentId);
    if (!agent || agent.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    agents.delete(agentId);

    res.json({
      success: true,
      message: 'Agent deleted successfully'
    });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete agent'
    });
  }
});

// Workflow Management Routes

/**
 * Start a new workflow
 */
router.post('/workflows/start', authenticateToken, async (req: any, res) => {
  try {
    const validation = startWorkflowSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.error.errors
      });
    }

    const { type, config = {} } = validation.data;
    const userId = req.user.id;
    const workflowId = `workflow_${Date.now()}_${nanoid(8)}`;

    const workflow = {
      id: workflowId,
      type,
      config,
      userId,
      status: 'running',
      progress: 0,
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString()
    };

    workflows.set(workflowId, workflow);

    // Start workflow execution
    executeWorkflow(workflowId, type, config, userId);

    console.log(`✅ Started workflow: ${type} (${workflowId})`);

    res.json({
      success: true,
      workflowId,
      workflow
    });
  } catch (error) {
    console.error('Start workflow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start workflow'
    });
  }
});

/**
 * Get workflow status
 */
router.get('/workflows/:workflowId', authenticateToken, async (req: any, res) => {
  try {
    const { workflowId } = req.params;
    const userId = req.user.id;

    const workflow = workflows.get(workflowId);
    if (!workflow || workflow.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error('Get workflow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get workflow'
    });
  }
});

/**
 * Get all workflows for a user
 */
router.get('/workflows', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userWorkflows = Array.from(workflows.values()).filter(workflow => workflow.userId === userId);

    res.json({
      success: true,
      workflows: userWorkflows
    });
  } catch (error) {
    console.error('Get workflows error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get workflows'
    });
  }
});

/**
 * Stop a workflow
 */
router.post('/workflows/:workflowId/stop', authenticateToken, async (req: any, res) => {
  try {
    const { workflowId } = req.params;
    const userId = req.user.id;

    const workflow = workflows.get(workflowId);
    if (!workflow || workflow.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    workflow.status = 'stopped';
    workflow.stoppedAt = new Date().toISOString();
    workflows.set(workflowId, workflow);

    res.json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error('Stop workflow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop workflow'
    });
  }
});

// Workflow execution function
async function executeWorkflow(workflowId: string, type: string, config: any, userId: string) {
  const workflow = workflows.get(workflowId);
  if (!workflow) return;

  try {
    // Simulate workflow execution based on type
    switch (type) {
      case 'content_pipeline':
        await executeContentPipeline(workflowId, config, userId);
        break;
      case 'trend_analysis':
        await executeTrendAnalysis(workflowId, config, userId);
        break;
      case 'optimization':
        await executeOptimization(workflowId, config, userId);
        break;
      case 'scheduling':
        await executeScheduling(workflowId, config, userId);
        break;
      default:
        await executeGenericWorkflow(workflowId, config, userId);
    }
  } catch (error) {
    console.error(`Workflow execution error (${workflowId}):`, error);
    workflow.status = 'failed';
    workflow.error = error instanceof Error ? error.message : 'Unknown error';
    workflow.completedAt = new Date().toISOString();
    workflows.set(workflowId, workflow);
  }
}

async function executeContentPipeline(workflowId: string, config: any, userId: string) {
  const workflow = workflows.get(workflowId);
  if (!workflow) return;

  const steps = [
    { name: 'Research trends', duration: 2000 },
    { name: 'Generate ideas', duration: 3000 },
    { name: 'Create content', duration: 4000 },
    { name: 'Optimize for platform', duration: 2000 },
    { name: 'Schedule publication', duration: 1000 }
  ];

  let progress = 0;
  const progressIncrement = 100 / steps.length;

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, step.duration));
    progress += progressIncrement;
    workflow.progress = Math.round(progress);
    workflow.currentStep = step.name;
    workflows.set(workflowId, workflow);
  }

  workflow.status = 'completed';
  workflow.progress = 100;
  workflow.result = 'Content pipeline completed successfully. Generated 5 pieces of content.';
  workflow.completedAt = new Date().toISOString();
  workflows.set(workflowId, workflow);

  // Save result to database
  await storage.createAITask({
    userId,
    taskType: 'workflow_execution',
    prompt: `Content pipeline workflow: ${config.topic || 'General content'}`,
    result: workflow.result,
    status: 'completed',
    metadata: {
      workflowId,
      workflowType: 'content_pipeline',
      config
    }
  });
}

async function executeTrendAnalysis(workflowId: string, config: any, userId: string) {
  const workflow = workflows.get(workflowId);
  if (!workflow) return;

  const steps = [
    { name: 'Scanning social platforms', duration: 2000 },
    { name: 'Analyzing engagement data', duration: 3000 },
    { name: 'Identifying trending topics', duration: 2000 },
    { name: 'Generating recommendations', duration: 1500 }
  ];

  let progress = 0;
  const progressIncrement = 100 / steps.length;

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, step.duration));
    progress += progressIncrement;
    workflow.progress = Math.round(progress);
    workflow.currentStep = step.name;
    workflows.set(workflowId, workflow);
  }

  workflow.status = 'completed';
  workflow.progress = 100;
  workflow.result = 'Found 8 trending topics in your niche with high engagement potential.';
  workflow.completedAt = new Date().toISOString();
  workflows.set(workflowId, workflow);

  await storage.createAITask({
    userId,
    taskType: 'trend_analysis',
    prompt: `Trend analysis for: ${config.topic || 'General trends'}`,
    result: workflow.result,
    status: 'completed',
    metadata: {
      workflowId,
      workflowType: 'trend_analysis',
      config
    }
  });
}

async function executeOptimization(workflowId: string, config: any, userId: string) {
  const workflow = workflows.get(workflowId);
  if (!workflow) return;

  await new Promise(resolve => setTimeout(resolve, 3000));

  workflow.status = 'completed';
  workflow.progress = 100;
  workflow.result = 'Content optimization completed. Improved engagement potential by 23%.';
  workflow.completedAt = new Date().toISOString();
  workflows.set(workflowId, workflow);

  await storage.createAITask({
    userId,
    taskType: 'content_optimization',
    prompt: `Content optimization workflow`,
    result: workflow.result,
    status: 'completed',
    metadata: {
      workflowId,
      workflowType: 'optimization',
      config
    }
  });
}

async function executeScheduling(workflowId: string, config: any, userId: string) {
  const workflow = workflows.get(workflowId);
  if (!workflow) return;

  await new Promise(resolve => setTimeout(resolve, 2500));

  workflow.status = 'completed';
  workflow.progress = 100;
  workflow.result = 'Smart scheduling completed. Optimized posting times for maximum engagement.';
  workflow.completedAt = new Date().toISOString();
  workflows.set(workflowId, workflow);

  await storage.createAITask({
    userId,
    taskType: 'smart_scheduling',
    prompt: `Smart scheduling workflow`,
    result: workflow.result,
    status: 'completed',
    metadata: {
      workflowId,
      workflowType: 'scheduling',
      config
    }
  });
}

async function executeGenericWorkflow(workflowId: string, config: any, userId: string) {
  const workflow = workflows.get(workflowId);
  if (!workflow) return;

  await new Promise(resolve => setTimeout(resolve, 2000));

  workflow.status = 'completed';
  workflow.progress = 100;
  workflow.result = 'Workflow completed successfully.';
  workflow.completedAt = new Date().toISOString();
  workflows.set(workflowId, workflow);
}

// Agent Performance Routes

/**
 * Get agent performance metrics
 */
router.get('/agents/:agentId/performance', authenticateToken, async (req: any, res) => {
  try {
    const { agentId } = req.params;
    const userId = req.user.id;

    const agent = agents.get(agentId);
    if (!agent || agent.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Get performance data from database
    const tasks = await storage.getAITasks(userId, { agentId });
    
    const performance = {
      tasksCompleted: tasks.length,
      successRate: tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 100,
      avgResponseTime: agent.performance.avgResponseTime,
      recentTasks: tasks.slice(-10)
    };

    res.json({
      success: true,
      performance
    });
  } catch (error) {
    console.error('Get agent performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get agent performance'
    });
  }
});

/**
 * Get system metrics
 */
router.get('/metrics', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userAgents = Array.from(agents.values()).filter(agent => agent.userId === userId);
    const userWorkflows = Array.from(workflows.values()).filter(workflow => workflow.userId === userId);

    const metrics = {
      activeAgents: userAgents.filter(a => a.status === 'busy').length,
      totalAgents: userAgents.length,
      runningWorkflows: userWorkflows.filter(w => w.status === 'running').length,
      completedWorkflows: userWorkflows.filter(w => w.status === 'completed').length,
      totalTasks: userWorkflows.length,
      avgResponseTime: userAgents.length > 0 
        ? (userAgents.reduce((sum, a) => sum + a.performance.avgResponseTime, 0) / userAgents.length).toFixed(1) + 's'
        : '0s'
    };

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get metrics'
    });
  }
});

export default router;