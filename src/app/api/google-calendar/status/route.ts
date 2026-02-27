import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { requireRole } from '@/lib/api-auth';
import { API_ROLES } from '@/lib/roles';
import { isGoogleCalendarConfigured } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json({
      connected: false,
      syncEnabled: false,
      featureAvailable: false,
      message: 'Google Calendar integration not configured',
    });
  }

  const result = await requireRole(request, [...API_ROLES.CALENDAR]);
  if (!result.ok) {
    return NextResponse.json({
      connected: false,
      syncEnabled: false,
      featureAvailable: false,
      message: result.status === 503 ? 'Supabase not configured' : 'Not authenticated',
    });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({
      connected: false,
      syncEnabled: false,
      featureAvailable: false,
      message: 'Supabase not configured',
    });
  }

  const { data: tokenData, error: tokenError } = await supabase
    .from('google_calendar_tokens')
    .select('sync_enabled, last_sync_at')
    .eq('user_id', result.auth.user.id)
    .maybeSingle();

  if (tokenError) {
    return NextResponse.json({
      connected: false,
      syncEnabled: false,
      featureAvailable: false,
      message: 'Google Calendar feature not set up',
    });
  }

  return NextResponse.json({
    connected: !!tokenData,
    syncEnabled: tokenData?.sync_enabled ?? false,
    featureAvailable: true,
  });
}
