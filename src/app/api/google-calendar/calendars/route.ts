import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { API_ROLES } from '@/lib/roles';
import { getUserCalendars, isGoogleCalendarConfigured } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
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

  try {
    const calendars = await getUserCalendars(result.auth.user.id);
    return NextResponse.json({ calendars });
  } catch (err) {
    console.error('Get calendars error:', err);
    return NextResponse.json(
      { error: 'Failed to load calendars', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
