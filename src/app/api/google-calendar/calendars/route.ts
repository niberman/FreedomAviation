import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { API_ROLES } from '@/lib/roles';
import { getUserCalendars, isGoogleCalendarConfigured } from '@/lib/google-calendar';

export const GET = withAuth({ roles: API_ROLES.CALENDAR }, async ({ auth }) => {
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { error: 'Google Calendar not configured' },
      { status: 503 },
    );
  }

  const calendars = await getUserCalendars(auth.user.id);
  return NextResponse.json({ calendars });
});
