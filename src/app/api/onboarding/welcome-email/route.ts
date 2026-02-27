import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase-server';
import { sendWelcomeEmail } from '@/lib/welcome-email';

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let monthlyRate = 0;
    let membershipTier = 'Member';
    let aircraftTailNumber: string | undefined;
    let aircraftDetails: string | undefined;
    let hangarLocation: string | undefined;

    try {
      const { data: membership } = await supabase
        .from('memberships')
        .select('tier, aircraft_id, tier_id')
        .eq('owner_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (membership?.tier) {
        membershipTier = membership.tier;
      }
      if (membership?.tier_id) {
        const { data: tierData } = await supabase
          .from('membership_tiers')
          .select('name, base_price')
          .eq('id', membership.tier_id)
          .single();
        if (tierData) {
          membershipTier = tierData.name;
          monthlyRate = Number(tierData.base_price) || 0;
        }
      }
      if (membership?.aircraft_id) {
        const { data: aircraft } = await supabase
          .from('aircraft')
          .select('tail_number, make, model, year')
          .eq('id', membership.aircraft_id)
          .single();
        if (aircraft) {
          aircraftTailNumber = aircraft.tail_number ?? undefined;
          aircraftDetails = `${aircraft.year ?? ''} ${aircraft.make ?? ''} ${aircraft.model ?? ''}`.trim() || undefined;
        }
      }

      const { data: hangarRes } = await supabase
        .from('hangar_reservations')
        .select('hangar_id, hangar_spaces(name, location)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (hangarRes?.hangar_spaces) {
        const space = Array.isArray(hangarRes.hangar_spaces) ? hangarRes.hangar_spaces[0] : hangarRes.hangar_spaces;
        if (space && typeof space === 'object' && 'location' in space && 'name' in space) {
          hangarLocation = `${(space as { location: string }).location} - ${(space as { name: string }).name}`;
        }
      }
    } catch {
      // Optional: memberships, tiers, aircraft, hangar tables may be dropped; continue with user_profiles only
    }

    await sendWelcomeEmail({
      memberName: userProfile.full_name || userProfile.email?.split('@')[0] || 'Member',
      memberEmail: userProfile.email ?? '',
      membershipTier,
      monthlyRate,
      aircraftTailNumber,
      aircraftDetails,
      hangarLocation,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json(
      {
        error: 'Failed to send welcome email',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
