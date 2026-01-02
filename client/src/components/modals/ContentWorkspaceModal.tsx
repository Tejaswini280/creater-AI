import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Camera, 
  Mic, 
  Video, 
  Calendar, 
  Sparkles,
  Bot,
  Clock,
  Youtube,
  Instagram,
  Facebook,
  Image,
  Save
} from "lucide-react";

interface ContentWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: any;
  onContentUpdate: (updatedContent: any) => void;
}

export default function ContentWorkspaceModal({
  isOpen,
  onClose,
  content,
  onContentUpdate
}: ContentWorkspaceModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('media');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Content Workspace</DialogTitle>
          <DialogDescription>
            Edit and enhance your content with AI-powered tools
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="media">Media Library</TabsTrigger>
            <TabsTrigger value="script">AI Script</TabsTrigger>
            <TabsTrigger value="voiceover">Voiceover</TabsTrigger>
            <TabsTrigger value="thumbnail">Thumbnail</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="media" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Video className="w-5 h-5 mr-2" />
                  Media Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">Upload your media files</p>
                  <Button>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="script" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="w-5 h-5 mr-2" />
                  AI Script Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="description">Content Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what your content is about..."
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="platform">Platform</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tone">Tone</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conversational">Conversational</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="energetic">Energetic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Script
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voiceover" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mic className="w-5 h-5 mr-2" />
                  AI Voiceover
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="voice-text">Text to Speech</Label>
                  <Textarea
                    id="voice-text"
                    placeholder="Enter text for voiceover..."
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="voice">Voice</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select voice" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
                        <SelectItem value="echo">Echo (Male)</SelectItem>
                        <SelectItem value="nova">Nova (Female)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="speed">Speed</Label>
                    <Input type="number" min="0.5" max="2" step="0.1" defaultValue="1" />
                  </div>
                </div>
                <Button className="w-full">
                  <Mic className="w-4 h-4 mr-2" />
                  Generate Voiceover
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="thumbnail" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Image className="w-5 h-5 mr-2" />
                  Thumbnail Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="thumbnail-title">Title</Label>
                  <Input
                    id="thumbnail-title"
                    placeholder="Enter thumbnail title..."
                    defaultValue={content?.title || ''}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="style">Style</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="classic">Classic</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="colors">Colors</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select colors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vibrant">Vibrant</SelectItem>
                        <SelectItem value="pastel">Pastel</SelectItem>
                        <SelectItem value="monochrome">Monochrome</SelectItem>
                        <SelectItem value="brand">Brand Colors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Thumbnail
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Schedule Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      defaultValue="12:00"
                    />
                  </div>
                </div>
                <div>
                  <Label>Platforms</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="cursor-pointer">
                      <Youtube className="w-4 h-4 mr-1" />
                      YouTube
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer">
                      <Instagram className="w-4 h-4 mr-1" />
                      Instagram
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer">
                      <Facebook className="w-4 h-4 mr-1" />
                      Facebook
                    </Badge>
                  </div>
                </div>
                <Button className="w-full">
                  <Clock className="w-4 h-4 mr-2" />
                  Schedule Post
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => {
            toast({
              title: "Content Saved",
              description: "Your content has been saved successfully.",
            });
            onClose();
          }}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}