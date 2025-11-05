# Production Stripe Setup Verification Checklist

Use this checklist to verify your production Stripe setup is complete.

## ✅ Checklist

### 1. Stripe Dashboard Configuration

- [ ] **Webhook Endpoint Created**
  - Go to: https://dashboard.stripe.com/webhooks
  - Verify endpoint exists: `https://www.freedomaviationco.com/api/stripe/webhook`
  - Status should be "Enabled"

- [ ] **Events Selected**
  - ✅ `checkout.session.completed`
  - ✅ `payment_intent.succeeded`
  - ✅ `payment_intent.payment_failed` (optional)

- [ ] **Signing Secret Copied**
  - Click on your webhook endpoint
  - Copied the signing secret (starts with `whsec_...`)
  - This is different from your local webhook secret

### 2. Environment Variables (Production)

Verify these are set in your **production** deployment:

- [ ] `STRIPE_SECRET_KEY` = `sk_live_...` (live key, not test!)
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_...` (from production webhook)
- [ ] `SUPABASE_URL` = `https://wsepwuxkwjnsgmkddkjw.supabase.co`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbG...` (service role key)
- [ ] `VITE_SUPABASE_URL` = `https://wsepwuxkwjnsgmkddkjw.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` = `eyJhbG...` (anon key)

### 3. Deployment Platform Configuration

**If using Vercel:**
- [ ] All environment variables added to Production environment
- [ ] Variables are set (not empty)
- [ ] Application redeployed after adding variables

**If using Replit:**
- [ ] All secrets added in Secrets tab
- [ ] Application restarted after adding secrets

### 4. Test Mode vs Live Mode

**Important:** Make sure you're using the correct keys:

- **Test Mode:** Use `sk_test_...` and test webhook secret
- **Live Mode:** Use `sk_live_...` and live webhook secret

You can switch modes in Stripe Dashboard (toggle in top right).

### 5. Testing Production Webhook

1. **Send Test Webhook**
   - Stripe Dashboard → Webhooks → Your endpoint
   - Click "Send test webhook"
   - Select event: `checkout.session.completed`
   - Check if delivery is successful

2. **Check Webhook Logs**
   - Stripe Dashboard → Webhooks → Your endpoint → Logs
   - Should see successful deliveries (200 status)
   - Check for any errors

3. **Test Real Payment** (careful - uses real money!)
   - Make a small test payment on production site
   - Verify invoice updates to "paid" status
   - Check webhook delivery in Stripe Dashboard

## 🔍 Verification Steps

### Check Webhook Endpoint
```bash
# Test if endpoint is accessible (should return error without proper signature)
curl -X POST https://www.freedomaviationco.com/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

Expected: Should return error about missing/invalid signature (confirms endpoint exists)

### Check Environment Variables
Verify in your deployment platform that all variables are set for **Production** environment.

## ⚠️ Important Notes

1. **Never use test keys in production** - Always use `sk_live_...` for production
2. **Webhook secrets are different** - Local and production have different secrets
3. **Test in test mode first** - Use test mode webhooks before going live
4. **Monitor webhook logs** - Check Stripe Dashboard regularly for failed deliveries
5. **HTTPS required** - Production webhooks must use HTTPS

## 🐛 Troubleshooting

### Webhook Not Receiving Events

**Check:**
- Webhook endpoint URL is correct
- Webhook is enabled in Stripe Dashboard
- Events are selected correctly
- Server is accessible from internet
- HTTPS is configured

### Signature Verification Fails

**Check:**
- `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe Dashboard
- Using correct secret (test vs live)
- Server code uses raw body parsing (✅ already configured)

### Invoice Not Updating

**Check:**
- Webhook is being received (check Stripe Dashboard logs)
- Server logs for errors
- Invoice exists in database
- Invoice ID matches webhook metadata

## 📞 Support

If you encounter issues:
1. Check Stripe Dashboard → Webhooks → Logs for errors
2. Check server logs for webhook processing errors
3. Verify all environment variables are set correctly
4. Test with Stripe test webhook feature

---

**Last Updated:** After production setup
**Status:** Ready for production ✅

