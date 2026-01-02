import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '@/hooks/useWebSocket';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ token: 'test-token' }),
}));

class WSStub {
  static OPEN = 1;
  readyState = WSStub.OPEN;
  onopen: (() => void) | null = null;
  onclose: ((ev: any) => void) | null = null;
  onerror: ((ev: any) => void) | null = null;
  onmessage: ((ev: any) => void) | null = null;
  sent: string[] = [];
  constructor(public url: string) {
    setTimeout(() => this.onopen && this.onopen(), 0);
    ;(WSStub as any).last = this;
  }
  send(data: string) { this.sent.push(data); }
  close() { this.onclose && this.onclose({ code: 1006, reason: 'network' }); }
}

describe('useWebSocket edge cases', () => {
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

  it('returns false when sending while disconnected', async () => {
    const { result } = renderHook(() => useWebSocket({ autoReconnect: false }));
    act(() => {
      result.current.disconnect();
    });
    (WSStub as any).last.readyState = 0;
    const ok = result.current.sendMessage({ type: 'x' });
    expect(ok).toBe(false);
  });

  it('start/stop stream delegates to send', async () => {
    const { result } = renderHook(() => useWebSocket());
    await act(async () => Promise.resolve());
    act(() => {
      const started = result.current.startStream('script', { a: 1 });
      expect(started).toBe(true);
      const stopped = result.current.stopStream('id-1');
      expect(stopped).toBe(true);
    });
  });

  it('handles message parse error and onError callback', async () => {
    const onMessage = jest.fn();
    const onError = jest.fn();
    renderHook(() => useWebSocket({ onMessage, onError }));
    await act(async () => new Promise(r => setTimeout(r, 0)));
    const ws: any = (WSStub as any).last;
    act(() => {
      ws.onmessage && ws.onmessage({ data: JSON.stringify({ type: 'ping' }) });
    });
    expect(onMessage).toHaveBeenCalled();
    act(() => {
      ws.onmessage && ws.onmessage({ data: 'not-json' });
      ws.onerror && ws.onerror(new Error('boom'));
    });
    expect(onError).toHaveBeenCalled();
  });
});


