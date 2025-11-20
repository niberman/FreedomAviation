# Quick Deployment Guide - Auth Fixes

## 🚀 Deploy These Auth Fixes to Production

### What Was Fixed

1. ✅ Supabase client now has proper auth configuration (cookies, storage, auto-refresh)
2. ✅ Removed automatic sign-out that caused 403 errors
3. ✅ Added proper SIGNED_OUT event handling
4. ✅ Fixed logout to use global scope with error handling
5. ✅ Removed hero image preload warning
6. ✅ Added session refresh error handling

### Files Changed

- `client/src/lib/supabase.ts` - Core auth configuration
- `client/src/lib/auth-context.tsx` - Auth state management
- `client/src/lib/auth-utils.ts` - API authentication helper
- `client/index.html` - Removed preload tag

---

## Deployment Steps

### Step 1: Verify Supabase Dashboard Settings (5 minutes)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Authentication → URL Configuration**
3. Verify these settings:

   **Site URL:**
   ```
   https://www.freedomaviationco.com
   ```

   **Redirect URLs:**
   ```
   https://www.freedomaviationco.com/**
   https://freedomaviationco.com/**
   ```

4. Click **Save** if you made any changes

### Step 2: Deploy to Production (2 minutes)

```bash
# From your project root
git add .
git commit -m "fix: resolve Supabase auth issues in production

- Configure Supabase client with proper auth options
- Add cookie config for custom domain
- Remove auto sign-out that caused 403 errors
- Handle SIGNED_OUT event properly
- Fix logout to use global scope
- Remove hero image preload warning"

git push origin main
```

This will trigger a Vercel deployment automatically.

### Step 3: Wait for Deployment (3 minutes)

1. Go to [Vercel Dashboard](https://vercel.com)
2. Watch the deployment progress
3. Wait for "Ready" status

### Step 4: Test in Production (10 minutes)

#### Test 1: Login ✅
1. Open https://www.freedomaviationco.com/login
2. Open DevTools → Console
3. Log in with your credentials
4. **Expected:** See "Auth state change: SIGNED_IN session present"
5. **Expected:** No "Auth session missing!" warnings
6. **Expected:** Redirect to dashboard

#### Test 2: Session Persistence ✅
1. While logged in, hard refresh the page (Ctrl+Shift+R)
2. **Expected:** Stay logged in
3. **Expected:** No redirect to login
4. **Expected:** Session data in localStorage

#### Test 3: Protected Routes ✅
1. Navigate to `/staff` or `/admin` (if you're a staff user)
2. **Expected:** "StaffProtectedRoute: User is staff (role: founder), allowing access"
3. **Expected:** Page loads without errors

#### Test 4: Logout ✅
1. Click the logout button
2. **Expected:** "Auth state change: SIGNED_OUT no session"
3. **Expected:** Redirect to home/login
4. **Expected:** NO 403 errors
5. **Expected:** Session cleared from localStorage

#### Test 5: Check Console ✅
1. Look for any errors or warnings
2. **Expected:** No "Auth session missing!"
3. **Expected:** No "preload but not used" warnings
4. **Expected:** No 403 Forbidden errors

---

## If Something Goes Wrong

### Issue: Still seeing errors after deployment

**Solution:**
```bash
# Clear your browser cache
1. Open DevTools (F12)
2. Right-click the refresh button
3. Click "Empty Cache and Hard Reload"

# Or clear site data
1. DevTools → Application tab
2. Click "Clear site data"
3. Refresh page
```

### Issue: Changes not showing up

**Solution:**
```bash
# Check Vercel deployment
1. Go to Vercel dashboard
2. Verify deployment is "Ready"
3. Check deployment logs for errors

# Force a new deployment
git commit --allow-empty -m "trigger deployment"
git push origin main
```

### Issue: 403 errors still happening

**Solution:**
1. Clear localStorage in browser:
   ```javascript
   // In browser console:
   localStorage.clear();
   ```
2. Log out completely
3. Clear cookies for the domain
4. Try logging in again

---

## Rollback Plan (If Needed)

If something goes wrong and you need to rollback:

```bash
# Revert the changes
git revert HEAD

# Push to trigger new deployment
git push origin main
```

Or in Vercel Dashboard:
1. Go to Deployments
2. Find the previous working deployment
3. Click "..." menu → "Promote to Production"

---

## Success Indicators

You'll know the deployment was successful when:

- ✅ Users can log in without errors
- ✅ Sessions persist across page reloads
- ✅ No "Auth session missing!" warnings in console
- ✅ Logout works without 403 errors
- ✅ Protected routes are accessible
- ✅ No preload warnings in console
- ✅ Token refresh happens automatically in the background

---

## Need More Info?

See `SUPABASE_AUTH_PRODUCTION_GUIDE.md` for:
- Detailed explanation of each fix
- Complete Supabase configuration guide
- Troubleshooting steps
- Security best practices
- Monitoring recommendations

---

**Estimated Total Time:** 20 minutes  
**Difficulty:** Easy  
**Risk Level:** Low (all changes are backwards compatible)

---

## After Deployment

Monitor your production logs for the first hour:
1. Check for any auth-related errors in Vercel logs
2. Ask a few users to test login/logout
3. Watch Supabase dashboard for unusual activity

If everything looks good after 1 hour, you're all set! 🎉

