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
  Play, Pause, Square, RotateCcw, RotateCw, Scissors, Crop, Type, 
  Music, Volume2, Download, Undo, Redo, Eye, EyeOff, Film, 
  Image as ImageIcon, Mic, Zap, Palette, Layers, Filter
} from 'lucide-react';

interface MediaFile {
  id: string;
  file: File;
  type: 'video' | 'image' | 'audio';
  url: string;
  name: string;
  size: number;
}

interface EditorState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  rotation: number;
  textOverlays: Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    fontFamily: string;
  }>;
}

interface AdvancedMediaEditorProps {
  media: MediaFile;
  onSave: (editedMedia: Blob) => void;
  onClose: () => void;
}

const FILTER_PRESETS = {
  vintage: { brightness: 0.9, contrast: 1.2, saturation: 0.8 },
  dramatic: { brightness: 0.8, contrast: 1.4, saturation: 1.1 },
  vibrant: { brightness: 1.1, contrast: 1.1, saturation: 1.3 },
  noir: { brightness: 0.7, contrast: 1.5, saturation: 0.3 }
};

const FONT_FAMILIES = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana'];

export default function AdvancedMediaEditor({ media, onSave, onClose }: AdvancedMediaEditorProps) {
  const [editorState, setEditorState] = useState<EditorState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1,
    brightness: 1,
    contrast: 1,
    saturation: 1,
    blur: 0,
    rotation: 0,
    textOverlays: []
  });

  const [activeTab, setActiveTab] = useState('adjust');
  const [showPreview, setShowPreview] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRef = useRef<HTMLVideoElement | HTMLImageElement | HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize editor state
  useEffect(() => {
    if (media.type === 'video' && mediaRef.current) {
      const video = mediaRef.current as HTMLVideoElement;
      video.addEventListener('loadedmetadata', () => {
        setEditorState(prev => ({ ...prev, duration: video.duration }));
      });
      video.addEventListener('timeupdate', () => {
        setEditorState(prev => ({ ...prev, currentTime: video.currentTime }));
      });
    }
  }, [media]);

  // Media playback controls
  const togglePlayback = useCallback(() => {
    if (media.type === 'video' || media.type === 'audio') {
      const element = mediaRef.current as HTMLVideoElement | HTMLAudioElement;
      if (editorState.isPlaying) {
        element?.pause();
      } else {
        element?.play();
      }
      setEditorState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  }, [editorState.isPlaying, media.type]);

  const seekTo = useCallback((time: number) => {
    if (media.type === 'video' || media.type === 'audio') {
      const element = mediaRef.current as HTMLVideoElement | HTMLAudioElement;
      element.currentTime = time;
      setEditorState(prev => ({ ...prev, currentTime: time }));
    }
  }, [media.type]);

  // Filter and adjustment functions
  const applyFilter = useCallback((filterType: string, value: number) => {
    setEditorState(prev => ({ ...prev, [filterType]: value }));
  }, []);

  const applyFilterPreset = useCallback((presetName: string) => {
    const preset = FILTER_PRESETS[presetName as keyof typeof FILTER_PRESETS];
    if (preset) {
      setEditorState(prev => ({ ...prev, ...preset }));
    }
  }, []);

  // Text overlay functions
  const addTextOverlay = useCallback(() => {
    const newTextOverlay = {
      id: Date.now().toString(),
      text: 'New Text',
      x: 100,
      y: 100,
      fontSize: 24,
      color: '#ffffff',
      fontFamily: 'Arial'
    };

    setEditorState(prev => ({
      ...prev,
      textOverlays: [...prev.textOverlays, newTextOverlay]
    }));
  }, []);

  const updateTextOverlay = useCallback((id: string, updates: Partial<EditorState['textOverlays'][0]>) => {
    setEditorState(prev => ({
      ...prev,
      textOverlays: prev.textOverlays.map(overlay =>
        overlay.id === id ? { ...overlay, ...updates } : overlay
      )
    }));
  }, []);

  const removeTextOverlay = useCallback((id: string) => {
    setEditorState(prev => ({
      ...prev,
      textOverlays: prev.textOverlays.filter(overlay => overlay.id !== id)
    }));
  }, []);

  // Export functionality
  const exportMedia = useCallback(async () => {
    setIsProcessing(true);
    try {
      if (media.type === 'image') {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          
          ctx.filter = `
            brightness(${editorState.brightness})
            contrast(${editorState.contrast})
            saturate(${editorState.saturation})
            blur(${editorState.blur}px)
          `;
          
          ctx.drawImage(img, 0, 0);
          
          if (editorState.rotation !== 0) {
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((editorState.rotation * Math.PI) / 180);
            ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
            ctx.restore();
          }
          
          editorState.textOverlays.forEach(overlay => {
            ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
            ctx.fillStyle = overlay.color;
            ctx.fillText(overlay.text, overlay.x, overlay.y);
          });
          
          canvas.toBlob((blob) => {
            if (blob) {
              onSave(blob);
            }
          }, 'image/png');
        };
        img.src = media.url;
      } else {
        const response = await fetch(media.url);
        const blob = await response.blob();
        onSave(blob);
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [media, editorState, onSave]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
            {media.type === 'video' && <Film className="w-6 h-6 text-blue-600" />}
            {media.type === 'image' && <ImageIcon className="w-6 h-6 text-green-600" />}
            {media.type === 'audio' && <Mic className="w-6 h-6 text-purple-600" />}
            <div>
              <h2 className="text-xl font-semibold">Advanced Media Editor</h2>
              <p className="text-sm text-gray-600">{media.name}</p>
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
                  <h3 className="font-medium">Preview</h3>
                  <Badge variant="secondary">
                    {media.type.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex-1 bg-gray-100 rounded-lg p-4 flex items-center justify-center">
                  {media.type === 'video' && (
                    <video
                      ref={mediaRef as React.RefObject<HTMLVideoElement>}
                      src={media.url}
                      className="max-w-full max-h-full rounded"
                      controls={false}
                    />
                  )}
                  {media.type === 'image' && (
                    <img
                      ref={mediaRef as React.RefObject<HTMLImageElement>}
                      src={media.url}
                      alt={media.name}
                      className="max-w-full max-h-full rounded object-contain"
                    />
                  )}
                  {media.type === 'audio' && (
                    <div className="text-center">
                      <audio
                        ref={mediaRef as React.RefObject<HTMLAudioElement>}
                        src={media.url}
                        className="hidden"
                      />
                      <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Music className="w-16 h-16 text-white" />
                      </div>
                      <p className="text-sm text-gray-600">Audio Preview</p>
                    </div>
                  )}
                </div>

                {/* Media Controls */}
                {(media.type === 'video' || media.type === 'audio') && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={togglePlayback}
                      >
                        {editorState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
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
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{formatTime(editorState.currentTime)}</span>
                        <span>{formatTime(editorState.duration)}</span>
                      </div>
                      <Slider
                        value={[editorState.currentTime]}
                        max={editorState.duration}
                        step={0.1}
                        onValueChange={([value]) => seekTo(value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Right Panel - Editor Tools */}
          <div className={`${showPreview ? 'w-1/2' : 'w-full'} p-6 overflow-y-auto`}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="adjust">Adjust</TabsTrigger>
                <TabsTrigger value="filters">Filters</TabsTrigger>
                <TabsTrigger value="text">Text</TabsTrigger>
                <TabsTrigger value="effects">Effects</TabsTrigger>
              </TabsList>

              {/* Adjustments Tab */}
              <TabsContent value="adjust" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Adjustments</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Brightness</Label>
                      <Slider
                        value={[editorState.brightness]}
                        min={0}
                        max={2}
                        step={0.1}
                        onValueChange={([value]) => applyFilter('brightness', value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Contrast</Label>
                      <Slider
                        value={[editorState.contrast]}
                        min={0}
                        max={2}
                        step={0.1}
                        onValueChange={([value]) => applyFilter('contrast', value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Saturation</Label>
                      <Slider
                        value={[editorState.saturation]}
                        min={0}
                        max={2}
                        step={0.1}
                        onValueChange={([value]) => applyFilter('saturation', value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Blur</Label>
                      <Slider
                        value={[editorState.blur]}
                        min={0}
                        max={10}
                        step={0.5}
                        onValueChange={([value]) => applyFilter('blur', value)}
                      />
                    </div>

                    {media.type === 'image' && (
                      <div className="space-y-2">
                        <Label>Rotation</Label>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => applyFilter('rotation', editorState.rotation - 90)}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => applyFilter('rotation', editorState.rotation + 90)}
                          >
                            <RotateCw className="w-4 h-4" />
                          </Button>
                        </div>
                        <Slider
                          value={[editorState.rotation]}
                          min={-180}
                          max={180}
                          step={1}
                          onValueChange={([value]) => applyFilter('rotation', value)}
                        />
                      </div>
                    )}
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
                      {Object.keys(FILTER_PRESETS).map((preset) => (
                        <Button
                          key={preset}
                          variant="outline"
                          onClick={() => applyFilterPreset(preset)}
                          className="capitalize"
                        >
                          <Palette className="w-4 h-4 mr-2" />
                          {preset}
                        </Button>
                      ))}
                    </div>
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
                      Add Text
                    </Button>

                    {editorState.textOverlays.map((overlay) => (
                      <div key={overlay.id} className="border rounded-lg p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Text {overlay.id.slice(-4)}</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTextOverlay(overlay.id)}
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
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Effects Tab */}
              <TabsContent value="effects" className="space-y-6">
                {media.type === 'video' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Video Effects</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline">
                          <Scissors className="w-4 h-4 mr-2" />
                          Trim
                        </Button>
                        <Button variant="outline">
                          <Music className="w-4 h-4 mr-2" />
                          Background Music
                        </Button>
                        <Button variant="outline">
                          <Zap className="w-4 h-4 mr-2" />
                          Transitions
                        </Button>
                        <Button variant="outline">
                          <Layers className="w-4 h-4 mr-2" />
                          Overlays
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {media.type === 'audio' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Audio Effects</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline">
                          <Volume2 className="w-4 h-4 mr-2" />
                          Noise Reduction
                        </Button>
                        <Button variant="outline">
                          <Music className="w-4 h-4 mr-2" />
                          Background Music
                        </Button>
                        <Button variant="outline">
                          <Zap className="w-4 h-4 mr-2" />
                          Equalizer
                        </Button>
                        <Button variant="outline">
                          <Scissors className="w-4 h-4 mr-2" />
                          Audio Trim
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer - Export Controls */}
        <div className="border-t p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Ready to export
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              
              <Button
                onClick={exportMedia}
                disabled={isProcessing}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export Media
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
