import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { API_ROLES } from '@/lib/roles';
import { getAuthorizationUrl, isGoogleCalendarConfigured } from '@/lib/google-calendar';

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

  const authUrl = getAuthorizationUrl();
  const stateParam = Buffer.from(JSON.stringify({ userId: result.auth.user.id })).toString('base64');
  const urlWithState = `${authUrl}&state=${stateParam}`;

  return NextResponse.json({ authUrl: urlWithState });
}
