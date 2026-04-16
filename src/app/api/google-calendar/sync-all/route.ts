import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { API_ROLES } from '@/lib/roles';
import { syncSlotToCalendar, isGoogleCalendarConfigured } from '@/lib/google-calendar';

export const POST = withAuth({ roles: API_ROLES.CALENDAR }, async ({ supabase, auth }) => {
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { error: 'Google Calendar not configured' },
      { status: 503 },
    );
  }

  const { data: slots, error: slotsError } = await supabase
    .from('cfi_schedule')
    .select('*')
    .eq('cfi_id', auth.user.id);

  if (slotsError) {
    return NextResponse.json(
      { error: 'Failed to load slots', message: slotsError.message },
      { status: 500 },
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
    .eq('user_id', auth.user.id);

  return NextResponse.json({
    success: true,
    synced,
    errors,
    total: slots?.length ?? 0,
  });
});
