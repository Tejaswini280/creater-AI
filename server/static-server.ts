import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { log } from "./utils/logger";

export { log };

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  console.log(`Serving static files from: ${distPath}`);

  // Static assets with long-term caching in production
  app.use(
    express.static(distPath, {
      setHeaders: (res, filePath) => {
        const isAsset = /\.(js|css|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|otf)$/i.test(
          filePath,
        );
        if (isAsset) {
          // cache immutable assets for 30 days; index.html must not be cached
          res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
        } else {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    }),
  );

  // Health check endpoint should return before the catch-all
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      staticPath: distPath,
      staticExists: fs.existsSync(distPath)
    });
  });

  // fall through to index.html if the file doesn't exist (SPA routing)
  app.use("*", (req, res) => {
    // Don't serve index.html for API routes
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    res.setHeader('Cache-Control', 'no-cache');
    const indexPath = path.resolve(distPath, "index.html");
    
    if (!fs.existsSync(indexPath)) {
      return res.status(500).json({ 
        error: 'index.html not found',
        path: indexPath,
        distPath: distPath
      });
    }
    
    res.sendFile(indexPath);
  });
}