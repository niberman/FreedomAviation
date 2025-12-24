# Email Templates for Supabase Auth

Professional HTML email templates for Freedom Aviation authentication emails.

## Templates Included

1. **reset-password.html** - Password reset emails
2. **confirm-signup.html** - New user email confirmation
3. **magic-link.html** - Passwordless sign-in links

## How to Use

### Quick Setup

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/settings/auth
   - Navigate to: Settings → Auth → Email Templates

2. **Select Template Type**
   - Choose which template to update (Reset Password, Confirm Signup, or Magic Link)

3. **Copy & Paste**
   - Open the corresponding `.html` file from this directory
   - Copy the entire contents
   - Paste into the Supabase template editor
   - Click "Save"

4. **Repeat for All Templates**
   - Update all three templates for consistent branding

### Template Variables

All templates use Supabase's template variables:

- `{{ .Email }}` - Recipient's email address
- `{{ .ConfirmationURL }}` - The action link (reset password, confirm email, etc.)
- `{{ .Token }}` - Raw token (if needed for custom implementations)
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL (configured in Supabase)
- `{{ .RedirectTo }}` - Redirect URL after action

**Note:** Only use the variables that are available for each template type in Supabase.

## Testing

After updating templates:

1. **Test Each Flow**
   ```bash
   # Test password reset
   Go to /forgot-password
   Enter email
   Check inbox
   
   # Test signup
   Go to /register
   Create account
   Check inbox
   
   # Test magic link (if enabled)
   Go to /login
   Use magic link option
   Check inbox
   ```

2. **Check Deliverability**
   - Verify emails arrive in inbox (not spam)
   - Confirm links are clickable
   - Test on multiple email clients:
     - Gmail (web & mobile)
     - Apple Mail
     - Outlook
   
3. **Spam Score Test**
   - Send test email to: test-xxxxx@mail-tester.com
   - Visit mail-tester.com to see your score
   - Aim for 8/10 or higher

## Design Features

### Professional Branding
- Freedom Aviation colors (black & white)
- Logo placeholder in header
- Company contact information in footer
- Consistent typography

### Mobile Responsive
- Fluid width tables (600px max)
- Readable font sizes on small screens
- Touch-friendly button sizes

### Accessibility
- Semantic HTML structure
- High contrast colors
- Alt text for images
- Plain text fallback option

### Anti-Spam Optimization
- Proper table-based layout
- Clear sender information
- Unsubscribe-style footer text
- Legitimate business contact info
- No suspicious links or redirects

## Customization

### Change Colors

Find and replace these values:

```css
/* Primary button color (currently black) */
background-color: #000000;

/* Links (currently blue) */
color: #0066cc;

/* Header border (currently black) */
border-bottom: 3px solid #000000;
```

### Update Contact Information

Located in the footer section:

```html
<p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
  <strong>Freedom Aviation</strong><br>
  7565 S Peoria St, Englewood, CO 80112<br>
  <a href="tel:+17203100443">(720) 310-0443</a> | 
  <a href="mailto:info@freedomaviationco.com">info@freedomaviationco.com</a>
</p>
```

### Add Logo

Replace the text header with an image:

```html
<!-- Replace -->
<h1 style="margin: 0; font-size: 24px; color: #000000;">Freedom Aviation</h1>

<!-- With -->
<img src="https://www.freedomaviationco.com/logo.png" 
     alt="Freedom Aviation" 
     style="height: 40px; width: auto;" />
```

## Email Client Compatibility

| Client | Status | Notes |
|--------|--------|-------|
| Gmail (Web) | ✅ Excellent | Full support |
| Gmail (Mobile) | ✅ Excellent | Full support |
| Apple Mail | ✅ Excellent | Full support |
| Outlook 365 | ✅ Good | Buttons render correctly |
| Outlook 2016+ | ✅ Good | Table-based layout works |
| Yahoo Mail | ✅ Good | Full support |
| Protonmail | ✅ Excellent | Full support |

## Troubleshooting

### Links Not Clickable
- Ensure you're using HTML view, not plain text
- Check that `{{ .ConfirmationURL }}` variable is rendering
- Test in incognito mode to rule out extensions

### Going to Spam
- Configure custom SMTP (see EMAIL_CONFIGURATION.md)
- Set up SPF/DKIM/DMARC records
- Warm up your domain gradually
- Check blacklist status

### Styling Not Working
- Use inline styles only (no `<style>` blocks)
- Avoid CSS grid/flexbox (use tables)
- Test in Outlook rendering mode

### Variable Not Rendering
- Verify variable name matches Supabase docs
- Check template type (not all variables available in all templates)
- Test with actual email send, not preview

## Production Checklist

Before going live:

- [ ] All three templates updated in Supabase
- [ ] Custom SMTP configured (not using default Supabase email)
- [ ] SPF record added to DNS
- [ ] DKIM record added to DNS
- [ ] DMARC record added to DNS
- [ ] Domain verified with email provider
- [ ] Test password reset flow
- [ ] Test signup confirmation flow
- [ ] Test magic link flow (if used)
- [ ] Verified emails arrive in inbox
- [ ] Links are clickable in all clients
- [ ] Mobile rendering tested
- [ ] Spam score > 8/10
- [ ] Contact information is correct
- [ ] Logo image loading (if added)

## Support

For help with email configuration:
- **Documentation:** `/docs/setup/EMAIL_CONFIGURATION.md`
- **Supabase Docs:** https://supabase.com/docs/guides/auth/auth-smtp
- **Contact:** info@freedomaviationco.com
- **Phone:** (970) 618-2094

## Version History

- **v1.0** (2025-11-21)
  - Initial templates created
  - Professional HTML design
  - Mobile responsive
  - Anti-spam optimized

