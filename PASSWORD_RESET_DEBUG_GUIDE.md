# Password Reset Flow - Debug & Fix Guide
**Issue**: Email link redirects to homepage instead of /reset-password  
**Date**: November 20, 2025  
**Severity**: HIGH - Blocks password resets

---

## 🎯 Quick Fix (Most Likely Solution)

### Go to Supabase Dashboard → Add Redirect URLs

**Link**: https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/auth/url-configuration

**Add these URLs to "Redirect URLs" section**:
```
http://localhost:5000/reset-password
http://localhost:5173/reset-password
https://freedomaviationco.com/reset-password
https://www.freedomaviationco.com/reset-password
```

**Save** and test again!

---

## 🔍 Detailed Diagnosis

### Current Code (✅ CORRECT)

Your code is already properly configured:

1. **Reset request** (`auth-context.tsx:173`):
```typescript
const redirectUrl = `${baseUrl}/reset-password`;
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: redirectUrl,
});
```

2. **Route exists** (`App.tsx:75`):
```typescript
<Route path="/reset-password" component={ResetPassword} />
```

3. **Session detection** (`supabase.ts:30`):
```typescript
detectSessionInUrl: true,  // ✅ Detects tokens in URL hash
```

### What's Missing (❌ CONFIGURATION)

The redirect URLs need to be **whitelisted** in Supabase Dashboard!

---

## 🔬 How to Debug

### Step 1: Check the Email Link

When you receive the password reset email:

1. **Right-click** the "Reset Password" button/link
2. **Copy link address** (don't click yet!)
3. **Paste it somewhere** to inspect

**The URL should look like**:
```
https://wsepwuxkwjnsgmkddkjw.supabase.co/auth/v1/verify?
  token=...&
  type=recovery&
  redirect_to=https://www.freedomaviationco.com/reset-password
```

**Check**:
- ✅ Has `redirect_to=.../reset-password` parameter?
- ❌ Missing `redirect_to` or points to wrong URL?

---

### Step 2: Check What Happens When Clicked

1. Click the link
2. Watch the browser URL bar
3. Note where it redirects

**Expected**:
```
Supabase verify URL → Your site /reset-password#access_token=...&type=recovery
```

**If you see**:
```
Supabase verify URL → Your site / (homepage)
```

This confirms the redirect URL isn't whitelisted!

---

### Step 3: Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Click the reset link
4. Look for these logs:

**Expected logs**:
```
Auth state change: PASSWORD_RECOVERY session present
```

**If you see**:
```
Auth state change: SIGNED_OUT no session
```

Or no logs at all, the tokens aren't being processed.

---

## 🛠️ Complete Fix Procedure

### Fix #1: Update Supabase Dashboard (REQUIRED)

**URL Configuration**:
1. Go to: https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/auth/url-configuration

2. **Site URL**: Set to
   ```
   https://www.freedomaviationco.com
   ```

3. **Redirect URLs**: Add (one per line)
   ```
   http://localhost:5000/reset-password
   http://localhost:5173/reset-password
   https://freedomaviationco.com/reset-password
   https://www.freedomaviationco.com/reset-password
   ```

4. **Additional Redirect URLs** (if you use any):
   ```
   http://localhost:5000/login
   https://www.freedomaviationco.com/login
   https://www.freedomaviationco.com/dashboard
   ```

5. Click **Save**

---

### Fix #2: Verify Email Template (CHECK)

1. Go to: https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/auth/templates

2. Click on **"Reset Password"** template

3. Verify the link uses the variable:
   ```html
   <a href="{{ .ConfirmationURL }}">Reset your password</a>
   ```

4. **Not** a hardcoded URL like:
   ```html
   <a href="https://www.freedomaviationco.com">Reset</a>  ❌ WRONG
   ```

---

### Fix #3: Code Changes (if needed)

If the above doesn't work, we may need to update the reset password URL in Supabase Dashboard's "Additional Settings":

Go to: https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/settings/auth

Look for:
- **Password Recovery Settings**
- **Email Redirect Settings**

Ensure they're not overriding your code's `redirectTo` parameter.

---

## 🧪 Test After Fix

### Complete Test Flow:

```bash
# 1. Request Reset
Go to: http://localhost:5000/forgot-password
Email: nibthebib@gmail.com or noah@freedomaviationco.com
Click: Send Reset Link

# 2. Check Email
Subject: "Reset Your Password"
From: Freedom Aviation <info@freedomaviationco.com>

# 3. Inspect Link (before clicking)
Right-click → Copy link
Check: Should include "redirect_to=.../reset-password"

# 4. Click Link
Expected: Goes to /reset-password with hash tokens
Not: Goes to / (homepage)

# 5. See Form
Expected: "Set New Password" form visible
Not: Homepage content

# 6. Reset Password
Enter: New password
Confirm: Same password
Click: Update Password
Expected: Success → Redirect to login

# 7. Login with New Password
Go to: /login
Try new password
Expected: ✅ Login works
```

---

## 📊 Success Criteria

- [ ] Email link includes correct `redirect_to` parameter
- [ ] Clicking link goes to `/reset-password` (not `/`)
- [ ] Page shows "Set New Password" form
- [ ] Browser console shows "PASSWORD_RECOVERY" event
- [ ] Can successfully update password
- [ ] Can login with new password

---

## 🆘 Still Not Working?

If you've added the redirect URLs and it still doesn't work:

1. **Wait 5 minutes** - Supabase might cache the configuration
2. **Try in incognito** - Clear any cached sessions
3. **Check email link again** - Ensure new emails have correct redirect
4. **Share the email link URL** - I can help debug the exact issue

---

## 💡 Pro Tip

Test in **localhost first**:
- Easier to debug
- Can see console logs clearly
- No CORS/domain issues
- Faster iteration

Once working in localhost, test in production!

---

**MOST LIKELY FIX**: Just add `/reset-password` to Redirect URLs in Supabase Dashboard! ⚡

https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/auth/url-configuration

---

**END OF DEBUG GUIDE**  
**Generated**: November 20, 2025

