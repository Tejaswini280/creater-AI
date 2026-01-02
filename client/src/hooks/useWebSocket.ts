import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connectionAttempts: number;
}

interface UseWebSocketOptions {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  // Debug identifier to ensure this is the correct hook being used
  console.log('🔧 useWebSocket hook loaded - Version: 2.0.0 - Fixed WebSocket URL construction');
  
  const {
    autoReconnect = true,
    maxReconnectAttempts = 5,
    reconnectInterval = 3000,
    onMessage,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const { isAuthenticated, user } = useAuth();
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    connectionAttempts: 0
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Get WebSocket connection URL - Fixed approach with proper JWT token handling
  const getWebSocketUrl = useCallback((): string | null => {
    // Only attempt WebSocket connection if user is authenticated and has a valid ID
    if (!isAuthenticated || !user?.id || user.id.trim() === '') {
      console.log('❌ User not authenticated or invalid ID, skipping WebSocket URL generation');
      console.log('🔍 Auth state:', { isAuthenticated, userId: user?.id, userExists: !!user });
      return null;
    }

    // Get JWT token from localStorage for WebSocket authentication
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No JWT token found in localStorage, skipping WebSocket URL generation');
      return null;
    }

    // Validate token format - should be a JWT token
    if (!token.includes('.') || token.split('.').length !== 3) {
      console.log('❌ Invalid JWT token format, skipping WebSocket URL generation');
      return null;
    }

    console.log('🔌 WebSocket URL generation - userId:', user.id, 'isAuthenticated:', isAuthenticated, 'hasToken:', !!token);

    // Always use relative URL in development to let Vite proxy handle it
    const wsUrl = `/ws?token=${encodeURIComponent(token)}`;
    console.log('🎯 Development mode: Using relative WebSocket URL:', wsUrl);

    return wsUrl;
  }, [user?.id, isAuthenticated]);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    // Check if WebSocket is disabled
    if (typeof window !== 'undefined' && (window as any).WebSocket?.toString().includes('disabled')) {
      console.log('🚫 WebSocket is disabled, skipping connection');
      return;
    }

    if (state.isConnected || state.isConnecting) {
      console.log('WebSocket connection already in progress or connected');
      return;
    }
    
    // Additional check to prevent multiple connections
    if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
      console.log('WebSocket already exists and is connecting/connected, skipping new connection');
      return;
    }

    // Don't attempt connection if user is not authenticated or has invalid ID
    if (!isAuthenticated || !user?.id || user.id.trim() === '') {
      console.log('User not authenticated or has invalid ID, skipping WebSocket connection');
      console.log('🔍 Auth state:', { isAuthenticated, userId: user?.id, userExists: !!user });
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const wsUrl = getWebSocketUrl();
      if (!wsUrl) {
        throw new Error('Failed to construct WebSocket URL - no token available');
      }

      // Check if server is reachable before attempting WebSocket connection
      if (import.meta.env.DEV) {
        try {
          // In development, check if the proxy target is reachable
          const serverCheck = await fetch('/api/health', {
            method: 'GET',
            signal: AbortSignal.timeout(3000) // 3 second timeout
          });
          if (!serverCheck.ok) {
            console.warn('Server health check failed, but proceeding with WebSocket connection');
          } else {
            console.log('✅ Server health check passed');
          }
        } catch (healthError) {
          console.warn('Server health check failed, but proceeding with WebSocket connection:', healthError instanceof Error ? healthError.message : String(healthError));
        }
      }

      console.log('🔌 Attempting to connect to WebSocket:', wsUrl);
      console.log('📍 Current location:', window.location.href);
      console.log('🌐 Environment:', import.meta.env.DEV ? 'development' : 'production');
      
      // Add timeout for WebSocket connection
      const connectionTimeout = setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
          console.warn('WebSocket connection timeout, closing connection');
          wsRef.current.close();
        }
      }, 10000); // 10 second timeout

      // Validate WebSocket URL before creating connection
      if (!wsUrl || wsUrl.includes('undefined') || wsUrl.includes('null')) {
        throw new Error(`Invalid WebSocket URL: ${wsUrl}`);
      }

      console.log('🚀 Creating WebSocket instance...');
      const ws = new WebSocket(wsUrl);
      console.log('✅ WebSocket instance created successfully');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        clearTimeout(connectionTimeout);
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
          connectionAttempts: 0
        }));
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          onMessage?.(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        clearTimeout(connectionTimeout);
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false
        }));
        onDisconnect?.();

        // Handle reconnection
        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          setState(prev => ({
            ...prev,
            connectionAttempts: reconnectAttemptsRef.current
          }));

          console.log(`Attempting reconnection ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval * reconnectAttemptsRef.current); // Exponential backoff
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          const errorMsg = 'Max reconnection attempts reached';
          console.error(errorMsg);
          setState(prev => ({
            ...prev,
            error: errorMsg
          }));
          onError?.(errorMsg);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        clearTimeout(connectionTimeout);
        const errorMessage = `WebSocket connection error: ${error}`;
        setState(prev => ({ ...prev, error: errorMessage }));
        onError?.(errorMessage);

        // Close connection immediately on error
        if (wsRef.current) {
          wsRef.current.close();
        }
      };

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage
      }));
      onError?.(errorMessage);
    }
  }, [state.isConnected, state.isConnecting, getWebSocketUrl, autoReconnect, maxReconnectAttempts, reconnectInterval, onConnect, onDisconnect, onError]);

  // Disable WebSocket if connection fails multiple times
  const disableWebSocket = useCallback(() => {
    console.warn('Disabling WebSocket due to repeated connection failures');
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      error: 'WebSocket disabled due to connection failures'
    }));
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Auto-disable WebSocket after multiple failed attempts
  useEffect(() => {
    if (state.connectionAttempts >= maxReconnectAttempts && autoReconnect) {
      disableWebSocket();
    }
  }, [state.connectionAttempts, maxReconnectAttempts, autoReconnect, disableWebSocket]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      connectionAttempts: 0
    }));
    reconnectAttemptsRef.current = 0;
  }, []);

  // Send message
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('Sending WebSocket message:', message);
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('Cannot send message - WebSocket not connected');
    return false;
  }, []);

  // Start streaming
  const startStream = useCallback((streamType: string, config: any) => {
    console.log('Starting stream:', streamType, config);
    return sendMessage({
      type: 'start_stream',
      streamType,
      config
    });
  }, [sendMessage]);

  // Stop streaming
  const stopStream = useCallback((streamId: string) => {
    console.log('Stopping stream:', streamId);
    return sendMessage({
      type: 'stop_stream',
      streamId
    });
  }, [sendMessage]);

  // Send heartbeat
  const sendHeartbeat = useCallback(() => {
    return sendMessage({
      type: 'heartbeat',
      timestamp: Date.now()
    });
  }, [sendMessage]);

  // Auto-connect when user is authenticated
  useEffect(() => {
    // Only attempt to connect when user is authenticated, has a valid ID, and auth is not loading
    if (isAuthenticated && user?.id && user.id.trim() !== '' && !state.isConnected && !state.isConnecting) {
      console.log('User authenticated with valid ID, attempting WebSocket connection...');
      console.log('🔍 Connection details:', { userId: user.id, isAuthenticated });
      // Add a small delay to ensure authentication is fully settled
      setTimeout(() => connect(), 100);
    } else if (!isAuthenticated && state.isConnected) {
      // Disconnect when user becomes unauthenticated
      console.log('User unauthenticated, disconnecting WebSocket...');
      disconnect();
    } else if (!isAuthenticated || !user?.id || user.id.trim() === '') {
      console.log('🔍 Skipping WebSocket connection - auth state:', {
        isAuthenticated,
        userId: user?.id,
        userExists: !!user,
        isConnected: state.isConnected,
        isConnecting: state.isConnecting
      });
    }
  }, [isAuthenticated, user?.id, state.isConnected, state.isConnecting, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Heartbeat interval
  useEffect(() => {
    if (!state.isConnected) return;

    const heartbeatInterval = setInterval(() => {
      sendHeartbeat();
    }, 30000); // 30 seconds

    return () => clearInterval(heartbeatInterval);
  }, [state.isConnected, sendHeartbeat]);

  return {
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    error: state.error,
    connectionAttempts: state.connectionAttempts,
    connect,
    disconnect,
    sendMessage,
    startStream,
    stopStream,
    sendHeartbeat
  };
} 