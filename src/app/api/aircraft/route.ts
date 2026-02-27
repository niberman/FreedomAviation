import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { requireRole } from '@/lib/api-auth';
import { API_ROLES } from '@/lib/roles';

export async function GET(request: NextRequest) {
  const result = await requireRole(request, [...API_ROLES.ALL_STAFF]);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.status === 401 ? 'Unauthorized' : result.status === 503 ? 'Service Unavailable' : 'Forbidden', message: result.message },
      { status: result.status }
    );
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const { data: aircraft, error: aircraftError } = await supabase
      .from('aircraft')
      .select(`
        id,
        tail_number,
        make,
        model,
        class,
        base_location,
        owner_id,
        has_tks,
        has_oxygen,
        owner:owner_id(id, full_name, email)
      `)
      .order('tail_number');

    if (aircraftError) {
      return NextResponse.json(
        { error: 'Failed to load aircraft', message: aircraftError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      aircraft: aircraft || [],
      total: aircraft?.length || 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Unexpected error in /api/aircraft:', err);
    return NextResponse.json(
      { error: 'Failed to load aircraft', message },
      { status: 500 }
    );
  }
}
