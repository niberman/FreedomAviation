import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendInvoiceEmail } from "./lib/email.js";

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn("⚠️  STRIPE_SECRET_KEY not set. Stripe payment features will be disabled.");
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: "2025-10-29.clover",
}) : null;

// Initialize Supabase admin client (for server-side operations)
// Prefer SUPABASE_URL for server-side (VITE_ prefix is for client-side)
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ CRITICAL: Supabase credentials not set!");
  console.error("   Required environment variables:");
  console.error("   - SUPABASE_URL or VITE_SUPABASE_URL:", supabaseUrl ? "✓" : "✗ MISSING");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗ MISSING");
  console.error("   - SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? "✓" : "✗ MISSING");
  console.error("   Some features will NOT work until these are set.");
}

if (!supabaseAnonKey) {
  console.warn("⚠️  SUPABASE_ANON_KEY not set. Authentication may not work properly.");
}

// Service role client for admin operations (bypasses RLS)
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Anon key client for verifying user tokens (respects RLS)
const supabaseAnon = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// 🧮 Utility: Normalize Stripe line items - fold fractional quantities into price
function normalizeLineItem(item: {
  price_data: {
    currency: string;
    product_data: { name: string };
    unit_amount: number;
  };
  quantity: number | string;
}): {
  price_data: {
    currency: string;
    product_data: { name: string };
    unit_amount: number;
  };
  quantity: number;
} {
  const qty = parseFloat(String(item.quantity));
  
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error(`Invalid quantity: ${item.quantity}`);
  }
  
  // If quantity is fractional, fold it into the price
  if (!Number.isInteger(qty)) {
    const adjustedPrice = Math.round(item.price_data.unit_amount * qty);
    return {
      ...item,
      price_data: {
        ...item.price_data,
        unit_amount: adjustedPrice,
      },
      quantity: 1,
    };
  }
  
  // Already integer, return as-is
  return {
    ...item,
    quantity: qty,
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Handle OPTIONS preflight requests for CORS
  app.options("/api/*", (req: Request, res: Response) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      "https://freedomaviationco.com",
      "https://www.freedomaviationco.com",
      "http://localhost:5000",
      "http://localhost:5173",
    ];
    
    if (origin && (allowedOrigins.includes(origin) || origin.startsWith("https://freedomaviationco.com") || origin.startsWith("http://localhost:"))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours
    }
    res.status(204).end();
  });

  app.get("/api/clients", async (req: Request, res: Response) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      "https://freedomaviationco.com",
      "https://www.freedomaviationco.com",
      "http://localhost:5000",
      "http://localhost:5173",
    ];

    if (
      origin &&
      (allowedOrigins.includes(origin) ||
        origin.startsWith("https://freedomaviationco.com") ||
        origin.startsWith("http://localhost:"))
    ) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    try {
      if (!supabase || !supabaseAnon) {
        return res.status(503).json({
          error: "Supabase not configured",
          message: "Server is missing Supabase credentials",
        });
      }

      const authHeader = req.headers.authorization;
      const token =
        authHeader && authHeader.startsWith("Bearer ")
          ? authHeader.substring(7)
          : null;

      if (!token) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Missing authorization token",
        });
      }

      const {
        data: { user },
        error: authError,
      } = await supabaseAnon.auth.getUser(token);

      if (authError || !user) {
        console.error("❌ Error verifying auth token for /api/clients:", authError);
        return res.status(401).json({
          error: "Unauthorized",
          message: "Invalid or expired token",
        });
      }

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("❌ Error fetching staff profile in /api/clients:", profileError);
        return res.status(500).json({
          error: "Failed to fetch user profile",
          message: profileError.message,
        });
      }

      if (!profile || !profile.role) {
        return res.status(403).json({
          error: "Forbidden",
          message: "User profile not found or role missing",
        });
      }

      if (!["admin", "cfi"].includes(profile.role)) {
        return res.status(403).json({
          error: "Forbidden",
          message: "Insufficient permissions",
        });
      }

      const { data: owners, error: ownersError } = await supabase
        .from("user_profiles")
        .select("id, full_name, email, phone, role, created_at")
        .eq("role", "owner")
        .order("created_at", { ascending: false });

      if (ownersError) {
        console.error("❌ Error fetching owners in /api/clients:", ownersError);
        return res.status(500).json({
          error: "Failed to load clients",
          message: ownersError.message,
        });
      }

      const { data: aircraftRows, error: aircraftError } = await supabase
        .from("aircraft")
        .select("owner_id");

      if (aircraftError) {
        console.error("⚠️ Error fetching aircraft for /api/clients:", aircraftError);
      }

      const aircraftCounts = new Map<string, number>();

      (aircraftRows ?? []).forEach((row: { owner_id: string | null }) => {
        if (row?.owner_id) {
          aircraftCounts.set(
            row.owner_id,
            (aircraftCounts.get(row.owner_id) ?? 0) + 1,
          );
        }
      });

      const clients = (owners ?? []).map((owner) => ({
        ...owner,
        aircraft_count: aircraftCounts.get(owner.id) ?? 0,
      }));

      res.json({
        clients,
        total: clients.length,
      });
    } catch (error: any) {
      console.error("❌ Unexpected error in /api/clients:", error);
      res.status(500).json({
        error: "Failed to load clients",
        message: error?.message || "Unknown error occurred",
      });
    }
  });

  // Test endpoint to verify routing works
  app.get("/api/test", (_req: Request, res: Response) => {
    res.json({ message: "API routes are working!", timestamp: new Date().toISOString() });
  });

  // Test email endpoint - sends a test email
  app.post("/api/test-email", async (req: Request, res: Response) => {
    try {
      const { toEmail } = req.body;
      const testEmail = toEmail || process.env.TEST_EMAIL || "test@example.com";
      
      // Send test email with sample invoice data
      await sendInvoiceEmail({
        invoiceNumber: "TEST-001",
        ownerName: "Test User",
        ownerEmail: testEmail,
        invoiceId: "test-invoice-id",
        ownerId: "test-owner-id",
        totalAmount: 250.00,
        invoiceLines: [
          {
            description: "Flight Instruction - Ground School",
            quantity: 2.0,
            unitPrice: 75.00,
            total: 150.00,
          },
          {
            description: "Flight Instruction - Air Time",
            quantity: 1.0,
            unitPrice: 100.00,
            total: 100.00,
          },
        ],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        aircraftTailNumber: "N123FA",
        paymentUrl: null, // Test email doesn't include payment link
      });
      
      res.json({ 
        success: true,
        message: "Test email sent successfully",
        to: testEmail,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("❌ Error sending test email:", error);
      res.status(500).json({ 
        error: "Failed to send test email",
        message: error.message,
      });
    }
  });

  // Stripe: Create checkout session for invoice payment
  app.post("/api/stripe/create-checkout-session", async (req: Request, res: Response) => {
    try {
      if (!stripe || !supabase) {
        return res.status(503).json({ 
          error: "Stripe or Supabase not configured. Please set STRIPE_SECRET_KEY and Supabase credentials." 
        });
      }

      const { invoiceId, userId } = req.body;

      if (!invoiceId || !userId) {
        return res.status(400).json({ error: "Missing invoiceId or userId" });
      }

      // Verify user is authenticated (you should add proper auth middleware)
      // For now, we'll verify the invoice belongs to the user

      // Fetch invoice with lines
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select(`
          *,
          invoice_lines(*)
        `)
        .eq("id", invoiceId)
        .eq("owner_id", userId)
        .single();

      if (invoiceError || !invoice) {
        return res.status(404).json({ error: "Invoice not found or access denied" });
      }

      // Only allow payment for finalized invoices
      if (invoice.status !== "finalized") {
        return res.status(400).json({ 
          error: `Invoice must be finalized before payment. Current status: ${invoice.status}` 
        });
      }

      // Check if invoice is already paid
      if (invoice.status === "paid" || invoice.paid_date) {
        return res.status(400).json({ error: "Invoice is already paid" });
      }

      // Check if invoice already has an active checkout session
      if (invoice.stripe_checkout_session_id) {
        // Try to retrieve the session to see if it's still valid
        try {
          const existingSession = await stripe.checkout.sessions.retrieve(invoice.stripe_checkout_session_id);
          if (existingSession.status === "open" || existingSession.status === "complete") {
            // Return existing session URL if it's still valid
            return res.json({ 
              checkoutUrl: existingSession.url,
              sessionId: existingSession.id 
            });
          }
        } catch (err) {
          // Session doesn't exist or is expired, continue to create new one
        }
      }

      // Calculate total amount in cents
      let totalCents = 0;
      if (invoice.invoice_lines && Array.isArray(invoice.invoice_lines)) {
        totalCents = invoice.invoice_lines.reduce((sum: number, line: any) => {
          return sum + Math.round(line.quantity * line.unit_cents);
        }, 0);
      } else {
        // Fallback to invoice amount if lines not available
        totalCents = Math.round(parseFloat(invoice.amount) * 100);
      }

      if (totalCents <= 0) {
        return res.status(400).json({ error: "Invoice amount must be greater than zero" });
      }

      // Get user email for Stripe customer
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("email, full_name")
        .eq("id", userId)
        .single();

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: invoice.invoice_lines?.map((line: any) => {
          // Ensure quantity is a valid number
          const quantity = Number(line.quantity);
          if (isNaN(quantity) || quantity <= 0) {
            throw new Error(`Invalid quantity: ${line.quantity}`);
          }
          
          // Ensure unit_amount is valid
          const unitAmount = Number(line.unit_cents);
          if (isNaN(unitAmount) || unitAmount <= 0) {
            throw new Error(`Invalid unit amount: ${line.unit_cents}`);
          }
          
          // Create line item (will be normalized to handle decimals)
          const lineItem = {
            price_data: {
              currency: "usd",
              product_data: {
                name: line.description || "Flight Instruction",
              },
              unit_amount: unitAmount,
            },
            quantity: quantity,
          };
          
          // Normalize: fold fractional quantities into price
          return normalizeLineItem(lineItem);
        }) || [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Invoice ${invoice.invoice_number}`,
              },
              unit_amount: totalCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.origin || process.env.FRONTEND_URL || "http://localhost:5000"}/dashboard/more?payment=success&invoice_id=${invoiceId}`,
        cancel_url: `${req.headers.origin || process.env.FRONTEND_URL || "http://localhost:5000"}/dashboard/more?payment=cancelled&invoice_id=${invoiceId}`,
        customer_email: userProfile?.email,
        metadata: {
          invoice_id: invoiceId,
          owner_id: userId,
          invoice_number: invoice.invoice_number,
        },
      });

      // Save checkout session ID to invoice
      await supabase
        .from("invoices")
        .update({ stripe_checkout_session_id: session.id })
        .eq("id", invoiceId);

      res.json({ 
        checkoutUrl: session.url,
        sessionId: session.id 
      });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ 
        error: "Failed to create checkout session",
        message: error.message 
      });
    }
  });

  // Stripe: Webhook handler for payment events
  // Note: This route uses raw body parsing (configured in server/index.ts)
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    try {
      if (!stripe || !supabase) {
        return res.status(503).json({ 
          error: "Stripe or Supabase not configured" 
        });
      }

      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.warn("⚠️  STRIPE_WEBHOOK_SECRET not set. Webhook verification disabled.");
        return res.status(400).json({ error: "Webhook secret not configured" });
      }

      if (!sig) {
        return res.status(400).json({ error: "Missing stripe-signature header" });
      }

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }

      // Handle the event
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          
          // Update invoice status to paid
          const invoiceId = session.metadata?.invoice_id;
          
          if (invoiceId) {
            // First, verify the invoice exists and is not already paid
            const { data: invoice, error: fetchError } = await supabase
              .from("invoices")
              .select("id, status, paid_date")
              .eq("id", invoiceId)
              .single();
            
            if (fetchError || !invoice) {
              console.error(`❌ Invoice ${invoiceId} not found:`, fetchError);
              break;
            }
            
            // Only update if not already paid
            if (invoice.status !== "paid" && !invoice.paid_date) {
              const updateData: any = {
                status: "paid",
                paid_date: new Date().toISOString().split("T")[0],
              };
              
              if (session.payment_intent) {
                updateData.stripe_payment_intent_id = session.payment_intent as string;
              }
              
              const { error: updateError } = await supabase
                .from("invoices")
                .update(updateData)
                .eq("id", invoiceId);
              
              if (updateError) {
                console.error(`Failed to update invoice ${invoiceId}:`, updateError);
              }
            }
          } else {
            console.warn("⚠️ checkout.session.completed event missing invoice_id in metadata");
          }
          break;
        }

        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          
          // If payment_intent.succeeded fires before checkout.session.completed,
          // try to find and update the invoice by payment_intent_id
          if (paymentIntent.id) {
            const { data: invoices } = await supabase
              .from("invoices")
              .select("id, status, paid_date")
              .eq("stripe_payment_intent_id", paymentIntent.id)
              .limit(1);
            
            // Also check by checkout session metadata if available
            if (!invoices || invoices.length === 0) {
              // Try to find by checkout session
              const sessions = await stripe.checkout.sessions.list({
                payment_intent: paymentIntent.id,
                limit: 1,
              });
              
              if (sessions.data.length > 0) {
                const session = sessions.data[0];
                const invoiceId = session.metadata?.invoice_id;
                
                if (invoiceId) {
                  const { data: invoice } = await supabase
                    .from("invoices")
                    .select("id, status, paid_date")
                    .eq("id", invoiceId)
                    .single();
                  
                  if (invoice && invoice.status !== "paid" && !invoice.paid_date) {
                    await supabase
                      .from("invoices")
                      .update({
                        status: "paid",
                        paid_date: new Date().toISOString().split("T")[0],
                        stripe_payment_intent_id: paymentIntent.id,
                      })
                      .eq("id", invoiceId);
                  }
                }
              }
            }
          }
          break;
        }

        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.error(`❌ Payment failed: ${paymentIntent.id}`);
          
          // Optionally, you could update invoice status or send notification
          // For now, we'll just log it
          break;
        }

        default:
          // Unhandled event type
          break;
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).json({ 
        error: "Webhook handler failed",
        message: error.message 
      });
    }
  });

  // Send invoice email endpoint
  // Also allow GET for testing
  app.get("/api/invoices/send-email/test", (_req: Request, res: Response) => {
    res.json({ message: "Email endpoint is accessible", method: "GET test" });
  });
  
  // Handle OPTIONS preflight for email endpoint specifically
  app.options("/api/invoices/send-email", (req: Request, res: Response) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      "https://freedomaviationco.com",
      "https://www.freedomaviationco.com",
      "http://localhost:5000",
      "http://localhost:5173",
    ];
    
    if (origin && (allowedOrigins.includes(origin) || origin.startsWith("https://freedomaviationco.com") || origin.startsWith("http://localhost:"))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Max-Age", "86400");
    }
    res.status(204).end();
  });
  
  app.post("/api/invoices/send-email", async (req: Request, res: Response) => {
    // Set CORS headers manually as backup
    const origin = req.headers.origin;
    const allowedOrigins = [
      "https://freedomaviationco.com",
      "https://www.freedomaviationco.com",
      "http://localhost:5000",
      "http://localhost:5173",
    ];
    
    if (origin && (allowedOrigins.includes(origin) || origin.startsWith("https://freedomaviationco.com") || origin.startsWith("http://localhost:"))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    
    try {
      if (!supabase) {
        return res.status(503).json({ 
          error: "Supabase not configured" 
        });
      }

      const { invoiceId } = req.body;

      if (!invoiceId) {
        return res.status(400).json({ error: "Missing invoiceId" });
      }

      // Get authenticated user from Authorization header
      const authHeader = req.headers.authorization;
      let currentUserId: string | null = null;
      let userRole: string | null = null;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        try {
          // Verify the token and get user using anon client (respects RLS)
          const clientToUse = supabaseAnon || supabase;
          if (clientToUse) {
            const { data: { user }, error: authError } = await clientToUse.auth.getUser(token);
            if (!authError && user) {
              currentUserId = user.id;
              
              // Get user role using service role client (needed to bypass RLS for role check)
              if (supabase) {
                const { data: profile } = await supabase
                  .from("user_profiles")
                  .select("role")
                  .eq("id", user.id)
                  .single();
                
                userRole = profile?.role || null;
              }
            }
          }
        } catch (err) {
          console.warn("⚠️ Error verifying auth token:", err);
        }
      }

      // If no auth header, try to get from session/cookie (for browser requests)
      // Note: This is a simplified check - in production you'd want proper session handling
      if (!currentUserId) {
        // For now, we'll allow the request but log a warning
        // In production, you should require authentication
        console.warn("⚠️ No authentication provided for invoice send-email request");
      }

      // Fetch invoice with all necessary data
      // Try nested query first, fallback to separate queries if needed
      let invoice: any;
      let invoiceError: any;
      
      // First attempt: nested query using column-based foreign key references
      // Try the pattern used in staff-dashboard.tsx
      const invoiceQuery = await supabase
        .from("invoices")
        .select(`
          *,
          invoice_lines(*),
          owner:owner_id(full_name, email),
          aircraft:aircraft_id(id, tail_number)
        `)
        .eq("id", invoiceId)
        .single();

      if (invoiceQuery.error) {
        // Fallback: fetch invoice and related data separately
        const { data: invoiceData, error: invError } = await supabase
          .from("invoices")
          .select("*")
          .eq("id", invoiceId)
          .single();
        
        if (invError || !invoiceData) {
          console.error("❌ Error fetching invoice:", invError);
          return res.status(404).json({ error: "Invoice not found", details: invError?.message });
        }
        
        // Fetch owner
        const { data: ownerData, error: ownerError } = await supabase
          .from("user_profiles")
          .select("id, email, full_name")
          .eq("id", invoiceData.owner_id)
          .single();
        
        if (ownerError || !ownerData) {
          console.error("❌ Error fetching owner:", ownerError);
          console.error("❌ Owner ID:", invoiceData.owner_id);
          return res.status(500).json({ 
            error: "Failed to fetch owner information",
            details: ownerError?.message || "Owner not found",
            ownerId: invoiceData.owner_id
          });
        }
        
        // Fetch aircraft
        let aircraftData = null;
        if (invoiceData.aircraft_id) {
          const { data: acData, error: acError } = await supabase
            .from("aircraft")
            .select("id, tail_number")
            .eq("id", invoiceData.aircraft_id)
            .single();
          if (acError) {
            console.warn("⚠️ Error fetching aircraft:", acError);
          }
          aircraftData = acData;
        }
        
        // Fetch invoice lines
        const { data: linesData, error: linesError } = await supabase
          .from("invoice_lines")
          .select("*")
          .eq("invoice_id", invoiceId);
        
        if (linesError) {
          console.warn("⚠️ Error fetching invoice lines:", linesError);
        }
        
        invoice = {
          ...invoiceData,
          owner: ownerData,
          aircraft: aircraftData,
          invoice_lines: linesData || [],
        };
        } else {
        invoice = invoiceQuery.data;
        // Ensure owner is properly structured
        if (!invoice.owner) {
          const { data: ownerData, error: ownerError } = await supabase
            .from("user_profiles")
            .select("id, email, full_name")
            .eq("id", invoice.owner_id)
            .single();
          
          if (ownerError || !ownerData) {
            console.error("❌ Error fetching owner:", ownerError);
            return res.status(500).json({ 
              error: "Failed to fetch owner information",
              details: ownerError?.message || "Owner not found"
            });
          }
          invoice.owner = ownerData;
        }
      }

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Check authorization: Only admins or CFIs who created the invoice can send it
      if (currentUserId) {
        const isAdmin = userRole === "admin";
        const isCFI = userRole === "cfi";
        const isInvoiceCreator = invoice.created_by_cfi_id === currentUserId;

        if (!isAdmin && !(isCFI && isInvoiceCreator)) {
          return res.status(403).json({ 
            error: "Unauthorized",
            message: "Only admins or the CFI who created the invoice can send it"
          });
        }
      } else {
        // In development, allow without auth but log warning
        // In production, you should require authentication
        if (process.env.NODE_ENV === "production") {
          return res.status(401).json({ 
            error: "Unauthorized",
            message: "Authentication required"
          });
        }
        console.warn("⚠️ Allowing invoice send without authentication (development mode)");
      }

      // Only send email for finalized invoices
      if (invoice.status !== "finalized") {
        return res.status(400).json({ 
          error: `Can only send email for finalized invoices. Current status: ${invoice.status}` 
        });
      }

      // Get owner info
      const owner = invoice.owner as any;
      if (!owner || !owner.email) {
        console.error("❌ Owner data:", owner);
        console.error("❌ Invoice owner_id:", invoice.owner_id);
        return res.status(400).json({ 
          error: "Owner email not found",
          details: owner ? "Owner found but email is missing" : "Owner not found"
        });
      }

      // Transform invoice lines
      const invoiceLines = (invoice.invoice_lines || []).map((line: any) => ({
        description: line.description,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unit_cents) / 100,
        total: (Number(line.quantity) * Number(line.unit_cents)) / 100,
      }));

      // Calculate total - handle case where invoiceLines might be empty
      const totalAmount = invoiceLines.length > 0 
        ? invoiceLines.reduce((sum: number, line: { total: number }) => sum + line.total, 0)
        : Number(invoice.amount) || 0;

      // Create Stripe checkout session for payment
      let paymentUrl: string | null = null;
      if (stripe && invoice.owner_id) {
        try {
          // Check if invoice already has an active checkout session
          if (invoice.stripe_checkout_session_id) {
            try {
              const existingSession = await stripe.checkout.sessions.retrieve(invoice.stripe_checkout_session_id);
              if (existingSession.status === "open" || existingSession.status === "complete") {
                paymentUrl = existingSession.url;
              }
            } catch (err) {
              // Session doesn't exist or is expired, continue to create new one
            }
          }
          
          // Create new session if we don't have a valid one
          if (!paymentUrl) {
            // Calculate total amount in cents
            const totalCents = invoiceLines.length > 0
              ? Math.round(totalAmount * 100)
              : Math.round(Number(invoice.amount) * 100);
            
            if (totalCents > 0) {
              const frontendUrl = process.env.FRONTEND_URL || "https://www.freedomaviationco.com";
              
              // Prepare line items with proper decimal handling
              let lineItems: any[];
              if (invoiceLines.length > 0) {
                lineItems = invoiceLines.map((line: any, idx: number) => {
                  // Ensure quantity is a valid number
                  const quantity = Number(line.quantity);
                  if (isNaN(quantity) || quantity <= 0) {
                    console.error(`Invalid quantity for line ${idx}:`, line.quantity);
                    throw new Error(`Invalid quantity: ${line.quantity}`);
                  }
                  
                  const unitAmount = Math.round(line.unitPrice * 100);
                  if (unitAmount <= 0) {
                    console.error(`Invalid unit amount for line ${idx}:`, line.unitPrice);
                    throw new Error(`Invalid unit price: ${line.unitPrice}`);
                  }
                  
                  // Create line item (will be normalized to handle decimals)
                  const lineItem = {
                    price_data: {
                      currency: "usd",
                      product_data: {
                        name: line.description || "Flight Instruction",
                      },
                      unit_amount: unitAmount,
                    },
                    quantity: quantity,
                  };
                  
                  // Normalize: fold fractional quantities into price
                  return normalizeLineItem(lineItem);
                });
              } else {
                // Fallback to single line item
                lineItems = [
                  {
                    price_data: {
                      currency: "usd",
                      product_data: {
                        name: `Invoice ${invoice.invoice_number}`,
                      },
                      unit_amount: totalCents,
                    },
                    quantity: 1,
                  },
                ];
              }
              
              const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                line_items: lineItems,
                mode: "payment",
                success_url: `${frontendUrl}/dashboard/more?payment=success&invoice_id=${invoice.id}`,
                cancel_url: `${frontendUrl}/dashboard/more?payment=cancelled&invoice_id=${invoice.id}`,
                customer_email: owner.email,
                metadata: {
                  invoice_id: invoice.id,
                  owner_id: invoice.owner_id,
                  invoice_number: invoice.invoice_number,
                },
              });
              
              paymentUrl = session.url;
              
              // Save checkout session ID to invoice
              await supabase
                .from("invoices")
                .update({ stripe_checkout_session_id: session.id })
                .eq("id", invoice.id);
            }
          }
        } catch (stripeError: any) {
          console.error("Error creating Stripe checkout session:", stripeError);
          // Don't fail email sending if Stripe fails - just log the error
        }
      }

      // Send email
      try {
        await sendInvoiceEmail({
          invoiceNumber: invoice.invoice_number,
          ownerName: owner.full_name || owner.email,
          ownerEmail: owner.email,
          invoiceId: invoice.id,
          ownerId: invoice.owner_id,
          totalAmount,
          invoiceLines,
          dueDate: invoice.due_date,
          aircraftTailNumber: (invoice.aircraft as any)?.tail_number,
          paymentUrl,
        });
        
        // Return more detailed response
        const emailService = process.env.EMAIL_SERVICE || "console";
        res.json({ 
          success: true,
          message: emailService === "console" 
            ? "Email logged to console (EMAIL_SERVICE=console mode)" 
            : "Invoice email sent successfully",
          emailService,
          sent: emailService !== "console",
        });
      } catch (emailError: any) {
        console.error("Error in sendInvoiceEmail:", emailError);
        
        // Return error response instead of throwing
        return res.status(500).json({ 
          error: "Failed to send invoice email",
          message: emailError?.message || "Unknown error",
          details: {
            emailService: process.env.EMAIL_SERVICE || "console",
            hasResendKey: !!process.env.RESEND_API_KEY,
            errorType: emailError?.constructor?.name,
          }
        });
      }
    } catch (error: any) {
      console.error("Error in /api/invoices/send-email endpoint:", error);
      
      res.status(500).json({ 
        error: "Failed to send invoice email",
        message: error?.message || "Unknown error occurred",
        details: {
          errorType: error?.constructor?.name,
          stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
        }
      });
    }
  });

  // Onboarding: Create Stripe subscription
  app.post("/api/onboarding/create-subscription", async (req: Request, res: Response) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      "https://freedomaviationco.com",
      "https://www.freedomaviationco.com",
      "http://localhost:5000",
      "http://localhost:5173",
    ];
    
    if (origin && (allowedOrigins.includes(origin) || origin.startsWith("https://freedomaviationco.com") || origin.startsWith("http://localhost:"))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    try {
      if (!stripe || !supabase) {
        return res.status(503).json({ error: "Stripe or Supabase not configured" });
      }

      const { userId, membershipSelection, personalInfo } = req.body;

      if (!userId || !membershipSelection) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get user profile
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single();

      if (!userProfile) {
        return res.status(404).json({ error: "User not found" });
      }

      // Calculate price (cents)
      const priceMap: Record<string, number> = {
        'class-i': 200,
        'class-ii': 550,
        'class-iii': 1000,
      };
      const multiplierMap: Record<string, number> = {
        '0-20': 1.0,
        '20-50': 1.45,
        '50+': 1.9,
      };

      const basePrice = priceMap[membershipSelection.package_id] || 550;
      const multiplier = multiplierMap[membershipSelection.hours_band] || 1.45;
      const monthlyPrice = Math.round(basePrice * multiplier);
      const priceInCents = monthlyPrice * 100;

      // Create or get Stripe customer
      let customer;
      const existingCustomers = await stripe.customers.list({
        email: userProfile.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: userProfile.email,
          name: personalInfo?.full_name || userProfile.full_name,
          metadata: {
            user_id: userId,
          },
        });
      }

      // Create price if it doesn't exist (or use existing)
      const price = await stripe.prices.create({
        currency: 'usd',
        unit_amount: priceInCents,
        recurring: {
          interval: 'month',
        },
        product_data: {
          name: `Freedom Aviation ${membershipSelection.package_id.toUpperCase()} Membership`,
          metadata: {
            hours_band: membershipSelection.hours_band,
          },
        },
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          user_id: userId,
          package_id: membershipSelection.package_id,
          hours_band: membershipSelection.hours_band,
        },
      });

      const invoice = subscription.latest_invoice as any;
      const paymentIntent = invoice?.payment_intent;

      // Save customer and subscription IDs to user profile
      await supabase
        .from('user_profiles')
        .update({
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription.id,
        })
        .eq('id', userId);

      res.json({
        clientSecret: paymentIntent?.client_secret,
        subscriptionId: subscription.id,
        customerId: customer.id,
      });
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      res.status(500).json({
        error: 'Failed to create subscription',
        message: error.message,
      });
    }
  });

  // Onboarding: Get Stripe info
  app.get("/api/onboarding/stripe-info", async (req: Request, res: Response) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      "https://freedomaviationco.com",
      "https://www.freedomaviationco.com",
      "http://localhost:5000",
      "http://localhost:5173",
    ];
    
    if (origin && (allowedOrigins.includes(origin) || origin.startsWith("https://freedomaviationco.com") || origin.startsWith("http://localhost:"))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    try {
      if (!supabase || !supabaseAnon) {
        return res.status(503).json({ error: "Supabase not configured" });
      }

      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;

      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);

      if (authError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('stripe_customer_id, stripe_subscription_id')
        .eq('id', user.id)
        .single();

      res.json({
        customerId: profile?.stripe_customer_id,
        subscriptionId: profile?.stripe_subscription_id,
      });
    } catch (error: any) {
      console.error('Error getting stripe info:', error);
      res.status(500).json({ error: 'Failed to get stripe info' });
    }
  });

  // Onboarding: Send welcome email
  app.post("/api/onboarding/welcome-email", async (req: Request, res: Response) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      "https://freedomaviationco.com",
      "https://www.freedomaviationco.com",
      "http://localhost:5000",
      "http://localhost:5173",
    ];
    
    if (origin && (allowedOrigins.includes(origin) || origin.startsWith("https://freedomaviationco.com") || origin.startsWith("http://localhost:"))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    try {
      if (!supabase) {
        return res.status(503).json({ error: "Supabase not configured" });
      }

      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      // Get user profile
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single();

      if (!userProfile) {
        return res.status(404).json({ error: "User not found" });
      }

      // Import and call sendWelcomeEmail function
      const { sendWelcomeEmail } = await import('./lib/email.js');
      
      await sendWelcomeEmail({
        userName: userProfile.full_name || userProfile.email,
        userEmail: userProfile.email,
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error sending welcome email:', error);
      res.status(500).json({
        error: 'Failed to send welcome email',
        message: error.message,
      });
    }
  });

  // Handle OPTIONS preflight for create client endpoint
  app.options("/api/clients/create", (req: Request, res: Response) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      "https://freedomaviationco.com",
      "https://www.freedomaviationco.com",
      "http://localhost:5000",
      "http://localhost:5173",
    ];
    
    if (origin && (allowedOrigins.includes(origin) || origin.startsWith("https://freedomaviationco.com") || origin.startsWith("http://localhost:"))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Max-Age", "86400");
    }
    res.status(204).end();
  });

  // Create client endpoint (admin only)
  app.post("/api/clients/create", async (req: Request, res: Response) => {
    // Set CORS headers
    const origin = req.headers.origin;
    const allowedOrigins = [
      "https://freedomaviationco.com",
      "https://www.freedomaviationco.com",
      "http://localhost:5000",
      "http://localhost:5173",
    ];
    
    if (origin && (allowedOrigins.includes(origin) || origin.startsWith("https://freedomaviationco.com") || origin.startsWith("http://localhost:"))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    try {
      if (!supabase) {
        return res.status(503).json({ 
          error: "Supabase not configured" 
        });
      }

      const { email, password, full_name, phone } = req.body;

      if (!email || !password || !full_name) {
        return res.status(400).json({ 
          error: "Missing required fields",
          message: "Email, password, and full name are required"
        });
      }

      // Create auth user using admin API
      const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name,
        },
      });

      if (createError) {
        console.error("Error creating auth user:", createError);
        return res.status(400).json({ 
          error: "Failed to create user",
          message: createError.message 
        });
      }

      if (!authUser?.user) {
        return res.status(500).json({ 
          error: "User creation failed",
          message: "No user data returned"
        });
      }

      // The trigger should have created the user_profile automatically, but we need to update it
      // with full_name, phone, and role. Use upsert in case the trigger hasn't fired yet.
      const { error: updateError } = await supabase
        .from("user_profiles")
        .upsert({
          id: authUser.user.id,
          email: authUser.user.email || email,
          full_name,
          phone: phone || null,
          role: "owner",
        }, {
          onConflict: "id"
        });

      if (updateError) {
        console.error("Error updating user profile:", updateError);
        // User was created but profile update failed - try to clean up
        // Note: We can't delete the auth user easily, so we'll just log the error
        return res.status(500).json({ 
          error: "User created but profile update failed",
          message: updateError.message,
          userId: authUser.user.id
        });
      }

      res.json({ 
        success: true,
        message: "Client created successfully",
        user: {
          id: authUser.user.id,
          email: authUser.user.email,
          full_name,
          phone: phone || null,
        }
      });
    } catch (error: any) {
      console.error("Error in /api/clients/create endpoint:", error);
      res.status(500).json({ 
        error: "Failed to create client",
        message: error?.message || "Unknown error occurred"
      });
    }
  });

  // Staff: List or update service requests
  app.get("/api/service-requests", async (req: Request, res: Response) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      "https://freedomaviationco.com",
      "https://www.freedomaviationco.com",
      "http://localhost:5000",
      "http://localhost:5173",
      "http://localhost:5002",
    ];
    if (origin && (allowedOrigins.includes(origin) || origin.startsWith("https://freedomaviationco.com") || origin.startsWith("http://localhost:"))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    try {
      console.log("📋 /api/service-requests - Request received");
      
      // Check Supabase configuration with detailed logging
      if (!supabase || !supabaseAnon) {
        console.error("❌ Supabase not configured:");
        console.error("  - supabaseUrl:", supabaseUrl ? "✓ Set" : "✗ Missing");
        console.error("  - supabaseServiceKey:", supabaseServiceKey ? "✓ Set" : "✗ Missing");
        console.error("  - supabaseAnonKey:", supabaseAnonKey ? "✓ Set" : "✗ Missing");
        console.error("  - supabase client:", supabase ? "✓ Initialized" : "✗ Not initialized");
        console.error("  - supabaseAnon client:", supabaseAnon ? "✓ Initialized" : "✗ Not initialized");
        return res.status(503).json({ 
          error: "Supabase not configured",
          message: "Server is missing required Supabase environment variables. Check SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_ANON_KEY.",
          details: {
            hasUrl: !!supabaseUrl,
            hasServiceKey: !!supabaseServiceKey,
            hasAnonKey: !!supabaseAnonKey,
          }
        });
      }
      
      // Require staff or admin role
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
      
      if (!token) {
        console.warn("⚠️ No authorization token provided");
        return res.status(401).json({ 
          error: "Unauthorized",
          message: "Missing authorization token. Please log in."
        });
      }
      
      console.log("🔐 Verifying user token...");
      const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
      
      if (authError || !user) {
        console.error("❌ Auth verification failed:", authError?.message);
        return res.status(401).json({ 
          error: "Unauthorized",
          message: "Invalid or expired token. Please log in again."
        });
      }
      
      console.log("✓ User authenticated:", user.id);
      
      // Check user role
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (profileError) {
        console.error("❌ Error fetching user profile:", profileError);
        return res.status(500).json({ 
          error: "Failed to verify permissions",
          message: profileError.message
        });
      }
      
      if (!profile || !["admin", "cfi", "staff"].includes(profile.role)) {
        console.warn("⚠️ User lacks required role. User role:", profile?.role);
        return res.status(403).json({ 
          error: "Forbidden",
          message: "You don't have permission to access this resource. Required role: admin, cfi, or staff."
        });
      }
      
      console.log("✓ User has required role:", profile.role);
      console.log("📊 Fetching service requests...");
      
      // Fetch recent service requests, join owner & aircraft
      const { data: requests, error } = await supabase
        .from("service_requests")
        .select(`*, owner:user_id(full_name,email), aircraft:aircraft_id(tail_number)`)   
        .order("created_at", { ascending: false })
        .limit(200);
      
      if (error) {
        console.error("❌ Error fetching service requests:", error);
        throw error;
      }
      
      console.log(`✓ Successfully fetched ${requests?.length || 0} service requests`);
      res.json({ serviceRequests: requests || [] });
    } catch (err: any) {
      console.error("❌ Unexpected error in /api/service-requests:", err);
      res.status(500).json({ 
        error: "Failed to load service requests", 
        message: err.message,
        details: err.code ? `Error code: ${err.code}` : undefined
      });
    }
  });

  // Update service request status or assignment (staff/admin only)
  app.patch("/api/service-requests/:id", async (req: Request, res: Response) => {
    try {
      if (!supabase || !supabaseAnon) return res.status(503).json({ error: "Supabase not configured" });
      const { id } = req.params;
      const { status, assigned_to } = req.body;
      if (!id) return res.status(400).json({ error: "Missing id" });
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
      if (!token) return res.status(401).json({ error: "Unauthorized" });
      const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
      if (authError || !user) return res.status(401).json({ error: "Unauthorized" });
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (!profile || !["admin", "cfi", "staff"].includes(profile.role)) return res.status(403).json({ error: "Forbidden" });
      const updatePayload: any = {};
      if (status) updatePayload.status = status;
      if (assigned_to !== undefined) updatePayload.assigned_to = assigned_to;
      if (Object.keys(updatePayload).length === 0) return res.status(400).json({ error: "No fields to update" });
      const { error } = await supabase
        .from("service_requests")
        .update(updatePayload)
        .eq("id", id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error("❌ Error updating service request:", err);
      res.status(500).json({ error: "Failed to update service request", message: err.message });
    }
  });

  // Note: The webhook route needs express.raw() middleware, but we need to apply it conditionally
  // We'll handle this by registering the route separately with raw body parsing

  const httpServer = createServer(app);

  return httpServer;
}
