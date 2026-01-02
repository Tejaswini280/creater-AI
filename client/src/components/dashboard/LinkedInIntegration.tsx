import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Linkedin, Users, FileText, Eye, ExternalLink } from "lucide-react";

export default function LinkedInIntegration() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: socialAccounts } = useQuery({
    queryKey: ['/api/social-accounts'],
    retry: false,
  });

  const { data: linkedinProfile } = useQuery({
    queryKey: ['/api/linkedin/profile'],
    retry: false,
    enabled: socialAccounts?.some((acc: any) => acc.platform === 'linkedin' && acc.isActive)
  });

  const connectLinkedInMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/linkedin/connect');
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
        description: "Failed to connect LinkedIn account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConnectLinkedIn = () => {
    setIsConnecting(true);
    connectLinkedInMutation.mutate();
  };

  const linkedinAccount = socialAccounts?.find((acc: any) => acc.platform === 'linkedin' && acc.isActive);

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-900">
          <Linkedin className="w-5 h-5 mr-2 text-blue-600" />
          LinkedIn Integration
        </CardTitle>
      </CardHeader>
      <CardContent>
        {linkedinAccount ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Linkedin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{linkedinAccount.accountName}</h4>
                  <Badge className="bg-green-100 text-green-800 text-xs">Connected</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-1" />
                View Profile
              </Button>
            </div>

            {linkedinProfile && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-white/70 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-sm font-medium text-gray-900">
                    {linkedinProfile.connections?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-gray-500">Connections</p>
                </div>
                <div className="text-center p-3 bg-white/70 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-sm font-medium text-gray-900">
                    {linkedinProfile.posts?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-gray-500">Posts</p>
                </div>
                <div className="text-center p-3 bg-white/70 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-sm font-medium text-gray-900">
                    {linkedinProfile.views?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-gray-500">Profile Views</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <Linkedin className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h4 className="font-medium text-gray-900 mb-2">Connect Your LinkedIn Profile</h4>
            <p className="text-sm text-gray-600 mb-4">
              Connect your LinkedIn profile to share content, build your network, and track professional growth.
            </p>
            <Button
              onClick={handleConnectLinkedIn}
              disabled={connectLinkedInMutation.isPending || isConnecting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {connectLinkedInMutation.isPending || isConnecting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </div>
              ) : (
                <>
                  <Linkedin className="w-4 h-4 mr-2" />
                  Connect LinkedIn
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 