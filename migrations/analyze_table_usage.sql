-- Comprehensive Table Usage Analysis
-- This script identifies which tables are actually being used
-- Run this BEFORE cleanup to understand what's safe to remove

-- ============================================
-- PART 1: Check row counts
-- ============================================

SELECT '========== TABLE ROW COUNTS ==========' as section;

SELECT 
  schemaname as schema,
  tablename as table_name,
  (
    SELECT COUNT(*) 
    FROM information_schema.tables t 
    WHERE t.table_schema = 'public' 
    AND t.table_name = pg_tables.tablename
  ) as exists_check,
  -- Get approximate row count
  (
    SELECT n_live_tup 
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public' 
    AND relname = pg_tables.tablename
  ) as approx_rows
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY approx_rows DESC NULLS LAST;

-- ============================================
-- PART 2: Check foreign key dependencies
-- ============================================

SELECT '========== FOREIGN KEY DEPENDENCIES ==========' as section;

SELECT 
  tc.table_name,
  COUNT(DISTINCT tc.constraint_name) as fk_count,
  STRING_AGG(DISTINCT kcu.column_name || ' → ' || ccu.table_name, ', ') as dependencies
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
GROUP BY tc.table_name
ORDER BY fk_count DESC;

-- ============================================
-- PART 3: Check RLS policies
-- ============================================

SELECT '========== TABLES WITH RLS POLICIES ==========' as section;

SELECT 
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;

-- ============================================
-- PART 4: Check tables referenced by functions
-- ============================================

SELECT '========== TABLES REFERENCED IN FUNCTIONS ==========' as section;

SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition_contains_tables
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname NOT LIKE 'pg_%'
ORDER BY p.proname;

-- ============================================
-- PART 5: Identify potentially unused tables
-- ============================================

SELECT '========== POTENTIALLY UNUSED TABLES ==========' as section;

WITH table_stats AS (
  SELECT 
    t.table_name,
    COALESCE(s.n_live_tup, 0) as row_count,
    (
      SELECT COUNT(*) 
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = t.table_name
    ) as policy_count,
    (
      SELECT COUNT(*) 
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public' 
      AND tc.table_name = t.table_name
      AND tc.constraint_type = 'FOREIGN KEY'
    ) as fk_count
  FROM information_schema.tables t
  LEFT JOIN pg_stat_user_tables s 
    ON s.schemaname = 'public' 
    AND s.relname = t.table_name
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
)
SELECT 
  table_name,
  row_count,
  policy_count,
  fk_count,
  CASE 
    WHEN row_count = 0 AND policy_count = 0 AND fk_count = 0 THEN '🗑️  LIKELY UNUSED - Safe to drop'
    WHEN row_count = 0 AND policy_count = 0 THEN '⚠️  No data/policies but has FKs - Review'
    WHEN row_count = 0 THEN '⚠️  No data but has policies - May be needed'
    ELSE '✅ IN USE'
  END as status
FROM table_stats
ORDER BY 
  CASE 
    WHEN row_count = 0 AND policy_count = 0 AND fk_count = 0 THEN 1
    WHEN row_count = 0 AND policy_count = 0 THEN 2
    WHEN row_count = 0 THEN 3
    ELSE 4
  END,
  table_name;

-- ============================================
-- PART 6: Specific table analysis
-- ============================================

SELECT '========== DETAILED TABLE ANALYSIS ==========' as section;

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  LOOP
    RAISE NOTICE '---';
    RAISE NOTICE 'Table: %', rec.table_name;
    
    -- Check row count
    EXECUTE format('SELECT COUNT(*) FROM public.%I', rec.table_name) INTO rec;
    RAISE NOTICE '  Rows: %', rec.count;
  END LOOP;
END $$;

-- ============================================
-- SUMMARY & RECOMMENDATIONS
-- ============================================

SELECT '========== SUMMARY ==========' as section;

DO $$
DECLARE
  total_tables INTEGER;
  empty_tables INTEGER;
  tables_no_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_tables
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';
  
  SELECT COUNT(*) INTO empty_tables
  FROM information_schema.tables t
  LEFT JOIN pg_stat_user_tables s 
    ON s.schemaname = 'public' 
    AND s.relname = t.table_name
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND COALESCE(s.n_live_tup, 0) = 0;
  
  SELECT COUNT(*) INTO tables_no_policies
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = t.table_name
    );
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'DATABASE USAGE SUMMARY';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Total tables: %', total_tables;
  RAISE NOTICE 'Empty tables: %', empty_tables;
  RAISE NOTICE 'Tables without RLS: %', tables_no_policies;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Tables to review for removal:';
  RAISE NOTICE '  - Empty tables with no policies';
  RAISE NOTICE '  - Tables with no foreign key dependencies';
  RAISE NOTICE '  - Tables not referenced in application code';
  RAISE NOTICE '================================================';
END $$;



