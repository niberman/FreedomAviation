# Email Configuration Guide

## Overview

Freedom Aviation uses email for invoice delivery and password reset functionality. This guide covers setup for both Resend (invoice emails) and Supabase Auth (password reset emails).

## Invoice Emails (Resend)

### Quick Setup

1. **Create Resend Account**
   - Go to https://resend.com
   - Sign up (free tier: 3,000 emails/month)
   - Verify your email

2. **Get API Key**
   - Resend Dashboard → API Keys
   - Create new key: "Freedom Aviation"
   - Copy the API key (starts with `re_`)

3. **Configure Environment Variables**
   ```env
   EMAIL_SERVICE=resend
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   EMAIL_FROM=Freedom Aviation <invoices@freedomaviationco.com>
   ```

4. **Verify Domain (Recommended)**
   - Resend Dashboard → Domains → Add Domain
   - Enter: `freedomaviationco.com`
   - Add DNS records (SPF, DKIM, DMARC)
   - Wait for verification (5-15 minutes)

### Email Service Options

#### Console Logging (Development)
```env
EMAIL_SERVICE=console
```
Logs email content to server console instead of sending.

#### Resend (Production - Recommended)
```env
EMAIL_SERVICE=resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=Freedom Aviation <invoices@freedomaviationco.com>
```

**Cost**: Free tier: 3,000 emails/month, 100 emails/day

### How It Works

1. CFI finalizes invoice in Staff Dashboard
2. Invoice status updates to "finalized"
3. Email automatically sent to client
4. Confirmation toast shown

### Email Template

The invoice email includes:
- Professional HTML formatting
- Invoice number and details
- Line items with hours and amounts
- Total amount and due date
- Aircraft information
- Freedom Aviation branding

### Monitoring

**Resend Dashboard**: https://resend.com/emails
- View all sent emails
- Check delivery status
- See bounce/error messages

**Vercel Logs**: Functions → Logs
- Check for sending errors
- Verify API calls

### Troubleshooting

**Email not sending:**
- Check `EMAIL_SERVICE` environment variable
- Verify `RESEND_API_KEY` is set
- Ensure invoice status is "finalized"
- Confirm client has valid email
- Check Resend Dashboard logs

**Email sent but not received:**
- Check Resend Dashboard for delivery status
- Check client's spam folder
- Verify email address is correct
- Ensure domain is verified

## Password Reset Emails (Supabase)

### Supabase Configuration

1. **Configure Redirect URLs**
   - Supabase Dashboard → Authentication → URL Configuration
   - Add redirect URLs:
     ```
     https://www.freedomaviationco.com/reset-password
     https://freedomaviationco.com/reset-password
     http://localhost:5000/reset-password
     ```

2. **Customize Email Template**
   - Authentication → Email Templates → Reset Password
   - Professional subject: "Reset Your Freedom Aviation Password"
   - Include company contact information
   - Use `{{ .ConfirmationURL }}` for reset link

3. **Configure Custom SMTP (Recommended)**
   - Authentication → Providers → Email → SMTP Settings
   - Improves deliverability and reduces spam filtering

### SMTP Options

**Option A: Resend (Recommended)**
```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Password: [Your Resend API key]
Sender Email: Freedom Aviation <noreply@freedomaviationco.com>
```

**Option B: Gmail/Google Workspace**
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: [Your Gmail address]
SMTP Password: [App-specific password]
```

**Option C: SendGrid**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: [Your SendGrid API key]
```

### Domain Verification

For better deliverability, add DNS records:

**SPF Record**:
```
TXT: v=spf1 include:_spf.supabase.co ~all
```

**DKIM Record**:
- Provided in Supabase Dashboard
- Add as TXT record to DNS

**DMARC Record** (Optional):
```
TXT: v=DMARC1; p=none; rua=mailto:dmarc@freedomaviationco.com
```

### Testing Password Reset

**Development:**
1. Go to `/forgot-password`
2. Enter email
3. Check email (may be in spam initially)
4. Click reset link
5. Should redirect to `/reset-password`
6. Enter new password
7. Should redirect to `/login`

**Production:**
1. Visit `https://www.freedomaviationco.com/forgot-password`
2. Complete reset flow
3. Verify no redirect to homepage

### Troubleshooting

**Link redirects to homepage:**
- Verify redirect URL in Supabase matches domain
- Check URL includes `/reset-password` path
- Ensure hash tokens are preserved
- Check browser console for errors

**Emails going to spam:**
- Use custom SMTP (Resend, SendGrid)
- Configure SPF/DKIM/DMARC records
- Use verified domain email
- Keep email content professional

**Token expired error:**
- Link must be clicked within 1 hour
- Request new reset link if expired
- Ensure URL hash is intact

## Environment Variables Summary

```env
# Invoice Emails (Resend)
EMAIL_SERVICE=resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=Freedom Aviation <invoices@freedomaviationco.com>

# Development Email Testing
EMAIL_SERVICE=console

# Supabase (for password reset)
VITE_SUPABASE_URL=https://wsepwuxkwjnsgmkddkjw.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## API Endpoints

### Send Invoice Email
```
POST /api/invoices/send-email
Content-Type: application/json

{
  "invoiceId": "uuid-here"
}
```

Response:
```json
{
  "success": true,
  "message": "Invoice email sent successfully"
}
```

## Best Practices

1. **Use custom SMTP** for production
2. **Verify your domain** for better deliverability
3. **Monitor email logs** regularly
4. **Test thoroughly** before going live
5. **Keep templates professional** and clear
6. **Set up DNS records** (SPF, DKIM, DMARC)

## Support Resources

- **Resend Docs**: https://resend.com/docs
- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Email Deliverability**: https://supabase.com/docs/guides/auth/auth-email-deliverability
- **Vercel Logs**: Vercel Dashboard → Functions → Logs

