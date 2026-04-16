import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { API_ROLES } from '@/lib/roles';
import { isGoogleCalendarConfigured } from '@/lib/google-calendar';

export const POST = withAuth(
  { roles: API_ROLES.CALENDAR },
  async ({ request, supabase, auth }) => {
    if (!isGoogleCalendarConfigured()) {
      return NextResponse.json(
        { error: 'Google Calendar not configured' },
        { status: 503 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const enabled = body.enabled === true || body.enabled === 'true';

    const { error } = await supabase
      .from('google_calendar_tokens')
      .update({ sync_enabled: enabled })
      .eq('user_id', auth.user.id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update sync setting', message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, enabled });
  },
);
