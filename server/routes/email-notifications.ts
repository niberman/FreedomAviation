import type { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { 
  generateServiceRequestEmailHTML, 
  generateServiceRequestEmailText,
  generateFlightInstructionEmailHTML,
  generateFlightInstructionEmailText
} from "../lib/service-request-email.js";

// Initialize Supabase admin client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("⚠️ Missing Supabase configuration for email notifications");
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Process email notification queue
 * This should be called periodically (via cron) or immediately after creating notifications
 */
export async function processEmailNotifications(req: Request, res: Response) {
  try {
    if (!supabase) {
      return res.status(503).json({ 
        error: "Email notification service not configured" 
      });
    }

    // Optional: Add authentication to protect this endpoint
    // For now, we'll use a simple API key check
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.EMAIL_NOTIFICATIONS_API_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log("📧 Processing email notification queue...");

    // Get pending notifications
    const { data: notifications, error: fetchError } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50); // Process up to 50 at a time

    if (fetchError) {
      console.error("Error fetching notifications:", fetchError);
      throw fetchError;
    }

    if (!notifications || notifications.length === 0) {
      return res.json({ 
        message: "No pending notifications to process",
        processed: 0 
      });
    }

    console.log(`Found ${notifications.length} pending notifications`);

    let processedCount = 0;
    let failedCount = 0;

    // Process each notification
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
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.id);
      }
    }

    res.json({
      message: "Email notifications processed",
      processed: processedCount,
      failed: failedCount,
      total: notifications.length
    });

  } catch (error) {
    console.error("Error processing email notifications:", error);
    res.status(500).json({ 
      error: "Failed to process email notifications",
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Process a single notification
 */
async function processNotification(notification: any) {
  const { type, recipient_role, data } = notification;

  // Get recipients based on role
  let recipients: { email: string; full_name: string }[] = [];

  if (recipient_role === 'ops') {
    const { data: opsUsers } = await supabase
      .rpc('get_ops_emails');
    recipients = opsUsers || [];
  } else if (recipient_role === 'cfi') {
    const { data: cfiUsers } = await supabase
      .rpc('get_cfi_emails');
    recipients = cfiUsers || [];
  }

  if (recipients.length === 0) {
    throw new Error(`No recipients found for role: ${recipient_role}`);
  }

  console.log(`Sending ${type} notification to ${recipients.length} ${recipient_role} users`);

  // Send email based on type
  if (type === 'service_request') {
    await sendServiceRequestEmails(recipients, data);
  } else if (type === 'instruction_request') {
    await sendInstructionRequestEmails(recipients, data);
  } else {
    throw new Error(`Unknown notification type: ${type}`);
  }

  // Mark as sent
  await supabase
    .from('email_notifications')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', notification.id);
}

/**
 * Send service request emails to all recipients
 */
async function sendServiceRequestEmails(
  recipients: { email: string; full_name: string }[], 
  data: any
) {
  const emailService = process.env.EMAIL_SERVICE || "console";
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (emailService === "console") {
    console.log(`[CONSOLE MODE] Would send service request emails to:`, recipients.map(r => r.email));
    console.log("Service request data:", data);
    return;
  }

  if (emailService === "resend" && !resendApiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const html = generateServiceRequestEmailHTML(data);
  const text = generateServiceRequestEmailText(data);
  const subject = `[${data.priority.toUpperCase()}] New Service Request - ${data.aircraft_tail_number}`;

  // Send to all recipients
  for (const recipient of recipients) {
    try {
      await sendEmail(recipient.email, subject, html, text);
      console.log(`✓ Sent service request email to ${recipient.email}`);
    } catch (error) {
      console.error(`✗ Failed to send to ${recipient.email}:`, error);
      throw error; // Re-throw to mark notification as failed
    }
  }
}

/**
 * Send instruction request emails to all recipients
 */
async function sendInstructionRequestEmails(
  recipients: { email: string; full_name: string }[], 
  data: any
) {
  const emailService = process.env.EMAIL_SERVICE || "console";
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (emailService === "console") {
    console.log(`[CONSOLE MODE] Would send instruction request emails to:`, recipients.map(r => r.email));
    console.log("Instruction request data:", data);
    return;
  }

  if (emailService === "resend" && !resendApiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const html = generateFlightInstructionEmailHTML(data);
  const text = generateFlightInstructionEmailText(data);
  const subject = `New Flight Instruction Request - ${data.student_name}`;

  // Send to all recipients
  for (const recipient of recipients) {
    try {
      await sendEmail(recipient.email, subject, html, text);
      console.log(`✓ Sent instruction request email to ${recipient.email}`);
    } catch (error) {
      console.error(`✗ Failed to send to ${recipient.email}:`, error);
      throw error; // Re-throw to mark notification as failed
    }
  }
}

/**
 * Send email using configured service
 */
async function sendEmail(to: string, subject: string, html: string, text: string) {
  const emailService = process.env.EMAIL_SERVICE || "console";
  
  if (emailService === "resend") {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not set");
    }

    const fromEmail = process.env.EMAIL_FROM || "Freedom Aviation <onboarding@resend.dev>";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
      } catch (e) {
        // Keep original error message
      }
      throw new Error(errorMessage);
    }
  }
}

/**
 * Webhook endpoint to immediately process notifications
 * Called by Supabase webhook when a notification is created
 */
export async function webhookProcessNotification(req: Request, res: Response) {
  try {
    // Verify webhook signature if configured
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
    if (webhookSecret) {
      // TODO: Implement webhook signature verification
      // For now, we'll skip this
    }

    const { record } = req.body;
    
    if (!record || record.status !== 'pending') {
      return res.json({ message: "No action needed" });
    }

    console.log(`📧 Webhook: Processing notification ${record.id} immediately`);

    await processNotification(record);
    
    res.json({ 
      message: "Notification processed",
      id: record.id 
    });

  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ 
      error: "Failed to process notification",
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
