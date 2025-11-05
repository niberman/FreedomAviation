# Stripe Webhook Setup Guide

This guide explains how to set up Stripe webhooks for both local development and production.

## Overview

Stripe webhooks notify your server when payment events occur (like when a payment succeeds). Your server automatically updates invoice status to "paid" when it receives the `checkout.session.completed` event.

**Webhook Endpoint:** `/api/stripe/webhook`

## Local Development Setup

You're already doing this! ✅

### Current Setup (Already Running)

In a terminal, run:
```bash
stripe listen --forward-to localhost:5000/api/stripe/webhook
```

This:
- Forwards Stripe webhooks to your local server
- Shows webhook events in real-time
- Provides a webhook signing secret (starts with `whsec_...`)

### What You Should See

```
> Ready! You are using Stripe API Version [2025-08-27.basil]. 
Your webhook signing secret is whsec_507a8d723473aca2f99080f0e95eed5a33413c6b9dd46d2511897ec48636f549
```

### Testing Locally

1. Keep the webhook listener running
2. Make a test payment in your app
3. You'll see webhook events in the terminal:
   ```
   2025-11-04 12:00:00  --> checkout.session.completed [evt_xxx]
   2025-11-04 12:00:00  <-- [200] POST http://localhost:5000/api/stripe/webhook [evt_xxx]
   ```

---

## Production Setup

For production, you need to configure a webhook endpoint in the Stripe Dashboard.

### Step 1: Get Your Production URL

Your production domain is: **www.freedomaviationco.com**

Webhook URL: `https://www.freedomaviationco.com/api/stripe/webhook`

### Step 2: Create Webhook Endpoint in Stripe Dashboard

1. **Go to Stripe Dashboard**
   - https://dashboard.stripe.com/webhooks
   - Make sure you're in **Test mode** or **Live mode** (depending on what you need)

2. **Click "Add endpoint"**

3. **Enter Endpoint URL**
   ```
   https://www.freedomaviationco.com/api/stripe/webhook
   ```

4. **Select Events to Listen For**
   Check these events:
   - ✅ `checkout.session.completed` - When payment is successful
   - ✅ `payment_intent.succeeded` - When payment intent succeeds
   - ✅ `payment_intent.payment_failed` - When payment fails (optional)

5. **Click "Add endpoint"**

6. **Copy the Signing Secret**
   - Click on your new endpoint
   - Find "Signing secret"
   - Click "Reveal" and copy it (starts with `whsec_...`)

### Step 3: Add Webhook Secret to Production Environment

Add the signing secret as an environment variable in your deployment platform:

**For Vercel:**
1. Go to Project Settings → Environment Variables
2. Add: `STRIPE_WEBHOOK_SECRET` = `whsec_...`
3. Select environment: **Production**
4. Redeploy

**For Replit:**
1. Go to Secrets tab (🔒 icon)
2. Add: Key = `STRIPE_WEBHOOK_SECRET`, Value = `whsec_...`
3. Restart

### Step 4: Test Production Webhook

1. Make a test payment on your production site
2. Check Stripe Dashboard → Webhooks → Your endpoint
3. You should see successful webhook deliveries
4. Invoice should automatically update to "paid" status

---

## Webhook Events Handled

Your server handles these events:

### `checkout.session.completed`
- **When:** Customer completes payment
- **Action:** Updates invoice status to `paid` and sets `paid_date`
- **Required:** ✅ Yes

### `payment_intent.succeeded`
- **When:** Payment intent succeeds (backup handler)
- **Action:** Updates invoice if not already updated
- **Required:** ✅ Yes (recommended)

### `payment_intent.payment_failed`
- **When:** Payment fails
- **Action:** Logs the failure (currently just logs)
- **Required:** ⚠️ Optional

---

## Troubleshooting

### Webhook Not Receiving Events

**Check:**
1. ✅ Webhook endpoint URL is correct
2. ✅ Webhook is enabled in Stripe Dashboard
3. ✅ Correct events are selected
4. ✅ `STRIPE_WEBHOOK_SECRET` is set in production environment
5. ✅ Server is accessible from the internet (for production)

**Test webhook:**
- In Stripe Dashboard → Webhooks → Your endpoint → "Send test webhook"
- Select `checkout.session.completed` event
- Should see successful delivery

### Webhook Signature Verification Failed

**Error:** `Webhook Error: No signatures found matching the expected signature`

**Solution:**
- Verify `STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe Dashboard
- Make sure you're using the correct secret (test vs live mode)
- Check that the webhook endpoint uses raw body parsing (✅ already configured in `server/index.ts`)

### Invoice Not Updating to Paid

**Check:**
1. ✅ Webhook is being received (check Stripe Dashboard → Webhooks → Logs)
2. ✅ Invoice exists in database
3. ✅ Invoice ID matches in webhook metadata
4. ✅ Server logs for errors

**Debug:**
- Check server logs when webhook is received
- Verify invoice ID in webhook metadata matches database
- Check Supabase logs for update errors

---

## Quick Reference

### Local Development
```bash
# Start webhook listener
stripe listen --forward-to localhost:5000/api/stripe/webhook

# Get webhook secret (printed in output)
# Export it:
export STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Production
```
Webhook URL: https://www.freedomaviationco.com/api/stripe/webhook
Events: checkout.session.completed, payment_intent.succeeded
Secret: Get from Stripe Dashboard → Webhooks → Your endpoint
```

### Environment Variables
```bash
# Local (from stripe listen command)
STRIPE_WEBHOOK_SECRET=whsec_507a8d723473aca2f99080f0e95eed5a33413c6b9dd46d2511897ec48636f549

# Production (from Stripe Dashboard)
STRIPE_WEBHOOK_SECRET=whsec_... (different secret)
```

---

## Security Notes

1. **Always verify webhook signatures** in production
2. **Use different secrets** for test and live modes
3. **Keep webhook secrets secure** - never commit to git
4. **Use HTTPS** for production webhook endpoints
5. **Monitor webhook logs** in Stripe Dashboard for suspicious activity

---

## Next Steps

1. ✅ Local webhook is already running (you're doing this!)
2. ⏳ Set up production webhook endpoint in Stripe Dashboard
3. ⏳ Add production webhook secret to deployment platform
4. ⏳ Test production webhook with a real payment

For more details, see `STRIPE_SETUP.md`.

