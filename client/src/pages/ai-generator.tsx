import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Sparkles, FileText, Lightbulb, TrendingUp, Copy, Download, Wand2, Bot, Image, BarChart3, Zap, Brain, Film } from "lucide-react";

// Import new AI components
import ThumbnailGenerator from "@/components/ai/ThumbnailGenerator";
import VoiceoverGenerator from "@/components/ai/VoiceoverGenerator";
import VideoGenerator from "@/components/ai/VideoGenerator";
import { AIAgentOrchestrator } from "@/components/ai/AIAgentOrchestrator";
import AIAgentDashboard from "@/components/ai/AIAgentDashboard";
import StreamingScriptGenerator from "@/components/ai/StreamingScriptGenerator";
import PredictiveAnalytics from "@/components/ai/PredictiveAnalytics";

export default function AIGenerator() {
  const { toast } = useToast();
  
  // Check authentication on component mount
  useEffect(() => {
    console.log('AIGenerator mounted - Auth check will be handled by useAuth hook');
  }, []);
  
  const [activeSection, setActiveSection] = useState<
    "streaming" | "multimodal" | "video" | "agents" | "analytics" | "script" | "ideas" | "orchestration"
  >("streaming");
  const [scriptTopic, setScriptTopic] = useState("");
  const [scriptPlatforms, setScriptPlatforms] = useState<string[]>(["youtube"]);
  const [scriptDuration, setScriptDuration] = useState("60 seconds");
  const [ideaNiche, setIdeaNiche] = useState("AI");
  const [ideaPlatforms, setIdeaPlatforms] = useState<string[]>(["youtube"]);
  const [generatedScript, setGeneratedScript] = useState("");
  const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([]);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);

  const { data: aiTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/ai/tasks'],
    retry: false,
  });

  const { data: trendingTopics } = useQuery({
    queryKey: ['/api/trends/topics'],
    // No default queryFn configured; leave this optional. The UI guards below handle undefined.
    retry: false,
  });

  const generateScriptMutation = useMutation({
    mutationFn: async (data: { topic: string; platform: string; duration: string }) => {
      const response = await apiRequest('POST', '/api/ai/generate-script', data);
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedScript(data.script);
      toast({
        title: "Script Generated!",
        description: "Your AI-generated script is ready.",
      });
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
        description: (error as any)?.data?.message || (error as Error).message || "Failed to generate script. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateIdeasMutation = useMutation({
    mutationFn: async (data: { niche: string; platform: string }) => {
      console.log('generateIdeasMutation.mutationFn called with data:', data);
      const response = await apiRequest('POST', '/api/ai/content-ideas', data);
      console.log('API response received:', response);
      const result = await response.json();
      console.log('Parsed result:', result);
      return result;
    },
    onSuccess: (data: any) => {
      console.log('generateIdeasMutation.onSuccess called with data:', data);
      setGeneratedIdeas(data.ideas || []);
      toast({
        title: "Ideas Generated!",
        description: `Generated ${(data.ideas || []).length} content ideas.`,
      });
    },
    onError: (error: any) => {
      console.error('generateIdeasMutation.onError called with error:', error);
      console.error('Error message:', error.message);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error.constructor.name);
      
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
        description: error?.data?.message || error?.message || "Failed to generate ideas. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateScript = async () => {
    if (!scriptTopic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic for script generation.",
        variant: "destructive",
      });
      return;
    }
    if (scriptPlatforms.length <= 1) {
      generateScriptMutation.mutate({
        topic: scriptTopic,
        platform: scriptPlatforms[0] || "youtube",
        duration: scriptDuration,
      });
      return;
    }
    try {
      setIsGeneratingScript(true);
      const results = await Promise.all(
        scriptPlatforms.map(async (platform) => {
          const response = await apiRequest('POST', '/api/ai/generate-script', {
            topic: scriptTopic,
            platform,
            duration: scriptDuration,
          });
          const data = await response.json();
          return { platform, script: data.script };
        })
      );
      const combined = results
        .map(r => `=== ${r.platform.toUpperCase()} ===\n${r.script}`)
        .join("\n\n");
      setGeneratedScript(combined);
      toast({ title: "Scripts Generated!", description: `Created ${results.length} platform variants.` });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/tasks'] });
    } catch (error: any) {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/login"; }, 500);
        return;
      }
      toast({ title: "Generation Failed", description: error?.message || "Failed to generate scripts.", variant: "destructive" });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleGenerateIdeas = async () => {
    if (!ideaNiche.trim()) {
      toast({
        title: "Niche Required",
        description: "Please enter a niche for idea generation.",
        variant: "destructive",
      });
      return;
    }
    if (ideaPlatforms.length <= 1) {
      generateIdeasMutation.mutate({ niche: ideaNiche, platform: ideaPlatforms[0] || "youtube" });
      return;
    }
    try {
      setIsGeneratingIdeas(true);
      const all = await Promise.all(
        ideaPlatforms.map(async (platform) => {
          const response = await apiRequest('POST', '/api/ai/content-ideas', { niche: ideaNiche, platform });
          const data = await response.json();
          const ideas: string[] = data?.ideas || [];
          return ideas.map((i: string) => `[${platform}] ${i}`);
        })
      );
      const merged = all.flat();
      setGeneratedIdeas(merged);
      toast({ title: "Ideas Generated!", description: `Created ${merged.length} ideas across ${ideaPlatforms.length} platforms.` });
    } catch (error: any) {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "You are logged out. Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/login"; }, 500);
        return;
      }
      toast({ title: "Generation Failed", description: error?.message || "Failed to generate ideas.", variant: "destructive" });
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard.",
    });
  };

  const downloadText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const PLATFORM_OPTIONS = [
    { value: "youtube", label: "YouTube" },
    { value: "tiktok", label: "TikTok" },
    { value: "instagram", label: "Instagram" },
  ];

  const togglePlatform = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-3 py-4">
          <div className="text-sm font-semibold">AI Generator</div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Sections</SidebarGroupLabel>
            <SidebarMenu>
              {[
                { key: "streaming", icon: <Sparkles className="w-4 h-4" />, label: "Streaming AI" },
                { key: "multimodal", icon: <Image className="w-4 h-4" />, label: "Media AI" },
                { key: "video", icon: <Film className="w-4 h-4" />, label: "Video AI" },
                { key: "orchestration", icon: <Bot className="w-4 h-4" />, label: "AI Orchestration" },
                { key: "agents", icon: <Bot className="w-4 h-4" />, label: "AI Agents" },
                { key: "analytics", icon: <Brain className="w-4 h-4" />, label: "Predictive AI" },
                { key: "script", icon: <FileText className="w-4 h-4" />, label: "Classic Scripts" },
                { key: "ideas", icon: <Lightbulb className="w-4 h-4" />, label: "Ideas" },
              ].map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={activeSection === (item.key as any)}
                    onClick={() => setActiveSection(item.key as any)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI Content Generator
              </h1>
              <p className="text-gray-600 text-lg">Cutting-edge AI features for complete content automation</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className="bg-blue-100 text-blue-800">
                  <Zap className="w-3 h-3 mr-1" />
                  Real-time AI
                </Badge>
                <Badge className="bg-purple-100 text-purple-800">
                  <Bot className="w-3 h-3 mr-1" />
                  Autonomous Agents
                </Badge>
                <Badge className="bg-green-100 text-green-800">
                  <Image className="w-3 h-3 mr-1" />
                  Multimodal AI
                </Badge>
              </div>
            </div>
            <SidebarTrigger />
          </div>

          <AnimatePresence mode="wait">
            {activeSection === "streaming" && (
              <motion.div key="streaming" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <StreamingScriptGenerator />
                </div>
              </motion.div>
            )}

            {activeSection === "multimodal" && (
              <motion.div key="multimodal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ThumbnailGenerator />
                  <VoiceoverGenerator />
                </div>
              </motion.div>
            )}

            {activeSection === "video" && (
              <motion.div key="video" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-6">
                <VideoGenerator />
              </motion.div>
            )}

            {activeSection === "orchestration" && (
              <motion.div key="orchestration" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-6">
                <AIAgentOrchestrator />
              </motion.div>
            )}

            {activeSection === "agents" && (
              <motion.div key="agents" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-6">
                <AIAgentDashboard />
              </motion.div>
            )}

            {activeSection === "analytics" && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-6">
                <PredictiveAnalytics />
              </motion.div>
            )}

            {activeSection === "script" && (
              <motion.div key="script" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-6">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center text-blue-900">
                      <FileText className="w-5 h-5 mr-2 text-blue-600" />
                      Classic Script Generator
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Topic</label>
                        <Input
                          placeholder="Enter your topic..."
                          value={scriptTopic}
                          onChange={(e) => setScriptTopic(e.target.value)}
                          className="border-blue-200 focus:border-blue-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Platforms</label>
                        <div className="flex flex-wrap gap-3">
                          {PLATFORM_OPTIONS.map(p => (
                            <label key={p.value} className="flex items-center gap-2">
                              <Checkbox
                                checked={scriptPlatforms.includes(p.value)}
                                onCheckedChange={() => togglePlatform(scriptPlatforms, setScriptPlatforms, p.value)}
                              />
                              <span className="text-sm">{p.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Duration</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            "30 seconds",
                            "60 seconds",
                            "5 minutes",
                            "10 minutes",
                          ].map((d) => (
                            <Button key={d} variant={scriptDuration === d ? "default" : "outline"} onClick={() => setScriptDuration(d)} size="sm">
                              {d}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleGenerateScript}
                      disabled={generateScriptMutation.isPending || isGeneratingScript}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {(generateScriptMutation.isPending || isGeneratingScript) ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Generating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Wand2 className="w-4 h-4" />
                          <span>Generate Script</span>
                        </div>
                      )}
                    </Button>

                    {generatedScript && (
                      <div className="space-y-3 p-4 bg-white/70 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">Generated Script</span>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(generatedScript)}
                              className="border-blue-300"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadText(generatedScript, `script_${scriptTopic.replace(/[^a-zA-Z0-9]/g, '_')}.txt`)}
                              className="border-blue-300"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                        <Textarea
                          value={generatedScript}
                          readOnly
                          rows={12}
                          className="bg-white border-blue-200 text-gray-800 resize-none"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeSection === "ideas" && (
              <motion.div key="ideas" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-6">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-900">
                      <Lightbulb className="w-5 h-5 mr-2 text-green-600" />
                      Content Ideas Generator
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Niche</label>
                        <Input
                          placeholder="e.g., tech reviews, cooking, fitness"
                          value={ideaNiche}
                          onChange={(e) => setIdeaNiche(e.target.value)}
                          className="border-green-200 focus:border-green-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Platforms</label>
                        <div className="flex flex-wrap gap-3">
                          {PLATFORM_OPTIONS.map(p => (
                            <label key={p.value} className="flex items-center gap-2">
                              <Checkbox
                                checked={ideaPlatforms.includes(p.value)}
                                onCheckedChange={() => togglePlatform(ideaPlatforms, setIdeaPlatforms, p.value)}
                              />
                              <span className="text-sm">{p.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleGenerateIdeas}
                      disabled={generateIdeasMutation.isPending || isGeneratingIdeas}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {(generateIdeasMutation.isPending || isGeneratingIdeas) ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Generating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Lightbulb className="w-4 h-4" />
                          <span>Generate Ideas</span>
                        </div>
                      )}
                    </Button>

                    {generatedIdeas.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">Content Ideas ({generatedIdeas.length})</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(generatedIdeas.join('\n\n'))}
                            className="border-green-300"
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy All
                          </Button>
                        </div>
                        <div className="grid gap-3">
                          {generatedIdeas.map((idea, index) => (
                            <div key={index} className="p-3 bg-white/70 rounded-lg border border-green-200">
                              <p className="text-gray-800 text-sm">{idea}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {Array.isArray(trendingTopics) && trendingTopics.length > 0 && (
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-900">
                  <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
                  Trending Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {trendingTopics.slice(0, 6).map((topic: any, index: number) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-orange-100 border-orange-300 text-orange-800"
                      onClick={() => setScriptTopic(topic.title || String(topic))}
                    >
                      {topic.title || String(topic)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}