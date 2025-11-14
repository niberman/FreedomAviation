-- Quick Cleanup Script
-- Removes confirmed unused/redundant tables
-- ⚠️  BACKUP YOUR DATABASE FIRST!

-- ============================================
-- STEP 1: user_roles (Definitely Redundant)
-- ============================================
-- This table duplicates user_profiles.role column
-- Safe to drop if it has 0 rows or is not referenced

DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM public.user_roles;
  
  RAISE NOTICE 'user_roles has % rows', row_count;
  
  IF row_count = 0 THEN
    RAISE NOTICE '✅ Dropping user_roles (redundant with user_profiles.role)';
    DROP TABLE public.user_roles CASCADE;
  ELSE
    RAISE NOTICE '⚠️  user_roles has data - NOT dropping (review manually)';
  END IF;
END $$;

-- ============================================
-- STEP 2: Check Other Tables
-- ============================================

DO $$
DECLARE
  settings_count INTEGER;
  tickets_count INTEGER;
  currency_count INTEGER;
  payment_count INTEGER;
  notif_count INTEGER;
BEGIN
  -- Check each table
  SELECT COUNT(*) INTO settings_count FROM public.settings;
  SELECT COUNT(*) INTO tickets_count FROM public.support_tickets;
  SELECT COUNT(*) INTO currency_count FROM public.pilot_currency;
  SELECT COUNT(*) INTO payment_count FROM public.payment_methods;
  SELECT COUNT(*) INTO notif_count FROM public.notifications;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TABLES TO REVIEW FOR REMOVAL';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'settings: % rows', settings_count;
  RAISE NOTICE 'support_tickets: % rows', tickets_count;
  RAISE NOTICE 'pilot_currency: % rows', currency_count;
  RAISE NOTICE 'payment_methods: % rows', payment_count;
  RAISE NOTICE 'notifications: % rows', notif_count;
  RAISE NOTICE '';
  
  -- Only show DROP commands for empty tables
  IF settings_count = 0 THEN
    RAISE NOTICE '🗑️  To remove settings: DROP TABLE public.settings CASCADE;';
  END IF;
  
  IF tickets_count = 0 THEN
    RAISE NOTICE '🗑️  To remove support_tickets: DROP TABLE public.support_tickets CASCADE;';
  END IF;
  
  IF currency_count = 0 THEN
    RAISE NOTICE '🗑️  To remove pilot_currency: DROP TABLE public.pilot_currency CASCADE;';
  END IF;
  
  IF payment_count = 0 THEN
    RAISE NOTICE '🗑️  To remove payment_methods: DROP TABLE public.payment_methods CASCADE;';
  END IF;
  
  IF notif_count = 0 THEN
    RAISE NOTICE '🗑️  To remove notifications: DROP TABLE public.notifications CASCADE;';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- MANUAL CLEANUP COMMANDS
-- ============================================
-- Uncomment these lines to actually drop tables:

-- DROP TABLE IF EXISTS public.settings CASCADE;
-- DROP TABLE IF EXISTS public.support_tickets CASCADE;
-- DROP TABLE IF EXISTS public.pilot_currency CASCADE;
-- DROP TABLE IF EXISTS public.payment_methods CASCADE;
-- DROP TABLE IF EXISTS public.notifications CASCADE;

-- ============================================
-- VERIFY CLEANUP
-- ============================================

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Cleanup complete!';
  RAISE NOTICE 'Remaining tables: %', table_count;
END $$;




