import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { API_ROLES } from '@/lib/roles';
import type { ServiceStatus } from '@shared/database-types';

const ALLOWED_STATUSES: ServiceStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

export const PATCH = withAuth(
  { roles: API_ROLES.ALL_STAFF },
  async ({ request, supabase, params }) => {
    const requestId = params?.id;
    if (!requestId) {
      return NextResponse.json(
        { error: 'Bad request', message: 'Missing service request ID.' },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const status = body?.status as string | undefined;

    if (!status || !ALLOWED_STATUSES.includes(status as ServiceStatus)) {
      return NextResponse.json(
        {
          error: 'Bad request',
          message: `status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
        },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('service_requests')
      .update({ status: status as ServiceStatus, updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update service request', message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  },
);
