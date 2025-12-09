/**
 * Google Calendar Routes
 * 
 * Handles Google Calendar integration for CFIs:
 * - OAuth flow
 * - Calendar sync management
 * - Schedule slot syncing
 */

import { Router, type Request, type Response } from 'express';
import { getAdminClient, getAnonClient, isSupabaseAvailable } from '../lib/supabase-clients.js';
import { asyncHandler, ValidationError, ServiceUnavailableError } from '../middleware/error-handler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { corsMiddleware, handlePreflight } from '../middleware/cors.js';
import { config, isFeatureEnabled } from '../config/env.js';

const router = Router();

// =============================================================================
// Helper to check if Google Calendar is configured
// =============================================================================

function requireGoogleCalendar(): void {
  if (!isFeatureEnabled('googleCalendar')) {
    throw new ServiceUnavailableError('Google Calendar');
  }
}

// =============================================================================
// Routes
// =============================================================================

// CORS preflight
router.options('/*', handlePreflight);

/**
 * GET /api/google-calendar/auth-url
 * Get Google Calendar OAuth authorization URL
 * CFIs and admins only
 */
router.get('/auth-url', corsMiddleware, requireAuth, requireRole('admin', 'cfi', 'founder'), asyncHandler(async (req: Request, res: Response) => {
  requireGoogleCalendar();

  const { getAuthorizationUrl } = await import('../lib/google-calendar.js');
  const authUrl = getAuthorizationUrl();

  // Store user ID in state parameter
  const stateParam = Buffer.from(JSON.stringify({ userId: req.user!.id })).toString('base64');
  const urlWithState = `${authUrl}&state=${stateParam}`;

  res.json({ authUrl: urlWithState });
}));

/**
 * GET /api/google-calendar/callback
 * OAuth callback handler
 */
router.get('/callback', asyncHandler(async (req: Request, res: Response) => {
  requireGoogleCalendar();

  const { code, state } = req.query;

  if (!code || typeof code !== 'string') {
    res.status(400).send('Missing authorization code');
    return;
  }

  if (!isSupabaseAvailable()) {
    throw new ServiceUnavailableError('Supabase');
  }

  const supabase = getAdminClient();

  // Decode state to get user ID
  const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
  const userId = stateData.userId;

  const { getTokensFromCode } = await import('../lib/google-calendar.js');
  const tokens = await getTokensFromCode(code);

  // Store tokens in database
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

  if (error) throw error;

  // Redirect back to dashboard
  res.redirect('/staff-dashboard?calendar_connected=true');
}));

/**
 * GET /api/google-calendar/status
 * Check if user has Google Calendar connected
 */
router.get('/status', corsMiddleware, asyncHandler(async (req: Request, res: Response) => {
  // Return graceful response if not configured
  if (!isFeatureEnabled('googleCalendar')) {
    res.json({
      connected: false,
      syncEnabled: false,
      featureAvailable: false,
      message: 'Google Calendar integration not configured',
    });
    return;
  }

  if (!isSupabaseAvailable()) {
    res.json({
      connected: false,
      syncEnabled: false,
      featureAvailable: false,
      message: 'Supabase not configured',
    });
    return;
  }

  const supabaseAnon = getAnonClient();
  const supabase = getAdminClient();

  // Check authorization
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    res.json({
      connected: false,
      syncEnabled: false,
      featureAvailable: false,
      message: 'Not authenticated',
    });
    return;
  }

  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
  if (authError || !user) {
    res.json({
      connected: false,
      syncEnabled: false,
      featureAvailable: false,
      message: 'Not authenticated',
    });
    return;
  }

  // Check if calendar is connected
  const { data: tokenData, error: tokenError } = await supabase
    .from('google_calendar_tokens')
    .select('sync_enabled, last_sync_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (tokenError) {
    console.warn('Google Calendar tokens table not accessible:', tokenError.message);
    res.json({
      connected: false,
      syncEnabled: false,
      featureAvailable: false,
      message: 'Google Calendar feature not set up',
    });
    return;
  }

  res.json({
    connected: !!tokenData,
    syncEnabled: tokenData?.sync_enabled || false,
    featureAvailable: true,
  });
}));

/**
 * POST /api/google-calendar/disconnect
 * Disconnect Google Calendar
 */
router.post('/disconnect', corsMiddleware, requireAuth, asyncHandler(async (req: Request, res: Response) => {
  requireGoogleCalendar();

  if (!isSupabaseAvailable()) {
    throw new ServiceUnavailableError('Supabase');
  }

  const supabase = getAdminClient();

  const { error } = await supabase
    .from('google_calendar_tokens')
    .delete()
    .eq('user_id', req.user!.id);

  if (error) throw error;

  res.json({ success: true });
}));

/**
 * POST /api/google-calendar/toggle-sync
 * Enable/disable automatic sync
 */
router.post('/toggle-sync', corsMiddleware, requireAuth, asyncHandler(async (req: Request, res: Response) => {
  requireGoogleCalendar();

  if (!isSupabaseAvailable()) {
    throw new ServiceUnavailableError('Supabase');
  }

  const supabase = getAdminClient();
  const { enabled } = req.body;

  const { error } = await supabase
    .from('google_calendar_tokens')
    .update({ sync_enabled: enabled })
    .eq('user_id', req.user!.id);

  if (error) throw error;

  res.json({ success: true, enabled });
}));

/**
 * POST /api/google-calendar/sync-slot
 * Manually sync a schedule slot to Google Calendar
 */
router.post('/sync-slot', corsMiddleware, requireAuth, asyncHandler(async (req: Request, res: Response) => {
  requireGoogleCalendar();

  if (!isSupabaseAvailable()) {
    throw new ServiceUnavailableError('Supabase');
  }

  const supabase = getAdminClient();
  const { slotId } = req.body;

  if (!slotId) {
    throw new ValidationError('Missing slotId');
  }

  // Fetch slot
  const { data: slot, error: slotError } = await supabase
    .from('cfi_schedule')
    .select('*')
    .eq('id', slotId)
    .single();

  if (slotError || !slot) {
    throw new Error('Schedule slot not found');
  }

  // Verify user owns this slot
  if (slot.cfi_id !== req.user!.id) {
    throw new Error('Unauthorized to sync this slot');
  }

  const { syncSlotToCalendar } = await import('../lib/google-calendar.js');
  const eventId = await syncSlotToCalendar(slot);

  res.json({ success: true, eventId });
}));

/**
 * POST /api/google-calendar/sync-all
 * Sync all schedule slots for a user to Google Calendar
 */
router.post('/sync-all', corsMiddleware, requireAuth, asyncHandler(async (req: Request, res: Response) => {
  requireGoogleCalendar();

  if (!isSupabaseAvailable()) {
    throw new ServiceUnavailableError('Supabase');
  }

  const supabase = getAdminClient();
  const userId = req.user!.id;

  // Fetch all user's slots
  const { data: slots, error: slotsError } = await supabase
    .from('cfi_schedule')
    .select('*')
    .eq('cfi_id', userId);

  if (slotsError) throw slotsError;

  const { syncSlotToCalendar } = await import('../lib/google-calendar.js');

  let synced = 0;
  let errors = 0;

  for (const slot of slots || []) {
    try {
      await syncSlotToCalendar(slot);
      synced++;
    } catch (err) {
      console.error(`Failed to sync slot ${slot.id}:`, err);
      errors++;
    }
  }

  // Update last sync time
  await supabase
    .from('google_calendar_tokens')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('user_id', userId);

  res.json({ success: true, synced, errors, total: slots?.length || 0 });
}));

/**
 * GET /api/google-calendar/calendars
 * Get list of user's Google Calendars
 */
router.get('/calendars', corsMiddleware, requireAuth, asyncHandler(async (req: Request, res: Response) => {
  requireGoogleCalendar();

  const { getUserCalendars } = await import('../lib/google-calendar.js');
  const calendars = await getUserCalendars(req.user!.id);

  res.json({ calendars });
}));

/**
 * POST /api/google-calendar/select-calendar
 * Select which calendar to use for syncing
 */
router.post('/select-calendar', corsMiddleware, requireAuth, asyncHandler(async (req: Request, res: Response) => {
  requireGoogleCalendar();

  if (!isSupabaseAvailable()) {
    throw new ServiceUnavailableError('Supabase');
  }

  const supabase = getAdminClient();
  const { calendarId } = req.body;

  if (!calendarId) {
    throw new ValidationError('Missing calendarId');
  }

  const { error } = await supabase
    .from('google_calendar_tokens')
    .update({ calendar_id: calendarId })
    .eq('user_id', req.user!.id);

  if (error) throw error;

  res.json({ success: true });
}));

export default router;

