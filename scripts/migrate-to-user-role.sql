-- Migrate from app_role to user_role as the standard enum
-- This script makes user_role the primary enum and removes app_role

-- ============================================
-- STEP 1: Check current state
-- ============================================
SELECT 
    table_name,
    column_name,
    udt_name as current_enum
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND udt_name IN ('app_role', 'user_role')
ORDER BY table_name, column_name;

-- ============================================
-- STEP 2: Migrate any columns using app_role to user_role
-- ============================================

-- Migrate user_profiles.role if it's using app_role
DO $$
DECLARE
  policy_record RECORD;
  policies_dropped TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check if the column exists and uses app_role
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'role'
    AND udt_name = 'app_role'
  ) THEN
    RAISE NOTICE 'Starting migration from app_role to user_role...';
    
    -- Step 1: Find and drop all policies that reference user_profiles.role
    FOR policy_record IN 
      SELECT 
        schemaname,
        tablename,
        policyname
      FROM pg_policies 
      WHERE schemaname = 'public'
    LOOP
      BEGIN
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
          policy_record.policyname, 
          policy_record.schemaname, 
          policy_record.tablename);
        policies_dropped := array_append(policies_dropped, 
          policy_record.tablename || '.' || policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %.%', policy_record.tablename, policy_record.policyname;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop policy %.%: %', 
          policy_record.tablename, policy_record.policyname, SQLERRM;
      END;
    END LOOP;
    
    -- Step 2: Drop the default value
    ALTER TABLE public.user_profiles 
    ALTER COLUMN role DROP DEFAULT;
    RAISE NOTICE 'Dropped default value';
    
    -- Step 3: Change the column type to user_role
    ALTER TABLE public.user_profiles 
    ALTER COLUMN role TYPE user_role 
    USING role::text::user_role;
    RAISE NOTICE 'Changed column type to user_role';
    
    -- Step 4: Re-add the default value
    ALTER TABLE public.user_profiles 
    ALTER COLUMN role SET DEFAULT 'owner'::user_role;
    RAISE NOTICE 'Re-added default value';
    
    RAISE NOTICE 'Successfully migrated user_profiles.role from app_role to user_role';
    RAISE NOTICE 'Dropped % policies - these need to be recreated!', array_length(policies_dropped, 1);
  ELSE
    RAISE NOTICE 'user_profiles.role already uses user_role or does not exist';
  END IF;
END $$;

-- Migrate any other tables using app_role
-- Add similar blocks for other tables if needed

-- ============================================
-- STEP 3: Verify no tables are using app_role anymore
-- ============================================
SELECT 
    CASE 
      WHEN count(*) = 0 THEN 'SUCCESS: No tables using app_role'
      ELSE 'WARNING: ' || count(*) || ' columns still using app_role'
    END as migration_status,
    string_agg(table_name || '.' || column_name, ', ') as remaining_columns
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND udt_name = 'app_role';

-- ============================================
-- STEP 4: Recreate all RLS policies with user_role
-- ============================================

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Aircraft policies
CREATE POLICY "Owners can view own aircraft" ON public.aircraft
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'ops', 'founder'))
  );

CREATE POLICY "Owners can update own aircraft" ON public.aircraft
  FOR UPDATE USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Admins can insert aircraft" ON public.aircraft
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update any aircraft" ON public.aircraft
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete aircraft" ON public.aircraft
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Service requests policies
CREATE POLICY "Aircraft owners and ops can view service requests" ON public.service_requests
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'ops', 'founder'))
  );

CREATE POLICY "Users can create own service requests" ON public.service_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins and ops can update service requests" ON public.service_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'ops', 'founder'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'ops', 'founder'))
  );

CREATE POLICY "Admins and ops can insert service requests" ON public.service_requests
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'ops', 'founder'))
  );

-- Maintenance policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'maintenance') THEN
    EXECUTE 'CREATE POLICY "Aircraft owners and ops can view maintenance" ON public.maintenance
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.aircraft WHERE id = aircraft_id AND owner_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN (''admin'', ''staff'', ''ops'', ''founder''))
      )';
    
    EXECUTE 'CREATE POLICY "Admins and ops can insert maintenance" ON public.maintenance
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN (''admin'', ''staff'', ''ops'', ''founder''))
      )';
    
    EXECUTE 'CREATE POLICY "Admins and ops can update maintenance" ON public.maintenance
      FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN (''admin'', ''staff'', ''ops'', ''founder''))
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN (''admin'', ''staff'', ''ops'', ''founder''))
      )';
    
    EXECUTE 'CREATE POLICY "Admins can delete maintenance" ON public.maintenance
      FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = ''admin'')
      )';
    
    RAISE NOTICE 'Created maintenance policies';
  ELSE
    RAISE NOTICE 'Skipped maintenance policies - table does not exist';
  END IF;
END $$;

-- Service tasks policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_tasks') THEN
    EXECUTE 'CREATE POLICY "Aircraft owners can view service tasks" ON public.service_tasks
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.aircraft WHERE id = aircraft_id AND owner_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN (''admin'', ''staff'', ''ops'', ''founder''))
      )';
    
    EXECUTE 'CREATE POLICY "Admins can insert service tasks" ON public.service_tasks
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN (''admin'', ''staff'', ''ops'', ''founder''))
      )';
    
    EXECUTE 'CREATE POLICY "Admins can update service tasks" ON public.service_tasks
      FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN (''admin'', ''staff'', ''ops'', ''founder''))
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN (''admin'', ''staff'', ''ops'', ''founder''))
      )';
    
    EXECUTE 'CREATE POLICY "Admins can delete service tasks" ON public.service_tasks
      FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = ''admin'')
      )';
    
    RAISE NOTICE 'Created service_tasks policies';
  ELSE
    RAISE NOTICE 'Skipped service_tasks policies - table does not exist';
  END IF;
END $$;

-- Memberships policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'memberships') THEN
    EXECUTE 'CREATE POLICY "Users can view own memberships" ON public.memberships
      FOR SELECT USING (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = ''admin'')
      )';
    
    RAISE NOTICE 'Created memberships policies';
  ELSE
    RAISE NOTICE 'Skipped memberships policies - table does not exist';
  END IF;
END $$;

-- Instructors policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instructors') THEN
    EXECUTE 'CREATE POLICY "Everyone can view active instructors" ON public.instructors FOR SELECT USING (active = true)';
  END IF;
END $$;

-- Pricing packages policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_packages') THEN
    EXECUTE 'CREATE POLICY "Everyone can view active packages" ON public.pricing_packages FOR SELECT USING (active = true)';
  END IF;
  
  RAISE NOTICE 'Recreated all RLS policies with user_role enum';
END $$;

-- ============================================
-- STEP 5: Handle remaining app_role dependencies
-- ============================================

-- Check for user_roles table and migrate it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles' 
    AND column_name = 'role'
    AND udt_name = 'app_role'
  ) THEN
    -- Drop the default if any
    ALTER TABLE public.user_roles 
    ALTER COLUMN role DROP DEFAULT;
    
    -- Change the column type to user_role
    ALTER TABLE public.user_roles 
    ALTER COLUMN role TYPE user_role 
    USING role::text::user_role;
    
    -- Re-add default if needed
    -- ALTER TABLE public.user_roles 
    -- ALTER COLUMN role SET DEFAULT 'owner'::user_role;
    
    RAISE NOTICE 'Migrated user_roles.role from app_role to user_role';
  END IF;
END $$;

-- Drop the has_role function that uses app_role
DROP FUNCTION IF EXISTS has_role(uuid, app_role);

-- Recreate has_role function with user_role
CREATE OR REPLACE FUNCTION has_role(user_id uuid, check_role user_role)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = user_id AND role = check_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check for any other dependencies
DO $$
DECLARE
  dep_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO dep_count
  FROM pg_depend d
  JOIN pg_type t ON d.refobjid = t.oid
  WHERE t.typname = 'app_role'
  AND d.deptype = 'n';
  
  IF dep_count > 0 THEN
    RAISE WARNING 'There are still % dependencies on app_role. You may need to use DROP TYPE app_role CASCADE;', dep_count;
  END IF;
END $$;

-- ============================================
-- STEP 6: Drop the app_role enum
-- ============================================
-- Try normal drop first
DROP TYPE IF EXISTS app_role;

-- If that fails due to dependencies, uncomment this:
-- DROP TYPE app_role CASCADE;

-- ============================================
-- STEP 7: Verify final state
-- ============================================
SELECT 
    typname as enum_name,
    string_agg(enumlabel, ', ' ORDER BY enumsortorder) as values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE typname IN ('user_role', 'app_role')
GROUP BY typname;

-- Should only show user_role with values: owner, staff, cfi, admin, ops, founder

COMMENT ON TYPE user_role IS 'User roles: owner (aircraft owner), staff (general staff), cfi (flight instructor), admin (administrator), ops (operations staff), founder (super-admin)';

