import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { API_ROLES } from '@/lib/roles';
import { syncSlotToCalendar, isGoogleCalendarConfigured } from '@/lib/google-calendar';

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
    const slotId = body.slotId ?? body.slot_id;

    if (!slotId) {
      return NextResponse.json({ error: 'Missing slotId' }, { status: 400 });
    }

    const { data: slot, error: slotError } = await supabase
      .from('cfi_schedule')
      .select('*')
      .eq('id', slotId)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: 'Schedule slot not found' }, { status: 404 });
    }

    if (slot.cfi_id !== auth.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to sync this slot' },
        { status: 403 },
      );
    }

    const eventId = await syncSlotToCalendar(slot);
    return NextResponse.json({ success: true, eventId });
  },
);
