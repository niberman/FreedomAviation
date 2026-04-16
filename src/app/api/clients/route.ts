import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { API_ROLES } from '@/lib/roles';
import { getAppBaseUrl } from '@/lib/env';

export const GET = withAuth({ roles: API_ROLES.VIEW_CLIENTS }, async ({ supabase }) => {
  const { data: owners, error: ownersError } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, phone, role, created_at')
    .eq('role', 'owner')
    .order('created_at', { ascending: false });

  if (ownersError) {
    return NextResponse.json(
      { error: 'Failed to load clients', message: ownersError.message },
      { status: 500 },
    );
  }

  const { data: aircraftRows, error: aircraftError } = await supabase
    .from('aircraft')
    .select('owner_id');

  if (aircraftError) {
    return NextResponse.json(
      { error: 'Failed to load aircraft counts', message: aircraftError.message },
      { status: 500 },
    );
  }

  const aircraftCounts = new Map<string, number>();
  (aircraftRows ?? []).forEach((row: { owner_id: string | null }) => {
    if (row?.owner_id) {
      aircraftCounts.set(row.owner_id, (aircraftCounts.get(row.owner_id) ?? 0) + 1);
    }
  });

  const clients = (owners ?? []).map((owner) => ({
    ...owner,
    aircraft_count: aircraftCounts.get(owner.id) ?? 0,
  }));

  return NextResponse.json({ clients, total: clients.length });
});

export const POST = withAuth({ roles: API_ROLES.MANAGE_CLIENTS }, async ({ request, supabase }) => {
  const body = await request.json();
  const { email, full_name, phone, sendInvite = true } = body;

  if (!email || !full_name) {
    return NextResponse.json(
      { error: 'Missing required fields', message: 'Email and full name are required' },
      { status: 400 },
    );
  }

  const { data: inviteData, error: createError } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      redirectTo: `${getAppBaseUrl()}/dashboard`,
      data: { full_name, phone: phone || null },
    },
  });

  if (createError) {
    return NextResponse.json(
      { error: 'Failed to create user', message: createError.message },
      { status: 400 },
    );
  }

  const authUser = inviteData.user;
  if (!authUser) {
    return NextResponse.json(
      { error: 'User creation failed', message: 'No user data returned' },
      { status: 500 },
    );
  }

  const { error: updateError } = await supabase
    .from('user_profiles')
    .upsert(
      {
        id: authUser.id,
        email: authUser.email || email,
        full_name,
        phone: phone || null,
        role: 'owner',
      },
      { onConflict: 'id' },
    );

  if (updateError) {
    return NextResponse.json(
      {
        error: 'User created but profile update failed',
        message: updateError.message,
        userId: authUser.id,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: sendInvite
      ? 'Invitation sent! The user will receive an email to set their password.'
      : 'Client created successfully',
    user: {
      id: authUser.id,
      email: authUser.email,
      full_name,
      phone: phone || null,
    },
    inviteSent: sendInvite,
  });
});
