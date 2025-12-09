/**
 * Service Requests Routes
 * 
 * Handles service request management:
 * - List service requests (staff only)
 * - Update service request status
 */

import { Router, type Request, type Response } from 'express';
import { getAdminClient, isSupabaseAvailable } from '../lib/supabase-clients.js';
import { asyncHandler, ValidationError, ServiceUnavailableError } from '../middleware/error-handler.js';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { corsMiddleware, handlePreflight } from '../middleware/cors.js';

const router = Router();

// =============================================================================
// Routes
// =============================================================================

// CORS preflight
router.options('/*', handlePreflight);

/**
 * GET /api/service-requests
 * List all service requests
 * Staff roles only
 */
router.get('/', corsMiddleware, requireAuth, requireStaff, asyncHandler(async (req: Request, res: Response) => {
  if (!isSupabaseAvailable()) {
    throw new ServiceUnavailableError('Supabase');
  }

  const supabase = getAdminClient();

  console.log('📋 Fetching service requests...');

  // Fetch recent service requests with owner & aircraft info
  const { data: requests, error } = await supabase
    .from('service_requests')
    .select(`*, owner:user_id(full_name, email), aircraft:aircraft_id(tail_number)`)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('❌ Error fetching service requests:', error);
    throw error;
  }

  console.log(`✅ Successfully fetched ${requests?.length || 0} service requests`);
  
  res.json({ serviceRequests: requests || [] });
}));

/**
 * PATCH /api/service-requests/:id
 * Update service request status or assignment
 * Staff roles only
 */
router.patch('/:id', corsMiddleware, requireAuth, requireStaff, asyncHandler(async (req: Request, res: Response) => {
  if (!isSupabaseAvailable()) {
    throw new ServiceUnavailableError('Supabase');
  }

  const supabase = getAdminClient();
  const { id } = req.params;
  const { status, assigned_to } = req.body;

  if (!id) {
    throw new ValidationError('Missing service request ID');
  }

  const updatePayload: Record<string, unknown> = {};
  if (status) updatePayload.status = status;
  if (assigned_to !== undefined) updatePayload.assigned_to = assigned_to;

  if (Object.keys(updatePayload).length === 0) {
    throw new ValidationError('No fields to update');
  }

  const { error } = await supabase
    .from('service_requests')
    .update(updatePayload)
    .eq('id', id);

  if (error) {
    console.error('❌ Error updating service request:', error);
    throw error;
  }

  res.json({ success: true });
}));

export default router;

