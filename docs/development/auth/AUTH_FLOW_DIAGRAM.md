# Supabase Auth Flow - Visual Guide

This document shows how authentication works in your app after the fixes.

---

## 🔄 Complete Auth Flow (After Fixes)

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER VISITS SITE                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    App.tsx Renders                               │
│  - Mounts AuthProvider (root level)                             │
│  - Sets up global auth listener                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              AuthProvider useEffect() Runs                       │
│                                                                  │
│  1. supabase.auth.getSession()                                  │
│     ├─ Checks localStorage for: fa-prod-auth-token             │
│     ├─ Checks cookies for: sb-<project>-auth-token             │
│     └─ Returns session if valid, null if not                    │
│                                                                  │
│  2. supabase.auth.onAuthStateChange()                           │
│     └─ Sets up listener for all auth events                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
    ┌──────────────────┐          ┌──────────────────┐
    │  Session Found   │          │  No Session      │
    │  (User logged in)│          │  (Anonymous)     │
    └──────────────────┘          └──────────────────┘
                │                           │
                ▼                           ▼
    ┌──────────────────┐          ┌──────────────────┐
    │ Set user state   │          │ user = null      │
    │ Set session state│          │ session = null   │
    │ loading = false  │          │ loading = false  │
    └──────────────────┘          └──────────────────┘
```

---

## 🔐 Login Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    User Clicks "Login"                          │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│              /login Page Loads                                  │
│  - Shows login form                                            │
│  - OR shows Google OAuth button                                │
└────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
    ┌──────────────────┐          ┌──────────────────┐
    │  Email/Password  │          │  Google OAuth    │
    └──────────────────┘          └──────────────────┘
                │                           │
                ▼                           ▼
    ┌──────────────────┐          ┌──────────────────┐
    │ signIn() called  │          │signInWithGoogle()│
    │                  │          │                  │
    │ Supabase returns:│          │ Redirects to:    │
    │ - access_token   │          │ Google login     │
    │ - refresh_token  │          │                  │
    │ - user data      │          │ Returns with:    │
    │ - expires_at     │          │ - code (PKCE)    │
    └──────────────────┘          └──────────────────┘
                │                           │
                └─────────────┬─────────────┘
                              ▼
┌────────────────────────────────────────────────────────────────┐
│           onAuthStateChange Fires: SIGNED_IN                    │
│                                                                 │
│  1. Event: 'SIGNED_IN'                                         │
│  2. Session object received                                    │
│  3. AuthContext updates:                                       │
│     - setSession(session)                                      │
│     - setUser(session.user)                                    │
│     - setLoading(false)                                        │
│                                                                 │
│  4. Session saved to:                                          │
│     - localStorage: fa-prod-auth-token                         │
│     - Cookies: sb-<project>-auth-token                         │
│                                                                 │
│  5. User state propagates to all components via Context        │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                    Redirect to Dashboard                        │
│  - ProtectedRoute allows access                                │
│  - User data available throughout app                          │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Token Refresh Flow (Automatic)

```
┌────────────────────────────────────────────────────────────────┐
│              User Active in App (50+ minutes)                   │
│  - Token expires in: 60 minutes (default)                      │
│  - Auto-refresh triggers at: 59 minutes                        │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│        Supabase Client Auto-Refresh (Background)                │
│                                                                 │
│  autoRefreshToken: true ← configured in supabase.ts            │
│                                                                 │
│  1. Checks token expiry                                        │
│  2. If < 60 seconds to expiry:                                 │
│     - Calls /auth/v1/token?grant_type=refresh_token           │
│     - Sends refresh_token                                      │
│  3. Receives new tokens:                                       │
│     - New access_token                                         │
│     - New refresh_token (rotated)                              │
│     - New expires_at                                           │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│         onAuthStateChange Fires: TOKEN_REFRESHED                │
│                                                                 │
│  1. Event: 'TOKEN_REFRESHED'                                   │
│  2. New session object received                                │
│  3. AuthContext updates silently:                              │
│     - setSession(newSession)                                   │
│     - setUser(newSession.user)                                 │
│                                                                 │
│  4. New session saved to storage                               │
│  5. User doesn't notice anything                               │
│                                                                 │
│  ✅ User stays logged in seamlessly                            │
└────────────────────────────────────────────────────────────────┘
```

---

## 🚪 Logout Flow

```
┌────────────────────────────────────────────────────────────────┐
│                   User Clicks "Logout"                          │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│              signOut() Function Called                          │
│                                                                 │
│  try {                                                         │
│    const { error } = await supabase.auth.signOut({            │
│      scope: 'global' // Sign out from ALL devices             │
│    });                                                         │
│                                                                │
│    if (error && !error.includes('403')) {                     │
│      // Only throw if not a session error                     │
│      throw error;                                             │
│    }                                                           │
│  } catch (err) {                                              │
│    // Always clear local state                                │
│  } finally {                                                   │
│    setSession(null);                                          │
│    setUser(null);                                             │
│  }                                                             │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│         Supabase Server Processes Sign-Out                      │
│                                                                 │
│  1. Validates current session                                  │
│  2. Invalidates ALL refresh tokens (scope: global)             │
│  3. Clears server-side session                                 │
│  4. Returns success or 403 if already signed out               │
│                                                                 │
│  Note: Even if 403 error, we handle it gracefully             │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│         onAuthStateChange Fires: SIGNED_OUT                     │
│                                                                 │
│  1. Event: 'SIGNED_OUT'                                        │
│  2. Session = null                                             │
│  3. AuthContext updates:                                       │
│     - setSession(null)                                         │
│     - setUser(null)                                            │
│     - setLoading(false)                                        │
│                                                                 │
│  4. Storage cleared:                                           │
│     - localStorage: fa-prod-auth-token removed                 │
│     - Cookies: sb-<project>-auth-token removed                 │
│                                                                 │
│  5. User state = null propagates to all components             │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                  Redirect to /login or /                        │
│  - ProtectedRoute blocks access                                │
│  - User sees login page                                        │
│  ✅ Clean logout with no errors                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Protected Route Flow

```
┌────────────────────────────────────────────────────────────────┐
│           User Navigates to /dashboard (protected)              │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│              ProtectedRoute Component Renders                   │
│                                                                 │
│  const { user, loading } = useAuth();                          │
│                                                                 │
│  useEffect(() => {                                             │
│    if (!loading && !user) {                                    │
│      setLocation('/login'); // Redirect                        │
│    }                                                            │
│  }, [user, loading]);                                          │
└────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
    ┌──────────────────┐          ┌──────────────────┐
    │  User logged in  │          │  No user         │
    └──────────────────┘          └──────────────────┘
                │                           │
                ▼                           ▼
    ┌──────────────────┐          ┌──────────────────┐
    │ Render children  │          │ Redirect to      │
    │ (Dashboard)      │          │ /login           │
    └──────────────────┘          └──────────────────┘
```

---

## 🔒 Staff Protected Route Flow

```
┌────────────────────────────────────────────────────────────────┐
│             User Navigates to /staff (staff-only)               │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│           StaffProtectedRoute Component Renders                 │
│                                                                 │
│  const { user, loading } = useAuth();                          │
│                                                                 │
│  // Fetch user profile to check role                           │
│  const { data: userProfile } = useQuery({                      │
│    queryKey: ['user-profile', user?.id],                       │
│    queryFn: async () => {                                      │
│      const { data } = await supabase                           │
│        .from('user_profiles')                                  │
│        .select('role')                                         │
│        .eq('id', user.id)                                      │
│        .maybeSingle();                                         │
│      return data;                                              │
│    },                                                           │
│    enabled: !!user,                                            │
│  });                                                            │
└────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
    ┌──────────────────┐          ┌──────────────────┐
    │  No user         │          │  User logged in  │
    │                  │          │                  │
    │  Redirect to     │          │  Check role...   │
    │  /login          │          │                  │
    └──────────────────┘          └──────────────────┘
                                           │
                                 ┌─────────┴─────────┐
                                 │                   │
                                 ▼                   ▼
                      ┌──────────────────┐  ┌──────────────────┐
                      │  Role is staff   │  │  Role is client  │
                      │  (admin, cfi,    │  │                  │
                      │   ops, founder)  │  │  Redirect to /   │
                      └──────────────────┘  └──────────────────┘
                                 │
                                 ▼
                      ┌──────────────────┐
                      │ Render children  │
                      │ (Staff page)     │
                      │                  │
                      │ ✅ Access granted│
                      └──────────────────┘
```

---

## 🔄 Session Persistence Across Reload

```
┌────────────────────────────────────────────────────────────────┐
│              User Refreshes Page (F5 / Cmd+R)                   │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                    App Re-initializes                           │
│  - AuthProvider mounts again                                   │
│  - useEffect() runs                                            │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│          supabase.auth.getSession() Called                      │
│                                                                 │
│  1. Checks localStorage for: fa-prod-auth-token                │
│     {                                                           │
│       access_token: "eyJhbGci...",                             │
│       refresh_token: "v1.abc...",                              │
│       user: { id, email, ... },                                │
│       expires_at: 1700000000                                   │
│     }                                                           │
│                                                                 │
│  2. Validates token expiry                                     │
│     - If expired → auto refresh (if possible)                  │
│     - If valid → return session                                │
│                                                                 │
│  3. Returns session object                                     │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│              Session Restored Immediately                       │
│                                                                 │
│  - setSession(session)                                         │
│  - setUser(session.user)                                       │
│  - setLoading(false)                                           │
│                                                                 │
│  ✅ User stays logged in                                       │
│  ✅ No redirect to login                                       │
│  ✅ Seamless experience                                        │
└────────────────────────────────────────────────────────────────┘
```

---

## 🌐 Cookie & Storage Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser Storage Layers                        │
└─────────────────────────────────────────────────────────────────┘

┌────────────────── localStorage ──────────────────┐
│                                                   │
│  Key: fa-prod-auth-token                         │
│  Domain: www.freedomaviationco.com               │
│  Accessible by: JavaScript (Supabase client)     │
│                                                   │
│  Value: {                                        │
│    access_token: "eyJhbGci...",                  │
│    refresh_token: "v1.abc...",                   │
│    user: { id, email, ... },                     │
│    expires_at: 1700000000                        │
│  }                                               │
│                                                   │
│  Purpose: Primary session storage                │
│  Persists: Until logout or manual clear          │
└───────────────────────────────────────────────────┘

                      ▼

┌──────────────────── Cookies ─────────────────────┐
│                                                   │
│  Name: sb-wsepwuxkwjnsgmkddkjw-auth-token        │
│  Domain: .freedomaviationco.com (note the dot)   │
│  Path: /                                         │
│  SameSite: Lax                                   │
│  Secure: true (HTTPS only)                       │
│  HttpOnly: false (needs JS access)               │
│                                                   │
│  Value: <encrypted-session-data>                 │
│                                                   │
│  Purpose: Backup storage, SSR support            │
│  Persists: Until logout or expiry                │
│                                                   │
│  Works on:                                       │
│  ✅ www.freedomaviationco.com                    │
│  ✅ freedomaviationco.com                        │
│  ✅ api.freedomaviationco.com (if you had one)   │
└───────────────────────────────────────────────────┘

                      ▼

┌────────────────── Memory (Runtime) ───────────────┐
│                                                   │
│  AuthContext state:                              │
│  - user: { id, email, ... }                      │
│  - session: { access_token, ... }                │
│  - loading: false                                │
│                                                   │
│  Purpose: Fast access during app runtime         │
│  Persists: Only while app is running             │
│  Lost on: Page refresh (then restored from LS)   │
└───────────────────────────────────────────────────┘
```

---

## 🔍 Auth State Debugging

### Check Current Auth State

Open browser console and run:

```javascript
// Check localStorage
const session = localStorage.getItem('fa-prod-auth-token');
console.log('Session:', JSON.parse(session));

// Check if token is expired
const data = JSON.parse(session);
const expiresAt = data.expires_at * 1000; // Convert to ms
const now = Date.now();
const timeUntilExpiry = (expiresAt - now) / 1000 / 60; // Minutes
console.log(`Token expires in ${timeUntilExpiry.toFixed(1)} minutes`);

// Check Supabase client state
const { data: { session: currentSession } } = await supabase.auth.getSession();
console.log('Current session:', currentSession);
```

### Common Console Messages

**✅ Good signs:**
```
Auth state change: SIGNED_IN session present
Auth state change: TOKEN_REFRESHED session present
StaffProtectedRoute: User is staff (role: founder), allowing access
```

**⚠️ Warnings (not errors):**
```
Token expiring soon, refreshing...
Got 401, refreshing token and retrying...
```

**❌ Errors (need attention):**
```
Error getting initial session: ...
Failed to refresh session: ...
Session refresh failed. User needs to re-authenticate.
```

---

## 📱 Multi-Device Logout

With `scope: 'global'`:

```
User on Device A                User on Device B
     │                               │
     ▼                               ▼
 Click Logout                   Still browsing
     │                               │
     ▼                               │
signOut({ scope: 'global' })         │
     │                               │
     ├─────────────────────────────► │
     │   Invalidate ALL tokens       │
     │                               ▼
     │                    Next API request:
     │                    401 Unauthorized
     │                               │
     ▼                               ▼
Logged out ✅                   Logged out ✅
```

---

## 🎯 Key Takeaways

1. **Auth listener is global** - Set up once in AuthProvider, never duplicated
2. **Session persists** - localStorage + cookies ensure reload works
3. **Auto-refresh works** - Tokens refresh 60 seconds before expiry
4. **Logout is graceful** - Handles errors without causing loops
5. **State is consistent** - All events explicitly handled
6. **Cookies work cross-domain** - Leading dot covers www/non-www

---

*For implementation details, see `SUPABASE_AUTH_PRODUCTION_GUIDE.md`*

