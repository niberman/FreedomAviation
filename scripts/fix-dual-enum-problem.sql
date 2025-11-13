-- Fix the dual enum problem (app_role and user_role both exist)
-- This script adds 'ops' and 'founder' to both enums to ensure compatibility

-- ============================================
-- IMPORTANT: Run each ALTER TYPE command in a SEPARATE query!
-- PostgreSQL doesn't allow adding enum values in transactions
-- ============================================

-- Step 1: Add 'ops' to app_role
ALTER TYPE app_role ADD VALUE 'ops';

-- Step 2: Add 'founder' to app_role (MUST be separate query)
-- ALTER TYPE app_role ADD VALUE 'founder';

-- Step 3: Add 'ops' to user_role (MUST be separate query)
-- ALTER TYPE user_role ADD VALUE 'ops';

-- Step 4: Add 'founder' to user_role (MUST be separate query)
-- ALTER TYPE user_role ADD VALUE 'founder';

-- ============================================
-- After adding to both enums, verify:
-- ============================================
-- SELECT 
--     t.typname as enum_name,
--     string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
-- FROM pg_type t 
-- JOIN pg_enum e ON t.oid = e.enumtypid  
-- WHERE t.typname IN ('user_role', 'app_role')
-- GROUP BY t.typname;
