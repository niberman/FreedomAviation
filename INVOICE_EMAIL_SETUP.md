# Invoice Email Setup Guide

When a CFI finalizes an invoice, an email is automatically sent to the client with the invoice details.

## How It Works

1. **CFI finalizes invoice** → Clicks "Mark as Finalized" in Staff Dashboard
2. **Invoice is finalized** → Status changes to "finalized" in database
3. **Email is sent automatically** → Invoice email sent to client's email address

## Email Configuration

The system supports multiple email service options. Configure via environment variable:

### Option 1: Console Logging (Default - Development)

By default, emails are logged to the console for development:

```bash
EMAIL_SERVICE=console  # or don't set it (defaults to console)
```

**What happens:** Email content is logged to server console instead of being sent.

### Option 2: Resend (Recommended for Production - Vercel)

[Resend](https://resend.com) is a modern email API service that works perfectly with Vercel serverless functions.

**Setup for Vercel:**
1. Sign up at https://resend.com (free tier: 3,000 emails/month)
2. Get your API key from https://resend.com/api-keys
3. In Vercel Dashboard:
   - Go to your project → Settings → Environment Variables
   - Add these variables:
     - `EMAIL_SERVICE` = `resend`
     - `RESEND_API_KEY` = `re_xxxxxxxxxxxxx` (your API key)
     - `EMAIL_FROM` = `Freedom Aviation <invoices@freedomaviationco.com>`
   - Select environment: **Production**, **Preview**, and **Development**
   - Click **Save**
4. **Redeploy** your application

**Domain Setup:**
1. In Resend Dashboard → Domains
2. Add your domain: `freedomaviationco.com`
3. Add the DNS records Resend provides to your domain
4. Wait for verification (usually a few minutes)
5. Once verified, emails will be sent from `invoices@freedomaviationco.com`

**Note:** During testing, you can use Resend's test domain without verification.

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

1. Finalize an invoice in Staff Dashboard
2. Check server console/terminal
3. You'll see the email content logged:
   ```
   📧 INVOICE EMAIL (would send):
   To: client@example.com
   Subject: Invoice INV-20250101-12345678 - Freedom Aviation
   HTML: [full HTML content]
   ```

### Production (Resend)

1. Set up Resend account and API key
2. Configure environment variables
3. Finalize an invoice
4. Check Resend dashboard for delivery status
5. Client receives email automatically

## Troubleshooting

### Email not sending

**Check:**
1. ✅ Environment variable `EMAIL_SERVICE` is set correctly
2. ✅ For Resend: `RESEND_API_KEY` is set
3. ✅ Invoice status is "finalized"
4. ✅ Client has valid email address in `user_profiles`
5. ✅ Check server logs for errors

### Email sent but not received

**Check:**
1. Check spam/junk folder
2. Verify email address in database
3. Check Resend dashboard for delivery status
4. Check if domain is verified (for Resend)

### Console shows "Unknown email service"

**Fix:**
- Set `EMAIL_SERVICE` to one of: `console`, `resend`, or `smtp`

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

## Next Steps

1. **For Development:** Keep using `console` mode to see email content
2. **For Production:** Set up Resend account and configure API key
3. **Test:** Finalize an invoice and verify email is sent/received

## Email Service Comparison

| Service | Setup Difficulty | Cost | Recommended For |
|---------|-----------------|------|------------------|
| Console | ✅ Easy | Free | Development |
| Resend | ✅ Easy | Free tier available | Production |
| SMTP | ⚠️ Medium | Varies | Custom setups |

