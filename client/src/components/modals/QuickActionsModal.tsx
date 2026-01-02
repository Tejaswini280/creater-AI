import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Loader2, 
  Video, 
  Mic, 
  Palette, 
  TrendingUp,
  Sparkles,
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RefreshCw,
  Copy,
  FileText,
  Image as ImageIcon
} from "lucide-react";

interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: 'newProject' | 'createVideo' | 'aiVoiceover' | 'brandKit' | 'nicheFinder' | null;
}

interface VideoFormData {
  title: string;
  script: string;
  duration: string;
  style: string;
  voiceType: string;
}

interface VoiceoverFormData {
  text: string;
  voice: string;
  speed: number;
  language: string;
}

interface NicheFinderData {
  category: string;
  region: string;
  competition: string;
}

const VIDEO_STYLES = [
  'Educational', 'Entertainment', 'Tutorial', 'Review', 'Vlog', 'Documentary'
];

const VOICE_TYPES = [
  'Professional Male', 'Professional Female', 'Casual Male', 'Casual Female', 
  'Narrator', 'Energetic', 'Calm', 'British Accent'
];

const VOICE_OPTIONS = [
  { value: 'alloy', label: 'Alloy (Neutral)' },
  { value: 'echo', label: 'Echo (Male)' },
  { value: 'fable', label: 'Fable (British)' },
  { value: 'onyx', label: 'Onyx (Deep)' },
  { value: 'nova', label: 'Nova (Female)' },
  { value: 'shimmer', label: 'Shimmer (Soft)' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
];

export default function QuickActionsModal({ isOpen, onClose, actionType }: QuickActionsModalProps) {
  const { toast } = useToast();
  
  const [videoData, setVideoData] = useState<VideoFormData>({
    title: '',
    script: '',
    duration: '60',
    style: 'Educational',
    voiceType: 'Professional Female'
  });

  const [voiceoverData, setVoiceoverData] = useState<VoiceoverFormData>({
    text: '',
    voice: 'nova',
    speed: 1.0,
    language: 'en'
  });

  const [nicheData, setNicheData] = useState<NicheFinderData>({
    category: '',
    region: 'US',
    competition: 'medium'
  });

  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Video Generation Mutation
  const generateVideoMutation = useMutation({
    mutationFn: async (data: VideoFormData) => {
      const response = await apiRequest('POST', '/api/ai/generate-video', data);
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedResult(data.result || data);
      toast({
        title: "Video Generated!",
        description: "Your AI-powered video content is ready.",
      });
    },
    onError: handleError,
  });

  // Voiceover Generation Mutation
  const generateVoiceoverMutation = useMutation({
    mutationFn: async (data: VoiceoverFormData) => {
      const response = await apiRequest('POST', '/api/ai/generate-voiceover', data);
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedResult(data);
      toast({
        title: "Voiceover Generated!",
        description: "Your professional voiceover is ready.",
      });
    },
    onError: handleError,
  });

  // Niche Analysis Mutation
  const analyzeNicheMutation = useMutation({
    mutationFn: async (data: NicheFinderData) => {
      console.log('🚀 Making API request to analyze niche:', data);
      const response = await apiRequest('POST', '/api/analytics/analyze-niche', data);
      const result = await response.json();
      console.log('📡 API response received:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ Niche analysis successful:', data);
      // Fix: Set the entire response data, not just the analysis
      setGeneratedResult(data);
      toast({
        title: "Niche Analysis Complete!",
        description: "Market insights and opportunities identified.",
      });
    },
    onError: (error) => {
      console.error('❌ Niche analysis failed:', error);
      handleError(error);
    },
  });

  function handleError(error: any) {
    if (isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
    toast({
      title: "Generation Failed",
      description: "Please try again later.",
      variant: "destructive",
    });
  }

  const handleVideoGeneration = () => {
    if (!videoData.title || !videoData.script) {
      toast({
        title: "Missing Information",
        description: "Please provide title and script.",
        variant: "destructive",
      });
      return;
    }
    generateVideoMutation.mutate(videoData);
  };

  const handleVoiceoverGeneration = () => {
    if (!voiceoverData.text) {
      toast({
        title: "Missing Text",
        description: "Please provide text for voiceover.",
        variant: "destructive",
      });
      return;
    }
    generateVoiceoverMutation.mutate(voiceoverData);
  };

  const handleNicheAnalysis = () => {
    if (!nicheData.category) {
      toast({
        title: "Missing Category",
        description: "Please select a category to analyze.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('🔍 Starting niche analysis with data:', nicheData);
    analyzeNicheMutation.mutate(nicheData);
  };

  const handlePlayPauseAudio = () => {
    if (!generatedResult?.audioUrl) return;

    if (isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      if (audioElement) {
        audioElement.play();
      } else {
        const audio = new Audio(generatedResult.audioUrl);
        audio.onended = () => setIsPlaying(false);
        audio.play();
        setAudioElement(audio);
      }
      setIsPlaying(true);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard.",
    });
  };

  const getModalTitle = () => {
    switch (actionType) {
      case 'newProject': return 'New Project';
      case 'createVideo': return 'AI Video Generator';
      case 'aiVoiceover': return 'AI Voiceover Generator';
      case 'brandKit': return 'Brand Kit & Templates';
      case 'nicheFinder': return 'Niche Finder & Analysis';
      default: return 'Quick Actions';
    }
  };

  const getModalIcon = () => {
    switch (actionType) {
      case 'createVideo': return <Video className="w-5 h-5 text-blue-600" />;
      case 'aiVoiceover': return <Mic className="w-5 h-5 text-green-600" />;
      case 'brandKit': return <Palette className="w-5 h-5 text-orange-600" />;
      case 'nicheFinder': return <TrendingUp className="w-5 h-5 text-purple-600" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const renderVideoGenerator = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="video-title">Video Title *</Label>
        <Input
          id="video-title"
          placeholder="Enter your video title..."
          value={videoData.title}
          onChange={(e) => setVideoData(prev => ({ ...prev, title: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Duration</Label>
          <Select value={videoData.duration} onValueChange={(value) => setVideoData(prev => ({ ...prev, duration: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 seconds</SelectItem>
              <SelectItem value="60">60 seconds</SelectItem>
              <SelectItem value="120">2 minutes</SelectItem>
              <SelectItem value="300">5 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Style</Label>
          <Select value={videoData.style} onValueChange={(value) => setVideoData(prev => ({ ...prev, style: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VIDEO_STYLES.map(style => (
                <SelectItem key={style} value={style}>{style}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="video-script">Script/Outline *</Label>
        <Textarea
          id="video-script"
          placeholder="Describe your video content or provide a script..."
          value={videoData.script}
          onChange={(e) => setVideoData(prev => ({ ...prev, script: e.target.value }))}
          className="min-h-[120px]"
        />
      </div>

      <div className="space-y-2">
        <Label>Voice Type</Label>
        <Select value={videoData.voiceType} onValueChange={(value) => setVideoData(prev => ({ ...prev, voiceType: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VOICE_TYPES.map(voice => (
              <SelectItem key={voice} value={voice}>{voice}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button 
        onClick={handleVideoGeneration}
        disabled={generateVideoMutation.isPending}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {generateVideoMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating Video...
          </>
        ) : (
          <>
            <Video className="w-4 h-4 mr-2" />
            Generate Video
          </>
        )}
      </Button>
    </div>
  );

  const renderVoiceoverGenerator = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="voiceover-text">Text to Speech *</Label>
        <Textarea
          id="voiceover-text"
          placeholder="Enter the text you want to convert to speech..."
          value={voiceoverData.text}
          onChange={(e) => setVoiceoverData(prev => ({ ...prev, text: e.target.value }))}
          className="min-h-[120px]"
        />
        <p className="text-xs text-gray-500">
          {voiceoverData.text.length} characters
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Voice</Label>
          <Select value={voiceoverData.voice} onValueChange={(value) => setVoiceoverData(prev => ({ ...prev, voice: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VOICE_OPTIONS.map(voice => (
                <SelectItem key={voice.value} value={voice.value}>{voice.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Language</Label>
          <Select value={voiceoverData.language} onValueChange={(value) => setVoiceoverData(prev => ({ ...prev, language: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(lang => (
                <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Speed: {voiceoverData.speed}x</Label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={voiceoverData.speed}
          onChange={(e) => setVoiceoverData(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0.5x (Slow)</span>
          <span>2.0x (Fast)</span>
        </div>
      </div>

      <Button 
        onClick={handleVoiceoverGeneration}
        disabled={generateVoiceoverMutation.isPending}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        {generateVoiceoverMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating Voiceover...
          </>
        ) : (
          <>
            <Mic className="w-4 h-4 mr-2" />
            Generate Voiceover
          </>
        )}
      </Button>
    </div>
  );

  const renderBrandKit = () => (
    <div className="space-y-4">
      <div className="text-center py-8">
        <Palette className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Brand Kit & Templates</h3>
        <p className="text-gray-600 mb-6">Access your brand assets, templates, and design resources</p>
        
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="h-auto p-4"
            onClick={() => {
              onClose();
              window.location.href = '/templates';
            }}
          >
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="font-medium">Templates</div>
              <div className="text-sm text-gray-500">Content templates</div>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-4"
            onClick={() => {
              onClose();
              window.location.href = '/assets';
            }}
          >
            <div className="text-center">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="font-medium">Assets</div>
              <div className="text-sm text-gray-500">Brand assets</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );

  const renderNicheFinder = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="niche-category">Category/Topic *</Label>
        <Input
          id="niche-category"
          placeholder="e.g., Tech reviews, Fitness, Cooking..."
          value={nicheData.category}
          onChange={(e) => setNicheData(prev => ({ ...prev, category: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Region</Label>
          <Select value={nicheData.region} onValueChange={(value) => setNicheData(prev => ({ ...prev, region: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="UK">United Kingdom</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="AU">Australia</SelectItem>
              <SelectItem value="DE">Germany</SelectItem>
              <SelectItem value="global">Global</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Competition Level</Label>
          <Select value={nicheData.competition} onValueChange={(value) => setNicheData(prev => ({ ...prev, competition: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low Competition</SelectItem>
              <SelectItem value="medium">Medium Competition</SelectItem>
              <SelectItem value="high">High Competition</SelectItem>
              <SelectItem value="any">Any Level</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        onClick={handleNicheAnalysis}
        disabled={analyzeNicheMutation.isPending}
        className="w-full bg-purple-600 hover:bg-purple-700"
      >
        {analyzeNicheMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing Niche...
          </>
        ) : (
          <>
            <TrendingUp className="w-4 h-4 mr-2" />
            Analyze Niche
          </>
        )}
      </Button>
    </div>
  );

  const renderResults = () => {
    if (!generatedResult) return null;

    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Generated Result</h4>
        
        {/* Audio Result */}
        {generatedResult.audioUrl && (
          <div className="flex items-center space-x-3 mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePlayPauseAudio}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <span className="text-sm text-gray-600">Voiceover Audio</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(generatedResult.audioUrl, 'voiceover.mp3')}
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          </div>
        )}

        {/* Text Result */}
        {generatedResult.content && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Generated Content</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(generatedResult.content)}
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            </div>
            <div className="bg-white p-3 rounded border text-sm">
              {generatedResult.content}
            </div>
          </div>
        )}

        {/* Niche Analysis Result */}
        {generatedResult.analysis && (
          <div className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-2xl font-bold text-green-600">
                  {generatedResult.analysis.profitability || 'Medium'}
                </div>
                <div className="text-xs text-gray-500">Profitability</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-2xl font-bold text-blue-600">
                  {generatedResult.analysis.difficulty || 'Medium'}
                </div>
                <div className="text-xs text-gray-500">Difficulty</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-2xl font-bold text-purple-600">
                  {generatedResult.analysis.trendScore || '50'}
                </div>
                <div className="text-xs text-gray-500">Trend Score</div>
              </div>
            </div>

            {/* Opportunities */}
            {generatedResult.analysis.opportunities && generatedResult.analysis.opportunities.length > 0 && (
              <div className="space-y-3">
                <h5 className="font-medium text-gray-900">Content Opportunities</h5>
                <div className="space-y-2">
                  {generatedResult.analysis.opportunities.map((opportunity: string, index: number) => (
                    <div key={index} className="flex items-start space-x-2 p-3 bg-white rounded border">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700">{opportunity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Market Insights */}
            <div className="space-y-3">
              <h5 className="font-medium text-gray-900">Market Insights</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded border">
                  <div className="text-sm font-medium text-gray-700 mb-2">Profitability Analysis</div>
                  <div className="text-sm text-gray-600">
                    This niche shows <span className="font-medium text-green-600">{generatedResult.analysis.profitability || 'medium'}</span> profit potential.
                  </div>
                </div>
                <div className="p-3 bg-white rounded border">
                  <div className="text-sm font-medium text-gray-700 mb-2">Competition Level</div>
                  <div className="text-sm text-gray-600">
                    Entry difficulty is <span className="font-medium text-blue-600">{generatedResult.analysis.difficulty || 'medium'}</span>.
                  </div>
                </div>
              </div>
            </div>

            {/* Action Items */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="font-medium text-blue-900 mb-2">Recommended Next Steps</h5>
              <div className="text-sm text-blue-800 space-y-1">
                <div>• Research trending topics in this niche</div>
                <div>• Analyze successful competitors' content</div>
                <div>• Create a content calendar based on opportunities</div>
                <div>• Monitor trend score for optimal timing</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (actionType) {
      case 'newProject':
        return (
          <div className="text-center py-8">
            <Folder className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Create New Project</h3>
            <p className="text-gray-600 mb-6">Start building your enhanced social media project with advanced features.</p>
            <Button 
              onClick={() => {
                onClose();
                window.location.href = '/new-project-enhanced';
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Go to New Project
            </Button>
          </div>
        );
      case 'createVideo':
        return renderVideoGenerator();
      case 'aiVoiceover':
        return renderVoiceoverGenerator();
      case 'brandKit':
        return renderBrandKit();
      case 'nicheFinder':
        return renderNicheFinder();
      default:
        return null;
    }
  };

  if (!actionType) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" aria-describedby="quick-actions-description">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center">
            {getModalIcon()}
            <span className="ml-2">{getModalTitle()}</span>
          </DialogTitle>
          <DialogDescription id="quick-actions-description">
            Quick tools for video generation, voiceovers, brand assets, and niche analysis
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {renderContent()}
          {renderResults()}
        </div>
      </DialogContent>
    </Dialog>
  );
}