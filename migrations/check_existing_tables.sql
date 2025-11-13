-- Diagnostic Script: Check which tables exist in your database
-- Run this FIRST before running the founder update migration

-- ============================================
-- CHECK TABLES
-- ============================================

SELECT 
  'Tables in your database:' as info;

SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('user_profiles', 'aircraft', 'service_requests', 'invoices') THEN '🔥 Core table'
    WHEN table_name IN ('maintenance', 'consumable_events', 'service_tasks') THEN '⚙️  Service table'
    WHEN table_name IN ('memberships', 'invoice_lines') THEN '💰 Financial table'
    ELSE '📋 Other table'
  END as category
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================
-- CHECK WHICH TABLES NEED FOUNDER UPDATE
-- ============================================

SELECT 
  '---' as separator;

SELECT 
  'Tables that will be updated by migration:' as info;

SELECT 
  t.target_table as table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = t.target_table
    ) THEN '✅ Exists - will be updated'
    ELSE '❌ Missing - will be skipped'
  END as status
FROM (
  VALUES 
    ('user_profiles'),
    ('aircraft'),
    ('memberships'),
    ('maintenance'),
    ('consumable_events'),
    ('service_requests'),
    ('service_tasks'),
    ('invoices'),
    ('invoice_lines')
) AS t(target_table);

-- ============================================
-- CHECK EXISTING POLICIES
-- ============================================

SELECT 
  '---' as separator;

SELECT 
  'Current RLS policies that reference admin role:' as info;

SELECT 
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%founder%' THEN '✅ Already includes founder'
    WHEN qual LIKE '%admin%' AND qual NOT LIKE '%founder%' THEN '⚠️  Needs founder added'
    ELSE '➖ N/A'
  END as founder_status,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public'
  AND (qual LIKE '%admin%' OR qual LIKE '%founder%')
  AND tablename IN ('user_profiles', 'aircraft', 'service_requests', 'invoices', 
                    'memberships', 'maintenance', 'consumable_events', 'service_tasks', 'invoice_lines')
ORDER BY tablename, policyname;

-- ============================================
-- CHECK USER_ROLE ENUM
-- ============================================

SELECT 
  '---' as separator;

SELECT 
  'Available roles in user_role enum:' as info;

SELECT 
  enumlabel as role,
  CASE 
    WHEN enumlabel = 'founder' THEN '⭐ SUPERUSER'
    WHEN enumlabel = 'admin' THEN '🔧 Admin'
    WHEN enumlabel IN ('cfi', 'ops', 'staff') THEN '👔 Staff'
    WHEN enumlabel = 'owner' THEN '✈️  Owner'
    ELSE '❓ Other'
  END as description
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY 
  CASE enumlabel
    WHEN 'founder' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'cfi' THEN 3
    WHEN 'ops' THEN 4
    WHEN 'staff' THEN 5
    WHEN 'owner' THEN 6
    ELSE 7
  END;

-- ============================================
-- CHECK FUNCTIONS
-- ============================================

SELECT 
  '---' as separator;

SELECT 
  'RPC functions that need updating:' as info;

SELECT 
  proname as function_name,
  CASE 
    WHEN proname = 'create_instruction_invoice' THEN '✅ Will be updated'
    WHEN proname = 'finalize_invoice' THEN '✅ Will be updated'
    ELSE '➖ Not affected'
  END as update_status
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND proname IN ('create_instruction_invoice', 'finalize_invoice', 'get_ops_emails', 'get_cfi_emails')
ORDER BY proname;

-- ============================================
-- SUMMARY
-- ============================================

DO $$
DECLARE
  total_tables INTEGER;
  existing_tables INTEGER;
  policies_needing_update INTEGER;
BEGIN
  -- Count total target tables
  SELECT COUNT(*) INTO existing_tables
  FROM information_schema.tables 
  WHERE table_schema = 'public'
    AND table_name IN ('user_profiles', 'aircraft', 'memberships', 'maintenance', 
                       'consumable_events', 'service_requests', 'service_tasks', 
                       'invoices', 'invoice_lines');
  
  -- Count policies that need updating
  SELECT COUNT(*) INTO policies_needing_update
  FROM pg_policies 
  WHERE schemaname = 'public'
    AND qual LIKE '%admin%' 
    AND qual NOT LIKE '%founder%'
    AND tablename IN ('user_profiles', 'aircraft', 'service_requests', 'invoices', 
                      'memberships', 'maintenance', 'consumable_events', 'service_tasks', 'invoice_lines');
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '📊 DIAGNOSTIC SUMMARY';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Tables that exist and will be updated: %', existing_tables;
  RAISE NOTICE 'Policies that need founder added: %', policies_needing_update;
  RAISE NOTICE '';
  
  IF existing_tables = 0 THEN
    RAISE NOTICE '❌ No target tables found!';
    RAISE NOTICE '   You may need to run the main schema setup first:';
    RAISE NOTICE '   → supabase-schema.sql';
  ELSIF policies_needing_update = 0 THEN
    RAISE NOTICE '✅ All policies already include founder!';
    RAISE NOTICE '   No migration needed.';
  ELSE
    RAISE NOTICE '✅ Ready to run migration!';
    RAISE NOTICE '   → Use: add_founder_to_all_policies_SAFE.sql';
  END IF;
  
  RAISE NOTICE '================================================';
END $$;

