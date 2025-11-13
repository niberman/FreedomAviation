-- Step 1: Check which enum user_profiles actually uses
SELECT 
    column_name,
    udt_name as enum_being_used
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
AND column_name = 'role';

-- Step 2: Check if BOTH enums are used anywhere
SELECT 
    udt_name as enum_type,
    count(*) as usage_count,
    string_agg(table_name || '.' || column_name, ', ') as used_in
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND udt_name IN ('app_role', 'user_role')
GROUP BY udt_name;

-- ============================================
-- Step 3: Drop the unused enum
-- ============================================
-- Run the diagnostic queries above first to confirm which to drop!

-- If user_role is NOT used (usage_count = 0), drop it:
-- DROP TYPE user_role;

-- If app_role is NOT used (usage_count = 0), drop it:
-- DROP TYPE app_role;

-- ============================================
-- EXPECTED RESULT:
-- ============================================
-- Most likely user_profiles.role uses 'app_role' 
-- And user_role is unused (leftover from schema.sql)
-- So you can safely: DROP TYPE user_role;
