#!/usr/bin/env node

/**
 * AUTH REDIRECT LOOP FIX - FINAL VERSION
 * 
 * This script fixes the authentication redirect loop issue where users
 * get stuck between login and dashboard pages after signing in.
 * 
 * Issues Fixed:
 * 1. Multiple auth checks causing race conditions
 * 2. Improper redirect handling using window.location.href
 * 3. Loading states not properly managed
 * 4. Auth state not properly synchronized
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 AUTH REDIRECT LOOP FIX - Starting...');

// Fix 1: Update useAuth hook to prevent multiple initializations
const useAuthPath = path.join(__dirname, 'client/src/hooks/useAuth.ts');
if (fs.existsSync(useAuthPath)) {
  let useAuthContent = fs.readFileSync(useAuthPath, 'utf8');
  
  // Add a flag to prevent multiple auth checks
  if (!useAuthContent.includes('const initializationRef = useRef(false)')) {
    useAuthContent = useAuthContent.replace(
      'const isCheckingRef = useRef(false);',
      `const isCheckingRef = useRef(false);
  const initializationRef = useRef(false);`
    );
  }
  
  // Update the initialization effect
  useAuthContent = useAuthContent.replace(
    /\/\/ Initialize ONCE on mount[\s\S]*?}, \[\]\); \/\/ Empty dependency array - only run once!/,
    `// Initialize ONCE on mount
  useEffect(() => {
    console.log('🔧 useAuth initializing...');
    mountedRef.current = true;
    
    // Prevent multiple initializations
    if (initializationRef.current) {
      console.log('🔧 useAuth already initialized, skipping...');
      return;
    }
    
    initializationRef.current = true;
    
    // Only check auth if not already initialized
    if (!state.initialized && !isCheckingRef.current) {
      checkAuth();
    }

    // Cleanup on unmount
    return () => {
      console.log('🧹 useAuth cleanup');
      mountedRef.current = false;
    };
  }, []); // Empty dependency array - only run once!`
  );
  
  fs.writeFileSync(useAuthPath, useAuthContent);
  console.log('✅ Fixed useAuth hook initialization');
}

// Fix 2: Update login page to handle redirects properly
const loginPath = path.join(__dirname, 'client/src/pages/login.tsx');
if (fs.existsSync(loginPath)) {
  let loginContent = fs.readFileSync(loginPath, 'utf8');
  
  // Fix redirect logic to use replace instead of href
  loginContent = loginContent.replace(
    /window\.location\.href = '\/dashboard';/g,
    "window.location.replace('/dashboard');"
  );
  
  // Add a flag to prevent multiple redirects
  if (!loginContent.includes('const [isRedirecting, setIsRedirecting] = useState(false)')) {
    loginContent = loginContent.replace(
      'const [formErrors, setFormErrors] = useState',
      `const [isRedirecting, setIsRedirecting] = useState(false);
  const [formErrors, setFormErrors] = useState`
    );
  }
  
  // Update redirect effect to prevent multiple redirects
  loginContent = loginContent.replace(
    /\/\/ Redirect if already authenticated[\s\S]*?}, \[isAuthenticated, loading, initialized\]\);/,
    `// Redirect if already authenticated
  useEffect(() => {
    if (initialized && isAuthenticated && !loading && !isRedirecting) {
      console.log('✅ User already authenticated, redirecting to dashboard');
      setIsRedirecting(true);
      // Use replace instead of href to avoid adding to history
      setTimeout(() => {
        window.location.replace('/dashboard');
      }, 100);
    }
  }, [isAuthenticated, loading, initialized, isRedirecting]);`
  );
  
  fs.writeFileSync(loginPath, loginContent);
  console.log('✅ Fixed login page redirects');
}

// Fix 3: Update dashboard to handle auth properly
const dashboardPath = path.join(__dirname, 'client/src/pages/dashboard.tsx');
if (fs.existsSync(dashboardPath)) {
  let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  
  // Fix redirect logic
  dashboardContent = dashboardContent.replace(
    /window\.location\.href = "\/login";/g,
    'window.location.replace("/login");'
  );
  
  // Update auth check to be more specific
  dashboardContent = dashboardContent.replace(
    /\/\/ Redirect to home if not authenticated[\s\S]*?}, \[isAuthenticated, loading, toast\]\);/,
    `// Redirect to login if not authenticated
  useEffect(() => {
    if (initialized && !loading && !isAuthenticated) {
      console.log('❌ User not authenticated, redirecting to login');
      toast({
        title: "Session Expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.replace("/login");
      }, 1000);
    }
  }, [isAuthenticated, loading, initialized, toast]);`
  );
  
  fs.writeFileSync(dashboardPath, dashboardContent);
  console.log('✅ Fixed dashboard auth handling');
}

// Fix 4: Update App.tsx routing
const appPath = path.join(__dirname, 'client/src/App.tsx');
if (fs.existsSync(appPath)) {
  let appContent = fs.readFileSync(appPath, 'utf8');
  
  // Fix all window.location.href to use replace
  appContent = appContent.replace(
    /window\.location\.href = /g,
    'window.location.replace('
  );
  
  // Update ProtectedRoute to be more robust
  appContent = appContent.replace(
    /\/\/ Protected Route - SIMPLIFIED[\s\S]*?return <>{children}<\/>;[\s\S]*?}/,
    `// Protected Route - SIMPLIFIED
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, initialized } = useAuth();
  
  console.log('🛡️ ProtectedRoute check:', { isAuthenticated, loading, initialized });
  
  // Show loading while initializing
  if (!initialized) {
    return <LoadingScreen />;
  }
  
  // Redirect to login if not authenticated (only after initialization)
  if (!isAuthenticated) {
    console.log('🔒 Not authenticated, redirecting to login');
    setTimeout(() => {
      window.location.replace('/login');
    }, 100);
    return <LoadingScreen />;
  }
  
  console.log('✅ Authenticated, showing protected content');
  return <>{children}</>;
}`
  );
  
  // Update PublicRoute to be more robust
  appContent = appContent.replace(
    /\/\/ Public Route - SIMPLIFIED[\s\S]*?return <>{children}<\/>;[\s\S]*?}/,
    `// Public Route - SIMPLIFIED
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, initialized } = useAuth();
  
  console.log('🌐 PublicRoute check:', { isAuthenticated, loading, initialized });
  
  // Show loading while initializing
  if (!initialized) {
    return <LoadingScreen />;
  }
  
  // Redirect to dashboard if authenticated (only after initialization)
  if (isAuthenticated) {
    console.log('✅ Authenticated, redirecting to dashboard');
    setTimeout(() => {
      window.location.replace('/dashboard');
    }, 100);
    return <LoadingScreen />;
  }
  
  console.log('🌐 Not authenticated, showing public content');
  return <>{children}</>;
}`
  );
  
  fs.writeFileSync(appPath, appContent);
  console.log('✅ Fixed App.tsx routing');
}

// Fix 5: Create a localStorage cleanup utility
const cleanupScript = `
// Clear any corrupted auth data
console.log('🧹 Cleaning up auth data...');
const keysToCheck = ['token', 'refreshToken', 'user', 'auth-state'];
keysToCheck.forEach(key => {
  const value = localStorage.getItem(key);
  if (value) {
    try {
      if (key === 'user') {
        JSON.parse(value); // Test if valid JSON
      }
      console.log('✅ Valid auth data for:', key);
    } catch (error) {
      console.log('❌ Removing corrupted auth data for:', key);
      localStorage.removeItem(key);
    }
  }
});

// Clear any auth-related session storage
sessionStorage.removeItem('auth-redirect');
sessionStorage.removeItem('login-redirect');

console.log('✅ Auth data cleanup complete');
`;

fs.writeFileSync(path.join(__dirname, 'cleanup-auth-data.js'), cleanupScript);

console.log('✅ AUTH REDIRECT LOOP FIX - Complete!');
console.log('');
console.log('🔧 Changes made:');
console.log('  1. Fixed useAuth hook to prevent multiple initializations');
console.log('  2. Updated login page to use window.location.replace()');
console.log('  3. Fixed dashboard auth handling');
console.log('  4. Updated App.tsx routing logic');
console.log('  5. Created auth data cleanup utility');
console.log('');
console.log('🚀 Next steps:');
console.log('  1. Restart the development server');
console.log('  2. Clear browser cache and localStorage');
console.log('  3. Test login flow');
console.log('');
console.log('💡 If issues persist, run: node cleanup-auth-data.js in browser console');