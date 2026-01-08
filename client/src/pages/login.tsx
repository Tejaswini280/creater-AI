import { useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, User, Lock, Mail, UserPlus } from "lucide-react";
import { useLocation } from "wouter";

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  
  // ✅ CRITICAL FIX: ALL hooks must be called before any conditional returns
  const [activeTab, setActiveTab] = useState("login");
  const [formErrors, setFormErrors] = useState<{
    login?: { email?: string; password?: string };
    register?: { email?: string; password?: string; firstName?: string; lastName?: string };
  }>({});

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: ""
  });

  // Form validation callbacks
  const validateLoginForm = useCallback(() => {
    const errors: { email?: string; password?: string } = {};
    
    if (!loginData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!loginData.password) {
      errors.password = 'Password is required';
    } else if (loginData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFormErrors(prev => ({ ...prev, login: errors }));
    return Object.keys(errors).length === 0;
  }, [loginData]);

  const validateRegisterForm = useCallback(() => {
    const errors: { email?: string; password?: string; firstName?: string; lastName?: string } = {};
    
    if (!registerData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!registerData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!registerData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!registerData.password) {
      errors.password = 'Password is required';
    } else if (registerData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFormErrors(prev => ({ ...prev, register: errors }));
    return Object.keys(errors).length === 0;
  }, [registerData]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', data);
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('🔐 Login successful:', data);
      console.log('🔐 Login response keys:', Object.keys(data));

      // Handle fallback mode where server returns tokens in response
      if (data.accessToken && data.refreshToken) {
        console.log('🔑 Server in fallback mode, storing tokens locally');
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Debug: Verify tokens were stored
        console.log('🔑 Tokens stored - localStorage check:', {
          token: !!localStorage.getItem('token'),
          refreshToken: !!localStorage.getItem('refreshToken'),
          user: !!localStorage.getItem('user')
        });
      } else {
        console.log('🍪 Server in normal mode (cookies), clearing localStorage');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }

      toast({
        title: "Login Successful!",
        description: `Welcome back, ${data.user.firstName}!`,
      });

      // ✅ CRITICAL FIX: More robust auth state update
      console.log('🔄 Forcing immediate auth state update...');
      
      try {
        console.log('📢 Dispatching auth-changed event');
        window.dispatchEvent(new Event('auth-changed'));
        
        // ✅ CRITICAL FIX: Wait longer for auth state to update
        setTimeout(() => {
          console.log('🔄 Checking if auth state updated...');
          const tokenCheck = localStorage.getItem('token');
          const userCheck = localStorage.getItem('user');
          console.log('🔄 Post-login token check:', !!tokenCheck, !!userCheck);
          
          console.log('🔄 Redirecting to dashboard after auth state update...');
          setLocation('/');
        }, 500); // ✅ Increased delay to 500ms
        
      } catch (error) {
        console.error('❌ Error dispatching auth-changed event:', error);
        setLocation('/');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; firstName: string; lastName: string }) => {
      const response = await apiRequest('POST', '/api/auth/register', data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Successful!",
        description: `Welcome, ${data.user.firstName}! Please log in.`,
      });
      setActiveTab("login");
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Registration failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log('🔄 User already authenticated, redirecting to dashboard...');
      setLocation('/');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // ✅ NOW check conditions AFTER all hooks are called
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Handle form submissions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateLoginForm()) {
      loginMutation.mutate(loginData);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateRegisterForm()) {
      registerMutation.mutate(registerData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Creator AI Studio
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Your AI-powered content creation platform
          </p>
        </CardHeader>
        
        <CardContent className="pt-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Sign In
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    className={formErrors.login?.email ? "border-red-500" : ""}
                  />
                  {formErrors.login?.email && (
                    <p className="text-sm text-red-500">{formErrors.login.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className={formErrors.login?.password ? "border-red-500" : ""}
                  />
                  {formErrors.login?.password && (
                    <p className="text-sm text-red-500">{formErrors.login.password}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="First name"
                      value={registerData.firstName}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, firstName: e.target.value }))}
                      className={formErrors.register?.firstName ? "border-red-500" : ""}
                    />
                    {formErrors.register?.firstName && (
                      <p className="text-sm text-red-500">{formErrors.register.firstName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Last name"
                      value={registerData.lastName}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, lastName: e.target.value }))}
                      className={formErrors.register?.lastName ? "border-red-500" : ""}
                    />
                    {formErrors.register?.lastName && (
                      <p className="text-sm text-red-500">{formErrors.register.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registerEmail" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="registerEmail"
                    type="email"
                    placeholder="Enter your email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                    className={formErrors.register?.email ? "border-red-500" : ""}
                  />
                  {formErrors.register?.email && (
                    <p className="text-sm text-red-500">{formErrors.register.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registerPassword" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <Input
                    id="registerPassword"
                    type="password"
                    placeholder="Create a password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                    className={formErrors.register?.password ? "border-red-500" : ""}
                  />
                  {formErrors.register?.password && (
                    <p className="text-sm text-red-500">{formErrors.register.password}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}