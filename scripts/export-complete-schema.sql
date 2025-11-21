--===================================================================
-- COMPLETE SCHEMA EXPORT FOR SUPABASE
-- Run this entire script in Supabase SQL Editor
-- Copy all the results and save them to update supabase-schema.sql
--===================================================================

-- ===================================================================
-- PART 1: ENUM TYPES
-- ===================================================================
DO $$
DECLARE
  r RECORD;
  enum_values TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '-- ===================================================================';
  RAISE NOTICE '-- ENUM TYPES';
  RAISE NOTICE '-- ===================================================================';
  RAISE NOTICE '';
  
  FOR r IN (
    SELECT 
      t.typname as enum_name,
      string_agg('''' || e.enumlabel || '''', ', ' ORDER BY e.enumsortorder) as values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname
    ORDER BY t.typname
  ) LOOP
    RAISE NOTICE 'CREATE TYPE % AS ENUM (%);', r.enum_name, r.values;
  END LOOP;
END $$;

-- ===================================================================
-- PART 2: TABLE DEFINITIONS
-- ===================================================================
DO $$
DECLARE
  table_rec RECORD;
  col_rec RECORD;
  col_def TEXT;
  table_sql TEXT;
  first_col BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '-- ===================================================================';
  RAISE NOTICE '-- TABLES';
  RAISE NOTICE '-- ===================================================================';
  RAISE NOTICE '';
  
  FOR table_rec IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  ) LOOP
    table_sql := 'CREATE TABLE public.' || table_rec.tablename || ' (';
    first_col := true;
    
    FOR col_rec IN (
      SELECT 
        column_name,
        CASE 
          WHEN data_type = 'USER-DEFINED' THEN udt_name
          WHEN data_type = 'character varying' THEN 'TEXT'
          WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
          WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
          WHEN data_type = 'numeric' THEN 
            'DECIMAL(' || numeric_precision || ', ' || numeric_scale || ')'
          WHEN data_type = 'integer' THEN 'INTEGER'
          WHEN data_type = 'bigint' THEN 'BIGINT'
          WHEN data_type = 'boolean' THEN 'BOOLEAN'
          WHEN data_type = 'text' THEN 'TEXT'
          WHEN data_type = 'uuid' THEN 'UUID'
          WHEN data_type = 'date' THEN 'DATE'
          WHEN data_type = 'time without time zone' THEN 'TIME'
          WHEN data_type = 'jsonb' THEN 'JSONB'
          WHEN data_type = 'ARRAY' THEN udt_name
          ELSE UPPER(data_type)
        END as data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = table_rec.tablename
      ORDER BY ordinal_position
    ) LOOP
      IF NOT first_col THEN
        table_sql := table_sql || ',';
      END IF;
      first_col := false;
      
      col_def := '  ' || col_rec.column_name || ' ' || col_rec.data_type;
      
      IF col_rec.is_nullable = 'NO' THEN
        col_def := col_def || ' NOT NULL';
      END IF;
      
      IF col_rec.column_default IS NOT NULL THEN
        col_def := col_def || ' DEFAULT ' || col_rec.column_default;
      END IF;
      
      table_sql := table_sql || E'\n' || col_def;
    END LOOP;
    
    table_sql := table_sql || E'\n);';
    
    RAISE NOTICE '';
    RAISE NOTICE '%', table_sql;
  END LOOP;
END $$;

-- ===================================================================
-- PART 3: COMMENTS
-- ===================================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '-- ===================================================================';
  RAISE NOTICE '-- COLUMN COMMENTS';
  RAISE NOTICE '-- ===================================================================';
  RAISE NOTICE '';
  
  FOR r IN (
    SELECT 
      c.table_name,
      c.column_name,
      pgd.description
    FROM information_schema.columns c
    JOIN pg_catalog.pg_statio_all_tables st 
      ON c.table_name = st.relname AND st.schemaname = 'public'
    JOIN pg_catalog.pg_description pgd 
      ON pgd.objoid = st.relid AND pgd.objsubid = c.ordinal_position
    WHERE c.table_schema = 'public'
    ORDER BY c.table_name, c.ordinal_position
  ) LOOP
    RAISE NOTICE 'COMMENT ON COLUMN public.%.% IS ''%'';', 
      r.table_name, r.column_name, r.description;
  END LOOP;
END $$;

-- ===================================================================
-- PART 4: INDEXES
-- ===================================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '-- ===================================================================';
  RAISE NOTICE '-- INDEXES';
  RAISE NOTICE '-- ===================================================================';
  RAISE NOTICE '';
  
  FOR r IN (
    SELECT indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname NOT LIKE '%_pkey'
    ORDER BY tablename, indexname
  ) LOOP
    RAISE NOTICE '%;', r.indexdef;
  END LOOP;
END $$;

-- ===================================================================
-- PART 5: RLS POLICIES
-- ===================================================================
DO $$
DECLARE
  r RECORD;
  tbl RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '-- ===================================================================';
  RAISE NOTICE '-- ROW LEVEL SECURITY';
  RAISE NOTICE '-- ===================================================================';
  RAISE NOTICE '';
  
  -- First, list tables with RLS enabled
  FOR tbl IN (
    SELECT tablename
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public'
      AND c.relrowsecurity = true
    ORDER BY tablename
  ) LOOP
    RAISE NOTICE 'ALTER TABLE public.% ENABLE ROW LEVEL SECURITY;', tbl.tablename;
  END LOOP;
  
  RAISE NOTICE '';
  
  -- Then list all policies
  FOR r IN (
    SELECT
      tablename,
      policyname,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  ) LOOP
    RAISE NOTICE 'CREATE POLICY "%" ON public.%', r.policyname, r.tablename;
    RAISE NOTICE '  FOR %%', UPPER(r.cmd);
    
    IF r.qual IS NOT NULL THEN
      RAISE NOTICE '  USING (%%);', r.qual;
    END IF;
    
    IF r.with_check IS NOT NULL THEN
      RAISE NOTICE '  WITH CHECK (%%);', r.with_check;
    END IF;
    
    IF r.qual IS NULL AND r.with_check IS NOT NULL THEN
      RAISE NOTICE '  WITH CHECK (%%);', r.with_check;
    ELSIF r.qual IS NOT NULL AND r.with_check IS NULL THEN
      -- Already printed USING above
      RAISE NOTICE '';
    ELSIF r.qual IS NOT NULL AND r.with_check IS NOT NULL THEN
      -- Need to reformat
      RAISE NOTICE '';
    ELSE
      RAISE NOTICE ';';
    END IF;
    
    RAISE NOTICE '';
  END LOOP;
END $$;

-- ===================================================================
-- PART 6: FUNCTIONS
-- ===================================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '-- ===================================================================';
  RAISE NOTICE '-- FUNCTIONS';
  RAISE NOTICE '-- ===================================================================';
  RAISE NOTICE '';
  
  FOR r IN (
    SELECT pg_get_functiondef(p.oid) as funcdef
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND p.proname NOT LIKE 'pg_%'
    ORDER BY p.proname
  ) LOOP
    RAISE NOTICE '%', r.funcdef;
    RAISE NOTICE '';
  END LOOP;
END $$;

-- ===================================================================
-- PART 7: TRIGGERS
-- ===================================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '-- ===================================================================';
  RAISE NOTICE '-- TRIGGERS';
  RAISE NOTICE '-- ===================================================================';
  RAISE NOTICE '';
  
  FOR r IN (
    SELECT
      c.relname as table_name,
      t.tgname as trigger_name,
      p.proname as function_name,
      CASE 
        WHEN t.tgtype & 2 = 2 THEN 'BEFORE'
        WHEN t.tgtype & 64 = 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
      END as timing,
      CASE
        WHEN t.tgtype & 4 = 4 THEN 'INSERT'
        WHEN t.tgtype & 8 = 8 THEN 'DELETE'
        WHEN t.tgtype & 16 = 16 THEN 'UPDATE'
        ELSE 'UNKNOWN'
      END as event
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE n.nspname = 'public'
      AND NOT t.tgisinternal
    ORDER BY c.relname, t.tgname
  ) LOOP
    RAISE NOTICE 'CREATE TRIGGER % % % ON public.%', 
      r.trigger_name, r.timing, r.event, r.table_name;
    RAISE NOTICE '  FOR EACH ROW EXECUTE FUNCTION %();', r.function_name;
    RAISE NOTICE '';
  END LOOP;
END $$;

-- ===================================================================
-- PART 8: GRANTS
-- ===================================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '-- ===================================================================';
  RAISE NOTICE '-- GRANTS';
  RAISE NOTICE '-- ===================================================================';
  RAISE NOTICE '';
  
  FOR r IN (
    SELECT 
      'GRANT EXECUTE ON FUNCTION public.' || p.proname || ' TO authenticated;' as grant_stmt
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND p.proname NOT LIKE 'pg_%'
    ORDER BY p.proname
  ) LOOP
    RAISE NOTICE '%', r.grant_stmt;
  END LOOP;
END $$;

RAISE NOTICE '';
RAISE NOTICE '-- ===================================================================';
RAISE NOTICE '-- SCHEMA EXPORT COMPLETE';
RAISE NOTICE '-- ===================================================================';


