-- Add role column to user_profiles if it doesn't exist

DO $$
BEGIN
  -- Check if role column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'role'
  ) THEN
    -- Add the column
    ALTER TABLE public.user_profiles 
    ADD COLUMN role user_role DEFAULT 'owner';
    
    RAISE NOTICE 'Added role column to user_profiles table';
    
    -- Set existing users to appropriate roles based on your needs
    -- Example: Set the first user as admin
    -- UPDATE public.user_profiles 
    -- SET role = 'admin' 
    -- WHERE email = 'your-admin@example.com';
    
  ELSE
    RAISE NOTICE 'role column already exists in user_profiles';
  END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    column_default,
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
AND column_name = 'role';
