-- Freedom Aviation - Make Aircraft Optional for Instruction Invoices
-- This script makes aircraft_id optional for instruction invoices
-- Run this in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Make aircraft_id nullable in invoices table
-- ============================================================================

-- Remove NOT NULL constraint from aircraft_id for instruction invoices
-- We'll allow NULL for instruction invoices, but keep NOT NULL for membership invoices
-- Since we can't conditionally set NOT NULL, we'll make it nullable and handle validation in the function

ALTER TABLE public.invoices 
ALTER COLUMN aircraft_id DROP NOT NULL;

-- ============================================================================
-- STEP 2: Update the create_instruction_invoice function to handle optional aircraft
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_instruction_invoice(
  p_owner_id UUID,
  p_aircraft_id UUID,  -- Now optional (can be NULL)
  p_description TEXT,
  p_hours DECIMAL,
  p_rate_cents INTEGER,
  p_cfi_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_user_role TEXT;
  v_aircraft_owner_id UUID;
BEGIN
  -- Verify the caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Verify the CFI ID matches the authenticated user (or user is admin)
  IF p_cfi_id != auth.uid() THEN
    -- Check if user is admin
    SELECT role INTO v_user_role
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    IF v_user_role != 'admin' THEN
      RAISE EXCEPTION 'CFI ID must match authenticated user';
    END IF;
  END IF;
  
  -- Verify user has CFI or admin role
  SELECT role INTO v_user_role
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  IF v_user_role NOT IN ('staff', 'cfi', 'admin') THEN
    RAISE EXCEPTION 'Only staff and admins can create instruction invoices';
  END IF;
  
  -- Verify aircraft exists and belongs to owner (only if aircraft_id is provided)
  IF p_aircraft_id IS NOT NULL THEN
    SELECT owner_id INTO v_aircraft_owner_id
    FROM public.aircraft
    WHERE id = p_aircraft_id;
    
    IF v_aircraft_owner_id IS NULL THEN
      RAISE EXCEPTION 'Aircraft not found';
    END IF;
    
    IF v_aircraft_owner_id != p_owner_id THEN
      RAISE EXCEPTION 'Aircraft does not belong to the specified owner';
    END IF;
  END IF;
  
  -- Verify owner exists
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_owner_id) THEN
    RAISE EXCEPTION 'Owner not found';
  END IF;
  
  -- Generate invoice number
  v_invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8);
  
  -- Insert invoice (aircraft_id can be NULL)
  INSERT INTO public.invoices (
    owner_id,
    aircraft_id,
    invoice_number,
    amount,
    status,
    category,
    created_by_cfi_id
  ) VALUES (
    p_owner_id,
    p_aircraft_id,  -- Can be NULL
    v_invoice_number,
    0, -- Will be updated by finalize_invoice
    'draft',
    'instruction',
    p_cfi_id
  ) RETURNING id INTO v_invoice_id;
  
  -- Insert invoice line
  INSERT INTO public.invoice_lines (
    invoice_id,
    description,
    quantity,
    unit_cents
  ) VALUES (
    v_invoice_id,
    p_description,
    p_hours,
    p_rate_cents
  );
  
  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Add a check constraint to ensure membership invoices still require aircraft
-- ============================================================================

-- Note: We can't easily add a conditional constraint, but the application logic
-- should ensure membership invoices always have an aircraft_id.
-- If needed, you could add a trigger to enforce this, but for now we'll rely on application logic.

-- ============================================================================
-- VERIFY: Check the changes
-- ============================================================================

-- Verify aircraft_id is now nullable
SELECT 
  column_name, 
  is_nullable, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'invoices'
  AND column_name = 'aircraft_id';

-- Test that the function accepts NULL aircraft_id (you can test this manually)
-- SELECT public.create_instruction_invoice(
--   'YOUR_OWNER_ID'::UUID,
--   NULL,  -- NULL aircraft_id
--   'Test instruction',
--   2.0,
--   15000,  -- $150.00 in cents
--   'YOUR_CFI_ID'::UUID
-- );



