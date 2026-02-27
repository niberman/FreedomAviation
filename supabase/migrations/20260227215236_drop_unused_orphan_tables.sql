-- Drop orphaned tables: present in schema but never used by frontend or required backend.
-- See SUPABASE_ORPHANS_AND_UNUSED.md. Keeps email_notifications (used by notify_service_request_created trigger) and settings (used by after_fuel_log_create_charge).

-- 1. Drop trigger that depends on support_tickets
DROP TRIGGER IF EXISTS support_tickets_set_updated_at ON public.support_tickets;

-- 2. Drop orphaned tables (CASCADE drops policies and dependent objects)
DROP TABLE IF EXISTS public.credit_transactions CASCADE;
DROP TABLE IF EXISTS public.instruction_requests CASCADE;
DROP TABLE IF EXISTS public.consumable_events CASCADE;
DROP TABLE IF EXISTS public.client_billing_profiles CASCADE;
DROP TABLE IF EXISTS public.service_credits CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;

-- settings table is kept: referenced by after_fuel_log_create_charge() for default_fuel_rate.
-- email_notifications table is kept: written by notify_service_request_created trigger on service_requests.
