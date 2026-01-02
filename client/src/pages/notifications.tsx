import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Bell, Check, Trash2, Settings, AlertCircle, Info, CheckCircle, Clock } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import SettingsModal from "@/components/modals/SettingsModal";
import { useState } from "react";

interface Notification {
  id: number | string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export default function Notifications() {
  const { toast } = useToast();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isMobile = useIsMobile();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<{x:number,y:number}|null>(null);

  const { data: notifications, isLoading, error, refetch } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    retry: false,
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/notifications');
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const err: any = new Error(errData.message || 'Failed to fetch notifications');
        err.data = errData;
        throw err;
      }
      const data = await response.json();
      return data.notifications || data || [];
    }
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    }
  };

  const handleMarkAsRead = async (notificationId: number | string) => {
    try {
      await apiRequest('PUT', `/api/notifications/${notificationId}/read`);
      refetch();
      toast({
        title: "Notification marked as read",
        description: "The notification has been updated.",
      });
    } catch (error: any) {
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
        title: "Error",
        description: "Failed to mark notification as read.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (notificationId: number | string) => {
    try {
      await apiRequest('DELETE', `/api/notifications/${notificationId}`);
      refetch();
      toast({
        title: "Notification deleted",
        description: "The notification has been removed.",
      });
    } catch (error: any) {
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
        title: "Error",
        description: "Failed to delete notification.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiRequest('PUT', '/api/notifications/mark-all-read');
      refetch();
      toast({
        title: "All notifications marked as read",
        description: "Your notification list has been updated.",
      });
    } catch (error: any) {
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
        title: "Error",
        description: "Failed to mark all notifications as read.",
        variant: "destructive",
      });
    }
  };

  const displayNotifications = notifications || [];
  const unreadCount = displayNotifications.filter((n: Notification) => !n.isRead).length;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar (desktop) */}
      {!isMobile && <Sidebar />}

      {/* Mobile Sidebar Drawer */}
      {isMobile && (
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetContent side="left" className="p-0 w-[18rem]">
            <Sidebar />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        onTouchStart={(e)=>{
          if (!isMobile) return;
          const t = e.touches[0];
          setTouchStart({x:t.clientX,y:t.clientY});
        }}
        onTouchEnd={(e)=>{
          if (!isMobile) return;
          if (!touchStart) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - touchStart.x;
          const dy = Math.abs(t.clientY - touchStart.y);
          const edgeSwipe = touchStart.x < 30;
          const horizontalEnough = Math.abs(dx) > 60 && dy < 40;
          if (edgeSwipe && horizontalEnough && dx > 0) setIsMobileSidebarOpen(true);
          if (isMobileSidebarOpen && horizontalEnough && dx < -60) setIsMobileSidebarOpen(false);
          setTouchStart(null);
        }}
      >
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open navigation"
                  className="md:hidden"
                  onClick={() => setIsMobileSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
              <p className="text-gray-600">Stay updated with your latest activities and alerts.</p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {unreadCount > 0 && (
                <Button 
                  variant="outline"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center space-x-2 active:scale-[0.98] touch-manipulation"
                >
                  <Check className="h-4 w-4" />
                  <span>Mark all as read</span>
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Notifications Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
            <CardHeader className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  All Notifications
                  {unreadCount > 0 && (
                    <Badge className="ml-2 bg-blue-500 text-white">
                      {unreadCount} unread
                    </Badge>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
              <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start space-x-4 p-4">
                      <Skeleton className="w-5 h-5 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-64" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="flex space-x-2">
                        <Skeleton className="h-6 w-6" />
                        <Skeleton className="h-6 w-6" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load notifications</h3>
                  <p className="text-gray-500">Please try refreshing the page</p>
                </div>
              ) : displayNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
                  <p className="text-gray-500">
                    We'll notify you when something important happens
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {displayNotifications.map((notification: Notification) => (
                    <div
                      key={notification.id}
                      className={`p-6 hover:bg-gray-50 transition-colors ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {formatTimeAgo(notification.createdAt)}
                                </span>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDelete(notification.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
} 