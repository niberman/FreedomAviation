-- Script to create test invoices for debugging
-- This creates sample membership invoices for testing
-- Replace the UUIDs with actual user and aircraft IDs from your database

-- First, get your user and aircraft IDs:
-- SELECT id, email FROM user_profiles WHERE role = 'owner';
-- SELECT id, tail_number, owner_id FROM aircraft;

-- Then uncomment and update the UUIDs below:

/*
-- Example: Create a test membership invoice
-- Replace 'YOUR_OWNER_ID' and 'YOUR_AIRCRAFT_ID' with actual UUIDs

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
  'YOUR_OWNER_ID'::uuid,
  'YOUR_AIRCRAFT_ID'::uuid,
  'INV-TEST-001',
  599.00,
  'finalized',
  'membership',
  (CURRENT_DATE + INTERVAL '30 days'),
  NOW()
) RETURNING id;

-- Then create invoice lines (replace 'INVOICE_ID' with the returned ID above)
INSERT INTO public.invoice_lines (
  invoice_id,
  description,
  quantity,
  unit_cents
) VALUES (
  'INVOICE_ID'::uuid,
  'Class II Monthly Service',
  1,
  59900
);

-- Create a draft invoice
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
  'YOUR_OWNER_ID'::uuid,
  'YOUR_AIRCRAFT_ID'::uuid,
  'INV-TEST-002',
  599.00,
  'draft',
  'membership',
  (CURRENT_DATE + INTERVAL '30 days'),
  NOW()
) RETURNING id;

-- Create invoice lines for draft invoice
INSERT INTO public.invoice_lines (
  invoice_id,
  description,
  quantity,
  unit_cents
) VALUES (
  'INVOICE_ID_FROM_DRAFT'::uuid,
  'Class II Monthly Service',
  1,
  59900
);
*/

-- Quick query to check existing invoices:
-- SELECT i.*, COUNT(il.id) as line_count
-- FROM invoices i
-- LEFT JOIN invoice_lines il ON il.invoice_id = i.id
-- GROUP BY i.id
-- ORDER BY i.created_at DESC;

