import { useEffect, useRef, useState } from 'react';
import { webSocketService } from '@/services/WebSocketService';
import { useAuth } from '@/hooks/useAuth';

interface WebSocketMessage {
  type: string;
  data?: any;
  [key: string]: any;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useWebSocketSingleton(options: UseWebSocketOptions = {}) {
  const { isAuthenticated, user } = useAuth();
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null
  });

  const callbacksRef = useRef<UseWebSocketOptions>(options);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Update callbacks when they change
  useEffect(() => {
    callbacksRef.current = options;
  }, [options]);

  // Connect to WebSocket when authenticated
  useEffect(() => {
    // Check if WebSocket is disabled
    if (typeof window !== 'undefined' && (window as any).WebSocket?.toString().includes('disabled')) {
      console.log('🚫 WebSocket is disabled, skipping connection');
      return;
    }

    if (isAuthenticated && user?.id) {
      console.log('🔌 Connecting to WebSocket (singleton) for user:', user.id);
      
      // Subscribe to WebSocket service
      unsubscribeRef.current = webSocketService.subscribe({
        onMessage: (message) => {
          callbacksRef.current.onMessage?.(message);
        },
        onConnect: () => {
          setState(prev => ({ ...prev, isConnected: true, isConnecting: false, error: null }));
          callbacksRef.current.onConnect?.();
        },
        onDisconnect: () => {
          setState(prev => ({ ...prev, isConnected: false, isConnecting: false }));
          callbacksRef.current.onDisconnect?.();
        },
        onError: (error) => {
          setState(prev => ({ ...prev, error, isConnecting: false }));
          callbacksRef.current.onError?.(error);
        }
      });

      // Connect to WebSocket
      webSocketService.connect();

      // Update state based on current connection
      const connectionState = webSocketService.getConnectionState();
      setState(prev => ({
        ...prev,
        isConnected: connectionState.isConnected,
        isConnecting: connectionState.isConnecting,
        error: connectionState.error
      }));

    } else {
      console.log('❌ User not authenticated, skipping WebSocket connection');
    }

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [isAuthenticated, user?.id]);

  const sendMessage = (message: WebSocketMessage) => {
    webSocketService.sendMessage(message);
  };

  const connect = () => {
    webSocketService.connect();
  };

  const disconnect = () => {
    webSocketService.disconnect();
  };

  return {
    ...state,
    sendMessage,
    connect,
    disconnect
  };
}
