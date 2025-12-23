/**
 * Clients Routes
 * 
 * Handles client (owner) management endpoints:
 * - List all clients (staff only)
 * - Create new clients with invite emails
 */

import { Router, type Request, type Response } from 'express';
import { getAdminClient, isSupabaseAvailable } from '../lib/supabase-clients.js';
import { asyncHandler, ValidationError, ServiceUnavailableError, NotFoundError } from '../middleware/error-handler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { corsMiddleware, handlePreflight } from '../middleware/cors.js';
import { sendInviteEmail } from '../lib/email.js';
import { config } from '../config/env.js';

const router = Router();

// =============================================================================
// Routes
// =============================================================================

// CORS preflight
router.options('/*', handlePreflight);

/**
 * GET /api/clients
 * List all clients (owners) with aircraft counts
 * Staff roles only
 */
router.get('/', corsMiddleware, requireAuth, requireRole('admin', 'cfi', 'founder', 'ops'), asyncHandler(async (req: Request, res: Response) => {
  if (!isSupabaseAvailable()) {
    throw new ServiceUnavailableError('Supabase');
  }

  const supabase = getAdminClient();

  // Fetch all owners
  const { data: owners, error: ownersError } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, phone, role, created_at')
    .eq('role', 'owner')
    .order('created_at', { ascending: false });

  if (ownersError) {
    console.error('Error fetching owners:', ownersError);
    throw new Error('Failed to load clients');
  }

  // Fetch aircraft counts
  const { data: aircraftRows, error: aircraftError } = await supabase
    .from('aircraft')
    .select('owner_id');

  if (aircraftError) {
    console.error('Error fetching aircraft:', aircraftError);
  }

  // Count aircraft per owner
  const aircraftCounts = new Map<string, number>();
  (aircraftRows ?? []).forEach((row: { owner_id: string | null }) => {
    if (row?.owner_id) {
      aircraftCounts.set(row.owner_id, (aircraftCounts.get(row.owner_id) ?? 0) + 1);
    }
  });

  // Combine data
  const clients = (owners ?? []).map((owner) => ({
    ...owner,
    aircraft_count: aircraftCounts.get(owner.id) ?? 0,
  }));

  res.json({
    clients,
    total: clients.length,
  });
}));

/**
 * POST /api/clients/create
 * Create a new client and send invitation email
 * Admin, founder, or ops only
 */
router.post('/create', corsMiddleware, requireAuth, requireRole('admin', 'founder', 'ops'), asyncHandler(async (req: Request, res: Response) => {
  if (!isSupabaseAvailable()) {
    throw new ServiceUnavailableError('Supabase');
  }

  const supabase = getAdminClient();
  const { email, full_name, phone, sendInvite = true } = req.body;

  console.log('📧 Creating client:', { email, full_name, phone, sendInvite });

  if (!email || !full_name) {
    throw new ValidationError('Email and full name are required');
  }

  // Generate invite link using admin API
  const baseUrl = config.app.siteUrl || config.app.frontendUrl;

  console.log('🔗 Generating invite link for:', email);

  const { data: inviteData, error: createError } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      redirectTo: `${baseUrl}/dashboard`,
      data: {
        full_name,
        phone: phone || null,
      },
    },
  });

  if (createError) {
    console.error('❌ Error generating invite link:', createError);
    throw new Error(`Failed to create user: ${createError.message}`);
  }

  const authUser = inviteData.user;
  const actionLink = inviteData.properties?.action_link;

  if (!authUser) {
    console.error('❌ No user data returned from generateLink');
    throw new Error('User creation failed: No user data returned');
  }

  console.log('✅ User created successfully:', authUser.id);

  // Update user profile
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
      { onConflict: 'id' }
    );

  if (updateError) {
    console.error('Error updating user profile:', updateError);
    res.status(500).json({
      error: 'User created but profile update failed',
      message: updateError.message,
      userId: authUser.id,
    });
    return;
  }

  // Send invite email if requested
  if (sendInvite && actionLink) {
    try {
      console.log('📧 Sending custom invite email...');
      await sendInviteEmail({
        email,
        fullName: full_name,
        inviteUrl: actionLink,
      });
      console.log('✅ Custom invite email sent');
    } catch (emailError: unknown) {
      console.error('❌ Error sending custom invite email:', emailError);
      // Return success with warning
      res.json({
        success: true,
        message: 'Client created but email failed to send. Please send the invite link manually.',
        user: {
          id: authUser.id,
          email: authUser.email,
          full_name,
          phone: phone || null,
        },
        inviteLink: actionLink,
        inviteSent: false,
      });
      return;
    }
  }

  res.json({
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
}));

export default router;

