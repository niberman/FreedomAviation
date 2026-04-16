import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { API_ROLES } from '@/lib/roles';
import { isGoogleCalendarConfigured } from '@/lib/google-calendar';

export const POST = withAuth({ roles: API_ROLES.CALENDAR }, async ({ supabase, auth }) => {
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { error: 'Google Calendar not configured' },
      { status: 503 },
    );
  }

  const { error } = await supabase
    .from('google_calendar_tokens')
    .delete()
    .eq('user_id', auth.user.id);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to disconnect', message: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
});
