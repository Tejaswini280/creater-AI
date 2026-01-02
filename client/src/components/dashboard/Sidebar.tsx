import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SettingsModal from "@/components/modals/SettingsModal";
import { 
  Sparkles, 
  BarChart3, 
  Video, 
  Bot, 
  Calendar, 
  BarChart, 
  Layers,
  Youtube,
  Instagram,
  Facebook,
  Linkedin,
  Settings,
  LogOut,
  Folder
} from "lucide-react";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // Listen for logout event and navigate
  useEffect(() => {
    const handleLogout = () => {
      setLocation('/login');
    };

    window.addEventListener('auth-logout', handleLogout);
    return () => {
      window.removeEventListener('auth-logout', handleLogout);
    };
  }, [setLocation]);

  const { data: socialAccounts } = useQuery({
    queryKey: ['/api/social-accounts'],
    retry: false,
  });

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { path: "/", icon: BarChart3, label: "Dashboard", active: location === "/" },
    { path: "/content", icon: Video, label: "Content Studio" },
    { path: "/ai", icon: Bot, label: "AI Generator" },
    { path: "/scheduler", icon: Calendar, label: "Scheduler" },
    { path: "/analytics", icon: BarChart, label: "Analytics" },
    { path: "/templates", icon: Layers, label: "Templates" },
    { path: "/assets", icon: Folder, label: "Assets" },
    { path: "/gemini", icon: Sparkles, label: "Creator Studio", color: "text-purple-600" },
    { path: "/linkedin", icon: Linkedin, label: "LinkedIn", color: "text-blue-600" },
    { path: "/youtube", icon: Youtube, label: "YouTube", color: "text-red-600" },
    { path: "/docs", icon: Sparkles, label: "Docs" },
  ];

  const integrations = [
    { 
      platform: "youtube", 
      icon: Youtube, 
      label: "YouTube",
      color: "text-red-500",
      connected: Array.isArray(socialAccounts) && socialAccounts.some((acc: any) => acc.platform === 'youtube' && acc.isActive)
    },
    { 
      platform: "instagram", 
      icon: Instagram, 
      label: "Instagram",
      color: "text-pink-500",
      connected: Array.isArray(socialAccounts) && socialAccounts.some((acc: any) => acc.platform === 'instagram' && acc.isActive)
    },
    { 
      platform: "facebook", 
      icon: Facebook, 
      label: "Facebook",
      color: "text-blue-500",
      connected: Array.isArray(socialAccounts) && socialAccounts.some((acc: any) => acc.platform === 'facebook' && acc.isActive)
    },
    { 
      platform: "linkedin", 
      icon: Linkedin, 
      label: "LinkedIn",
      color: "text-blue-600",
      connected: Array.isArray(socialAccounts) && socialAccounts.some((acc: any) => acc.platform === 'linkedin' && acc.isActive)
    },
  ];

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col h-screen">
      {/* Logo Header */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            CreatorAI Studio
          </h1>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto" role="navigation" aria-label="Primary">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active || location === item.path;
          
          return (
            <Link key={item.path} href={item.path} aria-current={isActive ? 'page' : undefined}>
              <div 
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  isActive 
                    ? "bg-primary text-white" 
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon aria-hidden="true" className={`w-5 h-5 ${isActive ? '' : item.color || ''}`} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}

        {/* Integrations Section */}
        <div className="pt-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
            Integrations
          </h3>
          <div role="list" aria-label="Connected integrations" className="space-y-1">
          {integrations.map((integration) => {
            const Icon = integration.icon;
            
            return (
              <div
                key={integration.platform}
                role="listitem"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700"
              >
                <Icon aria-hidden="true" className={`w-5 h-5 ${integration.color}`} />
                <span className="flex-1">{integration.label}</span>
                <div className={`w-2 h-2 rounded-full ${
                  integration.connected ? "bg-green-400" : "bg-gray-300"
                }`} />
              </div>
            );
          })}
          </div>
        </div>
      </nav>

      {/* User Profile - Fixed at bottom */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white">
        <div className="flex items-center space-x-3 mb-3">
          {/* Profile Avatar - Updated with better fallback */}
          {user?.profileImageUrl ? (
            <img 
              src={user.profileImageUrl}
              alt="User profile"
              loading="lazy"
              decoding="async"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-gray-200">
              <span className="text-white font-semibold text-sm">
                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 
                 user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 hover:bg-gray-100 transition-all duration-200"
            onClick={() => setIsSettingsModalOpen(true)}
          >
            <Settings className="w-4 h-4 mr-1" />
            Settings
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="hover:bg-gray-100 transition-all duration-200"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}
