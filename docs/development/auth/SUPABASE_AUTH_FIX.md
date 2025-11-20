# Supabase Authentication Flow Fix

## Changes Made

### 1. ✅ Fixed `vercel.json`

**Changed catch-all rewrite** to serve `index.html` instead of redirecting to `/api`:

```diff
  "rewrites": [
    {
      "source": "/auth/:path*",
      "destination": "https://wsepwuxkwjnsgmkddkjw.supabase.co/auth/:path*"
    },
    {
-     "source": "/api/(.*)",
-     "destination": "/api"
+     "source": "/api/:path*",
+     "destination": "/api/:path*"
    },
    {
      "source": "/(.*)",
-     "destination": "/api"
+     "destination": "/index.html"
    }
  ],
```

**Why this matters**:
- `/auth/:path*` rule is FIRST ✅ - Supabase auth URLs bypass the SPA
- Catch-all now serves `index.html` ✅ - SPA routing works correctly
- API routes properly forwarded ✅

### 2. ✅ Fixed Auto-Login Redirect in `client/src/pages/login.tsx`

**Added auth flow detection** to prevent redirects during password recovery:

```diff
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
+     // Check if we're in an auth flow (recovery, invite, magiclink)
+     const url = new URL(window.location.href);
+     const type = url.searchParams.get("type") || url.hash.match(/type=([^&]+)/)?.[1];
+     const isAuthFlow = type === "recovery" || type === "invite" || type === "magiclink";
+     
+     // Only redirect if NOT in an auth flow
+     if (!isAuthFlow) {
        getRedirectPath(user.id).then((path) => {
          setLocation(path);
        });
+     }
    }
  }, [user, setLocation]);
```

**Why this matters**:
- Checks URL for `type=recovery`, `type=invite`, or `type=magiclink` ✅
- Checks both query params AND hash (Supabase uses both) ✅
- Only redirects if NOT in an auth flow ✅
- Allows Supabase password reset UI to display ✅

### 3. ✅ Other Components Already Correct

**`client/src/pages/reset-password.tsx`**:
- Already waits for user to submit form before redirecting ✅
- Correctly handles password recovery tokens ✅
- No changes needed ✅

**`client/src/components/protected-route.tsx`**:
- Only checks if logged in, doesn't do auto-redirects ✅
- No changes needed ✅

---

## Required Manual Steps

### Step 1: Clean Up Supabase Redirect URLs

Go to **[Supabase Dashboard](https://supabase.com/dashboard) → Authentication → URL Configuration**

**DELETE these redirect URLs:**
```
❌ https://freedom-aviation-noahs-projects-57a25ced.vercel.app/**
❌ https://freedom-aviation-noahs-projects-57a25ced.vercel.app/
❌ https://freedom-*-aviation-noahs-projects-57a25ced.vercel.app
❌ https://freedom-*-aviation-noahs-projects-57a25ced.vercel.app/**
```

**KEEP only these:**
```
✅ http://localhost:5000/**
✅ https://wsepwuxkwjnsgmkddkjw.supabase.co/auth/v1/verify
✅ https://www.freedomaviationco.com/** (if not already present, add it)
```

**Why this matters**:
- Prevents Supabase from auto-adding `redirect_to=` parameters
- Keeps reset links clean: `https://wsepwuxkwjnsgmkddkjw.supabase.co/auth/v1/verify?token=...&type=recovery`
- NO unwanted redirects to preview deployments

### Step 2: Update Supabase Email Templates (Optional but Recommended)

Go to **[Supabase Dashboard](https://supabase.com/dashboard) → Authentication → Email Templates**

**For "Confirm signup" and "Magic Link" templates:**

Make sure the link uses:
```
{{ .ConfirmationURL }}
```

NOT:
```
{{ .ConfirmationURL }}?redirect_to=https://your-domain.com/
```

**For "Reset Password" template:**

Make sure the link uses:
```
{{ .ConfirmationURL }}
```

This ensures clean URLs without extra redirect parameters.

---

## Testing the Fix

### Test 1: Password Reset Flow

1. **Request password reset:**
   ```
   Go to: https://www.freedomaviationco.com/forgot-password
   Enter email
   Click "Send Reset Link"
   ```

2. **Check email link format:**
   ```
   Should be:
   ✅ https://wsepwuxkwjnsgmkddkjw.supabase.co/auth/v1/verify?token=...&type=recovery
   
   Should NOT have:
   ❌ redirect_to=https://www.freedomaviationco.com/
   ```

3. **Click the link:**
   ```
   ✅ Should show Supabase-hosted password reset UI
   ❌ Should NOT immediately redirect to your app
   ```

4. **Enter new password:**
   ```
   Type new password
   Confirm new password
   Submit form
   ```

5. **After password change:**
   ```
   ✅ Supabase processes the change
   ✅ THEN redirects to your app
   ✅ Shows success message
   ✅ Redirects to login page
   ```

### Test 2: User Invitation Flow

1. **Invite a user** (as admin in your app or via Supabase Dashboard)

2. **User receives email with link:**
   ```
   Should be:
   ✅ https://wsepwuxkwjnsgmkddkjw.supabase.co/auth/v1/verify?token=...&type=invite
   ```

3. **User clicks link:**
   ```
   ✅ Shows Supabase-hosted password setup UI
   ✅ NOT redirected immediately
   ```

4. **User sets password:**
   ```
   ✅ Password accepted
   ✅ Account activated
   ✅ Redirects to app after completion
   ```

### Test 3: Auto-Login (Should NOT trigger during auth)

1. **Already logged in, click password reset link:**
   ```
   ✅ Should show password reset UI
   ❌ Should NOT auto-redirect to dashboard
   ```

2. **Check browser console for type detection:**
   ```javascript
   // Should see type=recovery in URL
   const url = new URL(window.location.href);
   console.log(url.searchParams.get("type")); // "recovery"
   ```

3. **After setting password:**
   ```
   ✅ Redirects to login page (as intended)
   ```

---

## Deployment Instructions

### 1. Commit and Push Changes

```bash
git add vercel.json client/src/pages/login.tsx
git commit -m "fix: Supabase auth redirect and password reset flow

- Fix vercel.json catch-all to serve index.html for SPA routing
- Add auth flow detection to prevent auto-redirects during recovery
- Ensure /auth/* requests proxy to Supabase before SPA catch-all"

git push origin main
```

### 2. Verify Deployment

```bash
# Vercel will automatically deploy
# Monitor at: https://vercel.com/dashboard

# Once deployed, test the flow
```

### 3. Clean Up Supabase URLs

Follow **Step 1** in "Required Manual Steps" above.

---

## Expected Behavior After Fix

### ✅ Password Reset Links
```
https://wsepwuxkwjnsgmkddkjw.supabase.co/auth/v1/verify?token=abc123&type=recovery
```
- Opens Supabase-hosted password UI
- User enters new password
- Password saved
- User redirected to your app
- Shows success message

### ✅ Invitation Links
```
https://wsepwuxkwjnsgmkddkjw.supabase.co/auth/v1/verify?token=xyz789&type=invite
```
- Opens Supabase-hosted setup UI
- User creates password
- Account activated
- User redirected to your app

### ✅ Auto-Login Behavior
- Logged-in users visiting `/login` → Redirected to dashboard ✅
- Logged-in users with `?type=recovery` → NOT redirected (shows reset UI) ✅
- Logged-in users with `?type=invite` → NOT redirected (shows invite UI) ✅

---

## Troubleshooting

### Problem: Still seeing `redirect_to` in reset links

**Solution**: Remove ALL Vercel preview URLs from Supabase redirect configuration (see Step 1 above)

### Problem: Reset link still redirects immediately

**Check**:
```bash
# 1. Verify vercel.json deployed
curl -I https://www.freedomaviationco.com/auth/v1/verify
# Should return 301/302 to Supabase

# 2. Check if type detection working
# Open browser console on reset page
console.log(new URL(window.location.href).searchParams.get("type"));
# Should show "recovery"
```

### Problem: SPA routes return 404

**Check vercel.json**:
```json
{
  "source": "/(.*)",
  "destination": "/index.html"  // Must be /index.html, not /api
}
```

### Problem: API routes broken

**Check vercel.json**:
```json
{
  "source": "/api/:path*",
  "destination": "/api/:path*"  // Must preserve path
}
```

---

## Files Modified

1. `vercel.json` - Fixed routing rules
2. `client/src/pages/login.tsx` - Added auth flow detection
3. `SUPABASE_AUTH_FIX.md` (this file) - Documentation

---

## Summary

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Password reset redirects immediately | SPA auto-login on existing session | Added auth flow detection in login.tsx |
| /auth/* intercepted by SPA | Wrong catch-all destination | Changed `/(.*) → /api` to `/(.*) → /index.html` |
| Unwanted redirect_to params | Too many Supabase redirect URLs | Remove preview URLs from Supabase config |
| Reset UI never appears | Auto-redirect beats Supabase UI | Check for type=recovery/invite before redirecting |

---

**Status**: ✅ Code changes complete  
**Manual Steps**: ⚠️ Clean up Supabase redirect URLs  
**Testing**: Pending deployment and manual verification

