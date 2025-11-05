-- Create a test invoice that can be paid via the "Pay Invoice" button
-- This creates a finalized invoice with invoice_lines for testing payment functionality
--
-- INSTRUCTIONS:
-- 1. First, find your user ID and aircraft ID:
--    SELECT id, email, full_name FROM user_profiles WHERE role = 'owner' LIMIT 1;
--    SELECT id, tail_number, owner_id FROM aircraft LIMIT 1;
--
-- 2. Replace the placeholders below with your actual IDs
-- 3. Run this script in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Find your IDs (uncomment and run these queries first)
-- ============================================================================
-- SELECT id, email, full_name FROM user_profiles WHERE role = 'owner' LIMIT 1;
-- SELECT id, tail_number, owner_id FROM aircraft LIMIT 1;

-- ============================================================================
-- STEP 2: Create a finalized invoice ready for payment
-- ============================================================================
-- Replace 'YOUR_OWNER_ID' and 'YOUR_AIRCRAFT_ID' with actual UUIDs from Step 1

DO $$
DECLARE
  v_owner_id UUID := 'YOUR_OWNER_ID'::uuid;  -- Replace with your owner ID
  v_aircraft_id UUID := 'YOUR_AIRCRAFT_ID'::uuid;  -- Replace with your aircraft ID
  v_invoice_id UUID;
  v_invoice_number TEXT;
BEGIN
  -- Generate invoice number
  v_invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8);
  
  -- Insert the invoice with status 'finalized' (required for payment)
  INSERT INTO public.invoices (
    owner_id,
    aircraft_id,
    invoice_number,
    amount,
    status,
    category,
    due_date,
    created_at
  ) VALUES (
    v_owner_id,
    v_aircraft_id,
    v_invoice_number,
    250.00,  -- Total amount (will be calculated from invoice_lines)
    'finalized',  -- Must be 'finalized' to enable payment
    'instruction',  -- or 'membership'
    (CURRENT_DATE + INTERVAL '30 days'),  -- Due in 30 days
    NOW()
  ) RETURNING id INTO v_invoice_id;
  
  -- Insert invoice lines (these are required for payment calculation)
  -- Line 1: Flight Instruction - Ground School
  INSERT INTO public.invoice_lines (
    invoice_id,
    description,
    quantity,
    unit_cents
  ) VALUES (
    v_invoice_id,
    'Flight Instruction - Ground School',
    2.0,  -- 2 hours
    7500  -- $75.00 per hour = 7500 cents
  );
  
  -- Line 2: Flight Instruction - Air Time
  INSERT INTO public.invoice_lines (
    invoice_id,
    description,
    quantity,
    unit_cents
  ) VALUES (
    v_invoice_id,
    'Flight Instruction - Air Time',
    1.0,  -- 1 hour
    10000  -- $100.00 per hour = 10000 cents
  );
  
  -- Total: (2 × $75.00) + (1 × $100.00) = $250.00
  
  RAISE NOTICE '✅ Invoice created successfully!';
  RAISE NOTICE 'Invoice ID: %', v_invoice_id;
  RAISE NOTICE 'Invoice Number: %', v_invoice_number;
  RAISE NOTICE 'Status: finalized (ready for payment)';
  RAISE NOTICE 'Total Amount: $250.00';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now test the "Pay Invoice" button on the owner dashboard!';
  
END $$;

-- ============================================================================
-- VERIFICATION: Check the created invoice
-- ============================================================================
-- Run this query to verify the invoice was created correctly:

SELECT 
  i.id,
  i.invoice_number,
  i.status,
  i.amount,
  i.due_date,
  i.owner_id,
  i.aircraft_id,
  COUNT(il.id) as line_item_count,
  SUM(il.quantity * il.unit_cents) / 100.0 as calculated_total,
  STRING_AGG(il.description || ' (' || il.quantity || ' × $' || (il.unit_cents/100.0) || ')', ', ') as line_items
FROM public.invoices i
LEFT JOIN public.invoice_lines il ON il.invoice_id = i.id
WHERE i.status = 'finalized'
  AND i.paid_date IS NULL
GROUP BY i.id, i.invoice_number, i.status, i.amount, i.due_date, i.owner_id, i.aircraft_id
ORDER BY i.created_at DESC
LIMIT 5;

-- ============================================================================
-- QUICK INSERT (Alternative - if you prefer to set IDs directly)
-- ============================================================================
-- If you already know your IDs, you can use this simpler version:
-- Replace the UUIDs and run:

/*
WITH new_invoice AS (
  INSERT INTO public.invoices (
    owner_id,
    aircraft_id,
    invoice_number,
    amount,
    status,
    category,
    due_date
  ) VALUES (
    'YOUR_OWNER_ID'::uuid,
    'YOUR_AIRCRAFT_ID'::uuid,
    'INV-TEST-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS'),
    250.00,
    'finalized',
    'instruction',
    (CURRENT_DATE + INTERVAL '30 days')
  ) RETURNING id
)
INSERT INTO public.invoice_lines (invoice_id, description, quantity, unit_cents)
SELECT 
  new_invoice.id,
  description,
  quantity,
  unit_cents
FROM new_invoice,
(VALUES
  ('Flight Instruction - Ground School', 2.0, 7500),
  ('Flight Instruction - Air Time', 1.0, 10000)
) AS lines(description, quantity, unit_cents);
*/

