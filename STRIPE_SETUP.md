# Stripe Integration Setup Guide

Complete guide for setting up Stripe payment processing for Freedom Aviation.

## Overview

The Stripe integration enables CFI instructors to create invoices and aircraft owners to pay them via Stripe Checkout. The system handles:

1. **Invoice Creation**: CFIs create instruction invoices in the staff dashboard
2. **Invoice Finalization**: CFIs finalize invoices (calculates total from invoice lines)
3. **Payment Processing**: Owners can pay finalized invoices via Stripe Checkout
4. **Webhook Handling**: Stripe webhooks automatically update invoice status to "paid"

## Quick Start Checklist

### Step 1: Create Stripe Account
- [ ] Go to https://dashboard.stripe.com/register (or login)
- [ ] Complete account setup
- [ ] Switch to **Test Mode** for development

### Step 2: Get API Keys
- [ ] Go to https://dashboard.stripe.com/apikeys
- [ ] Copy **Secret key** (`sk_test_...` for test mode)
- [ ] This is your `STRIPE_SECRET_KEY`

### Step 3: Database Setup
- [ ] Run `scripts/add-stripe-fields.sql` in Supabase SQL Editor (if database exists)
- [ ] Or use `supabase-schema.sql` for fresh databases (already includes Stripe fields)

### Step 4: Configure Environment Variables

**For Vercel:**
- [ ] Go to Project Settings → Environment Variables
- [ ] Add `STRIPE_SECRET_KEY` = `sk_test_...`
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` = `eyJ...` (from Supabase Dashboard → Settings → API)
- [ ] Add `STRIPE_WEBHOOK_SECRET` = `whsec_...` (see Step 5)
- [ ] Add `SUPABASE_URL` = `https://xxxxx.supabase.co`
- [ ] Select all environments (Development, Preview, Production)
- [ ] Redeploy application

**For Replit:**
- [ ] Open Secrets tab (🔒 icon)
- [ ] Add all variables above
- [ ] Restart Replit

### Step 5: Set Up Webhooks

**For Local Development:**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# or see https://stripe.com/docs/stripe-cli for other platforms

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/stripe/webhook

# Copy the webhook signing secret from output (starts with whsec_...)
# Add it as STRIPE_WEBHOOK_SECRET in your environment
```

**For Production:**
- [ ] Go to Stripe Dashboard → Developers → Webhooks
- [ ] Click "Add endpoint"
- [ ] Enter URL: `https://www.freedomaviationco.com/api/stripe/webhook`
- [ ] Select events:
  - ✅ `checkout.session.completed`
  - ✅ `payment_intent.succeeded`
  - ✅ `payment_intent.payment_failed` (optional)
- [ ] Copy the signing secret (`whsec_...`)
- [ ] Add as `STRIPE_WEBHOOK_SECRET` in production environment
- [ ] Redeploy

### Step 6: Test
- [ ] Create test invoice in staff dashboard
- [ ] Finalize the invoice
- [ ] Pay with test card: `4242 4242 4242 4242`
- [ ] Verify invoice updates to "paid" status

## Database Setup

### Stripe Fields

The invoices table includes these Stripe-related fields:
- `stripe_checkout_session_id` - Stores the Stripe checkout session ID
- `stripe_payment_intent_id` - Stores the payment intent ID after successful payment

If your database already exists, run:
```sql
-- Run in Supabase SQL Editor
-- See: scripts/add-stripe-fields.sql
```

Fresh databases using `supabase-schema.sql` already include these fields.

## Environment Variables

### Required Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `STRIPE_SECRET_KEY` | Stripe secret key | Stripe Dashboard → API Keys → Secret key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API → Service Role Key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Stripe Dashboard → Webhooks → Your endpoint → Signing secret |
| `SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API → Project URL |

### Client-Side Variables (Already Configured)
- `VITE_SUPABASE_URL` - Frontend access to Supabase
- `VITE_SUPABASE_ANON_KEY` - Frontend auth key

### Platform-Specific Setup

**Vercel:**
1. Project Settings → Environment Variables
2. Add each variable
3. Select environment (Development, Preview, Production)
4. Redeploy

**Replit:**
1. Secrets tab (🔒 icon)
2. Add each variable
3. Restart

**Important:** Never put Stripe keys in Supabase. They belong in your deployment platform only.

## Webhook Setup

### Local Development

Use Stripe CLI to forward webhooks to your local server:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:5000/api/stripe/webhook

# Copy webhook secret from output
export STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Production

1. Create webhook endpoint in Stripe Dashboard:
   - URL: `https://www.freedomaviationco.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`
2. Copy signing secret
3. Add as `STRIPE_WEBHOOK_SECRET` in production environment
4. Redeploy

### Webhook Events Handled

- **`checkout.session.completed`**: Updates invoice status to `paid` and sets `paid_date`
- **`payment_intent.succeeded`**: Backup handler to update invoice if not already updated
- **`payment_intent.payment_failed`**: Logs payment failure (optional)

## Payment Flow

1. **CFI creates invoice**: Status = `draft`
2. **CFI finalizes invoice**: Status = `finalized`, total calculated
3. **Owner pays invoice**: Redirected to Stripe Checkout
4. **Webhook updates invoice**: Status = `paid`, `paid_date` set

### Invoice Status Flow
```
draft → finalized → paid
```

## Testing

### Test Mode

1. Use Stripe test API keys (`sk_test_...`)
2. Use test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
3. Test webhook events using Stripe CLI or Dashboard

### Testing Checklist

- [ ] Create invoice in staff dashboard
- [ ] Finalize invoice
- [ ] Pay invoice with test card
- [ ] Verify invoice status updates to "paid"
- [ ] Check webhook delivery in Stripe Dashboard

## Production Deployment

### Switch to Live Mode

1. **Stripe Dashboard**: Toggle "Test mode" to "Live mode"
2. **Get Live Keys**: Copy `sk_live_...` secret key
3. **Update Environment**: Set `STRIPE_SECRET_KEY` to live key in production
4. **Update Webhook**: Create production webhook endpoint (different secret)
5. **Test**: Use real card (will be charged!)

### Production Checklist

See `PRODUCTION_STRIPE_CHECKLIST.md` for detailed production verification steps.

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

## Stripe CLI Commands

### Installation

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**
```bash
curl -s https://packages.stripe.com/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.com/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe
```

### Common Commands

```bash
# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:5000/api/stripe/webhook

# Check version
stripe --version

# List webhooks
stripe webhooks list

# Trigger test event
stripe trigger checkout.session.completed
```

### Automated Setup Script

Run the setup script:
```bash
./scripts/setup-stripe.sh
```

## Troubleshooting

### Payment button not showing
- Ensure invoice status is `finalized` (not `draft`)
- Check invoice has invoice_lines with valid amounts
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

### Webhook signature verification failed
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard secret
- Ensure using correct secret (test vs live mode)
- Check server uses raw body parsing for webhook route

### Invoice not updating to paid
- Check webhook is being received (Stripe Dashboard → Webhooks → Logs)
- Verify invoice exists in database
- Check invoice ID matches webhook metadata
- Review server logs for errors

## Security Notes

1. **Never expose Stripe secret key** in client-side code
2. **Use service role key** only on server-side
3. **Verify webhook signatures** in production
4. **Use RLS policies** to ensure users can only access their own invoices
5. **Validate invoice ownership** before creating checkout sessions
6. **Use HTTPS** for production webhook endpoints
7. **Keep webhook secrets secure** - never commit to git

## Support

- **Stripe Docs**: https://stripe.com/docs
- **Stripe Support**: https://support.stripe.com
- **Check logs**: Server logs for errors, Stripe Dashboard → Webhooks → Logs
