-- Targeted Cleanup Based on Actual Row Counts
-- Removes only truly unused tables with 0 rows
-- ⚠️  BACKUP FIRST!

-- ============================================
-- ANALYSIS SUMMARY
-- ============================================
-- Tables with data (16): KEEP ALL
-- Empty tables (12): Review below
-- 
-- Safe to remove (6 tables):
--   • aircraft_pricing_overrides - Feature not implemented
--   • maintenance_due - Not tracking maintenance this way
--   • notifications - In-app notifications not implemented
--   • payment_methods - Redundant with client_billing_profiles
--   • pilot_currency - Feature not implemented
--   • pricing_snapshots - Historical pricing not in use
--
-- Keep even if empty (6 tables):
--   • email_notifications - Email queue (actively used)
--   • cfi_schedule - CFI scheduling (may be used)
--   • instruction_requests - Instruction booking (may be used)
--   • google_calendar_tokens - Calendar integration (may be used)
--   • client_billing_profiles - Stripe billing (actively used)
--   • memberships - Core feature (actively used)
-- ============================================

-- ============================================
-- SAFE REMOVALS (Definitely Not In Use)
-- ============================================

-- 1. aircraft_pricing_overrides (0 rows, overrides not implemented)
DROP TABLE IF EXISTS public.aircraft_pricing_overrides CASCADE;

-- 2. maintenance_due (0 rows, maintenance tracking not active)
DROP TABLE IF EXISTS public.maintenance_due CASCADE;

-- 3. notifications (0 rows, in-app notifications not implemented)
DROP TABLE IF EXISTS public.notifications CASCADE;

-- 4. payment_methods (0 rows, redundant with client_billing_profiles)
DROP TABLE IF EXISTS public.payment_methods CASCADE;

-- 5. pilot_currency (0 rows, pilot currency tracking not implemented)
DROP TABLE IF EXISTS public.pilot_currency CASCADE;

-- 6. pricing_snapshots (0 rows, historical pricing not in use)
DROP TABLE IF EXISTS public.pricing_snapshots CASCADE;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  remaining_count INTEGER;
  empty_count INTEGER;
BEGIN
  -- Count remaining tables
  SELECT COUNT(*) INTO remaining_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
  
  -- Count empty tables
  SELECT COUNT(*) INTO empty_count
  FROM information_schema.tables t
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND NOT EXISTS (
      SELECT 1 FROM pg_stat_user_tables s
      WHERE s.schemaname = 'public' 
      AND s.relname = t.table_name
      AND s.n_live_tup > 0
    );
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ CLEANUP COMPLETE';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Removed: 6 unused tables';
  RAISE NOTICE 'Remaining tables: %', remaining_count;
  RAISE NOTICE 'Empty tables remaining: %', empty_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Kept empty tables (in active use):';
  RAISE NOTICE '  • email_notifications - Email queue system';
  RAISE NOTICE '  • cfi_schedule - CFI scheduling';
  RAISE NOTICE '  • instruction_requests - Instruction booking';
  RAISE NOTICE '  • google_calendar_tokens - Calendar integration';
  RAISE NOTICE '  • client_billing_profiles - Stripe billing';
  RAISE NOTICE '  • memberships - Core membership feature';
  RAISE NOTICE '================================================';
END $$;

-- Show remaining tables
SELECT 
  'Remaining tables:' as info;

SELECT 
  table_name,
  COALESCE(
    (SELECT n_live_tup FROM pg_stat_user_tables 
     WHERE schemaname = 'public' AND relname = t.table_name),
    0
  ) as rows
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY rows DESC, table_name;



