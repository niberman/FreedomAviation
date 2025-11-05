# Email Setup Guide

Complete guide for setting up automatic invoice emails when CFIs finalize invoices.

## Overview

When a CFI finalizes an invoice, an email is automatically sent to the client with the invoice details. The system supports multiple email service options.

## Quick Setup (Production - Vercel)

### Step 1: Create Resend Account
1. Go to https://resend.com
2. Sign up (free tier: 3,000 emails/month)
3. Verify your email

### Step 2: Get API Key
1. Resend Dashboard → **API Keys**
2. Click **Create API Key**
3. Name it: "Freedom Aviation Vercel"
4. Copy the API key (starts with `re_...`)

### Step 3: Configure Vercel Environment Variables
1. Go to Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:
   - `EMAIL_SERVICE` = `resend`
   - `RESEND_API_KEY` = `re_xxxxxxxxxxxxx`
   - `EMAIL_FROM` = `Freedom Aviation <invoices@freedomaviationco.com>`
4. **Important:** Select all three environments (Production, Preview, Development)
5. Click **Save**
6. **Redeploy** your application

### Step 4: Verify Domain (Optional)

**Option A: Use Resend Test Domain (Quick Testing)**
- No setup needed - Resend provides a test domain
- Change `EMAIL_FROM` to: `onboarding@resend.dev` (for testing)
- Works immediately, but emails come from Resend domain

**Option B: Use Your Own Domain (Recommended)**
1. Resend Dashboard → **Domains**
2. Click **Add Domain**
3. Enter: `freedomaviationco.com`
4. Add the DNS records Resend provides:
   - **SPF record** (TXT)
   - **DKIM record** (TXT)
   - **DMARC record** (TXT) - optional but recommended
5. Wait for verification (usually 5-15 minutes)
6. Once verified, use: `invoices@freedomaviationco.com`

## Email Service Options

### Option 1: Console Logging (Development - Default)

By default, emails are logged to the console for development:

```bash
EMAIL_SERVICE=console  # or don't set it (defaults to console)
```

**What happens:** Email content is logged to server console instead of being sent.

**Use when:** Local development, testing email templates

### Option 2: Resend (Recommended for Production)

[Resend](https://resend.com) is a modern email API service that works perfectly with Vercel serverless functions.

**Setup:**
1. Sign up at https://resend.com (free tier: 3,000 emails/month)
2. Get your API key from https://resend.com/api-keys
3. Configure environment variables (see Quick Setup above)
4. Redeploy application

**Cost:** Free tier: 3,000 emails/month, 100 emails/day

### Option 3: SMTP (Custom SMTP Server)

For SMTP servers (Gmail, SendGrid, custom, etc.):

```bash
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Freedom Aviation <invoices@freedomaviationco.com>"
```

**Note:** SMTP implementation is currently a placeholder. You'll need to add nodemailer if you want to use SMTP.

## How It Works

1. **CFI finalizes invoice** → Clicks "Mark as Finalized" in Staff Dashboard
2. **Invoice status changes** → Status updates to "finalized" in database
3. **Email sent automatically** → Invoice email sent to client via configured email service
4. **Confirmation shown** → Toast: "Invoice finalized and email sent to client"

## Email Template

The invoice email includes:
- Professional HTML formatting
- Invoice number
- Client name and email
- Invoice line items (description, hours, rate, amount)
- Total amount
- Due date (if set)
- Aircraft tail number (if available)
- Freedom Aviation branding

## Testing

### Development (Console Mode)

1. Set `EMAIL_SERVICE=console` in local environment
2. Finalize an invoice in Staff Dashboard
3. Check server console/terminal
4. You'll see the email content logged:
   ```
   📧 INVOICE EMAIL (would send):
   To: client@example.com
   Subject: Invoice INV-20250101-12345678 - Freedom Aviation
   HTML: [full HTML content]
   ```

### Production (Resend)

1. Set up Resend account and API key
2. Configure environment variables in Vercel
3. Redeploy application
4. Finalize an invoice
5. Check Resend Dashboard → **Emails** → **Logs**
6. Verify client received email

## Monitoring

### Resend Dashboard
- **URL**: https://resend.com/emails
- View all sent emails
- Check delivery status
- See bounce/error messages

### Vercel Logs
- Vercel Dashboard → Functions → Logs
- Check for email sending errors
- Verify API calls are working

## Troubleshooting

### Email not sending

**Check:**
1. ✅ Environment variable `EMAIL_SERVICE` is set correctly
2. ✅ For Resend: `RESEND_API_KEY` is set
3. ✅ Invoice status is "finalized" (not "draft")
4. ✅ Client has valid email address in `user_profiles`
5. ✅ Application was redeployed after adding variables
6. ✅ Check server logs for errors

**View logs:**
- Vercel Dashboard → Your Project → **Functions**
- Click on `/api/invoices/send-email`
- Check for errors

### Email sent but not received

**Check:**
1. Check Resend Dashboard → **Emails** → **Logs**
2. Look for delivery status (delivered, bounced, failed)
3. Check client's spam/junk folder
4. Verify client email address is correct in database
5. Check if domain is verified (for Resend custom domain)

### Console shows "Unknown email service"

**Fix:**
- Set `EMAIL_SERVICE` to one of: `console`, `resend`, or `smtp`

### Domain not verified

**If using custom domain:**
1. Check DNS records are correct
2. Wait 15-30 minutes for DNS propagation
3. Check Resend Dashboard → **Domains** for status
4. Use test domain (`onboarding@resend.dev`) for immediate testing

## API Endpoint

You can also manually trigger email sending:

```bash
POST /api/invoices/send-email
Content-Type: application/json

{
  "invoiceId": "uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice email sent successfully"
}
```

## Environment Variables Summary

```bash
# Required for production email sending (Resend)
EMAIL_SERVICE=resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=Freedom Aviation <invoices@freedomaviationco.com>

# For development (console logging)
EMAIL_SERVICE=console

# Already configured (Supabase)
SUPABASE_URL=https://wsepwuxkwjnsgmkddkjw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Already configured (Stripe)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Email Service Comparison

| Service | Setup Difficulty | Cost | Recommended For |
|---------|-----------------|------|------------------|
| Console | ✅ Easy | Free | Development |
| Resend | ✅ Easy | Free tier available | Production |
| SMTP | ⚠️ Medium | Varies | Custom setups |

## Future Enhancements

### Custom Domain (Optional)
1. Go to Resend Dashboard → Domains
2. Add `freedomaviationco.com`
3. Add DNS records (SPF, DKIM, DMARC)
4. Wait for verification
5. Update `EMAIL_FROM` to: `Freedom Aviation <invoices@freedomaviationco.com>`

### Email Templates
- Current: Professional HTML invoice template
- Future: Can customize template in `server/lib/email.ts`

## Support

- **Resend Docs**: https://resend.com/docs
- **Resend Support**: support@resend.com
- **Vercel Docs**: https://vercel.com/docs
- **Check logs**: Vercel Dashboard → Functions → Logs

