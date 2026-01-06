-- =============================================================================
-- ADD STAFF AND FOUNDER EMAIL NOTIFICATIONS
-- =============================================================================
-- This migration expands email notifications for service requests to include
-- staff and founder roles, in addition to the existing ops notifications.
-- 
-- Uses Resend for email delivery (configured via EMAIL_SERVICE=resend)
-- 
-- Date: 2025-12-26
-- =============================================================================

-- =============================================================================
-- FUNCTION: get_ops_emails
-- Returns emails of users with role = 'ops'
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_ops_emails()
RETURNS TABLE(email TEXT, full_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT up.email, up.full_name
  FROM public.user_profiles up
  WHERE up.role = 'ops'
    AND up.email IS NOT NULL
    AND up.email != '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION: get_staff_emails
-- Returns emails of users with role = 'staff'
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_staff_emails()
RETURNS TABLE(email TEXT, full_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT up.email, up.full_name
  FROM public.user_profiles up
  WHERE up.role = 'staff'
    AND up.email IS NOT NULL
    AND up.email != '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION: get_cfi_emails
-- Returns emails of users with role = 'cfi'
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_cfi_emails()
RETURNS TABLE(email TEXT, full_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT up.email, up.full_name
  FROM public.user_profiles up
  WHERE up.role = 'cfi'
    AND up.email IS NOT NULL
    AND up.email != '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION: get_founder_emails
-- Returns emails of founders who have enabled service request notifications
-- Respects notification_preferences table for opt-in/opt-out
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_founder_emails()
RETURNS TABLE(email TEXT, full_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT up.email, up.full_name
  FROM public.user_profiles up
  LEFT JOIN public.notification_preferences np ON np.user_id = up.id
  WHERE up.role = 'founder'
    AND up.email IS NOT NULL
    AND up.email != ''
    -- If no preferences exist, default to receiving notifications
    -- If preferences exist, check email_enabled AND receive_service_requests
    AND (
      np.id IS NULL  -- No preferences set = receive by default
      OR (np.email_enabled = true AND np.receive_service_requests = true)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION: notify_service_request_created (UPDATED)
-- Categorizes requests and routes to appropriate roles:
-- - Maintenance requests → Ops + Founders
-- - General service requests → Ops + Staff + Founders
-- =============================================================================
CREATE OR REPLACE FUNCTION notify_service_request_created() 
RETURNS trigger AS $$
DECLARE
  v_request_data JSONB;
  v_aircraft_data RECORD;
  v_user_data RECORD;
  v_base_url TEXT;
  v_is_maintenance BOOLEAN;
BEGIN
  -- Get the base URL from environment or use default
  v_base_url := COALESCE(
    current_setting('app.base_url', true),
    'https://www.freedomaviationco.com'
  );

  -- Get aircraft details
  SELECT tail_number, make, model
  INTO v_aircraft_data
  FROM public.aircraft
  WHERE id = NEW.aircraft_id;

  -- Get user details
  SELECT full_name, email
  INTO v_user_data
  FROM public.user_profiles
  WHERE id = NEW.user_id;

  -- Determine if this is a maintenance request (case-insensitive check)
  v_is_maintenance := LOWER(NEW.service_type) LIKE '%maintenance%';

  -- Build notification data
  v_request_data := jsonb_build_object(
    'request_id', NEW.id,
    'request_type', NEW.service_type,
    'aircraft_tail_number', v_aircraft_data.tail_number,
    'aircraft_make_model', v_aircraft_data.make || ' ' || v_aircraft_data.model,
    'owner_name', v_user_data.full_name,
    'owner_email', v_user_data.email,
    'priority', COALESCE(NEW.priority, 'medium'),
    'description', NEW.description,
    'airport', NEW.airport,
    'requested_departure', NEW.requested_departure,
    'dashboard_url', v_base_url || '/staff-dashboard?request=' || NEW.id,
    'created_at', NEW.created_at
  );

  -- Insert notification for ops users (always notified)
  INSERT INTO public.email_notifications (
    type,
    recipient_role,
    data,
    status
  ) VALUES (
    'service_request',
    'ops',
    v_request_data,
    'pending'
  );

  -- Insert notification for founder users (always notified)
  INSERT INTO public.email_notifications (
    type,
    recipient_role,
    data,
    status
  ) VALUES (
    'service_request',
    'founder',
    v_request_data,
    'pending'
  );

  -- For general service requests (non-maintenance), also notify staff
  IF NOT v_is_maintenance THEN
    INSERT INTO public.email_notifications (
      type,
      recipient_role,
      data,
      status
    ) VALUES (
      'service_request',
      'staff',
      v_request_data,
      'pending'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Recreate the trigger (to ensure the updated function is used)
-- =============================================================================
DROP TRIGGER IF EXISTS service_request_created_trigger ON public.service_requests;
CREATE TRIGGER service_request_created_trigger
  AFTER INSERT ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_service_request_created();

-- =============================================================================
-- Grant execute permissions on the new functions
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.get_ops_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_staff_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cfi_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_founder_emails() TO authenticated;

