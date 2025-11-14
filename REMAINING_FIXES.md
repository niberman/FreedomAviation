# Remaining Production Issues

## ✅ Fixed Issues

1. **Infinite recursion in RLS policies** - ✅ FIXED (ran migration)
2. **maintenance_due table 404** - ✅ FIXED (changed to use `maintenance` table)

## ❌ Remaining Issues

### 1. Manifest.webmanifest 401 Error

**Issue:** `/manifest.webmanifest` returns 401 Unauthorized

**Root Cause:** Likely due to Vercel deployment not finding the `dist/public` directory or the manifest file not being built properly.

**Fix:**

Check Vercel deployment logs:
1. Go to https://vercel.com/dashboard
2. Check your latest deployment logs
3. Look for errors related to building or missing files

The server code (`api/index.ts`) has proper handlers for serving `/manifest.webmanifest`:
- Lines 157-172: Serves manifest with correct MIME type
- Lines 209-223: Fallback that returns a valid minimal manifest

**Possible causes:**
- `dist/public/manifest.webmanifest` not being created during build
- Build command not completing successfully
- `outputDirectory` in `vercel.json` is incorrect

**To fix:**
```bash
# Test build locally
npm run build

# Check if manifest exists
ls -la dist/public/manifest.webmanifest

# If file exists locally, check Vercel build logs for errors
```

### 2. /api/service-requests 500 Error

**Issue:** GET `/api/service-requests` returns 500 Internal Server Error

**Root Cause:** Likely an RLS policy issue with the `service_requests` table query.

**The endpoint code (server/routes.ts:1414-1510) is:**
```javascript
// Line 1501-1505
const { data: requests, error } = await supabase
  .from("service_requests")
  .select(`*, owner:user_id(full_name,email), aircraft:aircraft_id(tail_number)`)   
  .order("created_at", { ascending: false })
  .limit(200);
```

**Possible causes:**
1. RLS policy preventing staff from viewing service_requests
2. The join to `user_profiles` via `user_id` might be failing due to RLS

**To fix in Supabase SQL Editor:**

```sql
-- Check if service_requests RLS policies allow staff to view
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'service_requests';

-- If needed, add policy for staff to view all service requests
DROP POLICY IF EXISTS "Staff can view all service requests" ON public.service_requests;
CREATE POLICY "Staff can view all service requests" ON public.service_requests
  FOR SELECT USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder', 'ops', 'cfi')
  );
```

### 3. /api/google-calendar/status 500 Error

**Issue:** GET `/api/google-calendar/status` returns 500

**Root Cause:** The `google_calendar_tokens` table doesn't exist yet.

**The code (server/routes.ts:1650-1706) already has graceful error handling:**
- Line 1682-1689: Returns graceful response if table doesn't exist
- Line 1696-1704: Returns graceful response on any error

**Why it's still failing:**
The try/catch at line 1696 should catch the error, but it might be throwing before reaching that point.

**To fix:**

1. Check if the table exists:
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'google_calendar_tokens'
);
```

2. If it doesn't exist, either:
   - Run the Google Calendar integration migration (if you have it)
   - Or update the endpoint to check for table existence first

3. **Quick fix:** Make the endpoint return a graceful response earlier:

```typescript
// In server/routes.ts, line 1650
app.get("/api/google-calendar/status", async (req: Request, res: Response) => {
  // Add try-catch AROUND EVERYTHING
  try {
    if (!supabase || !supabaseAnon) {
      return res.json({ 
        connected: false, 
        syncEnabled: false,
        featureAvailable: false 
      });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
    
    if (!token) {
      return res.json({ 
        connected: false, 
        syncEnabled: false,
        featureAvailable: false 
      });
    }

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !user) {
      return res.json({ 
        connected: false, 
        syncEnabled: false,
        featureAvailable: false 
      });
    }

    // Check if Google Calendar feature is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.json({ 
        connected: false, 
        syncEnabled: false,
        featureAvailable: false 
      });
    }

    // Rest of the logic...
  } catch (err: any) {
    console.error("❌ Error checking calendar status:", err);
    return res.json({ 
      connected: false, 
      syncEnabled: false,
      featureAvailable: false 
    });
  }
});
```

### 4. /demo Endpoint 500 Error

**Issue:** GET `/demo?readonly=1&seed=DEMO` returns 500

**Root Cause:** Need to find where this endpoint is defined.

**Search for it:**
```bash
grep -r "app.get.*demo" server/
```

If no demo endpoint exists, the 500 is coming from the fallback handler trying to serve it as a client route.

**Likely fix:** This is probably handled by the client-side router, not a server endpoint. The 500 might be caused by:
1. The SPA fallback trying to serve `index.html` but failing
2. A missing `/demo` route in the client router

Check `client/src/main.tsx` or `client/src/App.tsx` for the `/demo` route.

## 🔧 Quick Fix Script

Run this in Supabase SQL Editor to fix RLS policy issues:

```sql
-- Fix service_requests RLS policies
DROP POLICY IF EXISTS "Users can view own service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Staff can view all service requests" ON public.service_requests;

CREATE POLICY "Users can view own service requests" ON public.service_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Staff can view all service requests" ON public.service_requests
  FOR SELECT USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder', 'ops', 'cfi')
  );

-- Verify
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'service_requests';
```

## 📝 Priority Order

1. **High Priority:**
   - Fix `/api/service-requests` (blocking staff dashboard)
   
2. **Medium Priority:**
   - Fix manifest 401 (affects PWA install, but not core functionality)
   - Fix google-calendar/status (gracefully fails, but logs errors)

3. **Low Priority:**
   - Fix /demo endpoint (only affects demo mode)

## 🎯 Next Steps

1. Run the service_requests RLS fix in Supabase
2. Redeploy to Vercel (will pick up the maintenance_due fix)
3. Check if manifest issue resolves after redeploy
4. If google-calendar still has issues, update the endpoint to be more defensive

