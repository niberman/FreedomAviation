-- Simple script to create a test invoice ready for payment
-- Copy and paste this into Supabase SQL Editor
-- 
-- STEP 1: Get your IDs by running these queries first:
-- SELECT id, email FROM user_profiles WHERE role = 'owner' LIMIT 1;
-- SELECT id, tail_number FROM aircraft LIMIT 1;
--
-- STEP 2: Replace YOUR_OWNER_ID and YOUR_AIRCRAFT_ID below with your actual UUIDs
-- STEP 3: Run the entire script

-- ═══════════════════════════════════════════════════════════════════════════
-- INSERT INVOICE (Replace the UUIDs!)
-- ═══════════════════════════════════════════════════════════════════════════

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
    'YOUR_OWNER_ID'::uuid,           -- ⬅️ REPLACE THIS with your owner_id UUID
    'YOUR_AIRCRAFT_ID'::uuid,        -- ⬅️ REPLACE THIS with your aircraft_id UUID
    'INV-TEST-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS'),
    250.00,
    'finalized',                      -- ✅ Must be 'finalized' to enable payment button
    'instruction',                    -- or 'membership'
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
  ('Flight Instruction - Ground School', 2.0, 7500),   -- 2 hrs × $75.00 = $150.00
  ('Flight Instruction - Air Time', 1.0, 10000)          -- 1 hr × $100.00 = $100.00
  -- Total: $250.00
) AS lines(description, quantity, unit_cents);

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFY: Check that the invoice was created correctly
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  i.id,
  i.invoice_number,
  i.status,
  i.amount,
  i.due_date,
  up.email as owner_email,
  a.tail_number,
  COUNT(il.id) as line_count,
  SUM(il.quantity * il.unit_cents) / 100.0 as calculated_total,
  CASE 
    WHEN i.status = 'finalized' AND i.paid_date IS NULL THEN '✅ Ready to Pay'
    WHEN i.status = 'paid' THEN '✅ Paid'
    ELSE '⚠️ Not payable'
  END as payment_status
FROM public.invoices i
LEFT JOIN public.user_profiles up ON up.id = i.owner_id
LEFT JOIN public.aircraft a ON a.id = i.aircraft_id
LEFT JOIN public.invoice_lines il ON il.invoice_id = i.id
WHERE i.status = 'finalized'
  AND i.paid_date IS NULL
GROUP BY i.id, i.invoice_number, i.status, i.amount, i.due_date, up.email, a.tail_number
ORDER BY i.created_at DESC
LIMIT 5;

