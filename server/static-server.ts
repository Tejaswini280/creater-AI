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

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}