import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App";
import "./index.css";
import { reportClientPerfMetrics } from "./lib/utils";

// Proactively unregister any previously installed service workers and clear caches.
// This prevents stale cached bundles from intercepting API/WebSocket requests
// and eliminates old code that constructed invalid WebSocket URLs.
(() => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.getRegistrations().then(async (regs) => {
        if (regs.length > 0) {
          for (const reg of regs) {
            try { await reg.unregister(); } catch {}
          }
          try {
            if (typeof caches !== 'undefined') {
              const keys = await caches.keys();
              await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
            }
          } catch {}
          // Ensure a clean reload without a controlling SW
          try { window.location.reload(); } catch {}
        }
      }).catch(() => {});
    } catch {}
  }
})();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service worker registration is handled in `client/index.html`.
// Avoid double-registration to prevent cache/state inconsistencies.

// Basic web-vitals style reporting (FCP/LCP/CLS/FID)
try {
  new PerformanceObserver((entryList) => {
    const fcp = entryList.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry | undefined;
    if (fcp) {
      reportClientPerfMetrics({ fcp: Math.round(fcp.startTime) })
    }
  }).observe({ type: 'paint', buffered: true })

  new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      if ((entry as any).entryType === 'largest-contentful-paint') {
        reportClientPerfMetrics({ lcp: Math.round(entry.startTime) })
      }
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true } as any)

  // CLS
  let clsValue = 0;
  new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries() as any) {
      if (!entry.hadRecentInput) {
        clsValue += entry.value || 0;
      }
    }
    if (clsValue) {
      reportClientPerfMetrics({ cls: Math.round(clsValue * 1000) / 1000 });
    }
  }).observe({ type: 'layout-shift', buffered: true } as any)

  // FID (first input delay)
  new PerformanceObserver((entryList) => {
    const firstInput = (entryList.getEntries() as any)[0];
    if (firstInput) {
      const fid = firstInput.processingStart - firstInput.startTime;
      if (fid >= 0) {
        reportClientPerfMetrics({ fid: Math.round(fid) });
      }
    }
  }).observe({ type: 'first-input', buffered: true } as any)
} catch {}
