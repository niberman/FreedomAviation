-- Drop tables no longer used after removing fuel-tracking, flight-logs, hangar-management,
-- document-management, cfi-schedule, google-calendar, service_tasks, notification-center/preferences.
-- Does NOT drop: onboarding_data, membership_quotes, pricing_classes, pricing_locations.

-- 1. Update get_founder_emails() to not depend on notification_preferences (table is being dropped)
CREATE OR REPLACE FUNCTION public.get_founder_emails()
RETURNS TABLE(email TEXT, full_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT up.email, up.full_name
  FROM public.user_profiles up
  WHERE up.role = 'founder'
    AND up.email IS NOT NULL
    AND up.email != '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop tables in dependency order (child tables first where needed)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.service_tasks CASCADE;
DROP TABLE IF EXISTS public.aircraft_pricing_overrides CASCADE;
DROP TABLE IF EXISTS public.pricing_snapshots CASCADE;
DROP TABLE IF EXISTS public.settings_pricing_assumptions CASCADE;
DROP TABLE IF EXISTS public.google_calendar_tokens CASCADE;
DROP TABLE IF EXISTS public.cfi_schedule CASCADE;
DROP TABLE IF EXISTS public.aircraft_documents CASCADE;
DROP TABLE IF EXISTS public.hangar_reservations CASCADE;
DROP TABLE IF EXISTS public.hangar_spaces CASCADE;
DROP TABLE IF EXISTS public.flight_logs CASCADE;
DROP TABLE IF EXISTS public.fuel_records CASCADE;
