import { EventEmitter } from 'events';
import { nanoid } from 'nanoid';

// Agent Communication Protocol
export interface AgentMessage {
  id: string;
  from: AgentId;
  to: AgentId | 'broadcast';
  type: 'request' | 'response' | 'notification' | 'error';
  payload: any;
  timestamp: Date;
  correlationId: string;
}

export interface Agent {
  id: AgentId;
  capabilities: string[];
  status: 'idle' | 'busy' | 'error';
  metadata: AgentMetadata;
  
  // Communication methods
  sendMessage(message: AgentMessage): Promise<void>;
  receiveMessage(message: AgentMessage): Promise<void>;
  broadcastMessage(message: AgentMessage): Promise<void>;
}

export interface AgentMetadata {
  name: string;
  description: string;
  version: string;
  lastHeartbeat: Date;
  performance: AgentPerformance;
}

export interface AgentPerformance {
  tasksCompleted: number;
  averageResponseTime: number;
  successRate: number;
  errorCount: number;
}

export type AgentId = string;

// Base Agent Implementation
export abstract class BaseAgent extends EventEmitter implements Agent {
  public id: AgentId;
  public capabilities: string[];
  public status: 'idle' | 'busy' | 'error' = 'idle';
  public metadata: AgentMetadata;

  constructor(
    id: AgentId,
    capabilities: string[],
    metadata: Omit<AgentMetadata, 'lastHeartbeat' | 'performance'>
  ) {
    super();
    this.id = id;
    this.capabilities = capabilities;
    this.metadata = {
      ...metadata,
      lastHeartbeat: new Date(),
      performance: {
        tasksCompleted: 0,
        averageResponseTime: 0,
        successRate: 100,
        errorCount: 0
      }
    };

    // Start heartbeat
    this.startHeartbeat();
  }

  async sendMessage(message: AgentMessage): Promise<void> {
    // Override in subclasses for specific communication
    this.emit('message', message);
  }

  async receiveMessage(message: AgentMessage): Promise<void> {
    try {
      this.status = 'busy';
      const startTime = Date.now();

      const response = await this.processMessage(message);
      
      const responseTime = Date.now() - startTime;
      this.updatePerformance(true, responseTime);

      if (response) {
        await this.sendMessage(response);
      }
    } catch (error) {
      this.updatePerformance(false, 0);
      this.status = 'error';
      
      const errorResponse: AgentMessage = {
        id: nanoid(),
        from: this.id,
        to: message.from,
        type: 'error',
        payload: { error: error.message },
        timestamp: new Date(),
        correlationId: message.correlationId
      };
      
      await this.sendMessage(errorResponse);
    } finally {
      this.status = 'idle';
    }
  }

  async broadcastMessage(message: AgentMessage): Promise<void> {
    const broadcastMessage: AgentMessage = {
      ...message,
      to: 'broadcast'
    };
    await this.sendMessage(broadcastMessage);
  }

  protected abstract processMessage(message: AgentMessage): Promise<AgentMessage | null>;

  private startHeartbeat(): void {
    setInterval(() => {
      this.metadata.lastHeartbeat = new Date();
      this.emit('heartbeat', this.id);
    }, 30000); // 30 seconds
  }

  private updatePerformance(success: boolean, responseTime: number): void {
    const perf = this.metadata.performance;
    
    if (success) {
      perf.tasksCompleted++;
      perf.averageResponseTime = 
        (perf.averageResponseTime * (perf.tasksCompleted - 1) + responseTime) / perf.tasksCompleted;
    } else {
      perf.errorCount++;
    }
    
    perf.successRate = (perf.tasksCompleted / (perf.tasksCompleted + perf.errorCount)) * 100;
  }
}

// Agent Orchestrator
export class AgentOrchestrator extends EventEmitter {
  private agents: Map<AgentId, Agent> = new Map();
  private workflows: Map<WorkflowId, WorkflowDefinition> = new Map();
  private messageBroker: AgentMessageBroker;

  constructor() {
    super();
    this.messageBroker = new AgentMessageBroker();
    this.setupMessageRouting();
  }

  async registerAgent(agent: Agent): Promise<void> {
    this.agents.set(agent.id, agent);
    
    // Subscribe to agent messages
    agent.on('message', (message: AgentMessage) => {
      this.messageBroker.routeMessage(message);
    });

    // Notify other agents
    await this.notifyAgentNetwork(agent);
    
    this.emit('agentRegistered', agent);
  }

  async unregisterAgent(agentId: AgentId): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      this.agents.delete(agentId);
      this.emit('agentUnregistered', agent);
    }
  }

  async executeWorkflow(workflowId: WorkflowId, input: any): Promise<any> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const executionId = nanoid();
    this.emit('workflowStarted', { workflowId, executionId, input });

    try {
      const result = await this.orchestrateWorkflow(workflow, input, executionId);
      this.emit('workflowCompleted', { workflowId, executionId, result });
      return result;
    } catch (error) {
      this.emit('workflowFailed', { workflowId, executionId, error });
      throw error;
    }
  }

  private async orchestrateWorkflow(
    workflow: WorkflowDefinition, 
    input: any, 
    executionId: string
  ): Promise<any> {
    const context = { 
      input, 
      results: new Map<string, any>(),
      executionId,
      startTime: Date.now()
    };

    // Execute steps in dependency order
    const executionOrder = this.buildExecutionOrder(workflow.steps);

    for (const stepId of executionOrder) {
      const step = workflow.steps.find(s => s.id === stepId);
      if (!step) continue;

      try {
        const stepInput = this.buildStepInput(step, context);
        const result = await this.executeStep(step, stepInput, context);
        
        context.results.set(step.id, result);
        
        // Check conditions for branching
        await this.evaluateConditions(workflow.conditions, context);
        
      } catch (error) {
        await this.handleStepError(step, error, context);
      }
    }

    return this.buildFinalResult(workflow, context);
  }

  private async executeStep(
    step: WorkflowStep, 
    input: any, 
    context: WorkflowContext
  ): Promise<any> {
    const agent = this.agents.get(step.agentId);
    if (!agent) {
      throw new Error(`Agent ${step.agentId} not found`);
    }

    const message: AgentMessage = {
      id: nanoid(),
      from: 'orchestrator',
      to: step.agentId,
      type: 'request',
      payload: { step, input, context },
      timestamp: new Date(),
      correlationId: context.executionId
    };

    // Send message and wait for response
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Step ${step.id} timed out`));
      }, step.timeout * 1000);

      const handleResponse = (response: AgentMessage) => {
        if (response.correlationId === context.executionId) {
          clearTimeout(timeout);
          agent.off('message', handleResponse);
          
          if (response.type === 'error') {
            reject(new Error(response.payload.error));
          } else {
            resolve(response.payload);
          }
        }
      };

      agent.on('message', handleResponse);
      agent.receiveMessage(message);
    });
  }

  private buildExecutionOrder(steps: WorkflowStep[]): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (stepId: string) => {
      if (visiting.has(stepId)) {
        throw new Error(`Circular dependency detected involving step ${stepId}`);
      }
      if (visited.has(stepId)) return;

      visiting.add(stepId);
      
      const step = steps.find(s => s.id === stepId);
      if (step) {
        for (const depId of step.dependencies) {
          visit(depId);
        }
      }
      
      visiting.delete(stepId);
      visited.add(stepId);
      order.push(stepId);
    };

    for (const step of steps) {
      if (!visited.has(step.id)) {
        visit(step.id);
      }
    }

    return order;
  }

  private buildStepInput(step: WorkflowStep, context: WorkflowContext): any {
    const input: any = {};

    // Add dependencies
    for (const depId of step.dependencies) {
      const depResult = context.results.get(depId);
      if (depResult !== undefined) {
        input[depId] = depResult;
      }
    }

    // Add step configuration
    input.config = step.config;

    return input;
  }

  private async evaluateConditions(
    conditions: WorkflowCondition[], 
    context: WorkflowContext
  ): Promise<void> {
    for (const condition of conditions) {
      const met = await this.evaluateCondition(condition, context);
      if (met) {
        // Execute true steps
        for (const stepId of condition.trueSteps) {
          // Add to execution queue
          this.emit('conditionMet', { condition, stepId, context });
        }
      } else {
        // Execute false steps
        for (const stepId of condition.falseSteps) {
          this.emit('conditionNotMet', { condition, stepId, context });
        }
      }
    }
  }

  private async evaluateCondition(
    condition: WorkflowCondition, 
    context: WorkflowContext
  ): Promise<boolean> {
    // Simple condition evaluation
    // In production, use a proper expression evaluator
    try {
      const expression = condition.expression;
      const evalContext = {
        ...context,
        results: Object.fromEntries(context.results),
        // Add helper functions
        contains: (array: any[], item: any) => array.includes(item),
        length: (obj: any) => obj?.length || 0,
        equals: (a: any, b: any) => a === b,
        greaterThan: (a: number, b: number) => a > b,
        lessThan: (a: number, b: number) => a < b
      };

      // Safe evaluation (in production, use a proper expression parser)
      return Function(...Object.keys(evalContext), `return ${expression}`)(
        ...Object.values(evalContext)
      );
    } catch (error) {
      console.error('Condition evaluation error:', error);
      return false;
    }
  }

  private async handleStepError(
    step: WorkflowStep, 
    error: Error, 
    context: WorkflowContext
  ): Promise<void> {
    const retryPolicy = step.retryPolicy;
    const attemptCount = context.retryCounts?.get(step.id) || 0;

    if (attemptCount < retryPolicy.maxAttempts) {
      // Schedule retry
      const delay = this.calculateDelay(retryPolicy, attemptCount);
      setTimeout(() => {
        this.retryStep(step, context);
      }, delay);
    } else {
      // Final failure
      this.emit('stepFailed', { step, error, context });
      throw error;
    }
  }

  private calculateDelay(policy: RetryPolicy, attemptCount: number): number {
    switch (policy.backoffStrategy) {
      case 'fixed':
        return policy.initialDelay;
      case 'linear':
        return policy.initialDelay * attemptCount;
      case 'exponential':
        return Math.min(
          policy.initialDelay * Math.pow(2, attemptCount - 1),
          policy.maxDelay
        );
      default:
        return policy.initialDelay;
    }
  }

  private buildFinalResult(workflow: WorkflowDefinition, context: WorkflowContext): any {
    return {
      workflowId: workflow.id,
      executionId: context.executionId,
      duration: Date.now() - context.startTime,
      results: Object.fromEntries(context.results),
      success: true
    };
  }

  private async notifyAgentNetwork(agent: Agent): Promise<void> {
    const notification: AgentMessage = {
      id: nanoid(),
      from: 'orchestrator',
      to: 'broadcast',
      type: 'notification',
      payload: {
        type: 'agent_registered',
        agent: {
          id: agent.id,
          capabilities: agent.capabilities,
          metadata: agent.metadata
        }
      },
      timestamp: new Date(),
      correlationId: nanoid()
    };

    await this.messageBroker.broadcast(notification);
  }

  private setupMessageRouting(): void {
    this.messageBroker.on('message', (message: AgentMessage) => {
      if (message.to === 'broadcast') {
        // Broadcast to all agents
        for (const agent of this.agents.values()) {
          if (agent.id !== message.from) {
            agent.receiveMessage(message);
          }
        }
      } else if (message.to !== 'orchestrator') {
        // Route to specific agent
        const targetAgent = this.agents.get(message.to);
        if (targetAgent) {
          targetAgent.receiveMessage(message);
        }
      }
    });
  }
}

// Message Broker
export class AgentMessageBroker extends EventEmitter {
  private subscribers: Map<string, Agent[]> = new Map();

  async publish(channel: string, message: AgentMessage): Promise<void> {
    const subscribers = this.subscribers.get(channel) || [];
    await Promise.all(
      subscribers.map(agent => agent.receiveMessage(message))
    );
  }

  async broadcast(message: AgentMessage): Promise<void> {
    this.emit('message', message);
  }

  subscribe(channel: string, agent: Agent): void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, []);
    }
    this.subscribers.get(channel)!.push(agent);
  }

  routeMessage(message: AgentMessage): void {
    this.emit('message', message);
  }
}

// Workflow Definitions
export interface WorkflowDefinition {
  id: WorkflowId;
  name: string;
  description: string;
  steps: WorkflowStep[];
  conditions: WorkflowCondition[];
  outputs: WorkflowOutput[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'agent' | 'api' | 'manual' | 'conditional';
  agentId?: AgentId;
  config: any;
  dependencies: string[];
  timeout: number;
  retryPolicy: RetryPolicy;
}

export interface WorkflowCondition {
  id: string;
  type: 'if' | 'switch' | 'loop';
  expression: string;
  trueSteps: string[];
  falseSteps: string[];
}

export interface WorkflowOutput {
  id: string;
  name: string;
  source: string; // Step ID
  transform?: string; // Transformation expression
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  initialDelay: number;
  maxDelay: number;
}

export interface WorkflowContext {
  input: any;
  results: Map<string, any>;
  executionId: string;
  startTime: number;
  retryCounts?: Map<string, number>;
}

export type WorkflowId = string;

// Export singleton instance
export const agentOrchestrator = new AgentOrchestrator();
