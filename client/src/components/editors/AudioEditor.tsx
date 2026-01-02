import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Pause, Square, Scissors, Music, Volume2, Download, 
  Eye, EyeOff, Mic, Zap, BarChart3, Target, Settings
} from 'lucide-react';

interface AudioEditorProps {
  audioUrl: string;
  onSave: (editedAudio: Blob) => void;
  onClose: () => void;
}

const AUDIO_EFFECTS = {
  noiseReduction: { enabled: false, intensity: 0.5 },
  echo: { enabled: false, delay: 0.1, feedback: 0.3 },
  reverb: { enabled: false, roomSize: 0.5, damping: 0.5 },
  compression: { enabled: false, threshold: -20, ratio: 4 }
} as const;

type AudioEffect = typeof AUDIO_EFFECTS[keyof typeof AUDIO_EFFECTS];
type AudioEffects = typeof AUDIO_EFFECTS;

export default function AudioEditor({ audioUrl, onSave, onClose }: AudioEditorProps) {
  console.log('🎤 AudioEditor received audioUrl:', audioUrl);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [activeTab, setActiveTab] = useState('trim');
  const [showWaveform, setShowWaveform] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [effects, setEffects] = useState<AudioEffects>(AUDIO_EFFECTS);
  const [backgroundMusic, setBackgroundMusic] = useState<File | null>(null);
  const [backgroundVolume, setBackgroundVolume] = useState(0.3);

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      console.log('🎤 Initializing audio element with URL:', audioUrl);
      
      audio.addEventListener('loadedmetadata', () => {
        console.log('✅ Audio metadata loaded, duration:', audio.duration);
        setDuration(audio.duration);
        setTrimEnd(audio.duration);
      });
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
      });
    }
  }, [audioUrl]);

  // Audio playback controls
  const togglePlayback = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, []);

  // Trim functionality
  const applyTrim = useCallback(() => {
    // Apply trim logic here
    console.log('Applying trim:', { trimStart, trimEnd });
  }, [trimStart, trimEnd]);

  // Fade functionality
  const applyFades = useCallback(() => {
    // Apply fade logic here
    console.log('Applying fades:', { fadeIn, fadeOut });
  }, [fadeIn, fadeOut]);

  // Effects management
  const toggleEffect = useCallback((effectName: keyof AudioEffects) => {
    setEffects(prev => ({
      ...prev,
      [effectName]: {
        ...prev[effectName],
        enabled: !prev[effectName].enabled
      }
    }));
  }, []);

  const updateEffect = useCallback((effectName: keyof AudioEffects, property: string, value: number) => {
    setEffects(prev => ({
      ...prev,
      [effectName]: {
        ...prev[effectName],
        [property]: value
      }
    }));
  }, []);

  // Background music
  const handleBackgroundMusicUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setBackgroundMusic(file);
    }
  }, []);

  const removeBackgroundMusic = useCallback(() => {
    setBackgroundMusic(null);
    setBackgroundVolume(0.3);
  }, []);

  // Export functionality
  const exportAudio = useCallback(async () => {
    setIsProcessing(true);
    try {
      // This is a simplified export - in production you'd use Web Audio API
      // For now, we'll just return the original audio
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      onSave(blob);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [audioUrl, onSave]);

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
            <Mic className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold">Advanced Audio Editor</h2>
              <p className="text-sm text-gray-600">Professional audio editing tools</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWaveform(!showWaveform)}
            >
              {showWaveform ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showWaveform ? 'Hide Waveform' : 'Show Waveform'}
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
          {/* Left Panel - Audio Preview */}
          {showWaveform && (
            <div className="w-1/2 border-r p-6">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Audio Preview</h3>
                  <Badge variant="secondary">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </Badge>
                </div>
                
                <div className="flex-1 bg-gray-100 rounded-lg p-4 flex items-center justify-center">
                  <div className="text-center">
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      className="hidden"
                      onLoadStart={() => console.log('🎤 Audio loading started')}
                      onLoadedData={() => console.log('✅ Audio data loaded successfully')}
                      onError={(e) => console.error('❌ Audio loading error:', e)}
                    />
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Music className="w-16 h-16 text-white" />
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Audio Preview</p>
                    
                    {/* Debug info */}
                    <div className="text-xs text-gray-500 mb-2">
                      Debug: URL: {audioUrl ? 'Valid' : 'Missing'}, Duration: {duration.toFixed(1)}s
                    </div>
                    {/* Waveform visualization placeholder */}
                    <div className="w-full h-24 bg-gray-200 rounded flex items-end justify-center gap-1 p-2">
                      {Array.from({ length: 50 }, (_, i) => (
                        <div
                          key={i}
                          className="bg-purple-500 rounded-t"
                          style={{
                            height: `${Math.random() * 60 + 20}%`,
                            width: '2px'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Audio Controls */}
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
                      onClick={stopPlayback}
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
                          if (audioRef.current) {
                            audioRef.current.volume = value;
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
                          if (audioRef.current) {
                            audioRef.current.playbackRate = value;
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
          <div className={`${showWaveform ? 'w-1/2' : 'w-full'} p-6 overflow-y-auto`}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="trim">Trim</TabsTrigger>
                <TabsTrigger value="effects">Effects</TabsTrigger>
                <TabsTrigger value="background">Background</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>

              {/* Trim Tab */}
              <TabsContent value="trim" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Audio Trimming</CardTitle>
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

                    <Button
                      onClick={applyTrim}
                      className="w-full"
                    >
                      <Scissors className="w-4 h-4 mr-2" />
                      Apply Trim
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Fade Effects</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Fade In</Label>
                      <Slider
                        value={[fadeIn]}
                        max={10}
                        step={0.1}
                        onValueChange={([value]) => setFadeIn(value)}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-600">
                        {fadeIn.toFixed(1)}s
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Fade Out</Label>
                      <Slider
                        value={[fadeOut]}
                        max={10}
                        step={0.1}
                        onValueChange={([value]) => setFadeOut(value)}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-600">
                        {fadeOut.toFixed(1)}s
                      </div>
                    </div>

                    <Button
                      onClick={applyFades}
                      className="w-full"
                      variant="outline"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Apply Fades
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Effects Tab */}
              <TabsContent value="effects" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Audio Effects</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(effects).map(([effectName, effect]) => (
                      <div key={effectName} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="capitalize">{effectName.replace(/([A-Z])/g, ' $1')}</Label>
                          <Button
                            variant={effect.enabled ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleEffect(effectName as keyof AudioEffects)}
                          >
                            {effect.enabled ? 'On' : 'Off'}
                          </Button>
                        </div>
                        
                        {effect.enabled && (
                          <div className="space-y-2">
                            {Object.entries(effect)
                              .filter(([key, value]) => key !== 'enabled' && typeof value === 'number')
                              .map(([property, value]) => (
                                <div key={property} className="space-y-1">
                                  <Label className="text-xs capitalize">{property}</Label>
                                  <Slider
                                    value={[value as number]}
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    onValueChange={([newValue]) => updateEffect(effectName as keyof AudioEffects, property, newValue)}
                                    className="w-full"
                                  />
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Background Tab */}
              <TabsContent value="background" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Background Music</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!backgroundMusic ? (
                      <div className="space-y-3">
                        <Label>Upload Background Music</Label>
                        <Input
                          type="file"
                          accept="audio/*"
                          onChange={handleBackgroundMusicUpload}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-600">
                          Supported formats: MP3, WAV, OGG, AAC
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{backgroundMusic.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={removeBackgroundMusic}
                          >
                            Remove
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Background Volume</Label>
                          <Slider
                            value={[backgroundVolume]}
                            max={1}
                            step={0.1}
                            onValueChange={([value]) => setBackgroundVolume(value)}
                            className="w-full"
                          />
                          <div className="text-xs text-gray-600">
                            {Math.round(backgroundVolume * 100)}%
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Export Tab */}
              <TabsContent value="export" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Export Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Output Format</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm">MP3</Button>
                        <Button variant="outline" size="sm">WAV</Button>
                        <Button variant="outline" size="sm">OGG</Button>
                        <Button variant="outline" size="sm">AAC</Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Quality</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" size="sm">Low</Button>
                        <Button variant="outline" size="sm">Medium</Button>
                        <Button variant="outline" size="sm">High</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer - Export Controls */}
        <div className="border-t p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Ready to export • {formatTime(trimEnd - trimStart)} duration
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              
              <Button
                onClick={exportAudio}
                disabled={isProcessing}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export Audio
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
