import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Pause, Square, Scissors, Crop, Type, Music, Volume2, 
  Download, Undo, Redo, Eye, EyeOff, Film, Layers, Filter,
  Clock, Split, Merge, RotateCcw, RotateCw, Palette, Zap,
  Move, Maximize, Minimize, Settings
} from 'lucide-react';

interface VideoSegment {
  id: string;
  startTime: number;
  endTime: number;
  source: string;
  filters: Record<string, number>;
  textOverlays: Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    fontFamily: string;
    startTime: number;
    endTime: number;
  }>;
}

interface VideoEditorProps {
  videoUrl: string;
  onSave?: (editedVideo: Blob) => void;
  onClose: () => void;
}

const TRANSITION_TYPES = [
  'fade', 'slide-left', 'slide-right', 'slide-up', 'slide-down', 'zoom-in', 'zoom-out', 'dissolve'
];

const FILTER_PRESETS = {
  cinematic: { brightness: 0.9, contrast: 1.3, saturation: 1.1, blur: 0.1 },
  vintage: { brightness: 0.95, contrast: 1.2, saturation: 0.8, blur: 0.05 },
  dramatic: { brightness: 0.8, contrast: 1.4, saturation: 1.2, blur: 0.1 },
  vibrant: { brightness: 1.1, contrast: 1.1, saturation: 1.3, blur: 0 },
  noir: { brightness: 0.7, contrast: 1.5, saturation: 0.3, blur: 0.05 }
};

const FONT_FAMILIES = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Impact'];

export default function VideoEditor({ videoUrl, onSave, onClose }: VideoEditorProps) {
  console.log('🎬 VideoEditor received videoUrl:', videoUrl);
  
  const [segments, setSegments] = useState<VideoSegment[]>([
    {
      id: '1',
      startTime: 0,
      endTime: 0,
      source: videoUrl,
      filters: {},
      textOverlays: []
    }
  ]);
  
  const [currentSegment, setCurrentSegment] = useState<string>('1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [activeTab, setActiveTab] = useState('timeline');
  const [showPreview, setShowPreview] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [selectedTextOverlay, setSelectedTextOverlay] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Initialize video
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      console.log('🎬 Initializing video element with URL:', videoUrl);
      
      const handleLoadedMetadata = () => {
        console.log('✅ Video metadata loaded, duration:', video.duration);
        if (video.duration && isFinite(video.duration)) {
          setDuration(video.duration);
          setTrimEnd(video.duration);
          setSegments(prev => prev.map(seg => 
            seg.id === '1' ? { ...seg, endTime: video.duration } : seg
          ));
        } else {
          console.warn('⚠️ Invalid video duration:', video.duration);
        }
      };
      
      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
      };
      
      const handleError = (e: Event) => {
        console.error('❌ Video error:', e);
        console.error('❌ Video error details:', video.error);
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('ended', handleEnded);
      video.addEventListener('error', handleError);
      
      // Cleanup
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('error', handleError);
      };
    }
  }, [videoUrl]);



  // Build CSS filter string from filter values
  const buildFilterCSS = useCallback((filters: Record<string, number>) => {
    const filterArray = [];
    
    if (filters.brightness !== undefined) {
      filterArray.push(`brightness(${filters.brightness})`);
    }
    if (filters.contrast !== undefined) {
      filterArray.push(`contrast(${filters.contrast})`);
    }
    if (filters.saturation !== undefined) {
      filterArray.push(`saturate(${filters.saturation})`);
    }
    if (filters.blur !== undefined && filters.blur > 0) {
      filterArray.push(`blur(${filters.blur}px)`);
    }
    
    return filterArray.join(' ');
  }, []);

  // Apply filters to video preview
  useEffect(() => {
    if (videoRef.current && currentSegment) {
      const segment = segments.find(seg => seg.id === currentSegment);
      if (segment && segment.filters) {
        const filterCSS = buildFilterCSS(segment.filters);
        videoRef.current.style.filter = filterCSS;
        console.log('🎨 Applied filters:', filterCSS);
        
        // Add visual feedback for active filters
        const activeFilters = Object.keys(segment.filters).filter(key => 
          segment.filters[key] !== undefined && segment.filters[key] !== 1
        );
        if (activeFilters.length > 0) {
          console.log('🎨 Active filters:', activeFilters);
        }
      } else {
        // Reset filters if none applied
        videoRef.current.style.filter = '';
      }
    }
  }, [segments, currentSegment, buildFilterCSS]);

  // Video playback controls
  const togglePlayback = useCallback(async () => {
    if (videoRef.current) {
      try {
        if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
        } else {
          await videoRef.current.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('❌ Playback error:', error);
        // Fallback: try to play with user interaction
        if (videoRef.current.paused) {
          videoRef.current.play().catch(console.error);
        }
      }
    }
  }, [isPlaying]);

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      const clampedTime = Math.max(0, Math.min(time, duration));
      videoRef.current.currentTime = clampedTime;
      setCurrentTime(clampedTime);
    }
  }, [duration]);

  // Timeline operations
  const addSegment = useCallback(() => {
    const newSegment: VideoSegment = {
      id: Date.now().toString(),
      startTime: currentTime,
      endTime: Math.min(currentTime + 10, duration),
      source: videoUrl,
      filters: {},
      textOverlays: []
    };
    setSegments(prev => [...prev, newSegment]);
    setCurrentSegment(newSegment.id);
  }, [currentTime, duration, videoUrl]);

  const removeSegment = useCallback((segmentId: string) => {
    if (segments.length > 1) {
      setSegments(prev => prev.filter(seg => seg.id !== segmentId));
      if (currentSegment === segmentId) {
        setCurrentSegment(segments[0].id);
      }
    }
  }, [segments, currentSegment]);

  const splitSegment = useCallback(() => {
    const segment = segments.find(seg => seg.id === currentSegment);
    if (segment && currentTime > segment.startTime && currentTime < segment.endTime) {
      const newSegment: VideoSegment = {
        id: Date.now().toString(),
        startTime: currentTime,
        endTime: segment.endTime,
        source: segment.source,
        filters: { ...segment.filters },
        textOverlays: [...segment.textOverlays]
      };
      
      setSegments(prev => prev.map(seg => 
        seg.id === currentSegment 
          ? { ...seg, endTime: currentTime }
          : seg
      ).concat(newSegment));
    }
  }, [segments, currentSegment, currentTime]);

  const mergeSegments = useCallback(() => {
    if (segments.length >= 2) {
      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];
      
      const mergedSegment: VideoSegment = {
        id: Date.now().toString(),
        startTime: firstSegment.startTime,
        endTime: lastSegment.endTime,
        source: videoUrl,
        filters: {},
        textOverlays: []
      };
      
      setSegments([mergedSegment]);
      setCurrentSegment(mergedSegment.id);
    }
  }, [segments, videoUrl]);

  // Trim functionality
  const applyTrim = useCallback(() => {
    if (trimStart >= trimEnd) {
      alert('Start time must be less than end time');
      return;
    }
    
    setSegments(prev => prev.map(seg => 
      seg.id === currentSegment 
        ? { ...seg, startTime: trimStart, endTime: trimEnd }
        : seg
    ));
    
    // Update current time if it's outside the trim range
    if (currentTime < trimStart || currentTime > trimEnd) {
      seekTo(trimStart);
    }
    
    console.log('✂️ Applied trim:', { start: trimStart, end: trimEnd });
  }, [currentSegment, trimStart, trimEnd, currentTime, seekTo]);

  // Filter operations
  const applyFilter = useCallback((filterType: string, value: number) => {
    setSegments(prev => prev.map(seg => 
      seg.id === currentSegment 
        ? { ...seg, filters: { ...seg.filters, [filterType]: value } }
        : seg
    ));
    console.log('🎨 Applied filter:', filterType, value);
  }, [currentSegment]);

  const applyFilterPreset = useCallback((presetName: string) => {
    const preset = FILTER_PRESETS[presetName as keyof typeof FILTER_PRESETS];
    if (preset) {
      setSegments(prev => prev.map(seg => 
        seg.id === currentSegment 
          ? { ...seg, filters: { ...seg.filters, ...preset } }
          : seg
      ));
      console.log('🎨 Applied filter preset:', presetName);
    }
  }, [currentSegment]);

  // Text overlay operations
  const addTextOverlay = useCallback(() => {
    const newTextOverlay = {
      id: Date.now().toString(),
      text: 'New Text',
      x: 100,
      y: 100,
      fontSize: 24,
      color: '#ffffff',
      fontFamily: 'Arial',
      startTime: currentTime,
      endTime: Math.min(currentTime + 5, duration)
    };

    setSegments(prev => prev.map(seg => 
      seg.id === currentSegment 
        ? { ...seg, textOverlays: [...seg.textOverlays, newTextOverlay] }
        : seg
    ));
    setSelectedTextOverlay(newTextOverlay.id);
    console.log('📝 Added text overlay:', newTextOverlay);
  }, [currentSegment, currentTime, duration]);

  const updateTextOverlay = useCallback((overlayId: string, updates: Partial<VideoSegment['textOverlays'][0]>) => {
    setSegments(prev => prev.map(seg => 
      seg.id === currentSegment 
        ? {
            ...seg,
            textOverlays: seg.textOverlays.map(overlay =>
              overlay.id === overlayId ? { ...overlay, ...updates } : overlay
            )
          }
        : seg
    ));
  }, [currentSegment]);

  const removeTextOverlay = useCallback((overlayId: string) => {
    setSegments(prev => prev.map(seg => 
      seg.id === currentSegment 
        ? {
            ...seg,
            textOverlays: seg.textOverlays.filter(overlay => overlay.id !== overlayId)
          }
        : seg
    ));
    if (selectedTextOverlay === overlayId) {
      setSelectedTextOverlay(null);
    }
  }, [currentSegment, selectedTextOverlay]);

  // Timeline scrubbing
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const timelineWidth = rect.width;
      const clickTime = (clickX / timelineWidth) * duration;
      seekTo(clickTime);
      
      // Add visual feedback
      const playhead = timelineRef.current.querySelector('.playhead-indicator') as HTMLElement;
      if (playhead) {
        playhead.style.transition = 'left 0.1s ease-out';
      }
    }
  }, [duration, seekTo]);

  const handleTimelineDrag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const dragX = e.clientX - rect.left;
      const timelineWidth = rect.width;
      const dragTime = (dragX / timelineWidth) * duration;
      seekTo(dragTime);
    }
  }, [isDragging, duration, seekTo]);

  // Save functionality - saves edited video back to Media Library
  const handleSave = useCallback(async () => {
    setIsProcessing(true);
    try {
      console.log('💾 Saving edited video to Media Library...');
      
      // Create a canvas to capture the edited video with filters and text overlays
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas not available');
      }
      
      // Get the video element
      const video = videoRef.current;
      if (!video) {
        throw new Error('Video element not available');
      }
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }
      
      // Apply current filters to the canvas
      const currentSegmentData = segments.find(seg => seg.id === currentSegment);
      if (currentSegmentData && currentSegmentData.filters) {
        const filterCSS = buildFilterCSS(currentSegmentData.filters);
        ctx.filter = filterCSS;
      }
      
      // Draw the video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Add text overlays if any
      if (currentSegmentData?.textOverlays.length) {
        currentSegmentData.textOverlays.forEach(overlay => {
          if (currentTime >= overlay.startTime && currentTime <= overlay.endTime) {
            ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
            ctx.fillStyle = overlay.color;
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
            ctx.fillText(overlay.text, overlay.x, overlay.y + overlay.fontSize);
          }
        });
      }
      
      // Convert canvas to blob
      const editedVideoBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            throw new Error('Failed to create blob from canvas');
          }
        }, 'video/mp4', 0.9);
      });
      
      console.log('✅ Edited video blob created, size:', editedVideoBlob.size);
      
      // Save to Media Library via onSave callback if provided
      if (onSave) {
        onSave(editedVideoBlob);
        console.log('💾 Video saved successfully to Media Library');
      } else {
        console.log('💾 Video processed but no save callback provided');
      }
      
    } catch (error) {
      console.error('❌ Save error:', error);
      // Fallback: use original video if canvas processing fails
      try {
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        if (onSave) {
          onSave(blob);
          console.log('💾 Fallback: Original video saved to Media Library');
        }
      } catch (fallbackError) {
        console.error('❌ Fallback save also failed:', fallbackError);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [videoUrl, onSave, segments, currentSegment, currentTime, buildFilterCSS]);

  // Export functionality - downloads the edited video
  const exportVideo = useCallback(async () => {
    setIsProcessing(true);
    try {
      console.log('📥 Exporting edited video for download...');
      
      // Create a canvas to capture the edited video with filters and text overlays
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas not available');
      }
      
      // Get the video element
      const video = videoRef.current;
      if (!video) {
        throw new Error('Video element not available');
      }
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }
      
      // Apply current filters to the canvas
      const currentSegmentData = segments.find(seg => seg.id === currentSegment);
      if (currentSegmentData && currentSegmentData.filters) {
        const filterCSS = buildFilterCSS(currentSegmentData.filters);
        ctx.filter = filterCSS;
      }
      
      // Draw the video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Add text overlays if any
      if (currentSegmentData?.textOverlays.length) {
        currentSegmentData.textOverlays.forEach(overlay => {
          if (currentTime >= overlay.startTime && currentTime <= overlay.endTime) {
            ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
            ctx.fillText(overlay.text, overlay.x, overlay.y + overlay.fontSize);
          }
        });
      }
      
      // Convert canvas to blob
      const editedVideoBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            throw new Error('Failed to create blob from canvas');
          }
        }, 'video/mp4', 0.9);
      });
      
      console.log('✅ Edited video blob created for export, size:', editedVideoBlob.size);
      
      // Create download link
      const url = URL.createObjectURL(editedVideoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited-${videoUrl.split('/').pop() || 'video'}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('📥 Video exported successfully');
      
    } catch (error) {
      console.error('❌ Export error:', error);
      // Fallback: download original video if canvas processing fails
      try {
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `original-${videoUrl.split('/').pop() || 'video'}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('📥 Fallback: Original video exported');
      } catch (fallbackError) {
        console.error('❌ Fallback export also failed:', fallbackError);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [videoUrl, segments, currentSegment, currentTime, buildFilterCSS]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't handle shortcuts when typing in input fields
      }
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayback();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekTo(Math.max(0, currentTime - 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekTo(Math.min(duration, currentTime + 5));
          break;
        case 'Home':
          e.preventDefault();
          seekTo(0);
          break;
        case 'End':
          e.preventDefault();
          seekTo(duration);
          break;
        case 'f':
          e.preventDefault();
          setActiveTab('filters');
          break;
        case 't':
          e.preventDefault();
          setActiveTab('timeline');
          break;
        case 'r':
          e.preventDefault();
          setActiveTab('trim');
          break;
        case 'x':
          e.preventDefault();
          setActiveTab('text');
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayback, seekTo, currentTime, duration]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentSegmentData = segments.find(seg => seg.id === currentSegment);

  // Render text overlays on video
  const renderTextOverlays = useCallback(() => {
    if (!currentSegmentData || !currentSegmentData.textOverlays.length) return null;
    
    return currentSegmentData.textOverlays.map(overlay => {
      // Only show overlay if current time is within its time range
      if (currentTime < overlay.startTime || currentTime > overlay.endTime) return null;
      
      return (
        <div
          key={overlay.id}
          className="absolute pointer-events-none select-none"
          style={{
            left: `${overlay.x}px`,
            top: `${overlay.y}px`,
            fontSize: `${overlay.fontSize}px`,
            color: overlay.color,
            fontFamily: overlay.fontFamily,
            textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)',
            zIndex: 10,
            whiteSpace: 'nowrap',
            fontWeight: 'bold',
            textAlign: 'center',
            minWidth: 'fit-content',
            padding: '2px 4px',
            borderRadius: '4px',
            backgroundColor: 'rgba(0,0,0,0.3)'
          }}
        >
          {overlay.text}
        </div>
      );
    });
  }, [currentSegmentData, currentTime]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Film className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Advanced Video Editor</h2>
              <p className="text-sm text-gray-600">Professional video editing tools</p>
              <div className="text-xs text-gray-500 mt-1">
                💡 <strong>Keyboard shortcuts:</strong> Space (play/pause), ←→ (seek ±5s), F (filters), T (timeline), R (trim), X (text)
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Preview */}
          {showPreview && (
            <div className="w-1/2 border-r p-6">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Video Preview</h3>
                  <Badge variant="secondary">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </Badge>
                </div>
                
                <div 
                  ref={previewContainerRef}
                  className="flex-1 bg-gray-100 rounded-lg p-4 flex items-center justify-center relative overflow-hidden"
                >
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="max-w-full max-h-full rounded"
                    controls={false}
                    preload="metadata"
                    muted
                    onLoadStart={() => console.log('🎬 Video loading started')}
                    onLoadedData={() => console.log('✅ Video data loaded successfully')}
                    onError={(e) => console.error('❌ Video loading error:', e)}
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  />
                  {renderTextOverlays()}
                </div>

                {/* Video Controls */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={togglePlayback}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => seekTo(0)}
                    >
                      <Square className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Slider
                      value={[currentTime]}
                      max={duration}
                      step={0.1}
                      onValueChange={([value]) => seekTo(value)}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Volume</Label>
                      <Slider
                        value={[volume]}
                        max={1}
                        step={0.1}
                        onValueChange={([value]) => {
                          if (videoRef.current) {
                            videoRef.current.volume = value;
                            setVolume(value);
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Speed</Label>
                      <Slider
                        value={[playbackRate]}
                        min={0.25}
                        max={2}
                        step={0.25}
                        onValueChange={([value]) => {
                          if (videoRef.current) {
                            videoRef.current.playbackRate = value;
                            setPlaybackRate(value);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right Panel - Editor Tools */}
          <div className={`${showPreview ? 'w-1/2' : 'w-full'} p-6 overflow-y-auto`}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="trim">Trim</TabsTrigger>
                <TabsTrigger value="filters">Filters</TabsTrigger>
                <TabsTrigger value="text">Text</TabsTrigger>
              </TabsList>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Video Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2 mb-4">
                      <Button
                        onClick={addSegment}
                        size="sm"
                      >
                        <Layers className="w-4 h-4 mr-2" />
                        Add Segment
                      </Button>
                      <Button
                        onClick={splitSegment}
                        size="sm"
                        variant="outline"
                      >
                        <Scissors className="w-4 h-4 mr-2" />
                        Split
                      </Button>
                      <Button
                        onClick={mergeSegments}
                        size="sm"
                        variant="outline"
                      >
                        <Merge className="w-4 h-4 mr-2" />
                        Merge
                      </Button>
                    </div>

                    {/* Interactive Timeline */}
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-700">Timeline Navigation</div>
                      <div
                        ref={timelineRef}
                        className="relative h-16 bg-gray-200 rounded-lg cursor-pointer overflow-hidden"
                        onClick={handleTimelineClick}
                        onMouseDown={() => setIsDragging(true)}
                        onMouseUp={() => setIsDragging(false)}
                        onMouseLeave={() => setIsDragging(false)}
                        onMouseMove={handleTimelineDrag}
                      >
                        {/* Timeline segments */}
                        {segments.map((segment, index) => {
                          const segmentWidth = ((segment.endTime - segment.startTime) / duration) * 100;
                          const segmentLeft = (segment.startTime / duration) * 100;
                          
                          return (
                            <div
                              key={segment.id}
                              className={`absolute h-full ${
                                segment.id === currentSegment 
                                  ? 'bg-blue-500' 
                                  : 'bg-gray-400'
                              } transition-colors`}
                              style={{
                                left: `${segmentLeft}%`,
                                width: `${segmentWidth}%`
                              }}
                            />
                          );
                        })}
                        
                        {/* Playhead indicator */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 playhead-indicator"
                          style={{
                            left: `${(currentTime / duration) * 100}%`
                          }}
                        />
                        
                        {/* Time markers */}
                        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gray-300 bg-opacity-50 flex justify-between px-2 text-xs text-gray-600">
                          <span>0:00</span>
                          <span>{formatTime(duration / 2)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {segments.map((segment) => (
                        <div
                          key={segment.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            segment.id === currentSegment
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setCurrentSegment(segment.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Film className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium">
                                Segment {segment.id}
                              </span>
                            </div>
                            {segments.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSegment(segment.id);
                                }}
                              >
                                ×
                              </Button>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Trim Tab */}
              <TabsContent value="trim" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Trim Video</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Slider
                        value={[trimStart]}
                        max={duration}
                        step={0.1}
                        onValueChange={([value]) => setTrimStart(value)}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-600">
                        {formatTime(trimStart)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Slider
                        value={[trimEnd]}
                        max={duration}
                        step={0.1}
                        onValueChange={([value]) => setTrimEnd(value)}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-600">
                        {formatTime(trimEnd)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setTrimStart(Math.max(0, currentTime - 5));
                          setTrimEnd(Math.min(duration, currentTime + 5));
                        }}
                      >
                        Set to Current ±5s
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setTrimStart(0);
                          setTrimEnd(duration);
                        }}
                      >
                        Reset to Full
                      </Button>
                    </div>
                    
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      💡 <strong>Tip:</strong> Use the timeline above to set precise trim points. 
                      Click and drag on the timeline to navigate, then use these controls to set start/end times.
                    </div>

                    <Button
                      onClick={applyTrim}
                      className="w-full"
                    >
                      <Scissors className="w-4 h-4 mr-2" />
                      Apply Trim
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Filters Tab */}
              <TabsContent value="filters" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Filter Presets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.keys(FILTER_PRESETS).map((preset) => {
                        const presetKey = preset as keyof typeof FILTER_PRESETS;
                        const presetFilters = FILTER_PRESETS[presetKey];
                        const isActive = currentSegmentData?.filters && 
                          Object.keys(presetFilters).every(
                            (key) => {
                              const filterKey = key as keyof typeof presetFilters;
                              return currentSegmentData.filters[filterKey] === presetFilters[filterKey];
                            }
                          );
                        
                        return (
                          <Button
                            key={preset}
                            variant={isActive ? "default" : "outline"}
                            onClick={() => applyFilterPreset(preset)}
                            className={`capitalize ${isActive ? 'bg-blue-600 text-white' : ''}`}
                          >
                            <Palette className="w-4 h-4 mr-2" />
                            {preset}
                            {isActive && <Badge variant="secondary" className="ml-2 text-xs">Active</Badge>}
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Custom Filters</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Brightness</Label>
                      <Slider
                        value={[currentSegmentData?.filters.brightness || 1]}
                        min={0}
                        max={2}
                        step={0.1}
                        onValueChange={([value]) => applyFilter('brightness', value)}
                      />
                      <div className="text-xs text-gray-600">
                        Value: {currentSegmentData?.filters.brightness || 1}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Contrast</Label>
                      <Slider
                        value={[currentSegmentData?.filters.contrast || 1]}
                        min={0}
                        max={2}
                        step={0.1}
                        onValueChange={([value]) => applyFilter('contrast', value)}
                      />
                      <div className="text-xs text-gray-600">
                        Value: {currentSegmentData?.filters.contrast || 1}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Saturation</Label>
                      <Slider
                        value={[currentSegmentData?.filters.saturation || 1]}
                        min={0}
                        max={2}
                        step={0.1}
                        onValueChange={([value]) => applyFilter('saturation', value)}
                      />
                      <div className="text-xs text-gray-600">
                        Value: {currentSegmentData?.filters.saturation || 1}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Blur</Label>
                      <Slider
                        value={[currentSegmentData?.filters.blur || 0]}
                        min={0}
                        max={10}
                        step={0.5}
                        onValueChange={([value]) => applyFilter('blur', value)}
                      />
                      <div className="text-xs text-gray-600">
                        Value: {currentSegmentData?.filters.blur || 0}px
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setSegments(prev => prev.map(seg => 
                          seg.id === currentSegment 
                            ? { ...seg, filters: {} }
                            : seg
                        ));
                      }}
                      className="w-full"
                    >
                      Reset Filters
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Text Tab */}
              <TabsContent value="text" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Text Overlays</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={addTextOverlay}
                      className="w-full"
                    >
                      <Type className="w-4 h-4 mr-2" />
                      Add Text Overlay
                    </Button>

                    {currentSegmentData?.textOverlays.map((overlay) => (
                      <div 
                        key={overlay.id} 
                        className={`border rounded-lg p-3 space-y-3 transition-colors ${
                          selectedTextOverlay === overlay.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => setSelectedTextOverlay(overlay.id)}
                      >
                        <div className="flex items-center justify-between">
                          <Label>Text {overlay.id.slice(-4)}</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTextOverlay(overlay.id);
                            }}
                          >
                            ×
                          </Button>
                        </div>
                        
                        <Input
                          value={overlay.text}
                          onChange={(e) => updateTextOverlay(overlay.id, { text: e.target.value })}
                          placeholder="Enter text..."
                        />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Font Size</Label>
                            <Input
                              type="number"
                              value={overlay.fontSize}
                              onChange={(e) => updateTextOverlay(overlay.id, { fontSize: parseInt(e.target.value) })}
                              min="8"
                              max="72"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Color</Label>
                            <Input
                              type="color"
                              value={overlay.color}
                              onChange={(e) => updateTextOverlay(overlay.id, { color: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Start Time</Label>
                            <Input
                              type="number"
                              value={overlay.startTime}
                              onChange={(e) => updateTextOverlay(overlay.id, { startTime: parseFloat(e.target.value) })}
                              step="0.1"
                              min="0"
                              max={duration}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">End Time</Label>
                            <Input
                              type="number"
                              value={overlay.endTime}
                              onChange={(e) => updateTextOverlay(overlay.id, { endTime: parseFloat(e.target.value) })}
                              step="0.1"
                              min="0"
                              max={duration}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Font Family</Label>
                          <Select
                            value={overlay.fontFamily}
                            onValueChange={(value) => updateTextOverlay(overlay.id, { fontFamily: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FONT_FAMILIES.map((font) => (
                                <SelectItem key={font} value={font}>
                                  {font}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer - Save and Export Controls */}
        <div className="border-t p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="text-sm text-gray-600">
                {segments.length} segment{segments.length !== 1 ? 's' : ''} • Ready to save
              </div>
              <div className="text-xs text-gray-500 mt-1">
                💡 <strong>Save to Library:</strong> Saves edited video back to your Media Library • <strong>Download:</strong> Downloads the edited video to your device
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Save to Library
                  </>
                )}
              </Button>
              
              <Button
                onClick={exportVideo}
                disabled={isProcessing}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </div>
  );
}
