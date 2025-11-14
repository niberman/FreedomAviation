# CRITICAL PRODUCTION FIXES NEEDED IMMEDIATELY

## 🚨 Current Issues

Your production app is experiencing **CRITICAL** errors:

1. **Infinite recursion in RLS policies** - All database queries failing with 500 errors
2. **Column name mismatch** - `memberships.is_active` vs `active`
3. **Manifest 401 errors** - Service worker not loading properly

## ✅ IMMEDIATE ACTION REQUIRED

### Step 1: Fix Database RLS Policies (MOST CRITICAL)

Run the migration script in Supabase SQL Editor:

**File:** `/migrations/EMERGENCY_FIX_RECURSION.sql`

1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Copy the entire contents of `migrations/EMERGENCY_FIX_RECURSION.sql`
3. Paste into the SQL Editor
4. Click **RUN**
5. Verify output shows: "✅ RLS Policies Fixed - No more recursion!"

This will:
- Remove infinite recursion from `user_profiles` policies
- Fix all other table policies to use direct SELECT instead of EXISTS
- Rename `memberships.active` to `memberships.is_active` if needed

### Step 2: Verify Fix Worked

After running the migration:

1. **Clear browser cache** OR open an **incognito window**
2. Go to https://freedom-aviation.vercel.app
3. Try to log in
4. Check browser console - the `42P17` infinite recursion errors should be GONE

### Step 3: Fix Manifest Issue

The manifest 401 error is likely caused by:

1. **Missing dist/public directory in Vercel deployment**
   - Check your Vercel build logs
   - Verify `outputDirectory: "dist/public"` in `vercel.json` is correct
   - Make sure `npm run build` actually creates `dist/public/manifest.webmanifest`

2. **Check Vercel deployment settings:**
   ```
   Build Command: npm run build
   Output Directory: dist/public
   Install Command: npm install
   ```

3. **Verify the build output includes:**
   - `dist/public/index.html`
   - `dist/public/manifest.webmanifest`
   - `dist/public/sw.js`
   - `dist/public/assets/` directory

### Step 4: Redeploy to Vercel

After running the database fix:

```bash
# Commit the changes (optional - migration is already in DB)
git add migrations/EMERGENCY_FIX_RECURSION.sql
git commit -m "Emergency fix: Remove RLS infinite recursion"
git push origin preview

# Or just trigger a redeploy in Vercel dashboard
```

## 🔍 How to Verify Everything Works

After deploying:

1. **Check User Login:**
   - Open https://freedom-aviation.vercel.app/login
   - Log in with your credentials
   - Should NOT see any 500 errors in console
   - Should NOT see "infinite recursion" errors

2. **Check Manifest:**
   - Open https://freedom-aviation.vercel.app/manifest.webmanifest
   - Should return JSON, not 401 or 500
   - Response should have `Content-Type: application/manifest+json`

3. **Check Service Worker:**
   - Open https://freedom-aviation.vercel.app/sw.js
   - Should return JavaScript code, not 401 or 500

4. **Check Database Queries:**
   - Log in as owner
   - Go to owner dashboard
   - Check that aircraft list loads
   - Check that user profile loads
   - No 500 errors in console

## 📊 Expected Results

### Before Fix:
```
❌ GET /rest/v1/user_profiles?select=role&id=eq.xxx → 500 (infinite recursion)
❌ GET /rest/v1/aircraft?select=*&owner_id=eq.xxx → 500 (infinite recursion)
❌ GET /rest/v1/memberships?...&is_active=eq.true → 400 (column doesn't exist)
❌ GET /manifest.webmanifest → 401 (unauthorized)
```

### After Fix:
```
✅ GET /rest/v1/user_profiles?select=role&id=eq.xxx → 200 (returns data)
✅ GET /rest/v1/aircraft?select=*&owner_id=eq.xxx → 200 (returns data)
✅ GET /rest/v1/memberships?...&is_active=eq.true → 200 (returns data)
✅ GET /manifest.webmanifest → 200 (returns JSON)
```

## 🚨 If Issues Persist

If you still see errors after running the migration:

1. **Check Supabase logs:**
   - Go to Supabase Dashboard → Logs
   - Look for any policy-related errors

2. **Verify the migration ran:**
   ```sql
   -- Run this in Supabase SQL Editor to check policies
   SELECT policyname, cmd 
   FROM pg_policies 
   WHERE tablename = 'user_profiles';
   ```
   
   Should show only 3 policies:
   - "Users can view own profile"
   - "Users can update own profile"
   - "System can insert profiles on signup"

3. **Check column names:**
   ```sql
   -- Run this to verify memberships columns
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'memberships' 
   AND column_name IN ('active', 'is_active');
   ```
   
   Should show: `is_active | boolean`

4. **Contact support** if issues persist with:
   - Supabase logs
   - Browser console errors
   - Vercel deployment logs

## 📝 Technical Details

### Why the Infinite Recursion Happened

The old policies looked like this:

```sql
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    -- THIS IS THE PROBLEM: querying user_profiles while checking user_profiles
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin'))
  );
```

When user tries to SELECT from `user_profiles`:
1. Policy checks: "Is user admin?"
2. To check, it runs: `SELECT FROM user_profiles WHERE id = auth.uid()`
3. That SELECT triggers the same policy check again
4. Which runs another SELECT from user_profiles
5. Which triggers the policy check again
6. **→ INFINITE RECURSION**

### The Fix

New approach for `user_profiles`:
```sql
-- Just let users see their own profile, no role checks
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);
```

For OTHER tables (aircraft, etc.):
```sql
-- This is OK - we're querying user_profiles from AIRCRAFT policy, not from user_profiles policy
CREATE POLICY "Staff can view all aircraft" ON public.aircraft
  FOR SELECT USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff')
  );
```

## 🎯 Next Steps After Fix

Once everything is working:

1. **Monitor Supabase logs** for any new RLS errors
2. **Update schema documentation** to reflect the new policies
3. **Test with different user roles** (owner, staff, admin, founder)
4. **Consider adding custom JWT claims** for roles to avoid querying user_profiles in policies

## 📞 Need Help?

If you need assistance:
1. Check the Supabase SQL Editor for error messages
2. Check browser console for specific error codes
3. Check Vercel deployment logs
4. Provide the exact error messages and timestamps

