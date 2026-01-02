
interface WebSocketMessage {
  type: string;
  data?: any;
  [key: string]: any;
}

interface WebSocketCallbacks {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private callbacks: Set<WebSocketCallbacks> = new Set();
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private connectionTimeout: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public subscribe(callbacks: WebSocketCallbacks): () => void {
    this.callbacks.add(callbacks);
    
    // If WebSocket is already connected, call onConnect immediately
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      callbacks.onConnect?.();
    }
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callbacks);
    };
  }

  public async connect(): Promise<void> {
    // Check if WebSocket is disabled
    if (typeof window !== 'undefined' && (window as any).WebSocket?.toString().includes('disabled')) {
      console.log('🚫 WebSocket is disabled, skipping connection');
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    if (this.isConnecting) {
      console.log('WebSocket connection already in progress');
      return;
    }

    this.isConnecting = true;

    try {
      const wsUrl = this.getWebSocketUrl();
      if (!wsUrl) {
        throw new Error('Failed to construct WebSocket URL');
      }

      console.log('🚀 Creating WebSocket connection:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      // Set up connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.error('WebSocket connection timeout');
          this.ws.close();
        }
      }, 10000);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        clearTimeout(this.connectionTimeout!);
        
        // Notify all subscribers
        this.callbacks.forEach(callback => callback.onConnect?.());
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', message);
          
          // Notify all subscribers
          this.callbacks.forEach(callback => callback.onMessage?.(message));
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        clearTimeout(this.connectionTimeout!);
        
        // Notify all subscribers
        this.callbacks.forEach(callback => callback.onDisconnect?.());

        // Handle reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
          
          setTimeout(() => {
            this.connect();
          }, this.reconnectInterval * this.reconnectAttempts);
        } else {
          console.error('❌ Max reconnection attempts reached');
          this.callbacks.forEach(callback => callback.onError?.('Max reconnection attempts reached'));
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnecting = false;
        clearTimeout(this.connectionTimeout!);
        
        this.callbacks.forEach(callback => callback.onError?.('WebSocket connection error'));
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      clearTimeout(this.connectionTimeout!);
      
      this.callbacks.forEach(callback => callback.onError?.(error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
    clearTimeout(this.connectionTimeout!);
  }

  public sendMessage(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  public getConnectionState(): {
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
  } {
    return {
      isConnected: this.ws?.readyState === WebSocket.OPEN,
      isConnecting: this.isConnecting,
      error: null
    };
  }

  private getWebSocketUrl(): string | null {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No JWT token found in localStorage');
      return null;
    }

    // Validate token format
    if (!token.includes('.') || token.split('.').length !== 3) {
      console.log('❌ Invalid JWT token format');
      return null;
    }

    // Check if we're in development mode
    const isDevelopment = import.meta.env.DEV || 
                         window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.port === '5000' ||
                         window.location.port === '3000' ||
                         window.location.port === '5173' ||
                         window.location.port === '' ||
                         window.location.href.includes('localhost') ||
                         window.location.href.includes('127.0.0.1');

    if (isDevelopment) {
      // Use relative URL in development so Vite proxy handles the connection
      const wsUrl = `/ws?token=${encodeURIComponent(token)}`;
      console.log('🎯 Development mode: Using relative WebSocket URL:', wsUrl);
      return wsUrl;
    } else {
      // Production mode - construct full URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const hostname = window.location.hostname || 'localhost';
      const port = window.location.port;

      let finalUrl: string;
      if (port && port !== '' && port !== 'undefined' && port !== 'null' && port !== '80' && port !== '443') {
        finalUrl = `${protocol}//${hostname}:${port}/ws?token=${encodeURIComponent(token)}`;
      } else {
        // Default to port 5000 for development if no port is specified
        const defaultPort = isDevelopment ? '5000' : '';
        if (defaultPort) {
          finalUrl = `${protocol}//${hostname}:${defaultPort}/ws?token=${encodeURIComponent(token)}`;
        } else {
          finalUrl = `${protocol}//${hostname}/ws?token=${encodeURIComponent(token)}`;
        }
      }

      console.log('🎯 Production mode: WebSocket URL constructed:', finalUrl);
      return finalUrl;
    }
  }
}

export const webSocketService = WebSocketService.getInstance();
