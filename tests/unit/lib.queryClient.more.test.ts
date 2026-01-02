import { apiRequest } from '@/lib/queryClient';

describe('apiRequest more cases', () => {
  const originalFetch = global.fetch as any;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('does not set Content-Type for FormData', async () => {
    const fd = new FormData();
    fd.append('a', '1');
    const spy = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    global.fetch = spy as any;
    await apiRequest('POST', '/x', fd);
    const init = spy.mock.calls[0][1];
    expect(init.headers['Content-Type']).toBeUndefined();
  });

  it('redirects on 401 without refresh token', async () => {
    const first = { ok: false, status: 401, json: async () => ({}) };
    const spy = jest.fn().mockResolvedValue(first);
    global.fetch = spy as any;
    Object.defineProperty(window, 'location', { value: { href: '/start' }, configurable: true });
    await expect(apiRequest('GET', '/x')).rejects.toThrow('401: Unauthorized');
    expect(window.location.href).toBe('/login');
  });

  it('throws error message when response body is not JSON', async () => {
    const resp: any = { ok: false, status: 500, json: async () => { throw new Error('no json'); } };
    global.fetch = jest.fn().mockResolvedValue(resp) as any;
    await expect(apiRequest('GET', '/oops')).rejects.toThrow('HTTP error! status: 500');
  });
});


