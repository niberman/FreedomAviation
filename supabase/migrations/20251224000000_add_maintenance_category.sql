-- =============================================================================
-- ADD MAINTENANCE CATEGORY TO INVOICES
-- =============================================================================
-- This migration updates the invoices_category_check constraint to allow
-- 'maintenance' as a valid category for maintenance invoices.
--
-- Current constraint only allows: 'membership', 'instruction'
-- New constraint allows: 'membership', 'instruction', 'maintenance'
-- =============================================================================

-- Step 1: Drop the existing check constraint
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_category_check;

-- Step 2: Add the updated check constraint with 'maintenance' included
ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_category_check 
CHECK (category = ANY (ARRAY['membership'::text, 'instruction'::text, 'maintenance'::text]));

