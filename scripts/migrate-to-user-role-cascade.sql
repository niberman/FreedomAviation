-- Quick migration using CASCADE to handle all dependencies
-- WARNING: This will drop and recreate functions/constraints that depend on app_role

-- Step 1: Drop app_role and all dependencies
DROP TYPE app_role CASCADE;

-- Step 2: Recreate has_role function with user_role
CREATE OR REPLACE FUNCTION has_role(user_id uuid, check_role user_role)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = user_id AND role = check_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Verify only user_role exists
SELECT 
    typname as enum_name,
    string_agg(enumlabel, ', ' ORDER BY enumsortorder) as values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE typname IN ('user_role', 'app_role')
GROUP BY typname;

-- Should only show user_role with: owner, staff, cfi, admin, ops, founder
