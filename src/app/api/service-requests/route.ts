import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { API_ROLES } from '@/lib/roles';

export const GET = withAuth({ roles: API_ROLES.ALL_STAFF }, async ({ supabase }) => {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*, owner:user_id(full_name,email), aircraft:aircraft_id(tail_number)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to load service requests', message: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ serviceRequests: data ?? [] });
});
