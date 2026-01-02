import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";

import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  try {
    // Dynamically import Vite only when needed
    const { createServer: createViteServer, createLogger } = await import("vite");
    const viteConfig = (await import("../vite.config")).default;
    
    const viteLogger = createLogger();

    const serverOptions = {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true as true,
      fs: {
        strict: false,
        allow: ['..']
      }
    };

    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg: string, options?: any) => {
          viteLogger.error(msg, options);
          // In development, do not kill the entire server on Vite errors.
          // This avoids a scenario where index.html is served but module requests fail
          // with ERR_CONNECTION_RESET/REFUSED because the process exited.
          // Opt-in strict behavior only when explicitly requested.
          if (process.env.STRICT_VITE === '1') {
            process.exit(1);
          }
        },
      },
      server: serverOptions,
      appType: "custom",
      optimizeDeps: {
        include: ['react', 'react-dom', '@tanstack/react-query']
      }
    });

    // Let Vite handle all requests first (including module imports)
    app.use(vite.middlewares);
    
    // Handle SPA routing for non-API routes
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      // Skip API routes - let them be handled by the API middleware
      if (url.startsWith('/api/')) {
        return next();
      }

      // Skip all file requests - let Vite handle them completely
      // This includes .ts, .tsx, .js, .jsx, .css, .png, etc.
      if (url.includes('.')) {
        return next();
      }

      try {
        const clientTemplate = path.resolve(
          import.meta.dirname,
          "..",
          "client",
          "index.html",
        );

        // always reload the index.html file from disk incase it changes
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        // Inject SSR-style head tags per route (title, description, canonical)
        const publicBase = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
        const routeMeta: Record<string, { title: string; description: string; path: string } > = {
          '/': { title: 'CreatorAI Studio – AI-Powered Content Creation Platform', description: 'Generate scripts, voiceovers, thumbnails, schedule posts, and analyze performance with AI.', path: '/' },
          '/login': { title: 'Login – CreatorAI Studio', description: 'Sign in to CreatorAI Studio to access your content dashboard and AI tools.', path: '/login' },
          '/dashboard': { title: 'Dashboard – CreatorAI Studio', description: 'Overview of your content performance, schedules, and AI insights.', path: '/' },
          '/content': { title: 'Content Studio – CreatorAI Studio', description: 'Create and manage your content across platforms with AI assistance.', path: '/content' },
          '/content-studio': { title: 'Content Studio – CreatorAI Studio', description: 'Create and manage your content across platforms with AI assistance.', path: '/content-studio' },
          '/content/recent': { title: 'Recent Content – CreatorAI Studio', description: 'Review and manage your most recent content items and drafts.', path: '/content/recent' },
          '/ai': { title: 'AI Generator – CreatorAI Studio', description: 'Generate scripts, ideas, and optimize content with AI.', path: '/ai' },
          '/analytics': { title: 'Analytics – CreatorAI Studio', description: 'Analyze performance and gain insights for your content.', path: '/analytics' },
          '/scheduler': { title: 'Scheduler – CreatorAI Studio', description: 'Schedule and automate publishing across social platforms.', path: '/scheduler' },
          '/templates': { title: 'Templates – CreatorAI Studio', description: 'Explore and use content templates to accelerate creation.', path: '/templates' },
          '/linkedin': { title: 'LinkedIn Integration – CreatorAI Studio', description: 'Connect LinkedIn and publish posts with analytics tracking.', path: '/linkedin' },
          '/gemini': { title: 'Creator Studio – CreatorAI Studio', description: 'Advanced generative features via Google Gemini.', path: '/gemini' },
          '/assets': { title: 'Assets – CreatorAI Studio', description: 'Upload, manage, and optimize your media assets.', path: '/assets' },
          '/notifications': { title: 'Notifications – CreatorAI Studio', description: 'Stay up to date with system and content notifications.', path: '/notifications' },
          '/social-media': { title: 'Social Media Dashboard – CreatorAI Studio', description: 'AI-powered social media management with automated scheduling and analytics.', path: '/social-media' },
          '/privacy': { title: 'Privacy Policy – CreatorAI Studio', description: 'Read our privacy practices and data protection policies.', path: '/privacy' },
          '/terms': { title: 'Terms of Service – CreatorAI Studio', description: 'Review the terms and conditions of using CreatorAI Studio.', path: '/terms' },
        };

        const pathOnly = url.split('?')[0].split('#')[0];
        const meta = routeMeta[pathOnly] || routeMeta['/'];
        const canonical = `${publicBase}${meta.path}`;

        const headInject = [
          `<title>${meta.title}</title>`,
          `<link rel="canonical" href="${canonical}" />`,
          `<meta name="description" content="${meta.description}" />`,
          `<meta property="og:title" content="${meta.title}" />`,
          `<meta property="og:description" content="${meta.description}" />`,
          `<meta property="og:url" content="${canonical}" />`,
          `<meta property="og:site_name" content="CreatorAI Studio"/>`,
          `<meta name="twitter:title" content="${meta.title}" />`,
          `<meta name="twitter:description" content="${meta.description}" />`,
        ].join('\n');

        // Replace <title> and insert canonical/meta before </head>
        template = template
          .replace(/<title>[\s\S]*?<\/title>/i, `<title>${meta.title}</title>`)
          .replace('</head>', `\n${headInject}\n</head>`);
        
        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } catch (error) {
    console.error("Failed to setup Vite development server:", error);
    throw error;
  }
}

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
