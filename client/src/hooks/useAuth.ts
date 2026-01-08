import { useState, useEffect, useCallback, useRef } from "react";
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

  // ✅ CRITICAL FIX: Use ref to prevent multiple simultaneous checks
  const isCheckingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const checkAuth = useCallback(async () => {
    // ✅ Prevent multiple simultaneous auth checks
    if (isCheckingRef.current) {
      console.log('🔍 Auth check already in progress, skipping...');
      return;
    }

    try {
      console.log('🔍 Checking authentication state...');
      isCheckingRef.current = true;
      
      // Debug: Check localStorage state
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      console.log('🔍 localStorage state - token:', !!token, 'user:', !!userStr);

      // First try localStorage fallback (faster and more reliable)
      if (token && userStr) {
        try {
          const userData = JSON.parse(userStr);
          
          // Accept any token format - don't be too strict about JWT format
          if (token && token.length > 0) {
            console.log('✅ User authenticated via localStorage:', userData);
            console.log('✅ Token found:', token.substring(0, 20) + '...');
            setUser(userData);
            setIsAuthenticated(true);
            setIsLoading(false);
            return; // Exit early on success - don't try cookie auth
          }
        } catch (parseError) {
          console.error('❌ Failed to parse stored user data:', parseError);
          // Clear invalid localStorage data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else {
        console.log('🔍 No localStorage token/user found, trying cookie auth...');
      }

      // Only try cookie-based authentication if no valid localStorage token
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch('/api/auth/user', {
          method: 'GET',
          credentials: 'include', // Include cookies in the request
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }) // Include token in header if available
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        console.log('🔍 Cookie auth response status:', response.status);

        if (response.ok) {
          const userData = await response.json();
          console.log('✅ User authenticated via cookies:', userData);
          
          // ✅ CRITICAL: Store tokens in localStorage for consistency
          if (userData.accessToken) {
            localStorage.setItem('token', userData.accessToken);
            localStorage.setItem('user', JSON.stringify(userData.user || userData));
          }
          
          setUser(userData.user || userData);
          setIsAuthenticated(true);
        } else {
          console.log('❌ Cookie auth failed with status:', response.status);
          // ✅ Don't immediately logout on 401 - just mark as unauthenticated
          setIsAuthenticated(false);
          setUser(null);
          // Clear any stale localStorage data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (fetchError) {
        console.log('❌ Cookie auth failed:', fetchError);
        setIsAuthenticated(false);
        setUser(null);
      }
      
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      isCheckingRef.current = false;
      setIsLoading(false);
      console.log('🔍 Auth check completed, loading set to false');
    }
  }, []);

  // ✅ CRITICAL FIX: Single effect with proper cleanup
  useEffect(() => {
    // ✅ Prevent double initialization in React Strict Mode
    if (hasInitializedRef.current) {
      console.log('🔍 Auth already initialized, skipping...');
      return;
    }

    console.log('🔧 Setting up auth...');
    hasInitializedRef.current = true;
    
    // Set initial loading state
    setIsLoading(true);

    // Initial check on mount
    checkAuth();

    // ✅ Auth-changed event listener
    const handleAuthChanged = () => {
      console.log('📢 Auth change event received, executing immediate recheck...');
      if (!isCheckingRef.current) {
        checkAuth();
      } else {
        console.log('📢 Auth check already in progress, skipping event-triggered check');
      }
    };

    window.addEventListener('auth-changed', handleAuthChanged as EventListener);

    // ✅ Reasonable fallback timeout (only if still loading after 3 seconds)
    const fallbackTimeout = setTimeout(() => {
      if (isCheckingRef.current || isLoading) {
        console.warn('⚠️ Auth check timeout - forcing loading to false');
        setIsLoading(false);
        isCheckingRef.current = false;
      }
    }, 3000);

    console.log('✅ Auth setup completed');

    return () => {
      console.log('🧹 Cleaning up auth...');
      window.removeEventListener('auth-changed', handleAuthChanged as EventListener);
      clearTimeout(fallbackTimeout);
      hasInitializedRef.current = false;
      isCheckingRef.current = false;
    };
  }, []); // ✅ Empty dependency array - run only once

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
    if (!isCheckingRef.current) {
      checkAuth();
    } else {
      console.log('🔄 Auth check already in progress, skipping manual refresh');
    }
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
