import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 Checking authentication state...');
      setIsLoading(true);

      // Debug: Check localStorage state
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      console.log('🔍 localStorage state - token:', !!token, 'user:', !!userStr);

      // Try cookie-based authentication (normal mode) with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/auth/user', {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('🔍 Cookie auth response status:', response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ User authenticated via cookies:', userData);
        setUser(userData);
        setIsAuthenticated(true);
        setIsLoading(false);
        return; // Exit early on success
      } 
      
      // If cookie auth failed, try localStorage fallback
      console.log('❌ Cookie auth failed, trying localStorage fallback...');
      
      if (token && userStr) {
        try {
          const userData = JSON.parse(userStr);
          
          // Validate token format - should be a JWT token, not just user ID
          if (token.includes('.') && token.split('.').length === 3) {
            console.log('✅ User authenticated via localStorage with JWT token:', userData);
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            console.log('❌ Invalid token format in localStorage, treating as unauthenticated');
            setIsAuthenticated(false);
            setUser(null);
          }
        } catch (parseError) {
          console.error('❌ Failed to parse stored user data:', parseError);
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        console.log('❌ No authentication found');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
      console.log('🔍 Auth check completed, loading set to false');
    }
  }, []);

  useEffect(() => {
    console.log('🔧 Setting up auth...');

    // Initial check on mount
    checkAuth();

    // Listen for custom auth events
    const handleAuthChanged = () => {
      console.log('📢 Auth change event received, rechecking...');
      checkAuth();
    };

    window.addEventListener('auth-changed', handleAuthChanged as EventListener);

    // Fallback timeout to prevent infinite loading
    const fallbackTimeout = setTimeout(() => {
      console.warn('⚠️ Auth check timeout - forcing loading to false');
      setIsLoading(false);
    }, 15000); // 15 second timeout

    console.log('✅ Auth event listeners set up');

    return () => {
      console.log('🧹 Cleaning up auth event listeners...');
      window.removeEventListener('auth-changed', handleAuthChanged as EventListener);
      clearTimeout(fallbackTimeout);
    };
  }, [checkAuth]);

  // Function to update user data (called from SettingsModal)
  const updateUserData = (newUserData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...newUserData };
      setUser(updatedUser);
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint with credentials to clear cookies
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        console.warn('Backend logout returned non-OK status:', response.status);
      }
    } catch (error) {
      console.error('Backend logout error:', error);
      // Continue with frontend logout even if backend fails
    } finally {
      // Clear frontend state
      setIsAuthenticated(false);
      setUser(null);

      // Clear any remaining localStorage data (cleanup)
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Clear React Query cache
      queryClient.clear();

      // Dispatch logout event for components that need to respond
      window.dispatchEvent(new CustomEvent('auth-logout'));
    }
  };

  const clearAuth = () => {
    setIsAuthenticated(false);
    setUser(null);
    // Clear any remaining localStorage data
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  // Function to manually refresh auth state (for debugging)
  const refreshAuth = useCallback(() => {
    console.log('🔄 Manual auth refresh triggered');
    checkAuth();
  }, [checkAuth]);

  return {
    isAuthenticated,
    user,
    isLoading,
    logout,
    clearAuth,
    updateUserData,
    refreshAuth // Add this for debugging
  };
}
