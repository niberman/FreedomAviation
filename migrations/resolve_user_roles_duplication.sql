-- ============================================
-- Resolve User Roles Duplication Migration
-- ============================================
-- This migration resolves the dual user role system:
-- 1. user_roles table with app_role enum
-- 2. user_profiles.role column with user_role enum
--
-- Goal: Consolidate to use only user_profiles.role

BEGIN;

-- Step 1: Check current state
DO $$
DECLARE
  has_user_roles_table BOOLEAN;
  has_app_role_enum BOOLEAN;
  has_user_role_enum BOOLEAN;
  user_roles_count INTEGER := 0;
BEGIN
  -- Check for user_roles table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) INTO has_user_roles_table;
  
  -- Check for app_role enum
  SELECT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'app_role'
  ) INTO has_app_role_enum;
  
  -- Check for user_role enum
  SELECT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'user_role'
  ) INTO has_user_role_enum;
  
  IF has_user_roles_table THEN
    SELECT COUNT(*) INTO user_roles_count FROM public.user_roles;
  END IF;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'Current State:';
  RAISE NOTICE '  user_roles table:    %', CASE WHEN has_user_roles_table THEN 'EXISTS' ELSE 'DOES NOT EXIST' END;
  RAISE NOTICE '  user_roles records:  %', user_roles_count;
  RAISE NOTICE '  app_role enum:       %', CASE WHEN has_app_role_enum THEN 'EXISTS' ELSE 'DOES NOT EXIST' END;
  RAISE NOTICE '  user_role enum:      %', CASE WHEN has_user_role_enum THEN 'EXISTS' ELSE 'DOES NOT EXIST' END;
  RAISE NOTICE '====================================';
END $$;

-- Step 2: Ensure user_role enum exists with all required values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('owner', 'staff', 'cfi', 'admin', 'ops', 'founder');
    RAISE NOTICE '✅ Created user_role enum';
  ELSE
    RAISE NOTICE 'ℹ️  user_role enum already exists';
  END IF;
END $$;

-- Step 3: Ensure user_profiles.role column exists and has correct type
DO $$
DECLARE
  role_column_exists BOOLEAN;
  role_column_type TEXT;
BEGIN
  SELECT 
    EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_profiles' 
      AND column_name = 'role'
    ) INTO role_column_exists;
  
  IF role_column_exists THEN
    SELECT data_type INTO role_column_type
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'role';
    
    RAISE NOTICE 'ℹ️  user_profiles.role exists with type: %', role_column_type;
  ELSE
    -- Add the role column if it doesn't exist
    ALTER TABLE user_profiles 
    ADD COLUMN role user_role DEFAULT 'owner';
    
    RAISE NOTICE '✅ Added role column to user_profiles';
  END IF;
END $$;

-- Step 4: Migrate data from user_roles to user_profiles.role if needed
DO $$
DECLARE
  migrated_count INTEGER := 0;
  has_user_roles_table BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) INTO has_user_roles_table;
  
  IF has_user_roles_table THEN
    -- Update user_profiles with role from user_roles
    -- Map app_role values to user_role values (they should be the same)
    WITH role_updates AS (
      UPDATE user_profiles up
      SET role = ur.role::text::user_role
      FROM user_roles ur
      WHERE up.id = ur.user_id
      AND up.role != ur.role::text::user_role
      RETURNING up.id
    )
    SELECT COUNT(*) INTO migrated_count FROM role_updates;
    
    IF migrated_count > 0 THEN
      RAISE NOTICE '✅ Migrated % user role records', migrated_count;
    ELSE
      RAISE NOTICE 'ℹ️  No role data to migrate (already in sync or no records)';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️  user_roles table does not exist, no migration needed';
  END IF;
END $$;

-- Step 5: Verify role data integrity
DO $$
DECLARE
  profiles_with_role INTEGER;
  profiles_without_role INTEGER;
BEGIN
  SELECT COUNT(*) INTO profiles_with_role FROM user_profiles WHERE role IS NOT NULL;
  SELECT COUNT(*) INTO profiles_without_role FROM user_profiles WHERE role IS NULL;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Role Data After Migration:';
  RAISE NOTICE '  Profiles with role:    %', profiles_with_role;
  RAISE NOTICE '  Profiles without role: %', profiles_without_role;
  RAISE NOTICE '====================================';
  
  IF profiles_without_role > 0 THEN
    RAISE WARNING '⚠️  % user profiles do not have a role set', profiles_without_role;
  END IF;
END $$;

-- Step 6: Drop user_roles table if it exists
DO $$
DECLARE
  has_user_roles_table BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) INTO has_user_roles_table;
  
  IF has_user_roles_table THEN
    DROP TABLE public.user_roles CASCADE;
    RAISE NOTICE '✅ Dropped user_roles table';
  ELSE
    RAISE NOTICE 'ℹ️  user_roles table does not exist';
  END IF;
END $$;

-- Step 7: Drop app_role enum if it exists and is no longer used
DO $$
DECLARE
  has_app_role_enum BOOLEAN;
  dependent_objects INTEGER;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') INTO has_app_role_enum;
  
  IF has_app_role_enum THEN
    -- Check if anything still depends on app_role
    SELECT COUNT(*) INTO dependent_objects
    FROM pg_depend
    WHERE refobjid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
    AND deptype != 'i'; -- Ignore internal dependencies
    
    IF dependent_objects = 0 THEN
      DROP TYPE app_role CASCADE;
      RAISE NOTICE '✅ Dropped app_role enum (no longer used)';
    ELSE
      RAISE WARNING '⚠️  app_role enum still has % dependencies, not dropping', dependent_objects;
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️  app_role enum does not exist';
  END IF;
END $$;

-- Step 8: Verify final state
DO $$
DECLARE
  has_user_roles_table BOOLEAN;
  has_app_role_enum BOOLEAN;
  has_user_role_enum BOOLEAN;
  role_column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) INTO has_user_roles_table;
  
  SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') INTO has_app_role_enum;
  SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') INTO has_user_role_enum;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'role'
  ) INTO role_column_exists;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'Final State:';
  RAISE NOTICE '  user_roles table:       %', CASE WHEN has_user_roles_table THEN '❌ STILL EXISTS' ELSE '✅ REMOVED' END;
  RAISE NOTICE '  app_role enum:          %', CASE WHEN has_app_role_enum THEN '⚠️  STILL EXISTS' ELSE '✅ REMOVED' END;
  RAISE NOTICE '  user_role enum:         %', CASE WHEN has_user_role_enum THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '  user_profiles.role col: %', CASE WHEN role_column_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '====================================';

  IF NOT has_user_role_enum OR NOT role_column_exists THEN
    RAISE EXCEPTION 'Migration failed: user_role enum or user_profiles.role column is missing!';
  END IF;
  
  IF has_user_roles_table THEN
    RAISE EXCEPTION 'Migration failed: user_roles table still exists!';
  END IF;
  
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE 'ℹ️  All user roles are now stored in user_profiles.role column';
END $$;

COMMIT;

-- ============================================
-- POST-MIGRATION NOTES
-- ============================================
-- After this migration:
-- - All user roles are stored in user_profiles.role (user_role enum)
-- - user_roles table has been removed
-- - app_role enum has been removed (if possible)
-- - Application code should only reference user_profiles.role

-- ============================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================
-- To rollback, you would need to:
-- 1. Recreate app_role enum
-- 2. Recreate user_roles table
-- 3. Migrate data back from user_profiles.role to user_roles
-- This is not recommended as it would cause confusion

