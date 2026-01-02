/**
 * Recording state management hook with race condition prevention
 * Addresses DEF-REC-003: Race conditions in recording state management
 */

import { useState, useCallback, useRef } from 'react';

export interface RecordingState {
  isRecording: boolean;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  mediaBlob: Blob | null;
  mediaUrl: string | null;
  recordingName: string;
  recordingType: 'camera' | 'audio' | 'screen' | 'screen-camera' | 'slides-camera' | 'slides' | null;
  // Transition states to prevent race conditions
  isStarting: boolean;
  isStopping: boolean;
  isPausing: boolean;
  isResuming: boolean;
  lastAction: string | null;
  actionTimestamp: number | null;
}

export interface RecordingActions {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  resetRecording: () => void;
  updateState: (updates: Partial<RecordingState>) => void;
}

const initialState: RecordingState = {
  isRecording: false,
  isPlaying: false,
  duration: 0,
  currentTime: 0,
  mediaBlob: null,
  mediaUrl: null,
  recordingName: "New Recording",
  recordingType: null,
  isStarting: false,
  isStopping: false,
  isPausing: false,
  isResuming: false,
  lastAction: null,
  actionTimestamp: null
};

/**
 * Check if an action can be performed based on current state
 */
const canPerformAction = (
  action: string,
  currentState: RecordingState
): { allowed: boolean; reason?: string } => {
  const now = Date.now();

  // Prevent actions if already in transition
  if (currentState.isStarting) {
    return { allowed: false, reason: 'Recording is starting' };
  }
  if (currentState.isStopping) {
    return { allowed: false, reason: 'Recording is stopping' };
  }
  if (currentState.isPausing) {
    return { allowed: false, reason: 'Recording is pausing' };
  }
  if (currentState.isResuming) {
    return { allowed: false, reason: 'Recording is resuming' };
  }

  // Prevent rapid successive actions (debounce)
  if (currentState.lastAction === action &&
      currentState.actionTimestamp &&
      now - currentState.actionTimestamp < 500) {
    return { allowed: false, reason: 'Action too frequent' };
  }

  // Action-specific checks
  switch (action) {
    case 'start':
      if (currentState.isRecording) {
        return { allowed: false, reason: 'Already recording' };
      }
      break;

    case 'stop':
      if (!currentState.isRecording) {
        return { allowed: false, reason: 'Not recording' };
      }
      break;

    case 'pause':
      if (!currentState.isRecording || currentState.isPausing) {
        return { allowed: false, reason: 'Cannot pause' };
      }
      break;

    case 'resume':
      if (currentState.isRecording || currentState.isResuming) {
        return { allowed: false, reason: 'Cannot resume' };
      }
      break;
  }

  return { allowed: true };
};

/**
 * Recording state management hook with race condition prevention
 */
export const useRecordingState = () => {
  const [state, setState] = useState<RecordingState>(initialState);
  const actionQueueRef = useRef<Promise<void>[]>([]);

  /**
   * Update state with validation
   */
  const updateState = useCallback((updates: Partial<RecordingState>) => {
    setState(prevState => {
      // Prevent invalid state transitions
      if (updates.isRecording === true && prevState.isRecording === true) {
        console.warn('⚠️ Attempted to set recording=true when already recording');
        return prevState;
      }

      if (updates.isRecording === false && prevState.isRecording === false) {
        console.warn('⚠️ Attempted to set recording=false when not recording');
        return prevState;
      }

      return { ...prevState, ...updates };
    });
  }, []);

  /**
   * Execute action with queue management to prevent race conditions
   */
  const executeAction = useCallback(async (
    action: string,
    actionFn: () => Promise<void>
  ): Promise<void> => {
    // Check if action is allowed
    const actionCheck = canPerformAction(action, state);
    if (!actionCheck.allowed) {
      console.warn(`🚫 Action '${action}' not allowed: ${actionCheck.reason}`);
      return;
    }

    // Add to queue to prevent concurrent execution
    const actionPromise = (async () => {
      try {
        // Set transition state
        updateState({
          [`is${action.charAt(0).toUpperCase() + action.slice(1)}ing`]: true,
          lastAction: action,
          actionTimestamp: Date.now()
        });

        console.log(`▶️ Executing action: ${action}`);
        await actionFn();

        // Clear transition state on success
        updateState({
          [`is${action.charAt(0).toUpperCase() + action.slice(1)}ing`]: false
        });

        console.log(`✅ Action completed: ${action}`);
      } catch (error) {
        console.error(`❌ Action failed: ${action}`, error);

        // Clear transition state on error
        updateState({
          [`is${action.charAt(0).toUpperCase() + action.slice(1)}ing`]: false
        });

        throw error;
      }
    })();

    actionQueueRef.current.push(actionPromise);

    try {
      await actionPromise;
    } finally {
      // Remove from queue
      actionQueueRef.current = actionQueueRef.current.filter(p => p !== actionPromise);
    }
  }, [state, updateState]);

  /**
   * Start recording with race condition prevention
   */
  const startRecording = useCallback(async (): Promise<void> => {
    await executeAction('start', async () => {
      // Implementation would go here
      // This is a placeholder - actual implementation would interact with MediaRecorder
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async operation

      updateState({ isRecording: true });
    });
  }, [executeAction, updateState]);

  /**
   * Stop recording with race condition prevention
   */
  const stopRecording = useCallback(async (): Promise<void> => {
    await executeAction('stop', async () => {
      // Implementation would go here
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async operation

      updateState({ isRecording: false });
    });
  }, [executeAction, updateState]);

  /**
   * Pause recording with race condition prevention
   */
  const pauseRecording = useCallback(async (): Promise<void> => {
    await executeAction('pause', async () => {
      // Implementation would go here
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async operation

      updateState({ isRecording: false }); // Paused state
    });
  }, [executeAction, updateState]);

  /**
   * Resume recording with race condition prevention
   */
  const resumeRecording = useCallback(async (): Promise<void> => {
    await executeAction('resume', async () => {
      // Implementation would go here
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async operation

      updateState({ isRecording: true });
    });
  }, [executeAction, updateState]);

  /**
   * Reset recording state
   */
  const resetRecording = useCallback(() => {
    setState(initialState);
    console.log('🔄 Recording state reset');
  }, []);

  const actions: RecordingActions = {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    updateState
  };

  return { state, actions };
};

/**
 * Hook for monitoring state transitions and detecting potential issues
 */
export const useRecordingStateMonitor = (state: RecordingState) => {
  const prevStateRef = useRef<RecordingState>(state);

  // Monitor for invalid state transitions
  if (prevStateRef.current.isRecording !== state.isRecording) {
    console.log(`📊 Recording state changed: ${prevStateRef.current.isRecording} → ${state.isRecording}`);
  }

  // Monitor for multiple transition states being true simultaneously
  const transitionStates = [state.isStarting, state.isStopping, state.isPausing, state.isResuming];
  const activeTransitions = transitionStates.filter(Boolean).length;

  if (activeTransitions > 1) {
    console.warn('⚠️ Multiple transition states active simultaneously:', {
      isStarting: state.isStarting,
      isStopping: state.isStopping,
      isPausing: state.isPausing,
      isResuming: state.isResuming
    });
  }

  prevStateRef.current = state;
};
