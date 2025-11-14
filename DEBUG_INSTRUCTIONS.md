# Debugging Production Issues

## 🔍 Current Issue: /api/service-requests Returns 500

You're seeing repeated 500 errors for `/api/service-requests`. Here's how to debug and fix it.

## Step 1: Check Vercel Logs (CRITICAL)

The server logs will tell us the EXACT error. Here's how to check:

### Option A: Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click on your project
3. Click on "Deployments"
4. Click on the latest deployment
5. Click on "Functions" tab
6. Look for `/api` function
7. Click on it to see logs
8. Look for lines with "❌ Error fetching service requests"
9. **Copy the full error message** including:
   - Error code (e.g., `42P01`, `42501`, etc.)
   - Error message
   - Error details

### Option B: Vercel CLI (Faster)
```bash
# Install Vercel CLI if you don't have it
npm i -g vercel

# Login
vercel login

# View real-time logs
vercel logs freedom-aviation --follow

# Or just recent logs
vercel logs freedom-aviation
```

## Step 2: Check If You Ran the SQL Migration

Did you run **`FIX_SERVICE_REQUESTS_RLS.sql`** in Supabase?

If NOT, that's why it's failing. Run it now:

1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Copy contents of `migrations/FIX_SERVICE_REQUESTS_RLS.sql`
3. Paste and click **RUN**

## Step 3: Common Error Codes and Fixes

### Error Code: 42501 (Insufficient Privilege)
**Meaning:** RLS policy is blocking the query

**Fix:** Run `FIX_SERVICE_REQUESTS_RLS.sql` migration

**Verify it worked:**
```sql
-- Run this in Supabase SQL Editor
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'service_requests';
```

Should show these policies:
- Users can view own service requests
- Staff can view all service requests
- Users can insert service requests
- Staff can insert any service requests
- Staff can update service requests
- Admins can delete service requests

### Error Code: 42P01 (Relation Does Not Exist)
**Meaning:** The `service_requests` table doesn't exist

**Fix:** Check if table exists:
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'service_requests'
);
```

If returns `false`, you need to create the table. Check your schema file.

### Error Code: 42703 (Column Does Not Exist)
**Meaning:** Query is trying to access a column that doesn't exist

**Fix:** Check what columns exist:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'service_requests'
ORDER BY ordinal_position;
```

Compare with the query in `server/routes.ts` line 1501-1505.

### Error Code: 42P17 (Infinite Recursion)
**Meaning:** RLS policies have a circular reference

**Fix:** You already ran `EMERGENCY_FIX_RECURSION.sql`, so this shouldn't happen anymore.

## Step 4: Test Directly in Supabase

Test if the query works directly in Supabase:

```sql
-- Try to select service requests as your user
SELECT * 
FROM service_requests 
ORDER BY created_at DESC 
LIMIT 10;
```

If this fails, the RLS policies are blocking it.

## Step 5: Check RLS Policies

Run this to see all current policies on service_requests:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'service_requests'
ORDER BY policyname;
```

## Step 6: Nuclear Option - Disable RLS Temporarily

**⚠️ ONLY FOR TESTING - DO NOT LEAVE THIS WAY**

```sql
-- Temporarily disable RLS to test if that's the issue
ALTER TABLE public.service_requests DISABLE ROW LEVEL SECURITY;

-- Test the endpoint
-- Then re-enable RLS
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
```

If the endpoint works with RLS disabled, you know the problem is the RLS policies.

## Step 7: Enhanced Debugging in Code

I've added better error logging to the server. After you redeploy, the Vercel logs will show:
- Error code
- Error message
- Error details
- Error hint

Deploy the changes:
```bash
git add server/routes.ts
git commit -m "Add enhanced error logging for service requests"
git push origin preview
```

Then check Vercel logs again.

## Step 8: Check Client Data (Low Priority)

The "Clients from Supabase: []" is actually GOOD - it means:
- ✅ The query is working
- ✅ No errors
- ℹ️ Just no data yet

To add test data:
```sql
-- Add a test client (if you have user_profiles)
-- This is optional - the empty array is not an error
INSERT INTO user_profiles (id, email, full_name, role)
VALUES (
  gen_random_uuid(),
  'test-client@example.com',
  'Test Client',
  'owner'
);
```

## 🎯 Most Likely Solution

Based on the errors, the most likely fix is:

**1. Run the SQL migration:** `FIX_SERVICE_REQUESTS_RLS.sql`

**2. Check Vercel logs to confirm**

**3. If still failing, run this in Supabase:**

```sql
-- Check if service_requests table exists
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'service_requests';

-- Check RLS policies
SELECT policyname FROM pg_policies WHERE tablename = 'service_requests';

-- If no policies, that's the problem - run FIX_SERVICE_REQUESTS_RLS.sql
```

## 📊 Deployment Checklist

After fixing:

- [ ] Ran `CREATE_MAINTENANCE_TABLE.sql`
- [ ] Ran `FIX_SERVICE_REQUESTS_RLS.sql`
- [ ] Deployed code changes to Vercel
- [ ] Checked Vercel logs for errors
- [ ] Hard refreshed browser (Cmd+Shift+R)
- [ ] Verified no 500 errors in console

## 🆘 Still Not Working?

If you've done all the above and it's still failing:

1. **Copy the exact error from Vercel logs**
2. **Copy the output of these SQL queries:**
   ```sql
   -- Check table exists
   SELECT tablename FROM pg_tables WHERE tablename = 'service_requests';
   
   -- Check RLS is enabled
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'service_requests';
   
   -- Check policies
   SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'service_requests';
   
   -- Check your user role
   SELECT id, email, role FROM user_profiles WHERE email = 'YOUR_EMAIL';
   ```
3. **Share all of that information** for further debugging

## 🎉 Success Indicators

You'll know it's fixed when:
- ✅ No 500 errors in browser console
- ✅ Vercel logs show "✅ Service requests fetched successfully"
- ✅ Staff dashboard loads service requests (even if empty array)
- ✅ Clients table shows (even if empty)

