import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Youtube, Users, Video, Eye, ExternalLink } from "lucide-react";

export default function YouTubeIntegration() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: socialAccounts } = useQuery({
    queryKey: ['/api/social-accounts'],
    retry: false,
  });

  const { data: channelStats } = useQuery({
    queryKey: ['/api/youtube/channel'],
    retry: false,
    enabled: socialAccounts?.some((acc: any) => acc.platform === 'youtube' && acc.isActive)
  });

  const connectYouTubeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/youtube/auth');
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
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
        title: "Error",
        description: "Failed to connect YouTube account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConnectYouTube = () => {
    setIsConnecting(true);
    connectYouTubeMutation.mutate();
  };

  const youtubeAccount = socialAccounts?.find((acc: any) => acc.platform === 'youtube' && acc.isActive);

  return (
    <Card className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center text-red-900">
          <Youtube aria-hidden="true" className="w-5 h-5 mr-2 text-red-600" />
          YouTube Integration
        </CardTitle>
      </CardHeader>
      <CardContent>
        {youtubeAccount ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center" aria-hidden="true">
                  <Youtube aria-hidden="true" className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{youtubeAccount.accountName}</h4>
                  <Badge className="bg-green-100 text-green-800 text-xs">Connected</Badge>
                </div>
              </div>
               <Button variant="outline" size="sm" aria-label="View connected YouTube channel in a new tab">
                 <ExternalLink aria-hidden="true" className="w-4 h-4 mr-1" />
                View Channel
              </Button>
            </div>

            {channelStats && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-white/70 rounded-lg" role="group" aria-label="Subscribers">
                  <Users aria-hidden="true" className="w-5 h-5 text-red-600 mx-auto mb-1" />
                  <p className="text-sm font-medium text-gray-900">
                    {channelStats.subscriberCount?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-gray-500">Subscribers</p>
                </div>
                <div className="text-center p-3 bg-white/70 rounded-lg" role="group" aria-label="Videos">
                  <Video aria-hidden="true" className="w-5 h-5 text-red-600 mx-auto mb-1" />
                  <p className="text-sm font-medium text-gray-900">
                    {channelStats.videoCount?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-gray-500">Videos</p>
                </div>
                <div className="text-center p-3 bg-white/70 rounded-lg" role="group" aria-label="Total views">
                  <Eye aria-hidden="true" className="w-5 h-5 text-red-600 mx-auto mb-1" />
                  <p className="text-sm font-medium text-gray-900">
                    {channelStats.viewCount?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-gray-500">Total Views</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <Youtube aria-hidden="true" className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h4 className="font-medium text-gray-900 mb-2">Connect Your YouTube Channel</h4>
            <p className="text-sm text-gray-600 mb-4">
              Connect your YouTube channel to track analytics, schedule content, and manage uploads.
            </p>
            <Button
              onClick={handleConnectYouTube}
              disabled={connectYouTubeMutation.isPending || isConnecting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {connectYouTubeMutation.isPending || isConnecting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </div>
              ) : (
                <>
                  <Youtube aria-hidden="true" className="w-4 h-4 mr-2" />
                  Connect YouTube
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}