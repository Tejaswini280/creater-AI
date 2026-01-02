import type { Express, Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Prometheus Registry and Default Metrics
export const metricsRegistry = new client.Registry();
client.collectDefaultMetrics({ register: metricsRegistry, prefix: 'creatornexus_' });

// HTTP request duration histogram (milliseconds)
const httpRequestDurationMs = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [25, 50, 100, 200, 300, 400, 500, 750, 1000, 2000, 5000],
  registers: [metricsRegistry],
});

// Inflight requests gauge
const inflightRequests = new client.Gauge({
  name: 'http_inflight_requests',
  help: 'Current number of inflight HTTP requests',
  registers: [metricsRegistry],
});

// RSS/heap gauges (updated by /api/metrics and default collectors)
export const heapUsedGauge = new client.Gauge({
  name: 'process_heap_used_bytes',
  help: 'Process heap used in bytes',
  registers: [metricsRegistry],
});

export function instrumentHttpMetrics(app: Express): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    inflightRequests.inc();
    const end = httpRequestDurationMs.startTimer({ method: req.method });
    const startTime = Date.now();

    res.on('finish', () => {
      const route = (req.route?.path || req.path || 'unknown').toString();
      end({ route, status_code: String(res.statusCode) });
      inflightRequests.dec();

      // Lightweight alerting: warn if any API request exceeds 500ms
      const durationMs = Date.now() - startTime;
      if (route.startsWith('/api') && durationMs > 500) {
        console.warn(`PERF WARN: ${req.method} ${route} ${res.statusCode} took ${durationMs}ms (>500ms)`);
      }
    });

    next();
  });
}

export async function renderPrometheusMetrics(res: Response): Promise<void> {
  res.setHeader('Content-Type', metricsRegistry.contentType);
  res.end(await metricsRegistry.metrics());
}


