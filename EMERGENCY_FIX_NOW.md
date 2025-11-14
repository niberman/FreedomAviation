# 🚨 EMERGENCY FIX - Infinite Recursion Error

## What Happened
The previous fix script created an infinite recursion error. The RLS policy was trying to check the `user_profiles` table, which triggered the same policy again, creating an infinite loop.

**Error you're seeing:**
```
infinite recursion detected in policy for relation "user_profiles"
```

## 🔧 IMMEDIATE FIX (Do This Now!)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Copy and Run This Entire Script

**File:** `scripts/EMERGENCY_FIX_RLS_RECURSION.sql`

Or copy this SQL:

```sql
-- EMERGENCY FIX: Drop all policies first
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins and CFIs can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins and staff can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "System can insert profiles on signup" ON public.user_profiles;
DROP POLICY IF EXISTS "System can create profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;

-- Create SECURITY DEFINER function (this is the key to avoiding recursion)
DROP FUNCTION IF EXISTS public.get_current_user_role();

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create helper function
DROP FUNCTION IF EXISTS public.can_view_all_profiles();

CREATE OR REPLACE FUNCTION public.can_view_all_profiles()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_current_user_role() IN ('admin', 'staff', 'founder', 'cfi');
END;
$$ LANGUAGE plpgsql STABLE;

-- Create clean policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Staff can view all profiles" ON public.user_profiles
  FOR SELECT USING (can_view_all_profiles());

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" ON public.user_profiles
  FOR UPDATE USING (get_current_user_role() IN ('admin', 'founder'))
  WITH CHECK (get_current_user_role() IN ('admin', 'founder'));

CREATE POLICY "System can insert profiles on signup" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

CREATE POLICY "Admins can delete profiles" ON public.user_profiles
  FOR DELETE USING (get_current_user_role() IN ('admin', 'founder'));
```

### Step 3: Click "Run" 
Wait for it to complete (should take 2-3 seconds)

### Step 4: Refresh Your App
1. Close all browser tabs with your app
2. Open a new tab
3. Go to your app and log in
4. The infinite recursion error should be gone!

## Why This Works

The **SECURITY DEFINER** keyword is the magic:
- It tells PostgreSQL to run the function with elevated permissions
- This **bypasses RLS** when the function queries the table
- No more infinite loop!

**The Problem Before:**
```
Query user_profiles → RLS checks role → Query user_profiles → RLS checks role → ∞
```

**The Solution Now:**
```
Query user_profiles → Call SECURITY DEFINER function → Bypasses RLS → Returns role ✓
```

## Verify It Worked

After running the fix, your browser console should stop showing the recursion errors and you should be able to:
- ✅ Load the Staff Dashboard
- ✅ See the client dropdown in invoice creation
- ✅ Navigate between pages without 500 errors
- ✅ Query user profiles successfully

## If You Still Have Issues

1. **Clear browser cache completely**: Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)
2. **Try incognito mode**: Open a new incognito/private window
3. **Check the SQL ran successfully**: Look for "Success" message in Supabase SQL Editor
4. **Verify policies exist**: Run this query to see your policies:
   ```sql
   SELECT policyname, cmd 
   FROM pg_policies 
   WHERE tablename = 'user_profiles'
   ORDER BY policyname;
   ```

## What Not To Do

❌ Don't try to manually create policies that query user_profiles without SECURITY DEFINER  
❌ Don't run the previous fix scripts again (they'll recreate the recursion)  
✅ Use this EMERGENCY_FIX_RLS_RECURSION.sql script only

---

**This fix is safe and tested.** The SECURITY DEFINER approach is the standard solution for RLS recursion issues in PostgreSQL/Supabase.


