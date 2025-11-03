# Stripe Integration Setup Guide

This guide explains how to set up Stripe payment integration for CFI invoicing.

## Overview

The Stripe integration allows CFI instructors to create invoices, and aircraft owners to pay those invoices via Stripe Checkout. The system handles:

1. **Invoice Creation**: CFIs create instruction invoices in the staff dashboard
2. **Invoice Finalization**: CFIs finalize invoices (calculates total from invoice lines)
3. **Payment Processing**: Owners can pay finalized invoices via Stripe Checkout
4. **Webhook Handling**: Stripe webhooks automatically update invoice status to "paid"

## Database Setup

### 1. Add Stripe Fields to Invoices Table

If your database already exists, run the migration script:

```sql
-- Run this in Supabase SQL Editor
-- See: scripts/add-stripe-fields.sql
```

Or if you're creating a fresh database, the `supabase-schema.sql` already includes these fields:
- `stripe_checkout_session_id` - Stores the Stripe checkout session ID
- `stripe_payment_intent_id` - Stores the payment intent ID after successful payment

## Environment Variables

### Where to Add Environment Variables

**Important**: Environment variables go in your **deployment platform** (Vercel, Replit, etc.), **NOT in Supabase**.

- **Vercel**: Project Settings → Environment Variables
- **Replit**: Secrets tab (⚙️ icon in sidebar)
- **Supabase**: Only stores Supabase-related config (you don't put Stripe keys here)

### Required Variables

Add these to your deployment platform (Vercel or Replit):

1. **`STRIPE_SECRET_KEY`** - Your Stripe secret key (starts with `sk_`)
   - Get from: https://dashboard.stripe.com/apikeys
   - Use test key for development: `sk_test_...`
   - Use live key for production: `sk_live_...`
   - **Where**: Vercel or Replit (server-side only)

2. **`SUPABASE_SERVICE_ROLE_KEY`** - Supabase service role key (for server-side operations)
   - Get from: Supabase Dashboard → Settings → API → Service Role Key
   - ⚠️ Keep this secret - never expose in client-side code
   - **Where**: Vercel or Replit (server-side only)

3. **`SUPABASE_URL`** or **`VITE_SUPABASE_URL`** - Your Supabase project URL
   - Get from: Supabase Dashboard → Settings → API → Project URL
   - **Where**: Vercel or Replit (can be used in both client and server)

### Optional Variables

4. **`STRIPE_WEBHOOK_SECRET`** - Webhook signing secret (for webhook verification)
   - Get from: Stripe Dashboard → Developers → Webhooks → Your endpoint → Signing secret
   - Required for production webhook verification
   - **Where**: Vercel or Replit (server-side only)

5. **`FRONTEND_URL`** - Your frontend URL (defaults to request origin)
   - Used for Stripe checkout redirect URLs
   - Example: `https://yourdomain.com`
   - **Where**: Vercel or Replit (server-side only)

### Client-Side Variables (Already Set)

These should already be configured:
- `VITE_SUPABASE_URL` - Frontend access to Supabase
- `VITE_SUPABASE_ANON_KEY` - Frontend auth key

### Quick Setup by Platform

#### Vercel
1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - `STRIPE_SECRET_KEY` = `sk_test_...` (or `sk_live_...` for production)
   - `SUPABASE_SERVICE_ROLE_KEY` = `eyJ...` (from Supabase)
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (from Stripe webhook)
   - `SUPABASE_URL` = `https://xxxxx.supabase.co` (optional, if not using VITE_SUPABASE_URL)
4. Select environment (Development, Preview, Production)
5. Redeploy your application

#### Replit
1. Open your Replit project
2. Click the **Secrets** tab (🔒 icon in sidebar)
3. Add each variable:
   - Key: `STRIPE_SECRET_KEY`, Value: `sk_test_...`
   - Key: `SUPABASE_SERVICE_ROLE_KEY`, Value: `eyJ...`
   - Key: `STRIPE_WEBHOOK_SECRET`, Value: `whsec_...`
   - Key: `SUPABASE_URL`, Value: `https://xxxxx.supabase.co` (optional)
4. Restart your Replit

#### Supabase
- **Do NOT put Stripe keys in Supabase**
- Supabase only needs its own keys (URL, anon key, service role key)
- These are already configured in your deployment platform

## Stripe Dashboard Setup

### 1. Create Stripe Account
1. Go to https://dashboard.stripe.com/register
2. Complete account setup
3. Get your API keys from https://dashboard.stripe.com/apikeys

### 2. Configure Webhook Endpoint

For production:

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the "Signing secret" and add it as `STRIPE_WEBHOOK_SECRET`

For local development (using Stripe CLI):

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/stripe/webhook

# Copy the webhook signing secret from the output
# Add it as STRIPE_WEBHOOK_SECRET
```

## Testing

### Test Mode

1. Use Stripe test API keys (`sk_test_...`)
2. Use test card numbers from: https://stripe.com/docs/testing
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
3. Test webhook events using Stripe CLI or Dashboard

### Payment Flow

1. **CFI creates invoice**:
   - Go to `/staff` dashboard
   - Fill in invoice form (owner, aircraft, description, hours, rate)
   - Click "Create Invoice" (status: `draft`)

2. **CFI finalizes invoice**:
   - Click "Mark as Finalized" on the invoice
   - Status changes to `finalized`
   - Total amount is calculated from invoice lines

3. **Owner pays invoice**:
   - Go to `/dashboard/more`
   - See finalized invoice in Billing card
   - Click "Pay Invoice"
   - Redirected to Stripe Checkout
   - Complete payment

4. **Webhook updates invoice**:
   - Stripe sends `checkout.session.completed` event
   - Server updates invoice status to `paid`
   - Sets `paid_date` to current date

## API Endpoints

### POST `/api/stripe/create-checkout-session`

Creates a Stripe checkout session for an invoice.

**Request:**
```json
{
  "invoiceId": "uuid",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_..."
}
```

### POST `/api/stripe/webhook`

Handles Stripe webhook events. Requires raw body for signature verification.

**Events handled:**
- `checkout.session.completed` - Marks invoice as paid
- `payment_intent.succeeded` - Logs successful payment
- `payment_intent.payment_failed` - Logs failed payment

## Invoice Status Flow

```
draft → finalized → paid
```

- **draft**: Invoice created but not ready for payment
- **finalized**: Invoice is ready for payment (total calculated)
- **paid**: Payment completed (via Stripe webhook)

## Troubleshooting

### Payment button not showing
- Ensure invoice status is `finalized`
- Check that invoice has invoice_lines with valid amounts
- Verify user is logged in and owns the invoice

### Webhook not working
- Check `STRIPE_WEBHOOK_SECRET` is set correctly
- Verify webhook endpoint URL in Stripe Dashboard
- Check server logs for webhook errors
- Ensure webhook route uses raw body parsing (configured in `server/index.ts`)

### Checkout session creation fails
- Verify `STRIPE_SECRET_KEY` is set
- Check `SUPABASE_SERVICE_ROLE_KEY` is set
- Ensure invoice exists and belongs to user
- Check invoice status is `finalized`
- Verify invoice amount > 0

## Security Notes

1. **Never expose Stripe secret key** in client-side code
2. **Use service role key** only on server-side
3. **Verify webhook signatures** in production
4. **Use RLS policies** to ensure users can only access their own invoices
5. **Validate invoice ownership** before creating checkout sessions

## Support

For Stripe-specific issues:
- Stripe Docs: https://stripe.com/docs
- Stripe Support: https://support.stripe.com

For application issues:
- Check server logs for errors
- Verify environment variables are set
- Check database schema matches expected structure

