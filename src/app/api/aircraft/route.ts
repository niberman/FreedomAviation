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
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
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

    if (!['admin', 'staff', 'founder', 'cfi', 'ops'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions. Required role: admin, staff, founder, cfi, or ops.' },
        { status: 403 }
      );
    }

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
  } catch (error: any) {
    console.error('Unexpected error in /api/aircraft:', error);
    return NextResponse.json(
      { error: 'Failed to load aircraft', message: error?.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
}


















