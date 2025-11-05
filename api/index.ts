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

async function initializeApp() {
  if (initializedApp) {
    return initializedApp;
  }

  // Register routes (returns Server, but we don't need it for serverless)
  await registerRoutes(app);
  
  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Error handler:", err);
    res.status(status).json({ message });
  });

  // Serve static files in production
  serveStatic(app);

  initializedApp = app;
  return app;
}

// Export the handler for Vercel
export default async function handler(req: Request, res: Response) {
  const app = await initializeApp();
  app(req, res);
}

