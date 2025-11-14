-- Database triggers and functions for sending email notifications
-- These will be triggered when service requests or instruction requests are created

-- Create a function to notify about new service requests
CREATE OR REPLACE FUNCTION notify_service_request_created() 
RETURNS trigger AS $$
DECLARE
  v_request_data JSONB;
  v_aircraft_data RECORD;
  v_user_data RECORD;
  v_base_url TEXT;
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

  -- Insert into notification queue (to be processed by a background job)
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for service requests
DROP TRIGGER IF EXISTS service_request_created_trigger ON public.service_requests;
CREATE TRIGGER service_request_created_trigger
  AFTER INSERT ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_service_request_created();

-- Create email notifications queue table
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'service_request', 'instruction_request', etc.
  recipient_role TEXT NOT NULL, -- 'ops', 'cfi', 'founder', etc.
  data JSONB NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_email_notifications_status ON public.email_notifications(status);
CREATE INDEX idx_email_notifications_type ON public.email_notifications(type);

-- Enable RLS on email_notifications
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins and system can access email notifications
DO $$
BEGIN
  -- Check if user_profiles.role exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'role'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can view email notifications" ON public.email_notifications
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN (''admin'', ''founder''))
      )';
  ELSE
    -- If role column doesn't exist, allow all authenticated users for now
    EXECUTE 'CREATE POLICY "Authenticated can view email notifications" ON public.email_notifications
      FOR SELECT USING (auth.uid() IS NOT NULL)';
    RAISE WARNING 'user_profiles.role column not found - using basic auth policy';
  END IF;
END $$;

-- Create a function for instruction request notifications
CREATE OR REPLACE FUNCTION notify_instruction_request_created() 
RETURNS trigger AS $$
DECLARE
  v_request_data JSONB;
  v_aircraft_data RECORD;
  v_student_data RECORD;
  v_base_url TEXT;
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

  -- Get student details
  SELECT full_name, email
  INTO v_student_data
  FROM public.user_profiles
  WHERE id = NEW.student_id;

  -- Build notification data
  v_request_data := jsonb_build_object(
    'request_id', NEW.id,
    'student_name', v_student_data.full_name,
    'student_email', v_student_data.email,
    'aircraft_tail_number', v_aircraft_data.tail_number,
    'requested_date', NEW.requested_date,
    'requested_time', NEW.requested_time,
    'instruction_type', COALESCE(NEW.instruction_type, 'Flight Instruction'),
    'notes', NEW.notes,
    'dashboard_url', v_base_url || '/staff-dashboard?instruction_request=' || NEW.id,
    'created_at', NEW.created_at
  );

  -- Insert into notification queue
  INSERT INTO public.email_notifications (
    type,
    recipient_role,
    data,
    status
  ) VALUES (
    'instruction_request',
    'cfi',
    v_request_data,
    'pending'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create instruction_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.instruction_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  aircraft_id UUID REFERENCES public.aircraft(id) NOT NULL,
  cfi_id UUID REFERENCES public.user_profiles(id),
  requested_date DATE NOT NULL,
  requested_time TIME,
  instruction_type TEXT DEFAULT 'Flight Instruction',
  duration_hours DECIMAL(3,1) DEFAULT 1.0,
  notes TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'scheduled', 'completed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on instruction_requests
ALTER TABLE public.instruction_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for instruction_requests
CREATE POLICY "Students can view own requests" ON public.instruction_requests
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can create requests" ON public.instruction_requests
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- Create role-based policies only if role column exists
DO $$
BEGIN
  -- Check if user_profiles.role exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'role'
  ) THEN
    EXECUTE 'CREATE POLICY "CFIs and ops can view all requests" ON public.instruction_requests
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN (''cfi'', ''ops'', ''admin'', ''founder''))
      )';
    
    EXECUTE 'CREATE POLICY "CFIs and ops can update requests" ON public.instruction_requests
      FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN (''cfi'', ''ops'', ''admin'', ''founder''))
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN (''cfi'', ''ops'', ''admin'', ''founder''))
      )';
    
    RAISE NOTICE 'Created role-based policies for instruction_requests';
  ELSE
    -- If role column doesn't exist, create simpler policies
    EXECUTE 'CREATE POLICY "Authenticated can view all requests" ON public.instruction_requests
      FOR SELECT USING (auth.uid() IS NOT NULL)';
    
    EXECUTE 'CREATE POLICY "Authenticated can update requests" ON public.instruction_requests
      FOR UPDATE USING (auth.uid() IS NOT NULL)
      WITH CHECK (auth.uid() IS NOT NULL)';
    
    RAISE WARNING 'user_profiles.role column not found - using basic auth policies for instruction_requests';
  END IF;
END $$;

-- Create trigger for instruction requests
DROP TRIGGER IF EXISTS instruction_request_created_trigger ON public.instruction_requests;
CREATE TRIGGER instruction_request_created_trigger
  AFTER INSERT ON public.instruction_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_instruction_request_created();

-- Add updated_at triggers
CREATE TRIGGER update_email_notifications_updated_at BEFORE UPDATE ON public.email_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instruction_requests_updated_at BEFORE UPDATE ON public.instruction_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
