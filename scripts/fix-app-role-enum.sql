-- Freedom Aviation - Fix user role enum values
-- Run this in the Supabase SQL editor to ensure staff/CFI roles work correctly.

-- ============================================================================
-- Step 1: Ensure the expected user_role enum exists with all required values
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'user_role'
  ) THEN
    EXECUTE 'CREATE TYPE public.user_role AS ENUM (''owner'', ''staff'', ''cfi'', ''admin'')';
  END IF;
END;
$$;

-- Add any missing enum labels on user_role (PostgreSQL 9.6+ supports IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'user_role'::regtype 
      AND enumlabel = 'staff'
  ) THEN
    EXECUTE format('ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS %L', 'staff');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'user_role'::regtype 
      AND enumlabel = 'cfi'
  ) THEN
    EXECUTE format('ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS %L', 'cfi');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'user_role'::regtype 
      AND enumlabel = 'owner'
  ) THEN
    EXECUTE format('ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS %L', 'owner');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'user_role'::regtype 
      AND enumlabel = 'admin'
  ) THEN
    EXECUTE format('ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS %L', 'admin');
  END IF;
END;
$$;

-- ============================================================================
-- Step 2: Backfill legacy app_role enum (if it still exists) with missing values
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'app_role'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumtypid = 'app_role'::regtype 
        AND enumlabel = 'staff'
    ) THEN
      EXECUTE format('ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS %L', 'staff');
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumtypid = 'app_role'::regtype 
        AND enumlabel = 'cfi'
    ) THEN
      EXECUTE format('ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS %L', 'cfi');
    END IF;
  END IF;
END;
$$;

-- ============================================================================
-- Step 3: Ensure public.user_profiles.role allows the new values
-- ============================================================================
DO $$
DECLARE
  current_type regtype;
BEGIN
  SELECT atttypid::regtype
  INTO current_type
  FROM pg_attribute
  WHERE attrelid = 'public.user_profiles'::regclass
    AND attname = 'role'
    AND attisdropped = false;

  IF current_type IS NULL THEN
    RAISE NOTICE 'Column public.user_profiles.role not found. Skipping type migration.';
    RETURN;
  END IF;

  IF current_type::text = 'user_role' THEN
    RAISE NOTICE 'public.user_profiles.role already uses user_role';
    EXECUTE 'ALTER TABLE public.user_profiles ALTER COLUMN role SET DEFAULT ''owner''::public.user_role';
  ELSIF current_type::text = 'app_role' THEN
    RAISE NOTICE 'public.user_profiles.role still uses app_role; ensuring new labels are available.';
    EXECUTE 'ALTER TABLE public.user_profiles ALTER COLUMN role SET DEFAULT ''owner''::public.app_role';
  ELSE
    RAISE NOTICE 'public.user_profiles.role uses unexpected type %; manual review recommended.', current_type::text;
  END IF;
END;
$$;

-- ============================================================================
-- Step 4: Optionally drop unused legacy enum
-- ============================================================================
DO $$
DECLARE
  depend_count integer;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    SELECT COUNT(*) INTO depend_count
    FROM pg_type t
    JOIN pg_depend d ON d.refobjid = t.oid
    WHERE t.typname = 'app_role';

    -- Only drop if nothing depends on the type anymore
    IF depend_count = 0 THEN
      EXECUTE 'DROP TYPE public.app_role';
      RAISE NOTICE 'Dropped legacy enum type public.app_role';
    ELSE
      RAISE NOTICE 'public.app_role still has % dependency/ies; not dropping', depend_count;
    END IF;
  END IF;
END;
$$;

-- ============================================================================
-- Step 5: Refresh policies to avoid ::app_role casts (run separately if needed)
-- ============================================================================
-- After executing this script, re-run scripts/fix-user-profiles-rls.sql
-- to replace any policies that reference ::app_role with column checks.
-- ============================================================================

