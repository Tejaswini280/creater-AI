import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Film, Play, Download, Copy, Sparkles, Clock, FileVideo } from "lucide-react";

interface VideoOption {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  style: string;
  music: string;
  resolution: string;
  duration: number;
  fileSize: number;
  processingTime: number;
  clickThroughRate?: number;
}

export default function VideoAI() {
  const { toast } = useToast();
  const [script, setScript] = useState("");
  const [videoStyle, setVideoStyle] = useState("modern");
  const [musicType, setMusicType] = useState("upbeat");
  const [videoDuration, setVideoDuration] = useState(60);
  const [videoOptions, setVideoOptions] = useState<VideoOption[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const generateVideo = async () => {
    if (!script.trim()) {
      toast({
        title: "Error",
        description: "Please enter a script for video generation",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProcessingProgress(0);
    
    // Show initial processing state
    setProcessingProgress(10);

    try {
      const response = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          prompt: script,  // Changed from 'script' to 'prompt'
          style: videoStyle,
          music: musicType,
          duration: videoDuration
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setVideoOptions(data.data.videoOptions || []);
        setProcessingProgress(100);
        
        // Check if this is a demo response
        if (data.demo || data.simulated) {
          toast({
            title: "Demo Video Generated!",
            description: data.message || "This is a demo response. In production, this would generate a real AI video.",
          });
        } else {
          const modelUsed = data.metadata?.model || 'AI';
          let serviceMessage = "Videos generated successfully!";
          
          if (modelUsed.includes('kling')) {
            serviceMessage = "🎬 Videos generated with KLING AI!";
          } else if (modelUsed.includes('huggingface')) {
            serviceMessage = "🤖 Videos generated with Hugging Face!";
          } else if (modelUsed.includes('openai')) {
            serviceMessage = "✨ Videos generated with OpenAI!";
          } else if (modelUsed.includes('gemini')) {
            serviceMessage = "🧠 Videos generated with Gemini AI!";
          }
          
          toast({
            title: serviceMessage,
            description: `Created ${data.data.videoOptions?.length || 0} video variations using ${modelUsed}`,
          });
        }
      } else {
        throw new Error(data.message || 'Failed to generate videos');
      }
    } catch (error) {
      console.error('Video generation error:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate videos",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProcessingProgress(0), 2000);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Video URL copied to clipboard",
    });
  };

  const downloadVideo = (videoUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: "Video download has been initiated",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="w-5 h-5" />
            AI Video Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Video Script</label>
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Enter your video script here..."
              rows={8}
              className="w-full"
            />
            <div className="text-sm text-gray-500 mt-1">
              {script.split(' ').length} words • Estimated video length: ~{Math.ceil(script.split(' ').length / 150 * 60)}s
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Video Style</label>
              <Select value={videoStyle} onValueChange={setVideoStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cinematic">Cinematic</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="dynamic">Dynamic</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Music Type</label>
              <Select value={musicType} onValueChange={setMusicType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upbeat">Upbeat</SelectItem>
                  <SelectItem value="epic">Epic</SelectItem>
                  <SelectItem value="ambient">Ambient</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="none">No Music</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Duration: {videoDuration}s</label>
              <input
                type="range"
                min="15"
                max="300"
                step="15"
                value={videoDuration}
                onChange={(e) => setVideoDuration(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {isGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing video...</span>
                <span>{Math.round(processingProgress)}%</span>
              </div>
              <Progress value={processingProgress} className="w-full" />
            </div>
          )}

          <Button
            onClick={generateVideo}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Generating Videos...
              </>
            ) : (
              <>
                <FileVideo className="w-4 h-4 mr-2" />
                Generate Videos
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {videoOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoOptions.map((video) => (
                <div key={video.id} className="space-y-3">
                  <div className="relative group">
                    {video.videoUrl && !video.videoUrl.includes('placeholder') ? (
                      <video 
                        className="w-full h-48 bg-gray-200 rounded-lg border object-cover"
                        controls
                        poster={video.thumbnailUrl}
                        preload="metadata"
                      >
                        <source src={video.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-lg border flex items-center justify-center">
                        <div className="text-center">
                          <FileVideo className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">Video Preview</p>
                          <p className="text-xs text-gray-500">{video.resolution}</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary">{video.resolution}</Badge>
                    </div>
                    {video.videoUrl && !video.videoUrl.includes('placeholder') && (
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="outline" className="bg-black/50 text-white border-white/20">
                          Real AI Video
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium capitalize">{video.style} Style</h4>
                      <Badge variant="outline">{video.music}</Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        Duration: {video.duration}s
                      </div>
                      <div>File size: {video.fileSize}MB</div>
                      <div>Processing time: {video.processingTime} min</div>
                      {video.clickThroughRate && (
                        <div>Expected CTR: {video.clickThroughRate}%</div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          if (video.videoUrl && !video.videoUrl.includes('placeholder')) {
                            // Open video in new tab for full screen viewing
                            window.open(video.videoUrl, '_blank');
                          } else {
                            toast({
                              title: "Preview Unavailable",
                              description: "This is a placeholder video. Generate a real video to see the preview.",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        {video.videoUrl && !video.videoUrl.includes('placeholder') ? 'Preview' : 'No Preview'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(video.videoUrl)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => downloadVideo(video.videoUrl, `video-${video.id}.mp4`)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}