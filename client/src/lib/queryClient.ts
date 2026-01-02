import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60, // 1 min stale for UX
      gcTime: 1000 * 60 * 10, // keep in cache for 10 mins
    },
  },
});

export async function apiRequest(
  method: string,
  url: string,
  data?: any,
  options?: RequestInit
): Promise<Response> {
  const attempt = async (): Promise<Response> => {
    const usingFormData = data instanceof FormData;

    // Start from provided headers; do NOT set Content-Type for FormData
    const headers: Record<string, string> = {
      ...(options?.headers as Record<string, string>),
    };

    if (!usingFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    // Use credentials: 'include' to automatically send httpOnly cookies
    const resp = await fetch(url, {
      method,
      headers,
      body: data ? (usingFormData ? data : JSON.stringify(data)) : undefined,
      credentials: 'include', // Include httpOnly cookies
      ...options,
    });
    return resp;
  };

  let response = await attempt();

  // Handle unauthorized with automatic token refresh
  if (response.status === 401) {
    try {
      // Try to refresh the token using cookies
      const refreshResp = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Include cookies for refresh
        headers: { 'Content-Type': 'application/json' },
      });

      if (refreshResp.ok) {
        // Token refreshed successfully, retry original request
        response = await attempt();
      } else {
        // Refresh failed, redirect to login
        throw new Error('Refresh failed');
      }
    } catch (e) {
      // Refresh failed, redirect to login
      console.error('Token refresh failed:', e);
      // Clear any remaining localStorage data for backward compatibility
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('401: Unauthorized');
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err: any = new Error(errorData.message || `HTTP error! status: ${response.status}`);
    err.status = response.status;
    err.data = errorData;
    throw err;
  }

  return response;
}
