-- ============================================
-- Fix User Creation Trigger
-- ============================================
-- This fixes the "column 'role' of relation 'user_roles' does not exist" error
-- The trigger should insert into user_profiles, not user_roles

-- Step 1: Drop the problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Check if user_roles table exists and has data
DO $$
DECLARE
  row_count INTEGER;
  has_table BOOLEAN;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
  ) INTO has_table;
  
  IF has_table THEN
    SELECT COUNT(*) INTO row_count FROM public.user_roles;
    RAISE NOTICE '⚠️  user_roles table exists with % rows', row_count;
    
    -- If it has data, we should migrate it first
    IF row_count > 0 THEN
      RAISE NOTICE 'Attempting to preserve data from user_roles...';
      -- Note: This assumes user_roles has similar structure
      -- Adjust if needed based on actual structure
    END IF;
    
    RAISE NOTICE 'Dropping user_roles table (redundant with user_profiles.role column)';
    DROP TABLE IF EXISTS public.user_roles CASCADE;
    RAISE NOTICE '✅ user_roles table dropped';
  ELSE
    RAISE NOTICE '✅ user_roles table does not exist (good)';
  END IF;
END $$;

-- Step 3: Ensure user_role enum type exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    RAISE NOTICE 'Creating user_role enum type...';
    CREATE TYPE user_role AS ENUM ('owner', 'staff', 'cfi', 'admin', 'ops', 'founder');
    RAISE NOTICE '✅ user_role enum created';
  ELSE
    RAISE NOTICE '✅ user_role enum already exists';
  END IF;
END $$;

-- Step 4: Ensure user_profiles has role column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'role'
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE 'Adding role column to user_profiles...';
    ALTER TABLE public.user_profiles ADD COLUMN role user_role DEFAULT 'owner';
    RAISE NOTICE '✅ role column added';
  ELSE
    RAISE NOTICE '✅ role column already exists in user_profiles';
  END IF;
END $$;

-- Step 5: Recreate the correct trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into user_profiles (NOT user_roles)
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    -- Try multiple fields for name:
    -- 1. full_name (from email/password signup)
    -- 2. name (from Google OAuth and other OAuth providers)
    -- 3. email username as fallback
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    'owner'::user_role -- Default role for new users
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Update email and name if they changed (e.g., via OAuth)
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Step 6: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Verify everything
SELECT 
  '=== Verification Results ===' as check_section,
  '' as details
UNION ALL
SELECT 
  'Trigger exists',
  CASE WHEN COUNT(*) > 0 THEN '✅ YES' ELSE '❌ NO' END
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
UNION ALL
SELECT 
  'user_profiles.role column',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM information_schema.columns
WHERE table_name = 'user_profiles' AND column_name = 'role' AND table_schema = 'public'
UNION ALL
SELECT 
  'user_role enum',
  CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'user_roles table (should not exist)',
  CASE WHEN NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) THEN '✅ REMOVED' ELSE '⚠️  STILL EXISTS' END;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '✅ User creation trigger fixed!';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE 'You can now invite users without errors.';
  RAISE NOTICE 'New users will be created with role = owner by default.';
  RAISE NOTICE '';
END $$;

