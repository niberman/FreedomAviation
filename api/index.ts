// Vercel serverless function entry point
// This wraps the Express app for Vercel's serverless environment
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";
import { serveStatic } from "../server/vite";

const app = express();

app.enable("trust proxy");

// Production middleware
if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
  const CANONICAL = "www.freedomaviationco.com";
  app.use((req, res, next) => {
    const host = (req.headers.host || "").toLowerCase();
    const proto =
      (req.headers["x-forwarded-proto"] as string) ||
      (req.secure ? "https" : "http");

    if (host !== CANONICAL) {
      return res.redirect(301, `https://${CANONICAL}${req.originalUrl}`);
    }

    if (proto !== "https") {
      return res.redirect(301, `https://${CANONICAL}${req.originalUrl}`);
    }

    return next();
  });
}

// Stripe webhook needs raw body
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

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

// Initialize app and routes
let initializedApp: express.Express | null = null;
let initializationPromise: Promise<express.Express> | null = null;

async function initializeApp(): Promise<express.Express> {
  if (initializedApp) {
    return initializedApp;
  }

  // If already initializing, wait for that promise
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = (async () => {
    try {
      console.log("🚀 Initializing Express app...");
      console.log("🚀 Environment variables check:");
      console.log("  - SUPABASE_URL:", !!process.env.SUPABASE_URL);
      console.log("  - SUPABASE_SERVICE_ROLE_KEY:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      console.log("  - STRIPE_SECRET_KEY:", !!process.env.STRIPE_SECRET_KEY);
      console.log("  - RESEND_API_KEY:", !!process.env.RESEND_API_KEY);
      console.log("  - EMAIL_SERVICE:", process.env.EMAIL_SERVICE || "not set");
      
      // Register routes (returns Server, but we don't need it for serverless)
      console.log("🚀 Registering routes...");
      await registerRoutes(app);
      console.log("✅ Routes registered");
      
      // Error handler
      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        console.error("❌ Error handler:", err);
        console.error("❌ Error stack:", err.stack);
        if (!res.headersSent) {
          res.status(status).json({ message });
        }
      });

      // Serve static files in production (but only if not in Vercel, which handles static files separately)
      // In Vercel, static files are served from outputDirectory, so we only need to handle API routes
      // For non-API routes, Vercel will serve the index.html from the build output
      try {
        serveStatic(app);
      } catch (staticError: any) {
        // If static serving fails, log but don't crash - Vercel handles static files
        console.warn("⚠️ Static file serving failed (expected in Vercel):", staticError.message);
        // Add a fallback route handler for non-API routes
        app.use((req, res, next) => {
          if (req.path.startsWith("/api/")) {
            return next();
          }
          // For non-API routes, return 404 or let Vercel handle it
          res.status(404).json({ error: "Not found" });
        });
      }

      initializedApp = app;
      console.log("✅ Express app initialized successfully");
      return app;
    } catch (error: any) {
      console.error("❌ Failed to initialize app:", error);
      console.error("❌ Error message:", error?.message);
      console.error("❌ Error stack:", error?.stack);
      initializationPromise = null; // Reset on error so we can retry
      throw error;
    }
  })();

  return initializationPromise;
}

// Export the handler for Vercel
export default async function handler(req: Request, res: Response) {
  try {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    const app = await initializeApp();
    
    // Wrap Express handler in a promise to properly handle async operations
    return new Promise<void>((resolve, reject) => {
      // Set up handlers to know when the response is done
      let resolved = false;
      
      const finishHandler = () => {
        if (!resolved) {
          resolved = true;
          console.log(`[${new Date().toISOString()}] Response finished with status ${res.statusCode}`);
          resolve();
        }
      };
      
      const errorHandler = (err: Error) => {
        if (!resolved) {
          resolved = true;
          console.error('Response error:', err);
          if (!res.headersSent) {
            res.status(500).json({ 
              error: "Internal Server Error",
              message: err?.message || "Unknown error"
            });
          }
          reject(err);
        }
      };
      
      res.once('finish', finishHandler);
      res.once('error', errorHandler);
      res.once('close', finishHandler);
      
      // Call Express app handler
      app(req, res, (err: any) => {
        if (err) {
          console.error('Express handler error:', err);
          if (!res.headersSent && !resolved) {
            resolved = true;
            res.status(500).json({ 
              error: "Internal Server Error",
              message: err?.message || "Unknown error"
            });
          }
          if (!resolved) {
            reject(err);
          }
        }
      });
      
      // Timeout safety - if no response after 30 seconds, reject
      setTimeout(() => {
        if (!resolved && !res.headersSent) {
          resolved = true;
          console.error('Handler timeout - no response after 30s');
          res.status(504).json({ 
            error: "Gateway Timeout",
            message: "Request took too long to process"
          });
          resolve();
        }
      }, 30000);
    });
  } catch (error: any) {
    console.error("Handler initialization error:", error);
    console.error("Error stack:", error?.stack);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "Internal Server Error",
        message: error?.message || "Unknown error",
        details: process.env.NODE_ENV === "development" ? error?.stack : undefined
      });
    }
    return Promise.resolve();
  }
}

