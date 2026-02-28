import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase-server';
import { getTokensFromCode, isGoogleCalendarConfigured } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.redirect(new URL('/staff?calendar_error=not_configured', request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.redirect(new URL('/staff?calendar_error=missing_code', request.url));
  }

  if (!state) {
    return NextResponse.redirect(new URL('/staff?calendar_error=missing_state', request.url));
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL('/staff?calendar_error=config', request.url));
  }

  let userId: string;
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    userId = stateData.userId;
    if (!userId) throw new Error('Missing userId');
  } catch {
    return NextResponse.redirect(new URL('/staff?calendar_error=invalid_state', request.url));
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.redirect(new URL('/staff?calendar_error=config', request.url));
  }

  let tokens;
  try {
    tokens = await getTokensFromCode(code);
  } catch (err) {
    console.error('Google Calendar token exchange error:', err);
    return NextResponse.redirect(new URL('/staff?calendar_error=token', request.url));
  }

  const { error } = await supabase
    .from('google_calendar_tokens')
    .upsert(
      {
        user_id: userId,
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token || null,
        token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        sync_enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('Google Calendar callback error:', error);
    return NextResponse.redirect(new URL('/staff?calendar_error=save', request.url));
  }

  const base = request.nextUrl.origin;
  return NextResponse.redirect(`${base}/staff?calendar_connected=true`);
}
