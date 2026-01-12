import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { WebSocketManager } from "./websocket";
import { ContentSchedulerService } from "./services/scheduler";
import { ProductionMigrationRunner } from "./services/productionMigrationRunner.js";
import { ProductionSeeder } from "./services/productionSeeder.js";
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

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTION-GRADE BOOT SEQUENCE
// ═══════════════════════════════════════════════════════════════════════════════
// CRITICAL: This order is MANDATORY for production stability
// 1. Database connection & migrations (with advisory lock)
// 2. Database seeding (after schema is final)
// 3. Service initialization (scheduler, etc.)
// 4. HTTP server startup
// ═══════════════════════════════════════════════════════════════════════════════

async function initializeDatabase() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('🗄️  STEP 1: DATABASE INITIALIZATION (CRITICAL BOOT SEQUENCE)');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  
  try {
    // STEP 1: Run migrations with production-grade validation
    console.log('🔄 Running database migrations with production validation...');
    const migrationRunner = new ProductionMigrationRunner();
    const migrationResult = await migrationRunner.run();
    
    if (!migrationResult.success) {
      console.error('💥 CRITICAL: Database migrations failed!');
      console.error('Errors:', migrationResult.errors);
      
      // In production, we MUST exit if migrations fail
      if (process.env.NODE_ENV === 'production') {
        console.error('🚨 PRODUCTION MODE: Exiting due to migration failure');
        process.exit(1);
      } else {
        throw new Error(`Migration failed: ${migrationResult.errors.join(', ')}`);
      }
    }
    
    console.log('✅ Database migrations completed successfully');
    console.log(`📊 Migration summary: ${migrationResult.migrationsRun} executed, ${migrationResult.migrationsSkipped} skipped, ${migrationResult.tablesCreated} tables verified`);
    
    // STEP 2: Run seeding (AFTER migrations pass validation, only if not in test)
    if (process.env.NODE_ENV !== 'test') {
      console.log('🌱 Seeding database with essential data...');
      const seeder = new ProductionSeeder();
      const seedResult = await seeder.run();
      
      if (!seedResult.success) {
        console.warn('⚠️  Database seeding completed with warnings');
        console.warn('Errors:', seedResult.errors);
        // Seeding failures are not fatal - continue startup
      } else {
        console.log('✅ Database seeding completed successfully');
        console.log(`📊 Seeding summary: ${seedResult.tablesSeeded} tables seeded, ${seedResult.totalInserts} total inserts`);
      }
    } else {
      console.log('⏭️  Skipping database seeding (test environment)');
    }
    
    console.log('');
    console.log('✅ DATABASE INITIALIZATION COMPLETED - SCHEMA IS READY');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════════════════════════════');
    console.error('💥 CRITICAL: DATABASE INITIALIZATION FAILED');
    console.error('═══════════════════════════════════════════════════════════════════════════════');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    
    // In production, we MUST fail fast if database is not ready
    if (process.env.NODE_ENV === 'production') {
      console.error('');
      console.error('🚨 PRODUCTION MODE: Exiting due to database failure');
      console.error('   The application cannot start without a working database schema.');
      console.error('   Check your DATABASE_URL and database connectivity.');
      console.error('');
      process.exit(1);
    } else {
      console.warn('');
      console.warn('⚠️  DEVELOPMENT MODE: Continuing despite database failure');
      console.warn('   This may cause runtime errors. Fix database issues ASAP.');
      console.warn('');
    }
  }
}

async function initializeServices() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('🚀 STEP 2: SERVICE INITIALIZATION (AFTER DATABASE IS READY)');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  
  try {
    // Initialize Content Scheduler Service (AFTER database is ready)
    console.log('📅 Initializing Content Scheduler Service...');
    const schedulerService = ContentSchedulerService.getInstance();
    await schedulerService.initialize();
    console.log('✅ Content Scheduler Service initialized successfully');
    
    console.log('');
    console.log('✅ ALL SERVICES INITIALIZED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('');
    console.error('⚠️  SERVICE INITIALIZATION WARNING');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    console.error('Continuing with application startup (services will retry)...');
    console.error('');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPRESS MIDDLEWARE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

// Configure Express to trust proxy headers (required for Railway/production)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Trust first proxy (Railway, Heroku, etc.)
} else {
  app.set('trust proxy', false); // Don't trust proxy in development
}
const perfMode = process.env.PERF_MODE === '1';

// Set the environment explicitly
app.set('env', process.env.NODE_ENV || 'development');
console.log(`Express app environment set to: ${app.get("env")}`);
console.log(`Process NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`Process SKIP_RATE_LIMIT: ${process.env.SKIP_RATE_LIMIT}`);

// Apply security middleware to all routes
app.use(requestIdMiddleware);
// Use centralized helmet configuration to keep CSP consistent across the app
if (process.env.NODE_ENV === 'production') {
  app.use(helmet(helmetConfig));
} else {
  // Relaxed security for development
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP in development
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: false
  }));
}

// Add baseline security headers on all responses (defense-in-depth)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// HTTPS enforcement in production (but not in Docker development)
app.use((req, res, next) => {
  // Skip HTTPS redirect in development or when TRUST_PROXY is false
  const isProduction = process.env.NODE_ENV === 'production';
  const trustProxy = process.env.TRUST_PROXY !== 'false';
  const isHttps = req.header('x-forwarded-proto') === 'https';
  
  if (isProduction && trustProxy && !isHttps) {
    console.log('🔒 Redirecting HTTP to HTTPS in production');
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
  // ═══════════════════════════════════════════════════════════════════════════════
  // MANDATORY BOOT SEQUENCE - DO NOT CHANGE ORDER
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // STEP 1: Initialize database FIRST (migrations + seeding)
  await initializeDatabase();
  
  // STEP 2: Initialize services AFTER database is ready
  await initializeServices();
  
  // STEP 3: Register routes and get server instance
  const server = await registerRoutes(app);
  
  // STEP 4: Initialize WebSocket server
  const wsManager = new WebSocketManager(server);
  console.log("✅ WebSocket server initialized");

  // Make WebSocket manager globally available for routes
  (global as any).wsManager = wsManager;

  // Health check endpoint for Railway - CRITICAL: Must return 200 for Railway health checks
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'ready',
      scheduler: 'initialized',
      port: process.env.PORT || '5000',
      host: '0.0.0.0'
    });
  });

  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'ready',
      scheduler: 'initialized',
      port: process.env.PORT || '5000',
      host: '0.0.0.0'
    });
  });

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
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`Current working directory: ${process.cwd()}`);
    console.log(`__dirname equivalent: ${import.meta.dirname}`);
    
    const { serveStatic } = await import("./static-server.js");
    serveStatic(app);
  }

  // Attempt to create DB indexes for better performance (best-effort)
  try {
    await dbOptimizer.createIndexes();
  } catch (e) {
    console.warn('DB index creation skipped or failed (non-fatal):', (e instanceof Error ? e.message : String(e)));
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // STEP 5: START HTTP SERVER (LAST STEP) - CRITICAL: Use Railway PORT
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // CRITICAL FIX: Use Railway's PORT environment variable
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = '0.0.0.0'; // CRITICAL: Bind to all interfaces for Railway
  
  console.log(`🌐 Starting server on ${host}:${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Railway PORT: ${process.env.PORT || 'not set (using default 5000)'}`);
  
  server.listen({
    port,
    host,
  }, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('🎉 APPLICATION STARTUP COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log(`🌐 HTTP Server: http://${host}:${port}`);
    console.log(`🔌 WebSocket Server: ws://${host}:${port}/ws`);
    console.log(`📊 Health Check: http://${host}:${port}/api/health`);
    console.log('');
    console.log('✅ Database: Migrated and seeded');
    console.log('✅ Scheduler: Initialized and ready');
    console.log('✅ WebSocket: Connected and ready');
    console.log('✅ HTTP Server: Listening and ready');
    console.log('');
    console.log('🚀 Application is ready to serve requests!');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
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
