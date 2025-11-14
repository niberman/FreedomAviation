# 🔧 User Roles Fix - Complete Summary

## 📋 What's Wrong

Your application is getting **400 errors** because:

1. ❌ The `user_profiles` table is **missing the `role` column**
2. ❌ The `user_role` enum type doesn't exist
3. ❌ You can't access the staff dashboard because role checks are failing

### Error Pattern in Console:
```
wsepwuxkwjnsgmkddkjw.supabase.co/rest/v1/user_profiles?select=role&id=eq.8d1ceb8e-8bb7-40c5-bd78-1e43633aa632:1
Failed to load resource: the server responded with a status of 400 ()
```

This happens because Supabase is trying to SELECT a column (`role`) that doesn't exist!

## 🎯 The Fix (3 Steps)

### Step 1: Add the Role Column

Go to your **Supabase SQL Editor** and run:

```sql
-- Create enum type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('owner', 'staff', 'cfi', 'admin', 'ops', 'founder');
  END IF;
END $$;

-- Add role column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN role user_role DEFAULT 'owner';
  END IF;
END $$;

-- Set existing users to owner
UPDATE public.user_profiles 
SET role = 'owner'
WHERE role IS NULL;

-- Give yourself founder access
UPDATE public.user_profiles 
SET role = 'founder'
WHERE email = 'noah@freedomaviationco.com';
```

Or simply run the file: `migrations/add_user_roles.sql`

### Step 2: (Optional) Fix RLS Policies

If you still have issues after Step 1, run: `migrations/fix_rls_policies.sql`

This ensures the RLS policies properly support the new role column.

### Step 3: Test

1. **Log out** of your application
2. **Clear cache** (or use incognito/private mode)
3. **Log back in** with `noah@freedomaviationco.com`
4. Navigate to `/staff/dashboard`
5. ✅ **Success!** You should now have access

## 🏷️ Available Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **owner** | Regular client/member | Own dashboard, own data only |
| **cfi** | Certified Flight Instructor | Create instruction invoices, view students |
| **staff** | Staff member | Staff dashboard, service requests, operations |
| **ops** | Operations staff | Operations management, scheduling |
| **admin** | Administrator | Full access except founder-only features |
| **founder** | Founder/Owner | Full system access, all features |

### Role Hierarchy

```
owner (lowest permissions)
  ↓
cfi
  ↓
staff
  ↓
ops
  ↓
admin
  ↓
founder (highest permissions)
```

### Staff Roles

These roles grant access to the staff dashboard (`/staff/dashboard`):
- ✅ **staff**
- ✅ **cfi**
- ✅ **ops**
- ✅ **admin**
- ✅ **founder**

## 🔍 How Roles Work

### Database Level (RLS Policies)
```sql
-- Example: Only staff can view all service requests
CREATE POLICY "Staff can view service requests" ON service_requests
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('staff', 'cfi', 'ops', 'admin', 'founder')
    )
  );
```

### Frontend Level (Route Protection)
```typescript
// StaffProtectedRoute checks for staff roles
export function StaffProtectedRoute({ children }) {
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      return data;
    }
  });

  if (!isStaffRole(userProfile?.role)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}
```

### Helper Functions
Located in `client/src/lib/roles.ts`:

```typescript
isStaffRole(role)      // true for: staff, cfi, ops, admin, founder
isAdminRole(role)      // true for: admin, founder
isCfiRole(role)        // true for: cfi, admin, founder
isOpsRole(role)        // true for: ops, admin, founder
isFounderRole(role)    // true for: founder only
```

## 🆘 Troubleshooting

### Still Getting 400 Errors?

**Check if the column was added:**
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles' 
AND column_name = 'role';
```

Expected result:
```
column_name | data_type  | column_default
------------|------------|---------------
role        | USER-DEFINED | 'owner'::user_role
```

### Can't See Your Role?

**Check your user's role:**
```sql
SELECT id, email, full_name, role, created_at
FROM public.user_profiles
WHERE email = 'noah@freedomaviationco.com';
```

Expected result:
```
role: founder
```

### Still Can't Access Staff Dashboard?

1. **Clear all browser data:**
   - Chrome/Edge: Settings → Privacy → Clear browsing data
   - Firefox: Settings → Privacy & Security → Clear Data
   - Safari: Develop → Empty Caches

2. **Check browser console** (F12) for errors

3. **Verify you're logged in:**
   ```javascript
   // In browser console:
   console.log(await supabase.auth.getUser());
   ```

4. **In Development Mode:**
   The `StaffProtectedRoute` allows access by default when `NODE_ENV !== 'production'`

### RLS Policies Blocking Access?

**Temporarily disable RLS for testing** (DON'T do this in production):
```sql
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
```

Then test if it works. If yes, the issue is with RLS policies - run `migrations/fix_rls_policies.sql`

Don't forget to re-enable:
```sql
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
```

## 📁 Note About `user_roles` Table

Your schema has a `user_roles` table that's currently incomplete:

```sql
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
```

This table has no actual role data! It's likely a leftover from an old design.

**We're NOT using this table.** Instead, we're adding the `role` column directly to `user_profiles`, which is the correct approach per the original schema design in `supabase-schema.sql`.

You can safely **drop** this table if you want:
```sql
DROP TABLE IF EXISTS public.user_roles;
```

## 🎯 Quick Role Assignment

### Make Someone a Staff Member:
```sql
UPDATE public.user_profiles 
SET role = 'staff'
WHERE email = 'staff@example.com';
```

### Make Someone a CFI:
```sql
UPDATE public.user_profiles 
SET role = 'cfi'
WHERE email = 'instructor@example.com';
```

### Make Someone an Admin:
```sql
UPDATE public.user_profiles 
SET role = 'admin'
WHERE email = 'admin@example.com';
```

### View All Users and Their Roles:
```sql
SELECT 
  email, 
  full_name, 
  role, 
  created_at
FROM public.user_profiles
ORDER BY 
  CASE role
    WHEN 'founder' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'ops' THEN 3
    WHEN 'staff' THEN 4
    WHEN 'cfi' THEN 5
    WHEN 'owner' THEN 6
  END,
  created_at DESC;
```

## 📚 Related Files

| File | Purpose |
|------|---------|
| `migrations/add_user_roles.sql` | **Main migration** - adds role column |
| `migrations/fix_rls_policies.sql` | Optional - fixes RLS policies |
| `migrations/README_USER_ROLES.md` | Detailed documentation |
| `QUICK_FIX_ROLES.md` | Quick reference guide |
| `supabase-schema.sql` | Original schema with roles |
| `client/src/lib/roles.ts` | Role helper functions |
| `client/src/lib/types/database.ts` | TypeScript types for roles |
| `client/src/components/staff-protected-route.tsx` | Staff route protection |

## ✅ Verification Checklist

After running the migration:

- [ ] `user_role` enum type exists
- [ ] `role` column exists in `user_profiles`
- [ ] Your user has `founder` role
- [ ] All existing users have `owner` role
- [ ] Can log in without errors
- [ ] Can access `/staff/dashboard`
- [ ] No 400 errors in browser console
- [ ] Role-based features work correctly

## 🎉 Expected Result

After following these steps:

1. ✅ No more 400 errors in console
2. ✅ You can access `/staff/dashboard`
3. ✅ All role-based features work
4. ✅ Staff can see all members
5. ✅ CFIs can create instruction invoices
6. ✅ Admins can manage everything

---

## 🆘 Still Need Help?

If you're still having issues:

1. **Check Supabase logs:** Dashboard → Logs → API Logs
2. **Export your schema:**
   ```sql
   -- Run this to see current schema
   SELECT 
     table_name,
     column_name,
     data_type,
     column_default
   FROM information_schema.columns
   WHERE table_schema = 'public'
   AND table_name = 'user_profiles'
   ORDER BY ordinal_position;
   ```
3. **Check for conflicts:**
   ```sql
   -- See all policies
   SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
   ```

Good luck! 🚀

