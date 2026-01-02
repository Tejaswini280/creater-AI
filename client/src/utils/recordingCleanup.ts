/**
 * Recording cleanup utilities to prevent memory leaks
 * Addresses DEF-REC-001: Memory leaks in recording sessions
 */

export interface RecordingRefs {
  streamRef: React.MutableRefObject<MediaStream | null>;
  screenStreamRef: React.MutableRefObject<MediaStream | null>;
  cameraStreamRef: React.MutableRefObject<MediaStream | null>;
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  canvasContextRef: React.MutableRefObject<CanvasRenderingContext2D | null>;
  animationFrameRef: React.MutableRefObject<number | null>;
  liveVideoRef: React.MutableRefObject<HTMLVideoElement | null>;
  recordingTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

/**
 * Stop all tracks in a media stream
 */
export const stopMediaStream = (stream: MediaStream | null): void => {
  if (!stream) return;

  console.log(`🧹 Stopping ${stream.getTracks().length} tracks`);
  stream.getTracks().forEach(track => {
    if (track.readyState !== 'ended') {
      track.stop();
      console.log(`🛑 Stopped track: ${track.label} (${track.kind})`);
    }
  });
};

/**
 * Clean up MediaRecorder instance
 */
export const cleanupMediaRecorder = (mediaRecorder: MediaRecorder | null): void => {
  if (!mediaRecorder) return;

  try {
    // Stop recording if active
    if (mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      console.log('🧹 Stopped active MediaRecorder');
    }

    // Remove all event listeners
    mediaRecorder.onstart = null;
    mediaRecorder.onstop = null;
    mediaRecorder.ondataavailable = null;
    mediaRecorder.onerror = null;

    console.log('🧹 Cleaned up MediaRecorder');
  } catch (error) {
    console.warn('Error cleaning up MediaRecorder:', error);
  }
};

/**
 * Clean up canvas and context
 */
export const cleanupCanvas = (
  canvas: HTMLCanvasElement | null,
  context: CanvasRenderingContext2D | null
): void => {
  if (!canvas || !context) return;

  try {
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Reset canvas size
    canvas.width = 0;
    canvas.height = 0;

    console.log('🧹 Cleaned up canvas');
  } catch (error) {
    console.warn('Error cleaning up canvas:', error);
  }
};

/**
 * Clean up video element
 */
export const cleanupVideoElement = (video: HTMLVideoElement | null): void => {
  if (!video) return;

  try {
    // Pause video
    if (!video.paused) {
      video.pause();
    }

    // Clear source
    video.src = '';
    video.srcObject = null;

    // Remove event listeners
    video.onloadedmetadata = null;
    video.ontimeupdate = null;
    video.onended = null;
    video.onplay = null;
    video.onpause = null;

    console.log('🧹 Cleaned up video element');
  } catch (error) {
    console.warn('Error cleaning up video element:', error);
  }
};

/**
 * Clean up animation frame
 */
export const cleanupAnimationFrame = (animationId: number | null): void => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    console.log('🧹 Cancelled animation frame');
  }
};

/**
 * Clean up timer
 */
export const cleanupTimer = (timer: NodeJS.Timeout | null): void => {
  if (timer) {
    clearInterval(timer);
    console.log('🧹 Cleared recording timer');
  }
};

/**
 * Comprehensive cleanup function for all recording resources
 * This addresses the memory leak issues identified in DEF-REC-001
 */
export const cleanupRecordingResources = (refs: RecordingRefs): void => {
  console.log('🧹 Starting comprehensive recording cleanup');

  // Stop all media streams
  stopMediaStream(refs.streamRef.current);
  stopMediaStream(refs.screenStreamRef.current);
  stopMediaStream(refs.cameraStreamRef.current);

  // Clear stream references
  refs.streamRef.current = null;
  refs.screenStreamRef.current = null;
  refs.cameraStreamRef.current = null;

  // Clean up MediaRecorder
  cleanupMediaRecorder(refs.mediaRecorderRef.current);
  refs.mediaRecorderRef.current = null;

  // Clean up video elements
  cleanupVideoElement(refs.videoRef.current);
  cleanupVideoElement(refs.liveVideoRef.current);

  // Clean up canvas
  cleanupCanvas(refs.canvasRef.current, refs.canvasContextRef.current);
  refs.canvasContextRef.current = null;

  // Clean up animation frame
  cleanupAnimationFrame(refs.animationFrameRef.current);
  refs.animationFrameRef.current = null;

  // Clean up timer
  cleanupTimer(refs.recordingTimerRef.current);
  refs.recordingTimerRef.current = null;

  console.log('✅ Recording cleanup completed');
};

/**
 * React hook for automatic cleanup on unmount
 */
export const useRecordingCleanup = (refs: RecordingRefs): void => {
  React.useEffect(() => {
    return () => {
      cleanupRecordingResources(refs);
    };
  }, []);
};

/**
 * Memory usage monitoring utility
 */
export const getMemoryUsage = (): {
  used: number;
  total: number;
  limit: number;
} | null => {
  if (!(window.performance as any).memory) return null;

  const memory = (window.performance as any).memory;
  return {
    used: memory.usedJSHeapSize,
    total: memory.totalJSHeapSize,
    limit: memory.jsHeapSizeLimit
  };
};

/**
 * Monitor for memory leaks during recording sessions
 */
export const monitorMemoryUsage = (
  onMemoryWarning: (usage: { used: number; total: number; limit: number }) => void
): (() => void) => {
  const checkMemory = () => {
    const usage = getMemoryUsage();
    if (usage) {
      const usagePercent = (usage.used / usage.limit) * 100;
      if (usagePercent > 80) {
        console.warn('⚠️ High memory usage detected:', usagePercent.toFixed(1) + '%');
        onMemoryWarning(usage);
      }
    }
  };

  const intervalId = setInterval(checkMemory, 5000); // Check every 5 seconds

  return () => clearInterval(intervalId);
};
