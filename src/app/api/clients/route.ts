import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  : null;

const supabaseAnon = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  : null;

export async function GET(request: NextRequest) {
  try {
    if (!supabase || !supabaseAnon) {
      return NextResponse.json(
        { error: 'Supabase not configured', message: 'Server is missing Supabase credentials' },
        { status: 503 }
      );
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing authorization token' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile', message: profileError.message },
        { status: 500 }
      );
    }

    if (!profile || !profile.role) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'User profile not found or role missing' },
        { status: 403 }
      );
    }

    if (!['admin', 'cfi', 'founder', 'ops'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { data: owners, error: ownersError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, phone, role, created_at')
      .eq('role', 'owner')
      .order('created_at', { ascending: false });

    if (ownersError) {
      return NextResponse.json(
        { error: 'Failed to load clients', message: ownersError.message },
        { status: 500 }
      );
    }

    const { data: aircraftRows, error: aircraftError } = await supabase
      .from('aircraft')
      .select('owner_id');

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
  } catch (error: any) {
    console.error('Unexpected error in /api/clients:', error);
    return NextResponse.json(
      { error: 'Failed to load clients', message: error?.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase || !supabaseAnon) {
      return NextResponse.json(
        { error: 'Supabase not configured', message: 'Server is missing Supabase credentials' },
        { status: 503 }
      );
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing authorization token' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !['admin', 'founder', 'ops'].includes(profile?.role || '')) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions. Only admins can create clients.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, full_name, phone, sendInvite = true } = body;

    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Missing required fields', message: 'Email and full name are required' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.freedomaviationco.com';

    const { data: inviteData, error: createError } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        redirectTo: `${baseUrl}/dashboard`,
        data: {
          full_name,
          phone: phone || null,
        }
      }
    });

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create user', message: createError.message },
        { status: 400 }
      );
    }

    const authUser = inviteData.user;

    if (!authUser) {
      return NextResponse.json(
        { error: 'User creation failed', message: 'No user data returned' },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .upsert({
        id: authUser.id,
        email: authUser.email || email,
        full_name,
        phone: phone || null,
        role: 'owner',
      }, {
        onConflict: 'id'
      });

    if (updateError) {
      return NextResponse.json({
        error: 'User created but profile update failed',
        message: updateError.message,
        userId: authUser.id
      }, { status: 500 });
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
  } catch (error: any) {
    console.error('Error in /api/clients POST:', error);
    return NextResponse.json(
      { error: 'Failed to create client', message: error?.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
















