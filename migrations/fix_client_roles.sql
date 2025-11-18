-- ============================================
-- Fix Client Roles for Staff Dashboard Visibility
-- ============================================
-- This fixes the issue where clients don't show in staff dashboard dropdowns
-- Root cause: Users don't have role='owner' set

BEGIN;

-- Step 1: Show current state
DO $$
DECLARE
  total_users INTEGER;
  users_with_owner_role INTEGER;
  users_without_role INTEGER;
  users_with_other_roles INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM user_profiles;
  SELECT COUNT(*) INTO users_with_owner_role FROM user_profiles WHERE role = 'owner';
  SELECT COUNT(*) INTO users_without_role FROM user_profiles WHERE role IS NULL;
  SELECT COUNT(*) INTO users_with_other_roles 
  FROM user_profiles 
  WHERE role IS NOT NULL AND role != 'owner';
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'BEFORE FIX:';
  RAISE NOTICE '====================================';
  RAISE NOTICE '  Total users:           %', total_users;
  RAISE NOTICE '  Users with owner role: %', users_with_owner_role;
  RAISE NOTICE '  Users without role:    %', users_without_role;
  RAISE NOTICE '  Users with other role: %', users_with_other_roles;
  RAISE NOTICE '====================================';
END $$;

-- Step 2: Fix users who don't have a role set
-- Default them to 'owner' unless they should be staff
UPDATE user_profiles
SET 
  role = 'owner',
  updated_at = NOW()
WHERE role IS NULL;

-- Step 3: Trim any whitespace from existing roles
UPDATE user_profiles
SET 
  role = TRIM(role::text)::user_role,
  updated_at = NOW()
WHERE role::text != TRIM(role::text);

-- Step 4: Show results
DO $$
DECLARE
  total_users INTEGER;
  users_with_owner_role INTEGER;
  users_without_role INTEGER;
  rec RECORD;
BEGIN
  SELECT COUNT(*) INTO total_users FROM user_profiles;
  SELECT COUNT(*) INTO users_with_owner_role FROM user_profiles WHERE role = 'owner';
  SELECT COUNT(*) INTO users_without_role FROM user_profiles WHERE role IS NULL;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'AFTER FIX:';
  RAISE NOTICE '====================================';
  RAISE NOTICE '  Total users:           %', total_users;
  RAISE NOTICE '  Users with owner role: %', users_with_owner_role;
  RAISE NOTICE '  Users without role:    %', users_without_role;
  RAISE NOTICE '====================================';
  
  RAISE NOTICE 'Users by role:';
  FOR rec IN 
    SELECT role::text as role_name, COUNT(*) as count
    FROM user_profiles
    GROUP BY role::text
    ORDER BY count DESC
  LOOP
    RAISE NOTICE '  %: % users', rec.role_name, rec.count;
  END LOOP;
  
  RAISE NOTICE '====================================';
  
  IF users_with_owner_role = 0 THEN
    RAISE WARNING '⚠️  Still no users with owner role!';
  ELSE
    RAISE NOTICE '✅ % users now have owner role and will show in client dropdowns', users_with_owner_role;
  END IF;
END $$;

-- Step 5: Verify the /api/clients query will work
DO $$
DECLARE
  rec RECORD;
  count INTEGER := 0;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'CLIENTS THAT WILL APPEAR IN DROPDOWNS:';
  RAISE NOTICE '====================================';
  
  FOR rec IN 
    SELECT 
      email,
      full_name,
      role::text as role_name
    FROM user_profiles
    WHERE role = 'owner'
    ORDER BY created_at DESC
    LIMIT 10
  LOOP
    count := count + 1;
    RAISE NOTICE '  %: % (%)', count, rec.email, COALESCE(rec.full_name, 'no name set');
  END LOOP;
  
  IF count = 0 THEN
    RAISE WARNING '❌ NO CLIENTS WILL APPEAR! Check if users exist in user_profiles table.';
  ELSE
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ % clients will appear in staff dashboard dropdowns', count;
  END IF;
END $$;

COMMIT;

-- ============================================
-- POST-FIX VERIFICATION
-- ============================================
-- After running this, verify:
--
-- 1. Check clients show in dropdown:
--    SELECT id, email, full_name, role 
--    FROM user_profiles 
--    WHERE role = 'owner';
--
-- 2. Test the staff dashboard /api/clients endpoint
--    Should return these users
--
-- 3. Reload staff dashboard and check:
--    - Invoice creation: "Select client" dropdown
--    - Aircraft assignment: "Select owner" dropdown
--    - Both should now show all owner users

-- ============================================
-- TROUBLESHOOTING
-- ============================================
-- If clients still don't show after this fix:
--
-- 1. Check browser console for API errors:
--    Open DevTools > Console
--    Look for: "Failed to fetch clients" or similar
--
-- 2. Check network tab:
--    Does /api/clients return data?
--    Status code 200?
--    Response body has {clients: [...]}?
--
-- 3. Check if RLS is blocking (shouldn't be - API uses service role):
--    SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
--
-- 4. Check server logs:
--    Look for errors in /api/clients endpoint



