import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { requireRole } from '@/lib/api-auth';
import { API_ROLES } from '@/lib/roles';
import { syncSlotToCalendar, isGoogleCalendarConfigured } from '@/lib/google-calendar';

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

  const { data: slots, error: slotsError } = await supabase
    .from('cfi_schedule')
    .select('*')
    .eq('cfi_id', result.auth.user.id);

  if (slotsError) {
    return NextResponse.json(
      { error: 'Failed to load slots', message: slotsError.message },
      { status: 500 }
    );
  }

  let synced = 0;
  let errors = 0;

  for (const slot of slots ?? []) {
    try {
      await syncSlotToCalendar(slot);
      synced++;
    } catch (err) {
      console.error(`Failed to sync slot ${slot.id}:`, err);
      errors++;
    }
  }

  await supabase
    .from('google_calendar_tokens')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('user_id', result.auth.user.id);

  return NextResponse.json({
    success: true,
    synced,
    errors,
    total: slots?.length ?? 0,
  });
}
