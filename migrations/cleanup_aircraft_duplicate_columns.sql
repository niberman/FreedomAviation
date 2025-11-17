-- ============================================
-- Cleanup Aircraft Duplicate Columns Migration
-- ============================================
-- This migration removes duplicate hobbs_time/tach_time columns
-- in favor of hobbs_hours/tach_hours which are used by the application

-- Problem: Database has BOTH hobbs_time/tach_time AND hobbs_hours/tach_hours
-- Solution: Migrate any data from old columns, then drop them

BEGIN;

-- Step 1: Check for data in old columns
DO $$
DECLARE
  old_hobbs_count INTEGER;
  old_tach_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_hobbs_count FROM aircraft WHERE hobbs_time IS NOT NULL;
  SELECT COUNT(*) INTO old_tach_count FROM aircraft WHERE tach_time IS NOT NULL;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Aircraft columns with data:';
  RAISE NOTICE '  hobbs_time: % rows', old_hobbs_count;
  RAISE NOTICE '  tach_time:  % rows', old_tach_count;
  RAISE NOTICE '====================================';
END $$;

-- Step 2: Migrate data from old columns to new columns if needed
-- Only copy if new column is NULL and old column has data
UPDATE aircraft
SET 
  hobbs_hours = hobbs_time,
  tach_hours = tach_time
WHERE 
  (hobbs_hours IS NULL AND hobbs_time IS NOT NULL)
  OR (tach_hours IS NULL AND tach_time IS NOT NULL);

-- Step 3: Show what we migrated
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count 
  FROM aircraft 
  WHERE hobbs_time IS NOT NULL OR tach_time IS NOT NULL;
  
  IF migrated_count > 0 THEN
    RAISE NOTICE 'Migrated data for % aircraft records', migrated_count;
  ELSE
    RAISE NOTICE 'No data to migrate';
  END IF;
END $$;

-- Step 4: Verify all data is preserved
DO $$
DECLARE
  hobbs_hours_count INTEGER;
  tach_hours_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO hobbs_hours_count FROM aircraft WHERE hobbs_hours IS NOT NULL;
  SELECT COUNT(*) INTO tach_hours_count FROM aircraft WHERE tach_hours IS NOT NULL;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'After migration:';
  RAISE NOTICE '  hobbs_hours: % rows', hobbs_hours_count;
  RAISE NOTICE '  tach_hours:  % rows', tach_hours_count;
  RAISE NOTICE '====================================';
END $$;

-- Step 5: Update any views that depend on the old columns
DO $$
BEGIN
  -- Check if v_owner_aircraft view exists
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'v_owner_aircraft'
  ) THEN
    RAISE NOTICE 'Updating v_owner_aircraft view to use hobbs_hours/tach_hours...';
    
    -- Recreate the view using the new column names
    DROP VIEW IF EXISTS v_owner_aircraft;
    
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
      hobbs_hours AS hobbs_time,  -- Alias for backward compatibility
      tach_hours AS tach_time     -- Alias for backward compatibility
    FROM aircraft;
    
    RAISE NOTICE '✅ Updated v_owner_aircraft view';
  ELSE
    RAISE NOTICE 'ℹ️  v_owner_aircraft view does not exist';
  END IF;
END $$;

-- Step 6: Drop the old columns
DO $$
BEGIN
  -- Check if columns exist before dropping
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'aircraft' 
    AND column_name = 'hobbs_time'
  ) THEN
    ALTER TABLE aircraft DROP COLUMN hobbs_time CASCADE;
    RAISE NOTICE '✅ Dropped aircraft.hobbs_time column (with CASCADE for dependent objects)';
  ELSE
    RAISE NOTICE 'ℹ️  aircraft.hobbs_time column does not exist';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'aircraft' 
    AND column_name = 'tach_time'
  ) THEN
    ALTER TABLE aircraft DROP COLUMN tach_time CASCADE;
    RAISE NOTICE '✅ Dropped aircraft.tach_time column (with CASCADE for dependent objects)';
  ELSE
    RAISE NOTICE 'ℹ️  aircraft.tach_time column does not exist';
  END IF;
END $$;

-- Step 7: Recreate v_owner_aircraft view if it was dropped
DO $$
BEGIN
  -- Recreate the view with new column names
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
    hobbs_hours AS hobbs_time,  -- Maintain backward compatibility in view
    tach_hours AS tach_time     -- Maintain backward compatibility in view
  FROM aircraft;
  
  RAISE NOTICE '✅ Recreated v_owner_aircraft view with correct column names';
END $$;

-- Step 8: Verify final state
DO $$
DECLARE
  hobbs_time_exists BOOLEAN;
  tach_time_exists BOOLEAN;
  hobbs_hours_exists BOOLEAN;
  tach_hours_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'aircraft' AND column_name = 'hobbs_time'
  ) INTO hobbs_time_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'aircraft' AND column_name = 'tach_time'
  ) INTO tach_time_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'aircraft' AND column_name = 'hobbs_hours'
  ) INTO hobbs_hours_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'aircraft' AND column_name = 'tach_hours'
  ) INTO tach_hours_exists;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'Final aircraft table columns:';
  RAISE NOTICE '  hobbs_time:  %', CASE WHEN hobbs_time_exists THEN '❌ STILL EXISTS' ELSE '✅ REMOVED' END;
  RAISE NOTICE '  tach_time:   %', CASE WHEN tach_time_exists THEN '❌ STILL EXISTS' ELSE '✅ REMOVED' END;
  RAISE NOTICE '  hobbs_hours: %', CASE WHEN hobbs_hours_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '  tach_hours:  %', CASE WHEN tach_hours_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '====================================';

  -- Fail if something went wrong
  IF NOT hobbs_hours_exists OR NOT tach_hours_exists THEN
    RAISE EXCEPTION 'Migration failed: hobbs_hours or tach_hours columns are missing!';
  END IF;
  
  IF hobbs_time_exists OR tach_time_exists THEN
    RAISE EXCEPTION 'Migration failed: Old columns still exist!';
  END IF;
  
  RAISE NOTICE '✅ Migration completed successfully!';
END $$;

COMMIT;

-- ============================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================
-- To rollback this migration:
-- 
-- BEGIN;
-- ALTER TABLE aircraft ADD COLUMN hobbs_time NUMERIC;
-- ALTER TABLE aircraft ADD COLUMN tach_time NUMERIC;
-- -- Note: Original data will be lost if rollback is performed
-- COMMIT;

