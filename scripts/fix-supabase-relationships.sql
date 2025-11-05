-- Fix Supabase Foreign Key Relationships for Nested Queries
-- This script ensures all foreign key constraints are properly named and discoverable by PostgREST
-- Run this in Supabase SQL Editor
-- 
-- IMPORTANT: After running this script, refresh Supabase's schema cache:
-- 1. Go to Supabase Dashboard > Settings > API
-- 2. Click "Reload Schema" or wait a few minutes for auto-refresh
-- 3. The nested queries should then work properly

-- ============================================================================
-- INVOICES TABLE RELATIONSHIPS
-- ============================================================================

-- Drop and recreate invoices.owner_id foreign key with explicit name
DO $$
DECLARE
  constraint_name TEXT;
  column_exists BOOLEAN;
BEGIN
  -- Check if column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invoices' 
    AND column_name = 'owner_id'
  ) INTO column_exists;
  
  IF column_exists THEN
    -- Find existing constraint
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'invoices'
      AND kcu.column_name = 'owner_id'
      AND tc.constraint_type = 'FOREIGN KEY';
    
    -- Drop if exists
    IF constraint_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_name);
    END IF;
    
    -- Recreate with explicit name
    ALTER TABLE public.invoices
    ADD CONSTRAINT invoices_owner_id_fkey 
    FOREIGN KEY (owner_id) 
    REFERENCES public.user_profiles(id) 
    ON DELETE RESTRICT;
  ELSE
    RAISE NOTICE 'Column owner_id does not exist in invoices table, skipping foreign key creation';
  END IF;
END $$;

-- Drop and recreate invoices.aircraft_id foreign key with explicit name
DO $$
DECLARE
  constraint_name TEXT;
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invoices' 
    AND column_name = 'aircraft_id'
  ) INTO column_exists;
  
  IF column_exists THEN
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'invoices'
      AND kcu.column_name = 'aircraft_id'
      AND tc.constraint_type = 'FOREIGN KEY';
    
    IF constraint_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_name);
    END IF;
    
    ALTER TABLE public.invoices
    ADD CONSTRAINT invoices_aircraft_id_fkey 
    FOREIGN KEY (aircraft_id) 
    REFERENCES public.aircraft(id) 
    ON DELETE RESTRICT;
  ELSE
    RAISE NOTICE 'Column aircraft_id does not exist in invoices table, skipping foreign key creation';
  END IF;
END $$;

-- Drop and recreate invoices.created_by_cfi_id foreign key with explicit name
DO $$
DECLARE
  constraint_name TEXT;
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invoices' 
    AND column_name = 'created_by_cfi_id'
  ) INTO column_exists;
  
  IF column_exists THEN
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'invoices'
      AND kcu.column_name = 'created_by_cfi_id'
      AND tc.constraint_type = 'FOREIGN KEY';
    
    IF constraint_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_name);
    END IF;
    
    ALTER TABLE public.invoices
    ADD CONSTRAINT invoices_created_by_cfi_id_fkey 
    FOREIGN KEY (created_by_cfi_id) 
    REFERENCES auth.users(id) 
    ON DELETE SET NULL;
  ELSE
    RAISE NOTICE 'Column created_by_cfi_id does not exist in invoices table, skipping foreign key creation';
  END IF;
END $$;

-- ============================================================================
-- INVOICE_LINES TABLE RELATIONSHIPS
-- ============================================================================

-- Drop and recreate invoice_lines.invoice_id foreign key with explicit name
DO $$
DECLARE
  constraint_name TEXT;
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invoice_lines' 
    AND column_name = 'invoice_id'
  ) INTO column_exists;
  
  IF column_exists THEN
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'invoice_lines'
      AND kcu.column_name = 'invoice_id'
      AND tc.constraint_type = 'FOREIGN KEY';
    
    IF constraint_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.invoice_lines DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_name);
    END IF;
    
    ALTER TABLE public.invoice_lines
    ADD CONSTRAINT invoice_lines_invoice_id_fkey 
    FOREIGN KEY (invoice_id) 
    REFERENCES public.invoices(id) 
    ON DELETE CASCADE;
  ELSE
    RAISE NOTICE 'Column invoice_id does not exist in invoice_lines table, skipping foreign key creation';
  END IF;
END $$;

-- ============================================================================
-- SERVICE_REQUESTS TABLE RELATIONSHIPS
-- ============================================================================

-- Drop and recreate service_requests.user_id foreign key with explicit name
DO $$
DECLARE
  constraint_name TEXT;
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'service_requests' 
    AND column_name = 'user_id'
  ) INTO column_exists;
  
  IF column_exists THEN
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'service_requests'
      AND kcu.column_name = 'user_id'
      AND tc.constraint_type = 'FOREIGN KEY';
    
    IF constraint_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_name);
    END IF;
    
    ALTER TABLE public.service_requests
    ADD CONSTRAINT service_requests_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.user_profiles(id) 
    ON DELETE RESTRICT;
  ELSE
    RAISE NOTICE 'Column user_id does not exist in service_requests table, skipping foreign key creation';
  END IF;
END $$;

-- Drop and recreate service_requests.aircraft_id foreign key with explicit name
DO $$
DECLARE
  constraint_name TEXT;
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'service_requests' 
    AND column_name = 'aircraft_id'
  ) INTO column_exists;
  
  IF column_exists THEN
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'service_requests'
      AND kcu.column_name = 'aircraft_id'
      AND tc.constraint_type = 'FOREIGN KEY';
    
    IF constraint_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_name);
    END IF;
    
    ALTER TABLE public.service_requests
    ADD CONSTRAINT service_requests_aircraft_id_fkey 
    FOREIGN KEY (aircraft_id) 
    REFERENCES public.aircraft(id) 
    ON DELETE RESTRICT;
  ELSE
    RAISE NOTICE 'Column aircraft_id does not exist in service_requests table, skipping foreign key creation';
  END IF;
END $$;

-- Drop and recreate service_requests.assigned_to foreign key with explicit name
-- Only if the column exists
DO $$
DECLARE
  constraint_name TEXT;
  column_exists BOOLEAN;
BEGIN
  -- Check if column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'service_requests' 
    AND column_name = 'assigned_to'
  ) INTO column_exists;
  
  IF column_exists THEN
    -- Find existing constraint
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'service_requests'
      AND kcu.column_name = 'assigned_to'
      AND tc.constraint_type = 'FOREIGN KEY';
    
    -- Drop if exists
    IF constraint_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_name);
    END IF;
    
    -- Recreate with explicit name
    ALTER TABLE public.service_requests
    ADD CONSTRAINT service_requests_assigned_to_fkey 
    FOREIGN KEY (assigned_to) 
    REFERENCES public.user_profiles(id) 
    ON DELETE SET NULL;
  ELSE
    RAISE NOTICE 'Column assigned_to does not exist in service_requests table, skipping foreign key creation';
  END IF;
END $$;

-- ============================================================================
-- AIRCRAFT TABLE RELATIONSHIPS
-- ============================================================================

-- Drop and recreate aircraft.owner_id foreign key with explicit name
DO $$
DECLARE
  constraint_name TEXT;
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'aircraft' 
    AND column_name = 'owner_id'
  ) INTO column_exists;
  
  IF column_exists THEN
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'aircraft'
      AND kcu.column_name = 'owner_id'
      AND tc.constraint_type = 'FOREIGN KEY';
    
    IF constraint_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.aircraft DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_name);
    END IF;
    
    ALTER TABLE public.aircraft
    ADD CONSTRAINT aircraft_owner_id_fkey 
    FOREIGN KEY (owner_id) 
    REFERENCES public.user_profiles(id) 
    ON DELETE SET NULL;
  ELSE
    RAISE NOTICE 'Column owner_id does not exist in aircraft table, skipping foreign key creation';
  END IF;
END $$;

-- ============================================================================
-- VERIFY CONSTRAINTS WERE CREATED
-- ============================================================================

-- Display all foreign key constraints we just created
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('invoices', 'invoice_lines', 'service_requests', 'aircraft')
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- NOTE: After running this script, you may need to refresh Supabase's schema cache
-- This can be done by:
-- 1. Going to Supabase Dashboard > Settings > API
-- 2. Clicking "Refresh Schema" or "Reload Schema"
-- 3. Or waiting a few minutes for it to auto-refresh
-- ============================================================================

