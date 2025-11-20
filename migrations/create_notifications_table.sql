-- Create notifications table for user-facing notifications
-- This enables the NotificationCenter component in the UI

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'service_request',
    'maintenance_due',
    'invoice',
    'client_joined',
    'flight_log',
    'general'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Only system/admin can create notifications
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'founder', 'ops', 'cfi', 'staff')
    )
  );

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_metadata)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_notification TO authenticated, service_role;

-- Example: Create a notification for service request creation
-- You can create triggers like this to automatically send notifications

CREATE OR REPLACE FUNCTION notify_service_request_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify staff/ops about new service request
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  SELECT 
    up.id,
    'service_request',
    'New Service Request',
    'A new service request has been submitted' || 
    CASE 
      WHEN NEW.aircraft_id IS NOT NULL THEN ' for aircraft ' || a.tail_number
      ELSE ''
    END,
    jsonb_build_object(
      'service_request_id', NEW.id,
      'type', NEW.type
    )
  FROM public.user_profiles up
  LEFT JOIN public.aircraft a ON a.id = NEW.aircraft_id
  WHERE up.role IN ('admin', 'founder', 'ops', 'cfi', 'staff');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (disabled by default - uncomment to enable)
-- DROP TRIGGER IF EXISTS service_request_notification_trigger ON public.service_requests;
-- CREATE TRIGGER service_request_notification_trigger
--   AFTER INSERT ON public.service_requests
--   FOR EACH ROW
--   EXECUTE FUNCTION notify_service_request_created();

COMMENT ON TABLE public.notifications IS 'User-facing notifications displayed in the NotificationCenter component';
COMMENT ON FUNCTION create_notification IS 'Helper function to create notifications programmatically';




