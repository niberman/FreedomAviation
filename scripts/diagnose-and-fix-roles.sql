-- Diagnose and fix the dual enum problem
-- You have both app_role and user_role enums, which causes confusion

-- ============================================
-- STEP 1: Check which enum is actually used
-- ============================================
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name as actual_enum_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'role';

-- ============================================
-- STEP 2: Check what values each enum has
-- ============================================
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('user_role', 'app_role')
ORDER BY t.typname, e.enumsortorder;

-- ============================================
-- STEP 3: Add 'ops' and 'founder' to BOTH enums
-- (to be safe, in case different tables use different enums)
-- ============================================

-- Add to app_role (run each in separate query)
-- ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'ops';
-- ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'founder';

-- Add to user_role (run each in separate query)
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ops';
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'founder';
