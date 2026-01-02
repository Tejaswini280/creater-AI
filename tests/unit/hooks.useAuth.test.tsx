import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useAuth', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Reset mocks
    mockFetch.mockClear();
    localStorage.clear();

    // Mock location
    // @ts-ignore
    delete (window as any).location;
    // @ts-ignore
    window.location = { href: '/' } as any;
  });

  afterEach(() => {
    // @ts-ignore
    window.location = originalLocation;
  });

  it('sets authenticated state when user is authenticated', async () => {
    // Mock successful auth check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'u1', email: 'a@b.com', firstName: 'Test', lastName: 'User' })
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Allow effect to run
    await act(async () => Promise.resolve());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.id).toBe('u1');
    expect(result.current.user?.email).toBe('a@b.com');
  });

  it('sets unauthenticated state when user is not authenticated', async () => {
    // Mock failed auth check
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => Promise.resolve());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
  });

  it('logout clears state and makes API call', async () => {
    // Mock successful auth check first
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'u1', email: 'a@b.com', firstName: 'Test', lastName: 'User' })
    });

    // Mock logout API call
    mockFetch.mockResolvedValueOnce({
      ok: true
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => Promise.resolve());

    // Perform logout
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
  });

  it('updateUserData merges user data', async () => {
    // Mock successful auth check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'u1', email: 'a@b.com', firstName: 'Test', lastName: 'User' })
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => Promise.resolve());

    act(() => result.current.updateUserData({ lastName: 'Updated' }));

    expect(result.current.user?.lastName).toBe('Updated');
  });

  it('clearAuth removes user data', async () => {
    // Mock successful auth check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'u1', email: 'a@b.com', firstName: 'Test', lastName: 'User' })
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => Promise.resolve());

    act(() => result.current.clearAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
  });
});


