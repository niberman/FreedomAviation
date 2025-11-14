-- CLEANUP SCRIPT: Remove Unused Tables
-- ⚠️  WARNING: This will permanently delete tables and data
-- ⚠️  Run analyze_table_usage.sql FIRST to verify what's safe to remove
-- ⚠️  BACKUP your database before running this!

-- ============================================
-- TABLES LIKELY SAFE TO REMOVE
-- ============================================

-- Based on common usage patterns, these tables may be unused:
-- 1. user_roles - Redundant with user_profiles.role column
-- 2. settings - Generic settings, may be hardcoded
-- 3. support_tickets - May not be implemented yet
-- 4. pilot_currency - May not be in active use

-- ============================================
-- STEP 1: user_roles (redundant table)
-- ============================================

DO $$
DECLARE
  row_count INTEGER;
BEGIN
  -- Check if table exists and has data
  SELECT COUNT(*) INTO row_count FROM public.user_roles;
  
  IF row_count = 0 THEN
    RAISE NOTICE '✅ Dropping user_roles (0 rows, redundant with user_profiles.role)';
    DROP TABLE IF EXISTS public.user_roles CASCADE;
  ELSE
    RAISE NOTICE '⚠️  user_roles has % rows - skipping (review manually)', row_count;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE '⏭️  user_roles does not exist';
END $$;

-- ============================================
-- STEP 2: settings (generic settings)
-- ============================================

DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM public.settings;
  
  IF row_count <= 1 THEN
    RAISE NOTICE '⚠️  settings has % row(s) - check if in use', row_count;
    -- Uncomment to actually drop:
    -- DROP TABLE IF EXISTS public.settings CASCADE;
    RAISE NOTICE '   To drop: DROP TABLE public.settings CASCADE;';
  ELSE
    RAISE NOTICE '⚠️  settings has % rows - keeping', row_count;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE '⏭️  settings does not exist';
END $$;

-- ============================================
-- STEP 3: support_tickets (may not be implemented)
-- ============================================

DO $$
DECLARE
  row_count INTEGER;
  has_policies BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO row_count FROM public.support_tickets;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'support_tickets'
  ) INTO has_policies;
  
  IF row_count = 0 AND NOT has_policies THEN
    RAISE NOTICE '⚠️  support_tickets has 0 rows and no RLS policies';
    RAISE NOTICE '   Appears unused. To drop: DROP TABLE public.support_tickets CASCADE;';
    -- Uncomment to actually drop:
    -- DROP TABLE IF EXISTS public.support_tickets CASCADE;
  ELSE
    RAISE NOTICE '✅ support_tickets has data or policies - keeping';
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE '⏭️  support_tickets does not exist';
END $$;

-- ============================================
-- STEP 4: pilot_currency (may not be in use)
-- ============================================

DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM public.pilot_currency;
  
  IF row_count = 0 THEN
    RAISE NOTICE '⚠️  pilot_currency has 0 rows';
    RAISE NOTICE '   May be unused. To drop: DROP TABLE public.pilot_currency CASCADE;';
    -- Uncomment to actually drop:
    -- DROP TABLE IF EXISTS public.pilot_currency CASCADE;
  ELSE
    RAISE NOTICE '✅ pilot_currency has % rows - keeping', row_count;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE '⏭️  pilot_currency does not exist';
END $$;

-- ============================================
-- STEP 5: payment_methods (may be redundant with client_billing_profiles)
-- ============================================

DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM public.payment_methods;
  
  IF row_count = 0 THEN
    RAISE NOTICE '⚠️  payment_methods has 0 rows (may be redundant with client_billing_profiles)';
    RAISE NOTICE '   To drop: DROP TABLE public.payment_methods CASCADE;';
    -- Uncomment to actually drop:
    -- DROP TABLE IF EXISTS public.payment_methods CASCADE;
  ELSE
    RAISE NOTICE '✅ payment_methods has % rows - keeping', row_count;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE '⏭️  payment_methods does not exist';
END $$;

-- ============================================
-- STEP 6: notifications (check if implemented)
-- ============================================

DO $$
DECLARE
  row_count INTEGER;
  has_policies BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO row_count FROM public.notifications;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'notifications'
  ) INTO has_policies;
  
  IF row_count = 0 AND NOT has_policies THEN
    RAISE NOTICE '⚠️  notifications has 0 rows and no RLS policies';
    RAISE NOTICE '   May be unused. To drop: DROP TABLE public.notifications CASCADE;';
    -- Uncomment to actually drop:
    -- DROP TABLE IF EXISTS public.notifications CASCADE;
  ELSE
    RAISE NOTICE '✅ notifications appears to be in use - keeping';
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE '⏭️  notifications does not exist';
END $$;

-- ============================================
-- MANUAL REVIEW REQUIRED
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'CLEANUP ANALYSIS COMPLETE';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables to manually review:';
  RAISE NOTICE '  • membership_tiers - May be defined in code';
  RAISE NOTICE '  • pricing_snapshots - Historical data, may want to keep';
  RAISE NOTICE '  • onboarding_data - May contain signup state';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  To actually drop tables:';
  RAISE NOTICE '  1. Uncomment the DROP TABLE lines in this script';
  RAISE NOTICE '  2. OR run individual DROP commands after review';
  RAISE NOTICE '';
  RAISE NOTICE 'Safe to drop (if confirmed empty and unused):';
  RAISE NOTICE '  DROP TABLE IF EXISTS public.user_roles CASCADE;';
  RAISE NOTICE '  DROP TABLE IF EXISTS public.settings CASCADE;';
  RAISE NOTICE '  DROP TABLE IF EXISTS public.support_tickets CASCADE;';
  RAISE NOTICE '  DROP TABLE IF EXISTS public.pilot_currency CASCADE;';
  RAISE NOTICE '  DROP TABLE IF EXISTS public.payment_methods CASCADE;';
  RAISE NOTICE '  DROP TABLE IF EXISTS public.notifications CASCADE;';
  RAISE NOTICE '================================================';
END $$;

-- ============================================
-- VERIFY REMAINING TABLES
-- ============================================

SELECT 
  'Remaining tables after cleanup:' as info;

SELECT 
  table_name,
  (SELECT n_live_tup FROM pg_stat_user_tables WHERE schemaname = 'public' AND relname = t.table_name) as rows
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;



