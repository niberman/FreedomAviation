# Vercel Production Email Setup Guide

This guide shows you how to set up automatic invoice emails in production on Vercel.

## Stack Overview

- **Vercel** - Hosting and serverless functions
- **Supabase** - Database (already configured)
- **Stripe** - Payments (already configured)
- **Resend** - Email service (recommended for Vercel)

## Quick Setup (5 minutes)

### Step 1: Create Resend Account

1. Go to https://resend.com
2. Sign up (free tier: 3,000 emails/month)
3. Verify your email

### Step 2: Get API Key

1. In Resend Dashboard → **API Keys**
2. Click **Create API Key**
3. Name it: "Freedom Aviation Vercel"
4. Copy the API key (starts with `re_...`)

### Step 3: Configure Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:

   | Variable Name | Value | Environment |
   |--------------|-------|-------------|
   | `EMAIL_SERVICE` | `resend` | Production, Preview, Development |
   | `RESEND_API_KEY` | `re_xxxxxxxxxxxxx` | Production, Preview, Development |
   | `EMAIL_FROM` | `Freedom Aviation <invoices@freedomaviationco.com>` | Production, Preview, Development |

4. **Important:** Select all three environments (Production, Preview, Development)
5. Click **Save**

### Step 4: Verify Domain (For Production)

**Option A: Use Resend Test Domain (Quick Testing)**
- No setup needed - Resend provides a test domain
- Change `EMAIL_FROM` to: `onboarding@resend.dev` (for testing)
- Works immediately, but emails come from Resend domain

**Option B: Use Your Own Domain (Recommended)**
1. In Resend Dashboard → **Domains**
2. Click **Add Domain**
3. Enter: `freedomaviationco.com`
4. Add the DNS records Resend shows to your domain:
   - **SPF record** (TXT)
   - **DKIM record** (TXT)
   - **DMARC record** (TXT) - optional but recommended
5. Wait for verification (usually 5-15 minutes)
6. Once verified, use: `invoices@freedomaviationco.com`

### Step 5: Redeploy

1. Go to Vercel Dashboard → **Deployments**
2. Click **...** on latest deployment → **Redeploy**
3. Or push a new commit to trigger deployment

## Testing

### Test in Development

1. Set `EMAIL_SERVICE=console` in local environment
2. Finalize an invoice
3. Check server console for email content

### Test in Production

1. Make sure environment variables are set in Vercel
2. Finalize an invoice in production
3. Check Resend Dashboard → **Emails** → **Logs**
4. Verify email was sent and delivered

## Verification Checklist

- [ ] Resend account created
- [ ] API key generated and copied
- [ ] Environment variables added to Vercel (all 3 environments)
- [ ] Domain verified (if using custom domain)
- [ ] Application redeployed
- [ ] Test invoice finalized
- [ ] Email received by client

## Troubleshooting

### Email not sending

**Check:**
1. ✅ Environment variables set in Vercel
2. ✅ `EMAIL_SERVICE=resend` (not "console")
3. ✅ `RESEND_API_KEY` is correct
4. ✅ Application redeployed after adding variables
5. ✅ Check Vercel function logs for errors

**View logs:**
- Vercel Dashboard → Your Project → **Functions**
- Click on `/api/invoices/send-email`
- Check for errors

### Email sent but not received

**Check:**
1. Resend Dashboard → **Emails** → **Logs**
2. Check delivery status
3. Check spam/junk folder
4. Verify recipient email address in database

### Domain not verified

**If using custom domain:**
1. Check DNS records are correct
2. Wait 15-30 minutes for DNS propagation
3. Check Resend Dashboard → **Domains** for status
4. Use test domain (`onboarding@resend.dev`) for immediate testing

## Environment Variables Summary

```bash
# Required for production email sending
EMAIL_SERVICE=resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=Freedom Aviation <invoices@freedomaviationco.com>

# Already configured (Supabase)
SUPABASE_URL=https://wsepwuxkwjnsgmkddkjw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Already configured (Stripe)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Cost

**Resend Free Tier:**
- 3,000 emails/month
- 100 emails/day
- Perfect for starting out

**Resend Paid Plans:**
- Start at $20/month for 50,000 emails
- Only needed if you exceed free tier

## Next Steps

1. ✅ Set up Resend account
2. ✅ Add environment variables to Vercel
3. ✅ Redeploy application
4. ✅ Test by finalizing an invoice
5. ✅ Verify email delivery in Resend Dashboard

## Support

- **Resend Docs:** https://resend.com/docs
- **Resend Support:** support@resend.com
- **Vercel Docs:** https://vercel.com/docs
- **Check logs:** Vercel Dashboard → Functions → Logs

