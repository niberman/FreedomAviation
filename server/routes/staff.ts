/**
 * Staff Routes
 * 
 * Handles staff management endpoints:
 * - Create staff members
 */

import { Router, type Request, type Response } from 'express';
import { getAdminClient, isSupabaseAvailable } from '../lib/supabase-clients.js';
import { asyncHandler, ValidationError, ServiceUnavailableError } from '../middleware/error-handler.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { corsMiddleware, handlePreflight } from '../middleware/cors.js';
import { config } from '../config/env.js';
import type { UserRole } from '../../shared/database-types.js';

const router = Router();

// Valid staff roles
const VALID_STAFF_ROLES: UserRole[] = ['staff', 'ops', 'cfi', 'admin', 'founder'];

// =============================================================================
// Routes
// =============================================================================

// CORS preflight
router.options('/*', handlePreflight);

/**
 * POST /api/staff/create
 * Create a new staff member
 * Admin or founder only
 */
router.post('/create', corsMiddleware, requireAuth, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  if (!isSupabaseAvailable()) {
    throw new ServiceUnavailableError('Supabase');
  }

  const supabase = getAdminClient();
  const { email, full_name, role = 'staff', sendInvite = true } = req.body;

  if (!email || !full_name || !role) {
    throw new ValidationError('Email, full name, and role are required');
  }

  // Validate role
  if (!VALID_STAFF_ROLES.includes(role as UserRole)) {
    throw new ValidationError(`Role must be one of: ${VALID_STAFF_ROLES.join(', ')}`);
  }

  console.log(`📝 Creating staff member: ${email} with role: ${role}`);

  // Create user using admin API
  const baseUrl = config.app.siteUrl || config.app.frontendUrl;
  const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: !sendInvite, // If not sending invite, auto-confirm
    user_metadata: {
      full_name,
      role,
    },
  });

  if (createError) {
    console.error('❌ Error creating staff member:', createError);
    throw new Error(`Failed to create staff member: ${createError.message}`);
  }

  if (!createdUser || !createdUser.user) {
    throw new Error('Failed to create staff member: No user returned');
  }

  // Update user profile with role
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
    console.error('❌ Error updating staff profile:', updateError);
    console.warn('⚠️  Staff created but profile role not updated');
  }

  // Send invite email if requested
  if (sendInvite) {
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${baseUrl}/onboarding`,
    });

    if (inviteError) {
      console.error('❌ Error sending invite email:', inviteError);
      console.warn('⚠️  Staff created but invite email not sent');
    }
  }

  console.log('✅ Staff member created successfully:', {
    userId: createdUser.user.id,
    email: createdUser.user.email,
    role,
  });

  res.status(201).json({
    success: true,
    user: createdUser.user,
    message: sendInvite ? 'Staff member created and invite email sent' : 'Staff member created',
  });
}));

export default router;

