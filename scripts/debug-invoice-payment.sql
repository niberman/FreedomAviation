-- Debug script to check invoice payment readiness
-- Invoice ID: 3febe716-f221-43b1-bfdc-53575d004417
-- Owner ID: 33e9b7c7-8556-4138-b455-b8cce1f163f9

-- Check invoice details and payment readiness
SELECT 
  i.id,
  i.invoice_number,
  i.status,
  i.amount,
  i.owner_id,
  i.aircraft_id,
  i.created_at,
  i.paid_date,
  COUNT(il.id) as line_count,
  COALESCE(SUM(il.quantity * il.unit_cents), 0) as total_cents,
  ROUND(COALESCE(SUM(il.quantity * il.unit_cents), 0) / 100.0, 2) as total_dollars,
  CASE 
    WHEN i.status != 'finalized' THEN '❌ Status must be "finalized" (current: ' || i.status || ')'
    WHEN COUNT(il.id) = 0 THEN '❌ No invoice_lines found - invoice needs line items'
    WHEN COALESCE(SUM(il.quantity * il.unit_cents), 0) <= 0 THEN '❌ Total amount is 0 or negative'
    WHEN i.paid_date IS NOT NULL THEN '⚠️ Invoice already paid on ' || i.paid_date::text
    WHEN i.owner_id != '33e9b7c7-8556-4138-b455-b8cce1f163f9' THEN '❌ Owner mismatch'
    ELSE '✅ Invoice looks ready for payment'
  END as payment_readiness
FROM invoices i
LEFT JOIN invoice_lines il ON il.invoice_id = i.id
WHERE i.id = '3febe716-f221-43b1-bfdc-53575d004417'
GROUP BY i.id, i.invoice_number, i.status, i.amount, i.owner_id, i.aircraft_id, i.created_at, i.paid_date;

-- Check invoice lines in detail
SELECT 
  il.id,
  il.invoice_id,
  il.description,
  il.quantity,
  il.unit_cents,
  ROUND(il.unit_cents / 100.0, 2) as unit_dollars,
  (il.quantity * il.unit_cents) as line_total_cents,
  ROUND((il.quantity * il.unit_cents) / 100.0, 2) as line_total_dollars,
  CASE 
    WHEN il.quantity <= 0 THEN '❌ Quantity must be > 0'
    WHEN il.unit_cents <= 0 THEN '❌ Unit price must be > 0'
    ELSE '✅ Line looks good'
  END as line_status
FROM invoice_lines il
WHERE il.invoice_id = '3febe716-f221-43b1-bfdc-53575d004417'
ORDER BY il.created_at;

-- Check if invoice belongs to correct owner
SELECT 
  i.id,
  i.owner_id,
  up.email,
  up.full_name,
  up.role,
  CASE 
    WHEN i.owner_id = '33e9b7c7-8556-4138-b455-b8cce1f163f9' THEN '✅ Owner matches'
    ELSE '❌ Owner does not match - expected: 33e9b7c7-8556-4138-b455-b8cce1f163f9'
  END as ownership_check
FROM invoices i
JOIN user_profiles up ON up.id = i.owner_id
WHERE i.id = '3febe716-f221-43b1-bfdc-53575d004417';

-- Quick fix: If invoice is missing lines, check what should be there
SELECT 'If invoice has no lines, you may need to:' as note
UNION ALL
SELECT '1. Go back to CFI dashboard'
UNION ALL
SELECT '2. Create invoice with description, hours, and rate'
UNION ALL
SELECT '3. Click "Mark as Finalized"'
UNION ALL
SELECT '4. Then try paying again';

