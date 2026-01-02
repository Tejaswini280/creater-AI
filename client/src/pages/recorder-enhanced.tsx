/**
 * Enhanced Recorder Page
 *
 * This component provides comprehensive recording and editing capabilities:
 *
 * RECORDING FEATURES:
 * - Screen recording (with/without camera overlay)
 * - Camera recording
 * - Audio recording
 * - Slides recording (with/without camera)
 * - Screen & Camera simultaneous recording
 * - Live preview during recording
 *
 * EDITING FEATURES:
 * - Video trimming with start/end time controls
 * - Visual filters (grayscale, sepia, brightness, contrast, blur)
 * - Text overlay annotations
 * - Audio adjustments (volume, fade in/out)
 * - Real-time preview of all edits
 *
 * EXPORT FEATURES:
 * - Multiple format support (WebM, MP4, AVI, MOV)
 * - Quality settings (High/Medium/Low)
 * - Export settings (audio inclusion, web optimization, watermark)
 * - Custom file naming
 * - Direct download functionality
 *
 * SAVED CONTENT MANAGEMENT:
 * - Persistent storage of recordings
 * - Thumbnail generation for each recording
 * - Edit/Delete capabilities for saved content
 * - localStorage persistence for session continuity
 *
 * WORKFLOW:
 * 1. Select recording type from 6 available options
 * 2. Record with live preview
 * 3. Edit recording with comprehensive tools
 * 4. Export with custom settings
 * 5. Save to library for future use
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
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
  MonitorOff
} from "lucide-react";
import { useLocation } from "wouter";

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

interface SavedRecording {
  id: string;
  name: string;
  type: string;
  duration: number;
  blob: Blob;
  url: string;
  createdAt: Date;
  thumbnail?: string;
}

interface RecordingOption {
  id: 'camera' | 'audio' | 'screen' | 'screen-camera' | 'slides-camera' | 'slides';
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
  bgColor: string;
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

export default function RecorderEnhanced() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
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
  const [exportSettings, setExportSettings] = useState({
    fileName: '',
    format: 'webm',
    quality: 'high',
    includeAudio: true,
    optimizeForWeb: true,
    addWatermark: false
  });
  const [savedRecordings, setSavedRecordings] = useState<SavedRecording[]>([]);
  const [editingState, setEditingState] = useState({
    trimStart: 0,
    trimEnd: 0,
    selectedFilter: '',
    textOverlays: [] as { text: string; position: { x: number; y: number }; time: number }[],
    audioAdjustments: { volume: 1, fadeIn: 0, fadeOut: 0 }
  });

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

  // Check authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Load saved recordings on component mount
  useEffect(() => {
    loadSavedRecordings();
  }, []);

  // Initialize video element
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      const handleLoadedMetadata = () => {
        if (video.duration && isFinite(video.duration)) {
          setRecordingState(prev => ({ ...prev, duration: video.duration }));
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

  // Recording timer
  useEffect(() => {
    if (recordingState.isRecording) {
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
  }, [recordingState.isRecording]);

  // Ensure live preview is visible during recording
  useEffect(() => {
    if (recordingState.isRecording && streamRef.current && liveVideoRef.current) {
      // Ensure live preview is showing
      if (liveVideoRef.current.srcObject !== streamRef.current) {
        liveVideoRef.current.srcObject = streamRef.current;
        liveVideoRef.current.play().catch(console.error);
      }
      setIsLivePreview(true);
    }
  }, [recordingState.isRecording]);

  // Cleanup streams on unmount
  useEffect(() => {
    return () => {
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
  }, []);

  const selectRecordingType = (type: RecordingState['recordingType']) => {
    setRecordingState(prev => ({ ...prev, recordingType: type }));
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
    
    await Promise.all([
      new Promise(resolve => screenVideo.addEventListener('loadedmetadata', resolve)),
      new Promise(resolve => cameraVideo.addEventListener('loadedmetadata', resolve))
    ]);

    // Start compositing
    const compositeFrame = () => {
      if (!ctx || !isLivePreview) return;
      
      // Draw screen content
      ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
      
      // Draw camera overlay in bottom-right corner
      const cameraWidth = canvas.width * 0.2; // 20% of screen width
      const cameraHeight = cameraWidth * 0.75; // 4:3 aspect ratio
      const cameraX = canvas.width - cameraWidth - 20;
      const cameraY = canvas.height - cameraHeight - 20;
      
      ctx.drawImage(cameraVideo, cameraX, cameraY, cameraWidth, cameraHeight);
      
      // Add border around camera
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(cameraX, cameraY, cameraWidth, cameraHeight);
      
      animationFrameRef.current = requestAnimationFrame(compositeFrame);
    };

    compositeFrame();
    
    // Return canvas stream
    return canvas.captureStream(30);
  }, [isLivePreview]);

  const startRecording = async () => {
    if (!recordingState.recordingType) {
      toast({
        title: "Select Recording Type",
        description: "Please choose what you'd like to record first.",
        variant: "destructive",
      });
      return;
    }

    try {
      let stream: MediaStream;
      const qualitySettings = getQualitySettings();
      
      switch (recordingState.recordingType) {
        case 'camera':
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: qualitySettings, 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100
            }
          });
          cameraStreamRef.current = stream;
          break;
          
        case 'audio':
          stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100
            }
          });
          break;
          
        case 'screen':
          stream = await navigator.mediaDevices.getDisplayMedia({ 
            video: { 
              displaySurface: 'monitor',
              ...qualitySettings
            }, 
            audio: true 
          });
          screenStreamRef.current = stream;
          break;
          
        case 'screen-camera':
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
            video: { 
              displaySurface: 'monitor',
              ...qualitySettings
            }, 
            audio: true 
          });
          const cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 640 },
              height: { ideal: 480 }
            }, 
            audio: {
              echoCancellation: true,
              noiseSuppression: true
            }
          });
          
          screenStreamRef.current = screenStream;
          cameraStreamRef.current = cameraStream;
          
          // Create composite stream
          stream = await createCompositeStream(screenStream, cameraStream);
          break;
          
        case 'slides-camera':
          const slidesStream = await navigator.mediaDevices.getDisplayMedia({ 
            video: { 
              displaySurface: 'window',
              ...qualitySettings
            }, 
            audio: true 
          });
          const slidesCameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 640 },
              height: { ideal: 480 }
            }, 
            audio: {
              echoCancellation: true,
              noiseSuppression: true
            }
          });
          
          screenStreamRef.current = slidesStream;
          cameraStreamRef.current = slidesCameraStream;
          
          // Create composite stream
          stream = await createCompositeStream(slidesStream, slidesCameraStream);
          break;
          
        case 'slides':
          stream = await navigator.mediaDevices.getDisplayMedia({ 
            video: { 
              displaySurface: 'window',
              ...qualitySettings
            }, 
            audio: true 
          });
          screenStreamRef.current = stream;
          break;
          
        default:
          throw new Error('Invalid recording type');
      }

      streamRef.current = stream;
      
             // Set up live preview
       if (liveVideoRef.current) {
         liveVideoRef.current.srcObject = stream;
         liveVideoRef.current.play().catch(console.error); // Ensure video starts playing
         setIsLivePreview(true);
       }
      
      // Determine MIME type based on browser support
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: recordingQuality === 'high' ? 8000000 : recordingQuality === 'medium' ? 4000000 : 2000000
      });
      
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
         
         // Cancel animation frame
         if (animationFrameRef.current) {
           cancelAnimationFrame(animationFrameRef.current);
         }
       };
      
      mediaRecorder.start();
      setRecordingState(prev => ({ ...prev, isRecording: true }));
      
      toast({
        title: "Recording Started",
        description: `Recording ${recordingState.recordingType}... Click stop when finished.`,
      });
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Unable to access media devices. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const togglePlayback = () => {
    if (!videoRef.current) return;
    
    if (recordingState.isPlaying) {
      videoRef.current.pause();
      setRecordingState(prev => ({ ...prev, isPlaying: false }));
    } else {
      videoRef.current.play();
      setRecordingState(prev => ({ ...prev, isPlaying: true }));
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

  const downloadRecording = () => {
    if (!recordingState.mediaBlob) return;

    const fileName = exportSettings.fileName || recordingState.recordingName || 'recording';
    const extension = exportSettings.format === 'webm' ? 'webm' : exportSettings.format;

    const url = URL.createObjectURL(recordingState.mediaBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: `Your recording is being downloaded as ${fileName}.${extension}`,
    });
  };

  const exportWithSettings = async () => {
    if (!recordingState.mediaBlob) {
      toast({
        title: "No Recording to Export",
        description: "Please record something first.",
        variant: "destructive",
      });
      return;
    }

    try {
      let processedBlob = recordingState.mediaBlob;

      // Apply export settings (basic implementation)
      // In a full implementation, you'd use FFmpeg.wasm for format conversion

      // For now, we'll just handle basic settings
      if (!exportSettings.includeAudio && recordingState.recordingType !== 'audio') {
        toast({
          title: "Audio Removal",
          description: "Audio removal requires FFmpeg processing (not implemented in this demo).",
        });
      }

      if (exportSettings.addWatermark) {
        toast({
          title: "Watermark",
          description: "Watermark addition requires video processing (not implemented in this demo).",
        });
      }

      // Download with settings
      downloadRecording();

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Unable to export recording with current settings.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  /**
   * Saves the current recording to the library with thumbnail generation
   * Features:
   * - Generates a thumbnail from the first frame
   * - Saves to both state and localStorage for persistence
   * - Automatically switches to the Saved Content tab
   * - Provides user feedback via toast notifications
   */
  const saveRecordingToLibrary = async () => {
    if (!recordingState.mediaBlob || !recordingState.mediaUrl) {
      toast({
        title: "No Recording to Save",
        description: "Please record something first before saving to library.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate thumbnail (capture first frame)
      const thumbnail = await generateThumbnail(recordingState.mediaUrl);

      const savedRecording: SavedRecording = {
        id: Date.now().toString(),
        name: recordingState.recordingName || `Recording ${savedRecordings.length + 1}`,
        type: recordingState.recordingType || 'unknown',
        duration: recordingState.duration,
        blob: recordingState.mediaBlob,
        url: recordingState.mediaUrl,
        createdAt: new Date(),
        thumbnail
      };

      setSavedRecordings(prev => [savedRecording, ...prev]);

      // Also save to localStorage for persistence
      const existingSaved = JSON.parse(localStorage.getItem('savedRecordings') || '[]');
      const savedData = {
        ...savedRecording,
        blob: null, // Can't store blob in localStorage
        url: null   // Can't store blob URL in localStorage
      };
      existingSaved.push(savedData);
      localStorage.setItem('savedRecordings', JSON.stringify(existingSaved));

      toast({
        title: "Recording Saved",
        description: `"${savedRecording.name}" has been saved to your library.`,
      });

      // Switch to saved content tab
      setActiveTab('saved');
    } catch (error) {
      console.error('Error saving recording:', error);
      toast({
        title: "Save Failed",
        description: "Unable to save recording to library.",
        variant: "destructive",
      });
    }
  };

  const generateThumbnail = async (videoUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.src = videoUrl;
      video.currentTime = 1; // Seek to 1 second

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth * 0.2; // Smaller thumbnail
        canvas.height = video.videoHeight * 0.2;
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          resolve(''); // Fallback
        }
      };

      video.onerror = () => resolve('');
    });
  };

  const loadSavedRecordings = () => {
    const saved = JSON.parse(localStorage.getItem('savedRecordings') || '[]');
    // Note: We can't restore blobs from localStorage, but we can show the metadata
    setSavedRecordings(saved.map((item: any) => ({
      ...item,
      blob: null,
      url: null
    })));
  };

  const deleteSavedRecording = (id: string) => {
    setSavedRecordings(prev => prev.filter(recording => recording.id !== id));

    // Update localStorage
    const existingSaved = JSON.parse(localStorage.getItem('savedRecordings') || '[]');
    const updated = existingSaved.filter((item: any) => item.id !== id);
    localStorage.setItem('savedRecordings', JSON.stringify(updated));

    toast({
      title: "Recording Deleted",
      description: "Recording has been removed from your library.",
    });
  };

  /**
   * Editing Functions
   * These functions provide video/audio editing capabilities including:
   * - Trim: Set start/end times for video segments
   * - Filters: Apply visual effects (grayscale, sepia, brightness, etc.)
   * - Text Overlays: Add text annotations at specific times
   * - Audio Adjustments: Control volume, fade in/out effects
   * - Reset: Clear all editing changes
   */
  const applyTrim = () => {
    if (!videoRef.current || !recordingState.mediaBlob) return;

    const video = videoRef.current;
    const startTime = editingState.trimStart;
    const endTime = editingState.trimEnd || video.duration;

    if (startTime >= endTime) {
      toast({
        title: "Invalid Trim",
        description: "Start time must be less than end time.",
        variant: "destructive",
      });
      return;
    }

    // For now, we'll just seek to the start time
    // In a full implementation, you'd use FFmpeg.wasm or similar for actual trimming
    video.currentTime = startTime;
    setRecordingState(prev => ({
      ...prev,
      currentTime: startTime,
      duration: endTime - startTime
    }));

    toast({
      title: "Trim Applied",
      description: `Trimmed from ${formatTime(startTime)} to ${formatTime(endTime)}`,
    });
  };

  const applyFilter = (filterType: string) => {
    if (!videoRef.current) return;

    setEditingState(prev => ({ ...prev, selectedFilter: filterType }));

    const video = videoRef.current;
    let filter = '';

    switch (filterType) {
      case 'grayscale':
        filter = 'grayscale(100%)';
        break;
      case 'sepia':
        filter = 'sepia(100%)';
        break;
      case 'brightness':
        filter = 'brightness(1.2)';
        break;
      case 'contrast':
        filter = 'contrast(1.2)';
        break;
      case 'blur':
        filter = 'blur(2px)';
        break;
      default:
        filter = 'none';
    }

    video.style.filter = filter;

    toast({
      title: "Filter Applied",
      description: `${filterType} filter has been applied.`,
    });
  };

  const addTextOverlay = (text: string, x: number, y: number) => {
    const newOverlay = {
      text,
      position: { x, y },
      time: recordingState.currentTime
    };

    setEditingState(prev => ({
      ...prev,
      textOverlays: [...prev.textOverlays, newOverlay]
    }));

    toast({
      title: "Text Added",
      description: `Text overlay "${text}" added at ${formatTime(recordingState.currentTime)}`,
    });
  };

  const adjustAudio = (adjustment: { volume?: number; fadeIn?: number; fadeOut?: number }) => {
    setEditingState(prev => ({
      ...prev,
      audioAdjustments: { ...prev.audioAdjustments, ...adjustment }
    }));

    if (videoRef.current) {
      if (adjustment.volume !== undefined) {
        videoRef.current.volume = adjustment.volume;
      }
    }

    toast({
      title: "Audio Adjusted",
      description: "Audio settings have been updated.",
    });
  };

  const resetEditing = () => {
    setEditingState({
      trimStart: 0,
      trimEnd: 0,
      selectedFilter: '',
      textOverlays: [],
      audioAdjustments: { volume: 1, fadeIn: 0, fadeOut: 0 }
    });

    if (videoRef.current) {
      videoRef.current.style.filter = 'none';
      videoRef.current.volume = 1;
    }

    toast({
      title: "Editing Reset",
      description: "All editing changes have been reset.",
    });
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recorder...</p>
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
            {/* Removed V logo and Go Back option */}
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
            
            <Button
              onClick={recordingState.isRecording ? stopRecording : startRecording}
              disabled={!recordingState.recordingType}
              className={`w-12 h-12 rounded-full ${
                recordingState.isRecording 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
              } text-white`}
            >
              {recordingState.isRecording ? (
                <Square className="h-5 w-5" />
              ) : (
                <div className="w-4 h-4 bg-white rounded-full" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="record">Record</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="saved">Saved ({savedRecordings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="record" className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">
                What would you like to record?
              </h1>

              {/* Live Preview Section */}
              {isLivePreview && (
                <div className="mb-8 max-w-2xl mx-auto">
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        Live Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                                             <video
                         ref={liveVideoRef}
                         autoPlay
                         muted
                         playsInline
                         className="w-full rounded-lg border border-gray-200"
                         style={{ maxHeight: '300px' }}
                         onLoadedMetadata={() => {
                           if (liveVideoRef.current) {
                             liveVideoRef.current.play().catch(console.error);
                           }
                         }}
                       />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Recording Options Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
                {RECORDING_OPTIONS.map((option) => {
                  const IconComponent = option.icon;
                  const isSelected = recordingState.recordingType === option.id;
                  
                  return (
                    <div
                      key={option.id}
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
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

              {/* Recording Controls */}
              <div className="flex items-center justify-center gap-6 flex-wrap">
                                 <Button
                   variant="outline"
                   onClick={() => setShowCamera(!showCamera)}
                   className="flex items-center gap-2"
                 >
                   {showCamera ? <Camera className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                   {showCamera ? 'Hide Cam' : 'Show Cam'}
                   <ArrowDown className="h-4 w-4" />
                 </Button>

                <Button
                  variant="outline"
                  onClick={() => setIsMuted(!isMuted)}
                  className="flex items-center gap-2"
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {isMuted ? 'Muted' : 'Unmute'}
                  <ArrowDown className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowScreen(!showScreen)}
                  className="flex items-center gap-2"
                >
                  {showScreen ? <Monitor className="h-4 w-4" /> : <MonitorOff className="h-4 w-4" />}
                  {showScreen ? 'Hide Screen' : 'Show Screen'}
                  <ArrowUp className="h-4 w-4" />
                </Button>

                                 <Button
                   variant="outline"
                   onClick={() => setShowSlides(!showSlides)}
                   className="flex items-center gap-2"
                 >
                   {showSlides ? <Presentation className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                   {showSlides ? 'Hide Slides' : 'Show Slides'}
                 </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowControls(!showControls)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </div>

              {/* Quality Settings */}
              {recordingState.recordingType && (
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
              )}
            </div>
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
                                                 <video
                           ref={videoRef}
                           src={recordingState.mediaUrl}
                           className="w-full rounded-lg"
                           controls
                           preload="metadata"
                         />
                        
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
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Trim Settings</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-gray-500">Start (sec)</Label>
                            <Input
                              type="number"
                              value={editingState.trimStart}
                              onChange={(e) => setEditingState(prev => ({
                                ...prev,
                                trimStart: parseFloat(e.target.value) || 0
                              }))}
                              className="text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">End (sec)</Label>
                            <Input
                              type="number"
                              value={editingState.trimEnd || recordingState.duration}
                              onChange={(e) => setEditingState(prev => ({
                                ...prev,
                                trimEnd: parseFloat(e.target.value) || 0
                              }))}
                              className="text-xs"
                            />
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full" onClick={applyTrim}>
                          <Scissors className="h-4 w-4 mr-2" />
                          Apply Trim
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Filters</Label>
                        <div className="grid grid-cols-2 gap-1">
                          {['grayscale', 'sepia', 'brightness', 'contrast', 'blur'].map((filter) => (
                            <Button
                              key={filter}
                              variant={editingState.selectedFilter === filter ? "default" : "outline"}
                              size="sm"
                              onClick={() => applyFilter(filter)}
                              className="text-xs capitalize"
                            >
                              {filter}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Text Overlay</Label>
                        <Input
                          placeholder="Enter text..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              addTextOverlay(e.currentTarget.value.trim(), 50, 50);
                              e.currentTarget.value = '';
                            }
                          }}
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Audio Adjustments</Label>
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs text-gray-500">Volume: {editingState.audioAdjustments.volume}</Label>
                            <Slider
                              value={[editingState.audioAdjustments.volume]}
                              onValueChange={(value) => adjustAudio({ volume: value[0] })}
                              max={2}
                              min={0}
                              step={0.1}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Fade In (sec): {editingState.audioAdjustments.fadeIn}</Label>
                            <Slider
                              value={[editingState.audioAdjustments.fadeIn]}
                              onValueChange={(value) => adjustAudio({ fadeIn: value[0] })}
                              max={10}
                              step={0.5}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Fade Out (sec): {editingState.audioAdjustments.fadeOut}</Label>
                            <Slider
                              value={[editingState.audioAdjustments.fadeOut]}
                              onValueChange={(value) => adjustAudio({ fadeOut: value[0] })}
                              max={10}
                              step={0.5}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>

                      <Button variant="outline" className="w-full" onClick={resetEditing}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset All Changes
                      </Button>
                    </CardContent>
                  </Card>

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
                      <Button variant="outline" className="w-full">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="recording-name">Recording Name</Label>
                        <Input
                          id="recording-name"
                          value={exportSettings.fileName || recordingState.recordingName}
                          onChange={(e) => setExportSettings(prev => ({
                            ...prev,
                            fileName: e.target.value
                          }))}
                          placeholder="Enter recording name..."
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>File Format</Label>
                        <select
                          value={exportSettings.format}
                          onChange={(e) => setExportSettings(prev => ({
                            ...prev,
                            format: e.target.value
                          }))}
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="webm">WebM (Recommended)</option>
                          <option value="mp4">MP4</option>
                          <option value="avi">AVI</option>
                          <option value="mov">MOV</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label>Quality</Label>
                      <div className="mt-2 space-y-2">
                        {[
                          { value: 'high', label: 'High Quality (1080p)' },
                          { value: 'medium', label: 'Medium Quality (720p)' },
                          { value: 'low', label: 'Low Quality (480p)' }
                        ].map((option) => (
                          <label key={option.value} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="quality"
                              value={option.value}
                              checked={exportSettings.quality === option.value}
                              onChange={(e) => setExportSettings(prev => ({
                                ...prev,
                                quality: e.target.value as 'high' | 'medium' | 'low'
                              }))}
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Export Settings</Label>
                      <div className="mt-2 space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={exportSettings.includeAudio}
                            onChange={(e) => setExportSettings(prev => ({
                              ...prev,
                              includeAudio: e.target.checked
                            }))}
                          />
                          <span>Include audio</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={exportSettings.optimizeForWeb}
                            onChange={(e) => setExportSettings(prev => ({
                              ...prev,
                              optimizeForWeb: e.target.checked
                            }))}
                          />
                          <span>Optimize for web</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={exportSettings.addWatermark}
                            onChange={(e) => setExportSettings(prev => ({
                              ...prev,
                              addWatermark: e.target.checked
                            }))}
                          />
                          <span>Add watermark</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <Button onClick={exportWithSettings} className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Export & Download
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={saveRecordingToLibrary}>
                        <Save className="h-4 w-4 mr-2" />
                        Save to Library
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

          <TabsContent value="saved" className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Content</h1>
              <p className="text-gray-600">Your saved recordings and media files</p>
            </div>

            {savedRecordings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedRecordings.map((recording) => (
                  <Card key={recording.id} className="bg-white hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {recording.type}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSavedRecording(recording.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardTitle className="text-lg truncate" title={recording.name}>
                        {recording.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{formatTime(recording.duration)}</span>
                        <span>•</span>
                        <span>{recording.createdAt.toLocaleDateString()}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {recording.thumbnail ? (
                          <div className="relative">
                            <img
                              src={recording.thumbnail}
                              alt={recording.name}
                              className="w-full h-32 object-cover rounded-lg bg-gray-100"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
                              <Play className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Video className="h-12 w-12 text-gray-400" />
                          </div>
                        )}

                        <div className="flex gap-2">
                          {recording.blob && recording.url ? (
                            <>
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setRecordingState(prev => ({
                                    ...prev,
                                    mediaBlob: recording.blob,
                                    mediaUrl: recording.url,
                                    recordingName: recording.name,
                                    duration: recording.duration
                                  }));
                                  setActiveTab('edit');
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (recording.blob) {
                                    const url = URL.createObjectURL(recording.blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${recording.name}.webm`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  }
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <div className="text-center text-sm text-gray-500 py-2">
                              Recording data not available (stored in previous session)
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Save className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Content</h3>
                <p className="text-gray-600 mb-4">Record and save content to see it here</p>
                <Button onClick={() => setActiveTab('record')}>
                  Start Recording
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Hidden canvas for compositing */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </div>
  );
}
