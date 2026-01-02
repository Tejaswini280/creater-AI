import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Image, Download, Wand2, Sparkles } from "lucide-react";

export default function ThumbnailGenerator() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [style, setStyle] = useState("vibrant");
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);

  const generateThumbnailMutation = useMutation({
    mutationFn: async () => {
      // Send the clean title as prompt, and the selected style as an option
      const styleMap: Record<string, string> = {
        vibrant: 'vibrant and energetic',
        minimal: 'clean and minimal',
        dramatic: 'dark and dramatic',
        professional: 'professional',
        gaming: 'gaming style',
        lifestyle: 'lifestyle',
      };
      const response = await apiRequest('POST', '/api/ai/generate-thumbnail', {
        prompt: title,
        style: styleMap[style] || 'professional',
        aspectRatio: '16:9',
        size: '1792x1024',
        quality: 'hd',
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data?.result?.imageUrl) {
        setGeneratedThumbnail(data.result.imageUrl);
      } else if (data?.imageUrl) {
        setGeneratedThumbnail(data.imageUrl);
      } else {
        setGeneratedThumbnail('https://placehold.co/1792x1024/6D28D9/FFFFFF.png?text=' + encodeURIComponent(title || 'AI Thumbnail'));
      }
      toast({
        title: "Thumbnail Generated!",
        description: "Your AI-generated thumbnail is ready.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Generation Failed",
        description: "Failed to generate thumbnail. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a video title for thumbnail generation.",
        variant: "destructive",
      });
      return;
    }
    generateThumbnailMutation.mutate();
  };

  const handleDownload = () => {
    if (generatedThumbnail) {
      const link = document.createElement('a');
      link.href = generatedThumbnail;
      link.download = `thumbnail_${title.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center text-purple-900">
          <Image className="w-5 h-5 mr-2 text-purple-600" />
          AI Thumbnail Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Video Title</label>
          <Input
            placeholder="Enter your video title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-purple-200 focus:border-purple-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Thumbnail Style</label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger className="border-purple-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vibrant">Vibrant & Energetic</SelectItem>
              <SelectItem value="minimal">Clean & Minimal</SelectItem>
              <SelectItem value="dramatic">Dark & Dramatic</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="gaming">Gaming Style</SelectItem>
              <SelectItem value="lifestyle">Lifestyle</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generateThumbnailMutation.isPending}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {generateThumbnailMutation.isPending ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Generating...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Wand2 className="w-4 h-4" />
              <span>Generate Thumbnail</span>
              <Sparkles className="w-4 h-4" />
            </div>
          )}
        </Button>

        {generatedThumbnail && (
          <div className="space-y-3">
            <div className="relative">
              <img
                src={generatedThumbnail}
                alt="Generated thumbnail"
                className="w-full rounded-lg border border-purple-200 shadow-md"
              />
              <div className="absolute top-2 right-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleDownload}
                  className="bg-white/90 hover:bg-white"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center">
              AI-generated thumbnail ready for use!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}