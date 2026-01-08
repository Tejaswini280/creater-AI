import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { reportClientPerfMetrics } from "./lib/utils";

// ✅ CRITICAL FIX: Ensure React is globally available and properly loaded
if (typeof window !== 'undefined') {
  (window as any).React = React;
  // Verify React is properly loaded
  if (!React || !React.useState) {
    console.error('🚨 React not properly loaded! Attempting to reload...');
    window.location.reload();
  }
}

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

// Wait for DOM to be ready and mount React app safely
function mountApp() {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error("Root element not found! Cannot mount React app.");
    // Create a fallback root element
    const fallbackRoot = document.createElement("div");
    fallbackRoot.id = "root";
    document.body.appendChild(fallbackRoot);
    console.log("Created fallback root element");
  }

  try {
    const finalRoot = document.getElementById("root");
    if (finalRoot) {
      const root = createRoot(finalRoot);
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      console.log("React app mounted successfully");
    }
  } catch (error) {
    console.error("Failed to mount React app:", error);
    // Fallback: show a simple error message
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
          <h1>CreatorAI Studio</h1>
          <p>Loading application...</p>
          <p style="color: #666; font-size: 14px;">If this message persists, please refresh the page.</p>
        </div>
      `;
    }
  }
}

// Mount the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  // DOM is already ready
  mountApp();
}

// ✅ CRITICAL FIX: Add error boundary for React hooks
window.addEventListener('error', (event) => {
  if (event.error && event.error.message && event.error.message.includes('useState')) {
    console.error('🚨 React hooks error detected:', event.error);
    console.error('🔧 Attempting to reload with fresh React context...');
    // Force reload to clear any stale React context
    setTimeout(() => window.location.reload(), 100);
  }
});

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
