-- Check the structure of user_profiles table

-- 1. Check if user_profiles table exists
SELECT 
    EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
    ) as user_profiles_exists;

-- 2. Show all columns in user_profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 3. Check specifically for role column
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'user_profiles' 
            AND column_name = 'role'
        ) 
        THEN 'user_profiles.role EXISTS'
        ELSE 'user_profiles.role MISSING - You need to add this column!'
    END as role_column_status;

-- 4. If role column is missing, here's how to add it:
-- ALTER TABLE public.user_profiles ADD COLUMN role user_role DEFAULT 'owner';
