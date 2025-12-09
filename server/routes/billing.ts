/**
 * Billing Routes (Stripe)
 * 
 * Handles all Stripe-related endpoints:
 * - Checkout session creation
 * - Webhook handling
 * - Subscription management for onboarding
 */

import { Router, type Request, type Response } from 'express';
import Stripe from 'stripe';
import { config, isFeatureEnabled } from '../config/env.js';
import { getAdminClient, getAnonClient, isSupabaseAvailable } from '../lib/supabase-clients.js';
import { asyncHandler, ServiceUnavailableError, ValidationError, NotFoundError } from '../middleware/error-handler.js';
import { requireAuth } from '../middleware/auth.js';
import { corsMiddleware, handlePreflight } from '../middleware/cors.js';

const router = Router();

// =============================================================================
// Stripe Client Initialization
// =============================================================================

let stripe: Stripe | null = null;

if (isFeatureEnabled('stripe') && config.stripe.secretKey) {
  stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: '2025-10-29.clover',
  });
  console.log('✅ Stripe client initialized');
} else {
  console.warn('⚠️  Stripe not configured. Payment features disabled.');
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Normalize line items: fold fractional quantities into price
 * Stripe doesn't support decimal quantities, so we adjust the unit price
 */
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
    throw new ValidationError(`Invalid quantity: ${item.quantity}`);
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

  return {
    ...item,
    quantity: qty,
  };
}

function requireStripeAndSupabase(): { stripe: Stripe; supabase: ReturnType<typeof getAdminClient> } {
  if (!stripe) {
    throw new ServiceUnavailableError('Stripe');
  }
  if (!isSupabaseAvailable()) {
    throw new ServiceUnavailableError('Supabase');
  }
  return { stripe, supabase: getAdminClient() };
}

// =============================================================================
// Routes
// =============================================================================

// CORS preflight
router.options('/*', handlePreflight);

/**
 * POST /api/stripe/create-checkout-session
 * Create a Stripe checkout session for invoice payment
 */
router.post('/create-checkout-session', corsMiddleware, requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { stripe, supabase } = requireStripeAndSupabase();
  
  const { invoiceId, userId } = req.body;

  if (!invoiceId || !userId) {
    throw new ValidationError('Missing invoiceId or userId');
  }

  // Verify the authenticated user matches the request
  if (req.user?.id !== userId) {
    throw new ValidationError('User ID mismatch');
  }

  // Fetch invoice with lines
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(`*, invoice_lines(*)`)
    .eq('id', invoiceId)
    .eq('owner_id', userId)
    .single();

  if (invoiceError || !invoice) {
    throw new NotFoundError('Invoice');
  }

  // Only allow payment for finalized invoices
  if (invoice.status !== 'finalized') {
    throw new ValidationError(`Invoice must be finalized before payment. Current status: ${invoice.status}`);
  }

  // Check if already paid
  if (invoice.status === 'paid' || invoice.paid_date) {
    throw new ValidationError('Invoice is already paid');
  }

  // Check for existing active checkout session
  if (invoice.stripe_checkout_session_id) {
    try {
      const existingSession = await stripe.checkout.sessions.retrieve(invoice.stripe_checkout_session_id);
      if (existingSession.status === 'open' || existingSession.status === 'complete') {
        res.json({
          checkoutUrl: existingSession.url,
          sessionId: existingSession.id,
        });
        return;
      }
    } catch {
      // Session doesn't exist or is expired, continue to create new one
    }
  }

  // Calculate total amount in cents
  let totalCents = 0;
  if (invoice.invoice_lines && Array.isArray(invoice.invoice_lines)) {
    totalCents = invoice.invoice_lines.reduce((sum: number, line: { quantity: number; unit_cents: number }) => {
      return sum + Math.round(line.quantity * line.unit_cents);
    }, 0);
  } else {
    totalCents = Math.round(parseFloat(invoice.amount) * 100);
  }

  if (totalCents <= 0) {
    throw new ValidationError('Invoice amount must be greater than zero');
  }

  // Get user email
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single();

  // Create line items
  const lineItems = invoice.invoice_lines?.map((line: { description: string; unit_cents: number; quantity: number }) => {
    const quantity = Number(line.quantity);
    const unitAmount = Number(line.unit_cents);
    
    if (isNaN(quantity) || quantity <= 0) {
      throw new ValidationError(`Invalid quantity: ${line.quantity}`);
    }
    if (isNaN(unitAmount) || unitAmount <= 0) {
      throw new ValidationError(`Invalid unit amount: ${line.unit_cents}`);
    }

    return normalizeLineItem({
      price_data: {
        currency: 'usd',
        product_data: { name: line.description || 'Flight Instruction' },
        unit_amount: unitAmount,
      },
      quantity,
    });
  }) || [{
    price_data: {
      currency: 'usd',
      product_data: { name: `Invoice ${invoice.invoice_number}` },
      unit_amount: totalCents,
    },
    quantity: 1,
  }];

  // Create Stripe checkout session
  const frontendUrl = config.app.frontendUrl;
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${frontendUrl}/dashboard/more?payment=success&invoice_id=${invoiceId}`,
    cancel_url: `${frontendUrl}/dashboard/more?payment=cancelled&invoice_id=${invoiceId}`,
    customer_email: userProfile?.email,
    metadata: {
      invoice_id: invoiceId,
      owner_id: userId,
      invoice_number: invoice.invoice_number,
    },
  });

  // Save checkout session ID
  await supabase
    .from('invoices')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', invoiceId);

  res.json({
    checkoutUrl: session.url,
    sessionId: session.id,
  });
}));

/**
 * POST /api/stripe/webhook
 * Stripe webhook handler
 * 
 * NOTE: This route requires raw body parsing which is configured in index.ts
 * before the global JSON parser.
 */
router.post('/webhook', asyncHandler(async (req: Request, res: Response) => {
  if (!stripe || !isSupabaseAvailable()) {
    throw new ServiceUnavailableError('Stripe or Supabase');
  }

  const supabase = getAdminClient();
  const sig = req.headers['stripe-signature'];
  const webhookSecret = config.stripe.webhookSecret;

  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not set. Webhook verification disabled.');
    res.status(400).json({ error: 'Webhook secret not configured' });
    return;
  }

  if (!sig) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    res.status(400).json({ error: `Webhook Error: ${message}` });
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = session.metadata?.invoice_id;

      if (invoiceId) {
        const { data: invoice } = await supabase
          .from('invoices')
          .select('id, status, paid_date')
          .eq('id', invoiceId)
          .single();

        if (invoice && invoice.status !== 'paid' && !invoice.paid_date) {
          const updateData: Record<string, unknown> = {
            status: 'paid',
            paid_date: new Date().toISOString().split('T')[0],
          };

          if (session.payment_intent) {
            updateData.stripe_payment_intent_id = session.payment_intent as string;
          }

          await supabase
            .from('invoices')
            .update(updateData)
            .eq('id', invoiceId);
        }
      }
      break;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      if (paymentIntent.id) {
        // Try to find invoice by checkout session
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: paymentIntent.id,
          limit: 1,
        });

        if (sessions.data.length > 0) {
          const session = sessions.data[0];
          const invoiceId = session.metadata?.invoice_id;

          if (invoiceId) {
            const { data: invoice } = await supabase
              .from('invoices')
              .select('id, status, paid_date')
              .eq('id', invoiceId)
              .single();

            if (invoice && invoice.status !== 'paid' && !invoice.paid_date) {
              await supabase
                .from('invoices')
                .update({
                  status: 'paid',
                  paid_date: new Date().toISOString().split('T')[0],
                  stripe_payment_intent_id: paymentIntent.id,
                })
                .eq('id', invoiceId);
            }
          }
        }
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.error(`Payment failed: ${paymentIntent.id}`);
      break;
    }

    default:
      // Unhandled event type
      break;
  }

  res.json({ received: true });
}));

/**
 * POST /api/stripe/onboarding/create-subscription
 * Create a subscription for new members during onboarding
 */
router.post('/onboarding/create-subscription', corsMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { stripe, supabase } = requireStripeAndSupabase();
  
  const { userId, membershipSelection, personalInfo } = req.body;

  if (!userId || !membershipSelection) {
    throw new ValidationError('Missing required fields: userId, membershipSelection');
  }

  // Get user profile
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single();

  if (!userProfile) {
    throw new NotFoundError('User');
  }

  // Calculate price
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
      metadata: { user_id: userId },
    });
  }

  // Create price
  const price = await stripe.prices.create({
    currency: 'usd',
    unit_amount: priceInCents,
    recurring: { interval: 'month' },
    product_data: {
      name: `Freedom Aviation ${membershipSelection.package_id.toUpperCase()} Membership`,
      metadata: { hours_band: membershipSelection.hours_band },
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

  const invoice = subscription.latest_invoice as Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent };
  const paymentIntent = invoice?.payment_intent;

  // Save customer and subscription IDs
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
}));

/**
 * GET /api/stripe/onboarding/stripe-info
 * Get user's Stripe customer and subscription info
 */
router.get('/onboarding/stripe-info', corsMiddleware, requireAuth, asyncHandler(async (req: Request, res: Response) => {
  if (!isSupabaseAvailable()) {
    throw new ServiceUnavailableError('Supabase');
  }

  const supabase = getAdminClient();
  const userId = req.user!.id;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id, stripe_subscription_id')
    .eq('id', userId)
    .single();

  res.json({
    customerId: profile?.stripe_customer_id,
    subscriptionId: profile?.stripe_subscription_id,
  });
}));

export default router;

