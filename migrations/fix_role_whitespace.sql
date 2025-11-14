-- Fix trailing whitespace in user_profiles.role column
-- This migration trims any whitespace from role values
-- Note: role is a custom enum type (user_role), so we need to cast to text

-- First, let's see what we're dealing with
SELECT 
  id,
  email,
  role::text as role_text,
  LENGTH(role::text) as role_length,
  CASE 
    WHEN role::text != TRIM(role::text) THEN 'HAS WHITESPACE'
    ELSE 'CLEAN'
  END as status
FROM user_profiles
WHERE role IS NOT NULL;

-- Update any roles with trailing or leading whitespace
-- Cast to text, trim, then cast back to the enum type
UPDATE user_profiles
SET role = TRIM(role::text)::user_role
WHERE role::text != TRIM(role::text);

-- Verify all roles are now trimmed and valid
SELECT 
  id,
  email,
  role::text as role_text,
  LENGTH(role::text) as role_length,
  CASE 
    WHEN role::text IN ('admin', 'cfi', 'staff', 'ops', 'founder', 'owner') THEN 'VALID'
    ELSE 'INVALID'
  END as role_status
FROM user_profiles
WHERE role IS NOT NULL
ORDER BY role;

