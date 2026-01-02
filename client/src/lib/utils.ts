import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Report basic performance metrics to backend (non-blocking, best-effort)
function getConsent(): { necessary: boolean; analytics: boolean; marketing: boolean } | null {
  try {
    const match = document.cookie.split('; ').find((c) => c.startsWith('cookie_consent='));
    if (!match) return null;
    const raw = decodeURIComponent(match.split('=')[1] || '');
    const parsed = JSON.parse(raw);
    return {
      necessary: true,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
    };
  } catch {
    return null;
  }
}

// Simple rate limiter for performance metrics
let lastMetricsReport = 0;
const METRICS_THROTTLE_MS = 5000; // 5 seconds minimum between reports

export function reportClientPerfMetrics(metrics: Partial<{ tti: number; fcp: number; lcp: number; fid: number; cls: number; route: string }>): void {
  try {
    const consent = getConsent();
    if (!consent || consent.analytics !== true) return; // respect analytics consent

    // Throttle metrics reporting to prevent 429 errors
    const now = Date.now();
    if (now - lastMetricsReport < METRICS_THROTTLE_MS) {
      console.log('🔇 Metrics report throttled to prevent 429 errors');
      return;
    }
    lastMetricsReport = now;

    const body = JSON.stringify(metrics)
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon('/api/metrics/client', blob)
      return
    }
    fetch('/api/metrics/client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch((error) => {
      console.warn('Failed to report metrics:', error);
    })
  } catch (error) {
    console.warn('Error reporting metrics:', error);
  }
}
