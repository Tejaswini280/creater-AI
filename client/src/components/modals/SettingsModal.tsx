import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Loader2, 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Link,
  Unlink,
  Globe,
  Clock,
  CreditCard,
  Zap
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  timezone: string;
  language: string;
  profileImageUrl: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  contentReminders: boolean;
  analyticsReports: boolean;
  socialMediaUpdates: boolean;
  aiGenerationComplete: boolean;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'limited';
  contentAnalytics: boolean;
  dataDeletion: boolean;
  twoFactorAuth: boolean;
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (EST)' },
  { value: 'America/Chicago', label: 'Central Time (CST)' },
  { value: 'America/Denver', label: 'Mountain Time (MST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PST)' },
  { value: 'Europe/London', label: 'GMT (London)' },
  { value: 'Europe/Paris', label: 'CET (Paris)' },
  { value: 'Asia/Tokyo', label: 'JST (Tokyo)' },
  { value: 'Australia/Sydney', label: 'AEDT (Sydney)' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
];

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { toast } = useToast();
  const { user, updateUserData, clearAuth } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [profile, setProfile] = useState<UserProfile>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    bio: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: 'en',
    profileImageUrl: user?.profileImageUrl || ''
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    contentReminders: true,
    analyticsReports: false,
    socialMediaUpdates: true,
    aiGenerationComplete: true
  });

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'private',
    contentAnalytics: true,
    dataDeletion: false,
    twoFactorAuth: false
  });

  // Fetch user settings
  const { data: userSettings, isLoading } = useQuery<{
    success: boolean;
    profile: UserProfile;
    notifications: NotificationSettings;
    privacy: PrivacySettings;
  }>({
    queryKey: ['/api/user/settings'],
    retry: false,
    enabled: isOpen,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const response = await apiRequest('PUT', '/api/user/profile', data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      // Update user data in localStorage and state
      if (data.user) {
        updateUserData({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/settings'] });
    },
    onError: handleError,
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwords) => {
      const response = await apiRequest('PUT', '/api/user/password', {
        currentPassword: data.current,
        newPassword: data.new
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });
      setPasswords({ current: '', new: '', confirm: '' });
    },
    onError: handleError,
  });

  // Update notifications mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationSettings) => {
      const response = await apiRequest('PUT', '/api/user/notifications', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Notification Settings Updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: handleError,
  });

  // Update privacy mutation
  const updatePrivacyMutation = useMutation({
    mutationFn: async (data: PrivacySettings) => {
      const response = await apiRequest('PUT', '/api/user/privacy', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Privacy Settings Updated",
        description: "Your privacy preferences have been saved.",
      });
    },
    onError: handleError,
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/user/account');
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      try {
        clearAuth();
        // Notify current tab listeners immediately
        window.dispatchEvent(new Event('auth-changed'));
      } catch {}
      // Redirect to login after clearing auth
      window.location.href = '/login';
    },
    onError: handleError,
  });

  // Export data mutation
  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/user/export-data');
      return await response.json();
    },
    onSuccess: (data) => {
      // Create and download the data file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Data Exported",
        description: "Your data has been successfully exported.",
      });
    },
    onError: handleError,
  });

  function handleError(error: any) {
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
      title: "Update Failed",
      description: "Please try again later.",
      variant: "destructive",
    });
  }

  useEffect(() => {
    if (userSettings && userSettings.success) {
      setProfile(prev => ({ ...prev, ...userSettings.profile }));
      setNotifications(prev => ({ ...prev, ...userSettings.notifications }));
      setPrivacy(prev => ({ ...prev, ...userSettings.privacy }));
    }
  }, [userSettings]);

  const handleProfileSave = () => {
    updateProfileMutation.mutate(profile);
  };

  const handlePasswordChange = () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast({
        title: "Missing Information",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwords.new.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    updatePasswordMutation.mutate(passwords);
  };

  const handleNotificationsSave = () => {
    updateNotificationsMutation.mutate(notifications);
  };

  const handlePrivacySave = () => {
    updatePrivacyMutation.mutate(privacy);
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      deleteAccountMutation.mutate();
    }
  };

  const handleExportData = () => {
    exportDataMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden" aria-describedby="settings-description">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-gray-600" />
            Settings
          </DialogTitle>
          <DialogDescription id="settings-description">
            Manage your profile, notifications, privacy settings, and account preferences
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center text-xs">
              <User className="w-4 h-4 mr-1" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center text-xs">
              <Bell className="w-4 h-4 mr-1" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center text-xs">
              <Shield className="w-4 h-4 mr-1" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center text-xs">
              <Settings className="w-4 h-4 mr-1" />
              Account
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Privacy & Cookies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">Review your cookie consent preferences.</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        document.cookie = `cookie_consent=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
                        window.location.reload();
                      }}
                    >
                      Review cookie consent
                    </Button>
                    <Button asChild variant="link">
                      <a href="/privacy" className="text-sm">Privacy Policy</a>
                    </Button>
                    <Button asChild variant="link">
                      <a href="/terms" className="text-sm">Terms of Service</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profile.firstName}
                        onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profile.lastName}
                        onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select value={profile.timezone} onValueChange={(value) => setProfile(prev => ({ ...prev, timezone: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map(tz => (
                            <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select value={profile.language} onValueChange={(value) => setProfile(prev => ({ ...prev, language: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map(lang => (
                            <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleProfileSave} disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Profile'
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Password Change */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Change Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        value={passwords.current}
                        onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                        placeholder="Enter current password"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwords.new}
                      onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwords.confirm}
                      onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                      placeholder="Confirm new password"
                    />
                  </div>

                  <Button onClick={handlePasswordChange} disabled={updatePasswordMutation.isPending}>
                    {updatePasswordMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Change Password'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(notifications).map(([key, value]) => {
                    const labels = {
                      emailNotifications: 'Email Notifications',
                      pushNotifications: 'Push Notifications',
                      contentReminders: 'Content Reminders',
                      analyticsReports: 'Analytics Reports',
                      socialMediaUpdates: 'Social Media Updates',
                      aiGenerationComplete: 'AI Generation Complete'
                    };
                    
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <Label htmlFor={key} className="cursor-pointer">
                          {labels[key as keyof typeof labels]}
                        </Label>
                        <Switch
                          id={key}
                          checked={value}
                          onCheckedChange={(checked) => 
                            setNotifications(prev => ({ ...prev, [key]: checked }))
                          }
                        />
                      </div>
                    );
                  })}

                  <Separator />

                  <Button onClick={handleNotificationsSave} disabled={updateNotificationsMutation.isPending}>
                    {updateNotificationsMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Preferences'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Privacy Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Profile Visibility</Label>
                    <Select 
                      value={privacy.profileVisibility} 
                      onValueChange={(value: 'public' | 'private' | 'limited') => 
                        setPrivacy(prev => ({ ...prev, profileVisibility: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="limited">Limited</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="contentAnalytics" className="cursor-pointer">
                      Content Analytics
                    </Label>
                    <Switch
                      id="contentAnalytics"
                      checked={privacy.contentAnalytics}
                      onCheckedChange={(checked) => 
                        setPrivacy(prev => ({ ...prev, contentAnalytics: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="twoFactorAuth" className="cursor-pointer">
                      Two-Factor Authentication
                    </Label>
                    <Switch
                      id="twoFactorAuth"
                      checked={privacy.twoFactorAuth}
                      onCheckedChange={(checked) => 
                        setPrivacy(prev => ({ ...prev, twoFactorAuth: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <Button onClick={handlePrivacySave} disabled={updatePrivacyMutation.isPending}>
                    {updatePrivacyMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Privacy Settings'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Account Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Account Status</h4>
                      <p className="text-sm text-gray-600">Your account is active</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Data Export</h4>
                      <p className="text-sm text-gray-600">Download your data</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExportData}>
                      Export Data
                    </Button>
                  </div>

                  <Separator />

                  {/* Danger Zone */}
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <h4 className="font-medium text-red-900 mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Danger Zone
                    </h4>
                    <p className="text-sm text-red-700 mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAccount}
                      disabled={deleteAccountMutation.isPending}
                    >
                      {deleteAccountMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}