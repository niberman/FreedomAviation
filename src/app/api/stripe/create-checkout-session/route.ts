import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-10-29.clover' as any,
}) : null;

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  : null;

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

export async function POST(request: NextRequest) {
  try {
    if (!stripe || !supabase) {
      return NextResponse.json({
        error: 'Stripe or Supabase not configured. Please set STRIPE_SECRET_KEY and Supabase credentials.'
      }, { status: 503 });
    }

    const body = await request.json();
    const { invoiceId, userId } = body;

    if (!invoiceId || !userId) {
      return NextResponse.json({ error: 'Missing invoiceId or userId' }, { status: 400 });
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_lines(*)
      `)
      .eq('id', invoiceId)
      .eq('owner_id', userId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found or access denied' }, { status: 404 });
    }

    if (invoice.status !== 'finalized') {
      return NextResponse.json({
        error: `Invoice must be finalized before payment. Current status: ${invoice.status}`
      }, { status: 400 });
    }

    if (invoice.status === 'paid' || invoice.paid_date) {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 });
    }

    if (invoice.stripe_checkout_session_id) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(invoice.stripe_checkout_session_id);
        if (existingSession.status === 'open' || existingSession.status === 'complete') {
          return NextResponse.json({
            checkoutUrl: existingSession.url,
            sessionId: existingSession.id
          });
        }
      } catch (err) {
        // Session doesn't exist or is expired, continue to create new one
      }
    }

    let totalCents = 0;
    if (invoice.invoice_lines && Array.isArray(invoice.invoice_lines)) {
      totalCents = invoice.invoice_lines.reduce((sum: number, line: any) => {
        return sum + Math.round(line.quantity * line.unit_cents);
      }, 0);
    } else {
      totalCents = Math.round(parseFloat(invoice.amount) * 100);
    }

    if (totalCents <= 0) {
      return NextResponse.json({ error: 'Invoice amount must be greater than zero' }, { status: 400 });
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: invoice.invoice_lines?.map((line: any) => {
        const quantity = Number(line.quantity);
        if (isNaN(quantity) || quantity <= 0) {
          throw new Error(`Invalid quantity: ${line.quantity}`);
        }

        const unitAmount = Number(line.unit_cents);
        if (isNaN(unitAmount) || unitAmount <= 0) {
          throw new Error(`Invalid unit amount: ${line.unit_cents}`);
        }

        const lineItem = {
          price_data: {
            currency: 'usd',
            product_data: {
              name: line.description || 'Flight Instruction',
            },
            unit_amount: unitAmount,
          },
          quantity: quantity,
        };

        return normalizeLineItem(lineItem);
      }) || [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Invoice ${invoice.invoice_number}`,
          },
          unit_amount: totalCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/dashboard/more?payment=success&invoice_id=${invoiceId}`,
      cancel_url: `${origin}/dashboard/more?payment=cancelled&invoice_id=${invoiceId}`,
      customer_email: userProfile?.email,
      metadata: {
        invoice_id: invoiceId,
        owner_id: userId,
        invoice_number: invoice.invoice_number,
      },
    });

    await supabase
      .from('invoices')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', invoiceId);

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({
      error: 'Failed to create checkout session',
      message: error.message
    }, { status: 500 });
  }
}







