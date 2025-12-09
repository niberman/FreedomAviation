import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  : null;

const supabaseAnon = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  : null;

export async function GET(request: NextRequest) {
  try {
    if (!supabase || !supabaseAnon) {
      return NextResponse.json({
        error: 'Supabase not configured',
        message: 'Server is missing required Supabase environment variables.',
      }, { status: 503 });
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Missing authorization token. Please log in.',
      }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired token. Please log in again.',
      }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({
        error: 'Failed to verify permissions',
        message: profileError.message,
      }, { status: 500 });
    }

    if (!profile || !['admin', 'cfi', 'staff', 'founder', 'ops'].includes(profile.role)) {
      return NextResponse.json({
        error: 'Forbidden',
        message: "You don't have permission to access this resource.",
      }, { status: 403 });
    }

    const { data: requests, error } = await supabase
      .from('service_requests')
      .select(`*, owner:user_id(full_name,email), aircraft:aircraft_id(tail_number)`)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    return NextResponse.json({ serviceRequests: requests || [] });
  } catch (err: any) {
    console.error('Error in /api/service-requests:', err);
    return NextResponse.json({
      error: 'Failed to load service requests',
      message: err.message,
    }, { status: 500 });
  }
}

