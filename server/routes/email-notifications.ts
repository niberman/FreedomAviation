/**
 * Email Notifications Routes
 * 
 * Handles email notification queue processing:
 * - Process pending notifications (cron/API)
 * - Webhook for immediate processing
 */

import { Router, type Request, type Response } from 'express';
import { getAdminClient, isSupabaseAvailable } from '../lib/supabase-clients.js';
import { asyncHandler, ServiceUnavailableError, AuthenticationError } from '../middleware/error-handler.js';
import { corsMiddleware, handlePreflight } from '../middleware/cors.js';
import { config } from '../config/env.js';
import {
  generateServiceRequestEmailHTML,
  generateServiceRequestEmailText,
  generateFlightInstructionEmailHTML,
  generateFlightInstructionEmailText,
} from '../lib/service-request-email.js';

const router = Router();

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Send email using configured service
 */
async function sendEmail(to: string, subject: string, html: string, text: string): Promise<void> {
  const emailService = config.email.service;

  if (emailService === 'resend') {
    const resendApiKey = config.email.resendApiKey;
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not set');
    }

    const fromEmail = config.email.from;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = `Resend API error (${response.status}): ${responseText}`;
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson.message) {
          errorMessage = `Resend API error: ${errorJson.message}`;
        }
      } catch {
        // Keep original error message
      }
      throw new Error(errorMessage);
    }
  }
}

/**
 * Process a single notification
 */
async function processNotification(notification: Record<string, unknown>): Promise<void> {
  const { type, recipient_role, data } = notification;

  if (!isSupabaseAvailable()) {
    throw new Error('Supabase client not initialized');
  }

  const supabase = getAdminClient();

  // Get recipients based on role
  let recipients: { email: string; full_name: string }[] = [];

  if (recipient_role === 'ops') {
    const { data: opsUsers } = await supabase.rpc('get_ops_emails');
    recipients = opsUsers || [];
  } else if (recipient_role === 'cfi') {
    const { data: cfiUsers } = await supabase.rpc('get_cfi_emails');
    recipients = cfiUsers || [];
  }

  if (recipients.length === 0) {
    throw new Error(`No recipients found for role: ${recipient_role}`);
  }

  console.log(`Sending ${type} notification to ${recipients.length} ${recipient_role} users`);

  const notificationData = data as Record<string, unknown>;

  // Send email based on type
  if (type === 'service_request') {
    await sendServiceRequestEmails(recipients, notificationData);
  } else if (type === 'instruction_request') {
    await sendInstructionRequestEmails(recipients, notificationData);
  } else {
    throw new Error(`Unknown notification type: ${type}`);
  }

  // Mark as sent
  await supabase
    .from('email_notifications')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', notification.id);
}

/**
 * Send service request emails
 */
async function sendServiceRequestEmails(
  recipients: { email: string; full_name: string }[],
  data: Record<string, unknown>
): Promise<void> {
  const emailService = config.email.service;

  if (emailService === 'console') {
    console.log('[CONSOLE MODE] Would send service request emails to:', recipients.map((r) => r.email));
    console.log('Service request data:', data);
    return;
  }

  if (emailService === 'resend' && !config.email.resendApiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const html = generateServiceRequestEmailHTML(data);
  const text = generateServiceRequestEmailText(data);
  const priority = (data.priority as string) || 'normal';
  const tailNumber = (data.aircraft_tail_number as string) || 'Unknown';
  const subject = `[${priority.toUpperCase()}] New Service Request - ${tailNumber}`;

  for (const recipient of recipients) {
    try {
      await sendEmail(recipient.email, subject, html, text);
      console.log(`Sent service request email to ${recipient.email}`);
    } catch (error) {
      console.error(`✗ Failed to send to ${recipient.email}:`, error);
      throw error;
    }
  }
}

/**
 * Send instruction request emails
 */
async function sendInstructionRequestEmails(
  recipients: { email: string; full_name: string }[],
  data: Record<string, unknown>
): Promise<void> {
  const emailService = config.email.service;

  if (emailService === 'console') {
    console.log('[CONSOLE MODE] Would send instruction request emails to:', recipients.map((r) => r.email));
    console.log('Instruction request data:', data);
    return;
  }

  if (emailService === 'resend' && !config.email.resendApiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const html = generateFlightInstructionEmailHTML(data);
  const text = generateFlightInstructionEmailText(data);
  const studentName = (data.student_name as string) || 'Unknown Student';
  const subject = `New Flight Instruction Request - ${studentName}`;

  for (const recipient of recipients) {
    try {
      await sendEmail(recipient.email, subject, html, text);
      console.log(`Sent instruction request email to ${recipient.email}`);
    } catch (error) {
      console.error(`✗ Failed to send to ${recipient.email}:`, error);
      throw error;
    }
  }
}

// =============================================================================
// Routes
// =============================================================================

// CORS preflight
router.options('/*', handlePreflight);

/**
 * POST /api/email-notifications/process
 * Process pending email notifications from the queue
 * Protected by API key
 */
router.post('/process', corsMiddleware, asyncHandler(async (req: Request, res: Response) => {
  if (!isSupabaseAvailable()) {
    throw new ServiceUnavailableError('Supabase');
  }

  // API key authentication
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== config.app.apiKeyEmailNotifications) {
    throw new AuthenticationError('Invalid API key');
  }

  const supabase = getAdminClient();

  console.log('Processing email notification queue...');

  // Get pending notifications
  const { data: notifications, error: fetchError } = await supabase
    .from('email_notifications')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(50);

  if (fetchError) {
    console.error('Error fetching notifications:', fetchError);
    throw fetchError;
  }

  if (!notifications || notifications.length === 0) {
    res.json({
      message: 'No pending notifications to process',
      processed: 0,
    });
    return;
  }

  console.log(`Found ${notifications.length} pending notifications`);

  let processedCount = 0;
  let failedCount = 0;

  for (const notification of notifications) {
    try {
      await processNotification(notification);
      processedCount++;
    } catch (error) {
      console.error(`Failed to process notification ${notification.id}:`, error);
      failedCount++;

      // Mark as failed
      await supabase
        .from('email_notifications')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', notification.id);
    }
  }

  res.json({
    message: 'Email notifications processed',
    processed: processedCount,
    failed: failedCount,
    total: notifications.length,
  });
}));

/**
 * POST /api/webhooks/email-notification
 * Webhook for immediate notification processing
 */
router.post('/email-notification', corsMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { record } = req.body;

  if (!record || record.status !== 'pending') {
    res.json({ message: 'No action needed' });
    return;
  }

  console.log(`Webhook: Processing notification ${record.id} immediately`);

  await processNotification(record);

  res.json({
    message: 'Notification processed',
    id: record.id,
  });
}));

export default router;
