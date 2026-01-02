import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Bot, Sparkles, FileText, TrendingUp, Lightbulb } from "lucide-react";
import AIGenerationModal from "@/components/modals/AIGenerationModal";

export default function AIAssistant() {
  const { toast } = useToast();
  const [selectedIdea, setSelectedIdea] = useState<string | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [modalTopic, setModalTopic] = useState('');

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['/api/trends/topics', { category: '', region: 'US' }],
    queryFn: async () => {
      const params = new URLSearchParams({ region: 'US' });
      const resp = await apiRequest('GET', `/api/trends/topics?${params.toString()}`);
      return await resp.json();
    },
    retry: true,
    refetchInterval: 1000 * 60 * 5,
  });

  const generateScriptMutation = useMutation({
    mutationFn: async (topic: string) => {
      const response = await apiRequest('POST', '/api/ai/generate-script', {
        topic,
        platform: 'youtube',
        duration: '60 seconds'
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Script Generated!",
        description: "Your AI-generated script is ready.",
      });
      // Could open a modal or navigate to script editor
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to generate script. Please try again.",
        variant: "destructive",
      });
    },
  });

  const contentIdeasMutation = useMutation({
    mutationFn: async (niche: string) => {
      const response = await apiRequest('POST', '/api/ai/content-ideas', {
        niche,
        platform: 'youtube'
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Content Ideas Generated!",
        description: `Generated ${data.ideas?.length || 0} new content ideas.`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to generate content ideas.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateScript = (topic: string) => {
    setSelectedIdea(topic);
    setModalTopic(topic);
    setIsAIModalOpen(true);
  };

  const trendingTopics = trends?.slice(0, 3) || [];

  const [ideasNiche, setIdeasNiche] = useState<string>('AI content');

  useEffect(() => {
    if (Array.isArray(trends) && trends.length > 0) {
      const top = trends[0];
      const title = top?.title || top?.name;
      if (title) setIdeasNiche(title);
    }
  }, [trends]);

  const { data: ideas = [], isLoading: ideasLoading } = useQuery({
    queryKey: ['/api/ai/content-ideas', { niche: ideasNiche, platform: 'youtube', count: 5 }],
    queryFn: async () => {
      const resp = await apiRequest('POST', '/api/ai/content-ideas', {
        niche: ideasNiche,
        platform: 'youtube',
        count: 5,
      });
      const json = await resp.json();
      return json?.ideas || [];
    },
    enabled: Boolean(ideasNiche),
    refetchInterval: 1000 * 60 * 10,
  });

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 h-[520px] overflow-hidden">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex items-center space-x-3 mb-4 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center" aria-hidden="true">
            <Bot aria-hidden="true" className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
        </div>
        
        <div className="flex-1 min-h-0 space-y-4 overflow-y-auto pr-1">
          {/* Trending Topics */}
          <div className="bg-white/70 backdrop-blur rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <TrendingUp aria-hidden="true" className="w-4 h-4 mr-2" />
              Trending Topics
            </h4>
            <div className="space-y-2">
              {trendsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                ))
              ) : trendingTopics.length > 0 ? (
                trendingTopics.map((topic: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 truncate flex-1 mr-2">
                      {topic.title || topic.name || `Trending Topic ${index + 1}`}
                    </span>
                    <Badge className="text-xs bg-green-100 text-green-800">
                      Hot
                    </Badge>
                  </div>
                ))
              ) : null}
            </div>
          </div>

          {/* Content Ideas */}
          <div className="bg-white/70 backdrop-blur rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <Lightbulb aria-hidden="true" className="w-4 h-4 mr-2" />
              Content Ideas
            </h4>
            <div className="space-y-2">
              {ideasLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-64" />
                  </div>
                ))
              ) : ideas.length > 0 ? (
                ideas.map((idea: string, index: number) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full text-left p-2 hover:bg-white/50 rounded text-sm text-gray-700 transition-colors justify-start h-auto items-start gap-2"
                    onClick={() => handleGenerateScript(idea)}
                    disabled={generateScriptMutation.isPending && selectedIdea === idea}
                  >
                    <span className="mt-0.5">💡</span>
                    {generateScriptMutation.isPending && selectedIdea === idea ? (
                      <span className="flex items-center flex-1 min-w-0 break-words whitespace-normal text-left">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600 mr-2"></div>
                        Generating...
                      </span>
                    ) : (
                      <span className="flex-1 min-w-0 break-words whitespace-normal text-left leading-snug">"{idea}"</span>
                    )}
                  </Button>
                ))
              ) : (
                <span className="text-sm text-gray-500">No ideas available. Try again later.</span>
              )}
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mt-4 pt-3 border-t border-purple-100 shrink-0">
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105"
              onClick={() => {
                setModalTopic('');
                setIsAIModalOpen(true);
              }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Content
            </Button>
            <Button 
              variant="secondary"
              className="w-full bg-white/70 backdrop-blur text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-white/90 transition-colors"
              onClick={() => {
                setModalTopic('');
                setIsAIModalOpen(true);
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Script Generator
            </Button>
        </div>
      </CardContent>
      
      {/* AI Generation Modal */}
      <AIGenerationModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        initialTopic={modalTopic}
      />
    </Card>
  );
}
