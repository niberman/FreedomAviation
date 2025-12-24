-- =============================================================================
-- ADD MAINTENANCE CATEGORY TO INVOICES
-- =============================================================================
-- This migration updates the invoices_category_check constraint to allow
-- 'maintenance' as a valid category for maintenance invoices.
--
-- Current constraint only allows: 'membership', 'instruction'
-- New constraint allows: 'membership', 'instruction', 'maintenance'
--
-- Date: 2025-12-24
-- =============================================================================

-- Step 1: Drop the existing check constraint
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_category_check;

-- Step 2: Add the updated check constraint with 'maintenance' included
ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_category_check 
CHECK (category = ANY (ARRAY['membership'::text, 'instruction'::text, 'maintenance'::text]));

-- =============================================================================
-- VERIFICATION
-- =============================================================================
DO $$
DECLARE
  v_constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.check_constraints 
    WHERE constraint_name = 'invoices_category_check'
      AND check_clause LIKE '%maintenance%'
  ) INTO v_constraint_exists;
  
  IF v_constraint_exists THEN
    RAISE NOTICE '✅ invoices_category_check constraint updated successfully - now includes maintenance';
  ELSE
    RAISE NOTICE '❌ Constraint may not have been updated correctly';
  END IF;
END $$;

-- Show the updated constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'invoices_category_check';

