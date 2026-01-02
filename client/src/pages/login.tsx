import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, User, Lock, Mail, UserPlus } from "lucide-react";
import { useLocation } from "wouter";

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
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

  // Debounced navigation
  const debouncedNavigate = useDebouncedCallback((url: string) => {
    try {
      window.location.href = url;
    } catch (error) {
      console.error('Navigation error:', error);
      toast({
        title: "Navigation Error",
        description: "Failed to navigate. Please try again.",
        variant: "destructive",
      });
    }
  }, 300);

  // Form validation
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
      console.log('🔐 Login response data keys:', Object.keys(data));

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
        // Normal mode - clear any existing localStorage tokens
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }

      // Notify app in this tab that auth state changed
      try {
        console.log('📢 Dispatching auth-changed event');
        window.dispatchEvent(new Event('auth-changed'));
      } catch (error) {
        console.error('❌ Error dispatching auth-changed event:', error);
      }

      toast({
        title: "Login Successful!",
        description: `Welcome back, ${data.user.firstName}!`,
      });

      // Force immediate auth check before redirect
      console.log('🔄 Forcing immediate auth state update...');
      
      // Small delay to ensure auth event is processed
      setTimeout(() => {
        console.log('🔄 Redirecting to dashboard...');
        debouncedNavigate('/');
      }, 100);
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
        description: `Account created successfully! Please log in with your credentials.`,
      });
      
      // Clear form data
      setRegisterData({
        email: "",
        password: "",
        firstName: "",
        lastName: ""
      });
      
      // Switch to login tab
      setActiveTab("login");
      
      // Pre-fill email in login form
      setLoginData(prev => ({
        ...prev,
        email: data.user.email
      }));
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogin = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLoginForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form.",
        variant: "destructive",
      });
      return;
    }
    
    loginMutation.mutate(loginData);
  }, [loginData, validateLoginForm, loginMutation, toast]);

  const handleRegister = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegisterForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form.",
        variant: "destructive",
      });
      return;
    }
    
    registerMutation.mutate(registerData);
  }, [registerData, validateRegisterForm, registerMutation, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4" role="document">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8" role="banner" aria-label="Application header">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">CreatorAI Studio</h1>
          </div>
          <p className="text-gray-600">Sign in to your account or create a new one</p>
        </div>

        {/* Auth Tabs */}
        <Card id="main-content" className="bg-white/80 backdrop-blur-sm border-0 shadow-xl" role="main" aria-labelledby="auth-title">
          <CardHeader className="pb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="flex items-center space-x-2" aria-controls="login-panel" aria-selected={activeTab==='login'}>
                  <User className="w-4 h-4" />
                  <span id="auth-title">Login</span>
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center space-x-2" aria-controls="register-panel" aria-selected={activeTab==='register'}>
                  <UserPlus className="w-4 h-4" />
                  <span>Register</span>
                </TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent id="login-panel" value="login" className="mt-6" role="tabpanel" aria-labelledby="auth-title">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>Email</span>
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginData.email}
                      onChange={(e) => {
                        setLoginData({ ...loginData, email: e.target.value });
                        if (formErrors.login?.email) {
                          setFormErrors(prev => ({ 
                            ...prev, 
                            login: { ...prev.login, email: undefined } 
                          }));
                        }
                      }}
                      className={formErrors.login?.email ? 'border-red-500' : ''}
                      required
                      aria-describedby={formErrors.login?.email ? 'login-email-error' : undefined}
                    />
                    {formErrors.login?.email && (
                      <p id="login-email-error" className="text-sm text-red-500 mt-1">
                        {formErrors.login.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="flex items-center space-x-2">
                      <Lock className="w-4 h-4" />
                      <span>Password</span>
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => {
                        setLoginData({ ...loginData, password: e.target.value });
                        if (formErrors.login?.password) {
                          setFormErrors(prev => ({ 
                            ...prev, 
                            login: { ...prev.login, password: undefined } 
                          }));
                        }
                      }}
                      className={formErrors.login?.password ? 'border-red-500' : ''}
                      required
                      aria-describedby={formErrors.login?.password ? 'login-password-error' : undefined}
                    />
                    {formErrors.login?.password && (
                      <p id="login-password-error" className="text-sm text-red-500 mt-1">
                        {formErrors.login.password}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Form */}
              <TabsContent id="register-panel" value="register" className="mt-6" role="tabpanel" aria-labelledby="auth-title">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-firstName">First Name</Label>
                      <Input
                        id="register-firstName"
                        type="text"
                        placeholder="John"
                        value={registerData.firstName}
                        onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-lastName">Last Name</Label>
                      <Input
                        id="register-lastName"
                        type="text"
                        placeholder="Doe"
                        value={registerData.lastName}
                        onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>Email</span>
                    </Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="john@example.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="flex items-center space-x-2">
                      <Lock className="w-4 h-4" />
                      <span>Password</span>
                    </Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating account...</span>
                      </div>
                    ) : (
                      <span>Create Account</span>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <p className="text-sm">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
} 