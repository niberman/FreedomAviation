-- Verification Script for User Roles Migration
-- Run this after add_user_roles.sql to verify everything worked

-- ============================================
-- 1. Check if enum type exists
-- ============================================
SELECT 
  'user_role enum exists' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') 
    THEN '✅ PASS' 
    ELSE '❌ FAIL - Run add_user_roles.sql first!'
  END as status;

-- ============================================
-- 2. Check if role column exists
-- ============================================
SELECT 
  'role column exists' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_profiles' 
      AND column_name = 'role'
    )
    THEN '✅ PASS' 
    ELSE '❌ FAIL - Run add_user_roles.sql first!'
  END as status;

-- ============================================
-- 3. Check enum values
-- ============================================
SELECT 
  'Enum values' as info,
  enumlabel as available_roles
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

-- Expected: owner, staff, cfi, admin, ops, founder

-- ============================================
-- 4. View all users and their roles
-- ============================================
SELECT 
  'User Roles' as info,
  email,
  role,
  CASE 
    WHEN role IN ('staff', 'cfi', 'ops', 'admin', 'founder') 
    THEN '✅ Has staff access'
    ELSE '❌ No staff access'
  END as staff_access,
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
    ELSE 7
  END,
  created_at DESC;

-- ============================================
-- 5. Check your founder access
-- ============================================
SELECT 
  'Your access' as info,
  email,
  role,
  CASE 
    WHEN role = 'founder' THEN '✅ You have founder access!'
    WHEN role IN ('admin', 'ops', 'staff', 'cfi') THEN '✅ You have staff access'
    ELSE '❌ You only have owner access - update your role!'
  END as access_level
FROM public.user_profiles
WHERE email = 'noah@freedomaviationco.com';

-- Expected: role = 'founder', access_level = '✅ You have founder access!'

-- ============================================
-- 6. Check RLS policies
-- ============================================
SELECT 
  'RLS Policies' as info,
  policyname as policy,
  cmd as applies_to,
  CASE 
    WHEN permissive = 'PERMISSIVE' THEN '✅ Permissive'
    ELSE 'Restrictive'
  END as type
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Expected: 5-6 policies including "Users can view own profile", "Staff can view all profiles", etc.

-- ============================================
-- 7. Count users by role
-- ============================================
SELECT 
  'Users by Role' as info,
  role,
  COUNT(*) as user_count,
  CASE 
    WHEN role IN ('staff', 'cfi', 'ops', 'admin', 'founder') 
    THEN '👥 Staff members'
    ELSE '👤 Regular users'
  END as category
FROM public.user_profiles
GROUP BY role
ORDER BY 
  CASE role
    WHEN 'founder' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'ops' THEN 3
    WHEN 'staff' THEN 4
    WHEN 'cfi' THEN 5
    WHEN 'owner' THEN 6
    ELSE 7
  END;

-- ============================================
-- 8. Check for NULL roles (should be 0)
-- ============================================
SELECT 
  'NULL roles check' as check_name,
  COUNT(*) as null_role_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS - No NULL roles'
    ELSE '⚠️  WARNING - Some users have NULL roles!'
  END as status
FROM public.user_profiles
WHERE role IS NULL;

-- ============================================
-- 9. Test role-based query (simulates frontend)
-- ============================================
-- This simulates what the frontend does when checking roles
SELECT 
  'Frontend simulation' as info,
  id,
  email,
  role,
  CASE 
    WHEN role IN ('staff', 'cfi', 'ops', 'admin', 'founder') 
    THEN '✅ Will grant staff dashboard access'
    ELSE '❌ Will redirect to owner dashboard'
  END as frontend_behavior
FROM public.user_profiles
WHERE email = 'noah@freedomaviationco.com';

-- ============================================
-- SUMMARY
-- ============================================
SELECT 
  '========== MIGRATION SUMMARY ==========' as summary,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role')
    AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_profiles' 
      AND column_name = 'role'
    )
    AND EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE email = 'noah@freedomaviationco.com' 
      AND role = 'founder'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.user_profiles WHERE role IS NULL
    )
    THEN '✅ ALL CHECKS PASSED! You''re ready to go!'
    ELSE '❌ SOME CHECKS FAILED - Review output above'
  END as overall_status;

-- ============================================
-- Next Steps
-- ============================================
SELECT 
  'Next steps:' as instructions,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE email = 'noah@freedomaviationco.com' 
      AND role = 'founder'
    )
    THEN '
    1. Log out of the application
    2. Clear browser cache (or use incognito mode)
    3. Log back in
    4. Navigate to /staff/dashboard
    5. You should have full access! 🎉
    '
    ELSE '
    ⚠️  Your user is not set to founder role!
    Run this command:
    
    UPDATE public.user_profiles 
    SET role = ''founder''
    WHERE email = ''noah@freedomaviationco.com'';
    
    Then re-run this verification script.
    '
  END as next_steps;

