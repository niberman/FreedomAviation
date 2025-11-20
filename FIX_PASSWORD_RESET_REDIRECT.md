# 🚨 URGENT: Fix Password Reset Redirect

## The Problem
Password reset emails are redirecting to homepage instead of `/reset-password` because the URL is not whitelisted in Supabase.

## ✅ Quick Fix (2 minutes)

### 1. Go to Supabase Dashboard
https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/auth/url-configuration

### 2. Add These URLs to "Redirect URLs"
Add these EXACT URLs (copy & paste):
```
https://www.freedomaviationco.com/reset-password
https://freedomaviationco.com/reset-password
http://localhost:3000/reset-password
http://localhost:3001/reset-password
http://localhost:5173/reset-password
```

### 3. Save Changes
Click "Save" at the bottom of the page.

## 🧪 Test It
1. Go to: https://www.freedomaviationco.com/forgot-password
2. Enter your email
3. Click reset link in email
4. Should go to: https://www.freedomaviationco.com/reset-password#access_token=...
5. Enter new password and save

## Why This Happens
- Supabase only redirects to whitelisted URLs for security
- Currently only homepage is whitelisted
- The code is correct (`redirectTo: ${baseUrl}/reset-password`)
- Just needs dashboard configuration

## Current Code (Working Correctly)
```typescript
// client/src/lib/auth-context.tsx:163-178
const resetPasswordForEmail = async (email: string) => {
  let baseUrl = window.location.origin;
  
  // In production, ensure we use www domain
  if (window.location.hostname === 'freedomaviationco.com') {
    baseUrl = 'https://www.freedomaviationco.com';
  }
  
  const redirectUrl = `${baseUrl}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,  // ✅ This is correct!
  });
  if (error) throw error;
};
```

## Also Check Email Templates (Optional)
While in Supabase Dashboard:
1. Go to Auth > Email Templates
2. Click "Reset Password"
3. Make sure the email template has this link format:
   ```
   <a href="{{ .ConfirmationURL }}">Reset Password</a>
   ```
   (Should already be correct)

---

After adding the URLs, password reset will work immediately! No code changes needed.
