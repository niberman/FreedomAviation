import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { isStaffRole } from '@/lib/roles';
import { normalizeLineItem } from '@/lib/stripe-utils';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Missing or invalid authorization. Please log in.' }, { status: 401 });
    }

    const supabase = createAdminClient();
    if (!stripe || !supabase) {
      return NextResponse.json({
        error: 'Stripe or Supabase not configured. Please set STRIPE_SECRET_KEY and Supabase credentials.'
      }, { status: 503 });
    }

    const body = await request.json();
    const { invoiceId, userId } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 });
    }

    const isStaff = isStaffRole(auth.profile?.role);
    if (!isStaff && body.userId !== auth.user.id) {
      return NextResponse.json({ error: 'You can only create checkout for your own invoices' }, { status: 403 });
    }

    let query = supabase
      .from('invoices')
      .select(`*, invoice_lines(*)`)
      .eq('id', invoiceId);
    if (!isStaff) {
      query = query.eq('owner_id', auth.user.id);
    }
    const { data: invoice, error: invoiceError } = await query.single();

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

    interface InvoiceLine { quantity: number; unit_cents: number; description?: string }

    let totalCents = 0;
    const lines = invoice.invoice_lines as InvoiceLine[] | null;
    if (lines && Array.isArray(lines)) {
      totalCents = lines.reduce((sum: number, line: InvoiceLine) => {
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
      .eq('id', invoice.owner_id)
      .single();

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lines?.map((line: InvoiceLine) => {
        const quantity = Number(line.quantity);
        if (isNaN(quantity) || quantity <= 0) {
          throw new Error(`Invalid quantity: ${line.quantity}`);
        }

        const unitAmount = Number(line.unit_cents);
        if (isNaN(unitAmount) || unitAmount <= 0) {
          throw new Error(`Invalid unit amount: ${line.unit_cents}`);
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
        owner_id: invoice.owner_id,
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
  } catch (error: unknown) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({
      error: 'Failed to create checkout session',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
