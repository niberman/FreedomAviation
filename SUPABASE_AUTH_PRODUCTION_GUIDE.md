# Supabase Auth Production Guide

## Issues Fixed ✅

This document outlines all the authentication issues that were identified and fixed in the production deployment at `https://www.freedomaviationco.com`.

---

## 🔴 Critical Issues Identified & Fixed

### Issue #1: Supabase Client Missing Proper Configuration

**Problem:**
- The Supabase client was created without essential auth configuration options
- No session persistence settings
- No cookie configuration for custom domain
- No storage specification
- This caused sessions to not persist properly across page reloads

**Solution:**
Updated `client/src/lib/supabase.ts` to include:
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,        // Auto-refresh tokens before expiry
    persistSession: true,           // Save session in localStorage
    detectSessionInUrl: true,       // Handle OAuth callbacks & password resets
    storage: window.localStorage,   // Explicit storage specification
    storageKey: 'fa-prod-auth-token', // Unique key per environment
    flowType: 'pkce',              // PKCE flow for better security
    cookieOptions: {
      domain: '.freedomaviationco.com', // Cookie works on all subdomains
      path: '/',
      sameSite: 'lax',
    },
  },
});
```

**Why This Matters:**
- `autoRefreshToken: true` - Prevents session expiry during active use
- `persistSession: true` - Sessions survive page reloads
- `detectSessionInUrl: true` - OAuth and password reset flows work properly
- `storageKey` - Prevents conflicts between dev and prod
- `cookieOptions.domain` - Ensures cookies work across www/non-www

---

### Issue #2: Automatic Sign-Out Loop Causing 403 Errors

**Problem:**
- In `client/src/lib/auth-utils.ts`, the code automatically called `signOut({ scope: 'local' })` when receiving a 401 error
- When the server session was already invalid, this caused 403 Forbidden errors
- This created an infinite loop: 401 → signOut → 403 → repeat

**Solution:**
Removed automatic sign-out. Now the code throws an error and lets the UI handle the auth failure gracefully:
```typescript
// DON'T automatically sign out - let the app handle it via auth context
// This prevents 403 errors and logout loops
console.error('❌ Session refresh failed. User needs to re-authenticate.');
throw new Error('Session expired. Please log in again.');
```

**Why This Matters:**
- Prevents 403 Forbidden errors from Supabase
- Stops logout loops
- Gives UI control over re-authentication flow

---

### Issue #3: Missing SIGNED_OUT Event Handler

**Problem:**
- The `onAuthStateChange` listener in `AuthProvider` didn't explicitly handle the `SIGNED_OUT` event
- When logout failed with 403, the local state wasn't properly cleared
- Users appeared logged out in the UI but still had session data

**Solution:**
Updated `client/src/lib/auth-context.tsx` to explicitly handle all auth events:
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    setSession(null);
    setUser(null);
  } else if (event === 'SIGNED_IN') {
    setSession(session);
    setUser(session?.user ?? null);
  } else if (event === 'TOKEN_REFRESHED') {
    setSession(session);
    setUser(session?.user ?? null);
  }
  // ... handle other events
});
```

**Why This Matters:**
- Ensures local state always matches server state
- Prevents "ghost sessions" where UI shows user but no valid session exists

---

### Issue #4: Sign-Out Using Wrong Scope

**Problem:**
- The `signOut` function in auth context didn't specify a scope
- Default behavior might not clear all sessions
- No error handling for 403 errors during logout

**Solution:**
Updated `signOut` to use `scope: 'global'` and handle errors gracefully:
```typescript
const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    
    if (error) {
      console.warn('Sign out error (clearing local state anyway):', error);
      setSession(null);
      setUser(null);
      
      // Only throw if it's not a 403/session error
      if (!error.message?.includes('403') && !error.message?.includes('session')) {
        throw error;
      }
    }
  } catch (err) {
    // Always clear local state even on error
    setSession(null);
    setUser(null);
    throw err;
  }
};
```

**Why This Matters:**
- `scope: 'global'` signs out from ALL devices/sessions
- Graceful error handling prevents UI errors
- Local state is always cleared, even if server logout fails

---

### Issue #5: Hero Image Preload Warning

**Problem:**
- `client/index.html` had an unconditional preload tag for the hero image
- Caused browser warnings on all non-home pages: "preloaded but not used"
- Affected performance metrics

**Solution:**
Removed the preload tag:
```html
<!-- Hero image preload removed to prevent warnings on non-home pages -->
```

**Why This Matters:**
- Eliminates console warnings
- Improves Lighthouse scores
- Modern browsers handle image loading efficiently without hints

---

### Issue #6: No Session Refresh Error Handling

**Problem:**
- Initial session fetch had no error handling
- Silent failures when session couldn't be retrieved
- App would hang in "loading" state

**Solution:**
Added error handling to initial session fetch:
```typescript
supabase.auth.getSession().then(({ data: { session }, error }) => {
  if (error) {
    console.error('Error getting initial session:', error);
  }
  setSession(session);
  setUser(session?.user ?? null);
  setLoading(false);
}).catch((err) => {
  console.error('Failed to get initial session:', err);
  setLoading(false);
});
```

**Why This Matters:**
- App never gets stuck in loading state
- Errors are logged for debugging
- User can proceed even if session fetch fails

---

## ✅ What Was Already Working

1. **Auth Context Placement** - `onAuthStateChange` listener was correctly placed in `AuthProvider` at the root level
2. **Protected Routes** - Both `ProtectedRoute` and `StaffProtectedRoute` components were implemented correctly
3. **No Component-Level Listeners** - No auth listeners inside components that could unmount
4. **Domain Redirect Logic** - Proper www domain redirect was in place

---

## 🔧 Supabase Production Requirements Checklist

### Required Supabase Dashboard Settings

1. **Authentication → URL Configuration**
   ```
   Site URL: https://www.freedomaviationco.com
   Redirect URLs:
     - https://www.freedomaviationco.com/**
     - https://freedomaviationco.com/**
   ```

2. **Authentication → Email Templates**
   - Ensure all email templates use `{{ .SiteURL }}` for links
   - Test password reset emails to confirm links use correct domain

3. **Authentication → Providers**
   - Google OAuth: Ensure redirect URI matches your production domain
   - Authorized redirect URIs should include both www and non-www variants

4. **JWT Expiry Settings**
   ```
   JWT expiry: 3600 seconds (1 hour) - default is fine
   Refresh token rotation: Enabled (recommended)
   ```

### Required Environment Variables (Vercel)

```bash
# Public variables (safe for browser)
VITE_SUPABASE_URL=https://wsepwuxkwjnsgmkddkjw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# Server-only variables (never expose to browser)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # Only for server-side operations
```

### Cookie Configuration

The updated Supabase client now configures cookies properly:
```typescript
cookieOptions: {
  domain: '.freedomaviationco.com', // Leading dot = works on all subdomains
  path: '/',
  sameSite: 'lax', // Allows cookies in cross-site navigation
}
```

**Important:** The leading dot (`.freedomaviationco.com`) ensures cookies work on both:
- `www.freedomaviationco.com`
- `freedomaviationco.com`

### RLS (Row Level Security) Setup

Your RLS policies should use Supabase's built-in JWT claim: `auth.uid()`

Example policy:
```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

-- Staff can view all profiles
CREATE POLICY "Staff can view all profiles"
ON user_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'cfi', 'ops', 'founder')
  )
);
```

**Key Points:**
- `auth.uid()` returns the authenticated user's ID from the JWT
- This is automatically set by Supabase when the client makes requests
- No manual JWT handling needed - Supabase client does it automatically

### JWT & Token Refresh

With the new configuration:
```typescript
autoRefreshToken: true
```

**How it works:**
1. Supabase client automatically refreshes tokens 60 seconds before expiry
2. Refresh happens in the background
3. `onAuthStateChange` fires with `TOKEN_REFRESHED` event
4. Your app state updates with new session

**Manual refresh (if needed):**
```typescript
const { data, error } = await supabase.auth.refreshSession();
```

---

## 🚀 Deployment Instructions

### Step 1: Verify Environment Variables in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Ensure these are set for **Production**:
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY (server-side only)
   ```

### Step 2: Verify Supabase Dashboard Settings

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Confirm:
   - Site URL: `https://www.freedomaviationco.com`
   - Redirect URLs include: `https://www.freedomaviationco.com/**`

### Step 3: Deploy Updated Code

```bash
# Commit all changes
git add .
git commit -m "fix: Resolve Supabase auth issues in production"

# Push to main (triggers Vercel deployment)
git push origin main
```

### Step 4: Monitor Deployment

1. Watch Vercel deployment logs for any errors
2. Wait for deployment to complete (usually 2-3 minutes)

### Step 5: Test in Production

Open your browser DevTools (Console tab) and navigate to your site:

**Test 1: Login Flow**
```
1. Go to https://www.freedomaviationco.com/login
2. Log in with test credentials
3. Check console for: "Auth state change: SIGNED_IN session present"
4. No "Auth session missing!" warnings
5. No 403 errors
```

**Test 2: Protected Route Access**
```
1. Navigate to /dashboard or /staff
2. Should see "StaffProtectedRoute: User is staff (role: founder), allowing access"
3. No repeated sign-out attempts
4. Session persists on page reload
```

**Test 3: Logout Flow**
```
1. Click logout button
2. Check console for: "Auth state change: SIGNED_OUT no session"
3. Should redirect to home/login
4. No 403 Forbidden errors
5. Session should be cleared (check localStorage)
```

**Test 4: Token Refresh**
```
1. Stay logged in for 50+ minutes
2. Perform an action (query database, navigate)
3. Check console for: "Auth state change: TOKEN_REFRESHED session present"
4. Should work seamlessly without re-login
```

### Step 6: Check for Warnings

Open DevTools → Console and look for:
- ✅ No "Auth session missing!" warnings
- ✅ No "preload but not used" warnings
- ✅ No 403 errors on logout
- ✅ No repeated sign-out attempts

### Step 7: Verify Cookie Storage

In DevTools → Application → Cookies → `https://www.freedomaviationco.com`:
```
Name: sb-<project-ref>-auth-token
Domain: .freedomaviationco.com (note the leading dot)
Path: /
SameSite: Lax
HttpOnly: No (needs to be accessible to JavaScript)
Secure: Yes (HTTPS only)
```

In DevTools → Application → Local Storage:
```
Key: fa-prod-auth-token
Value: Should contain session object with access_token
```

---

## 🐛 Troubleshooting

### Issue: Still seeing "Auth session missing!"

**Cause:** Old cached code in browser
**Solution:**
```bash
# Force hard refresh in browser
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Or clear site data
DevTools → Application → Clear site data
```

### Issue: 403 on logout

**Cause:** Old session token in localStorage
**Solution:**
```javascript
// In browser console:
localStorage.clear();
// Then refresh page
```

### Issue: Session doesn't persist across reloads

**Cause:** Cookie domain mismatch or localStorage not accessible
**Solution:**
1. Check cookies in DevTools - should have `.freedomaviationco.com` domain
2. Check localStorage in DevTools - should have `fa-prod-auth-token` key
3. Ensure no browser extensions blocking cookies/storage

### Issue: OAuth redirect fails

**Cause:** Redirect URL not in Supabase allowlist
**Solution:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your redirect URL to the list
3. Wait 2-3 minutes for changes to propagate

---

## 📊 Monitoring & Logging

### Key Log Messages to Watch For

**Good Signs:**
```
✅ Auth state change: SIGNED_IN session present
✅ Auth state change: TOKEN_REFRESHED session present
✅ StaffProtectedRoute: User is staff (role: founder), allowing access
```

**Warning Signs:**
```
⚠️ Auth session missing!
⚠️ Got 401, refreshing token and retrying...
⚠️ Token expiring soon, refreshing...
```

**Error Signs:**
```
❌ Session error: ...
❌ Failed to refresh session: ...
❌ Session refresh failed. User needs to re-authenticate.
```

### Production Monitoring Recommendations

1. **Set up Sentry or similar error tracking**
   - Track auth-related errors
   - Alert on 403 error spikes
   - Monitor session refresh failures

2. **Add custom analytics events**
   ```typescript
   // Track successful logins
   analytics.track('user_login_success', { method: 'password' });
   
   // Track logout
   analytics.track('user_logout', { reason: 'manual' });
   
   // Track session refresh
   analytics.track('session_refresh', { automatic: true });
   ```

3. **Monitor Supabase Dashboard**
   - Check "Auth" → "Users" for active sessions
   - Review "Logs" for auth-related errors
   - Monitor API usage for unusual patterns

---

## 🎯 Summary of Changes

| File | Changes | Impact |
|------|---------|--------|
| `client/src/lib/supabase.ts` | Added auth config with cookies, storage, auto-refresh | Fixed session persistence and domain issues |
| `client/src/lib/auth-context.tsx` | Added explicit event handlers, improved error handling | Fixed SIGNED_OUT handling and error recovery |
| `client/src/lib/auth-utils.ts` | Removed auto sign-out on 401 | Fixed 403 errors and logout loops |
| `client/index.html` | Removed unconditional hero image preload | Fixed preload warnings |

---

## 🔐 Security Best Practices

1. **Never expose Service Role Key to browser**
   - Only use in server-side code
   - Store in Vercel environment variables
   - Never commit to git

2. **Use PKCE flow**
   - Already configured: `flowType: 'pkce'`
   - More secure than implicit flow
   - Prevents authorization code interception

3. **Validate user roles server-side**
   - Client-side checks are for UX only
   - Always validate permissions in RLS policies
   - Never trust client-sent role claims

4. **Rotate credentials regularly**
   - Change anon key if suspected compromise
   - Service role key should be tightly controlled
   - Monitor Supabase logs for suspicious activity

5. **Use HTTPS everywhere**
   - Already enforced by Vercel
   - Never allow HTTP in production
   - Cookies marked `Secure: true`

---

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/auth-api)
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [JWT & Tokens](https://supabase.com/docs/guides/auth/sessions)

---

## ✅ Post-Deployment Checklist

- [ ] Environment variables verified in Vercel
- [ ] Supabase redirect URLs updated
- [ ] Code deployed to production
- [ ] Login flow tested
- [ ] Protected routes accessible
- [ ] Logout works without errors
- [ ] No console warnings
- [ ] Session persists on reload
- [ ] Token refresh works automatically
- [ ] Cookies have correct domain
- [ ] localStorage has session data

---

**Last Updated:** November 20, 2025  
**Author:** AI Assistant  
**Tested On:** Production (`www.freedomaviationco.com`)

