import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Video, Mic, Palette, TrendingUp, Plus, Folder } from "lucide-react";
import QuickActionsModal from "@/components/modals/QuickActionsModal";
import QuickProjectCreationModal from "@/components/modals/QuickProjectCreationModal";
import { useLocation } from "wouter";

export default function QuickActions() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickProjectModalOpen, setIsQuickProjectModalOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<'newProject' | 'createVideo' | 'aiVoiceover' | 'brandKit' | 'nicheFinder' | null>(null);
  const [, setLocation] = useLocation();
  
  const quickActions = [
    {
      title: "New Project",
      description: "Create enhanced social media project",
      icon: Folder,
      gradient: "from-green-500 to-emerald-600",
      action: "newProject"
    },
    {
      title: "Create Video",
      description: "Generate AI-powered video content",
      icon: Video,
      gradient: "from-blue-500 to-purple-600",
      action: "createVideo"
    },
    {
      title: "AI Voiceover", 
      description: "Generate professional voiceovers",
      icon: Mic,
      gradient: "from-green-500 to-teal-600",
      action: "aiVoiceover"
    },
    {
      title: "Brand Kit",
      description: "Access templates and assets", 
      icon: Palette,
      gradient: "from-orange-500 to-pink-600",
      action: "brandKit"
    },
    {
      title: "Niche Finder",
      description: "Discover profitable niches",
      icon: TrendingUp, 
      gradient: "from-purple-500 to-indigo-600",
      action: "nicheFinder"
    },
    {
      title: "Trend Analysis",
      description: "Real-time social media trends",
      icon: TrendingUp,
      gradient: "from-red-500 to-pink-600",
      action: "trendAnalysis"
    }
  ];

  const handleQuickAction = (action: string) => {
    if (action === 'newProject') {
      // Navigate to the full Project Wizard instead of opening modal
      setLocation('/project-wizard');
      return;
    }
    
    if (action === 'trendAnalysis') {
      setLocation('/trend-analysis');
      return;
    }
    
    const actionType = action as 'createVideo' | 'aiVoiceover' | 'brandKit' | 'nicheFinder';
    setActiveAction(actionType);
    setIsModalOpen(true);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {quickActions.map((action) => {
        const Icon = action.icon;
        
        return (
          <Tooltip key={action.action}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 group h-auto"
                onClick={() => handleQuickAction(action.action)}
                aria-label={`${action.title} – ${action.description}`}
              >
                <div className="text-center w-full">
                  <div className={`w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{action.description}</TooltipContent>
          </Tooltip>
        );
      })}
      
      {/* Quick Actions Modal */}
      <QuickActionsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setActiveAction(null);
        }}
        actionType={activeAction}
      />

      {/* Quick Project Creation Modal */}
      <QuickProjectCreationModal
        isOpen={isQuickProjectModalOpen}
        onClose={() => setIsQuickProjectModalOpen(false)}
      />
    </div>
  );
}
