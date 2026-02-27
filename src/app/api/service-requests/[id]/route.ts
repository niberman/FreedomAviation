import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { requireRole } from '@/lib/api-auth';
import { API_ROLES } from '@/lib/roles';
import type { ServiceStatus } from '@shared/database-types';

const ALLOWED_STATUSES: ServiceStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id: requestId } = await params;
  if (!requestId) {
    return NextResponse.json({
      error: 'Bad request',
      message: 'Missing service request ID.',
    }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({
      error: 'Supabase not configured',
      message: 'Server is missing required Supabase environment variables.',
    }, { status: 503 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const status = body?.status as string | undefined;

    if (!status || !ALLOWED_STATUSES.includes(status as ServiceStatus)) {
      return NextResponse.json({
        error: 'Bad request',
        message: `status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('service_requests')
      .update({ status: status as ServiceStatus, updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        error: 'Failed to update service request',
        message: error.message,
      }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in PATCH /api/service-requests/[id]:', err);
    return NextResponse.json({
      error: 'Failed to update service request',
      message,
    }, { status: 500 });
  }
}
