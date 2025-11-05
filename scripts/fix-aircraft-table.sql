-- Freedom Aviation - Fix Aircraft Table Schema
-- This script checks and adds missing columns to the aircraft table
-- Run this in Supabase SQL Editor if you're getting "column does not exist" errors
--
-- ============================================================================
-- STEP 1: Check current aircraft table structure
-- ============================================================================

-- See what columns currently exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'aircraft'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 2: Add missing columns (if they don't exist)
-- ============================================================================

-- Add 'make' column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'aircraft' 
      AND column_name = 'make'
  ) THEN
    ALTER TABLE public.aircraft ADD COLUMN make TEXT;
    RAISE NOTICE 'Added make column to aircraft table';
  ELSE
    RAISE NOTICE 'make column already exists';
  END IF;
END $$;

-- Add 'model' column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'aircraft' 
      AND column_name = 'model'
  ) THEN
    ALTER TABLE public.aircraft ADD COLUMN model TEXT;
    RAISE NOTICE 'Added model column to aircraft table';
  ELSE
    RAISE NOTICE 'model column already exists';
  END IF;
END $$;

-- Add 'year' column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'aircraft' 
      AND column_name = 'year'
  ) THEN
    ALTER TABLE public.aircraft ADD COLUMN year INTEGER;
    RAISE NOTICE 'Added year column to aircraft table';
  ELSE
    RAISE NOTICE 'year column already exists';
  END IF;
END $$;

-- Add 'class' column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'aircraft' 
      AND column_name = 'class'
  ) THEN
    ALTER TABLE public.aircraft ADD COLUMN class TEXT;
    RAISE NOTICE 'Added class column to aircraft table';
  ELSE
    RAISE NOTICE 'class column already exists';
  END IF;
END $$;

-- Add 'hobbs_hours' column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'aircraft' 
      AND column_name = 'hobbs_hours'
  ) THEN
    ALTER TABLE public.aircraft ADD COLUMN hobbs_hours DECIMAL(10, 2);
    RAISE NOTICE 'Added hobbs_hours column to aircraft table';
  ELSE
    RAISE NOTICE 'hobbs_hours column already exists';
  END IF;
END $$;

-- Add 'tach_hours' column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'aircraft' 
      AND column_name = 'tach_hours'
  ) THEN
    ALTER TABLE public.aircraft ADD COLUMN tach_hours DECIMAL(10, 2);
    RAISE NOTICE 'Added tach_hours column to aircraft table';
  ELSE
    RAISE NOTICE 'tach_hours column already exists';
  END IF;
END $$;

-- Add 'image_url' column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'aircraft' 
      AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.aircraft ADD COLUMN image_url TEXT;
    RAISE NOTICE 'Added image_url column to aircraft table';
  ELSE
    RAISE NOTICE 'image_url column already exists';
  END IF;
END $$;

-- Add 'base_location' column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'aircraft' 
      AND column_name = 'base_location'
  ) THEN
    ALTER TABLE public.aircraft ADD COLUMN base_location TEXT;
    RAISE NOTICE 'Added base_location column to aircraft table';
  ELSE
    RAISE NOTICE 'base_location column already exists';
  END IF;
END $$;

-- Add 'owner_id' column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'aircraft' 
      AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.aircraft ADD COLUMN owner_id UUID REFERENCES public.user_profiles(id);
    RAISE NOTICE 'Added owner_id column to aircraft table';
  ELSE
    RAISE NOTICE 'owner_id column already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Make columns NOT NULL if they should be (optional)
-- ============================================================================

-- Uncomment if you want to enforce NOT NULL constraints:
-- ALTER TABLE public.aircraft ALTER COLUMN make SET NOT NULL;
-- ALTER TABLE public.aircraft ALTER COLUMN model SET NOT NULL;

-- ============================================================================
-- STEP 4: Verify the table structure
-- ============================================================================

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'aircraft'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 5: Check if maintenance table exists
-- ============================================================================

-- Check if maintenance table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name = 'maintenance'
) AS maintenance_table_exists;

-- If maintenance table doesn't exist, you'll need to run the full schema
-- from supabase-schema.sql

