import { apiRequest } from '@/lib/queryClient';

describe('apiRequest', () => {
  const originalFetch = global.fetch as any;
  const originalLocation = window.location;
  const originalLocalStorage = global.localStorage;

  beforeEach(() => {
    // @ts-ignore
    delete (window as any).location;
    // @ts-ignore
    window.location = { href: '/' } as any;
    const store: Record<string, string> = {};
    // @ts-ignore
    global.localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => (store[k] = v),
      removeItem: (k: string) => delete store[k],
      clear: () => Object.keys(store).forEach((k) => delete store[k]),
    } as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    // @ts-ignore
    window.location = originalLocation;
    // @ts-ignore
    global.localStorage = originalLocalStorage;
    jest.restoreAllMocks();
  });

  it('includes credentials in fetch requests', async () => {
    const mock = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });
    global.fetch = mock as any;
    await apiRequest('GET', '/api/test');
    expect(mock).toHaveBeenCalled();
    const args = mock.mock.calls[0][1];
    expect(args.credentials).toBe('include');
  });

  it('handles 401 and triggers refresh flow once', async () => {
    const first = { ok: false, status: 401, json: async () => ({}) };
    const refresh = { ok: true, status: 200, json: async () => ({ message: 'Token refreshed successfully' }) };
    const second = { ok: true, status: 200, json: async () => ({ ok: true }) };
    const mock = jest.fn()
      .mockResolvedValueOnce(first) // original
      .mockResolvedValueOnce(refresh) // refresh
      .mockResolvedValueOnce(second); // retry
    global.fetch = mock as any;
    await apiRequest('GET', '/api/test');
    expect(mock).toHaveBeenCalledTimes(3);
  });

  it('throws detailed error for non-ok response', async () => {
    const mock = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ message: 'boom' }) });
    global.fetch = mock as any;
    await expect(apiRequest('GET', '/api/fail')).rejects.toThrow('boom');
  });
});


