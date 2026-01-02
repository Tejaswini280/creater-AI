import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWebSocketSingleton } from "@/hooks/useWebSocketSingleton";
import { FileText, Zap, Copy, Download, PlayCircle, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function StreamingScriptGenerator() {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [script, setScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [engagementScore, setEngagementScore] = useState(0);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const scriptRef = useRef<HTMLDivElement>(null);

  // WebSocket connection
  const {
    isConnected,
    isConnecting,
    error: wsError,
    startStream,
    stopStream
  } = useWebSocketSingleton({
    onMessage: (message) => {
      handleWebSocketMessage(message);
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      setUseFallback(true);
      toast({
        title: "WebSocket Error",
        description: "Using fallback mode for script generation",
        variant: "destructive",
      });
    }
  });

  // Handle WebSocket messages
  const handleWebSocketMessage = (message: any) => {
    console.log('Received WebSocket message:', message);
    
    switch (message.type) {
      case 'stream_started':
        setCurrentStreamId(message.streamId);
        setIsGenerating(true);
        setScript('');
        toast({
          title: "Stream Started",
          description: "Real-time script generation in progress...",
        });
        break;
        
      case 'script_generation':
        if (message.data && message.data.content) {
          setScript(prev => prev + message.data.content);
          setWordCount(prev => prev + message.data.content.split(' ').length);
        }
        if (message.progress) {
          setEngagementScore(Math.round(message.progress));
        }
        if (message.isComplete) {
          setIsGenerating(false);
          setCurrentStreamId(null);
          toast({
            title: "Script Generated!",
            description: "Your real-time script is ready.",
          });
        }
        break;
        
      case 'stream_stopped':
        setIsGenerating(false);
        setCurrentStreamId(null);
        toast({
          title: "Stream Stopped",
          description: "Script generation stopped.",
        });
        break;
        
      case 'error':
        setIsGenerating(false);
        setCurrentStreamId(null);
        toast({
          title: "Generation Error",
          description: message.error || "An error occurred during generation",
          variant: "destructive",
        });
        break;
        
      default:
        console.log('Unhandled message type:', message.type);
    }
  };

  // Fallback script generation using REST API
  const generateScriptFallback = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic for script generation",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setScript('');
    setWordCount(0);
    setEngagementScore(0);

    try {
      // Use the streaming endpoint for better results
      const response = await apiRequest('POST', '/api/ai/streaming-generate', {
        prompt: `Create an engaging ${platform} script about "${topic.trim()}" that should be approximately 60 seconds long. Make it conversational, energetic, and include timing cues.`,
        model: 'gemini',
        stream: true
      });

      const data = await response.json();
      const content = data?.result?.content || data?.content || '';
      if (content) {
        setScript(content);
        setWordCount(content.split(' ').length);
        setEngagementScore(85); // Default engagement score
        toast({
          title: "Script Generated!",
          description: "Your script has been created successfully.",
        });
      } else {
        throw new Error('No script content received');
      }
    } catch (error) {
      console.error('Script generation error:', error);
      
      if (error && isUnauthorizedError(error as Error)) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Generation Failed",
        description: (error as any)?.data?.message || (error as Error)?.message || "Failed to generate script. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate streaming script
  const generateStreamingScript = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic for script generation",
        variant: "destructive",
      });
      return;
    }

    // Use fallback if WebSocket is not connected
    if (!isConnected || useFallback) {
      console.log('Using fallback script generation');
      await generateScriptFallback();
      return;
    }

    // Use WebSocket streaming
    const success = startStream('script_generation', {
      topic: topic.trim(),
      platform: platform,
      duration: '60 seconds'
    });

    if (!success) {
      console.log('WebSocket stream start failed, using fallback');
      setUseFallback(true);
      await generateScriptFallback();
    }
  };

  // Stop current stream
  const stopCurrentStream = () => {
    if (currentStreamId) {
      stopStream(currentStreamId);
    }
    setIsGenerating(false);
    setCurrentStreamId(null);
  };

  // Copy script to clipboard
  const copyScript = async () => {
    if (!script) return;
    
    try {
      await navigator.clipboard.writeText(script);
      toast({
        title: "Copied!",
        description: "Script copied to clipboard",
      });
    } catch (error) {
      console.error('Copy failed:', error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy script to clipboard",
        variant: "destructive",
      });
    }
  };

  // Download script
  const downloadScript = () => {
    if (!script) return;
    
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script_${topic.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "Script downloaded successfully",
    });
  };

  // Auto-scroll to bottom when script updates
  useEffect(() => {
    if (scriptRef.current) {
      scriptRef.current.scrollTop = scriptRef.current.scrollHeight;
    }
  }, [script]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Real-time Script Generator</span>
          <div className="flex items-center space-x-2 ml-auto">
            {isConnected ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Wifi className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : isConnecting ? (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Zap className="w-3 h-3 mr-1" />
                Connecting...
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                <WifiOff className="w-3 h-3 mr-1" />
                Disconnected
              </Badge>
            )}
            {useFallback && (
              <Badge variant="outline" className="text-orange-600">
                <AlertCircle className="w-3 h-3 mr-1" />
                Fallback Mode
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Topic</label>
            <Input
              placeholder="Enter your video topic..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="border-blue-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Platform</label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="border-blue-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={generateStreamingScript}
            disabled={isGenerating}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {isGenerating ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating Real-time...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <PlayCircle className="w-4 h-4" />
                <span>Generate Streaming Script</span>
              </div>
            )}
          </Button>
          
          {isGenerating && (
            <Button
              onClick={stopCurrentStream}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Stop
            </Button>
          )}
        </div>

        {/* WebSocket Error Display */}
        {wsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center text-red-800 text-sm">
              <WifiOff className="w-4 h-4 mr-2" />
              <span>Connection Error: {wsError}</span>
            </div>
          </div>
        )}

        {/* Script Display */}
        {(script || isGenerating) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{engagementScore}% engagement</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyScript}
                  disabled={!script}
                  className="border-blue-300"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadScript}
                  disabled={!script}
                  className="border-blue-300"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            
            <div
              ref={scriptRef}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-64 overflow-y-auto text-sm leading-relaxed"
            >
              {script || (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                  Generating script...
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}