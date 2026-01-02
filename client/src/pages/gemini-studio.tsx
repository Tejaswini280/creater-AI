import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { 
  Brain, 
  Code, 
  Video, 
  Image, 
  FileText, 
  MessageSquare,
  Search,
  Sparkles,
  Upload,
  Download,
  Copy,
  Play,
  Pause,
  Volume2,
  Eye,
  Zap,
  Target,
  TrendingUp,
  BarChart3,
  Globe,
  Mic,
  Camera,
  Film
} from "lucide-react";

export default function GeminiStudio() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState<
    "text" | "structured" | "code" | "content" | "optimize" | "analyze" | "media" | "search"
  >("text");
  
  // Text generation states
  const [textPrompt, setTextPrompt] = useState("");
  const [systemInstruction, setSystemInstruction] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(8192);

  // Structured output states
  const [structuredPrompt, setStructuredPrompt] = useState("");
  const [jsonSchema, setJsonSchema] = useState(`{
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "content": { "type": "string" },
    "tags": { "type": "array", "items": { "type": "string" } }
  }
}`);

  // Code generation states
  const [codeDescription, setCodeDescription] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [codeFramework, setCodeFramework] = useState("");

  // Content optimization states
  const [contentToOptimize, setContentToOptimize] = useState("");
  const [optimizationPlatforms, setOptimizationPlatforms] = useState<string[]>(["youtube"]);
  const [optimizationGoals, setOptimizationGoals] = useState<string[]>([]);

  // Advanced content states
  const [contentType, setContentType] = useState("script");
  const [contentTopic, setContentTopic] = useState("");
  const [contentContext, setContentContext] = useState({
    audience: "",
    tone: "",
    length: "",
    brandVoice: ""
  });
  const [contentPlatforms, setContentPlatforms] = useState<string[]>([]);

  // Document analysis states
  const [documentText, setDocumentText] = useState("");
  const [analysisType, setAnalysisType] = useState("all");

  // Search grounding states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchContext, setSearchContext] = useState("");

  // File upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileAnalysisPrompt, setFileAnalysisPrompt] = useState("");

  // Text generation mutation
  const generateTextMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/gemini/generate-text', data);
      return await response.json();
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
        description: "Failed to generate text with Gemini.",
        variant: "destructive",
      });
    },
  });

  // Structured output mutation
  const generateStructuredMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/gemini/generate-structured', data);
      return await response.json();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Generation Failed",
        description: "Failed to generate structured output.",
        variant: "destructive",
      });
    },
  });

  // Code generation mutation
  const generateCodeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/gemini/generate-code', data);
      const json = await response.json();
      return json;
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Generation Failed",
        description: "Failed to generate code.",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Code Generated!",
          description: `Successfully generated ${data.data.language} code.`,
        });
      } else {
        toast({
          title: "Generation Failed",
          description: data.message || "Failed to generate code.",
          variant: "destructive",
        });
      }
    },
  });

  // Content optimization mutation
  const optimizeContentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/gemini/optimize-content', data);
      const json = await response.json();
      return json;
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Optimization Failed",
        description: "Failed to optimize content.",
        variant: "destructive",
      });
    },
  });

  // Advanced content generation mutation
  const generateAdvancedContentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/content/generate', data);
      const json = await response.json();
      return json;
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Generation Failed",
        description: "Failed to generate advanced content.",
        variant: "destructive",
      });
    },
  });

  // Document analysis mutation
  const analyzeDocumentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/gemini/analyze-document', data);
      const json = await response.json();
      return json;
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze document.",
        variant: "destructive",
      });
    },
  });

  // File analysis mutation
  const analyzeFileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // apiRequest now supports FormData and automatically sets Authorization
      const response = await apiRequest('POST', '/api/gemini/analyze-media', data);
      return await response.json();
    },
    onError: (error) => {
      console.error('File analysis error:', error);
      
      // Check if it's an authentication error
      if (error.message.includes('Authentication required') || error.message.includes('Unauthorized')) {
        toast({
          title: "Authentication Required",
          description: "Please log in to use the media analysis feature.",
          variant: "destructive",
        });
        // Redirect to login page after a short delay
        setTimeout(() => {
          setLocation('/login');
        }, 2000);
        return;
      }
      
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze uploaded file.",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Analysis Complete!",
          description: "Media analysis completed successfully.",
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: data.message || "Failed to analyze media.",
          variant: "destructive",
        });
      }
    },
  });

  // Search grounded response mutation
  const searchGroundedMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/gemini/search-grounded', data);
      const json = await response.json();
      return json;
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Search Failed",
        description: "Failed to generate grounded response.",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Search Complete!",
          description: "Grounded response generated successfully.",
        });
      } else {
        toast({
          title: "Search Failed",
          description: data.message || "Failed to generate grounded response.",
          variant: "destructive",
        });
      }
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'audio/mp3', 'audio/wav'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Unsupported File Type",
          description: "Please upload JPG, PNG, MP4, MP3, or WAV files only.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (20MB limit)
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 20MB.",
          variant: "destructive",
        });
        return;
      }

      setUploadedFile(file);
      toast({
        title: "File Uploaded",
        description: `${file.name} is ready for analysis.`,
      });
    }
  };

  const handleFileAnalysis = () => {
    if (!uploadedFile) {
      toast({
        title: "No File Selected",
        description: "Please upload a file first.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadedFile);
    formData.append('prompt', fileAnalysisPrompt);
    
    analyzeFileMutation.mutate(formData);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard.",
    });
  };

  const handleGenerateText = () => {
    if (!textPrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a prompt for text generation.",
        variant: "destructive",
      });
      return;
    }

    generateTextMutation.mutate({
      prompt: textPrompt,
      options: {
        maxTokens,
        temperature,
        systemInstruction: systemInstruction || undefined
      }
    });
  };

  const handleGenerateStructured = () => {
    if (!structuredPrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a prompt for structured output.",
        variant: "destructive",
      });
      return;
    }

    let schema;
    try {
      schema = JSON.parse(jsonSchema);
    } catch (error) {
      toast({
        title: "Invalid Schema",
        description: "Please provide a valid JSON schema.",
        variant: "destructive",
      });
      return;
    }

    generateStructuredMutation.mutate({
      prompt: structuredPrompt,
      schema,
      systemInstruction: systemInstruction || undefined
    });
  };

  const handleGenerateCode = () => {
    if (!codeDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe what code you want to generate.",
        variant: "destructive",
      });
      return;
    }

    generateCodeMutation.mutate({
      description: codeDescription,
      language: codeLanguage,
      framework: codeFramework || undefined
    });
  };

  const handleOptimizeContent = () => {
    if (!contentToOptimize.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter content to optimize.",
        variant: "destructive",
      });
      return;
    }
    if (optimizationPlatforms.length === 0) {
      toast({
        title: "Select Platforms",
        description: "Please select at least one platform.",
        variant: "destructive",
      });
      return;
    }

    optimizeContentMutation.mutate({
      content: contentToOptimize,
      platform: optimizationPlatforms[0],
      platforms: optimizationPlatforms,
      goals: optimizationGoals
    });
  };

  const handleGenerateAdvancedContent = () => {
    if (!contentTopic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic for content generation.",
        variant: "destructive",
      });
      return;
    }

    if (!contentContext.audience.trim()) {
      toast({
        title: "Target Audience Required",
        description: "Please specify your target audience.",
        variant: "destructive",
      });
      return;
    }

    if (!contentContext.tone.trim()) {
      toast({
        title: "Tone Required",
        description: "Please select a tone for your content.",
        variant: "destructive",
      });
      return;
    }

    if (!contentContext.length.trim()) {
      toast({
        title: "Length Required",
        description: "Please select the desired content length.",
        variant: "destructive",
      });
      return;
    }

    generateAdvancedContentMutation.mutate({
      contentType: contentType,
      topic: contentTopic,
      targetAudience: contentContext.audience,
      tone: contentContext.tone,
      length: contentContext.length,
      platforms: contentPlatforms,
      brandVoice: contentContext.brandVoice || undefined
    });
  };

  const handleAnalyzeDocument = () => {
    if (!documentText.trim()) {
      toast({
        title: "Document Required",
        description: "Please enter text to analyze.",
        variant: "destructive",
      });
      return;
    }

    analyzeDocumentMutation.mutate({
      text: documentText,
      analysisType
    });
  };

  const handleSearchGrounded = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter a search query.",
        variant: "destructive",
      });
      return;
    }

    searchGroundedMutation.mutate({
      query: searchQuery,
      context: searchContext || undefined
    });
  };

  // Shared platform options for multi-select UI
  const PLATFORM_OPTIONS = [
    { value: "youtube", label: "YouTube" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "instagram", label: "Instagram" },
    { value: "tiktok", label: "TikTok" },
    { value: "twitter", label: "Twitter" },
    { value: "facebook", label: "Facebook" },
    { value: "blog", label: "Blog" },
    { value: "email", label: "Email" },
  ];

  const toggleOptimizationPlatform = (value: string) => {
    setOptimizationPlatforms((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleContentPlatform = (value: string) => {
    setContentPlatforms((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-3 py-4">
          <div className="text-sm font-semibold">Creator AI Studio</div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Sections</SidebarGroupLabel>
            <SidebarMenu>
              {[
                { key: "text", icon: <Brain className="w-4 h-4" />, label: "Text" },
                { key: "structured", icon: <Target className="w-4 h-4" />, label: "Structured" },
                { key: "code", icon: <Code className="w-4 h-4" />, label: "Code" },
                { key: "content", icon: <FileText className="w-4 h-4" />, label: "Content" },
                { key: "optimize", icon: <TrendingUp className="w-4 h-4" />, label: "Optimize" },
                { key: "analyze", icon: <BarChart3 className="w-4 h-4" />, label: "Analyze" },
                { key: "media", icon: <Film className="w-4 h-4" />, label: "Media" },
                { key: "search", icon: <Search className="w-4 h-4" />, label: "Search" },
              ].map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton isActive={activeSection === (item.key as any)} onClick={() => setActiveSection(item.key as any)}>
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
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 text-center w-full">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-800 bg-clip-text text-transparent">
                  Creator AI Studio
                </h1>
                <p className="text-gray-600 text-lg">Advanced AI capabilities powered by Creator AI</p>
                <div className="flex justify-center space-x-2">
                  <Badge className="bg-purple-100 text-purple-800">2M Context Window</Badge>
                  <Badge className="bg-blue-100 text-blue-800">Multimodal</Badge>
                  <Badge className="bg-indigo-100 text-indigo-800">Structured Output</Badge>
                </div>
              </div>
              <div className="absolute left-4 top-6">
                <SidebarTrigger />
              </div>
            </div>

            <AnimatePresence mode="wait">

              {activeSection === "text" && (
                <motion.div key="text" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-6">
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-900">
                <Brain className="w-5 h-5 mr-2 text-purple-600" />
                Advanced Text Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">System Instruction (Optional)</label>
                <Input
                  placeholder="You are an expert content creator..."
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Prompt</label>
                <Textarea
                  placeholder="Write a compelling script about sustainable technology..."
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  rows={6}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Temperature: {temperature}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Max Tokens</label>
                  <Select value={maxTokens.toString()} onValueChange={(value) => setMaxTokens(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1024">1,024</SelectItem>
                      <SelectItem value="2048">2,048</SelectItem>
                      <SelectItem value="4096">4,096</SelectItem>
                      <SelectItem value="8192">8,192</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerateText}
                disabled={generateTextMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {generateTextMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Text</span>
                  </div>
                )}
              </Button>

              {(() => {
                const rawResult = generateTextMutation.data?.result as unknown as
                  | string
                  | { content?: string } 
                  | undefined;
                const generatedText =
                  typeof rawResult === "string"
                    ? rawResult
                    : rawResult?.content ?? "";
                return generatedText ? (
                  <div className="bg-white p-4 rounded-lg border border-purple-200">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900">Generated Text</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generatedText)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{generatedText}</p>
                  </div>
                ) : null;
              })()}
            </CardContent>
          </Card>
                </motion.div>
              )}

              {activeSection === "structured" && (
                <motion.div key="structured" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-900">
                <Target className="w-5 h-5 mr-2 text-blue-600" />
                Structured JSON Output
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Prompt</label>
                <Textarea
                  placeholder="Generate a social media content plan for a tech startup..."
                  value={structuredPrompt}
                  onChange={(e) => setStructuredPrompt(e.target.value)}
                  rows={4}
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">JSON Schema</label>
                <Textarea
                  value={jsonSchema}
                  onChange={(e) => setJsonSchema(e.target.value)}
                  rows={8}
                  className="font-mono text-sm border-blue-200 focus:border-blue-400"
                />
              </div>

              <Button
                onClick={handleGenerateStructured}
                disabled={generateStructuredMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {generateStructuredMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>Generate Structured Output</span>
                  </div>
                )}
              </Button>

              {generateStructuredMutation.data && (
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-900">Structured Output</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(JSON.stringify(generateStructuredMutation.data.result, null, 2))}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy JSON
                    </Button>
                  </div>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded">
                    {JSON.stringify(generateStructuredMutation.data.result, null, 2)}
                  </pre>
                </div>
              )}
              </CardContent>
            </Card>
                </motion.div>
              )}

              {activeSection === "code" && (
                <motion.div key="code" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center text-green-900">
                <Code className="w-5 h-5 mr-2 text-green-600" />
                Advanced Code Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Code Description</label>
                <Textarea
                  placeholder="Create a React component for a social media post with likes, comments, and sharing functionality..."
                  value={codeDescription}
                  onChange={(e) => setCodeDescription(e.target.value)}
                  rows={4}
                  className="border-green-200 focus:border-green-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Language</label>
                  <Select value={codeLanguage} onValueChange={setCodeLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                      <SelectItem value="go">Go</SelectItem>
                      <SelectItem value="rust">Rust</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Framework (Optional)</label>
                  <Input
                    placeholder="React, Next.js, Express, etc."
                    value={codeFramework}
                    onChange={(e) => setCodeFramework(e.target.value)}
                    className="border-green-200 focus:border-green-400"
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerateCode}
                disabled={generateCodeMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {generateCodeMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Code className="w-4 h-4" />
                    <span>Generate Code</span>
                  </div>
                )}
              </Button>

              {generateCodeMutation.data && generateCodeMutation.data.success && (
                <div className="space-y-4">
                  {generateCodeMutation.data.data?.notice && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-800">{generateCodeMutation.data.data.notice}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">Generated Code</h4>
                        {generateCodeMutation.data.data?.isAIGenerated === false && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">Template</Badge>
                        )}
                        {generateCodeMutation.data.data?.isAIGenerated === true && (
                          <Badge className="bg-green-100 text-green-800 text-xs">AI Generated</Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generateCodeMutation.data.data?.code || '')}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded overflow-x-auto">
                      {generateCodeMutation.data.data?.code}
                    </pre>
                  </div>

                  {generateCodeMutation.data.data?.explanation && (
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <h4 className="font-medium text-gray-900 mb-2">Explanation</h4>
                      <p className="text-gray-700">{generateCodeMutation.data.data.explanation}</p>
                    </div>
                  )}

                  {generateCodeMutation.data.data?.dependencies?.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <h4 className="font-medium text-gray-900 mb-2">Dependencies</h4>
                      <div className="flex flex-wrap gap-2">
                        {generateCodeMutation.data.data.dependencies.map((dep: string, index: number) => (
                          <Badge key={index} className="bg-green-100 text-green-800">{dep}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {generateCodeMutation.data.data?.usage && (
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <h4 className="font-medium text-gray-900 mb-2">Usage Instructions</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{generateCodeMutation.data.data.usage}</p>
                    </div>
                  )}

                  {generateCodeMutation.data.metadata && (
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <h4 className="font-medium text-gray-900 mb-2">Generation Info</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Model: {generateCodeMutation.data.metadata.model}</div>
                        <div>Language: {generateCodeMutation.data.data.language}</div>
                        {generateCodeMutation.data.data.framework && (
                          <div>Framework: {generateCodeMutation.data.data.framework}</div>
                        )}
                        <div>Generated: {new Date(generateCodeMutation.data.metadata.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
                </motion.div>
              )}

              {activeSection === "content" && (
                <motion.div key="content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-6">
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center text-indigo-900">
                <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                Advanced Content Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Content Type</label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="script">Video Script</SelectItem>
                    <SelectItem value="blog">Blog Post</SelectItem>
                    <SelectItem value="social">Social Media Post</SelectItem>
                    <SelectItem value="email">Email Newsletter</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Topic</label>
                <Input
                  placeholder="The future of artificial intelligence in content creation..."
                  value={contentTopic}
                  onChange={(e) => setContentTopic(e.target.value)}
                  className="border-indigo-200 focus:border-indigo-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Target Audience</label>
                  <Input
                    placeholder="Tech enthusiasts, content creators..."
                    value={contentContext.audience}
                    onChange={(e) => setContentContext({...contentContext, audience: e.target.value})}
                    className="border-indigo-200 focus:border-indigo-400"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tone</label>
                  <Select value={contentContext.tone} onValueChange={(value) => setContentContext({...contentContext, tone: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="authoritative">Authoritative</SelectItem>
                      <SelectItem value="humorous">Humorous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Length</label>
                  <Select value={contentContext.length} onValueChange={(value) => setContentContext({...contentContext, length: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (1-2 min)</SelectItem>
                      <SelectItem value="medium">Medium (3-5 min)</SelectItem>
                      <SelectItem value="long">Long (5-10 min)</SelectItem>
                      <SelectItem value="detailed">Detailed (10+ min)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Platforms</label>
                  <div className="flex flex-wrap gap-3">
                    {PLATFORM_OPTIONS.map((p) => (
                      <label key={p.value} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={contentPlatforms.includes(p.value)}
                          onCheckedChange={() => toggleContentPlatform(p.value)}
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Brand Voice (Optional)</label>
                <Textarea
                  placeholder="Describe your brand's unique voice and style..."
                  value={contentContext.brandVoice}
                  onChange={(e) => setContentContext({...contentContext, brandVoice: e.target.value})}
                  rows={3}
                  className="border-indigo-200 focus:border-indigo-400"
                />
              </div>

              <Button
                onClick={handleGenerateAdvancedContent}
                disabled={generateAdvancedContentMutation.isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {generateAdvancedContentMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Generate Content</span>
                  </div>
                )}
              </Button>

              {generateAdvancedContentMutation.data && generateAdvancedContentMutation.data.success && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-indigo-200">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900">Generated Content</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generateAdvancedContentMutation.data.content || '')}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <div className="prose max-w-none">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded overflow-x-auto">
                        {generateAdvancedContentMutation.data.content}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
                </motion.div>
              )}

              {activeSection === "optimize" && (
                <motion.div key="optimize" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-6">
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center text-emerald-900">
                <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" />
                Content Optimization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Content to Optimize</label>
                <Textarea
                  placeholder="Paste your content here for optimization..."
                  value={contentToOptimize}
                  onChange={(e) => setContentToOptimize(e.target.value)}
                  rows={6}
                  className="border-emerald-200 focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Platforms</label>
                  <div className="flex flex-wrap gap-3">
                    {PLATFORM_OPTIONS.map((p) => (
                      <label key={p.value} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={optimizationPlatforms.includes(p.value)}
                          onCheckedChange={() => toggleOptimizationPlatform(p.value)}
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Optimization Goals</label>
                  <div className="space-y-2">
                    {['engagement', 'reach', 'conversion', 'seo', 'clarity'].map((goal) => (
                      <div key={goal} className="flex items-center space-x-2">
                        <Checkbox
                          id={goal}
                          checked={optimizationGoals.includes(goal)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setOptimizationGoals([...optimizationGoals, goal]);
                            } else {
                              setOptimizationGoals(optimizationGoals.filter(g => g !== goal));
                            }
                          }}
                        />
                        <label htmlFor={goal} className="text-sm text-gray-700 capitalize">
                          {goal}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleOptimizeContent}
                disabled={optimizeContentMutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {optimizeContentMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Optimizing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Optimize Content</span>
                  </div>
                )}
              </Button>

              {optimizeContentMutation.data && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-emerald-200">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900">Optimized Content</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(optimizeContentMutation.data.result.optimizedContent)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <div className="prose max-w-none">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded overflow-x-auto">
                        {optimizeContentMutation.data.result.optimizedContent}
                      </pre>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-emerald-200">
                    <h4 className="font-medium text-gray-900 mb-2">Improvements Made</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {optimizeContentMutation.data.result.improvements.map((improvement: string, index: number) => (
                        <li key={index} className="text-sm text-gray-600">{improvement}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-emerald-200">
                    <h4 className="font-medium text-gray-900 mb-2">SEO Suggestions</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {optimizeContentMutation.data.result.seoSuggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="text-sm text-gray-600">{suggestion}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-emerald-200">
                    <h4 className="font-medium text-gray-900 mb-2">Engagement Elements</h4>
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium text-gray-800 mb-2">Hooks</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {optimizeContentMutation.data.result.engagement.hooks.map((hook: string, index: number) => (
                            <li key={index} className="text-sm text-gray-600">{hook}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-800 mb-2">Call to Actions</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {optimizeContentMutation.data.result.engagement.callToActions.map((cta: string, index: number) => (
                            <li key={index} className="text-sm text-gray-600">{cta}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-800 mb-2">Hashtags</h5>
                        <div className="flex flex-wrap gap-2">
                          {optimizeContentMutation.data.result.engagement.hashtags.map((hashtag: string, index: number) => (
                            <Badge key={index} className="bg-emerald-100 text-emerald-800">{hashtag}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
                </motion.div>
              )}

              {activeSection === "analyze" && (
                <motion.div key="analyze" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-6">
          <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200">
            <CardHeader>
              <CardTitle className="flex items-center text-cyan-900">
                <BarChart3 className="w-5 h-5 mr-2 text-cyan-600" />
                Document Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Document Text</label>
                <Textarea
                  placeholder="Paste your document content here for analysis..."
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  rows={8}
                  className="border-cyan-200 focus:border-cyan-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Analysis Type</label>
                <Select value={analysisType} onValueChange={setAnalysisType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Comprehensive Analysis</SelectItem>
                    <SelectItem value="sentiment">Sentiment Analysis</SelectItem>
                    <SelectItem value="topics">Topic Extraction</SelectItem>
                    <SelectItem value="summary">Summary Generation</SelectItem>
                    <SelectItem value="keywords">Keyword Analysis</SelectItem>
                    <SelectItem value="readability">Readability Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAnalyzeDocument}
                disabled={analyzeDocumentMutation.isPending}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {analyzeDocumentMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Analyze Document</span>
                  </div>
                )}
              </Button>

              {analyzeDocumentMutation.data && (
                <div className="space-y-4">
                  {analyzeDocumentMutation.data.result.summary && (
                    <div className="bg-white p-4 rounded-lg border border-cyan-200">
                      <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                      <p className="text-gray-700">{analyzeDocumentMutation.data.result.summary}</p>
                    </div>
                  )}

                  {analyzeDocumentMutation.data.result.sentiment && (
                    <div className="bg-white p-4 rounded-lg border border-cyan-200">
                      <h4 className="font-medium text-gray-900 mb-2">Sentiment Analysis</h4>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${
                          analyzeDocumentMutation.data.result.sentiment.score > 0.3 
                            ? 'bg-green-100 text-green-800' 
                            : analyzeDocumentMutation.data.result.sentiment.score < -0.3 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {analyzeDocumentMutation.data.result.sentiment.label}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          Score: {analyzeDocumentMutation.data.result.sentiment.score.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {analyzeDocumentMutation.data.result.topics?.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-cyan-200">
                      <h4 className="font-medium text-gray-900 mb-2">Key Topics</h4>
                      <div className="flex flex-wrap gap-2">
                        {analyzeDocumentMutation.data.result.topics.map((topic: string, index: number) => (
                          <Badge key={index} className="bg-cyan-100 text-cyan-800">{topic}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {analyzeDocumentMutation.data.result.keywords?.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-cyan-200">
                      <h4 className="font-medium text-gray-900 mb-2">Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {analyzeDocumentMutation.data.result.keywords.map((keyword: { word: string; score: number }, index: number) => (
                          <Badge key={index} className="bg-blue-100 text-blue-800">
                            {keyword.word} ({keyword.score.toFixed(2)})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {analyzeDocumentMutation.data.result.readability && (
                    <div className="bg-white p-4 rounded-lg border border-cyan-200">
                      <h4 className="font-medium text-gray-900 mb-2">Readability Analysis</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Flesch Reading Ease:</span>
                          <span className="ml-2">{analyzeDocumentMutation.data.result.readability.fleschReadingEase.toFixed(1)}</span>
                        </div>
                        <div>
                          <span className="font-medium">Grade Level:</span>
                          <span className="ml-2">{analyzeDocumentMutation.data.result.readability.gradeLevel}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {analyzeDocumentMutation.data.result.insights?.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-cyan-200">
                      <h4 className="font-medium text-gray-900 mb-2">Insights</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {analyzeDocumentMutation.data.result.insights.map((insight: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600">{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
                </motion.div>
              )}

              {activeSection === "media" && (
                <motion.div key="media" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-6">
          <Card className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center text-red-900">
                <Film className="w-5 h-5 mr-2 text-red-600" />
                Multimodal AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Upload Media File</label>
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-100"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                  {uploadedFile && (
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-red-100 text-red-800">{uploadedFile.name}</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setUploadedFile(null)}
                      >
                        ×
                      </Button>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,video/mp4,audio/mp3,audio/wav"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <p className="text-xs text-gray-500">
                  Supports images (JPG, PNG), videos (MP4), and audio (MP3, WAV). Max size: 20MB
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Analysis Prompt (Optional)</label>
                <Textarea
                  placeholder="Analyze this media for content creation opportunities..."
                  value={fileAnalysisPrompt}
                  onChange={(e) => setFileAnalysisPrompt(e.target.value)}
                  rows={3}
                  className="border-red-200 focus:border-red-400"
                />
              </div>

              <Button
                onClick={handleFileAnalysis}
                disabled={analyzeFileMutation.isPending || !uploadedFile}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {analyzeFileMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>Analyze Media</span>
                  </div>
                )}
              </Button>

              {analyzeFileMutation.data && analyzeFileMutation.data.success && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-red-200">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900">Summary</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(analyzeFileMutation.data.summary)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-gray-700">{analyzeFileMutation.data.summary}</p>
                  </div>

                  {analyzeFileMutation.data.insights?.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-red-200">
                      <h4 className="font-medium text-gray-900 mb-2">Key Insights</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {analyzeFileMutation.data.insights.map((insight: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600">{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analyzeFileMutation.data.opportunities?.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-red-200">
                      <h4 className="font-medium text-gray-900 mb-2">Content Opportunities</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {analyzeFileMutation.data.opportunities.map((opportunity: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600">{opportunity}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analyzeFileMutation.data.recommendations?.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-red-200">
                      <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {analyzeFileMutation.data.recommendations.map((recommendation: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600">{recommendation}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {analyzeFileMutation.data && !analyzeFileMutation.data.success && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{analyzeFileMutation.data.message || 'Analysis failed'}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
                </motion.div>
              )}

              {activeSection === "search" && (
                <motion.div key="search" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-6">
          <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-900">
                <Search className="w-5 h-5 mr-2 text-orange-600" />
                Search Grounded Responses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Search Query</label>
                <Input
                  placeholder="What are the latest trends in AI video generation?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Context (Optional)</label>
                <Textarea
                  placeholder="I'm a content creator looking to understand emerging technologies..."
                  value={searchContext}
                  onChange={(e) => setSearchContext(e.target.value)}
                  rows={3}
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>

              <Button
                onClick={handleSearchGrounded}
                disabled={searchGroundedMutation.isPending}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                {searchGroundedMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Searching...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>Search & Generate</span>
                  </div>
                )}
              </Button>

              {searchGroundedMutation.data && searchGroundedMutation.data.success && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-orange-200">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900">Summary</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(searchGroundedMutation.data.summary)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-gray-700">{searchGroundedMutation.data.summary}</p>
                  </div>

                  {searchGroundedMutation.data.keyPoints?.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-orange-200">
                      <h4 className="font-medium text-gray-900 mb-2">Key Findings</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {searchGroundedMutation.data.keyPoints.map((point: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600">{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {searchGroundedMutation.data.creatorInsights?.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-orange-200">
                      <h4 className="font-medium text-gray-900 mb-2">Creator Insights</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {searchGroundedMutation.data.creatorInsights.map((insight: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600">{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {searchGroundedMutation.data.disclaimer && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-orange-800">{searchGroundedMutation.data.disclaimer}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {searchGroundedMutation.data && !searchGroundedMutation.data.success && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{searchGroundedMutation.data.message || 'Search failed'}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}