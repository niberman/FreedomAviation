-- Diagnostic query to find the correct enum type name
-- Run this first to see what enum types exist

-- Check for user_role enum
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('user_role', 'app_role')
ORDER BY t.typname, e.enumsortorder;

-- Also check what the user_profiles table actually uses
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles' 
AND column_name = 'role';
