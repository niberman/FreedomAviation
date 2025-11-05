import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendInvoiceEmail } from "./lib/email";

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
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("⚠️  Supabase credentials not set. Some features may not work.");
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

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
          console.log("Existing session not found or expired, creating new session");
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
        line_items: invoice.invoice_lines?.map((line: any) => ({
          price_data: {
            currency: "usd",
            product_data: {
              name: line.description || "Flight Instruction",
            },
            unit_amount: line.unit_cents,
          },
          quantity: Math.round(line.quantity * 100) / 100, // Ensure quantity is properly formatted
        })) || [
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
                console.error(`❌ Failed to update invoice ${invoiceId}:`, updateError);
              } else {
                console.log(`✅ Invoice ${invoiceId} (${session.metadata?.invoice_number || 'N/A'}) marked as paid`);
              }
            } else {
              console.log(`ℹ️ Invoice ${invoiceId} already marked as paid, skipping update`);
            }
          } else {
            console.warn("⚠️ checkout.session.completed event missing invoice_id in metadata");
          }
          break;
        }

        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log(`✅ Payment succeeded: ${paymentIntent.id}`);
          
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
                    
                    console.log(`✅ Invoice ${invoiceId} marked as paid via payment_intent.succeeded`);
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
          console.log(`ℹ️ Unhandled event type: ${event.type}`);
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
  app.post("/api/invoices/send-email", async (req: Request, res: Response) => {
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

      // Fetch invoice with all necessary data
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select(`
          *,
          invoice_lines(*),
          owner:user_profiles!owner_id(id, email, full_name),
          aircraft(id, tail_number)
        `)
        .eq("id", invoiceId)
        .single();

      if (invoiceError || !invoice) {
        return res.status(404).json({ error: "Invoice not found" });
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
        return res.status(400).json({ error: "Owner email not found" });
      }

      // Transform invoice lines
      const invoiceLines = (invoice.invoice_lines || []).map((line: any) => ({
        description: line.description,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unit_cents) / 100,
        total: (Number(line.quantity) * Number(line.unit_cents)) / 100,
      }));

      // Calculate total
      const totalAmount = invoiceLines.reduce((sum, line) => sum + line.total, 0);

      // Send email
      console.log("📧 Attempting to send invoice email for:", invoice.invoice_number);
      console.log("📧 To:", owner.email);
      
      try {
        await sendInvoiceEmail({
          invoiceNumber: invoice.invoice_number,
          ownerName: owner.full_name || owner.email,
          ownerEmail: owner.email,
          invoiceId: invoice.id,
          totalAmount,
          invoiceLines,
          dueDate: invoice.due_date,
          aircraftTailNumber: (invoice.aircraft as any)?.tail_number,
        });
        
        console.log("✅ Invoice email sent successfully");
      } catch (emailError: any) {
        console.error("❌ Error in sendInvoiceEmail:", emailError);
        throw emailError; // Re-throw to be caught by outer try-catch
      }

      res.json({ 
        success: true,
        message: "Invoice email sent successfully" 
      });
    } catch (error: any) {
      console.error("Error sending invoice email:", error);
      res.status(500).json({ 
        error: "Failed to send invoice email",
        message: error.message 
      });
    }
  });

  // Note: The webhook route needs express.raw() middleware, but we need to apply it conditionally
  // We'll handle this by registering the route separately with raw body parsing

  const httpServer = createServer(app);

  return httpServer;
}
