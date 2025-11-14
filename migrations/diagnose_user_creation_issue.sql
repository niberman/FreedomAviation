-- Diagnostic script to identify the user creation issue
-- Run this FIRST to see what's wrong

-- ============================================
-- 1. Check if user_roles table exists
-- ============================================
SELECT 
  'user_roles table' as check_item,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'user_roles'
    ) THEN '⚠️ EXISTS (should not exist - this is the problem!)'
    ELSE '✅ Does not exist (good)'
  END as status;

-- ============================================
-- 2. Check user_profiles table structure
-- ============================================
SELECT 
  'user_profiles columns' as check_item,
  string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position) as status
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles';

-- ============================================
-- 3. Check if user_role enum exists
-- ============================================
SELECT 
  'user_role enum' as check_item,
  CASE 
    WHEN EXISTS (
      SELECT FROM pg_type 
      WHERE typname = 'user_role'
    ) THEN '✅ Exists'
    ELSE '❌ Missing'
  END as status;

-- ============================================
-- 4. Check current trigger function
-- ============================================
SELECT 
  'Trigger function body' as check_item,
  pg_get_functiondef(oid) as current_definition
FROM pg_proc
WHERE proname = 'handle_new_user';

-- ============================================
-- 5. Check if trigger exists
-- ============================================
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- 6. If user_roles table exists, show its structure
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
  ) THEN
    RAISE NOTICE '=== user_roles table structure ===';
    PERFORM column_name, data_type 
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles';
  END IF;
END $$;

-- Show user_roles columns if table exists
SELECT 
  column_name,
  data_type,
  udt_name,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- ============================================
-- Summary
-- ============================================
SELECT 
  '=== DIAGNOSIS COMPLETE ===' as message,
  'Check the results above to see what needs fixing' as next_step;

