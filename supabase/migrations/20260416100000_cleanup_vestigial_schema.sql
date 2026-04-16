-- =============================================================================
-- CLEANUP: DROP VESTIGIAL SCHEMA OBJECTS
-- =============================================================================
-- Removes objects no longer referenced by application code:
--   * Compatibility views (v_memberships, v_owner_aircraft, v_service_requests)
--   * Write-only `email_notifications` + its trigger/function
--   * Orphaned `settings` table + `after_fuel_log_create_charge` trigger function
--     (the fuel_logs table it fired on was dropped in 20260227220000)
--   * `create_notification()` function (the `notifications` table it writes to
--     was dropped in 20260227220000)
--   * Dead columns on `invoices`: period_start, period_end, total_cents,
--     line_items, hosted_invoice_url (never read or written by application code)
-- =============================================================================

BEGIN;

-- 1. Compatibility views -----------------------------------------------------
DROP VIEW IF EXISTS public.v_memberships CASCADE;
DROP VIEW IF EXISTS public.v_owner_aircraft CASCADE;
DROP VIEW IF EXISTS public.v_service_requests CASCADE;

-- 2. Write-only email_notifications + trigger --------------------------------
DROP TRIGGER IF EXISTS service_request_created_trigger ON public.service_requests;
DROP FUNCTION IF EXISTS public.notify_service_request_created() CASCADE;
DROP TABLE IF EXISTS public.email_notifications CASCADE;

-- 3. Orphaned settings + fuel-log trigger fn ---------------------------------
DROP FUNCTION IF EXISTS public.after_fuel_log_create_charge() CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;

-- 4. Orphaned notification helper (writes to a table that no longer exists) --
DROP FUNCTION IF EXISTS public.create_notification(uuid, text, text, text, jsonb) CASCADE;

-- 5. Dead invoices columns ---------------------------------------------------
ALTER TABLE public.invoices DROP COLUMN IF EXISTS period_start;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS period_end;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS total_cents;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS line_items;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS hosted_invoice_url;

COMMIT;
