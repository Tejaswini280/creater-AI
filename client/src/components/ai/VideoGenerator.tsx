import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Film, Play, Download, Settings, Clock, Music } from "lucide-react";

export default function VideoGenerator() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoStyle, setVideoStyle] = useState("modern");
  const [videoDuration, setVideoDuration] = useState("30");
  const [videoMusic, setVideoMusic] = useState("upbeat");
  const [generatedVideo, setGeneratedVideo] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Check AI service status
  const { data: aiStatus } = useQuery({
    queryKey: ['/api/ai/status'],
    retry: false,
  });

  const generateVideoMutation = useMutation({
    mutationFn: async (data: {
      prompt: string;
      style: string;
      duration: string;
      music: string;
    }) => {
      const response = await apiRequest('POST', '/api/ai/generate-video', data);
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedVideo(data);
      
      // Check if this is a demo response
      if (data.demo || data.simulated) {
        toast({
          title: "Demo Video Generated!",
          description: data.message || "This is a demo response. In production, this would generate a real AI video.",
        });
      } else {
        toast({
          title: "Video Generated!",
          description: "Your AI-generated video is ready to view.",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/ai/tasks'] });
    },
    onError: (error) => {
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
        description: (error as any)?.data?.message || (error as Error).message || "Failed to generate video. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a description for the video.",
        variant: "destructive",
      });
      return;
    }

    if (parseInt(videoDuration) < 10 || parseInt(videoDuration) > 120) {
      toast({
        title: "Invalid Duration",
        description: "Video duration must be between 10-120 seconds.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      await generateVideoMutation.mutateAsync({
        prompt: videoPrompt,
        style: videoStyle,
        duration: videoDuration,
        music: videoMusic,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadVideo = () => {
    if (!generatedVideo?.videoUrl) return;

    const link = document.createElement('a');
    link.href = generatedVideo.videoUrl;
    link.download = `ai-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download Started",
      description: "Your video download has begun.",
    });
  };

  const STYLE_OPTIONS = [
    { value: "modern", label: "Modern & Sleek", description: "Contemporary, clean design" },
    { value: "vintage", label: "Vintage & Retro", description: "Classic, nostalgic style" },
    { value: "minimalist", label: "Minimalist", description: "Simple, clean aesthetics" },
    { value: "dramatic", label: "Dramatic & Cinematic", description: "High-contrast, impactful" },
    { value: "playful", label: "Playful & Fun", description: "Colorful, energetic style" },
    { value: "professional", label: "Professional", description: "Corporate, business-like" }
  ];

  const MUSIC_OPTIONS = [
    { value: "upbeat", label: "Upbeat & Energetic", description: "Fast-paced, motivating" },
    { value: "calm", label: "Calm & Peaceful", description: "Slow-paced, relaxing" },
    { value: "dramatic", label: "Dramatic & Intense", description: "Powerful, cinematic" },
    { value: "funky", label: "Funky & Groovy", description: "Rhythmic, danceable" },
    { value: "epic", label: "Epic & Orchestral", description: "Grand, movie-like" },
    { value: "none", label: "No Music", description: "Silent video" }
  ];

  const DURATION_OPTIONS = [
    { value: "15", label: "15 seconds", description: "Short social media clip" },
    { value: "30", label: "30 seconds", description: "Instagram/TikTok video" },
    { value: "45", label: "45 seconds", description: "Extended social clip" },
    { value: "60", label: "60 seconds", description: "YouTube short" },
    { value: "90", label: "90 seconds", description: "Long-form social video" },
    { value: "120", label: "120 seconds", description: "Extended content" }
  ];

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center text-purple-900">
          <Film className="w-5 h-5 mr-2 text-purple-600" />
          AI Video Generator
          {aiStatus?.configured ? (
            <Badge className="ml-2 bg-green-100 text-green-800">
              AI Active
            </Badge>
          ) : (
            <Badge className="ml-2 bg-yellow-100 text-yellow-800">
              Limited Mode
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Video Generation Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Video Description</label>
            <Textarea
              placeholder="Describe the video you want to create... e.g., 'A futuristic cityscape with flying cars and neon lights'"
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              rows={3}
              className="border-purple-200 focus:border-purple-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Settings className="w-4 h-4 mr-1" />
                Style
              </label>
              <Select value={videoStyle} onValueChange={setVideoStyle}>
                <SelectTrigger className="border-purple-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_OPTIONS.map(style => (
                    <SelectItem key={style.value} value={style.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{style.label}</span>
                        <span className="text-xs text-gray-500">{style.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Duration
              </label>
              <Select value={videoDuration} onValueChange={setVideoDuration}>
                <SelectTrigger className="border-purple-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(duration => (
                    <SelectItem key={duration.value} value={duration.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{duration.label}</span>
                        <span className="text-xs text-gray-500">{duration.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Music className="w-4 h-4 mr-1" />
                Music
              </label>
              <Select value={videoMusic} onValueChange={setVideoMusic}>
                <SelectTrigger className="border-purple-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MUSIC_OPTIONS.map(music => (
                    <SelectItem key={music.value} value={music.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{music.label}</span>
                        <span className="text-xs text-gray-500">{music.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerateVideo}
            disabled={generateVideoMutation.isPending || isGenerating}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {(generateVideoMutation.isPending || isGenerating) ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating Video...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Film className="w-4 h-4" />
                <span>Generate AI Video</span>
              </div>
            )}
          </Button>
        </div>

        {/* Generated Video Display */}
        {generatedVideo && (
          <div className="space-y-4 p-4 bg-white/70 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Generated Video</span>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadVideo}
                  className="border-purple-300"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Video Preview</h4>
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    controls
                    className="w-full h-48 object-cover"
                    poster={generatedVideo.thumbnailUrl}
                  >
                    <source src={generatedVideo.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Video Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Title:</strong> {generatedVideo.title}</p>
                    <p><strong>Duration:</strong> {generatedVideo.duration} seconds</p>
                    <p><strong>Style:</strong> {generatedVideo.metadata?.style}</p>
                    <p><strong>Music:</strong> {generatedVideo.metadata?.music}</p>
                    <p><strong>Generated:</strong> {new Date(generatedVideo.metadata?.generatedAt).toLocaleString()}</p>
                  </div>
                </div>

                {generatedVideo.description && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Video Script</h4>
                    <Textarea
                      value={generatedVideo.description}
                      readOnly
                      rows={6}
                      className="bg-white border-purple-200 text-gray-800 resize-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Badge className="bg-purple-100 text-purple-800">
                <Film className="w-3 h-3 mr-1" />
                AI Generated
              </Badge>
              <Badge className="bg-blue-100 text-blue-800">
                <Settings className="w-3 h-3 mr-1" />
                {generatedVideo.metadata?.model}
              </Badge>
            </div>
          </div>
        )}

        {/* AI Service Status */}
        {aiStatus && (
          <div className="mt-6 p-4 bg-white/50 rounded-lg border border-purple-200">
            <h4 className="font-medium text-gray-700 mb-2">AI Service Status</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${aiStatus.openai ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>OpenAI</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${aiStatus.gemini ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Gemini</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
