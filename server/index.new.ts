/**
 * Freedom Aviation Server Entry Point
 * 
 * This is the main entry point for the Express server.
 * It initializes middleware, mounts routes, and starts the HTTP server.
 * 
 * Architecture:
 * - Configuration: server/config/env.ts
 * - Middleware: server/middleware/
 * - Routes: server/routes/
 * - Services: server/lib/
 */

import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';

// Configuration & Initialization
import { config, getAllowedOrigins } from './config/env.js';
import { initializeSupabaseClients } from './lib/supabase-clients.js';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { handlePreflight, isOriginAllowed } from './middleware/cors.js';

// Routes
import apiRoutes from './routes/index.js';

// Vite (Development server)
import { setupVite, serveStatic, log } from './vite.js';

// =============================================================================
// Application Setup
// =============================================================================

const app = express();
const CANONICAL_DOMAIN = 'www.freedomaviationco.com';

// Trust proxy (important when behind load balancer/reverse proxy)
app.enable('trust proxy');

// Initialize services
initializeSupabaseClients();

// =============================================================================
// Global Middleware
// =============================================================================

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Handle OPTIONS preflight requests before other middleware
app.options('/api/*', handlePreflight);

// =============================================================================
// Production-Only Middleware
// =============================================================================

if (config.app.nodeEnv === 'production') {
  // Enforce canonical domain and HTTPS
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Skip redirect for API routes to avoid CORS issues
    if (req.path.startsWith('/api')) {
      return next();
    }

    const host = (req.headers.host || '').toLowerCase();
    const proto = (req.headers['x-forwarded-proto'] as string) || (req.secure ? 'https' : 'http');

    // Redirect to canonical domain
    if (host !== CANONICAL_DOMAIN) {
      return res.redirect(301, `https://${CANONICAL_DOMAIN}${req.originalUrl}`);
    }

    // Redirect to HTTPS
    if (proto !== 'https') {
      return res.redirect(301, `https://${CANONICAL_DOMAIN}${req.originalUrl}`);
    }

    return next();
  });
}

// =============================================================================
// Body Parsing Middleware
// =============================================================================

// IMPORTANT: Stripe webhook requires raw body for signature verification
// This MUST come before the global JSON parser
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// JSON and URL-encoded body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// =============================================================================
// Request Logging Middleware
// =============================================================================

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined;

  // Capture JSON response for logging
  const originalResJson = res.json.bind(res);
  res.json = function (bodyJson: unknown, ...args: unknown[]) {
    capturedJsonResponse = bodyJson as Record<string, unknown>;
    return originalResJson(bodyJson, ...args);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + '…';
      }
      log(logLine);
    }
  });

  next();
});

// =============================================================================
// Auth Proxy (Supabase Auth)
// =============================================================================

// Mount auth proxy before API routes
(async () => {
  try {
    const authProxyRouter = (await import('./auth-proxy.js')).default;
    app.use('/auth', authProxyRouter);
  } catch (error) {
    console.warn('Auth proxy not loaded:', error);
  }
})();

// =============================================================================
// API Routes
// =============================================================================

app.use('/api', apiRoutes);

// =============================================================================
// SEO Routes
// =============================================================================

/**
 * GET /sitemap.xml
 * Dynamic sitemap generation
 */
app.get('/sitemap.xml', async (_req: Request, res: Response) => {
  try {
    const { generateSitemap } = await import('./lib/sitemap.js');
    const sitemap = generateSitemap();

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.send(sitemap);
  } catch (err) {
    console.error('Error generating sitemap:', err);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * GET /robots.txt
 * Dynamic robots.txt
 */
app.get('/robots.txt', (_req: Request, res: Response) => {
  const baseUrl = config.app.siteUrl || 'https://www.freedomaviationco.com';
  const robotsTxt = `# Freedom Aviation - robots.txt
User-agent: *
Allow: /

# Disallow admin and internal pages
Disallow: /admin/
Disallow: /dashboard/
Disallow: /staff/
Disallow: /api/
Disallow: /onboarding

# Allow important pages
Allow: /pricing
Allow: /about
Allow: /contact
Allow: /partners/

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay
Crawl-delay: 1

# Specific bot instructions
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /
`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(robotsTxt);
});

// =============================================================================
// Error Handling
// =============================================================================

// 404 handler for API routes
app.use('/api/*', notFoundHandler);

// Global error handler
app.use(errorHandler);

// =============================================================================
// Server Initialization
// =============================================================================

async function startServer(): Promise<void> {
  const httpServer = createServer(app);

  // Setup Vite in development, serve static files in production
  if (config.app.nodeEnv === 'development') {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  // Port configuration
  const startPort = config.app.port;
  const maxPort = startPort + 9;
  let currentPort = startPort;
  let serverStarted = false;

  const tryPort = (port: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      log(`Attempting to start server on port ${port}...`);

      const onError = (error: NodeJS.ErrnoException) => {
        httpServer.removeListener('error', onError);
        httpServer.removeListener('listening', onListening);

        if (error.code === 'EADDRINUSE') {
          log(`Port ${port} is already in use, trying next port...`);
          resolve();
        } else if (error.code === 'EACCES') {
          log(`✗ Error: Permission denied to bind to port ${port}`);
          reject(error);
        } else {
          log(`✗ Server error: ${error.message}`);
          reject(error);
        }
      };

      const onListening = () => {
        log(`✅ Server successfully listening on port ${port}`);
        log(`   Environment: ${config.app.nodeEnv}`);
        log(`   Ready to accept connections`);
        serverStarted = true;
        httpServer.removeListener('error', onError);
        resolve();
      };

      httpServer.once('error', onError);
      httpServer.once('listening', onListening);

      try {
        httpServer.listen(port, '0.0.0.0');
      } catch (err) {
        reject(err);
      }
    });
  };

  // Try ports sequentially
  while (currentPort <= maxPort && !serverStarted) {
    try {
      await tryPort(currentPort);
      if (!serverStarted) {
        currentPort++;
      }
    } catch (error) {
      console.error('Server startup error:', error);
      process.exit(1);
    }
  }

  if (!serverStarted) {
    log(`✗ Could not start server on any port between ${startPort} and ${maxPort}`);
    log(`✗ All ports are in use. Please free up a port or specify a different PORT.`);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  console.error('Failed to initialize server:', error);
  log(`✗ Fatal error during server initialization: ${error}`);
  process.exit(1);
});

export { app };

