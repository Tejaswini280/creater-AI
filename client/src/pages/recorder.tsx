import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import videoConverter from "@/utils/videoConverter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Mic,
  Square,
  Play,
  Pause,
  Download,
  Trash2,
  Settings,
  Volume2,
  VolumeX,
  RotateCcw,
  Save,
  Camera,
  Monitor,
  Presentation,
  ArrowUp,
  ArrowDown,
  Scissors,
  Crop,
  Type,
  Palette,
  Music,
  Undo,
  Redo,
  Eye,
  EyeOff,
  Zap,
  Filter,
  Layers,
  Target,
  Sparkles,
  Video,
  MicOff,
  MonitorOff,
  X,
  Plus,
  Minus,
  Loader2,
  FolderOpen,
  Edit3,
  ArrowLeft
} from "lucide-react";
import { useLocation } from "wouter";
import { cleanupRecordingResources, useRecordingCleanup, monitorMemoryUsage, type RecordingRefs } from "@/utils/recordingCleanup";

interface RecordingState {
  isRecording: boolean;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  mediaBlob: Blob | null;
  mediaUrl: string | null;
  recordingName: string;
  recordingType: 'camera' | 'audio' | 'screen' | 'screen-camera' | 'slides-camera' | 'slides' | null;
}

interface RecordingOption {
  id: 'camera' | 'audio' | 'screen' | 'screen-camera' | 'slides-camera' | 'slides';
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
  bgColor: string;
}

// Add new interfaces for editing features
interface VideoFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  sepia: number;
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  startTime: number;
  endTime: number;
}

interface CropSettings {
  x: number;
  y: number;
  width: number;
  height: number;
}

const RECORDING_OPTIONS: RecordingOption[] = [
  {
    id: 'camera',
    title: 'Camera',
    icon: Camera,
    description: 'Record video with your camera',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'audio',
    title: 'Audio',
    icon: Mic,
    description: 'Record audio only',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    id: 'screen',
    title: 'Screen',
    icon: Monitor,
    description: 'Record your screen',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    id: 'screen-camera',
    title: 'Screen & Camera',
    icon: Monitor,
    description: 'Record screen with camera overlay',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  {
    id: 'slides-camera',
    title: 'Slides & Camera',
    icon: Presentation,
    description: 'Record slides with camera',
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  {
    id: 'slides',
    title: 'Slides',
    icon: Presentation,
    description: 'Record slides only',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  }
];

export default function Recorder() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    mediaBlob: null,
    mediaUrl: null,
    recordingName: "New Recording",
    recordingType: null
  });

  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const [showScreen, setShowScreen] = useState(false);
  const [showSlides, setShowSlides] = useState(false);
  const [activeTab, setActiveTab] = useState('record');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isLivePreview, setIsLivePreview] = useState(false);
  const [recordingQuality, setRecordingQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [audioLevel, setAudioLevel] = useState(100);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [mediaAccessError, setMediaAccessError] = useState<string | null>(null);
  const [isRetryingMediaAccess, setIsRetryingMediaAccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Export settings state
  const [exportFormat, setExportFormat] = useState<'webm' | 'mp4' | 'avi' | 'mov'>('webm');
  const [exportQuality, setExportQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [includeAudio, setIncludeAudio] = useState(true);
  const [optimizeWeb, setOptimizeWeb] = useState(true);
  const [addWatermark, setAddWatermark] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // New state for recording window
  const [showRecordingWindow, setShowRecordingWindow] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // New state for editing features
  const [activeEditingTool, setActiveEditingTool] = useState<string | null>(null);
  const [videoFilters, setVideoFilters] = useState<VideoFilters>({
    brightness: 1,
    contrast: 1,
    saturation: 1,
    blur: 0,
    sepia: 0
  });
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedTextOverlay, setSelectedTextOverlay] = useState<string | null>(null);
  const [cropSettings, setCropSettings] = useState<CropSettings>({
    x: 0,
    y: 0,
    width: 100,
    height: 100
  });
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showTextPanel, setShowTextPanel] = useState(false);
  const [showCropPanel, setShowCropPanel] = useState(false);
  const [showTrimPanel, setShowTrimPanel] = useState(false);

  // Saved recordings state with persistent storage
  const [savedRecordings, setSavedRecordings] = useState<any[]>([]);
  const [isSavingRecording, setIsSavingRecording] = useState(false);

  // URL parameters for navigation context
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [contextTitle, setContextTitle] = useState<string>('');
  const [contextDescription, setContextDescription] = useState<string>('');
  const [contextPlatform, setContextPlatform] = useState<string>('youtube');
  const [contextContentType, setContextContentType] = useState<string>('video');
  const [contextProjectId, setContextProjectId] = useState<string | null>(null);

  // Load saved recordings from localStorage on mount
  useEffect(() => {
    const loadSavedRecordings = () => {
      try {
        const saved = localStorage.getItem('creatorNexus_recordings');
        if (saved) {
          const parsedRecordings = JSON.parse(saved);
          // Re-create blob URLs for loaded recordings
          const recordingsWithUrls = parsedRecordings.map((recording: any) => ({
            ...recording,
            mediaUrl: recording.mediaBlob ? URL.createObjectURL(
              new Blob([new Uint8Array(recording.mediaBlob)], { type: 'video/webm' })
            ) : null
          }));
          setSavedRecordings(recordingsWithUrls);
          console.log('Loaded saved recordings:', recordingsWithUrls.length);
        }
      } catch (error) {
        console.error('Error loading saved recordings:', error);
      }
    };

    loadSavedRecordings();
  }, []);

  // Parse URL parameters for navigation context
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    const returnToParam = urlParams.get('returnTo');
    const titleParam = urlParams.get('title');
    const descriptionParam = urlParams.get('description');
    const platformParam = urlParams.get('platform');
    const contentTypeParam = urlParams.get('contentType');
    const projectIdParam = urlParams.get('projectId');

    if (returnToParam) setReturnTo(returnToParam);
    if (titleParam) setContextTitle(titleParam);
    if (descriptionParam) setContextDescription(descriptionParam);
    if (platformParam) setContextPlatform(platformParam);
    if (contentTypeParam) setContextContentType(contentTypeParam);
    if (projectIdParam) setContextProjectId(projectIdParam);

    // Set recording name based on context
    if (titleParam) {
      setRecordingState(prev => ({ ...prev, recordingName: titleParam }));
    }
  }, []);

  // Save recordings to localStorage whenever savedRecordings changes
  useEffect(() => {
    const saveToStorage = () => {
      try {
        // Convert blobs to array buffers for storage
        const recordingsForStorage = savedRecordings.map(recording => ({
          ...recording,
          mediaBlob: recording.mediaBlob ? Array.from(new Uint8Array(recording.mediaBlob)) : null
        }));
        localStorage.setItem('creatorNexus_recordings', JSON.stringify(recordingsForStorage));
      } catch (error) {
        console.error('Error saving recordings to storage:', error);
        toast({
          title: "Storage Error",
          description: "Failed to save recordings to local storage.",
          variant: "destructive",
        });
      }
    };

    if (savedRecordings.length > 0) {
      saveToStorage();
    }
  }, [savedRecordings]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const editCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Check authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Function to update text overlay canvas
  const updateTextOverlayCanvas = useCallback(() => {
    const canvas = document.querySelector('canvas[style*="position: absolute"]') as HTMLCanvasElement;
    if (canvas && videoRef.current) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set canvas size to match video display size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw text overlays
        textOverlays.forEach(overlay => {
          if (recordingState.currentTime >= overlay.startTime && 
              recordingState.currentTime <= overlay.endTime) {
            ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
            ctx.fillStyle = overlay.color;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            
            // Calculate position based on canvas size
            const x = (overlay.x / 100) * canvas.width;
            const y = (overlay.y / 100) * canvas.height;
            
            // Draw text with stroke for better visibility
            ctx.strokeText(overlay.text, x, y);
            ctx.fillText(overlay.text, x, y);
          }
        });
      }
    }
  }, [textOverlays, recordingState.currentTime]);

  // Initialize video element
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      const handleLoadedMetadata = () => {
        if (video.duration && isFinite(video.duration)) {
          setRecordingState(prev => ({ ...prev, duration: video.duration }));
          setTrimEnd(video.duration); // Initialize trim end time
        }
      };
      
      const handleTimeUpdate = () => {
        setRecordingState(prev => ({ ...prev, currentTime: video.currentTime }));
      };
      
      const handleEnded = () => {
        setRecordingState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('ended', handleEnded);
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, [recordingState.mediaUrl]);

  // Update text overlay canvas when time changes
  useEffect(() => {
    if (textOverlays.length > 0 && recordingState.mediaUrl) {
      updateTextOverlayCanvas();
    }
  }, [recordingState.currentTime, textOverlays, updateTextOverlayCanvas]);

  // Ensure live preview is visible during recording
  useEffect(() => {
    if (recordingState.isRecording && streamRef.current && liveVideoRef.current) {
      // Only update if the stream is different
      if (liveVideoRef.current.srcObject !== streamRef.current) {
        console.log('Updating live preview stream during recording');
        liveVideoRef.current.srcObject = streamRef.current;
        liveVideoRef.current.muted = true;
        liveVideoRef.current.playsInline = true;
        liveVideoRef.current.volume = 0;

        // Try to play, but don't block on it
        liveVideoRef.current.play().then(() => {
          setIsLivePreview(true);
          console.log('Live preview updated successfully');
        }).catch(error => {
          console.warn('Live preview autoplay prevented during recording:', error);
          // Still set as live preview even if autoplay fails - user can click to play
          setIsLivePreview(true);
        });
      } else if (!isLivePreview) {
        // Stream is already set, just ensure it's marked as live
      setIsLivePreview(true);
    }
    } else if (!recordingState.isRecording) {
      // Clear live preview when not recording
      setIsLivePreview(false);
    }
  }, [recordingState.isRecording, isLivePreview]);

  // Ensure live preview is visible when recording window is open
  useEffect(() => {
    if (showRecordingWindow && streamRef.current && liveVideoRef.current) {
      // Only update if the stream is different
      if (liveVideoRef.current.srcObject !== streamRef.current) {
        console.log('Setting up live preview for recording window');
        liveVideoRef.current.srcObject = streamRef.current;
        liveVideoRef.current.muted = true;
        liveVideoRef.current.playsInline = true;
        liveVideoRef.current.volume = 0;

        liveVideoRef.current.play().then(() => {
          setIsLivePreview(true);
          console.log('Recording window live preview started');
        }).catch(error => {
          console.warn('Recording window live preview autoplay prevented:', error);
          // Set fallback click handler
          liveVideoRef.current?.addEventListener('click', function clickHandler() {
            if (liveVideoRef.current && streamRef.current) {
              liveVideoRef.current.srcObject = streamRef.current;
              liveVideoRef.current.play().then(() => {
        setIsLivePreview(true);
              }).catch(console.error);
            }
            liveVideoRef.current?.removeEventListener('click', clickHandler);
          });
        });
      }
    }
  }, [showRecordingWindow]);

  // Initialize trim end time when duration is available
  useEffect(() => {
    if (recordingState.duration > 0) {
      setTrimEnd(recordingState.duration);
    }
  }, [recordingState.duration]);

  // Recording timer
  useEffect(() => {
    if (recordingState.isRecording && !isPaused) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [recordingState.isRecording, isPaused]);

  // Enhanced cleanup to prevent memory leaks (DEF-REC-001)
  useEffect(() => {
    // Memory usage monitoring
    const stopMemoryMonitoring = monitorMemoryUsage((usage) => {
      console.warn('⚠️ High memory usage during recording:', usage);
      toast({
        title: "High Memory Usage",
        description: "Recording may be using excessive memory. Consider stopping and restarting.",
        variant: "destructive",
      });
    });

    return () => {
      stopMemoryMonitoring();
      const refs: RecordingRefs = {
        streamRef,
        screenStreamRef,
        cameraStreamRef,
        mediaRecorderRef,
        videoRef,
        canvasRef,
        canvasContextRef,
        animationFrameRef,
        liveVideoRef,
        recordingTimerRef
      };
      cleanupRecordingResources(refs);
    };
  }, []);

  const retryMediaAccess = async () => {
    if (!recordingState.recordingType) return;

    setIsRetryingMediaAccess(true);
    setMediaAccessError(null);

    try {
      await startRecordingProcess(recordingState.recordingType);
      setShowRecordingWindow(true);
    } catch (error) {
      console.error('Error retrying media access:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMediaAccessError(errorMessage);
      toast({
        title: "Retry Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRetryingMediaAccess(false);
    }
  };

  const selectRecordingType = async (type: RecordingState['recordingType']) => {
    setRecordingState(prev => ({ ...prev, recordingType: type }));

    // Start the recording process
    try {
      await startRecordingProcess(type);
      setShowRecordingWindow(true);
    } catch (error) {
      console.error('Error starting recording process:', error);

      // Check if this is a recoverable error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isRecoverable = errorMessage.includes('permission') ||
                           errorMessage.includes('timeout') ||
                           errorMessage.includes('denied');

      if (isRecoverable) {
        setMediaAccessError(errorMessage);
        toast({
          title: "Permission Required",
          description: `${errorMessage} Use the "Try Again" button below.`,
          variant: "destructive",
        });
      } else {
        setMediaAccessError(null);
        toast({
          title: "Recording Error",
          description: "Unable to access media devices. Please check your setup.",
          variant: "destructive",
        });
        // Reset recording type if it's not recoverable
        setRecordingState(prev => ({ ...prev, recordingType: null }));
      }
    }
  };

  const startRecordingProcess = async (type: RecordingState['recordingType']) => {
    if (!type) return;

    try {
      let stream: MediaStream;
      const qualitySettings = getQualitySettings();
      
      switch (type) {
        case 'camera':
          try {
            console.log('Requesting camera access...');

            // Check if camera is available first
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasCamera = devices.some(device => device.kind === 'videoinput');

            if (!hasCamera) {
              throw new Error('No camera device found');
            }

            // Request camera access with longer timeout
            stream = await Promise.race([
              navigator.mediaDevices.getUserMedia({
                video: qualitySettings,
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  sampleRate: 44100
                }
              }),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Camera access timeout - please check permissions and try again')), 20000)
              )
            ]);

            cameraStreamRef.current = stream;
            console.log('Camera access granted successfully');
          } catch (error) {
            console.error('Camera access failed:', error);

            // Provide more specific error messages
            let errorMessage = 'Unknown error';
            if (error instanceof Error) {
              if (error.name === 'NotAllowedError') {
                errorMessage = 'Camera access denied. Please allow camera access and try again.';
              } else if (error.name === 'NotFoundError') {
                errorMessage = 'No camera device found. Please connect a camera and try again.';
              } else if (error.name === 'NotReadableError') {
                errorMessage = 'Camera is already in use by another application.';
              } else if (error.message.includes('timeout')) {
                errorMessage = 'Camera access timed out. Please check your camera and try again.';
              } else {
                errorMessage = error.message;
              }
            }

            throw new Error(`Camera access failed: ${errorMessage}`);
          }
          break;

        case 'audio':
          try {
            console.log('Requesting microphone access...');
            stream = await Promise.race([
              navigator.mediaDevices.getUserMedia({
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  sampleRate: 44100
                }
              }),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Microphone access timeout')), 10000)
              )
            ]);
            console.log('Microphone access granted');
          } catch (error) {
            console.error('Microphone access failed:', error);
            throw new Error(`Microphone access failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          break;
          
        case 'screen':
          try {
            console.log('Requesting screen capture access...');
            stream = await Promise.race([
              navigator.mediaDevices.getDisplayMedia({
                video: {
                  displaySurface: 'monitor',
                  ...qualitySettings
                },
                audio: true
              }),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Screen capture timeout')), 15000)
              )
            ]);
            screenStreamRef.current = stream;
            console.log('Screen capture access granted');
          } catch (error) {
            console.error('Screen capture failed:', error);
            throw new Error(`Screen capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          break;
          
        case 'screen-camera':
          try {
            console.log('Requesting screen and camera access...');
            const [screenStream, cameraStream] = await Promise.all([
              Promise.race([
                navigator.mediaDevices.getDisplayMedia({
                  video: {
                    displaySurface: 'monitor',
                    ...qualitySettings
                  },
                  audio: true
                }),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error('Screen capture timeout')), 15000)
                )
              ]),
              Promise.race([
                navigator.mediaDevices.getUserMedia({
                  video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                  },
                  audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                  }
                }),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error('Camera access timeout')), 10000)
                )
              ])
            ]);

            screenStreamRef.current = screenStream;
            cameraStreamRef.current = cameraStream;

            // Create composite stream
            stream = await createCompositeStream(screenStream, cameraStream);
            console.log('Screen-camera composite stream created');
          } catch (error) {
            console.error('Screen-camera access failed:', error);
            throw new Error(`Screen-camera access failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          break;

        case 'slides-camera':
          try {
            console.log('Requesting slides and camera access...');
            const [slidesStream, slidesCameraStream] = await Promise.all([
              Promise.race([
                navigator.mediaDevices.getDisplayMedia({
                  video: {
                    displaySurface: 'window',
                    ...qualitySettings
                  },
                  audio: true
                }),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error('Slides capture timeout')), 15000)
                )
              ]),
              Promise.race([
                navigator.mediaDevices.getUserMedia({
                  video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                  },
                  audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                  }
                }),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error('Camera access timeout')), 10000)
                )
              ])
            ]);

            screenStreamRef.current = slidesStream;
            cameraStreamRef.current = slidesCameraStream;

            // Create composite stream
            stream = await createCompositeStream(slidesStream, slidesCameraStream);
            console.log('Slides-camera composite stream created');
          } catch (error) {
            console.error('Slides-camera access failed:', error);
            throw new Error(`Slides-camera access failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          break;

        case 'slides':
          try {
            console.log('Requesting slides capture access...');
            stream = await Promise.race([
              navigator.mediaDevices.getDisplayMedia({
                video: {
                  displaySurface: 'window',
                  ...qualitySettings
                },
                audio: true
              }),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Slides capture timeout')), 15000)
              )
            ]);
            screenStreamRef.current = stream;
            console.log('Slides capture access granted');
          } catch (error) {
            console.error('Slides capture failed:', error);
            throw new Error(`Slides capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          break;
          
        default:
          throw new Error('Invalid recording type');
      }

      streamRef.current = stream;
      
                    // Set up live preview with improved error handling and retry logic
        const setupLivePreview = async (videoElement: HTMLVideoElement | null, stream: MediaStream) => {
          if (!videoElement) return false;

          try {
            // Clear any existing source first
            videoElement.srcObject = null;
            videoElement.pause();

            // Set new stream
            videoElement.srcObject = stream;
            videoElement.muted = true; // Mute to avoid autoplay restrictions
            videoElement.playsInline = true; // Important for mobile devices
            videoElement.volume = 0; // Ensure volume is 0 for autoplay

            // Wait for metadata to load
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => reject(new Error('Video metadata timeout')), 5000);

              const onLoadedMetadata = () => {
                clearTimeout(timeout);
                videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
                videoElement.removeEventListener('error', onError);
                resolve();
              };

              const onError = (error: Event) => {
                clearTimeout(timeout);
                videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
                videoElement.removeEventListener('error', onError);
                reject(new Error('Video load error'));
              };

              videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
              videoElement.addEventListener('error', onError);
            });

            // Try to play with retry logic
            let playAttempts = 0;
            const maxAttempts = 3;

            while (playAttempts < maxAttempts) {
              try {
            const playPromise = videoElement.play();
            if (playPromise !== undefined) {
              await playPromise;
                  console.log('Live preview started successfully on attempt', playAttempts + 1);
                  return true;
            }
                return true; // If play() doesn't return a promise, assume success
          } catch (error) {
                playAttempts++;
                console.warn(`Live preview play attempt ${playAttempts} failed:`, error);

                if (playAttempts >= maxAttempts) {
                  console.error('All live preview play attempts failed');
            return false;
          }

                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }

            return false;
          } catch (error) {
            console.error('Failed to setup live preview:', error);
            return false;
          }
        };

        // Set up live preview for recording window
        const livePreviewSuccess = await setupLivePreview(liveVideoRef.current, stream);
        if (livePreviewSuccess) {
          setIsLivePreview(true);
        } else {
          console.warn('Live preview setup failed, will retry on user interaction');
          // Set up click-to-play fallback
          if (liveVideoRef.current) {
            liveVideoRef.current.addEventListener('click', () => {
              if (liveVideoRef.current && stream) {
                liveVideoRef.current.srcObject = stream;
                liveVideoRef.current.play().then(() => {
                  setIsLivePreview(true);
                }).catch(console.error);
              }
            }, { once: true });
          }
        }
      
      // Determine MIME type based on browser support with fallback
      const mimeTypeOptions = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,vp8',
        'video/webm',
        'video/mp4',
        '' // Empty string as final fallback
      ];

      let mimeType = '';
      for (const option of mimeTypeOptions) {
        try {
          if (!option || MediaRecorder.isTypeSupported(option)) {
            mimeType = option;
            console.log(`Selected MIME type: ${mimeType || 'default'}`);
            break;
          }
        } catch (error) {
          console.warn(`MIME type ${option} not supported:`, error);
        }
      }

      if (!mimeType) {
        console.warn('No supported MIME type found, using default');
      }

      // Create MediaRecorder with error handling
      let mediaRecorder: MediaRecorder;
      try {
        const options: MediaRecorderOptions = {
          videoBitsPerSecond: recordingQuality === 'high' ? 8000000 : recordingQuality === 'medium' ? 4000000 : 2000000
        };

        if (mimeType) {
          options.mimeType = mimeType;
        }

        mediaRecorder = new MediaRecorder(stream, options);
        console.log('MediaRecorder created successfully with MIME type:', mimeType || 'default');
      } catch (error) {
        console.error('Failed to create MediaRecorder:', error);

        // Try with minimal options as fallback
        try {
          mediaRecorder = new MediaRecorder(stream);
          console.log('MediaRecorder created with minimal options');
        } catch (fallbackError) {
          console.error('Failed to create MediaRecorder even with minimal options:', fallbackError);
          throw new Error('MediaRecorder is not supported in this browser');
        }
      }

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
             mediaRecorder.onstop = () => {
         const blob = new Blob(chunksRef.current, { type: mimeType.split(';')[0] });
         const mediaUrl = URL.createObjectURL(blob);
         
         setRecordingState(prev => ({
           ...prev,
           isRecording: false,
           mediaBlob: blob,
           mediaUrl,
           duration: recordingDuration
         }));
         
                   // Stop live preview
          setIsLivePreview(false);
          if (liveVideoRef.current) {
            liveVideoRef.current.srcObject = null;
            liveVideoRef.current.pause();
          }
         
         // Set the recorded video to the main video element
         if (videoRef.current) {
           videoRef.current.srcObject = null;
           videoRef.current.src = mediaUrl;
           videoRef.current.load(); // Force reload with new source
           
           // Wait for the video to load and then update duration
           videoRef.current.addEventListener('loadedmetadata', () => {
             if (videoRef.current && videoRef.current.duration && isFinite(videoRef.current.duration)) {
               setRecordingState(prev => ({ ...prev, duration: videoRef.current!.duration }));
               setTrimEnd(videoRef.current!.duration);
             }
           }, { once: true });
         }
         
         // Stop all tracks
         if (streamRef.current) {
           streamRef.current.getTracks().forEach(track => track.stop());
         }
         if (screenStreamRef.current) {
           screenStreamRef.current.getTracks().forEach(track => track.stop());
         }
         if (cameraStreamRef.current) {
           cameraStreamRef.current.getTracks().forEach(track => track.stop());
         }
         
         // Reset timer
         setRecordingDuration(0);
         
                 // Stop compositing if it's a composite stream
        if (streamRef.current && (streamRef.current as any)._stopCompositing) {
          (streamRef.current as any)._stopCompositing();
        }
         
         // Cancel animation frame
         if (animationFrameRef.current) {
           cancelAnimationFrame(animationFrameRef.current);
         }
         
         // Close recording window and show preview
         setShowRecordingWindow(false);
         setActiveTab('preview');
         
         toast({
           title: "Recording Complete",
           description: "Your recording is ready for editing and export.",
         });
       };

             // Auto-start recording after setup with better error handling
       setTimeout(() => {
         if (mediaRecorder && mediaRecorder.state === 'inactive') {
           try {
             console.log('Auto-starting recording...');
             startRecording();
           } catch (error) {
             console.error('Failed to auto-start recording:', error);
             toast({
               title: "Recording Start Failed",
               description: "Unable to start recording automatically. Please try starting manually.",
               variant: "destructive",
             });
           }
         } else {
           console.warn('MediaRecorder not ready for auto-start:', mediaRecorder?.state);
         }
       }, 500); // Increased delay to ensure everything is ready

       // Ensure live preview is visible in recording window
       if (liveVideoRef.current && stream) {
         liveVideoRef.current.srcObject = stream;
                 liveVideoRef.current.muted = true;
        liveVideoRef.current.playsInline = true;
        liveVideoRef.current.play().catch(error => {
          console.warn('Recording setup live preview autoplay prevented:', error);
        });
        setIsLivePreview(true);
       }

    } catch (error) {
      console.error('Error starting recording process:', error);
      toast({
        title: "Recording Error",
        description: "Unable to access media devices. Please check permissions.",
        variant: "destructive",
      });
      setShowRecordingWindow(false);
    }
  };

  const getQualitySettings = () => {
    switch (recordingQuality) {
      case 'high':
        return { width: { ideal: 1920 }, height: { ideal: 1080 } };
      case 'medium':
        return { width: { ideal: 1280 }, height: { ideal: 720 } };
      case 'low':
        return { width: { ideal: 854 }, height: { ideal: 480 } };
      default:
        return { width: { ideal: 1280 }, height: { ideal: 720 } };
    }
  };

  const createCompositeStream = useCallback(async (screenStream: MediaStream, cameraStream: MediaStream) => {
    if (!canvasRef.current) return screenStream;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return screenStream;

    canvasContextRef.current = ctx;
    
    // Set canvas size to match screen stream
    const videoTrack = screenStream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    canvas.width = settings.width || 1920;
    canvas.height = settings.height || 1080;

    // Create video elements for compositing
    const screenVideo = document.createElement('video');
    const cameraVideo = document.createElement('video');
    
    screenVideo.srcObject = screenStream;
    cameraVideo.srcObject = cameraStream;
    
    // Set video properties for smooth playback
    screenVideo.muted = true;
    cameraVideo.muted = true;
    screenVideo.playsInline = true;
    cameraVideo.playsInline = true;

    // Store video elements for cleanup
    const videoElements = [screenVideo, cameraVideo];

    let isCompositingActive = true;

    // Wait for both videos to be ready
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Screen video load timeout'));
        }, 5000);

        screenVideo.addEventListener('loadedmetadata', () => {
          clearTimeout(timeout);
          resolve();
        }, { once: true });

        screenVideo.addEventListener('error', (e) => {
          clearTimeout(timeout);
          reject(new Error('Screen video load error'));
        }, { once: true });

        screenVideo.play().catch(err => {
          console.warn('Screen video autoplay failed:', err);
          // Still resolve since metadata loaded
          clearTimeout(timeout);
          resolve();
        });
      }),
      new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Camera video load timeout'));
        }, 5000);

        cameraVideo.addEventListener('loadedmetadata', () => {
          clearTimeout(timeout);
          resolve();
        }, { once: true });

        cameraVideo.addEventListener('error', (e) => {
          clearTimeout(timeout);
          reject(new Error('Camera video load error'));
        }, { once: true });

        cameraVideo.play().catch(err => {
          console.warn('Camera video autoplay failed:', err);
          // Still resolve since metadata loaded
          clearTimeout(timeout);
          resolve();
        });
      })
    ]);

    console.log('Both video streams ready for compositing');

    // Track last frame time for smooth animation
    let lastFrameTime = 0;
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;

    // Start compositing with improved frame timing and smooth motion
    const compositeFrame = (currentTime: number) => {
      if (!ctx || !isCompositingActive) {
        console.log('Compositing stopped or context unavailable');
        return;
      }

      // Control frame rate for smooth motion
      if (currentTime - lastFrameTime < frameInterval) {
        if (isCompositingActive) {
          animationFrameRef.current = requestAnimationFrame(compositeFrame);
        }
        return;
      }

      lastFrameTime = currentTime;
      
      try {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Ensure videos are playing and ready
        if (screenVideo.readyState >= 2) { // HAVE_CURRENT_DATA or better
          // Force video to update its current frame
          if (screenVideo.paused || screenVideo.ended) {
            screenVideo.play().catch(() => {}); // Ignore play errors during compositing
          }
        ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
        }
        
        // Draw camera overlay in bottom-right corner
        const cameraWidth = Math.max(160, canvas.width * 0.25); // Minimum 160px
        const cameraHeight = cameraWidth * 0.75; // 4:3 aspect ratio
        const cameraX = canvas.width - cameraWidth - 20;
        const cameraY = canvas.height - cameraHeight - 20;
        
        // Add shadow for better visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        // Draw camera video if ready
        if (cameraVideo.readyState >= 2) {
          // Force video to update its current frame
          if (cameraVideo.paused || cameraVideo.ended) {
            cameraVideo.play().catch(() => {}); // Ignore play errors during compositing
          }
        ctx.drawImage(cameraVideo, cameraX, cameraY, cameraWidth, cameraHeight);
        }
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Add border around camera
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(cameraX, cameraY, cameraWidth, cameraHeight);
        
        // Add corner indicators
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cameraX - 2, cameraY - 2, 6, 6);
        ctx.fillRect(cameraX + cameraWidth - 4, cameraY - 2, 6, 6);
        ctx.fillRect(cameraX - 2, cameraY + cameraHeight - 4, 6, 6);
        ctx.fillRect(cameraX + cameraWidth - 4, cameraY + cameraHeight - 4, 6, 6);

        // Continue compositing at target frame rate
        if (isCompositingActive) {
        animationFrameRef.current = requestAnimationFrame(compositeFrame);
        }
      } catch (error) {
        console.error('Error in composite frame:', error);
        // Continue compositing even if there's an error, but add delay to prevent spam
        if (isCompositingActive) {
          setTimeout(() => {
            if (isCompositingActive) {
        animationFrameRef.current = requestAnimationFrame(compositeFrame);
            }
          }, 100);
        }
      }
    };

    // Start compositing immediately
    compositeFrame(recordingState.currentTime);
    
    // Return canvas stream with proper frame rate
    const compositeStream = canvas.captureStream(30);

    // Add cleanup function to stop compositing
    const stopCompositing = () => {
      isCompositingActive = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Clean up video elements
      videoElements.forEach(video => {
        video.srcObject = null;
        video.remove();
      });
    };

    // Store cleanup function for later use
    (compositeStream as any)._stopCompositing = stopCompositing;

    return compositeStream;
  }, []);

  const startRecording = () => {
    if (!mediaRecorderRef.current) {
      console.error('Cannot start recording: MediaRecorder not initialized');
      toast({
        title: "Recording Setup Failed",
        description: "MediaRecorder is not ready. Please select a recording type first.",
        variant: "destructive",
      });
      return;
    }

    if (recordingState.isRecording) {
      console.warn('Cannot start recording: Already recording');
      return;
    }

    try {
      // Ensure live preview is showing before starting recording
      if (liveVideoRef.current && streamRef.current) {
        // Only update if stream has changed
        if (liveVideoRef.current.srcObject !== streamRef.current) {
        liveVideoRef.current.srcObject = streamRef.current;
        liveVideoRef.current.muted = true;
        liveVideoRef.current.playsInline = true;
          liveVideoRef.current.volume = 0;

          liveVideoRef.current.play().then(() => {
            setIsLivePreview(true);
            console.log('Recording start live preview successful');
          }).catch(error => {
          console.warn('Recording start live preview autoplay prevented:', error);
            // Still set as live preview for composite streams
            setIsLivePreview(true);
        });
        } else {
        setIsLivePreview(true);
        }
      }

      // Check MediaRecorder state before starting
      if (mediaRecorderRef.current.state !== 'inactive') {
        console.warn('MediaRecorder not in inactive state:', mediaRecorderRef.current.state);
        toast({
          title: "Recording State Error",
          description: `MediaRecorder is in ${mediaRecorderRef.current.state} state. Please try again.`,
          variant: "destructive",
        });
        return;
      }

      console.log('Starting MediaRecorder...');
      mediaRecorderRef.current.start();
      console.log('MediaRecorder started successfully');

      setRecordingState(prev => ({ ...prev, isRecording: true }));
      setIsPaused(false);
      toast({
        title: "Recording Started",
        description: `Recording ${recordingState.recordingType}... Click pause or stop when finished.`,
      });
    } catch (error) {
      console.error('Failed to start recording:', error);

      let errorMessage = "Unable to start recording. Please check your media permissions and try again.";
      if (error instanceof Error) {
        if (error.name === 'InvalidStateError') {
          errorMessage = "Recording is already in progress or MediaRecorder is not ready.";
        } else if (error.name === 'NotAllowedError') {
          errorMessage = "Media access was denied. Please allow camera/microphone access.";
        }
      }

      toast({
        title: "Recording Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      if (isPaused) {
        // Resume recording
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        toast({
          title: "Recording Resumed",
          description: "Recording has been resumed.",
        });
      } else {
        // Pause recording
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        toast({
          title: "Recording Paused",
          description: "Recording has been paused.",
        });
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const retakeRecording = () => {
    // Stop current recording
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    // Reset state
    setRecordingState(prev => ({
      ...prev,
      isRecording: false,
      isPlaying: false,
      duration: 0,
      currentTime: 0,
      mediaBlob: null,
      mediaUrl: null,
      recordingName: "New Recording"
    }));
    
    setRecordingDuration(0);
    setIsPaused(false);

    // Stop compositing if it's a composite stream
    if (streamRef.current && (streamRef.current as any)._stopCompositing) {
      (streamRef.current as any)._stopCompositing();
    }
    
    // Stop all streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Close recording window
    setShowRecordingWindow(false);
    
    toast({
      title: "Recording Discarded",
      description: "Recording has been discarded. You can start a new one.",
    });
  };

  const closeRecordingWindow = () => {
    if (recordingState.isRecording) {
      // If recording is in progress, ask for confirmation
      if (window.confirm('Recording is in progress. Are you sure you want to close?')) {
        retakeRecording();
      }
    } else {
      setShowRecordingWindow(false);
    }
  };

  const togglePlayback = async () => {
    if (!videoRef.current) {
      console.warn('Cannot toggle playback: video element not available');
      return;
    }

    const video = videoRef.current;

    try {
    if (recordingState.isPlaying) {
        video.pause();
      setRecordingState(prev => ({ ...prev, isPlaying: false }));
        console.log('Video playback paused');
    } else {
        const playPromise = video.play();

        if (playPromise !== undefined) {
          await playPromise;
      setRecordingState(prev => ({ ...prev, isPlaying: true }));
          console.log('Video playback started successfully');
        } else {
          // For older browsers that don't return a promise
          setRecordingState(prev => ({ ...prev, isPlaying: true }));
          console.log('Video playback started (legacy browser)');
        }
      }
    } catch (error) {
      console.error('Error toggling playback:', error);

      // Handle autoplay restrictions
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast({
          title: "Playback Blocked",
          description: "Please click on the video to enable playback.",
          variant: "destructive",
        });

        // Set up click-to-play fallback
        const clickHandler = async () => {
          try {
            await video.play();
            setRecordingState(prev => ({ ...prev, isPlaying: true }));
            video.removeEventListener('click', clickHandler);
            toast({
              title: "Playback Started",
              description: "Video is now playing.",
            });
          } catch (playError) {
            console.error('Click-to-play failed:', playError);
          }
        };

        video.addEventListener('click', clickHandler);

        // Remove listener after 10 seconds to prevent memory leaks
        setTimeout(() => {
          video.removeEventListener('click', clickHandler);
        }, 10000);
      } else {
        toast({
          title: "Playback Error",
          description: "Failed to toggle video playback. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const resetRecording = () => {
    setRecordingState({
      isRecording: false,
      isPlaying: false,
      duration: 0,
      currentTime: 0,
      mediaBlob: null,
      mediaUrl: null,
      recordingName: "New Recording",
      recordingType: null
    });
    
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    
    setRecordingDuration(0);
    setIsLivePreview(false);
    
    // Stop all streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const downloadRecording = async () => {
    if (!recordingState.mediaBlob) {
      toast({
        title: "No Recording",
        description: "Please record something first before exporting.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      let blobToDownload = recordingState.mediaBlob;

      // Show initial progress
      toast({
        title: "Starting Export",
        description: "Preparing your recording for download...",
      });

      // Handle different export scenarios
      if (exportFormat === 'webm' && !addWatermark) {
        // Direct download for WebM without watermark
        console.log('Direct WebM download');
      } else {
        // Conversion needed - load FFmpeg
        toast({
          title: "Loading Converter",
          description: "Initializing video converter...",
        });

        await videoConverter.load();

        // Prepare conversion options
        const conversionOptions: any = {
          quality: exportQuality,
          includeAudio,
          optimizeWeb,
        };

        // Add watermark if requested (placeholder for future implementation)
        if (addWatermark) {
          toast({
            title: "Adding Watermark",
            description: "Applying watermark to your video...",
          });
          // TODO: Implement watermark functionality in videoConverter
          console.log('Watermark requested but not yet implemented');
        }

        // Convert the video
        toast({
          title: "Converting Video",
          description: `Converting to ${exportFormat.toUpperCase()} format... This may take a few moments.`,
        });

        blobToDownload = await videoConverter.convertVideo(
          recordingState.mediaBlob,
          exportFormat,
          conversionOptions
        );
      }

      // Validate the output blob
      if (!blobToDownload || blobToDownload.size === 0) {
        throw new Error('Conversion resulted in empty file');
      }

      // Create download link
      const url = URL.createObjectURL(blobToDownload);
      const a = document.createElement('a');
      a.href = url;

      // Sanitize filename
      const safeName = recordingState.recordingName
        .replace(/[^a-z0-9\s\-_.]/gi, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 50); // Limit length

      a.download = `${safeName}.${exportFormat}`;
      document.body.appendChild(a);

      // Trigger download
      a.click();

      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show file size information
      const fileSizeMB = (blobToDownload.size / (1024 * 1024)).toFixed(2);
      toast({
        title: "Download Complete",
        description: `Your ${fileSizeMB}MB recording has been downloaded as ${exportFormat.toUpperCase()}.`,
      });

      console.log(`Export completed: ${safeName}.${exportFormat} (${fileSizeMB}MB)`);
    } catch (error) {
      console.error('Export failed:', error);

      let errorMessage = "Failed to export video. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('FFmpeg')) {
          errorMessage = "Video converter failed. Please try a different format or quality.";
        } else if (error.message.includes('empty')) {
          errorMessage = "Export resulted in an empty file. Please try different settings.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Export timed out. Please try with lower quality settings.";
        }
      }

      toast({
        title: "Export Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Batch export multiple recordings
  const batchExportRecordings = async (recordingIds: string[], format: string) => {
    if (recordingIds.length === 0) return;

    try {
      toast({
        title: "Batch Export Started",
        description: `Exporting ${recordingIds.length} recordings...`,
      });

      const exportPromises = recordingIds.map(async (id) => {
        const recording = savedRecordings.find(r => r.id === id);
        if (!recording?.mediaBlob) return null;

        // Use the same conversion logic
        let blobToDownload = recording.mediaBlob;

        if (format !== 'webm') {
          await videoConverter.load();
          blobToDownload = await videoConverter.convertVideo(
            recording.mediaBlob,
            format,
            { quality: 'medium', includeAudio: true, optimizeWeb: true }
          );
        }

        const url = URL.createObjectURL(blobToDownload);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${recording.name}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return recording.name;
      });

      const results = await Promise.allSettled(exportPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;

      toast({
        title: "Batch Export Complete",
        description: `Successfully exported ${successful}/${recordingIds.length} recordings.`,
      });
    } catch (error) {
      console.error('Batch export failed:', error);
      toast({
        title: "Batch Export Failed",
        description: "Some recordings failed to export. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (value: number[]) => {
    const volume = value[0];
    setAudioLevel(volume);
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
    }
  };

  const handleSpeedChange = (value: number[]) => {
    const speed = value[0];
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Generate thumbnail from video
  const generateThumbnail = async (videoElement: HTMLVideoElement): Promise<string | null> => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return null;

      // Set thumbnail size
      canvas.width = 320;
      canvas.height = 180;

      // Seek to 1 second or 10% of video duration, whichever is smaller
      const seekTime = Math.min(1, videoElement.duration * 0.1);
      videoElement.currentTime = seekTime;

      // Wait for seek to complete and video to be ready
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          videoElement.removeEventListener('seeked', onSeeked);
          resolve();
        };
        videoElement.addEventListener('seeked', onSeeked);
      });

      // Draw the frame to canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Convert to blob URL
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/jpeg', 0.8);
      });

      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    }
  };

  // Save recording to library with enhanced metadata
  const saveRecordingToLibrary = async () => {
    if (!recordingState.mediaBlob || !recordingState.mediaUrl) {
      toast({
        title: "No Recording to Save",
        description: "Please record something first before saving to library.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingRecording(true);

    try {
      let thumbnailUrl = null;

      // Generate thumbnail if video element is available
      if (videoRef.current && videoRef.current.duration > 0) {
        console.log('Generating thumbnail...');
        thumbnailUrl = await generateThumbnail(videoRef.current);
      }

      const savedRecording = {
        id: Date.now().toString(),
        name: recordingState.recordingName || "Untitled Recording",
        mediaUrl: recordingState.mediaUrl,
        mediaBlob: recordingState.mediaBlob,
        duration: recordingState.duration,
        type: recordingState.recordingType,
        quality: recordingQuality,
        size: parseFloat((recordingState.mediaBlob.size / (1024 * 1024)).toFixed(1)),
        createdAt: new Date().toLocaleString(),
        thumbnailUrl,
        tags: [], // Can be extended for categorization
        description: '',
        isFavorite: false
      };

      setSavedRecordings(prev => [savedRecording, ...prev]);

      toast({
        title: "Recording Saved!",
        description: `"${savedRecording.name}" has been added to your library.`,
      });

      // Switch to Library tab to show the saved recording
      setActiveTab('library');

      console.log('Recording saved to library:', savedRecording);
    } catch (error) {
      console.error('Error saving recording:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save recording to library. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingRecording(false);
    }
  };

  // Delete recording from library
  const deleteRecording = (recordingId: string) => {
    try {
      setSavedRecordings(prev => {
        const recordingToDelete = prev.find(r => r.id === recordingId);
        if (recordingToDelete?.thumbnailUrl) {
          URL.revokeObjectURL(recordingToDelete.thumbnailUrl);
        }
        if (recordingToDelete?.mediaUrl) {
          URL.revokeObjectURL(recordingToDelete.mediaUrl);
        }
        return prev.filter(r => r.id !== recordingId);
      });

      toast({
        title: "Recording Deleted",
        description: "Recording has been removed from your library.",
      });
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Toggle favorite status
  const toggleFavorite = (recordingId: string) => {
    setSavedRecordings(prev => prev.map(recording =>
      recording.id === recordingId
        ? { ...recording, isFavorite: !recording.isFavorite }
        : recording
    ));
  };

  // Editing functionality functions
  const applyFilters = useCallback(() => {
    if (!videoRef.current || !recordingState.mediaUrl) {
      console.warn('Cannot apply filters: video element or media URL not available');
      return;
    }
    
    try {
    const video = videoRef.current;
    const filterString = `
      brightness(${videoFilters.brightness})
      contrast(${videoFilters.contrast})
      saturate(${videoFilters.saturation})
      blur(${videoFilters.blur}px)
      sepia(${videoFilters.sepia})
      `.trim();
    
      // Apply filters immediately
    video.style.filter = filterString;

      // Ensure video is properly loaded and filters are visible
      if (video.readyState >= 1) {
        // Video is loaded, filters should be visible
        console.log('Filters applied successfully:', filterString);
      } else {
        // Video not loaded yet, wait for it
        const handleLoadedData = () => {
          video.style.filter = filterString;
          video.removeEventListener('loadeddata', handleLoadedData);
          console.log('Filters applied after video load:', filterString);
        };
        video.addEventListener('loadeddata', handleLoadedData);
      }

    toast({
      title: "Filters Applied",
      description: "Video filters have been applied successfully.",
    });
    } catch (error) {
      console.error('Error applying filters:', error);
      toast({
        title: "Filter Error",
        description: "Failed to apply filters. Please try again.",
        variant: "destructive",
      });
    }
  }, [videoFilters, recordingState.mediaUrl, toast]);

  const resetFilters = useCallback(() => {
    setVideoFilters({
      brightness: 1,
      contrast: 1,
      saturation: 1,
      blur: 0,
      sepia: 0
    });
    
    if (videoRef.current) {
      videoRef.current.style.filter = 'none';
    }
    
    toast({
      title: "Filters Reset",
      description: "Video filters have been reset to default.",
    });
  }, [toast]);

  const addTextOverlay = useCallback(() => {
    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: 'New Text',
      x: 50,
      y: 50,
      fontSize: 24,
      color: '#ffffff',
      fontFamily: 'Arial',
      startTime: recordingState.currentTime,
      endTime: Math.min(recordingState.currentTime + 5, recordingState.duration)
    };
    
    setTextOverlays(prev => [...prev, newOverlay]);
    setSelectedTextOverlay(newOverlay.id);
    setShowTextPanel(true);
    
    toast({
      title: "Text Overlay Added",
      description: "New text overlay has been added to the video.",
    });
  }, [recordingState.currentTime, recordingState.duration, toast]);

  const updateTextOverlay = useCallback((id: string, updates: Partial<TextOverlay>) => {
    setTextOverlays(prev => prev.map(overlay =>
      overlay.id === id ? { ...overlay, ...updates } : overlay
    ));
  }, []);

  const removeTextOverlay = useCallback((id: string) => {
    setTextOverlays(prev => prev.filter(overlay => overlay.id !== id));
    if (selectedTextOverlay === id) {
      setSelectedTextOverlay(null);
    }
    
    toast({
      title: "Text Overlay Removed",
      description: "Text overlay has been removed from the video.",
    });
  }, [selectedTextOverlay, toast]);

  const applyCrop = useCallback(async () => {
    if (!videoRef.current || !recordingState.mediaBlob) return;

    try {
      setIsProcessing(true);

      // Load FFmpeg
      await videoConverter.load();

      // Get video dimensions for crop calculations
      const video = videoRef.current;
      const cropX = Math.round((cropSettings.x / 100) * video.videoWidth);
      const cropY = Math.round((cropSettings.y / 100) * video.videoHeight);
      const cropWidth = Math.round((cropSettings.width / 100) * video.videoWidth);
      const cropHeight = Math.round((cropSettings.height / 100) * video.videoHeight);

      // Use FFmpeg to crop the video
      const croppedBlob = await videoConverter.convertVideo(
        recordingState.mediaBlob,
        'webm',
        {
          quality: 'high',
          includeAudio: true,
          cropParams: `crop=${cropWidth}:${cropHeight}:${cropX}:${cropY}`
        }
      );

      const croppedUrl = URL.createObjectURL(croppedBlob);

      setRecordingState(prev => ({
        ...prev,
        mediaUrl: croppedUrl,
        mediaBlob: croppedBlob,
        duration: prev.duration // Keep original duration
      }));

      // Update video element with proper error handling
      if (videoRef.current) {
        const video = videoRef.current;

        // Clear existing filters to avoid conflicts
        video.style.filter = 'none';

        // Set new source
        video.src = croppedUrl;

        // Add event listeners for proper loading
        const handleLoadStart = () => {
          console.log('Cropped video loading started');
          video.removeEventListener('loadstart', handleLoadStart);
        };

        const handleLoadedData = () => {
          console.log('Cropped video loaded successfully');
          // Reapply filters if they were active
          if (videoFilters && (videoFilters.brightness !== 1 || videoFilters.contrast !== 1 ||
              videoFilters.saturation !== 1 || videoFilters.blur !== 0 || videoFilters.sepia !== 0)) {
            const filterString = `
              brightness(${videoFilters.brightness})
              contrast(${videoFilters.contrast})
              saturate(${videoFilters.saturation})
              blur(${videoFilters.blur}px)
              sepia(${videoFilters.sepia})
            `.trim();
            video.style.filter = filterString;
          }
          video.removeEventListener('loadeddata', handleLoadedData);
        };

        const handleError = (e: Event) => {
          console.error('Cropped video loading error:', e);
          toast({
            title: "Preview Error",
            description: "Failed to load cropped video preview.",
            variant: "destructive",
          });
          video.removeEventListener('error', handleError);
        };

        video.addEventListener('loadstart', handleLoadStart);
        video.addEventListener('loadeddata', handleLoadedData);
        video.addEventListener('error', handleError);

        video.load();
      }

      toast({
        title: "Crop Applied",
        description: "Video has been cropped successfully.",
      });

    } catch (error) {
      console.error('Crop failed:', error);
      toast({
        title: "Crop Failed",
        description: "Failed to crop video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [cropSettings, recordingState.mediaBlob, toast]);

  const applyTrim = useCallback(async () => {
    if (!videoRef.current || !recordingState.mediaBlob) return;

    const video = videoRef.current;
    const startTime = Math.max(0, trimStart);
    const endTime = Math.min(video.duration, trimEnd);

    if (startTime >= endTime) {
      toast({
        title: "Invalid Trim Range",
        description: "Start time must be before end time.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Load FFmpeg
      await videoConverter.load();

      // Calculate duration for FFmpeg
      const duration = endTime - startTime;

      // Use FFmpeg to trim the video
      const trimmedBlob = await videoConverter.convertVideo(
        recordingState.mediaBlob,
        'webm',
        {
          quality: 'high',
          includeAudio: true,
          trimParams: `trim=${startTime}:${endTime},setpts=PTS-STARTPTS`
        }
      );

      const trimmedUrl = URL.createObjectURL(trimmedBlob);

      setRecordingState(prev => ({
        ...prev,
        mediaUrl: trimmedUrl,
        mediaBlob: trimmedBlob,
        duration: duration
      }));

      // Update video element with proper error handling
      if (videoRef.current) {
        const video = videoRef.current;

        // Clear existing filters to avoid conflicts
        video.style.filter = 'none';

        // Set new source
        video.src = trimmedUrl;

        // Add event listeners for proper loading
        const handleLoadStart = () => {
          console.log('Trimmed video loading started');
          video.removeEventListener('loadstart', handleLoadStart);
        };

        const handleLoadedData = () => {
          console.log('Trimmed video loaded successfully');
          // Reapply filters if they were active
          if (videoFilters && (videoFilters.brightness !== 1 || videoFilters.contrast !== 1 ||
              videoFilters.saturation !== 1 || videoFilters.blur !== 0 || videoFilters.sepia !== 0)) {
            const filterString = `
              brightness(${videoFilters.brightness})
              contrast(${videoFilters.contrast})
              saturate(${videoFilters.saturation})
              blur(${videoFilters.blur}px)
              sepia(${videoFilters.sepia})
            `.trim();
            video.style.filter = filterString;
          }
          video.removeEventListener('loadeddata', handleLoadedData);
        };

        const handleError = (e: Event) => {
          console.error('Trimmed video loading error:', e);
          toast({
            title: "Preview Error",
            description: "Failed to load trimmed video preview.",
            variant: "destructive",
          });
          video.removeEventListener('error', handleError);
        };

        video.addEventListener('loadstart', handleLoadStart);
        video.addEventListener('loadeddata', handleLoadedData);
        video.addEventListener('error', handleError);

        video.load();
      }

      toast({
        title: "Trim Applied",
        description: "Video has been trimmed successfully.",
      });

    } catch (error) {
      console.error('Trim failed:', error);
      toast({
        title: "Trim Failed",
        description: "Failed to trim video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [trimStart, trimEnd, recordingState.mediaBlob, toast]);

  const resetCrop = useCallback(() => {
    setCropSettings({
      x: 0,
      y: 0,
      width: 100,
      height: 100
    });
  }, []);

  const resetTrim = useCallback(() => {
    setTrimStart(0);
    setTrimEnd(recordingState.duration);
  }, [recordingState.duration]);

  const handleEditingToolClick = useCallback((tool: string) => {
    setActiveEditingTool(tool);
    
    // Close other panels
    setShowFiltersPanel(false);
    setShowTextPanel(false);
    setShowCropPanel(false);
    setShowTrimPanel(false);
    
    // Open appropriate panel
    switch (tool) {
      case 'trim':
        setShowTrimPanel(true);
        break;
      case 'crop':
        setShowCropPanel(true);
        break;
      case 'filters':
        setShowFiltersPanel(true);
        break;
      case 'text':
        setShowTextPanel(true);
        break;
      case 'audio':
        // Audio controls are already visible
        break;
      case 'effects':
        setShowFiltersPanel(true);
        break;
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md w-full mx-4">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin mx-auto" style={{ animationDuration: '1.5s' }}></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Initializing Recorder</h2>
          <p className="text-gray-600 mb-4">Setting up your recording environment...</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-sm text-gray-500">This may take a moment on first load</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {returnTo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const returnUrl = returnTo === 'content-studio'
                    ? (contextProjectId ? `/content-studio?projectId=${contextProjectId}` : '/content-studio')
                    : '/dashboard';
                  window.location.href = returnUrl;
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to {returnTo === 'content-studio' ? 'Content Studio' : 'Dashboard'}
              </Button>
            )}
          </div>

                     {/* Removed Create, Edit, Record buttons */}

          <div className="flex items-center gap-3">
            {recordingState.isRecording && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-700 font-mono text-sm">
                  {formatTime(recordingDuration)}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Recording Window Overlay */}
      {showRecordingWindow && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Recording Window Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Recording {recordingState.recordingType ? recordingState.recordingType.charAt(0).toUpperCase() + recordingState.recordingType.slice(1) : 'Unknown'}
                </h2>
                {recordingState.isRecording && (
                  <span className="text-sm text-gray-500 font-mono">
                    {formatTime(recordingDuration)}
                  </span>
                )}
              </div>
              <button
                onClick={closeRecordingWindow}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

                         {/* Recording Content */}
             <div className="p-6">
               {/* Live Preview */}
               <div className="mb-6">
                                   <video
                    ref={liveVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full rounded-lg border border-gray-200 bg-gray-900"
                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                    onLoadedMetadata={() => {
                      if (liveVideoRef.current) {
                        liveVideoRef.current.play().catch(console.error);
                      }
                    }}
                  />
               </div>

              {/* Recording Controls */}
              <div className="flex items-center justify-center gap-4">
                {!recordingState.isRecording ? (
                  <Button
                    onClick={startRecording}
                    className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <div className="w-6 h-6 bg-white rounded-full" />
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={pauseRecording}
                      variant="outline"
                      className="w-12 h-12 rounded-full"
                    >
                      {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                    </Button>
                    
                    <Button
                      onClick={stopRecording}
                      className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Square className="h-6 w-6" />
                    </Button>
                  </>
                )}
                
                <Button
                  onClick={retakeRecording}
                  variant="outline"
                  className="w-12 h-12 rounded-full"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </div>

              {/* Recording Status */}
              <div className="mt-4 text-center">
                {recordingState.isRecording ? (
                  <div className="flex items-center justify-center gap-2 text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">
                      {isPaused ? 'Recording Paused' : 'Recording...'}
                    </span>
                  </div>
                ) : (
                  <p className="text-gray-600">Click the record button to start recording</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="record">Record</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="library">Library</TabsTrigger>
          </TabsList>

          <TabsContent value="record" className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">
                What would you like to record?
              </h1>

              {/* Recording Options Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
                {RECORDING_OPTIONS.map((option) => {
                  const IconComponent = option.icon;
                  
                  return (
                    <div
                      key={option.id}
                      className="p-6 border-2 border-gray-200 rounded-xl cursor-pointer transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
                      onClick={() => selectRecordingType(option.id)}
                    >
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className={`w-16 h-16 ${option.bgColor} rounded-full flex items-center justify-center`}>
                          <IconComponent className={`w-8 h-8 ${option.color}`} />
                        </div>
                        <h3 className="font-semibold text-gray-900">{option.title}</h3>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Error Display and Retry */}
              {mediaAccessError && (
                <div className="max-w-2xl mx-auto mb-8">
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-red-800 mb-2">Media Access Required</h3>
                          <p className="text-sm text-red-700 mb-4">{mediaAccessError}</p>
                          <Button
                            onClick={retryMediaAccess}
                            disabled={isRetryingMediaAccess}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            {isRetryingMediaAccess ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Retrying...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Try Again
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Quality Settings */}
              <div className="mt-8 max-w-md mx-auto">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg">Recording Quality</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm text-gray-600">Quality</Label>
                        <select
                          value={recordingQuality}
                          onChange={(e) => setRecordingQuality(e.target.value as 'high' | 'medium' | 'low')}
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="high">High Quality (1080p)</option>
                          <option value="medium">Medium Quality (720p)</option>
                          <option value="low">Low Quality (480p)</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            {recordingState.mediaUrl ? (
              <div className="max-w-4xl mx-auto">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-blue-600" />
                      Recording Preview
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Type: {recordingState.recordingType}</span>
                      <span>Duration: {formatTime(recordingState.duration)}</span>
                      <span>Name: {recordingState.recordingName}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Video Preview */}
                    <div className="relative">
                      <video
                        ref={videoRef}
                        src={recordingState.mediaUrl}
                        className="w-full rounded-lg border border-gray-200"
                        controls
                        preload="metadata"
                        playsInline
                        muted={false}
                        onError={(e) => {
                          console.error('Video preview error:', e);
                          toast({
                            title: "Preview Error",
                            description: "Failed to load video preview. Please try refreshing.",
                            variant: "destructive",
                          });
                        }}
                        onLoadStart={() => {
                          console.log('Video preview loading started');
                        }}
                        onLoadedData={() => {
                          console.log('Video preview loaded successfully');
                          // Ensure video element is properly updated with filters
                          if (videoRef.current && videoFilters) {
                            const filterString = `
                              brightness(${videoFilters.brightness})
                              contrast(${videoFilters.contrast})
                              saturate(${videoFilters.saturation})
                              blur(${videoFilters.blur}px)
                              sepia(${videoFilters.sepia})
                            `;
                            videoRef.current.style.filter = filterString;
                          }
                        }}
                      />

                      {/* Recording Info Overlay */}
                      <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span>{recordingState.recordingType} • {formatTime(recordingState.duration)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Preview Actions */}
                    <div className="flex items-center justify-center gap-4">
                      <Button onClick={togglePlayback} variant="outline">
                        {recordingState.isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                        {recordingState.isPlaying ? 'Pause' : 'Play'}
                      </Button>
                      <Button onClick={() => setActiveTab('edit')} variant="outline">
                        <Scissors className="h-4 w-4 mr-2" />
                        Edit Recording
                      </Button>
                      <Button onClick={() => setActiveTab('export')} className="bg-green-600 hover:bg-green-700">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button
                        onClick={saveRecordingToLibrary}
                        disabled={isSavingRecording}
                        variant="outline"
                      >
                        {isSavingRecording ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save to Library
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{formatTime(recordingState.duration)}</div>
                        <div className="text-sm text-gray-600">Duration</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {recordingState.mediaBlob ? `${(recordingState.mediaBlob.size / (1024 * 1024)).toFixed(1)} MB` : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">File Size</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {recordingQuality === 'high' ? '1080p' : recordingQuality === 'medium' ? '720p' : '480p'}
                        </div>
                        <div className="text-sm text-gray-600">Quality</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {recordingState.recordingType?.replace('-', ' ').toUpperCase() || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Type</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recording to Preview</h3>
                <p className="text-gray-600 mb-4">Record something first to see the preview</p>
                <Button onClick={() => setActiveTab('record')}>
                  <Video className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="edit" className="space-y-6">
             {recordingState.mediaUrl ? (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2">
                   <Card className="bg-white">
                     <CardHeader>
                       <CardTitle>Video Preview</CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className="relative">
                         <div className="relative">
                           <video
                             ref={videoRef}
                             src={recordingState.mediaUrl}
                             className="w-full rounded-lg"
                             controls
                             preload="metadata"
                           />
                          
                          {/* Text Overlay Canvas */}
                          {textOverlays.length > 0 && (
                            <canvas
                              className="absolute inset-0 w-full h-full pointer-events-none"
                              style={{
                                width: '100%',
                                height: '100%',
                                position: 'absolute',
                                top: 0,
                                left: 0
                              }}
                              ref={(canvas) => {
                                if (canvas && videoRef.current) {
                                  const ctx = canvas.getContext('2d');
                                  if (ctx) {
                                    // Set canvas size to match video display size
                                    const rect = canvas.getBoundingClientRect();
                                    canvas.width = rect.width;
                                    canvas.height = rect.height;
                                    
                                    // Clear canvas
                                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                                    
                                    // Draw text overlays
                                    textOverlays.forEach(overlay => {
                                      if (recordingState.currentTime >= overlay.startTime && 
                                          recordingState.currentTime <= overlay.endTime) {
                                        ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
                                        ctx.fillStyle = overlay.color;
                                        ctx.strokeStyle = '#000000';
                                        ctx.lineWidth = 2;
                                        
                                        // Calculate position based on canvas size
                                        const x = (overlay.x / 100) * canvas.width;
                                        const y = (overlay.y / 100) * canvas.height;
                                        
                                        // Draw text with stroke for better visibility
                                        ctx.strokeText(overlay.text, x, y);
                                        ctx.fillText(overlay.text, x, y);
                                      }
                                    });
                                  }
                                }
                              }}
                            />
                          )}
                        </div>
                        
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Timeline</span>
                            <span className="text-sm text-gray-500">
                              {formatTime(recordingState.currentTime)} / {formatTime(recordingState.duration)}
                            </span>
                          </div>
                          <div className="relative">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${(recordingState.currentTime / recordingState.duration) * 100}%` }}
                              ></div>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max={recordingState.duration || 100}
                              value={recordingState.currentTime}
                              onChange={(e) => {
                                if (videoRef.current) {
                                  videoRef.current.currentTime = parseFloat(e.target.value);
                                  setRecordingState(prev => ({ ...prev, currentTime: parseFloat(e.target.value) }));
                                }
                              }}
                              className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-center space-x-4">
                          <Button onClick={togglePlayback}>
                            {recordingState.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            {recordingState.isPlaying ? 'Pause' : 'Play'}
                          </Button>
                          <Button variant="outline" onClick={resetRecording}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Editing Tools</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        variant={activeEditingTool === 'trim' ? 'default' : 'outline'} 
                        className="w-full justify-start"
                        onClick={() => handleEditingToolClick('trim')}
                      >
                        <Scissors className="h-4 w-4 mr-2" />
                        Trim
                      </Button>
                      <Button 
                        variant={activeEditingTool === 'crop' ? 'default' : 'outline'} 
                        className="w-full justify-start"
                        onClick={() => handleEditingToolClick('crop')}
                      >
                        <Crop className="h-4 w-4 mr-2" />
                        Crop
                      </Button>
                      <Button 
                        variant={activeEditingTool === 'filters' ? 'default' : 'outline'} 
                        className="w-full justify-start"
                        onClick={() => handleEditingToolClick('filters')}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                      </Button>
                      <Button 
                        variant={activeEditingTool === 'text' ? 'default' : 'outline'} 
                        className="w-full justify-start"
                        onClick={() => handleEditingToolClick('text')}
                      >
                        <Type className="h-4 w-4 mr-2" />
                        Text
                      </Button>
                      <Button 
                        variant={activeEditingTool === 'audio' ? 'default' : 'outline'} 
                        className="w-full justify-start"
                        onClick={() => handleEditingToolClick('audio')}
                      >
                        <Music className="h-4 w-4 mr-2" />
                        Audio
                      </Button>
                      <Button 
                        variant={activeEditingTool === 'effects' ? 'default' : 'outline'} 
                        className="w-full justify-start"
                        onClick={() => handleEditingToolClick('effects')}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Effects
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Editing Tool Panels */}
                  {showTrimPanel && (
                    <Card className="bg-white">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Trim Video</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTrimPanel(false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm text-gray-600">Start Time (seconds)</Label>
                          <Input
                            type="number"
                            min="0"
                            max={recordingState.duration}
                            step="0.1"
                            value={trimStart}
                            onChange={(e) => setTrimStart(parseFloat(e.target.value) || 0)}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">End Time (seconds)</Label>
                          <Input
                            type="number"
                            min="0"
                            max={recordingState.duration}
                            step="0.1"
                            value={trimEnd}
                            onChange={(e) => setTrimEnd(parseFloat(e.target.value) || recordingState.duration)}
                            className="mt-2"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={applyTrim}
                            className="flex-1"
                            disabled={isProcessing}
                          >
                            {isProcessing ? 'Processing...' : 'Apply Trim'}
                          </Button>
                          <Button
                            onClick={resetTrim}
                            variant="outline"
                            disabled={isProcessing}
                          >
                            Reset
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {showCropPanel && (
                    <Card className="bg-white">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Crop Video</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCropPanel(false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-gray-600">X Position (%)</Label>
                            <Slider
                              value={[cropSettings.x]}
                              onValueChange={(value) => setCropSettings(prev => ({ ...prev, x: value[0] }))}
                              max={100}
                              step={1}
                              className="mt-2"
                            />
                            <span className="text-sm text-gray-500">{cropSettings.x}%</span>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-600">Y Position (%)</Label>
                            <Slider
                              value={[cropSettings.y]}
                              onValueChange={(value) => setCropSettings(prev => ({ ...prev, y: value[0] }))}
                              max={100}
                              step={1}
                              className="mt-2"
                            />
                            <span className="text-sm text-gray-500">{cropSettings.y}%</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-gray-600">Width (%)</Label>
                            <Slider
                              value={[cropSettings.width]}
                              onValueChange={(value) => setCropSettings(prev => ({ ...prev, width: value[0] }))}
                              max={100}
                              step={1}
                              className="mt-2"
                            />
                            <span className="text-sm text-gray-500">{cropSettings.width}%</span>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-600">Height (%)</Label>
                            <Slider
                              value={[cropSettings.height]}
                              onValueChange={(value) => setCropSettings(prev => ({ ...prev, height: value[0] }))}
                              max={100}
                              step={1}
                              className="mt-2"
                            />
                            <span className="text-sm text-gray-500">{cropSettings.height}%</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={applyCrop}
                            className="flex-1"
                            disabled={isProcessing}
                          >
                            {isProcessing ? 'Processing...' : 'Apply Crop'}
                          </Button>
                          <Button
                            onClick={resetCrop}
                            variant="outline"
                            disabled={isProcessing}
                          >
                            Reset
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {showFiltersPanel && (
                    <Card className="bg-white">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Video Filters</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowFiltersPanel(false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm text-gray-600">Brightness</Label>
                          <Slider
                            value={[videoFilters.brightness]}
                            onValueChange={(value) => setVideoFilters(prev => ({ ...prev, brightness: value[0] }))}
                            min={0}
                            max={2}
                            step={0.1}
                            className="mt-2"
                          />
                          <span className="text-sm text-gray-500">{videoFilters.brightness}</span>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Contrast</Label>
                          <Slider
                            value={[videoFilters.contrast]}
                            onValueChange={(value) => setVideoFilters(prev => ({ ...prev, contrast: value[0] }))}
                            min={0}
                            max={3}
                            step={0.1}
                            className="mt-2"
                          />
                          <span className="text-sm text-gray-500">{videoFilters.contrast}</span>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Saturation</Label>
                          <Slider
                            value={[videoFilters.saturation]}
                            onValueChange={(value) => setVideoFilters(prev => ({ ...prev, saturation: value[0] }))}
                            min={0}
                            max={3}
                            step={0.1}
                            className="mt-2"
                          />
                          <span className="text-sm text-gray-500">{videoFilters.saturation}</span>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Blur</Label>
                          <Slider
                            value={[videoFilters.blur]}
                            onValueChange={(value) => setVideoFilters(prev => ({ ...prev, blur: value[0] }))}
                            min={0}
                            max={10}
                            step={0.5}
                            className="mt-2"
                          />
                          <span className="text-sm text-gray-500">{videoFilters.blur}px</span>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Sepia</Label>
                          <Slider
                            value={[videoFilters.sepia]}
                            onValueChange={(value) => setVideoFilters(prev => ({ ...prev, sepia: value[0] }))}
                            min={0}
                            max={1}
                            step={0.1}
                            className="mt-2"
                          />
                          <span className="text-sm text-gray-500">{videoFilters.sepia}</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={applyFilters}
                            className="flex-1"
                            disabled={isProcessing}
                          >
                            Apply Filters
                          </Button>
                          <Button
                            onClick={resetFilters}
                            variant="outline"
                            disabled={isProcessing}
                          >
                            Reset
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {showTextPanel && (
                    <Card className="bg-white">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Text Overlays</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTextPanel(false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Button onClick={addTextOverlay} className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Text Overlay
                        </Button>
                        
                        {textOverlays.map((overlay) => (
                          <div key={overlay.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Text Overlay</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTextOverlay(overlay.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <Input
                              value={overlay.text}
                              onChange={(e) => updateTextOverlay(overlay.id, { text: e.target.value })}
                              placeholder="Enter text..."
                              className="mb-2"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="number"
                                value={overlay.x}
                                onChange={(e) => updateTextOverlay(overlay.id, { x: parseInt(e.target.value) || 0 })}
                                placeholder="X position"
                                className="text-sm"
                              />
                              <Input
                                type="number"
                                value={overlay.y}
                                onChange={(e) => updateTextOverlay(overlay.id, { y: parseInt(e.target.value) || 0 })}
                                placeholder="Y position"
                                className="text-sm"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <Input
                                type="number"
                                value={overlay.fontSize}
                                onChange={(e) => updateTextOverlay(overlay.id, { fontSize: parseInt(e.target.value) || 24 })}
                                placeholder="Font size"
                                className="text-sm"
                              />
                              <Input
                                type="color"
                                value={overlay.color}
                                onChange={(e) => updateTextOverlay(overlay.id, { color: e.target.value })}
                                className="w-full h-8"
                              />
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Audio Controls</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm text-gray-600">Volume</Label>
                        <div className="mt-2 flex items-center gap-2">
                          <Volume2 className="h-4 w-4 text-gray-500" />
                          <Slider
                            value={[audioLevel]}
                            onValueChange={handleVolumeChange}
                            max={100}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-sm text-gray-500 w-8">{audioLevel}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-600">Speed</Label>
                        <div className="mt-2 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-gray-500" />
                          <Slider
                            value={[playbackSpeed]}
                            onValueChange={handleSpeedChange}
                            min={0.5}
                            max={2}
                            step={0.25}
                            className="flex-1"
                          />
                          <span className="text-sm text-gray-500 w-8">{playbackSpeed}x</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button onClick={downloadRecording} className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button 
                        onClick={() => {
                          toast({
                            title: "Recording Saved",
                            description: "Your edited recording has been saved successfully.",
                          });
                        }} 
                        variant="outline" 
                        className="w-full"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recording Yet</h3>
                <p className="text-gray-600">Record something first to start editing</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            {recordingState.mediaUrl ? (
              <div className="max-w-4xl mx-auto">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Export Your Recording</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <Label htmlFor="recording-name">Recording Name</Label>
                        <Input
                          id="recording-name"
                          value={recordingState.recordingName}
                          onChange={(e) => setRecordingState(prev => ({
                            ...prev,
                            recordingName: e.target.value
                          }))}
                          placeholder="Enter recording name..."
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>File Format</Label>
                        <select
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={exportFormat}
                          onChange={(e) => setExportFormat(e.target.value as 'webm' | 'mp4' | 'avi' | 'mov')}
                        >
                          <option value="webm">WebM (Fast, Web Optimized)</option>
                          <option value="mp4">MP4 (Universal, High Quality)</option>
                          <option value="avi">AVI (Legacy Support)</option>
                          <option value="mov">MOV (Apple Devices)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {exportFormat === 'webm' && 'Best for web sharing, smallest file size'}
                          {exportFormat === 'mp4' && 'Most compatible format, good quality'}
                          {exportFormat === 'avi' && 'Legacy format for older systems'}
                          {exportFormat === 'mov' && 'Optimized for Apple devices and editing software'}
                        </p>
                      </div>
                    </div>

                    {/* File Info Display */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Current Size:</span>
                          <p className="text-gray-600">
                            {recordingState.mediaBlob ? `${(recordingState.mediaBlob.size / (1024 * 1024)).toFixed(1)} MB` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Duration:</span>
                          <p className="text-gray-600">{formatTime(recordingState.duration)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Type:</span>
                          <p className="text-gray-600">{recordingState.recordingType}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Quality:</span>
                          <p className="text-gray-600">{recordingQuality}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Export Quality</Label>
                      <div className="mt-2 space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="exportQuality"
                            value="high"
                            checked={exportQuality === 'high'}
                            onChange={(e) => setExportQuality(e.target.value as 'high' | 'medium' | 'low')}
                          />
                          <span>High Quality (Best)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="exportQuality"
                            value="medium"
                            checked={exportQuality === 'medium'}
                            onChange={(e) => setExportQuality(e.target.value as 'high' | 'medium' | 'low')}
                          />
                          <span>Medium Quality (Balanced)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="exportQuality"
                            value="low"
                            checked={exportQuality === 'low'}
                            onChange={(e) => setExportQuality(e.target.value as 'high' | 'medium' | 'low')}
                          />
                          <span>Low Quality (Fast)</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <Label>Export Settings</Label>
                      <div className="mt-2 space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={includeAudio}
                            onChange={(e) => setIncludeAudio(e.target.checked)}
                          />
                          <span>Include audio</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={optimizeWeb}
                            onChange={(e) => setOptimizeWeb(e.target.checked)}
                          />
                          <span>Optimize for web</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={addWatermark}
                            onChange={(e) => setAddWatermark(e.target.checked)}
                          />
                          <span>Add watermark</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <Button
                        onClick={downloadRecording}
                        disabled={isExporting}
                        className="flex-1 min-h-[44px] text-base font-medium"
                        size="lg"
                      >
                        {isExporting ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            <span className="hidden sm:inline">
                              {exportFormat === 'webm' ? 'Downloading...' : 'Converting...'}
                            </span>
                            <span className="sm:hidden">
                              {exportFormat === 'webm' ? 'Downloading...' : 'Converting...'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Download className="h-5 w-5 mr-2" />
                            <span className="hidden sm:inline">Download Recording</span>
                            <span className="sm:hidden">Download</span>
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={saveRecordingToLibrary}
                        disabled={isSavingRecording}
                        variant="outline"
                        className="flex-1 min-h-[44px] text-base font-medium"
                        size="lg"
                      >
                        {isSavingRecording ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            <span className="hidden sm:inline">Saving to Library...</span>
                            <span className="sm:hidden">Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-5 w-5 mr-2" />
                            <span className="hidden sm:inline">Save to Library</span>
                            <span className="sm:hidden">Save</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <Download className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nothing to Export</h3>
                <p className="text-gray-600">Record something first to export</p>
              </div>
            )}
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library" className="space-y-6">
            <div className="max-w-6xl mx-auto">
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-blue-600" />
                    Saved Recordings
                  </CardTitle>
                  <p className="text-gray-600">Access your saved recordings and manage your library</p>
                </CardHeader>
                <CardContent>
                  {savedRecordings.length > 0 ? (
                    <div className="space-y-4">
                      {/* Recordings Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {savedRecordings.map((recording, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="relative mb-3">
                              {recording.thumbnailUrl ? (
                                <img
                                  src={recording.thumbnailUrl}
                                  alt={`${recording.name} thumbnail`}
                                  className="w-full h-32 object-cover rounded-lg bg-gray-100"
                                />
                              ) : (
                              <video
                                src={recording.mediaUrl}
                                className="w-full h-32 object-cover rounded-lg bg-gray-100"
                                preload="metadata"
                              />
                              )}
                              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    // Load recording for preview
                                    setRecordingState({
                                      ...recordingState,
                                      mediaUrl: recording.mediaUrl,
                                      mediaBlob: recording.mediaBlob,
                                      duration: recording.duration,
                                      recordingName: recording.name,
                                      recordingType: recording.type
                                    });
                                    setActiveTab('preview');
                                  }}
                                  className="opacity-0 hover:opacity-100 transition-opacity"
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Preview
                                </Button>
                              </div>
                              {recording.isFavorite && (
                                <div className="absolute top-2 right-2">
                                  <div className="bg-yellow-400 text-yellow-800 p-1 rounded-full">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <h4 className="font-medium text-gray-900 truncate">{recording.name}</h4>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>{recording.type}</span>
                                <span>•</span>
                                <span>{formatTime(recording.duration)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{recording.quality}</span>
                                <span>•</span>
                                <span>{recording.size} MB</span>
                                <span>•</span>
                                <span>{recording.createdAt}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Load for editing
                                  setRecordingState({
                                    ...recordingState,
                                    mediaUrl: recording.mediaUrl,
                                    mediaBlob: recording.mediaBlob,
                                    duration: recording.duration,
                                    recordingName: recording.name,
                                    recordingType: recording.type
                                  });
                                  setActiveTab('edit');
                                }}
                              >
                                <Edit3 className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant={recording.isFavorite ? "default" : "outline"}
                                onClick={() => toggleFavorite(recording.id)}
                              >
                                <svg className="h-3 w-3 mr-1" fill={recording.isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                {recording.isFavorite ? 'Favorited' : 'Favorite'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Export functionality
                                  if (recording.mediaBlob) {
                                    const url = URL.createObjectURL(recording.mediaBlob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${recording.name}.webm`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);

                                    toast({
                                      title: "Download Started",
                                      description: `${recording.name} is being downloaded.`,
                                    });
                                  }
                                }}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Export
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (confirm(`Delete "${recording.name}"?`)) {
                                    setSavedRecordings(prev => prev.filter((_, i) => i !== index));
                                    toast({
                                      title: "Recording Deleted",
                                      description: `"${recording.name}" has been removed from your library.`,
                                    });
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Library Stats */}
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-blue-600">{savedRecordings.length}</div>
                            <div className="text-sm text-gray-600">Total Recordings</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">
                              {savedRecordings.reduce((total, rec) => total + (rec.duration || 0), 0).toFixed(0)}s
                            </div>
                            <div className="text-sm text-gray-600">Total Duration</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-purple-600">
                              {(savedRecordings.reduce((total, rec) => total + (rec.size || 0), 0)).toFixed(1)} MB
                            </div>
                            <div className="text-sm text-gray-600">Total Size</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-orange-600">
                              {new Set(savedRecordings.map(rec => rec.type)).size}
                            </div>
                            <div className="text-sm text-gray-600">Recording Types</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Recordings Yet</h3>
                      <p className="text-gray-600 mb-4">Your saved recordings will appear here</p>
                      <Button onClick={() => setActiveTab('record')}>
                        <Video className="h-4 w-4 mr-2" />
                        Start Recording
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Hidden canvas for compositing */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
      
      {/* Hidden canvas for editing */}
      <canvas
        ref={editCanvasRef}
        style={{ display: 'none' }}
      />
    </div>
  );
}
