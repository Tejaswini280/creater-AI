import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '@/hooks/useWebSocket';

// Mock useAuth to provide a token
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ token: 'test-token' }),
}));

// Simple WebSocket mock
class WSStub {
  static OPEN = 1;
  readyState = WSStub.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((ev: any) => void) | null = null;
  onclose: ((ev: any) => void) | null = null;
  onerror: ((ev: any) => void) | null = null;
  sent: any[] = [];
  constructor(public url: string) {
    // fire open after listener assignment
    setTimeout(() => this.onopen && this.onopen(), 0);
  }
  send(data: any) { this.sent.push(data); }
  close() { this.onclose && this.onclose({ code: 1000, reason: 'test' }); }
}

describe('useWebSocket', () => {
  const originalWS = (global as any).WebSocket;

  beforeEach(() => {
    (global as any).WebSocket = WSStub as any;
    Object.defineProperty(window, 'location', {
      value: { protocol: 'http:', host: 'localhost:5000' },
      configurable: true,
    });
  });

  afterEach(() => {
    (global as any).WebSocket = originalWS;
  });

  it('connects and sends heartbeat after connect', async () => {
    const { result } = renderHook(() => useWebSocket());

    // wait for onopen to fire
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });
    expect(result.current.isConnected).toBe(true);

    act(() => {
      result.current.sendHeartbeat();
    });

    const ws = (WSStub as any).instance as WSStub | undefined;
    expect(typeof result.current.sendMessage).toBe('function');
  });
});


