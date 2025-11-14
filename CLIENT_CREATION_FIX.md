# Client Creation & Manifest Fix

## Issues Fixed

### 1. Client Creation Endpoint (400 Error)
**Problem:** The `/api/clients/create` endpoint was missing authentication and authorization checks, causing 400 errors when trying to create new clients.

**Solution:** Added proper authentication flow to the endpoint:
- Verify Bearer token from Authorization header
- Check user authentication via Supabase
- Verify user has appropriate role (admin, founder, or ops)
- Only allow authorized users to create new client accounts

**Changes:** `server/routes.ts` lines 1336-1384

### 2. Manifest.webmanifest 401 Error
**Problem:** The `manifest.webmanifest` file was returning 401 errors because the Vercel routing configuration was catching ALL routes (including static files) and routing them through the API handler, which requires authentication.

**Solution:** Updated `vercel.json` to properly route static files:
- Changed from `rewrites` to `routes` for better control
- Added explicit route for static file extensions (including `.webmanifest`)
- Added explicit route for service worker (`sw.js`)
- Ensured static files bypass the API handler
- Added CORS header (`Access-Control-Allow-Origin: *`) to manifest headers

**Changes:** `vercel.json` - updated routing configuration

## How to Deploy

1. **Commit the changes:**
```bash
git add server/routes.ts vercel.json
git commit -m "fix: add auth to client creation endpoint and fix manifest routing"
```

2. **Push to preview branch:**
```bash
git push origin preview
```

3. **Vercel will automatically deploy** the changes

## Testing

### Test Client Creation:
1. Log in as an admin/founder user
2. Navigate to Staff Dashboard → Clients tab
3. Click "Add Client" button
4. Fill in the form:
   - Email: test@example.com
   - Password: test123
   - Full Name: Test User
   - Phone: (optional)
5. Click "Create Client"
6. Should see success message and new client in the list

### Test Manifest File:
1. Open browser DevTools → Console
2. Refresh the page
3. Should NOT see any 401 errors for `manifest.webmanifest`
4. Check Network tab → `manifest.webmanifest` should return 200 status

## Security Improvements

The client creation endpoint now properly:
- ✅ Verifies user is authenticated
- ✅ Checks user has admin/founder/ops role
- ✅ Returns appropriate error messages
- ✅ Logs authentication attempts
- ✅ Uses service role for admin operations (bypasses RLS)

## Preload Warning Fix

The preload warnings about resources not being used within a few seconds are normal and can be safely ignored. These happen when:
- Fonts are preloaded but loaded asynchronously
- Images are preloaded for performance but aren't in the initial viewport
- These are optimization strategies and don't indicate actual errors

If you want to reduce these warnings, you can:
1. Remove the `fetchpriority="high"` from images that aren't in the viewport
2. Remove font preloads for fonts not used immediately
3. Or simply ignore them as they don't affect functionality

