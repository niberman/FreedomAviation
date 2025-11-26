-- =============================================================================
-- CREATE MAINTENANCE INVOICE RPC FUNCTION
-- =============================================================================
-- This migration creates the maintenance invoice creation function that supports
-- multiple line items (labor, parts, fees).
--
-- Based on existing create_instruction_invoice function structure.
-- Reuses: finalize_invoice, invoice_lines table, email sending endpoint
--
-- Date: 2025-11-26
-- =============================================================================

-- =============================================================================
-- FUNCTION: create_maintenance_invoice
-- =============================================================================
-- Creates a new maintenance invoice with multiple line items
-- Returns the UUID of the created invoice
-- =============================================================================
CREATE OR REPLACE FUNCTION public.create_maintenance_invoice(
  p_owner_id UUID,
  p_aircraft_id UUID,           -- Can be NULL
  p_notes TEXT,                 -- Invoice-level notes
  p_line_items JSONB,           -- Array of {description, quantity, unit_cents}
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_user_role TEXT;
  v_aircraft_owner_id UUID;
  v_total_cents INTEGER := 0;
  v_item JSONB;
BEGIN
  -- Verify the caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Verify the created_by ID matches the authenticated user (or user is admin/founder)
  IF p_created_by != auth.uid() THEN
    SELECT role INTO v_user_role
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    IF v_user_role NOT IN ('admin', 'founder') THEN
      RAISE EXCEPTION 'Unauthorized: Creator ID does not match authenticated user';
    END IF;
  END IF;
  
  -- Verify the caller has appropriate role
  SELECT role INTO v_user_role
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  IF v_user_role NOT IN ('admin', 'staff', 'cfi', 'founder') THEN
    RAISE EXCEPTION 'Unauthorized: User must be staff, admin, or founder';
  END IF;
  
  -- If aircraft_id is provided, verify it exists and belongs to the owner
  IF p_aircraft_id IS NOT NULL THEN
    SELECT owner_id INTO v_aircraft_owner_id
    FROM public.aircraft
    WHERE id = p_aircraft_id;
    
    IF v_aircraft_owner_id IS NULL THEN
      RAISE EXCEPTION 'Aircraft not found';
    END IF;
    
    IF v_aircraft_owner_id != p_owner_id THEN
      RAISE EXCEPTION 'Aircraft owner does not match invoice owner';
    END IF;
  END IF;
  
  -- Verify owner exists
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_owner_id) THEN
    RAISE EXCEPTION 'Owner not found';
  END IF;
  
  -- Calculate total from line items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_line_items)
  LOOP
    v_total_cents := v_total_cents + 
      ROUND((v_item->>'quantity')::DECIMAL * (v_item->>'unit_cents')::INTEGER)::INTEGER;
  END LOOP;
  
  -- Generate invoice number (INV-YYYYMMDD-XXXXX)
  v_invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  
  -- Create the invoice
  INSERT INTO public.invoices (
    owner_id,
    aircraft_id,
    invoice_number,
    amount,
    status,
    category,
    created_by_cfi_id,
    due_date
  ) VALUES (
    p_owner_id,
    p_aircraft_id,
    v_invoice_number,
    (v_total_cents / 100.0)::DECIMAL(10, 2),
    'draft',
    'maintenance',
    p_created_by,
    CURRENT_DATE + INTERVAL '30 days'
  )
  RETURNING id INTO v_invoice_id;
  
  -- Insert line items from JSONB array
  INSERT INTO public.invoice_lines (
    invoice_id,
    description,
    quantity,
    unit_cents
  )
  SELECT 
    v_invoice_id,
    item->>'description',
    (item->>'quantity')::DECIMAL,
    (item->>'unit_cents')::INTEGER
  FROM jsonb_array_elements(p_line_items) AS item;
  
  -- Return the invoice ID
  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comment
COMMENT ON FUNCTION public.create_maintenance_invoice IS 
  'Creates a new maintenance invoice with multiple line items. Supports labor, parts, and fees.';

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.create_maintenance_invoice TO authenticated;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_maintenance_invoice') THEN
    RAISE NOTICE '✅ create_maintenance_invoice function created successfully';
  ELSE
    RAISE NOTICE '❌ create_maintenance_invoice function NOT found';
  END IF;
END $$;

