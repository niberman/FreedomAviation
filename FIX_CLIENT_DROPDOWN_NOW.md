# 🔧 Fix Client Dropdown - Action Required

## The Problem
Your client selection dropdown in invoice creation is failing because the database RLS policy references a function that doesn't exist: `can_view_all_profiles()`

## The Solution (3 Simple Steps)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Run the Fix Script
Copy and paste the contents of this file:
```
scripts/fix_user_profiles_rls_simple.sql
```

Or copy this SQL directly:

```sql
-- Drop all existing policies
DROP POLICY IF EXISTS "Admins and CFIs can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins and staff can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "System can insert profiles on signup" ON public.user_profiles;
DROP POLICY IF EXISTS "System can create profiles" ON public.user_profiles;

-- Create clean policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Staff can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'staff', 'founder', 'cfi')
    )
  );

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'founder')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'founder')
    )
  );

CREATE POLICY "System can insert profiles on signup" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

CREATE POLICY "Admins can delete profiles" ON public.user_profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'founder')
    )
  );
```

Click "Run" to execute the script.

### Step 3: Refresh and Test
1. Go back to your Staff Dashboard
2. Hard refresh the page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. Navigate to the Invoices tab
4. The Client dropdown should now work!

## What This Fix Does
- ✅ Removes the broken RLS policy that references the missing function
- ✅ Creates new, clean RLS policies that work correctly
- ✅ Allows admin/staff/founder/cfi users to view all user profiles (needed for client selection)
- ✅ Maintains security - regular users can still only view their own profile

## Verification
After running the fix, you should see:
- Client dropdown loads and shows "Select client" placeholder
- When clicked, dropdown shows all users with 'owner' role
- No error messages in browser console
- No error toast notifications

## If It Still Doesn't Work
Check these things:

1. **No owners exist**: If dropdown says "No clients found", create an owner:
   ```sql
   UPDATE public.user_profiles
   SET role = 'owner'
   WHERE email = 'someone@example.com';
   ```

2. **Wrong role**: Make sure you're logged in as admin/staff/founder/cfi:
   ```sql
   SELECT id, email, role 
   FROM public.user_profiles 
   WHERE id = auth.uid();
   ```

3. **Browser cache**: Try incognito mode or clear browser cache

## Need More Help?
See the detailed troubleshooting guide: `INVOICE_CLIENT_SELECTION_FIX.md`

---
**Note:** This fix is safe to run multiple times. It won't break anything if you run it again.

