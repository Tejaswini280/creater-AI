import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWebSocketSingleton } from '@/hooks/useWebSocketSingleton';
import { Wifi, WifiOff, PlayCircle, Square, MessageSquare } from 'lucide-react';

export default function WebSocketTest() {
  const [messages, setMessages] = useState<any[]>([]);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);

  const {
    isConnected,
    isConnecting,
    error: wsError,
    startStream,
    stopStream,
    sendMessage
  } = useWebSocketSingleton({
    onMessage: (message) => {
      setMessages(prev => [...prev, { ...message, timestamp: new Date().toISOString() }]);
      
      if (message.type === 'stream_started') {
        setCurrentStreamId(message.streamId);
      } else if (message.type === 'stream_stopped' || message.type === 'error') {
        setCurrentStreamId(null);
      }
    },
    onConnect: () => {
      setMessages(prev => [...prev, { 
        type: 'system', 
        message: 'WebSocket connected successfully',
        timestamp: new Date().toISOString()
      }]);
    },
    onDisconnect: () => {
      setMessages(prev => [...prev, { 
        type: 'system', 
        message: 'WebSocket disconnected',
        timestamp: new Date().toISOString()
      }]);
      setCurrentStreamId(null);
    },
    onError: (error) => {
      setMessages(prev => [...prev, { 
        type: 'error', 
        message: error,
        timestamp: new Date().toISOString()
      }]);
    }
  });

  const handleStartScriptGeneration = () => {
    const success = startStream('script_generation', {
      topic: 'AI and Machine Learning',
      platform: 'youtube',
      duration: '5 minutes'
    });

    if (success) {
      setMessages(prev => [...prev, { 
        type: 'system', 
        message: 'Started script generation stream',
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const handleStartContentAnalysis = () => {
    const success = startStream('content_analysis', {
      content: 'Sample content for analysis'
    });

    if (success) {
      setMessages(prev => [...prev, { 
        type: 'system', 
        message: 'Started content analysis stream',
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const handleStartTrendMonitoring = () => {
    const success = startStream('trend_monitoring', {
      niche: 'technology',
      platform: 'youtube'
    });

    if (success) {
      setMessages(prev => [...prev, { 
        type: 'system', 
        message: 'Started trend monitoring stream',
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const handleStopStream = () => {
    if (currentStreamId) {
      stopStream(currentStreamId);
      setMessages(prev => [...prev, { 
        type: 'system', 
        message: `Stopped stream: ${currentStreamId}`,
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const handleSendHeartbeat = () => {
    sendMessage({
      type: 'heartbeat',
      timestamp: Date.now()
    });
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">WebSocket Test</h1>
        <div className="flex items-center space-x-2">
          <Badge 
            variant={isConnected ? "default" : "secondary"}
            className={isConnected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3 mr-1" />
                Connected
              </>
            ) : isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1"></div>
                Connecting...
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" />
                Disconnected
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Status</h3>
              <p className="text-sm text-gray-600">
                {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Active Stream</h3>
              <p className="text-sm text-gray-600">
                {currentStreamId ? currentStreamId : 'None'}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Error</h3>
              <p className="text-sm text-red-600">
                {wsError || 'None'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stream Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Stream Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={handleStartScriptGeneration}
              disabled={!isConnected || !!currentStreamId}
              className="w-full"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Script Generation
            </Button>
            
            <Button
              onClick={handleStartContentAnalysis}
              disabled={!isConnected || !!currentStreamId}
              className="w-full"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Content Analysis
            </Button>
            
            <Button
              onClick={handleStartTrendMonitoring}
              disabled={!isConnected || !!currentStreamId}
              className="w-full"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Trend Monitoring
            </Button>
            
            <Button
              onClick={handleStopStream}
              disabled={!currentStreamId}
              variant="outline"
              className="w-full"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Stream
            </Button>
          </div>
          
          <div className="mt-4">
            <Button
              onClick={handleSendHeartbeat}
              disabled={!isConnected}
              variant="outline"
              size="sm"
            >
              Send Heartbeat
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Messages ({messages.length})</CardTitle>
            <Button onClick={clearMessages} variant="outline" size="sm">
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No messages yet</p>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    msg.type === 'error' 
                      ? 'bg-red-50 border-red-200' 
                      : msg.type === 'system'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {msg.type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <pre className="text-sm whitespace-pre-wrap">
                        {JSON.stringify(msg, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 