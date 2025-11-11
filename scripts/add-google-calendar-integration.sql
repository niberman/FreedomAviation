-- Add Google Calendar Integration for CFI Schedule
-- Run this in Supabase SQL Editor

-- Create cfi_schedule table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cfi_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cfi_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'booked', 'blocked')),
  owner_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  aircraft_id UUID REFERENCES public.aircraft(id) ON DELETE SET NULL,
  notes TEXT,
  google_calendar_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cfi_schedule_cfi_date ON public.cfi_schedule(cfi_id, date);
CREATE INDEX IF NOT EXISTS idx_cfi_schedule_date ON public.cfi_schedule(date);
CREATE INDEX IF NOT EXISTS idx_cfi_schedule_status ON public.cfi_schedule(status);
CREATE INDEX IF NOT EXISTS idx_cfi_schedule_google_event ON public.cfi_schedule(google_calendar_event_id) WHERE google_calendar_event_id IS NOT NULL;

-- Create google_calendar_tokens table for storing OAuth tokens
CREATE TABLE IF NOT EXISTS public.google_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  calendar_id TEXT,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user lookup
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_user ON public.google_calendar_tokens(user_id);

-- Add updated_at trigger for cfi_schedule
DROP TRIGGER IF EXISTS update_cfi_schedule_updated_at ON public.cfi_schedule;
CREATE TRIGGER update_cfi_schedule_updated_at 
  BEFORE UPDATE ON public.cfi_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger for google_calendar_tokens
DROP TRIGGER IF EXISTS update_google_calendar_tokens_updated_at ON public.google_calendar_tokens;
CREATE TRIGGER update_google_calendar_tokens_updated_at 
  BEFORE UPDATE ON public.google_calendar_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.cfi_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cfi_schedule
CREATE POLICY "CFIs can view all schedule" ON public.cfi_schedule
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('cfi', 'admin', 'staff'))
  );

CREATE POLICY "CFIs can insert their own schedule" ON public.cfi_schedule
  FOR INSERT WITH CHECK (
    cfi_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('cfi', 'admin'))
  );

CREATE POLICY "CFIs can update their own schedule" ON public.cfi_schedule
  FOR UPDATE USING (
    cfi_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('cfi', 'admin'))
  )
  WITH CHECK (
    cfi_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('cfi', 'admin'))
  );

CREATE POLICY "CFIs can delete their own schedule" ON public.cfi_schedule
  FOR DELETE USING (
    cfi_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('cfi', 'admin'))
  );

CREATE POLICY "Owners can view available slots" ON public.cfi_schedule
  FOR SELECT USING (
    status = 'available' OR owner_id = auth.uid()
  );

-- RLS Policies for google_calendar_tokens
CREATE POLICY "Users can view own tokens" ON public.google_calendar_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own tokens" ON public.google_calendar_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tokens" ON public.google_calendar_tokens
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own tokens" ON public.google_calendar_tokens
  FOR DELETE USING (user_id = auth.uid());

-- Function to sync schedule changes to Google Calendar (placeholder for backend trigger)
CREATE OR REPLACE FUNCTION notify_schedule_change()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be picked up by the backend to sync with Google Calendar
  PERFORM pg_notify('schedule_change', json_build_object(
    'operation', TG_OP,
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to notify on schedule changes
DROP TRIGGER IF EXISTS notify_schedule_change_trigger ON public.cfi_schedule;
CREATE TRIGGER notify_schedule_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.cfi_schedule
  FOR EACH ROW EXECUTE FUNCTION notify_schedule_change();

COMMENT ON TABLE public.cfi_schedule IS 'Flight instructor availability and booking schedule';
COMMENT ON TABLE public.google_calendar_tokens IS 'OAuth tokens for Google Calendar integration';
COMMENT ON COLUMN public.cfi_schedule.google_calendar_event_id IS 'Google Calendar event ID for syncing';
COMMENT ON COLUMN public.google_calendar_tokens.sync_enabled IS 'Whether automatic sync is enabled for this user';

