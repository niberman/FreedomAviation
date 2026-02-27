import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { requireRole } from '@/lib/api-auth';
import { API_ROLES } from '@/lib/roles';
import { isGoogleCalendarConfigured } from '@/lib/google-calendar';

export async function POST(request: NextRequest) {
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { error: 'Google Calendar not configured' },
      { status: 503 }
    );
  }

  const result = await requireRole(request, [...API_ROLES.CALENDAR]);
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.status === 401 ? 'Unauthorized' : result.status === 503 ? 'Service Unavailable' : 'Forbidden',
        message: result.message,
      },
      { status: result.status }
    );
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const enabled = body.enabled === true || body.enabled === 'true';

  const { error } = await supabase
    .from('google_calendar_tokens')
    .update({ sync_enabled: enabled })
    .eq('user_id', result.auth.user.id);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to update sync setting', message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, enabled });
}
