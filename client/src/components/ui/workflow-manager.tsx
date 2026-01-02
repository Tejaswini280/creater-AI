import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Clock,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Settings,
  Zap,
  Calendar,
  FileText,
  Send,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Bell,
  CheckSquare,
  Square,
  Info
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useDevice } from './mobile-responsive-layout';

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  progress?: number;
  estimatedDuration?: number;
  actualDuration?: number;
  error?: string;
  retryCount?: number;
  maxRetries?: number;
  dependencies?: string[];
  optional?: boolean;
  data?: any;
}

interface WorkflowConfig {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  autoStart?: boolean;
  allowParallel?: boolean;
  allowRetry?: boolean;
  allowSkip?: boolean;
  notifications?: boolean;
  timeout?: number;
}

interface WorkflowExecution {
  id: string;
  configId: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  currentStepId?: string;
  progress: number;
  startTime?: Date;
  endTime?: Date;
  results: Record<string, any>;
  errors: Array<{ stepId: string; error: string; timestamp: Date }>;
  logs: Array<{ timestamp: Date; level: 'info' | 'warn' | 'error'; message: string; stepId?: string }>;
}

interface WorkflowManagerProps {
  workflowConfig: WorkflowConfig;
  onComplete?: (results: Record<string, any>) => void;
  onError?: (error: Error) => void;
  onStepComplete?: (stepId: string, data: any) => void;
  onStepError?: (stepId: string, error: Error) => void;
  autoStart?: boolean;
  className?: string;
}

const WORKFLOW_PRESETS = {
  projectCreation: {
    id: 'project-creation',
    name: 'Project Creation Workflow',
    description: 'Complete workflow for creating and setting up a new social media project',
    steps: [
      {
        id: 'validate-input',
        name: 'Validate Input',
        description: 'Validate project details and configuration',
        icon: CheckSquare,
        status: 'pending',
        estimatedDuration: 1000
      },
      {
        id: 'analyze-platforms',
        name: 'Analyze Platforms',
        description: 'Analyze selected social media platforms',
        icon: Settings,
        status: 'pending',
        estimatedDuration: 2000
      },
      {
        id: 'generate-calendar',
        name: 'Generate Calendar',
        description: 'Create content calendar based on configuration',
        icon: Calendar,
        status: 'pending',
        estimatedDuration: 3000
      },
      {
        id: 'ai-content-generation',
        name: 'AI Content Generation',
        description: 'Generate content using AI based on project settings',
        icon: Zap,
        status: 'pending',
        estimatedDuration: 5000
      },
      {
        id: 'optimize-content',
        name: 'Optimize Content',
        description: 'Optimize content for each platform',
        icon: Edit,
        status: 'pending',
        estimatedDuration: 2000
      },
      {
        id: 'schedule-posts',
        name: 'Schedule Posts',
        description: 'Schedule posts for optimal timing',
        icon: Clock,
        status: 'pending',
        estimatedDuration: 1000
      },
      {
        id: 'validate-schedule',
        name: 'Validate Schedule',
        description: 'Validate all scheduled posts',
        icon: CheckCircle,
        status: 'pending',
        estimatedDuration: 1000
      }
    ],
    autoStart: true,
    allowParallel: false,
    allowRetry: true,
    allowSkip: false,
    notifications: true,
    timeout: 30000
  },

  contentPublishing: {
    id: 'content-publishing',
    name: 'Content Publishing Workflow',
    description: 'Automated workflow for publishing content across platforms',
    steps: [
      {
        id: 'prepare-content',
        name: 'Prepare Content',
        description: 'Prepare content for publishing',
        icon: FileText,
        status: 'pending',
        estimatedDuration: 1000
      },
      {
        id: 'validate-connections',
        name: 'Validate Connections',
        description: 'Validate platform connections',
        icon: Settings,
        status: 'pending',
        estimatedDuration: 2000
      },
      {
        id: 'upload-media',
        name: 'Upload Media',
        description: 'Upload media files to platforms',
        icon: Send,
        status: 'pending',
        estimatedDuration: 5000
      },
      {
        id: 'publish-posts',
        name: 'Publish Posts',
        description: 'Publish posts to all platforms',
        icon: Send,
        status: 'pending',
        estimatedDuration: 3000
      },
      {
        id: 'verify-publication',
        name: 'Verify Publication',
        description: 'Verify posts were published successfully',
        icon: Eye,
        status: 'pending',
        estimatedDuration: 2000
      },
      {
        id: 'update-analytics',
        name: 'Update Analytics',
        description: 'Update analytics and performance tracking',
        icon: BarChart,
        status: 'pending',
        estimatedDuration: 1000
      }
    ],
    autoStart: false,
    allowParallel: true,
    allowRetry: true,
    allowSkip: true,
    notifications: true,
    timeout: 45000
  }
};

export default function WorkflowManager({
  workflowConfig,
  onComplete,
  onError,
  onStepComplete,
  onStepError,
  autoStart = false,
  className = ''
}: WorkflowManagerProps) {
  const { toast } = useToast();
  const device = useDevice();

  // State management
  const [execution, setExecution] = useState<WorkflowExecution>({
    id: `exec_${Date.now()}`,
    configId: workflowConfig.id,
    status: 'idle',
    progress: 0,
    results: {},
    errors: [],
    logs: []
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);

  // Initialize workflow
  useEffect(() => {
    if (autoStart && execution.status === 'idle') {
      startWorkflow();
    }
  }, [autoStart]);

  // Logging utility
  const log = useCallback((level: 'info' | 'warn' | 'error', message: string, stepId?: string) => {
    const logEntry = {
      timestamp: new Date(),
      level,
      message,
      stepId
    };

    setExecution(prev => ({
      ...prev,
      logs: [...prev.logs, logEntry]
    }));

    // Show toast for errors
    if (level === 'error') {
      toast({
        title: "Workflow Error",
        description: message,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Start workflow
  const startWorkflow = useCallback(async () => {
    log('info', `Starting workflow: ${workflowConfig.name}`);

    setExecution(prev => ({
      ...prev,
      status: 'running',
      startTime: new Date(),
      progress: 0
    }));

    // Start executing steps
    await executeStep(0);
  }, [workflowConfig.name, log]);

  // Execute individual step
  const executeStep = useCallback(async (stepIndex: number) => {
    if (stepIndex >= workflowConfig.steps.length) {
      // Workflow completed
      setExecution(prev => ({
        ...prev,
        status: 'completed',
        endTime: new Date(),
        progress: 100
      }));

      log('info', 'Workflow completed successfully');
      onComplete?.(execution.results);

      toast({
        title: "Workflow Complete! 🎉",
        description: `${workflowConfig.name} has been completed successfully.`,
      });

      return;
    }

    const step = workflowConfig.steps[stepIndex];

    if (isPaused) return;

    // Update step status
    updateStepStatus(step.id, 'running');
    setExecution(prev => ({
      ...prev,
      currentStepId: step.id
    }));

    log('info', `Executing step: ${step.name}`, step.id);

    try {
      // Simulate step execution
      await simulateStepExecution(step);

      // Mark step as completed
      updateStepStatus(step.id, 'completed');
      log('info', `Step completed: ${step.name}`, step.id);

      // Store results
      setExecution(prev => ({
        ...prev,
        results: {
          ...prev.results,
          [step.id]: { success: true, timestamp: new Date() }
        }
      }));

      onStepComplete?.(step.id, { success: true });

      // Update progress
      const progress = ((stepIndex + 1) / workflowConfig.steps.length) * 100;
      setExecution(prev => ({ ...prev, progress }));

      // Move to next step
      setTimeout(() => executeStep(stepIndex + 1), 500);

    } catch (error) {
      log('error', `Step failed: ${step.name} - ${error.message}`, step.id);

      updateStepStatus(step.id, 'failed');

      setExecution(prev => ({
        ...prev,
        errors: [...prev.errors, {
          stepId: step.id,
          error: error.message,
          timestamp: new Date()
        }]
      }));

      onStepError?.(step.id, error);

      // Handle retry logic
      if (step.retryCount < (step.maxRetries || 3)) {
        log('info', `Retrying step: ${step.name} (attempt ${step.retryCount + 1})`, step.id);
        updateStepRetryCount(step.id, (step.retryCount || 0) + 1);
        setTimeout(() => executeStep(stepIndex), 2000);
      } else {
        // Mark workflow as failed
        setExecution(prev => ({
          ...prev,
          status: 'failed',
          endTime: new Date()
        }));

        onError?.(error);
      }
    }
  }, [workflowConfig.steps, isPaused, execution.results, onComplete, onStepComplete, onStepError, onError, log]);

  // Simulate step execution (replace with actual API calls)
  const simulateStepExecution = async (step: WorkflowStep): Promise<any> => {
    const duration = step.estimatedDuration || 2000;

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setExecution(prev => {
        const stepProgress = Math.min((Date.now() - (prev.startTime?.getTime() || 0)) / duration * 100, 100);
        // Update step progress (this would need to be handled differently in a real implementation)
        return prev;
      });
    }, 100);

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        clearInterval(progressInterval);

        // Simulate random success/failure (90% success rate)
        if (Math.random() > 0.1) {
          resolve({ success: true, data: `Step ${step.name} completed` });
        } else {
          reject(new Error(`Failed to execute ${step.name}`));
        }
      }, duration);
    });
  };

  // Update step status
  const updateStepStatus = (stepId: string, status: WorkflowStep['status']) => {
    setExecution(prev => ({
      ...prev,
      steps: prev.steps?.map(step =>
        step.id === stepId ? { ...step, status } : step
      ) || []
    }));
  };

  // Update step retry count
  const updateStepRetryCount = (stepId: string, retryCount: number) => {
    setExecution(prev => ({
      ...prev,
      steps: prev.steps?.map(step =>
        step.id === stepId ? { ...step, retryCount } : step
      ) || []
    }));
  };

  // Pause/Resume workflow
  const togglePause = () => {
    setIsPaused(!isPaused);
    setExecution(prev => ({
      ...prev,
      status: isPaused ? 'running' : 'paused'
    }));

    if (isPaused && execution.currentStepId) {
      const currentIndex = workflowConfig.steps.findIndex(step => step.id === execution.currentStepId);
      if (currentIndex >= 0) {
        executeStep(currentIndex);
      }
    }
  };

  // Skip step
  const skipStep = (stepId: string) => {
    updateStepStatus(stepId, 'skipped');
    log('info', `Step skipped: ${stepId}`);

    const stepIndex = workflowConfig.steps.findIndex(step => step.id === stepId);
    if (stepIndex >= 0) {
      setTimeout(() => executeStep(stepIndex + 1), 500);
    }
  };

  // Retry step
  const retryStep = (stepId: string) => {
    const stepIndex = workflowConfig.steps.findIndex(step => step.id === stepId);
    if (stepIndex >= 0) {
      updateStepStatus(stepId, 'pending');
      setTimeout(() => executeStep(stepIndex), 500);
    }
  };

  // Cancel workflow
  const cancelWorkflow = () => {
    setExecution(prev => ({
      ...prev,
      status: 'cancelled',
      endTime: new Date()
    }));

    log('info', 'Workflow cancelled by user');
  };

  // Get step status color
  const getStepStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'skipped': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get step status icon
  const getStepStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'running': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'skipped': return <SkipForward className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Format duration
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  // Calculate estimated total time
  const estimatedTotalTime = workflowConfig.steps.reduce((total, step) =>
    total + (step.estimatedDuration || 0), 0
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Workflow Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Play className="h-5 w-5" />
                <span>{workflowConfig.name}</span>
              </CardTitle>
              <p className="text-gray-600 mt-1">{workflowConfig.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={
                execution.status === 'running' ? 'default' :
                execution.status === 'completed' ? 'secondary' :
                execution.status === 'failed' ? 'destructive' : 'outline'
              }>
                {execution.status}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(execution.progress)}%</span>
            </div>
            <Progress value={execution.progress} className="h-3" />

            {execution.startTime && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Started: {execution.startTime.toLocaleTimeString()}</span>
                {execution.endTime && (
                  <span>Duration: {formatDuration(execution.endTime.getTime() - execution.startTime.getTime())}</span>
                )}
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center space-x-2 mt-4">
            {execution.status === 'idle' && (
              <Button onClick={startWorkflow} className="bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4 mr-2" />
                Start Workflow
              </Button>
            )}

            {execution.status === 'running' && (
              <Button onClick={togglePause} variant="outline">
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}

            {execution.status === 'paused' && (
              <Button onClick={togglePause} className="bg-blue-600 hover:bg-blue-700">
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}

            {(execution.status === 'running' || execution.status === 'paused') && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Workflow</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this workflow? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Running</AlertDialogCancel>
                    <AlertDialogAction onClick={cancelWorkflow} className="bg-red-600 hover:bg-red-700">
                      Cancel Workflow
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <div className="ml-auto text-sm text-gray-500">
              Est. time: {formatDuration(estimatedTotalTime)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Workflow Steps</span>
            <Badge variant="outline">{workflowConfig.steps.length} steps</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workflowConfig.steps.map((step, index) => {
              const Icon = step.icon;
              const isCurrentStep = execution.currentStepId === step.id;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center space-x-4 p-4 rounded-lg border transition-all ${
                    isCurrentStep ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  {/* Step Number & Status */}
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      step.status === 'completed' ? 'bg-green-100 border-green-500' :
                      step.status === 'running' ? 'bg-blue-100 border-blue-500' :
                      step.status === 'failed' ? 'bg-red-100 border-red-500' :
                      step.status === 'skipped' ? 'bg-gray-100 border-gray-500' :
                      'bg-gray-100 border-gray-300'
                    }`}>
                      {step.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : step.status === 'running' ? (
                        <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                      ) : step.status === 'failed' ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : step.status === 'skipped' ? (
                        <SkipForward className="h-4 w-4 text-gray-600" />
                      ) : (
                        <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                      )}
                    </div>

                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>

                  {/* Step Details */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{step.name}</h4>
                      <Badge className={`text-xs ${getStepStatusColor(step.status)}`}>
                        {step.status}
                      </Badge>
                      {isCurrentStep && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>

                    {step.estimatedDuration && (
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Est: {formatDuration(step.estimatedDuration)}</span>
                        {step.actualDuration && (
                          <span>Actual: {formatDuration(step.actualDuration)}</span>
                        )}
                        {step.retryCount && step.retryCount > 0 && (
                          <span>Retries: {step.retryCount}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Step Actions */}
                  <div className="flex items-center space-x-2">
                    {step.status === 'failed' && workflowConfig.allowRetry && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retryStep(step.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}

                    {step.optional && step.status === 'pending' && workflowConfig.allowSkip && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => skipStep(step.id)}
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedStep(step)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Logs (Collapsible) */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Workflow Logs</span>
                  <Badge variant="outline">{execution.logs.length} entries</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {execution.logs.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No logs yet</p>
                  ) : (
                    execution.logs.slice(-20).map((log, index) => (
                      <div key={index} className="flex items-start space-x-3 p-2 rounded bg-gray-50">
                        <Badge variant={
                          log.level === 'error' ? 'destructive' :
                          log.level === 'warn' ? 'secondary' : 'outline'
                        } className="text-xs">
                          {log.level.toUpperCase()}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm">{log.message}</p>
                          <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                            <span>{log.timestamp.toLocaleTimeString()}</span>
                            {log.stepId && <span>• Step: {log.stepId}</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Details Dialog */}
      <Dialog open={!!selectedStep} onOpenChange={() => setSelectedStep(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedStep && <selectedStep.icon className="h-5 w-5" />}
              <span>{selectedStep?.name}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedStep && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-gray-600">{selectedStep.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status:</span>
                  <Badge className={`ml-2 ${getStepStatusColor(selectedStep.status)}`}>
                    {selectedStep.status}
                  </Badge>
                </div>

                {selectedStep.estimatedDuration && (
                  <div>
                    <span className="font-medium">Est. Duration:</span>
                    <span className="ml-2">{formatDuration(selectedStep.estimatedDuration)}</span>
                  </div>
                )}

                {selectedStep.actualDuration && (
                  <div>
                    <span className="font-medium">Actual Duration:</span>
                    <span className="ml-2">{formatDuration(selectedStep.actualDuration)}</span>
                  </div>
                )}

                {selectedStep.retryCount && (
                  <div>
                    <span className="font-medium">Retry Count:</span>
                    <span className="ml-2">{selectedStep.retryCount}</span>
                  </div>
                )}
              </div>

              {selectedStep.error && (
                <div>
                  <h4 className="font-medium mb-2 text-red-600">Error</h4>
                  <p className="text-red-600 bg-red-50 p-3 rounded">{selectedStep.error}</p>
                </div>
              )}

              {selectedStep.data && (
                <div>
                  <h4 className="font-medium mb-2">Data</h4>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedStep.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Workflow presets for easy use
export { WORKFLOW_PRESETS };
