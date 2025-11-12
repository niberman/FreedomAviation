-- Consolidate to a single role enum (remove duplicate)
-- Step 1: Check which enum is actually used by tables

SELECT 
    table_name,
    column_name,
    udt_name as current_enum_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND udt_name IN ('app_role', 'user_role')
ORDER BY table_name, column_name;

-- Based on the results above, we'll standardize on whichever is most used
-- Usually it's app_role in Supabase projects

-- ============================================
-- Option A: If user_profiles uses app_role, drop user_role
-- ============================================
-- First, check if user_role is used anywhere
-- SELECT count(*) FROM information_schema.columns WHERE udt_name = 'user_role';

-- If count is 0 (not used), safe to drop:
-- DROP TYPE IF EXISTS user_role;

-- ============================================
-- Option B: If user_profiles uses user_role, migrate to app_role
-- ============================================
-- This is more complex and requires:
-- 1. Altering the column to use app_role
-- 2. Then dropping user_role

-- For now, let's just verify which is used:
SELECT 
    'user_profiles uses: ' || udt_name as info
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
AND column_name = 'role';

-- ============================================
-- Quick fix: Just comment which one to keep
-- ============================================
-- If user_profiles.role uses app_role → keep app_role, drop user_role
-- If user_profiles.role uses user_role → keep user_role, drop app_role
