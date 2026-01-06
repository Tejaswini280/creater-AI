import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { WebSocketManager } from "./websocket";
import { ContentSchedulerService } from "./services/scheduler";
import {
  authRateLimit,
  aiRateLimit,
  securityAuditLog,
  enhancedSecurityAuditLog,
  createRateLimit,
  createUserRateLimit,
  corsOptions,
  errorHandler,
  sqlInjectionPrevention,
  xssPrevention,
  requestLogger,
  sessionTimeoutWarning,
  requestIdMiddleware,
  // SecurityMonitor, // Temporarily disabled to fix startup issues
  helmetConfig
} from "./middleware/security";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import path from "path";
import { instrumentHttpMetrics } from './metrics';
import { dbOptimizer, dbMonitor } from './db/optimization';

const app = express();
const perfMode = process.env.PERF_MODE === '1';

// Set the environment explicitly
app.set('env', process.env.NODE_ENV || 'development');
console.log(`Express app environment set to: ${app.get("env")}`);
console.log(`Process NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`Process SKIP_RATE_LIMIT: ${process.env.SKIP_RATE_LIMIT}`);

// Apply security middleware to all routes
app.use(requestIdMiddleware);
// Use centralized helmet configuration to keep CSP consistent across the app
app.use(helmet(helmetConfig));

// Add baseline security headers on all responses (defense-in-depth)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// HTTPS enforcement in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});

// Centralized CORS configuration (production-ready)
app.use(cors(corsOptions));

// Enhanced rate limiting with user-specific limits (skippable in tests)
const rateLimitDisabled = process.env.SKIP_RATE_LIMIT === '1' || process.env.NODE_ENV === 'test';
const userRateLimit = createUserRateLimit(60 * 1000, 100); // 100 requests per minute per user
const globalRateLimit = createRateLimit(60 * 1000, 1000); // 1000 requests per minute globally

// Apply rate limiting to all routes (unless disabled for tests)
if (!rateLimitDisabled) {
  app.use(globalRateLimit);
  app.use('/api/', userRateLimit);
  // Stricter rate limits for sensitive/auth endpoints
  app.use('/api/auth/', authRateLimit);
  // AI endpoints are heavier; apply tighter budget across the board
  app.use('/api/ai', aiRateLimit);
  app.use('/api/gemini', aiRateLimit);
}

// Create a more lenient rate limit for metrics endpoint
const metricsRateLimit = createUserRateLimit(60 * 1000, 500); // 500 requests per minute for metrics

// Apply rate limiting to all routes (unless disabled for tests)
if (!rateLimitDisabled) {
  app.use(globalRateLimit);
  app.use('/api/', userRateLimit);
  // Override with more lenient limit for metrics
  app.use('/api/metrics/client', metricsRateLimit);
  // Stricter rate limits for sensitive/auth endpoints
  app.use('/api/auth/', authRateLimit);
  // AI endpoints are heavier; apply tighter budget across the board
  app.use('/api/ai', aiRateLimit);
  app.use('/api/gemini', aiRateLimit);
}

// Enhanced request logging (disabled in PERF_MODE for perf accuracy)
if (!perfMode) {
  app.use((req, res, next) => {
    const start = Date.now();
    const ip = (req.ip || (req.connection as any)?.remoteAddress || 'unknown') as string;
    console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${ip} - User: ${(req as any).user?.id || 'anonymous'}`);
    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const statusEmoji = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';
      console.log(`${statusEmoji} ${new Date().toISOString()} - ${req.method} ${req.url} - ${status} - ${duration}ms - IP: ${ip}`);
      if (status === 401 || status === 403 || status === 429) {
        // Temporarily disabled SecurityMonitor to fix startup issues
        // const monitor = SecurityMonitor.getInstance();
        // monitor.recordSuspiciousActivity(ip, `Security response: ${status}`, 'medium', {
        //   method: req.method,
        //   url: req.url,
        //   status,
        //   duration
        // });
      }
    });
    next();
  });
}

// Cookie parsing middleware for JWT tokens
app.use(cookieParser());

// Body parsing middleware FIRST so sanitizers can inspect parsed bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Apply security middleware to all routes
// app.use(enhancedSecurityAuditLog);

// Gzip/Brotli compression for responses
app.use(compression({ threshold: 0 }));

// Additional security middleware (now after body parsing)
// app.use(sqlInjectionPrevention);
// app.use(xssPrevention);
if (!perfMode) {
  app.use(requestLogger);
}
app.use(sessionTimeoutWarning);
if (!perfMode) {
  // app.use(securityAuditLog);
}

// Prometheus/metrics instrumentation (disabled in PERF_MODE for accuracy)
if (!perfMode) {
  instrumentHttpMetrics(app);
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

if (!perfMode) {
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;
    const originalResJson = (res.json.bind(res) as (body: any) => Response);
    res.json = ((body: unknown): Response => {
      if (body && typeof body === 'object') {
        capturedJsonResponse = body as Record<string, any>;
      } else {
        capturedJsonResponse = undefined;
      }
      return originalResJson(body);
    }) as any;
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }
        console.log(logLine);
      }
    });
    next();
  });
}

(async () => {
  // Register routes and get server instance
  const server = await registerRoutes(app);
  
  // Initialize WebSocket server
  const wsManager = new WebSocketManager(server);
  console.log("WebSocket server initialized");

  // Initialize Content Scheduler Service (non-blocking)
  try {
    const schedulerService = ContentSchedulerService.getInstance();
    await schedulerService.initialize();
    console.log("Content Scheduler Service initialized");
  } catch (error) {
    console.warn("Content Scheduler Service initialization failed (non-fatal):", error instanceof Error ? error.message : String(error));
  }

  // Make WebSocket manager globally available for routes
  (global as any).wsManager = wsManager;

  // Add WebSocket stats endpoint
  app.get('/api/websocket/stats', (req, res) => {
    res.json(wsManager.getStats());
  });

  // DB performance insights (non-sensitive summary)
  app.get('/api/db/perf', async (req, res) => {
    try {
      const [connections, queryStats, longRunning] = await Promise.all([
        dbOptimizer.getConnectionStats().catch(() => ({} as Record<string, number>)),
        Promise.resolve(dbMonitor.getQueryStats()).catch(() => ({} as Record<string, { count: number; totalTime: number; avgTime: number }>)),
        dbOptimizer.getLongRunningQueries().catch(() => ([] as Array<{ pid: number; query: string; duration: string }>)),
      ]);

      res.json({
        ok: true,
        connections,
        queryStats,
        longRunningQueries: longRunning,
      });
    } catch (_err) {
      res.status(500).json({ ok: false, error: 'failed to collect db performance metrics' });
    }
  });

  // Global error handler
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  console.log(`Server environment: ${app.get("env")}, NODE_ENV: ${process.env.NODE_ENV}`);
  if (app.get("env") === "development" && process.env.NODE_ENV !== "test") {
    console.log("Setting up Vite development server");
    try {
      // Use a conditional import that won't be processed by esbuild in production
      const viteModulePath = "./vite.js";
      const viteModule = await import(viteModulePath).catch(() => null);
      if (viteModule?.setupVite) {
        await viteModule.setupVite(app, server);
      } else {
        throw new Error("Vite module not available");
      }
    } catch (error) {
      console.error("Failed to setup Vite development server:", error);
      // Fallback to static serving in case Vite setup fails
      const { serveStatic } = await import("./static-server.js");
      serveStatic(app);
    }
  } else {
    console.log("Setting up static file server");
    const { serveStatic } = await import("./static-server.js");
    serveStatic(app);
  }

  // Attempt to create DB indexes for better performance (best-effort)
  try {
    await dbOptimizer.createIndexes();
  } catch (e) {
    console.warn('DB index creation skipped or failed (non-fatal):', (e instanceof Error ? e.message : String(e)));
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    console.log(`serving on port ${port}`);
    console.log(`WebSocket server available at ws://localhost:${port}/ws`);
  });

  // Kick off DB performance optimizations (indexes, analyze) without blocking startup
  (async () => {
    try {
      await dbOptimizer.createIndexes();
      await dbOptimizer.optimizeSlowQueries();
    } catch (e) {
      console.warn('DB optimization skipped:', e instanceof Error ? e.message : String(e));
    }
  })();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    wsManager.close();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    wsManager.close();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
})();
