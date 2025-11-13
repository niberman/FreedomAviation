-- Simple Table Analysis - Works in Supabase SQL Editor
-- Shows row counts and basic info for all tables

-- ============================================
-- ROW COUNTS FOR EACH TABLE
-- ============================================

SELECT 'user_profiles' as table_name, COUNT(*) as rows FROM public.user_profiles
UNION ALL
SELECT 'aircraft', COUNT(*) FROM public.aircraft
UNION ALL
SELECT 'service_requests', COUNT(*) FROM public.service_requests
UNION ALL
SELECT 'service_tasks', COUNT(*) FROM public.service_tasks
UNION ALL
SELECT 'invoices', COUNT(*) FROM public.invoices
UNION ALL
SELECT 'invoice_lines', COUNT(*) FROM public.invoice_lines
UNION ALL
SELECT 'memberships', COUNT(*) FROM public.memberships
UNION ALL
SELECT 'membership_tiers', COUNT(*) FROM public.membership_tiers
UNION ALL
SELECT 'membership_quotes', COUNT(*) FROM public.membership_quotes
UNION ALL
SELECT 'consumable_events', COUNT(*) FROM public.consumable_events
UNION ALL
SELECT 'cfi_schedule', COUNT(*) FROM public.cfi_schedule
UNION ALL
SELECT 'instruction_requests', COUNT(*) FROM public.instruction_requests
UNION ALL
SELECT 'google_calendar_tokens', COUNT(*) FROM public.google_calendar_tokens
UNION ALL
SELECT 'email_notifications', COUNT(*) FROM public.email_notifications
UNION ALL
SELECT 'onboarding_data', COUNT(*) FROM public.onboarding_data
UNION ALL
SELECT 'pricing_classes', COUNT(*) FROM public.pricing_classes
UNION ALL
SELECT 'pricing_locations', COUNT(*) FROM public.pricing_locations
UNION ALL
SELECT 'pricing_snapshots', COUNT(*) FROM public.pricing_snapshots
UNION ALL
SELECT 'aircraft_pricing_overrides', COUNT(*) FROM public.aircraft_pricing_overrides
UNION ALL
SELECT 'client_billing_profiles', COUNT(*) FROM public.client_billing_profiles
UNION ALL
SELECT 'maintenance_due', COUNT(*) FROM public.maintenance_due
UNION ALL
SELECT 'settings', COUNT(*) FROM public.settings
UNION ALL
SELECT 'settings_pricing_assumptions', COUNT(*) FROM public.settings_pricing_assumptions
UNION ALL
SELECT 'support_tickets', COUNT(*) FROM public.support_tickets
UNION ALL
SELECT 'pilot_currency', COUNT(*) FROM public.pilot_currency
UNION ALL
SELECT 'payment_methods', COUNT(*) FROM public.payment_methods
UNION ALL
SELECT 'notifications', COUNT(*) FROM public.notifications
UNION ALL
SELECT 'user_roles', COUNT(*) FROM public.user_roles
ORDER BY rows DESC, table_name;

