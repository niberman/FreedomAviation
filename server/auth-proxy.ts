import { Router, type Request, type Response } from "express";

const router = Router();

// Proxy all /auth/* requests to Supabase
router.all("/:path(*)", async (req: Request, res: Response) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    
    if (!supabaseUrl) {
      return res.status(500).json({ error: "Supabase URL not configured" });
    }

    // Build the target URL
    const targetUrl = `${supabaseUrl}/auth/${req.params.path}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;
    
    console.log(`[Auth Proxy] ${req.method} ${req.originalUrl} → ${targetUrl}`);

    // Forward the request to Supabase
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...Object.fromEntries(
          Object.entries(req.headers)
            .filter(([key]) => 
              // Forward only relevant headers, skip host/connection
              !['host', 'connection', 'content-length'].includes(key.toLowerCase())
            )
            .map(([key, value]) => [key, Array.isArray(value) ? value.join(', ') : value as string])
        ),
        'Content-Type': req.headers['content-type'] || 'application/json',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    // Forward the response from Supabase back to the client
    const responseData = await response.text();
    
    // Copy response headers
    response.headers.forEach((value, key) => {
      // Skip certain headers that shouldn't be forwarded
      if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    res.status(response.status).send(responseData);
  } catch (error: any) {
    console.error("[Auth Proxy] Error:", error);
    res.status(500).json({ 
      error: "Auth proxy error", 
      message: error.message 
    });
  }
});

export default router;

