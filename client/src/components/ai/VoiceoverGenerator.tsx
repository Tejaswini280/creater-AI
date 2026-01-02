import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Mic, Play, Download, Volume2, AlertCircle } from "lucide-react";

export default function VoiceoverGenerator() {
  const { toast } = useToast();
  const [script, setScript] = useState("AI Tools");
  const [voice, setVoice] = useState("alloy");
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const generateVoiceoverMutation = useMutation({
    mutationFn: async () => {
      console.log('Generating voiceover with:', { script, voice });
      
      // First try the regular OpenAI voiceover endpoint
      const response = await apiRequest('POST', '/api/ai/generate-voiceover', {
        text: script.trim(), // Changed from 'script' to 'text' to match new API
        voice: voice,
        speed: 1.0,
        language: 'en-US'
      });
      
      console.log('Voiceover API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Voiceover API error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Voiceover API success response:', data);
      
      // If the response indicates fallback is needed, try the Gemini-enhanced endpoint
      if (data.message && (data.message.includes('fallback') || data.message.includes('unavailable'))) {
        console.log('Trying Gemini-enhanced voiceover...');
        try {
          const geminiResponse = await apiRequest('POST', '/api/ai/generate-voiceover-gemini', {
            text: script.trim(),
            voice: voice,
            speed: 1.0,
            language: 'en-US'
          });
          
          if (geminiResponse.ok) {
            const geminiData = await geminiResponse.json();
            console.log('Gemini voiceover response:', geminiData);
            return geminiData;
          }
        } catch (geminiError) {
          console.error('Gemini voiceover also failed:', geminiError);
        }
      }
      
      return data;
    },
    onSuccess: (data) => {
      console.log('Voiceover generation successful:', data);
      
      // Handle various TTS response formats
      if (data.success && data.audioUrl) {
        // Direct response format with audioUrl
        setGeneratedAudio(data.audioUrl);
        const isFallback = data.audioUrl.includes('bell-ringing') || data.message?.includes('fallback');
        toast({
          title: isFallback ? "Demo Audio Generated" : "Voiceover Generated! 🎙️",
          description: data.message || `Voiceover created (${data.duration || "unknown"}s).`,
        });
      } else if (data.success && data.data && data.data.voiceover) {
        // Nested response format (including Gemini-enhanced)
        const voiceover = data.data.voiceover;
        
        // If this is a Gemini-enhanced response, we need to handle browser TTS
        if (voiceover.optimizedText) {
          // This is a Gemini-enhanced response - use browser TTS with optimized text
          toast({
            title: "Text Optimized with Gemini! 🤖",
            description: "Using browser TTS with optimized text for better speech."
          });
          
          // Use browser TTS with the optimized text
          const utterance = new SpeechSynthesisUtterance(voiceover.optimizedText);
          
          // Try to match the requested voice if possible
          const voices = speechSynthesis.getVoices();
          const requestedVoice = voices.find(v => 
            v.name.toLowerCase().includes(voiceover.voice.toLowerCase()) ||
            v.name.toLowerCase().includes(voiceover.voice.toLowerCase().replace('alloy', 'default').replace('nova', 'female').replace('echo', 'male'))
          );
          
          if (requestedVoice) {
            utterance.voice = requestedVoice;
          }
          
          utterance.onend = () => {
            toast({
              title: "Speech Complete",
              description: "Browser TTS playback finished."
            });
          };
          
          speechSynthesis.speak(utterance);
        } else {
          // Regular nested response format
          setGeneratedAudio(voiceover.audioUrl);
          const isFallback = voiceover.audioUrl?.includes('bell-ringing') || data.message?.includes('fallback');
          toast({
            title: isFallback ? "Demo Audio Generated" : "Real Voiceover Generated! 🎙️",
            description: isFallback 
              ? "This is demo audio. To generate real voiceover, ensure your OpenAI API key is valid and billing is enabled." 
              : `High-quality ${voiceover.voice} voice created (${voiceover.duration}s). No more beep sounds!`,
          });
        }
      } else if (data.fallback) {
        // Handle fallback case - browser TTS
        toast({
          title: "Using Browser TTS",
          description: "OpenAI TTS unavailable. Using browser fallback.",
        });
        
        // Use browser TTS as fallback
        const utterance = new SpeechSynthesisUtterance(data.fallback.text);
        
        // Try to match the requested voice if possible
        const voices = speechSynthesis.getVoices();
        const requestedVoice = voices.find(v => 
          v.name.toLowerCase().includes(data.fallback.voice.toLowerCase()) ||
          v.name.toLowerCase().includes(data.fallback.voice.toLowerCase().replace('alloy', 'default').replace('nova', 'female').replace('echo', 'male'))
        );
        
        if (requestedVoice) {
          utterance.voice = requestedVoice;
        }
        
        utterance.onend = () => {
          toast({
            title: "Speech Complete",
            description: "Browser TTS playback finished."
          });
        };
        
        speechSynthesis.speak(utterance);
      } else {
        throw new Error('Invalid response format');
      }
    },
    onError: (error) => {
      console.error('Voiceover generation error:', error);
      
      if (error && isUnauthorizedError(error as Error)) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Generation Failed",
        description: `Failed to generate voiceover: ${errorMessage}`,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!script.trim()) {
      toast({
        title: "Script Required",
        description: "Please enter some text to generate voiceover.",
        variant: "destructive",
      });
      return;
    }

    if (script.length > 4096) {
      toast({
        title: "Script Too Long",
        description: "Script must be 4096 characters or less.",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting voiceover generation...');
    generateVoiceoverMutation.mutate();
  };

  const handlePlay = () => {
    if (!generatedAudio) {
      console.error('No audio URL available for playback');
      toast({
        title: "No Audio",
        description: "No audio file available to play.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('Attempting to play audio:', generatedAudio);
    setIsPlaying(true);
    
    const audio = new Audio();
    
    // Set up event handlers before setting the source
    audio.onloadstart = () => {
      console.log('Audio loading started');
    };
    
    audio.oncanplay = () => {
      console.log('Audio can start playing');
    };
    
    audio.oncanplaythrough = () => {
      console.log('Audio can play through without buffering');
    };
    
    audio.onended = () => {
      console.log('Audio playback ended');
      setIsPlaying(false);
    };
    
    audio.onerror = (error) => {
      console.error('Audio error event:', error);
      console.error('Audio error details:', {
        error: audio.error,
        networkState: audio.networkState,
        readyState: audio.readyState,
        src: audio.src
      });
      setIsPlaying(false);
      toast({
        title: "Playback Error",
        description: "Failed to play audio file. Please try again.",
        variant: "destructive",
      });
    };
    
    // Set the audio source
    audio.src = generatedAudio;
    
    // Attempt to play
    audio.play().then(() => {
      console.log('Audio playback started successfully');
    }).catch(error => {
      console.error('Audio play error:', error);
      setIsPlaying(false);
      
      // Provide more specific error messages
      let errorMessage = "Failed to play audio file.";
      if (error.name === 'NotAllowedError') {
        errorMessage = "Audio playback was blocked. Please allow audio in your browser.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Audio format not supported by your browser.";
      } else if (error.name === 'NetworkError') {
        errorMessage = "Network error while loading audio file.";
      }
      
      toast({
        title: "Playback Error",
        description: errorMessage,
        variant: "destructive",
      });
    });
  };

  const handleDownload = () => {
    if (!generatedAudio) {
      console.error('No audio URL available for download');
      toast({
        title: "No Audio",
        description: "No audio file available to download.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('Attempting to download audio:', generatedAudio);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = generatedAudio;
    link.download = `voiceover_${Date.now()}.mp3`;
    link.target = '_blank';
    
    // Add error handling for the link
    link.onerror = () => {
      console.error('Download link error');
      toast({
        title: "Download Error",
        description: "Failed to download audio file.",
        variant: "destructive",
      });
    };
    
    // Trigger the download
    try {
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Voiceover download initiated.",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Error",
        description: "Failed to start download. Please try again.",
        variant: "destructive",
      });
    }
  };

  const characterCount = script.length;
  const estimatedDuration = Math.ceil(characterCount / 150); // Rough estimate: 150 characters per second

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mic className="w-5 h-5" />
          <span>AI Voiceover Generator</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Script</label>
          <Textarea
            placeholder="Enter your script text..."
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="min-h-[100px] border-blue-200"
            maxLength={4096}
          />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{characterCount} characters. ~{estimatedDuration} seconds estimated</span>
            <span>{characterCount}/4096</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Voice Style</label>
          <Select value={voice} onValueChange={setVoice}>
            <SelectTrigger className="border-blue-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
              <SelectItem value="echo">Echo (Male)</SelectItem>
              <SelectItem value="fable">Fable (Storytelling)</SelectItem>
              <SelectItem value="onyx">Onyx (Deep)</SelectItem>
              <SelectItem value="nova">Nova (Female)</SelectItem>
              <SelectItem value="shimmer">Shimmer (Bright)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generateVoiceoverMutation.isPending || !script.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {generateVoiceoverMutation.isPending ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Generating...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4" />
              <span>Generate Voiceover</span>
            </div>
          )}
        </Button>

        {/* Error Display */}
        {generateVoiceoverMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center text-red-800 text-sm">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span>Generation Failed</span>
            </div>
            <p className="text-red-700 text-xs mt-1">
              Failed to generate voiceover. Please try again.
            </p>
          </div>
        )}

        {generatedAudio && (
          <div className="space-y-3 p-4 bg-white/70 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Generated Audio</span>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePlay}
                  disabled={isPlaying}
                  className="border-blue-300"
                >
                  <Play className="w-4 h-4 mr-1" />
                  {isPlaying ? "Playing..." : "Play"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownload}
                  className="border-blue-300"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <audio controls className="w-full">
              <source src={generatedAudio} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </CardContent>
    </Card>
  );
}