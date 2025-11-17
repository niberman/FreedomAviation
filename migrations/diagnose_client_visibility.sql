-- ============================================
-- Diagnose Client Visibility Issue
-- ============================================
-- This script helps diagnose why clients aren't showing in staff dashboard

-- Step 1: Check if we have any users at all
DO $$
DECLARE
  total_users INTEGER;
  total_profiles INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM auth.users;
  SELECT COUNT(*) INTO total_profiles FROM public.user_profiles;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'USER COUNTS:';
  RAISE NOTICE '====================================';
  RAISE NOTICE '  auth.users: %', total_users;
  RAISE NOTICE '  user_profiles: %', total_profiles;
  RAISE NOTICE '====================================';
END $$;

-- Step 2: Check user_profiles role distribution
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'USER PROFILES BY ROLE:';
  RAISE NOTICE '====================================';
  
  FOR rec IN 
    SELECT 
      COALESCE(role, '(NULL)') as role_value,
      COUNT(*) as count
    FROM user_profiles
    GROUP BY role
    ORDER BY count DESC
  LOOP
    RAISE NOTICE '  % role: % users', rec.role_value, rec.count;
  END LOOP;
  
  RAISE NOTICE '====================================';
END $$;

-- Step 3: Show all user_profiles with details
DO $$
DECLARE
  rec RECORD;
  count INTEGER := 0;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'ALL USER PROFILES:';
  RAISE NOTICE '====================================';
  
  FOR rec IN 
    SELECT 
      id,
      email,
      full_name,
      role,
      created_at
    FROM user_profiles
    ORDER BY created_at DESC
    LIMIT 20
  LOOP
    count := count + 1;
    RAISE NOTICE '  %', count;
    RAISE NOTICE '    Email: %', rec.email;
    RAISE NOTICE '    Name: %', COALESCE(rec.full_name, '(not set)');
    RAISE NOTICE '    Role: %', COALESCE(rec.role::text, '(NULL)');
    RAISE NOTICE '    Created: %', rec.created_at;
    RAISE NOTICE '  ---';
  END LOOP;
  
  IF count = 0 THEN
    RAISE WARNING '⚠️  No user profiles found!';
  END IF;
  
  RAISE NOTICE '====================================';
END $$;

-- Step 4: Check for role whitespace issues
DO $$
DECLARE
  rec RECORD;
  whitespace_issues INTEGER := 0;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'CHECKING FOR ROLE WHITESPACE:';
  RAISE NOTICE '====================================';
  
  FOR rec IN 
    SELECT 
      id,
      email,
      role::text as role_text,
      LENGTH(role::text) as role_length,
      LENGTH(TRIM(role::text)) as trimmed_length
    FROM user_profiles
    WHERE role IS NOT NULL
  LOOP
    IF rec.role_length != rec.trimmed_length THEN
      whitespace_issues := whitespace_issues + 1;
      RAISE NOTICE '  ⚠️  User % has whitespace in role:', rec.email;
      RAISE NOTICE '      Role: "%"', rec.role_text;
      RAISE NOTICE '      Length: % (trimmed: %)', rec.role_length, rec.trimmed_length;
    END IF;
  END LOOP;
  
  IF whitespace_issues = 0 THEN
    RAISE NOTICE '  ✅ No whitespace issues found';
  ELSE
    RAISE WARNING '  ⚠️  Found % users with whitespace in role!', whitespace_issues;
  END IF;
  
  RAISE NOTICE '====================================';
END $$;

-- Step 5: Test the exact query that /api/clients uses
DO $$
DECLARE
  rec RECORD;
  owner_count INTEGER := 0;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'TESTING /api/clients QUERY:';
  RAISE NOTICE 'SELECT * FROM user_profiles WHERE role = ''owner''';
  RAISE NOTICE '====================================';
  
  FOR rec IN 
    SELECT 
      id,
      full_name,
      email,
      role
    FROM user_profiles
    WHERE role = 'owner'
    ORDER BY created_at DESC
  LOOP
    owner_count := owner_count + 1;
    RAISE NOTICE '  Owner %: % (%)', owner_count, rec.email, COALESCE(rec.full_name, 'no name');
  END LOOP;
  
  IF owner_count = 0 THEN
    RAISE WARNING '  ❌ NO OWNERS FOUND!';
    RAISE NOTICE '  ';
    RAISE NOTICE '  This is why clients don''t show in dropdowns.';
    RAISE NOTICE '  ';
    RAISE NOTICE '  SOLUTION: Users need to have role set to ''owner''';
  ELSE
    RAISE NOTICE '  ✅ Found % owners', owner_count;
  END IF;
  
  RAISE NOTICE '====================================';
END $$;

-- Step 6: Check RLS policies on user_profiles
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'RLS POLICIES ON user_profiles:';
  RAISE NOTICE '====================================';
  
  FOR rec IN 
    SELECT 
      policyname,
      cmd,
      roles::text,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_profiles'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  Policy: %', rec.policyname;
    RAISE NOTICE '    Command: %', rec.cmd;
    RAISE NOTICE '    Roles: %', rec.roles;
  END LOOP;
  
  RAISE NOTICE '====================================';
END $$;

-- ============================================
-- RECOMMENDED FIXES
-- ============================================
-- If no owners found, run this to set existing users to 'owner':
--
-- UPDATE user_profiles 
-- SET role = 'owner'
-- WHERE role IS NULL OR role NOT IN ('owner', 'admin', 'cfi', 'staff', 'ops', 'founder');
--
-- Then verify:
-- SELECT email, role FROM user_profiles WHERE role = 'owner';

