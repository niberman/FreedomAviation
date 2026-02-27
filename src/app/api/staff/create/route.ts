import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { requireRole } from '@/lib/api-auth';
import { API_ROLES, STAFF_ROLES } from '@/lib/roles';
import type { UserRole } from '@shared/database-types';

export async function POST(request: NextRequest) {
  const result = await requireRole(request, [...API_ROLES.MANAGE_STAFF]);
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
      { error: 'Supabase not configured', message: 'Server is missing Supabase credentials' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { email, full_name, role = 'staff', sendInvite = true } = body;

    if (!email || !full_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields', message: 'Email, full name, and role are required' },
        { status: 400 }
      );
    }

    if (!STAFF_ROLES.includes(role as UserRole)) {
      return NextResponse.json(
        { error: 'Invalid role', message: `Role must be one of: ${STAFF_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    const baseUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.freedomaviationco.com';

    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: !sendInvite,
      user_metadata: { full_name, role },
    });

    if (createError) {
      console.error('Error creating staff member:', createError);
      return NextResponse.json(
        { error: 'Failed to create staff member', message: createError.message },
        { status: 400 }
      );
    }

    if (!createdUser?.user) {
      return NextResponse.json(
        { error: 'Failed to create staff member', message: 'No user returned' },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .upsert(
        {
          id: createdUser.user.id,
          email: createdUser.user.email || email,
          full_name,
          role,
        },
        { onConflict: 'id' }
      );

    if (updateError) {
      console.warn('Staff created but profile update failed:', updateError.message);
    }

    if (sendInvite) {
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${baseUrl}/onboarding`,
      });
      if (inviteError) {
        console.warn('Invite email not sent:', inviteError.message);
      }
    }

    return NextResponse.json(
      {
        success: true,
        user: createdUser.user,
        message: sendInvite ? 'Staff member created and invite email sent' : 'Staff member created',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error in /api/staff/create:', error);
    return NextResponse.json(
      {
        error: 'Failed to create staff member',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
