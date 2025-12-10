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

export async function POST(request: NextRequest) {
  try {
    if (!stripe || !supabase) {
      return NextResponse.json({
        error: 'Stripe or Supabase not configured'
      }, { status: 503 });
    }

    const sig = request.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('STRIPE_WEBHOOK_SECRET not set. Webhook verification disabled.');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 400 });
    }

    if (!sig) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    const body = await request.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const invoiceId = session.metadata?.invoice_id;

        if (invoiceId) {
          const { data: invoice, error: fetchError } = await supabase
            .from('invoices')
            .select('id, status, paid_date')
            .eq('id', invoiceId)
            .single();

          if (!fetchError && invoice && invoice.status !== 'paid' && !invoice.paid_date) {
            const updateData: any = {
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
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({
      error: 'Webhook handler failed',
      message: error.message
    }, { status: 500 });
  }
}





