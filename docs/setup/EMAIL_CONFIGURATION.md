# Email Configuration Guide

## Problem
Password reset emails from Freedom Aviation are:
- Going to spam folders
- Links are not clickable (plain text)
- Sent from generic Supabase email addresses

## Solution: Configure Custom SMTP

### Step 1: Choose an Email Service Provider

Recommended options:
- **SendGrid** (Free tier: 100 emails/day)
- **Mailgun** (Free tier: 100 emails/day for 3 months)
- **AWS SES** (Cheapest for high volume)
- **Postmark** (Best deliverability)

### Step 2: Configure SMTP in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/settings/auth)
2. Navigate to: **Settings → Auth → SMTP Settings**
3. Enable "Enable Custom SMTP"
4. Enter your SMTP credentials:
   ```
   Sender name: Freedom Aviation
   Sender email: noreply@freedomaviationco.com
   Host: (from your provider)
   Port: 587 (or 465 for SSL)
   Username: (from your provider)
   Password: (from your provider)
   ```

### Step 3: Configure DNS Records for Email Authentication

Add these DNS records to `freedomaviationco.com`:

#### SPF Record (TXT)
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.YOURPROVIDER.com ~all
TTL: 3600
```

#### DKIM Record (TXT)
```
Type: TXT  
Name: (provided by your email service)
Value: (provided by your email service)
TTL: 3600
```

#### DMARC Record (TXT)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:info@freedomaviationco.com
TTL: 3600
```

### Step 4: Update Email Templates

1. Go to: **Settings → Auth → Email Templates**
2. Select "Reset Password" template
3. Replace with the HTML template below

---

## Email Template: Password Reset

### HTML Version (Copy this to Supabase)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 3px solid #000000;">
              <h1 style="margin: 0; font-size: 24px; color: #000000;">Freedom Aviation</h1>
              <p style="margin: 10px 0 0; font-size: 14px; color: #666666;">Colorado-Based. Front Range Focused.</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; font-size: 20px; color: #333333;">Reset Your Password</h2>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
                Hello,
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
                We received a request to reset your password for your Freedom Aviation account. Click the button below to create a new password:
              </p>
              
              <!-- Button -->
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="border-radius: 4px; background-color: #000000;">
                    <a href="{{ .ConfirmationURL }}" 
                       target="_blank"
                       style="display: inline-block; padding: 16px 36px; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 4px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; font-size: 14px; line-height: 1.5; color: #666666;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="margin: 0 0 20px; padding: 12px; font-size: 14px; line-height: 1.5; color: #0066cc; background-color: #f8f8f8; border-radius: 4px; word-break: break-all;">
                <a href="{{ .ConfirmationURL }}" style="color: #0066cc; text-decoration: none;">{{ .ConfirmationURL }}</a>
              </p>
              
              <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.5; color: #666666;">
                <strong>This link will expire in 60 minutes.</strong>
              </p>
              
              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #666666;">
                If you didn't request this password reset, please ignore this email or contact us if you have concerns.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f8f8; border-top: 1px solid #eeeeee; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                <strong>Freedom Aviation</strong><br>
                7565 S Peoria St, Englewood, CO 80112<br>
                <a href="tel:+17203100443" style="color: #0066cc; text-decoration: none;">(720) 310-0443</a> | 
                <a href="mailto:info@freedomaviationco.com" style="color: #0066cc; text-decoration: none;">info@freedomaviationco.com</a>
              </p>
              
              <p style="margin: 10px 0 0; font-size: 12px; color: #999999;">
                Premium aircraft management and flight instruction at Centennial Airport (KAPA), Colorado.
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Spam Prevention Text -->
        <table role="presentation" style="width: 600px; max-width: 100%; margin-top: 20px;">
          <tr>
            <td style="padding: 0 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999999; line-height: 1.4;">
                This email was sent to {{ .Email }} because you requested a password reset for your Freedom Aviation account.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Quick Setup: SendGrid Example

### 1. Sign up for SendGrid
- Go to [SendGrid](https://signup.sendgrid.com/)
- Free tier: 100 emails/day forever

### 2. Create API Key
1. Go to Settings → API Keys
2. Click "Create API Key"
3. Name: "Supabase Auth"
4. Select "Full Access"
5. Copy the key

### 3. Get SMTP Credentials
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: (your API key from step 2)
```

### 4. Verify Domain
1. In SendGrid: Settings → Sender Authentication
2. Authenticate Your Domain
3. Follow DNS setup instructions
4. Add the provided DNS records to your domain

### 5. Update Supabase
1. Go to Supabase → Settings → Auth → SMTP
2. Enable Custom SMTP
3. Enter:
   ```
   Sender name: Freedom Aviation
   Sender email: noreply@freedomaviationco.com
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: (your SendGrid API key)
   Admin email: info@freedomaviationco.com
   ```
4. Save changes

### 6. Test
1. Go to your app
2. Try "Forgot Password"
3. Check inbox (should arrive within seconds)
4. Verify link is clickable
5. Check spam score at [Mail Tester](https://www.mail-tester.com/)

---

## Troubleshooting

### Emails still going to spam
- Check SPF/DKIM/DMARC records are set correctly
- Warm up your domain (send gradually increasing volumes)
- Ensure sender domain matches email domain
- Check blacklist status: [MXToolbox](https://mxtoolbox.com/blacklists.aspx)

### Links not clickable
- Ensure you're using the HTML template, not plain text
- Test email in different clients (Gmail, Outlook, Apple Mail)
- Verify {{ .ConfirmationURL }} variable is rendering correctly

### SMTP connection errors
- Verify credentials are correct
- Check firewall/port settings (587 or 465)
- Try TLS vs SSL
- Check provider status page

---

## Alternative: Postmark Template

Postmark has excellent deliverability. Template:

```json
{
  "From": "noreply@freedomaviationco.com",
  "To": "{{ .Email }}",
  "Subject": "Reset Your Password - Freedom Aviation",
  "HtmlBody": "(same HTML as above)",
  "TextBody": "Hello,\n\nClick here to reset your password: {{ .ConfirmationURL }}\n\nThis link expires in 60 minutes.\n\n--\nFreedom Aviation\n(970) 618-2094"
}
```

---

## Security Best Practices

1. **Use dedicated email addresses**
   - `noreply@freedomaviationco.com` for automated emails
   - `info@freedomaviationco.com` for support

2. **Set appropriate expiration times**
   - Password reset: 60 minutes (Supabase default)
   - Email confirmation: 24 hours

3. **Monitor email metrics**
   - Open rates
   - Click rates  
   - Spam complaints
   - Bounce rates

4. **Regular testing**
   - Test emails monthly
   - Check deliverability scores
   - Monitor inbox vs spam placement

---

## Cost Comparison

| Provider | Free Tier | Paid (per month) | Deliverability |
|----------|-----------|------------------|----------------|
| SendGrid | 100/day forever | $20 (50k emails) | Excellent |
| Mailgun | 100/day for 3mo | $35 (50k emails) | Excellent |
| Postmark | 100 total | $15 (10k emails) | Best |
| AWS SES | 62,000/month | $0.10/1k emails | Good* |

*Requires IP warming and reputation management

---

## Current Status

- ❌ Using Supabase default email (spam issues)
- ❌ Plain text templates (links not clickable)
- ❌ Generic sender address

## Target State

- ✅ Custom SMTP with freedomaviationco.com domain
- ✅ Professional HTML email templates
- ✅ SPF/DKIM/DMARC configured
- ✅ 95%+ inbox placement rate

