/**
 * Routes Index
 * 
 * Aggregates all route modules and exports a single router
 * to be mounted in the main application.
 */

import { Router, type Request, type Response } from 'express';
import billingRoutes from './billing.js';
import clientsRoutes from './clients.js';
import aircraftRoutes from './aircraft.js';
import staffRoutes from './staff.js';
import serviceRequestsRoutes from './service-requests.js';
import calendarRoutes from './calendar.js';
import invoicesRoutes from './invoices.js';
import emailNotificationsRoutes from './email-notifications.js';

const router = Router();

// =============================================================================
// Health Check & Test Routes
// =============================================================================

/**
 * GET /api/test
 * Simple health check endpoint
 */
router.get('/test', (_req: Request, res: Response) => {
  res.json({
    message: 'API routes are working!',
    timestamp: new Date().toISOString(),
  });
});

// =============================================================================
// Mount Route Modules
// =============================================================================

// Stripe billing routes
router.use('/stripe', billingRoutes);

// Client management
router.use('/clients', clientsRoutes);

// Aircraft management
router.use('/aircraft', aircraftRoutes);

// Staff management
router.use('/staff', staffRoutes);

// Service requests
router.use('/service-requests', serviceRequestsRoutes);

// Google Calendar integration
router.use('/google-calendar', calendarRoutes);

// Invoice management
router.use('/invoices', invoicesRoutes);

// Email notifications
router.use('/email-notifications', emailNotificationsRoutes);
router.use('/webhooks', emailNotificationsRoutes);

export default router;

