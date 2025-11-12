-- Manual steps to add 'ops' and 'founder' roles
-- If the automated script fails, run these commands ONE AT A TIME in Supabase SQL Editor

-- Step 1: Add 'ops' to the enum
-- Run this command first:
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ops';

-- Step 2: Add 'founder' to the enum  
-- Run this command second (must be in a separate query/transaction):
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'founder';

-- Note: If you get an error about the enum name, try:
-- ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'ops';
-- ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'founder';

-- After adding the enum values, continue with the rest of the migration script
