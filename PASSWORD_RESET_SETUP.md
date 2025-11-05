# Password Reset Setup Guide

## Issues Fixed

### 1. Reset Link Redirects to Homepage
**Problem**: Password reset links were redirecting to homepage instead of the reset password page.

**Solution**: 
- Fixed hash token preservation in domain redirects
- Improved reset password page to properly wait for hash processing
- Ensured redirect URL uses www domain consistently

### 2. Emails Going to Spam
**Problem**: Password reset emails from Supabase are going to spam folders.

**Solution**: Configure Supabase email settings and improve deliverability.

## Supabase Configuration

### Step 1: Configure Redirect URL in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `wsepwuxkwjnsgmkddkjw`
3. Navigate to **Authentication** → **URL Configuration**
4. Under **Redirect URLs**, add:
   ```
   https://www.freedomaviationco.com/reset-password
   https://freedomaviationco.com/reset-password
   http://localhost:5000/reset-password (for development)
   ```
5. Click **Save**

### Step 2: Configure Email Templates (Improve Deliverability)

1. In Supabase Dashboard, go to **Authentication** → **Email Templates**
2. Select **Reset Password** template
3. Customize the email to improve deliverability:

**Subject Line** (keep professional):
```
Reset Your Freedom Aviation Password
```

**Email Body Template** (replace the default):
```
Click the link below to reset your password:

{{ .ConfirmationURL }}

If you didn't request this, you can safely ignore this email.

This link will expire in 1 hour.

---
Freedom Aviation
7565 S Peoria St, Englewood, CO 80112
(970) 618-2094
```

**Important**: 
- Use `{{ .ConfirmationURL }}` (not `{{ .ConfirmationLink }}`) for the reset link
- Keep the email professional and clear
- Include company contact information

### Step 3: Configure SMTP (Optional - Improves Deliverability)

**Why**: Using custom SMTP instead of Supabase's default email service can significantly improve deliverability and reduce spam filtering.

1. Go to **Authentication** → **Providers** → **Email**
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Configure with your email service:

**Option A: Use Resend (Recommended)**
- Get SMTP credentials from Resend Dashboard
- SMTP Host: `smtp.resend.com`
- SMTP Port: `587` (or `465` for SSL)
- SMTP User: `resend`
- SMTP Password: Your Resend API key (starts with `re_`)
- Sender Email: `Freedom Aviation <invoices@freedomaviationco.com>` (or verified domain email)

**Option B: Use Gmail/Google Workspace**
- SMTP Host: `smtp.gmail.com`
- SMTP Port: `587`
- SMTP User: Your Gmail address
- SMTP Password: App-specific password (not regular password)
- Sender Email: Your Gmail address

**Option C: Use SendGrid**
- SMTP Host: `smtp.sendgrid.net`
- SMTP Port: `587`
- SMTP User: `apikey`
- SMTP Password: Your SendGrid API key
- Sender Email: Verified sender email

### Step 4: Verify Domain (For Better Deliverability)

If using a custom domain email (e.g., `noreply@freedomaviationco.com`):

1. **SPF Record**: Add to DNS
   ```
   TXT record: v=spf1 include:_spf.supabase.co ~all
   ```

2. **DKIM Record**: Supabase provides this in Email Settings
   - Copy the DKIM record from Supabase Dashboard
   - Add as TXT record to your DNS

3. **DMARC Record** (Optional but recommended):
   ```
   TXT record: v=DMARC1; p=none; rua=mailto:dmarc@freedomaviationco.com
   ```

## Testing Password Reset

### Development
1. Start the app: `npm run dev`
2. Go to `/forgot-password`
3. Enter your email
4. Check email (may be in spam)
5. Click the reset link
6. Should redirect to `/reset-password` with form
7. Enter new password and confirm
8. Should redirect to `/login`

### Production
1. Go to `https://www.freedomaviationco.com/forgot-password`
2. Enter email
3. Check email inbox (and spam folder)
4. Click reset link
5. Should see reset password form (not homepage)
6. Complete password reset

## Troubleshooting

### Link Still Redirects to Homepage

**Check:**
1. ✅ Redirect URL in Supabase matches your domain
2. ✅ URL includes `/reset-password` path
3. ✅ Hash tokens are preserved in URL
4. ✅ No JavaScript errors in browser console

**Fix:**
- Verify redirect URL in Supabase Dashboard → Authentication → URL Configuration
- Check browser console for errors
- Ensure you're using the correct domain (www vs non-www)

### Email Still Going to Spam

**Check:**
1. ✅ Email template is professional (no spam keywords)
2. ✅ SPF/DKIM records are configured (if using custom domain)
3. ✅ SMTP is configured (optional but recommended)
4. ✅ Sender email is verified

**Improve Deliverability:**
1. Use custom SMTP (Resend, SendGrid, etc.)
2. Configure SPF/DKIM/DMARC records
3. Use a verified domain email address
4. Avoid spam trigger words in email content
5. Keep email format professional

### Token Expired Error

**Check:**
1. ✅ Link is clicked within 1 hour
2. ✅ Link hasn't been used before
3. ✅ URL hash is intact (not stripped)

**Fix:**
- Request a new password reset link
- Ensure link is clicked promptly
- Check that browser isn't stripping URL hash

## Code Changes Made

### 1. `client/src/lib/auth-context.tsx`
- Updated `resetPasswordForEmail` to use www domain in production
- Ensures redirect URL matches Supabase configuration

### 2. `client/src/pages/reset-password.tsx`
- Improved hash token detection
- Better handling of password recovery tokens
- Prevents premature redirect to forgot-password page

### 3. `client/src/App.tsx`
- Updated `DomainRedirect` to preserve hash tokens
- Prevents redirect when password reset tokens are in URL

## Next Steps

1. **Configure Supabase Redirect URLs** (Required)
   - Add redirect URLs in Supabase Dashboard
   - Use exact domain (www.freedomaviationco.com)

2. **Improve Email Template** (Recommended)
   - Customize email template in Supabase
   - Use professional subject line and body

3. **Configure Custom SMTP** (Optional but Recommended)
   - Set up Resend or SendGrid SMTP
   - Improves deliverability significantly

4. **Verify Domain** (Optional)
   - Add SPF/DKIM records
   - Improves email reputation

## Support

- **Supabase Docs**: https://supabase.com/docs/guides/auth
- **Email Deliverability Guide**: https://supabase.com/docs/guides/auth/auth-email-deliverability
- **Check Supabase Logs**: Dashboard → Logs → Auth Logs

