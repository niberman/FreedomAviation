/**
 * Aircraft Routes
 * 
 * Handles aircraft management endpoints:
 * - List all aircraft (staff only)
 */

import { Router, type Request, type Response } from 'express';
import { getAdminClient, isSupabaseAvailable } from '../lib/supabase-clients.js';
import { asyncHandler, ServiceUnavailableError } from '../middleware/error-handler.js';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { corsMiddleware, handlePreflight } from '../middleware/cors.js';

const router = Router();

// =============================================================================
// Routes
// =============================================================================

// CORS preflight
router.options('/*', handlePreflight);

/**
 * GET /api/aircraft
 * List all aircraft with owner details
 * Staff roles only
 */
router.get('/', corsMiddleware, requireAuth, requireStaff, asyncHandler(async (req: Request, res: Response) => {
  if (!isSupabaseAvailable()) {
    throw new ServiceUnavailableError('Supabase');
  }

  const supabase = getAdminClient();

  // Fetch all aircraft with owner details
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
    console.error('Error fetching aircraft:', aircraftError);
    throw new Error('Failed to load aircraft');
  }

  res.json({
    aircraft: aircraft || [],
    total: aircraft?.length || 0,
  });
}));

export default router;

