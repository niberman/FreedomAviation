-- Quick fix: Add 'ops' and 'founder' to enum
-- 
-- Based on your error, it seems the enum might be called 'app_role' instead of 'user_role'
-- 
-- INSTRUCTIONS:
-- 1. Run the diagnostic query below first to see what enum name you have
-- 2. Then run the appropriate ALTER TYPE commands ONE AT A TIME

-- ============================================
-- STEP 1: Check what enum name you have
-- ============================================
SELECT 
    t.typname as enum_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as current_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('user_role', 'app_role')
GROUP BY t.typname;

-- ============================================
-- STEP 2: Add 'ops' value
-- ============================================
-- If the enum is called 'user_role', run:
-- ALTER TYPE user_role ADD VALUE 'ops';

-- If the enum is called 'app_role', run:
-- ALTER TYPE app_role ADD VALUE 'ops';

-- ============================================
-- STEP 3: Add 'founder' value (in a SEPARATE query)
-- ============================================
-- IMPORTANT: This must be run in a separate query/transaction!
-- If the enum is called 'user_role', run:
-- ALTER TYPE user_role ADD VALUE 'founder';

-- If the enum is called 'app_role', run:
-- ALTER TYPE app_role ADD VALUE 'founder';

-- ============================================
-- Quick fix: Try both (one will work, one will error - that's OK)
-- ============================================
-- Uncomment the one that matches your enum name:

-- For user_role:
-- ALTER TYPE user_role ADD VALUE 'ops';
-- ALTER TYPE user_role ADD VALUE 'founder';

-- For app_role:
ALTER TYPE app_role ADD VALUE 'ops';
-- Then run this separately:
-- ALTER TYPE app_role ADD VALUE 'founder';
