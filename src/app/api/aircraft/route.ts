import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { API_ROLES } from '@/lib/roles';

export const GET = withAuth({ roles: API_ROLES.ALL_STAFF }, async ({ supabase }) => {
  const { data, error } = await supabase
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

  if (error) {
    return NextResponse.json(
      { error: 'Failed to load aircraft', message: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ aircraft: data ?? [], total: data?.length ?? 0 });
});
