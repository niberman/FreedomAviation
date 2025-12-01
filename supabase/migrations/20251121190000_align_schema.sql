-- Alignment Migration: Sync Preview with Main Schema
-- 1. Rename profiles -> user_profiles
-- 2. Cleanup aircraft duplicate columns
-- 3. Resolve user roles (consolidate to user_profiles.role)
-- 4. Update Invoice RLS to use user_profiles.role

BEGIN;

-- ============================================
-- 0. Standardize User Table Name
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    ALTER TABLE profiles RENAME TO user_profiles;
    
    -- Rename index if exists
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'profiles_pkey') THEN
      ALTER INDEX profiles_pkey RENAME TO user_profiles_pkey;
    END IF;
    
    RAISE NOTICE '✅ Renamed profiles table to user_profiles';
  END IF;
END $$;

-- ============================================
-- 1. Cleanup Aircraft Duplicate Columns
-- ============================================

-- Migrate data from old columns to new columns if needed
DO $$
BEGIN
  -- Check if columns exist before trying to update/drop
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aircraft' AND column_name = 'hobbs_time') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aircraft' AND column_name = 'hobbs_hours') THEN
     
    UPDATE aircraft
    SET hobbs_hours = hobbs_time
    WHERE hobbs_hours IS NULL AND hobbs_time IS NOT NULL;
    
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aircraft' AND column_name = 'tach_time') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aircraft' AND column_name = 'tach_hours') THEN
     
    UPDATE aircraft
    SET tach_hours = tach_time
    WHERE tach_hours IS NULL AND tach_time IS NOT NULL;
    
  END IF;
END $$;

-- Drop the old columns
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aircraft' AND column_name = 'hobbs_time') THEN
    ALTER TABLE aircraft DROP COLUMN hobbs_time CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aircraft' AND column_name = 'tach_time') THEN
    ALTER TABLE aircraft DROP COLUMN tach_time CASCADE;
  END IF;
END $$;

-- Recreate view with aliases
CREATE OR REPLACE VIEW v_owner_aircraft AS
SELECT 
  id,
  tail_number,
  model,
  owner_id,
  base_location,
  status,
  created_at,
  updated_at,
  hobbs_hours AS hobbs_time,
  tach_hours AS tach_time
FROM aircraft;

-- ============================================
-- 2. Resolve User Roles
-- ============================================

-- Ensure user_role enum exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('owner', 'staff', 'cfi', 'admin', 'ops', 'founder');
  END IF;
END $$;

-- Ensure user_profiles.role column exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'role') THEN
    ALTER TABLE user_profiles ADD COLUMN role user_role DEFAULT 'owner';
  END IF;
END $$;

-- Migrate data from user_roles table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    -- Update user_profiles with role from user_roles
    UPDATE user_profiles up
    SET role = ur.role::text::user_role
    FROM user_roles ur
    WHERE up.id = ur.user_id
    AND up.role != ur.role::text::user_role;
    
    -- Drop user_roles table
    DROP TABLE user_roles CASCADE;
  END IF;
END $$;

-- Drop app_role enum if possible
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    BEGIN
      DROP TYPE app_role CASCADE;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not drop app_role enum, skipping';
    END;
  END IF;
END $$;

-- ============================================
-- 3. Update Invoice RLS (use user_profiles)
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Admins can manage all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Owners can view their invoices" ON public.invoices;
DROP POLICY IF EXISTS "owner can select invoices" ON public.invoices;
DROP POLICY IF EXISTS "Owners can view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "CFIs can insert instruction invoices" ON public.invoices;
DROP POLICY IF EXISTS "Staff can view all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Staff can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can delete invoices" ON public.invoices;
DROP POLICY IF EXISTS "Staff can create invoices" ON public.invoices;

-- Create new policies using user_profiles.role

-- 1. Owners can view their own invoices
CREATE POLICY "Owners can view own invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- 2. Staff can view ALL invoices
CREATE POLICY "Staff can view all invoices"  
ON public.invoices
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'founder', 'ops')
  )
);

-- 3. Staff can update invoices
CREATE POLICY "Staff can update invoices"
ON public.invoices
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'founder', 'ops')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'founder', 'ops')
  )
);

-- 4. Staff can create invoices
CREATE POLICY "Staff can create invoices"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'founder', 'ops', 'cfi')
  )
);

-- 5. Admins can delete invoices
CREATE POLICY "Admins can delete invoices"
ON public.invoices
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'founder')
  )
);

COMMIT;
