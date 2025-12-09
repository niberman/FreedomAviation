/**
 * Invoice Routes
 * 
 * Handles invoice management and email sending:
 * - Send invoice emails with payment links
 */

import { Router, type Request, type Response } from 'express';
import Stripe from 'stripe';
import { getAdminClient, getAnonClient, isSupabaseAvailable } from '../lib/supabase-clients.js';
import { asyncHandler, ValidationError, ServiceUnavailableError, AuthorizationError, NotFoundError } from '../middleware/error-handler.js';
import { optionalAuth } from '../middleware/auth.js';
import { corsMiddleware, handlePreflight } from '../middleware/cors.js';
import { sendInvoiceEmail } from '../lib/email.js';
import { config, isFeatureEnabled } from '../config/env.js';

const router = Router();

// Stripe client
let stripe: Stripe | null = null;
if (isFeatureEnabled('stripe') && config.stripe.secretKey) {
  stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: '2025-10-29.clover',
  });
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Normalize line items for Stripe (handle fractional quantities)
 */
function normalizeLineItem(item: {
  price_data: {
    currency: string;
    product_data: { name: string };
    unit_amount: number;
  };
  quantity: number;
}): {
  price_data: {
    currency: string;
    product_data: { name: string };
    unit_amount: number;
  };
  quantity: number;
} {
  const qty = item.quantity;

  if (!Number.isFinite(qty) || qty <= 0) {
    throw new ValidationError(`Invalid quantity: ${qty}`);
  }

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

  return item;
}

// =============================================================================
// Routes
// =============================================================================

// CORS preflight
router.options('/*', handlePreflight);

/**
 * GET /api/invoices/send-email/test
 * Test endpoint to verify routing
 */
router.get('/send-email/test', (_req: Request, res: Response) => {
  res.json({ message: 'Email endpoint is accessible', method: 'GET test' });
});

/**
 * POST /api/invoices/send-email
 * Send invoice email with payment link
 */
router.post('/send-email', corsMiddleware, optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  if (!isSupabaseAvailable()) {
    throw new ServiceUnavailableError('Supabase');
  }

  const supabase = getAdminClient();
  const { invoiceId } = req.body;

  if (!invoiceId) {
    throw new ValidationError('Missing invoiceId');
  }

  // Get user info from optional auth
  const currentUserId = req.user?.id || null;
  const userRole = req.user?.role || null;

  // Fetch invoice with all necessary data
  let invoice: Record<string, unknown> | null = null;

  // Try nested query first
  const invoiceQuery = await supabase
    .from('invoices')
    .select(`
      *,
      invoice_lines(*),
      owner:owner_id(full_name, email),
      aircraft:aircraft_id(id, tail_number)
    `)
    .eq('id', invoiceId)
    .single();

  if (invoiceQuery.error) {
    // Fallback: fetch separately
    const { data: invoiceData, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invError || !invoiceData) {
      throw new NotFoundError('Invoice');
    }

    // Fetch owner
    const { data: ownerData, error: ownerError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name')
      .eq('id', invoiceData.owner_id)
      .single();

    if (ownerError || !ownerData) {
      throw new Error('Failed to fetch owner information');
    }

    // Fetch aircraft
    let aircraftData = null;
    if (invoiceData.aircraft_id) {
      const { data: acData } = await supabase
        .from('aircraft')
        .select('id, tail_number')
        .eq('id', invoiceData.aircraft_id)
        .single();
      aircraftData = acData;
    }

    // Fetch invoice lines
    const { data: linesData } = await supabase
      .from('invoice_lines')
      .select('*')
      .eq('invoice_id', invoiceId);

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
        .from('user_profiles')
        .select('id, email, full_name')
        .eq('id', invoice.owner_id as string)
        .single();

      if (ownerError || !ownerData) {
        throw new Error('Failed to fetch owner information');
      }
      invoice.owner = ownerData;
    }
  }

  if (!invoice) {
    throw new NotFoundError('Invoice');
  }

  // Check authorization
  if (currentUserId) {
    const isAdmin = userRole === 'admin';
    const isFounder = userRole === 'founder';
    const isStaff = userRole === 'staff';
    const isCFI = userRole === 'cfi';
    const isInvoiceCreator = invoice.created_by_cfi_id === currentUserId;

    if (!isAdmin && !isFounder && !(isStaff && isInvoiceCreator) && !(isCFI && isInvoiceCreator)) {
      throw new AuthorizationError('Only admins, founders, or the CFI/staff who created the invoice can send it');
    }
  } else {
    // Require auth in production
    if (config.app.nodeEnv === 'production') {
      throw new AuthorizationError('Authentication required');
    }
    console.warn('Allowing invoice send without authentication (development mode)');
  }

  // Validate invoice status
  if (invoice.status !== 'finalized' && invoice.status !== 'sent') {
    throw new ValidationError(`Can only send email for finalized or sent invoices. Current status: ${invoice.status}`);
  }

  // Get owner info
  const owner = invoice.owner as { email?: string; full_name?: string };
  if (!owner?.email) {
    throw new ValidationError('Owner email not found');
  }

  // Transform invoice lines
  const invoiceLines = ((invoice.invoice_lines || []) as Array<{
    description: string;
    quantity: number;
    unit_cents: number;
  }>).map((line) => ({
    description: line.description,
    quantity: Number(line.quantity),
    unitPrice: Number(line.unit_cents) / 100,
    total: (Number(line.quantity) * Number(line.unit_cents)) / 100,
  }));

  // Calculate total
  const totalAmount = invoiceLines.length > 0
    ? invoiceLines.reduce((sum, line) => sum + line.total, 0)
    : Number(invoice.amount) || 0;

  // Create Stripe checkout session for payment
  let paymentUrl: string | null = null;
  if (stripe && invoice.owner_id) {
    try {
      // Check for existing session
      if (invoice.stripe_checkout_session_id) {
        try {
          const existingSession = await stripe.checkout.sessions.retrieve(invoice.stripe_checkout_session_id as string);
          if (existingSession.status === 'open' || existingSession.status === 'complete') {
            paymentUrl = existingSession.url;
          }
        } catch {
          // Session expired, create new one
        }
      }

      // Create new session if needed
      if (!paymentUrl) {
        const totalCents = invoiceLines.length > 0
          ? Math.round(totalAmount * 100)
          : Math.round(Number(invoice.amount) * 100);

        if (totalCents > 0) {
          const frontendUrl = config.app.frontendUrl;

          const lineItems = invoiceLines.length > 0
            ? invoiceLines.map((line) => normalizeLineItem({
                price_data: {
                  currency: 'usd',
                  product_data: { name: line.description || 'Flight Instruction' },
                  unit_amount: Math.round(line.unitPrice * 100),
                },
                quantity: line.quantity,
              }))
            : [{
                price_data: {
                  currency: 'usd',
                  product_data: { name: `Invoice ${invoice.invoice_number}` },
                  unit_amount: totalCents,
                },
                quantity: 1,
              }];

          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${frontendUrl}/dashboard/more?payment=success&invoice_id=${invoice.id}`,
            cancel_url: `${frontendUrl}/dashboard/more?payment=cancelled&invoice_id=${invoice.id}`,
            customer_email: owner.email,
            metadata: {
              invoice_id: invoice.id as string,
              owner_id: invoice.owner_id as string,
              invoice_number: invoice.invoice_number as string,
            },
          });

          paymentUrl = session.url;

          // Save checkout session ID
          await supabase
            .from('invoices')
            .update({ stripe_checkout_session_id: session.id })
            .eq('id', invoice.id);
        }
      }
    } catch (stripeError: unknown) {
      console.error('Error creating Stripe checkout session:', stripeError);
      // Don't fail email sending if Stripe fails
    }
  }

  // Send email
  try {
    await sendInvoiceEmail({
      invoiceNumber: invoice.invoice_number as string,
      ownerName: owner.full_name || owner.email!,
      ownerEmail: owner.email!,
      invoiceId: invoice.id as string,
      ownerId: invoice.owner_id as string,
      totalAmount,
      invoiceLines,
      dueDate: invoice.due_date as string | null,
      aircraftTailNumber: (invoice.aircraft as { tail_number?: string })?.tail_number,
      paymentUrl,
    });

    const emailService = config.email.service;
    res.json({
      success: true,
      message: emailService === 'console'
        ? 'Email logged to console (EMAIL_SERVICE=console mode)'
        : 'Invoice email sent successfully',
      emailService,
      sent: emailService !== 'console',
    });
  } catch (emailError: unknown) {
    console.error('Error in sendInvoiceEmail:', emailError);
    res.status(500).json({
      error: 'Failed to send invoice email',
      message: emailError instanceof Error ? emailError.message : 'Unknown error',
      details: {
        emailService: config.email.service,
        hasResendKey: !!config.email.resendApiKey,
      },
    });
  }
}));

export default router;

