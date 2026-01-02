import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  Mic,
  Square,
  Play,
  Pause,
  Download,
  Trash2,
  Camera,
  Monitor,
  Presentation,
  Video,
  MicOff,
  MonitorOff,
  X,
  Loader2,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface MediaRecorderProps {
  onMediaRecorded: (mediaBlob: Blob, mediaUrl: string, recordingName: string, recordingType: string) => void;
  onClose: () => void;
}

const RECORDING_OPTIONS: RecordingOption[] = [
  {
    id: 'camera',
    label: 'Camera',
    description: 'Record using camera',
    icon: <Camera className="h-6 w-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'audio',
    label: 'Audio Only',
    description: 'Record audio only',
    icon: <Mic className="h-6 w-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    id: 'screen',
    label: 'Screen',
    description: 'Record screen only',
    icon: <Monitor className="h-6 w-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    id: 'screen-camera',
    label: 'Screen + Camera',
    description: 'Record screen with camera overlay',
    icon: <Video className="h-6 w-6" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  {
    id: 'slides-camera',
    label: 'Slides + Camera',
    description: 'Record slides with camera',
    icon: <Presentation className="h-6 w-6" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  {
    id: 'slides',
    label: 'Slides Only',
    description: 'Record slides only',
    icon: <Presentation className="h-6 w-6" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  }
];

export default function MediaRecorder({ onMediaRecorded, onClose }: MediaRecorderProps) {
  const { toast } = useToast();
  
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
  const [isPaused, setIsPaused] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Start recording
  const startRecording = async (type: RecordingState['recordingType']) => {
    try {
      setIsProcessing(true);
      setMediaAccessError(null);

      let stream: MediaStream | null = null;
      let screenStream: MediaStream | null = null;

      // Get appropriate streams based on recording type
      switch (type) {
        case 'camera':
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              width: { ideal: 1920 }, 
              height: { ideal: 1080 },
              facingMode: 'user'
            },
            audio: true
          });
          break;
        case 'audio':
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          break;
        case 'screen':
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
            audio: true
          });
          break;
        case 'screen-camera':
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
            audio: true
          });
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 320 }, height: { ideal: 240 } },
            audio: false
          });
          break;
        case 'slides-camera':
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
            audio: true
          });
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 320 }, height: { ideal: 240 } },
            audio: false
          });
          break;
        case 'slides':
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
            audio: true
          });
          break;
      }

      if (!stream && !screenStream) {
        throw new Error('No media stream available');
      }

      // Store streams
      streamRef.current = stream;
      screenStreamRef.current = screenStream;

      // Create combined stream if needed
      let combinedStream = stream || screenStream;
      if (stream && screenStream) {
        // Combine screen and camera streams
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const video1 = document.createElement('video');
        const video2 = document.createElement('video');
        
        video1.srcObject = screenStream;
        video2.srcObject = stream;
        
        await Promise.all([
          new Promise(resolve => { video1.onloadedmetadata = resolve; }),
          new Promise(resolve => { video2.onloadedmetadata = resolve; })
        ]);
        
        video1.play();
        video2.play();
        
        canvas.width = 1920;
        canvas.height = 1080;
        
        const draw = () => {
          if (ctx) {
            ctx.drawImage(video1, 0, 0, canvas.width, canvas.height);
            // Draw camera overlay in bottom right
            ctx.drawImage(video2, canvas.width - 320, canvas.height - 240, 320, 240);
          }
          requestAnimationFrame(draw);
        };
        draw();
        
        combinedStream = canvas.captureStream(30);
        // Add audio from screen stream
        if (screenStream.getAudioTracks().length > 0) {
          combinedStream.addTrack(screenStream.getAudioTracks()[0]);
        }
      }

      // Set up video element for preview
      if (videoRef.current && combinedStream) {
        videoRef.current.srcObject = combinedStream;
        videoRef.current.play();
      }

      // Create MediaRecorder instance
      const mimeType = 'video/webm;codecs=vp9,opus';
      const recorderInstance = new window.MediaRecorder(combinedStream!, {
        mimeType,
        videoBitsPerSecond: recordingQuality === 'high' ? 2500000 : recordingQuality === 'medium' ? 1500000 : 1000000
      });

      mediaRecorderRef.current = recorderInstance;
      chunksRef.current = [];

      recorderInstance.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorderInstance.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        setRecordingState(prev => ({
          ...prev,
          mediaBlob: blob,
          mediaUrl: url,
          isRecording: false
        }));
        
        setIsProcessing(false);
        setActiveTab('preview');
      };

      // Start recording
      recorderInstance.start(1000); // Collect data every second
      recordingStartTimeRef.current = Date.now();
      
      setRecordingState(prev => ({
        ...prev,
        isRecording: true,
        recordingType: type,
        duration: 0
      }));

      // Update recording duration
      recordingIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - recordingStartTimeRef.current) / 1000;
        setRecordingDuration(elapsed);
        setRecordingState(prev => ({
          ...prev,
          duration: elapsed
        }));
      }, 100);

      toast({
        title: "Recording Started",
        description: `Started ${type} recording`,
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      setMediaAccessError(error instanceof Error ? error.message : 'Failed to access media devices');
      setIsProcessing(false);
      
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please check your permissions.",
        variant: "destructive",
      });
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  // Pause/Resume recording
  const togglePause = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        recordingStartTimeRef.current = Date.now() - (recordingDuration * 1000);
        recordingIntervalRef.current = setInterval(() => {
          const elapsed = (Date.now() - recordingStartTimeRef.current) / 1000;
          setRecordingDuration(elapsed);
          setRecordingState(prev => ({
            ...prev,
            duration: elapsed
          }));
        }, 100);
      } else {
        mediaRecorderRef.current.pause();
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
      }
      setIsPaused(!isPaused);
    }
  };

  // Play/Pause preview
  const togglePlayback = () => {
    if (videoRef.current) {
      if (recordingState.isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setRecordingState(prev => ({
        ...prev,
        isPlaying: !prev.isPlaying
      }));
    }
  };

  // Save recording
  const saveRecording = () => {
    if (recordingState.mediaBlob && recordingState.mediaUrl) {
      onMediaRecorded(
        recordingState.mediaBlob,
        recordingState.mediaUrl,
        recordingState.recordingName,
        recordingState.recordingType || 'camera'
      );
      
      toast({
        title: "Recording Saved",
        description: "Recording has been added to your project",
      });
      
      onClose();
    }
  };

  // Discard recording
  const discardRecording = () => {
    if (recordingState.mediaUrl) {
      URL.revokeObjectURL(recordingState.mediaUrl);
    }
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
    setRecordingDuration(0);
    setIsPaused(false);
    setActiveTab('record');
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">Record Media</h2>
              <p className="text-sm text-gray-600">Create content for your project</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="record">Record</TabsTrigger>
              <TabsTrigger value="preview" disabled={!recordingState.mediaUrl}>Preview</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Record Tab */}
            <TabsContent value="record" className="space-y-4">
              {!recordingState.isRecording ? (
                <div>
                  <Label className="text-base font-medium mb-4 block">Choose Recording Type</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {RECORDING_OPTIONS.map((option) => (
                      <motion.button
                        key={option.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => startRecording(option.id)}
                        disabled={isProcessing}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isProcessing
                            ? 'opacity-50 cursor-not-allowed'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <div className={`w-12 h-12 rounded-full ${option.bgColor} flex items-center justify-center ${option.color}`}>
                            {option.icon}
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-medium block">{option.label}</span>
                            <span className="text-xs text-gray-500">{option.description}</span>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {mediaAccessError && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{mediaAccessError}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setMediaAccessError(null);
                          setIsRetryingMediaAccess(true);
                          setTimeout(() => setIsRetryingMediaAccess(false), 1000);
                        }}
                      >
                        {isRetryingMediaAccess ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Retry
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Recording Controls */}
                  <div className="flex items-center justify-center space-x-4">
                    <Button
                      onClick={stopRecording}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop Recording
                    </Button>
                    <Button
                      onClick={togglePause}
                      variant="outline"
                    >
                      {isPaused ? (
                        <Play className="h-4 w-4 mr-2" />
                      ) : (
                        <Pause className="h-4 w-4 mr-2" />
                      )}
                      {isPaused ? 'Resume' : 'Pause'}
                    </Button>
                  </div>

                  {/* Recording Timer */}
                  <div className="text-center">
                    <div className="text-2xl font-mono font-bold text-red-500">
                      {formatTime(recordingDuration)}
                    </div>
                    <div className="text-sm text-gray-600">Recording in progress...</div>
                  </div>

                  {/* Live Preview */}
                  {videoRef.current && (
                    <div className="flex justify-center">
                      <video
                        ref={videoRef}
                        className="max-w-full max-h-64 rounded-lg border"
                        muted
                        playsInline
                      />
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              {recordingState.mediaUrl && (
                <div className="space-y-4">
                  {/* Video Preview */}
                  <div className="flex justify-center">
                    <video
                      ref={videoRef}
                      src={recordingState.mediaUrl}
                      className="max-w-full max-h-64 rounded-lg border"
                      controls
                    />
                  </div>

                  {/* Recording Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Recording Name</Label>
                      <Input
                        value={recordingState.recordingName}
                        onChange={(e) => setRecordingState(prev => ({
                          ...prev,
                          recordingName: e.target.value
                        }))}
                        placeholder="Enter recording name"
                      />
                    </div>
                    <div>
                      <Label>Duration</Label>
                      <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                        {formatTime(recordingState.duration)}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-center space-x-4">
                    <Button
                      onClick={saveRecording}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Save to Project
                    </Button>
                    <Button
                      onClick={discardRecording}
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Discard
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Recording Quality</Label>
                  <div className="flex space-x-2 mt-2">
                    {(['high', 'medium', 'low'] as const).map((quality) => (
                      <Button
                        key={quality}
                        variant={recordingQuality === quality ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setRecordingQuality(quality)}
                      >
                        {quality.charAt(0).toUpperCase() + quality.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Audio Level: {audioLevel}%</Label>
                  <Slider
                    value={[audioLevel]}
                    onValueChange={([value]) => setAudioLevel(value)}
                    max={100}
                    min={0}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Playback Speed: {playbackSpeed}x</Label>
                  <Slider
                    value={[playbackSpeed]}
                    onValueChange={([value]) => setPlaybackSpeed(value)}
                    max={2}
                    min={0.5}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}
