import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
const CANONICAL = "www.freedomaviationco.com";

app.enable("trust proxy"); // important when behind a proxy/load balancer

// CORS configuration - allow both www and non-www origins
const allowedOrigins = [
  "https://freedomaviationco.com",
  "https://www.freedomaviationco.com",
  "http://localhost:5000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list or starts with allowed domain
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith("https://freedomaviationco.com") ||
        origin.startsWith("http://localhost:")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Handle OPTIONS preflight requests BEFORE other middleware
app.options("/api/*", (req: Request, res: Response) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || origin.startsWith("https://freedomaviationco.com") || origin.startsWith("http://localhost:"))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Max-Age", "86400");
  }
  res.status(204).end();
});

// Only enforce canonical domain and HTTPS in production
// Skip redirect for API routes to avoid CORS issues
if (app.get("env") === "production") {
  app.use((req, res, next) => {
    // Skip redirect for API routes - they should work from both domains
    if (req.path.startsWith("/api")) {
      return next();
    }
    
    const host = (req.headers.host || "").toLowerCase();
    const proto =
      (req.headers["x-forwarded-proto"] as string) ||
      (req.secure ? "https" : "http");

    // 1) Force host to CANONICAL
    if (host !== CANONICAL) {
      return res.redirect(301, `https://${CANONICAL}${req.originalUrl}`);
    }

    // 2) Force HTTPS without adding :443
    if (proto !== "https") {
      return res.redirect(301, `https://${CANONICAL}${req.originalUrl}`);
    }

    return next();
  });
}
// Stripe webhook needs raw body for signature verification
// Register it before JSON middleware
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Log the error but don't throw - response has already been sent
      console.error("Error handler:", err);
      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const PORT = process.env.PORT || "5000";
    const startPort = parseInt(PORT, 10);
    const maxPort = startPort + 9; // Try 10 ports
    let currentPort = startPort;
    let serverStarted = false;

    const tryPort = (port: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        log(`Attempting to start server on port ${port}...`);

        const onError = (error: any) => {
          if (error.code === "EADDRINUSE") {
            log(`Port ${port} is already in use, trying next port...`);
            server.removeListener("error", onError);
            server.removeListener("listening", onListening);
            resolve();
          } else if (error.code === "EACCES") {
            log(`✗ Error: Permission denied to bind to port ${port}`);
            reject(error);
          } else {
            log(`✗ Server error: ${error.message}`);
            reject(error);
          }
        };

        const onListening = () => {
          log(`Server successfully listening on port ${port}`);
          log(`Environment: ${app.get("env")}`);
          log(`Ready to accept connections`);
          serverStarted = true;
          server.removeListener("error", onError);
          resolve();
        };

        server.once("error", onError);
        server.once("listening", onListening);

        try {
          server.listen(port, "0.0.0.0");
        } catch (err) {
          reject(err);
        }
      });
    };

    // Try ports sequentially until one works
    while (currentPort <= maxPort && !serverStarted) {
      try {
        await tryPort(currentPort);
        if (!serverStarted) {
          currentPort++;
        }
      } catch (error: any) {
        console.error("Server startup error:", error);
        process.exit(1);
      }
    }

    if (!serverStarted) {
      log(`✗ Could not start server on any port between ${startPort} and ${maxPort}`);
      log(`✗ All ports are in use. Please free up a port or specify a different PORT in your environment.`);
      process.exit(1);
    }
  } catch (error) {
    console.error("Failed to initialize server:", error);
    log(`✗ Fatal error during server initialization: ${error}`);
    process.exit(1);
  }
})();
