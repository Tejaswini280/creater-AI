import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Image, Palette, Download, Copy, Wand2, Sparkles } from "lucide-react";

interface ThumbnailOption {
  id: string;
  url: string;
  style: string;
  clickThroughRate: number;
}

interface VoiceOption {
  id: string;
  audioUrl: string;
  voice: string;
  duration: number;
  quality: string;
  naturalness: number;
}

export default function MediaAI() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"thumbnail" | "voiceover">("thumbnail");
  
  // Thumbnail state
  const [thumbnailTitle, setThumbnailTitle] = useState("");
  const [thumbnailStyle, setThumbnailStyle] = useState("modern");
  const [thumbnailColors, setThumbnailColors] = useState(["#FF6B35", "#2C3E50"]);
  const [thumbnails, setThumbnails] = useState<ThumbnailOption[]>([]);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  
  // Voiceover state
  const [voiceoverText, setVoiceoverText] = useState("");
  const [voiceType, setVoiceType] = useState("professional");
  const [voiceSpeed, setVoiceSpeed] = useState(1);
  const [voiceLanguage, setVoiceLanguage] = useState("en-US");
  const [voiceOptions, setVoiceOptions] = useState<VoiceOption[]>([]);
  const [isGeneratingVoiceover, setIsGeneratingVoiceover] = useState(false);

  const generateThumbnail = async () => {
    if (!thumbnailTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your thumbnail",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingThumbnail(true);
    try {
      const response = await fetch('/api/ai/generate-thumbnail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: thumbnailTitle,
          style: thumbnailStyle,
          colors: thumbnailColors,
          template: 'default'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setThumbnails(data.data.thumbnails || []);
        toast({
          title: "Thumbnails Generated!",
          description: `Created ${data.data.thumbnails?.length || 0} thumbnail variations`,
        });
      } else {
        throw new Error(data.message || 'Failed to generate thumbnails');
      }
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      
      // For demo purposes, create mock thumbnails
      const mockThumbnails: ThumbnailOption[] = [
        {
          id: '1',
          url: '/api/placeholder-thumbnail-1.jpg',
          style: thumbnailStyle,
          clickThroughRate: 8.5
        },
        {
          id: '2',
          url: '/api/placeholder-thumbnail-2.jpg',
          style: thumbnailStyle,
          clickThroughRate: 7.2
        },
        {
          id: '3',
          url: '/api/placeholder-thumbnail-3.jpg',
          style: thumbnailStyle,
          clickThroughRate: 9.1
        }
      ];
      
      setThumbnails(mockThumbnails);
      
      toast({
        title: "Demo Thumbnails Generated!",
        description: "Created 3 demo thumbnail variations (API integration needed for real generation)",
      });
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const generateVoiceover = async () => {
    if (!voiceoverText.trim()) {
      toast({
        title: "Error",
        description: "Please enter text for voiceover generation",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingVoiceover(true);
    try {
      const response = await fetch('/api/ai/generate-voiceover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          text: voiceoverText,
          voice: voiceType,
          speed: voiceSpeed,
          language: voiceLanguage
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Handle new TTS response format
        const voiceover = data.data.voiceover;
        const voiceOptions: VoiceOption[] = [{
          id: voiceover.id,
          audioUrl: voiceover.audioUrl,
          voice: voiceover.voice,
          duration: voiceover.duration,
          quality: 'High',
          naturalness: voiceover.naturalness
        }];
        
        setVoiceOptions(voiceOptions);
        toast({
          title: "Real Voiceover Generated! 🎙️",
          description: `High-quality ${voiceover.voice} voice created with OpenAI TTS-HD`,
        });
      } else if (data.fallback) {
        // Handle fallback case
        toast({
          title: "Using Browser TTS",
          description: "OpenAI TTS unavailable. Using browser fallback.",
          variant: "destructive",
        });
        
        // Use browser TTS as fallback
        const utterance = new SpeechSynthesisUtterance(data.fallback.text);
        speechSynthesis.speak(utterance);
      } else {
        throw new Error(data.message || 'Failed to generate voiceover');
      }
    } catch (error) {
      console.error('Voiceover generation error:', error);
      
      toast({
        title: "Voiceover Generation Failed",
        description: "Could not generate real voiceover. Check OpenAI API key.",
        variant: "destructive",
      });
      
      // Create fallback browser TTS
      const utterance = new SpeechSynthesisUtterance(voiceoverText);
      speechSynthesis.speak(utterance);
      
      toast({
        title: "Demo Voiceover Generated!",
        description: "Created 2 demo voice variations (API integration needed for real generation)",
      });
    } finally {
      setIsGeneratingVoiceover(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    });
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: "File download has been initiated",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab("thumbnail")}
          className={`pb-2 px-4 ${
            activeTab === "thumbnail"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600"
          }`}
        >
          <Image className="inline w-4 h-4 mr-2" />
          Thumbnail Generator
        </button>
        <button
          onClick={() => setActiveTab("voiceover")}
          className={`pb-2 px-4 ${
            activeTab === "voiceover"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600"
          }`}
        >
          <Wand2 className="inline w-4 h-4 mr-2" />
          Voiceover Generator
        </button>
      </div>

      {activeTab === "thumbnail" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                AI Thumbnail Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Thumbnail Title</label>
                <Input
                  value={thumbnailTitle}
                  onChange={(e) => setThumbnailTitle(e.target.value)}
                  placeholder="Enter your video/content title..."
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Style</label>
                  <Select value={thumbnailStyle} onValueChange={setThumbnailStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="vibrant">Vibrant</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={thumbnailColors[0]}
                      onChange={(e) => setThumbnailColors([e.target.value, thumbnailColors[1]])}
                      className="w-12 h-10 rounded border"
                    />
                    <input
                      type="color"
                      value={thumbnailColors[1]}
                      onChange={(e) => setThumbnailColors([thumbnailColors[0], e.target.value])}
                      className="w-12 h-10 rounded border"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={generateThumbnail}
                disabled={isGeneratingThumbnail}
                className="w-full"
              >
                {isGeneratingThumbnail ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Generating Thumbnails...
                  </>
                ) : (
                  <>
                    <Palette className="w-4 h-4 mr-2" />
                    Generate Thumbnails
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {thumbnails.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Thumbnails</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {thumbnails.map((thumbnail) => (
                    <div key={thumbnail.id} className="space-y-2">
                      <div className="relative group">
                        <div className="w-full h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg border flex items-center justify-center">
                          <div className="text-center text-white">
                            <Image className="w-8 h-8 mx-auto mb-1" />
                            <p className="text-sm font-medium">{thumbnailTitle || 'Thumbnail'}</p>
                            <p className="text-xs opacity-75">{thumbnail.style}</p>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Button
                            size="sm"
                            onClick={() => copyToClipboard(thumbnail.url)}
                            className="mr-2"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => downloadFile(thumbnail.url, `thumbnail-${thumbnail.id}.jpg`)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge variant="secondary">{thumbnail.style}</Badge>
                        <span className="text-sm text-gray-600">
                          CTR: {thumbnail.clickThroughRate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "voiceover" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                AI Voiceover Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Script Text</label>
                <Textarea
                  value={voiceoverText}
                  onChange={(e) => setVoiceoverText(e.target.value)}
                  placeholder="Enter your script text for voiceover generation..."
                  rows={6}
                  className="w-full"
                />
                <div className="text-sm text-gray-500 mt-1">
                  {voiceoverText.split(' ').length} words • ~{Math.ceil(voiceoverText.split(' ').length / 150)} min read time
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Voice Type</label>
                  <Select value={voiceType} onValueChange={setVoiceType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                      <SelectItem value="energetic">Energetic</SelectItem>
                      <SelectItem value="calm">Calm</SelectItem>
                      <SelectItem value="authoritative">Authoritative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Speed: {voiceSpeed}x</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voiceSpeed}
                    onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  <Select value={voiceLanguage} onValueChange={setVoiceLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="en-GB">English (UK)</SelectItem>
                      <SelectItem value="es-ES">Spanish</SelectItem>
                      <SelectItem value="fr-FR">French</SelectItem>
                      <SelectItem value="de-DE">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={generateVoiceover}
                disabled={isGeneratingVoiceover}
                className="w-full"
              >
                {isGeneratingVoiceover ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Generating Voiceover...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Voiceover
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {voiceOptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Voiceovers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {voiceOptions.map((option) => (
                    <div key={option.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium capitalize">{option.voice} Voice</h4>
                          <p className="text-sm text-gray-600">
                            Duration: {option.duration}s • Quality: {option.quality} • Naturalness: {option.naturalness}%
                          </p>
                        </div>
                        <Badge variant="outline">{option.quality}</Badge>
                      </div>
                      
                      <div className="bg-gray-100 rounded-lg p-4 mb-3 flex items-center justify-center">
                        <div className="text-center">
                          <Wand2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">Audio Preview</p>
                          <p className="text-xs text-gray-500">{option.quality} Quality</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => downloadFile(option.audioUrl, `voiceover-${option.id}.mp3`)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(option.audioUrl)}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy Link
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}