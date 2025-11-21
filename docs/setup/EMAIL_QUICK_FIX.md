# Quick Fix: Password Reset Emails Going to Spam

## Current Problem
✗ Password reset emails going to spam
✗ Links not clickable (plain text)
✗ Emails from generic `noreply@mail.app.supabase.io`

## Immediate Solution (15 minutes)

### Step 1: Update Email Template (5 minutes)

1. **Go to Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/settings/auth
   ```

2. **Navigate to Email Templates**
   - Click "Auth" in left sidebar
   - Scroll to "Email Templates"
   - Click "Reset Password"

3. **Copy New Template**
   - Open: `/docs/setup/email-templates/reset-password.html`
   - Copy entire contents (Ctrl/Cmd + A, then Ctrl/Cmd + C)

4. **Paste into Supabase**
   - Delete existing template
   - Paste new HTML template
   - Click "Save"

5. **Repeat for Signup Email**
   - Click "Confirm Signup"
   - Copy contents from `/docs/setup/email-templates/confirm-signup.html`
   - Paste and save

### Step 2: Test the Fix (2 minutes)

1. **Test Password Reset**
   ```
   1. Go to https://www.freedomaviationco.com/forgot-password
   2. Enter your email
   3. Check inbox (should arrive in ~10 seconds)
   4. Verify link IS clickable
   ```

2. **Expected Results**
   - ✓ Email arrives (may still go to spam for now)
   - ✓ Link is clickable HTML button
   - ✓ Professional branding visible
   - ✓ Email looks clean and professional

### Step 3: Configure Custom SMTP (Optional but Recommended)

**This step prevents emails from going to spam. Takes 20-30 minutes.**

#### Option A: SendGrid (Recommended - Free Forever)

1. **Sign up for SendGrid**
   - Go to https://signup.sendgrid.com/
   - Use: info@freedomaviationco.com
   - Free tier: 100 emails/day

2. **Create API Key**
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name: "Supabase Auth Emails"
   - Permission: Full Access
   - **Copy the key immediately** (you can't see it again)

3. **Configure in Supabase**
   ```
   Go to: https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/settings/auth
   
   Scroll to "SMTP Settings"
   
   Enable Custom SMTP: ✓
   
   Sender name: Freedom Aviation
   Sender email: noreply@freedomaviationco.com
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: (paste your API key)
   Admin email: info@freedomaviationco.com
   
   Click "Save"
   ```

4. **Verify Domain (Critical for avoiding spam)**
   - In SendGrid: Settings → Sender Authentication
   - Click "Authenticate Your Domain"
   - Domain: freedomaviationco.com
   - Follow DNS instructions
   - Add 3 CNAME records to your DNS provider
   - Wait 24-48 hours for DNS propagation

#### Option B: Quick Test with Gmail SMTP

**Warning:** Gmail blocks automated emails after ~100 sends. Only use for testing!

```
Host: smtp.gmail.com
Port: 587
Username: your-gmail@gmail.com
Password: (app-specific password from Google)
```

To create app password:
1. Google Account → Security
2. Enable 2FA (required)
3. Search "App passwords"
4. Generate new password
5. Use that password in Supabase

## Results After Full Setup

| Metric | Before | After |
|--------|--------|-------|
| Inbox Delivery | ~20% | ~95% |
| Link Clickable | ❌ No | ✅ Yes |
| Professional Look | ❌ Plain Text | ✅ Branded HTML |
| Sender Address | `noreply@mail.app.supabase.io` | `noreply@freedomaviationco.com` |
| Email Reputation | Shared (poor) | Dedicated (good) |

## Verification Steps

After completing all steps:

1. **Send Test Email**
   ```bash
   # Use your app's forgot password
   # Or test in Supabase dashboard
   ```

2. **Check Spam Score**
   ```
   1. Send email to: test-xxxxx@mail-tester.com
      (generate random ID at mail-tester.com)
   2. Visit mail-tester.com
   3. View your score
   4. Aim for: 8/10 or higher
   ```

3. **Test Multiple Clients**
   - [ ] Gmail (web)
   - [ ] Gmail (mobile)
   - [ ] Apple Mail
   - [ ] Outlook
   - [ ] Yahoo Mail

## DNS Configuration

Once you have SendGrid or another provider set up, add these DNS records:

### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:sendgrid.net ~all
TTL: 3600
```

### DKIM Records
```
(SendGrid will provide 3 CNAME records)
Copy from SendGrid dashboard and add to DNS
```

### DMARC Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:info@freedomaviationco.com
TTL: 3600
```

## Common Issues

### Issue: "Invalid SMTP credentials"
**Solution:** Double-check username and password. For SendGrid, username is literally "apikey"

### Issue: "Connection timeout"
**Solution:** Try port 465 instead of 587, or check firewall settings

### Issue: Still going to spam after SMTP setup
**Solution:** 
1. Verify domain in your email provider
2. Add SPF/DKIM/DMARC records
3. Wait 24-48 hours for DNS propagation
4. Warm up domain (send gradually increasing volumes)

### Issue: Links still not clickable
**Solution:** Make sure you're using HTML template, not plain text. Clear browser cache.

## Cost Breakdown

| Provider | Free Tier | Monthly Cost |
|----------|-----------|--------------|
| SendGrid | 100/day | $0 |
| Mailgun | 100/day (3mo) | $0 → $35 |
| Postmark | 100 total | $15/mo |
| AWS SES | 62k/month | $0.10/1k |

**Recommendation:** Start with SendGrid free tier (enough for most needs)

## Timeline

| Task | Time | When |
|------|------|------|
| Update templates | 5 min | NOW |
| Test changes | 2 min | NOW |
| Sign up SendGrid | 5 min | Today |
| Configure SMTP | 10 min | Today |
| Add DNS records | 10 min | Today |
| DNS propagation | 24-48 hrs | Wait |
| Final testing | 10 min | After DNS |

## Need Help?

- **Full Documentation:** `/docs/setup/EMAIL_CONFIGURATION.md`
- **Email Templates:** `/docs/setup/email-templates/`
- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth/auth-smtp
- **SendGrid Docs:** https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api

## Quick Links

- [Supabase Dashboard - Auth Settings](https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/settings/auth)
- [SendGrid Signup](https://signup.sendgrid.com/)
- [Mail Tester](https://www.mail-tester.com/)
- [MXToolbox Blacklist Check](https://mxtoolbox.com/blacklists.aspx)

---

**Priority:** 🔴 HIGH - Affects user authentication and onboarding

**Impact:** Users can't reset passwords → Can't access accounts → Lost customers

**Estimated Fix Time:** 15 minutes (templates only) → 2 hours (full SMTP + DNS)

