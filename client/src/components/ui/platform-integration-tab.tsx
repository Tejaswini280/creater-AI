import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link,
  Unlink,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Settings,
  Key,
  Shield,
  Zap,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Trash2
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';

interface PlatformAccount {
  id: string;
  platform: string;
  accountId: string;
  accountName: string;
  accountHandle: string;
  profilePicture?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: string;
  isActive: boolean;
  permissions: string[];
  followerCount?: number;
  engagementRate?: number;
  lastSync?: string;
  metadata?: Record<string, any>;
}

interface PlatformConfig {
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  gradient: string;
  authUrl: string;
  scopes: string[];
  rateLimits: {
    requests: number;
    window: number; // minutes
  };
  features: string[];
}

const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'text-pink-600',
    gradient: 'bg-gradient-to-r from-purple-500 to-pink-500',
    authUrl: '/api/social-platforms/auth-url/instagram',
    scopes: ['user_profile', 'user_media', 'instagram_basic', 'instagram_content_publish'],
    rateLimits: { requests: 200, window: 60 },
    features: ['Posts', 'Stories', 'Reels', 'Insights', 'Comments']
  },
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'text-blue-600',
    gradient: 'bg-blue-600',
    authUrl: '/api/social-platforms/auth-url/facebook',
    scopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list', 'publish_to_groups'],
    rateLimits: { requests: 200, window: 60 },
    features: ['Posts', 'Pages', 'Groups', 'Events', 'Insights']
  },
  youtube: {
    name: 'YouTube',
    icon: Youtube,
    color: 'text-red-600',
    gradient: 'bg-red-600',
    authUrl: '/api/social-platforms/auth-url/youtube',
    scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'],
    rateLimits: { requests: 10000, window: 1440 },
    features: ['Videos', 'Shorts', 'Live Streams', 'Analytics', 'Comments']
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'text-blue-700',
    gradient: 'bg-blue-700',
    authUrl: '/api/social-platforms/auth-url/linkedin',
    scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social', 'rw_organization_admin'],
    rateLimits: { requests: 100, window: 60 },
    features: ['Posts', 'Articles', 'Company Pages', 'Analytics', 'Messaging']
  },
  twitter: {
    name: 'Twitter',
    icon: Twitter,
    color: 'text-sky-500',
    gradient: 'bg-sky-500',
    authUrl: '/api/social-platforms/auth-url/twitter',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    rateLimits: { requests: 300, window: 15 },
    features: ['Tweets', 'Threads', 'Spaces', 'Analytics', 'DMs']
  },
  tiktok: {
    name: 'TikTok',
    icon: () => <span className="text-2xl">🎵</span>,
    color: 'text-black',
    gradient: 'bg-black',
    authUrl: '/api/social-platforms/auth-url/tiktok',
    scopes: ['user.info.basic', 'video.publish', 'video.upload'],
    rateLimits: { requests: 1000, window: 60 },
    features: ['Videos', 'Live', 'Stories', 'Analytics', 'Comments']
  }
};

interface PlatformIntegrationTabProps {
  projectId?: string;
  onIntegrationUpdate?: (integrations: Record<string, any>) => void;
}

export default function PlatformIntegrationTab({ projectId, onIntegrationUpdate }: PlatformIntegrationTabProps) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [showManualConnect, setShowManualConnect] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load connected accounts
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/social-platforms/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthConnect = async (platform: string) => {
    try {
      setConnectingPlatform(platform);
      const config = PLATFORM_CONFIGS[platform];

      // Get OAuth URL
      const response = await fetch(config.authUrl);
      if (!response.ok) throw new Error('Failed to get auth URL');

      const { authUrl } = await response.json();

      // Open OAuth popup
      const popup = window.open(
        authUrl,
        'social-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Listen for OAuth callback
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'OAUTH_SUCCESS') {
          popup.close();
          window.removeEventListener('message', messageListener);
          handleOAuthSuccess(event.data.account, platform);
        } else if (event.data.type === 'OAUTH_ERROR') {
          popup.close();
          window.removeEventListener('message', messageListener);
          handleOAuthError(event.data.error);
        }
      };

      window.addEventListener('message', messageListener);

      // Timeout
      setTimeout(() => {
        if (!popup.closed) {
          popup.close();
          setConnectingPlatform(null);
          window.removeEventListener('message', messageListener);
          toast({
            title: "Connection Timeout",
            description: "The authentication process timed out. Please try again.",
            variant: "destructive",
          });
        }
      }, 300000); // 5 minutes

    } catch (error) {
      console.error('OAuth connection failed:', error);
      setConnectingPlatform(null);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to start authentication",
        variant: "destructive",
      });
    }
  };

  const handleOAuthSuccess = async (accountData: any, platform: string) => {
    try {
      const newAccount: PlatformAccount = {
        id: `${platform}_${Date.now()}`,
        platform,
        accountId: accountData.id,
        accountName: accountData.name,
        accountHandle: accountData.handle || accountData.username,
        profilePicture: accountData.profilePicture,
        accessToken: accountData.accessToken,
        refreshToken: accountData.refreshToken,
        tokenExpiry: accountData.tokenExpiry,
        isActive: true,
        permissions: accountData.permissions || [],
        followerCount: accountData.followerCount,
        engagementRate: accountData.engagementRate,
        lastSync: new Date().toISOString(),
        metadata: accountData.metadata || {}
      };

      // Save to backend
      const response = await fetch('/api/social-platforms/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount)
      });

      if (!response.ok) throw new Error('Failed to save account');

      setAccounts(prev => [...prev, newAccount]);
      setConnectingPlatform(null);

      toast({
        title: "Account Connected! 🎉",
        description: `${newAccount.accountName} has been successfully connected to ${PLATFORM_CONFIGS[platform].name}`,
      });

      onIntegrationUpdate?.({ [platform]: { connected: true, account: newAccount } });

    } catch (error) {
      console.error('Failed to save account:', error);
      toast({
        title: "Connection Failed",
        description: "Account connected but failed to save. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOAuthError = (error: string) => {
    setConnectingPlatform(null);
    toast({
      title: "Authentication Failed",
      description: error || "Failed to authenticate with the platform",
      variant: "destructive",
    });
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      const response = await fetch(`/api/social-platforms/accounts/${accountId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to disconnect account');

      setAccounts(prev => prev.filter(acc => acc.id !== accountId));

      const account = accounts.find(acc => acc.id === accountId);
      if (account) {
        toast({
          title: "Account Disconnected",
          description: `${account.accountName} has been disconnected from ${PLATFORM_CONFIGS[account.platform].name}`,
        });

        onIntegrationUpdate?.({ [account.platform]: { connected: false } });
      }

    } catch (error) {
      console.error('Failed to disconnect account:', error);
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSync = async (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;

    setSyncProgress(prev => ({ ...prev, [accountId]: 0 }));

    try {
      // Simulate sync progress
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => {
          const current = prev[accountId] || 0;
          if (current >= 100) {
            clearInterval(progressInterval);
            return { ...prev, [accountId]: 100 };
          }
          return { ...prev, [accountId]: current + 10 };
        });
      }, 200);

      // Perform actual sync
      const response = await fetch(`/api/social-platforms/sync/${accountId}`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Sync failed');

      const syncData = await response.json();

      // Update account with fresh data
      setAccounts(prev => prev.map(acc =>
        acc.id === accountId
          ? {
              ...acc,
              followerCount: syncData.followerCount,
              engagementRate: syncData.engagementRate,
              lastSync: new Date().toISOString()
            }
          : acc
      ));

      setTimeout(() => {
        setSyncProgress(prev => ({ ...prev, [accountId]: undefined }));
      }, 1000);

      toast({
        title: "Sync Complete",
        description: `${account.accountName} data has been synchronized`,
      });

    } catch (error) {
      console.error('Sync failed:', error);
      setSyncProgress(prev => ({ ...prev, [accountId]: undefined }));
      toast({
        title: "Sync Failed",
        description: "Failed to synchronize account data",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (account: PlatformAccount) => {
    if (!account.isActive) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Inactive
      </Badge>;
    }

    if (account.tokenExpiry && new Date(account.tokenExpiry) < new Date()) {
      return <Badge variant="secondary" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Token Expired
      </Badge>;
    }

    return <Badge variant="default" className="flex items-center gap-1">
      <CheckCircle className="h-3 w-3" />
      Active
    </Badge>;
  };

  const getConnectedPlatforms = () => accounts.map(acc => acc.platform);
  const getAvailablePlatforms = () => Object.keys(PLATFORM_CONFIGS).filter(
    platform => !getConnectedPlatforms().includes(platform)
  );

  const PlatformCard = ({ platform, account }: { platform: string; account?: PlatformAccount }) => {
    const config = PLATFORM_CONFIGS[platform];
    const Icon = config.icon;
    const isConnecting = connectingPlatform === platform;
    const syncProgressValue = account ? syncProgress[account.id] : undefined;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-xl ${config.gradient} flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{config.name}</h3>
                  {account && (
                    <p className="text-sm text-gray-600">@{account.accountHandle}</p>
                  )}
                </div>
              </div>

              {account && getStatusBadge(account)}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {account ? (
              <>
                {/* Account Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Followers</span>
                    <div className="font-semibold">{account.followerCount?.toLocaleString() || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Engagement</span>
                    <div className="font-semibold">
                      {account.engagementRate ? `${(account.engagementRate * 100).toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Token Expiry */}
                {account.tokenExpiry && (
                  <div className="text-xs text-gray-600">
                    Token expires: {format(new Date(account.tokenExpiry), 'MMM d, yyyy')}
                  </div>
                )}

                {/* Sync Progress */}
                {syncProgressValue !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Syncing...</span>
                      <span>{syncProgressValue}%</span>
                    </div>
                    <Progress value={syncProgressValue} className="h-2" />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSync(account.id)}
                    disabled={syncProgressValue !== undefined}
                    className="flex-1"
                  >
                    {syncProgressValue !== undefined ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Sync
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`https://${platform}.com`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect Account</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to disconnect your {config.name} account ({account.accountName})?
                          This will stop all automated posting to this platform.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDisconnect(account.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Disconnect
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </>
            ) : (
              <>
                {/* Platform Features */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Features:</h4>
                  <div className="flex flex-wrap gap-1">
                    {config.features.slice(0, 3).map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {config.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{config.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Rate Limits */}
                <div className="text-xs text-gray-600">
                  Rate Limit: {config.rateLimits.requests} requests per {config.rateLimits.window}min
                </div>

                {/* Connect Button */}
                <Button
                  onClick={() => handleOAuthConnect(platform)}
                  disabled={isConnecting}
                  className={`w-full ${config.gradient} hover:opacity-90`}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link className="h-4 w-4 mr-2" />
                      Connect {config.name}
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Loading integrations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Integrations</h2>
          <p className="text-gray-600 mt-1">
            Connect your social media accounts to automate content publishing and track performance.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadAccounts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Connection Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-semibold">{accounts.filter(acc => acc.isActive).length}</div>
                <div className="text-sm text-gray-600">Active Connections</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-semibold">{accounts.length}</div>
                <div className="text-sm text-gray-600">Total Platforms</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <div>
                <div className="font-semibold">
                  {accounts.filter(acc => acc.tokenExpiry && new Date(acc.tokenExpiry) > addDays(new Date(), 7)).length}
                </div>
                <div className="text-sm text-gray-600">Valid Tokens</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Connected Platforms */}
        <AnimatePresence>
          {accounts.map((account) => (
            <PlatformCard
              key={account.id}
              platform={account.platform}
              account={account}
            />
          ))}
        </AnimatePresence>

        {/* Available Platforms */}
        {getAvailablePlatforms().map((platform) => (
          <PlatformCard key={platform} platform={platform} />
        ))}
      </div>

      {/* Manual Connection */}
      <div className="border-t pt-6">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Need to connect manually? Use API keys or access tokens.
          </p>
          <Dialog open={showManualConnect} onOpenChange={setShowManualConnect}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Manual Connection
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Manual Platform Connection</DialogTitle>
              </DialogHeader>

              <ManualConnectForm
                onSubmit={async (data) => {
                  try {
                    const response = await fetch('/api/social-platforms/connect', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(data)
                    });

                    if (!response.ok) throw new Error('Failed to connect');

                    const newAccount = await response.json();
                    setAccounts(prev => [...prev, newAccount]);
                    setShowManualConnect(false);

                    toast({
                      title: "Account Connected",
                      description: "Manual connection successful",
                    });
                  } catch (error) {
                    toast({
                      title: "Connection Failed",
                      description: "Failed to connect account manually",
                      variant: "destructive",
                    });
                  }
                }}
                onCancel={() => setShowManualConnect(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

// Manual Connect Form Component
function ManualConnectForm({
  onSubmit,
  onCancel
}: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    platform: '',
    accountId: '',
    accountName: '',
    accountHandle: '',
    accessToken: '',
    refreshToken: '',
    tokenExpiry: '',
    permissions: [] as string[]
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
                {config.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="accountName">Account Name</Label>
        <Input
          id="accountName"
          value={formData.accountName}
          onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
          placeholder="Display name"
        />
      </div>

      <div>
        <Label htmlFor="accountHandle">Account Handle</Label>
        <Input
          id="accountHandle"
          value={formData.accountHandle}
          onChange={(e) => setFormData(prev => ({ ...prev, accountHandle: e.target.value }))}
          placeholder="@username or handle"
        />
      </div>

      <div>
        <Label htmlFor="accountId">Account ID</Label>
        <Input
          id="accountId"
          value={formData.accountId}
          onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
          placeholder="Platform account ID"
        />
      </div>

      <div>
        <Label htmlFor="accessToken">Access Token</Label>
        <Textarea
          id="accessToken"
          value={formData.accessToken}
          onChange={(e) => setFormData(prev => ({ ...prev, accessToken: e.target.value }))}
          placeholder="API access token"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="refreshToken">Refresh Token (Optional)</Label>
        <Input
          id="refreshToken"
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
        <Button type="submit">
          Connect Account
        </Button>
      </div>
    </form>
  );
}
