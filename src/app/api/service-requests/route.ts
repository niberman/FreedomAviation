import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { requireRole } from '@/lib/api-auth';
import { API_ROLES } from '@/lib/roles';

export async function GET(request: NextRequest) {
  const result = await requireRole(request, [...API_ROLES.ALL_STAFF]);
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
    return NextResponse.json({
      error: 'Supabase not configured',
      message: 'Server is missing required Supabase environment variables.',
    }, { status: 503 });
  }

  try {
    const { data: requests, error } = await supabase
      .from('service_requests')
      .select(`*, owner:user_id(full_name,email), aircraft:aircraft_id(tail_number)`)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    return NextResponse.json({ serviceRequests: requests || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in /api/service-requests:', err);
    return NextResponse.json({
      error: 'Failed to load service requests',
      message,
    }, { status: 500 });
  }
}
