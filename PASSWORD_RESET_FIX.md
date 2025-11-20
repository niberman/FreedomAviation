# Password Reset Flow Fix
**Issue**: Password reset link redirects to homepage instead of reset-password page  
**Date**: November 20, 2025  
**Status**: FIXABLE - Configuration issue

---

## 🐛 Problem Diagnosis

When users click the password reset email link, they're redirected to the **homepage** instead of `/reset-password`.

**Expected Flow**:
1. User requests reset → Email sent ✅
2. User clicks link → Goes to `/reset-password` with tokens in hash ❌ (goes to `/` instead)
3. User enters new password → Password updated

**Actual Flow**:
1. User requests reset → Email sent ✅
2. User clicks link → Redirected to `/` (homepage) ❌
3. No password reset form shown ❌

---

## 🔍 Root Cause

The issue is **Supabase Redirect URL Configuration** in your dashboard.

### What's Happening:

Your code sets the redirect URL correctly:
```typescript
// client/src/lib/auth-context.tsx:173
const redirectUrl = `${baseUrl}/reset-password`;
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: redirectUrl,
});
```

**BUT** - Supabase requires redirect URLs to be **whitelisted** in the dashboard!

If the URL isn't whitelisted, Supabase defaults to the **Site URL** (which is probably set to your homepage).

---

## ✅ Solution: Configure Supabase Redirect URLs

### Step 1: Go to Supabase Dashboard

Open: https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/auth/url-configuration

### Step 2: Add Redirect URLs

In the **"Redirect URLs"** section, add these URLs (one per line):

```
http://localhost:5000/reset-password
http://localhost:5173/reset-password
https://freedomaviationco.com/reset-password
https://www.freedomaviationco.com/reset-password
```

### Step 3: Set Site URL (if not already set)

In the **"Site URL"** field, set:
```
https://www.freedomaviationco.com
```

### Step 4: Save Changes

Click **"Save"** at the bottom of the page.

---

## 🔧 Alternative: Check Email Template Configuration

The email template in Supabase might have a hardcoded redirect URL.

### Go to Email Templates

Open: https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/auth/templates

### Check "Reset Password" Template

The template should use: `{{ .ConfirmationURL }}`

**If it's hardcoded** to a specific URL, change it to:
```html
<a href="{{ .ConfirmationURL }}">Reset Password</a>
```

This will use the `redirectTo` parameter from your code.

---

## 🧪 Testing the Fix

After updating Supabase configuration:

### Test 1: Request Password Reset

```bash
1. Go to: http://localhost:5000/forgot-password
2. Enter email: nibthebib@gmail.com
3. Click "Send Reset Link"
4. Check email
```

### Test 2: Click Reset Link

```bash
1. Open email
2. Click "Reset Password" link
3. ✅ Should go to: http://localhost:5000/reset-password#access_token=...&type=recovery
4. ✅ Should see password reset form (not homepage)
```

### Test 3: Complete Reset

```bash
1. Enter new password
2. Confirm password
3. Click "Update Password"
4. ✅ Should show success message
5. ✅ Should redirect to login
```

---

## 📋 Verification Checklist

**Supabase Dashboard Configuration**:
- [ ] Redirect URLs include `/reset-password` for all domains
- [ ] Site URL is set to primary domain
- [ ] Email template uses `{{ .ConfirmationURL }}`

**Code Verification** (already correct ✅):
- [x] auth-context.tsx sets correct redirectTo
- [x] reset-password.tsx component exists
- [x] Route configured in App.tsx
- [x] Hash detection enabled in supabase.ts

---

## 🎯 Quick Fix Commands

### Check Current Supabase Config

You can verify your current configuration by checking these in the dashboard:

1. **URL Configuration**: https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/auth/url-configuration
2. **Email Templates**: https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/auth/templates

---

## 🚨 Common Mistakes

### Mistake #1: Missing Redirect URL
```
❌ Only have: https://www.freedomaviationco.com
✅ Need: https://www.freedomaviationco.com/reset-password
```

### Mistake #2: Forgot localhost URLs
```
❌ Only production URLs whitelisted
✅ Need: localhost URLs for development testing
```

### Mistake #3: Hardcoded email template URL
```
❌ <a href="https://www.freedomaviationco.com">Reset</a>
✅ <a href="{{ .ConfirmationURL }}">Reset Password</a>
```

---

## 🔄 If Still Not Working

### Debug Steps:

1. **Check the email link URL**:
   - Click reset in email
   - Before page loads, copy the URL from browser
   - Should look like: `https://www.freedomaviationco.com/reset-password#access_token=...&type=recovery`
   - If it's just `/` or missing `/reset-password`, that confirms the redirect URL issue

2. **Check browser console**:
   - Open DevTools → Console
   - Look for "Auth state change: PASSWORD_RECOVERY" log
   - If missing, tokens aren't being processed

3. **Verify in Supabase**:
   ```sql
   -- Check if password recovery emails are being sent
   SELECT * FROM auth.users WHERE email = 'nibthebib@gmail.com';
   -- Check confirmation_sent_at field
   ```

---

## ✅ Expected Behavior After Fix

1. User requests reset → Email sent with proper link
2. User clicks link → Goes to `/reset-password` with hash tokens
3. Supabase processes tokens → PASSWORD_RECOVERY event fires
4. Page shows "Set New Password" form
5. User enters password → Password updated
6. Redirect to login → Success!

---

## 🎯 Next Steps

1. **Update Supabase Dashboard**:
   - Add redirect URLs (all 4 listed above)
   - Verify email template uses `{{ .ConfirmationURL }}`

2. **Test the flow**:
   - Request password reset
   - Check email URL
   - Click link
   - Verify lands on `/reset-password` page

3. **If still broken**:
   - Share the actual URL from the email
   - Check browser console for errors
   - Check Supabase auth logs

---

**Most Likely Fix**: Add `/reset-password` to redirect URLs in Supabase Dashboard! 🎯

**Dashboard Link**: https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/auth/url-configuration

---

**END OF FIX GUIDE**  
**Generated**: November 20, 2025

