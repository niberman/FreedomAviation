import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

// robust dirname for ESM
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const viteLogger = createLogger();

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
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      // don't kill the whole node process on dev errors
      error: (msg, options) => {
        viteLogger.error(msg, options);
        // process.exit(1); // removed
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    try {
      const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // match vite build output: dist/public/*
  const distPublic = path.resolve(__dirname, "..", "dist", "public");

  if (!fs.existsSync(distPublic)) {
    throw new Error(
      `Could not find built client at: ${distPublic}. Run "npm run build" first.`
    );
  }

  app.use(express.static(distPublic, { index: "index.html", maxAge: "1h" }));
  app.use("*", (_req, res) => {
    res.sendFile(path.join(distPublic, "index.html"));
  });
}
