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

  const body = await request.json().catch(() => ({}));
  const slotId = body.slotId ?? body.slot_id;

  if (!slotId) {
    return NextResponse.json(
      { error: 'Missing slotId' },
      { status: 400 }
    );
  }

  const { data: slot, error: slotError } = await supabase
    .from('cfi_schedule')
    .select('*')
    .eq('id', slotId)
    .single();

  if (slotError || !slot) {
    return NextResponse.json(
      { error: 'Schedule slot not found' },
      { status: 404 }
    );
  }

  if (slot.cfi_id !== result.auth.user.id) {
    return NextResponse.json(
      { error: 'Unauthorized to sync this slot' },
      { status: 403 }
    );
  }

  try {
    const eventId = await syncSlotToCalendar(slot);
    return NextResponse.json({ success: true, eventId });
  } catch (err) {
    console.error('Sync slot error:', err);
    return NextResponse.json(
      { error: 'Failed to sync slot', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
