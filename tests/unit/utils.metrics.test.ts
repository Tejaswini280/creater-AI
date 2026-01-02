import { reportClientPerfMetrics } from '@/lib/utils';

describe('reportClientPerfMetrics', () => {
  const originalBeacon = (navigator as any).sendBeacon;
  const originalFetch = global.fetch as any;

  afterEach(() => {
    (navigator as any).sendBeacon = originalBeacon;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('uses sendBeacon when available', () => {
    const spy = jest.fn().mockReturnValue(true);
    (navigator as any).sendBeacon = spy;
    reportClientPerfMetrics({ lcp: 1000, route: '/test' });
    expect(spy).toHaveBeenCalled();
  });

  it('falls back to fetch when sendBeacon not available', () => {
    (navigator as any).sendBeacon = undefined;
    const spy = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = spy as any;
    reportClientPerfMetrics({ fcp: 500 });
    expect(spy).toHaveBeenCalled();
  });
});


