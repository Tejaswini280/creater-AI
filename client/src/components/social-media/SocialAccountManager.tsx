import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CheckCircle, 
  XCircle, 
  Plus, 
  Settings, 
  Trash2, 
  ExternalLink,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialAccount {
  id: number;
  platform: string;
  accountName: string;
  isActive: boolean;
  connectedAt: string;
}

interface PlatformInfo {
  name: string;
  icon: string;
  color: string;
  description: string;
  authUrl: string;
  requirements: string[];
}

const PLATFORMS: PlatformInfo[] = [
  {
    name: 'Instagram',
    icon: '📸',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    description: 'Share photos and videos with your followers',
    authUrl: 'https://www.instagram.com/oauth/authorize',
    requirements: ['Instagram Business Account', 'Facebook Page', 'Instagram Basic Display API']
  },
  {
    name: 'YouTube',
    icon: '🎥',
    color: 'bg-gradient-to-r from-red-500 to-red-600',
    description: 'Upload and manage your video content',
    authUrl: 'https://accounts.google.com/oauth/authorize',
    requirements: ['Google Account', 'YouTube Channel', 'YouTube Data API v3']
  },
  {
    name: 'TikTok',
    icon: '🎵',
    color: 'bg-gradient-to-r from-black to-gray-800',
    description: 'Create and share short-form videos',
    authUrl: 'https://www.tiktok.com/auth/authorize',
    requirements: ['TikTok Account', 'TikTok for Developers', 'TikTok API Access']
  },
  {
    name: 'LinkedIn',
    icon: '💼',
    color: 'bg-gradient-to-r from-blue-600 to-blue-700',
    description: 'Share professional content and insights',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    requirements: ['LinkedIn Account', 'LinkedIn Developer App', 'LinkedIn API v2']
  },
  {
    name: 'Facebook',
    icon: '👥',
    color: 'bg-gradient-to-r from-blue-500 to-blue-600',
    description: 'Connect with your Facebook audience',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    requirements: ['Facebook Account', 'Facebook Page', 'Facebook Graph API']
  },
  {
    name: 'Twitter',
    icon: '🐦',
    color: 'bg-gradient-to-r from-blue-400 to-blue-500',
    description: 'Share thoughts and engage in conversations',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    requirements: ['Twitter Account', 'Twitter Developer Account', 'Twitter API v2']
  }
];

export default function SocialAccountManager() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [connectionData, setConnectionData] = useState({
    accessToken: '',
    accountId: '',
    accountName: ''
  });
  const { toast } = useToast();

  // Load accounts on component mount
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/social-media/accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAccounts(data.data || []);
      } else {
        throw new Error('Failed to load accounts');
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load social media accounts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectAccount = async () => {
    if (!selectedPlatform || !connectionData.accessToken || !connectionData.accountId || !connectionData.accountName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    try {
      const response = await fetch('/api/social-media/validate-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          platform: selectedPlatform,
          ...connectionData
        })
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: `${selectedPlatform} account connected successfully`,
        });
        setShowConnectDialog(false);
        setConnectionData({ accessToken: '', accountId: '', accountName: '' });
        setSelectedPlatform('');
        loadAccounts();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to connect account');
      }
    } catch (error) {
      console.error('Error connecting account:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect account",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectAccount = async (accountId: number) => {
    try {
      const response = await fetch(`/api/social-media/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Account disconnected successfully",
        });
        loadAccounts();
      } else {
        throw new Error('Failed to disconnect account');
      }
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect account",
        variant: "destructive"
      });
    }
  };

  const handleTestConnection = async (platform: string) => {
    try {
      const response = await fetch('/api/social-media/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ platform })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: data.data.connected ? "Connection Active" : "Connection Failed",
          description: `${platform} account is ${data.data.connected ? 'working properly' : 'not responding'}`,
          variant: data.data.connected ? "default" : "destructive"
        });
      } else {
        throw new Error('Failed to test connection');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({
        title: "Error",
        description: "Failed to test connection",
        variant: "destructive"
      });
    }
  };

  const getPlatformInfo = (platform: string): PlatformInfo | undefined => {
    return PLATFORMS.find(p => p.name.toLowerCase() === platform.toLowerCase());
  };

  const getConnectedPlatforms = (): string[] => {
    return accounts.filter(account => account.isActive).map(account => account.platform);
  };

  const getAvailablePlatforms = (): PlatformInfo[] => {
    const connectedPlatforms = getConnectedPlatforms();
    return PLATFORMS.filter(platform => !connectedPlatforms.includes(platform.name.toLowerCase()));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading social media accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Social Media Accounts</h2>
          <p className="text-gray-600">Connect your social media accounts to enable automated posting</p>
        </div>
        
        <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Connect Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Connect Social Media Account</DialogTitle>
              <DialogDescription>
                Add a new social media account to enable automated posting
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailablePlatforms().map((platform) => (
                      <SelectItem key={platform.name} value={platform.name.toLowerCase()}>
                        <div className="flex items-center gap-2">
                          <span>{platform.icon}</span>
                          {platform.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPlatform && (
                <>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">Requirements:</p>
                        <ul className="text-sm space-y-1">
                          {getPlatformInfo(selectedPlatform)?.requirements.map((req, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <span className="text-blue-500">•</span>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="accessToken">Access Token</Label>
                    <Input
                      id="accessToken"
                      type="password"
                      placeholder="Enter your access token"
                      value={connectionData.accessToken}
                      onChange={(e) => setConnectionData(prev => ({ ...prev, accessToken: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountId">Account ID</Label>
                    <Input
                      id="accountId"
                      placeholder="Enter your account ID"
                      value={connectionData.accountId}
                      onChange={(e) => setConnectionData(prev => ({ ...prev, accountId: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      placeholder="Enter your account name"
                      value={connectionData.accountName}
                      onChange={(e) => setConnectionData(prev => ({ ...prev, accountName: e.target.value }))}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleConnectAccount}
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Connect Account
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Connected Accounts */}
      {accounts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Accounts Connected</h3>
            <p className="text-gray-600 mb-4">
              Connect your social media accounts to start automated posting
            </p>
            <Button onClick={() => setShowConnectDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Connect Your First Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const platformInfo = getPlatformInfo(account.platform);
            return (
              <Card key={account.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${platformInfo?.color || 'bg-gray-100'} flex items-center justify-center text-white text-lg`}>
                        {platformInfo?.icon || '📱'}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{account.accountName}</CardTitle>
                        <CardDescription className="capitalize">
                          {account.platform}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={account.isActive ? "default" : "secondary"}>
                      {account.isActive ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {account.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <span>Connected:</span>
                      <span>{new Date(account.connectedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Status:</span>
                      <span className={account.isActive ? 'text-green-600' : 'text-red-600'}>
                        {account.isActive ? 'Working' : 'Not Working'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(account.platform)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(platformInfo?.authUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Reconnect
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDisconnectAccount(account.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Available Platforms */}
      {getAvailablePlatforms().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Platforms</CardTitle>
            <CardDescription>
              Connect additional platforms to expand your reach
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getAvailablePlatforms().map((platform) => (
                <div
                  key={platform.name}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedPlatform(platform.name.toLowerCase());
                    setShowConnectDialog(true);
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-lg ${platform.color} flex items-center justify-center text-white text-lg`}>
                      {platform.icon}
                    </div>
                    <div>
                      <h3 className="font-medium">{platform.name}</h3>
                      <p className="text-sm text-gray-600">{platform.description}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {platform.requirements.length} requirements
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
