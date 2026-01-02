import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Settings,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { socialAccountApi } from '@/lib/socialMediaApi';

interface SocialAccount {
  id: number;
  userId: string;
  platform: string;
  accountId: string;
  accountName: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: string;
  isActive: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

const PLATFORM_CONFIGS = {
  instagram: {
    name: 'Instagram',
    icon: '📸',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    authUrl: '/api/social-platforms/auth-url/instagram'
  },
  facebook: {
    name: 'Facebook',
    icon: '👥',
    color: 'bg-blue-600',
    authUrl: '/api/social-platforms/auth-url/facebook'
  },
  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    color: 'bg-black',
    authUrl: '/api/social-platforms/auth-url/tiktok'
  },
  youtube: {
    name: 'YouTube',
    icon: '🎬',
    color: 'bg-red-600',
    authUrl: '/api/social-platforms/auth-url/youtube'
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    color: 'bg-blue-700',
    authUrl: '/api/social-platforms/auth-url/linkedin'
  },
  twitter: {
    name: 'Twitter',
    icon: '🐦',
    color: 'bg-sky-500',
    authUrl: '/api/social-platforms/auth-url/twitter'
  }
};

export default function SocialAccountsManager() {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [showManualConnect, setShowManualConnect] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch social accounts
  const { data: accounts = [], isLoading, error } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: () => socialAccountApi.getSocialAccounts(),
  });

  // Mutations
  const connectAccountMutation = useMutation({
    mutationFn: socialAccountApi.connectSocialAccount,
    onSuccess: (newAccount) => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      setShowConnectModal(false);
      setConnectingPlatform(null);
      toast({
        title: "Account Connected",
        description: `${newAccount.accountName} has been connected successfully`,
      });
    },
    onError: (error) => {
      console.error('Error connecting account:', error);
      setConnectingPlatform(null);
      toast({
        title: "Connection Failed",
        description: "Failed to connect social account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: socialAccountApi.disconnectSocialAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      toast({
        title: "Account Disconnected",
        description: "Social account has been disconnected successfully",
      });
    },
    onError: (error) => {
      console.error('Error disconnecting account:', error);
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect social account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOAuthConnect = async (platform: string) => {
    try {
      setConnectingPlatform(platform);
      const authUrl = await socialAccountApi.getAuthUrl(platform);

      // Open OAuth popup
      const popup = window.open(
        authUrl,
        'social-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Listen for popup messages
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'OAUTH_SUCCESS') {
          popup.close();
          window.removeEventListener('message', messageListener);
          // Refresh accounts list
          queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
          setConnectingPlatform(null);
          toast({
            title: "Account Connected",
            description: "Social account connected successfully",
          });
        } else if (event.data.type === 'OAUTH_ERROR') {
          popup.close();
          window.removeEventListener('message', messageListener);
          setConnectingPlatform(null);
          toast({
            title: "Connection Failed",
            description: event.data.error || "Failed to connect account",
            variant: "destructive",
          });
        }
      };

      window.addEventListener('message', messageListener);

      // Check if popup is closed without completing auth
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setConnectingPlatform(null);
          window.removeEventListener('message', messageListener);
        }
      }, 1000);

    } catch (error) {
      console.error('Error starting OAuth:', error);
      setConnectingPlatform(null);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to start authentication",
        variant: "destructive",
      });
    }
  };

  const handleManualConnect = (formData: any) => {
    connectAccountMutation.mutate({
      platform: formData.platform,
      accountId: formData.accountId,
      accountName: formData.accountName,
      accessToken: formData.accessToken,
      refreshToken: formData.refreshToken,
      tokenExpiry: formData.tokenExpiry
    });
  };

  const getStatusIcon = (account: SocialAccount) => {
    if (!account.isActive) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }

    // Check if token is expired
    if (account.tokenExpiry && new Date(account.tokenExpiry) < new Date()) {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }

    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getStatusBadge = (account: SocialAccount) => {
    if (!account.isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }

    if (account.tokenExpiry && new Date(account.tokenExpiry) < new Date()) {
      return <Badge variant="secondary">Token Expired</Badge>;
    }

    return <Badge variant="default">Active</Badge>;
  };

  const connectedPlatforms = accounts.map(acc => acc.platform);
  const availablePlatforms = Object.keys(PLATFORM_CONFIGS).filter(
    platform => !connectedPlatforms.includes(platform)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Social Accounts</h1>
          <p className="text-gray-600">Connect and manage your social media accounts</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['social-accounts'] })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Plus className="h-4 w-4 mr-2" />
                Connect Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Connect Social Account</DialogTitle>
              </DialogHeader>

              {availablePlatforms.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    All available platforms are already connected!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availablePlatforms.map((platform) => {
                    const config = PLATFORM_CONFIGS[platform as keyof typeof PLATFORM_CONFIGS];
                    return (
                      <Button
                        key={platform}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleOAuthConnect(platform)}
                        disabled={connectingPlatform === platform}
                      >
                        {connectingPlatform === platform ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <span className="text-lg mr-2">{config.icon}</span>
                        )}
                        Connect {config.name}
                        {connectingPlatform === platform && (
                          <span className="ml-2">Connecting...</span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              )}

              <div className="border-t pt-4">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setShowManualConnect(true);
                    setShowConnectModal(false);
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manual Connection
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Accounts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
                <div className="h-4 w-4 bg-gray-300 rounded ml-auto"></div>
              </CardHeader>
              <CardContent>
                <div className="h-6 bg-gray-300 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No social accounts connected</div>
            <p className="text-gray-400 text-sm mb-6">
              Connect your social media accounts to start publishing content
            </p>
            <Button
              onClick={() => setShowConnectModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Connect Your First Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {accounts.map((account) => {
              const config = PLATFORM_CONFIGS[account.platform as keyof typeof PLATFORM_CONFIGS];
              return (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${config?.color || 'bg-gray-500'}`}>
                          <span className="text-lg">{config?.icon || '📱'}</span>
                        </div>
                        <div>
                          <CardTitle className="text-lg">{config?.name || account.platform}</CardTitle>
                          <p className="text-sm text-gray-500">@{account.accountName}</p>
                        </div>
                      </div>
                      {getStatusIcon(account)}
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        {getStatusBadge(account)}
                        <div className="text-xs text-gray-500">
                          Connected {new Date(account.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => window.open(`https://${account.platform}.com/${account.accountId}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Profile
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAccountMutation.mutate(account.id)}
                          disabled={deleteAccountMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Manual Connection Modal */}
      <Dialog open={showManualConnect} onOpenChange={setShowManualConnect}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Account Connection</DialogTitle>
          </DialogHeader>

          <ManualConnectForm
            onSubmit={handleManualConnect}
            onCancel={() => setShowManualConnect(false)}
            isLoading={connectAccountMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Manual Connect Form Component
function ManualConnectForm({
  onSubmit,
  onCancel,
  isLoading
}: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    platform: '',
    accountId: '',
    accountName: '',
    accessToken: '',
    refreshToken: '',
    tokenExpiry: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="platform">Platform</Label>
        <Select
          value={formData.platform}
          onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PLATFORM_CONFIGS).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.icon} {config.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="accountId">Account ID</Label>
        <Input
          id="accountId"
          value={formData.accountId}
          onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
          placeholder="Your account ID or username"
        />
      </div>

      <div>
        <Label htmlFor="accountName">Account Name</Label>
        <Input
          id="accountName"
          value={formData.accountName}
          onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
          placeholder="Display name for the account"
        />
      </div>

      <div>
        <Label htmlFor="accessToken">Access Token</Label>
        <Input
          id="accessToken"
          type="password"
          value={formData.accessToken}
          onChange={(e) => setFormData(prev => ({ ...prev, accessToken: e.target.value }))}
          placeholder="API access token"
        />
      </div>

      <div>
        <Label htmlFor="refreshToken">Refresh Token (Optional)</Label>
        <Input
          id="refreshToken"
          type="password"
          value={formData.refreshToken}
          onChange={(e) => setFormData(prev => ({ ...prev, refreshToken: e.target.value }))}
          placeholder="API refresh token"
        />
      </div>

      <div>
        <Label htmlFor="tokenExpiry">Token Expiry (Optional)</Label>
        <Input
          id="tokenExpiry"
          type="datetime-local"
          value={formData.tokenExpiry}
          onChange={(e) => setFormData(prev => ({ ...prev, tokenExpiry: e.target.value }))}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect Account'
          )}
        </Button>
      </div>
    </form>
  );
}
