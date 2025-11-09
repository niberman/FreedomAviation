// Vercel serverless function entry point
// This wraps the Express app for Vercel's serverless environment
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes.js";
import { serveStatic } from "../server/vite.js";
import path from "path";
import fs from "fs";

const app = express();

app.enable("trust proxy");

// Production middleware
if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
  const CANONICAL = "www.freedomaviationco.com";
  app.use((req, res, next) => {
    // Never redirect API requests — keep them accessible from both apex and www
    if (req.path.startsWith("/api")) {
      return next();
    }

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
      console.log("  - NODE_ENV:", process.env.NODE_ENV);
      console.log("  - VERCEL_ENV:", process.env.VERCEL_ENV);
      
      // Register routes (returns Server, but we don't need it for serverless)
      console.log("🚀 Registering routes...");
      try {
        const server = await registerRoutes(app);
        console.log("✅ Routes registered, server created (not used in serverless)");
        // In serverless, we don't call server.listen(), we just use the Express app
      } catch (routeError: any) {
        console.error("❌ Error registering routes:", routeError);
        console.error("❌ Route error stack:", routeError?.stack);
        throw routeError;
      }
      
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

      // Serve static files in production
      // In Vercel, we need to handle static files because the rewrite rule sends all requests here
      const isVercel = !!process.env.VERCEL;
      console.log("🚀 Is Vercel environment:", isVercel);
      
      try {
        // Try to find the dist/public directory
        // In Vercel, the working directory (process.cwd()) is the project root
        // The build output is in dist/public (as specified in vercel.json)
        const cwd = process.cwd();
        console.log("🔍 Current working directory:", cwd);
        
        const possiblePaths = [
          path.resolve(cwd, "dist", "public"),
          path.resolve(cwd, "..", "dist", "public"),
          // In Vercel, the function might be in .vercel/output/functions
          // but the dist is at the project root
          path.resolve(cwd, "..", "..", "dist", "public"),
        ];
        
        let distPath: string | null = null;
        for (const possiblePath of possiblePaths) {
          console.log("🔍 Checking path:", possiblePath);
          if (fs.existsSync(possiblePath)) {
            distPath = possiblePath;
            console.log("✅ Found dist directory:", distPath);
            break;
          }
        }
        
        if (distPath) {
          // Serve static files - express.static will serve files if they exist, 
          // otherwise it calls next() to continue to the next middleware
          app.use(express.static(distPath, { 
            index: false, // Don't auto-serve index.html, we'll handle it manually
            fallthrough: true // Continue to next middleware if file not found
          }));
          console.log("✅ Static files configured");
          
          // Fallback to index.html for non-API routes (SPA routing)
          // This only runs if express.static didn't find a file
          app.use((req, res, next) => {
            // Don't serve index.html for API routes
            if (req.path.startsWith("/api/")) {
              return next();
            }
            
            // For non-API routes, serve index.html for client-side routing
            const indexPath = path.join(distPath!, "index.html");
            if (fs.existsSync(indexPath)) {
              return res.sendFile(indexPath);
            }
            
            // If index.html doesn't exist either, continue (will hit 404)
            next();
          });
        } else {
          console.warn("⚠️ Could not find dist/public directory");
          // Don't call serveStatic - it will throw if directory doesn't exist
          // Instead, set up a minimal fallback that won't crash
          app.use((req, res, next) => {
            if (req.path.startsWith("/api/")) {
              return next();
            }
            // Return a basic response for non-API routes
            res.status(200).send(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Freedom Aviation</title>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                </head>
                <body>
                  <h1>Freedom Aviation</h1>
                  <p>Application is loading...</p>
                  <p>If this page persists, please check the server logs.</p>
                </body>
              </html>
            `);
          });
        }
      } catch (staticError: any) {
        // If static serving fails, add a minimal fallback
        console.error("❌ Static file serving failed:", staticError.message);
        console.error("❌ Static error stack:", staticError.stack);
        
        // Add a fallback route handler for non-API routes
        app.use((req, res, next) => {
          if (req.path.startsWith("/api/")) {
            return next();
          }
          // For non-API routes, try to return a basic HTML response
          // This at least allows the app to load
          res.status(200).send(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Freedom Aviation</title>
                <meta http-equiv="refresh" content="0; url=${req.url}">
              </head>
              <body>
                <p>Loading...</p>
                <script>window.location.reload();</script>
              </body>
            </html>
          `);
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

