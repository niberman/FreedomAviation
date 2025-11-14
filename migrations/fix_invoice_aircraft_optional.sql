-- Fix invoice creation to allow optional aircraft_id
-- The invoices table currently requires aircraft_id NOT NULL, but the UI allows it to be optional

-- First, alter the invoices table to make aircraft_id nullable
ALTER TABLE public.invoices 
  ALTER COLUMN aircraft_id DROP NOT NULL;

-- Update the create_instruction_invoice function to accept nullable aircraft_id
CREATE OR REPLACE FUNCTION public.create_instruction_invoice(
  p_owner_id UUID,
  p_aircraft_id UUID,  -- Now nullable
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
  
  -- Verify the CFI ID matches the authenticated user (or user is admin/founder)
  IF p_cfi_id != auth.uid() THEN
    -- Check if user is admin or founder
    SELECT role INTO v_user_role
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    IF v_user_role NOT IN ('admin', 'founder') THEN
      RAISE EXCEPTION 'Unauthorized: CFI ID does not match authenticated user';
    END IF;
  END IF;
  
  -- Verify the caller has CFI role
  SELECT role INTO v_user_role
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  IF v_user_role NOT IN ('admin', 'staff', 'cfi', 'founder') THEN
    RAISE EXCEPTION 'Unauthorized: User must be CFI, staff, admin, or founder';
  END IF;
  
  -- If aircraft_id is provided, verify owner matches
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
  
  -- Generate invoice number (INV-YYYYMMDD-XXXXX)
  v_invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  
  -- Create the invoice
  INSERT INTO public.invoices (
    owner_id,
    aircraft_id,  -- Now can be NULL
    invoice_number,
    amount,
    status,
    category,
    created_by_cfi_id,
    due_date
  ) VALUES (
    p_owner_id,
    p_aircraft_id,  -- Can be NULL
    v_invoice_number,
    (p_hours * p_rate_cents / 100)::DECIMAL(10, 2),
    'draft',
    'instruction',
    p_cfi_id,
    CURRENT_DATE + INTERVAL '30 days'
  )
  RETURNING id INTO v_invoice_id;
  
  -- Create invoice line item
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
  
  -- Return the invoice ID
  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update the finalize_invoice function to handle nullable aircraft_id
CREATE OR REPLACE FUNCTION public.finalize_invoice(p_invoice_id UUID)
RETURNS VOID AS $$
DECLARE
  v_owner_id UUID;
  v_status TEXT;
BEGIN
  -- Get invoice details
  SELECT owner_id, status INTO v_owner_id, v_status
  FROM public.invoices
  WHERE id = p_invoice_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;
  
  -- Check authorization
  IF NOT (
    -- Owner can finalize their own invoice
    v_owner_id = auth.uid() OR
    -- Or user is CFI who created it
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE id = p_invoice_id AND created_by_cfi_id = auth.uid()
    ) OR
    -- Or user is admin/staff/founder
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder')
    )
  ) THEN
    RAISE EXCEPTION 'Unauthorized to finalize this invoice';
  END IF;
  
  -- Only draft invoices can be finalized
  IF v_status != 'draft' THEN
    RAISE EXCEPTION 'Only draft invoices can be finalized';
  END IF;
  
  -- Update status to sent
  UPDATE public.invoices
  SET status = 'sent',
      updated_at = NOW()
  WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to document the change
COMMENT ON COLUMN public.invoices.aircraft_id IS 'Optional reference to aircraft. May be NULL for instruction invoices not tied to a specific aircraft.';

