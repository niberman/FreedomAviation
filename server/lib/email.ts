/**
 * Email service for sending invoices
 * Uses SMTP or email service API
 */

interface InvoiceEmailData {
  invoiceNumber: string;
  ownerName: string;
  ownerEmail: string;
  invoiceId: string;
  ownerId: string;
  totalAmount: number;
  invoiceLines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  dueDate?: string | null;
  aircraftTailNumber?: string;
  paymentUrl?: string | null;
}

/**
 * Generate HTML email template for invoice
 */
function generateInvoiceEmailHTML(data: InvoiceEmailData): string {
  // Brand info (from client/src/brand/manifest.ts)
  const BRAND = {
    name: "Freedom Aviation",
    email: "info@freedomaviationco.com",
    phone: "(970) 618-2094",
    address: "7565 S Peoria St, Englewood, CO 80112",
  };
  
  const linesHTML = data.invoiceLines
    .map(
      (line) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(line.description)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${line.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${line.unitPrice.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${line.total.toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${data.invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; background-color: #1f2937; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Freedom Aviation</h1>
              <p style="margin: 8px 0 0; color: #d1d5db; font-size: 14px;">Colorado-Based. Front Range Focused.</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 24px; color: #111827; font-size: 20px; font-weight: 600;">Invoice ${escapeHtml(data.invoiceNumber)}</h2>
              
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.5;">
                Dear ${escapeHtml(data.ownerName)},
              </p>
              
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.5;">
                Please find your flight instruction invoice below.
              </p>
              
              ${data.aircraftTailNumber ? `<p style="margin: 0 0 24px; color: #4b5563; font-size: 14px;"><strong>Aircraft:</strong> ${escapeHtml(data.aircraftTailNumber)}</p>` : ""}
              
              <!-- Invoice Table -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Description</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Hours</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Rate</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${linesHTML}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding: 16px 12px; text-align: right; font-weight: 600; color: #111827; border-top: 2px solid #e5e7eb;">Total:</td>
                    <td style="padding: 16px 12px; text-align: right; font-weight: 600; color: #111827; font-size: 18px; border-top: 2px solid #e5e7eb;">$${data.totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              
              ${data.dueDate ? `<p style="margin: 16px 0 0; color: #6b7280; font-size: 14px;"><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ""}
              
              ${data.paymentUrl ? `
              <!-- Payment Button -->
              <div style="margin: 32px 0; text-align: center;">
                <a href="${data.paymentUrl}" style="display: inline-block; padding: 14px 32px; background-color: #1f2937; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; text-align: center;">
                  Pay Invoice ${escapeHtml(data.invoiceNumber)}
                </a>
              </div>
              <p style="margin: 16px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                Or copy and paste this link into your browser:<br>
                <a href="${data.paymentUrl}" style="color: #3b82f6; word-break: break-all;">${data.paymentUrl}</a>
              </p>
              ` : ""}
              
              <p style="margin: 32px 0 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                Thank you for your business!
              </p>
              
              <p style="margin: 24px 0 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                Best regards,<br>
                <strong>Freedom Aviation</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-align: center;">
                ${BRAND.email} | ${BRAND.phone}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                ${BRAND.address}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Send invoice email
 * Uses SMTP if configured, otherwise falls back to console logging
 */
export async function sendInvoiceEmail(data: InvoiceEmailData): Promise<void> {
  const emailService = process.env.EMAIL_SERVICE || "console"; // 'console', 'smtp', 'resend'
  
  const html = generateInvoiceEmailHTML(data);
  const text = `
Invoice ${data.invoiceNumber}

Dear ${data.ownerName},

Please find your flight instruction invoice below.

${data.invoiceLines.map(line => `${line.description} - ${line.quantity} hours @ $${line.unitPrice.toFixed(2)} = $${line.total.toFixed(2)}`).join('\n')}

Total: $${data.totalAmount.toFixed(2)}

${data.dueDate ? `Due Date: ${new Date(data.dueDate).toLocaleDateString()}` : ''}

${data.paymentUrl ? `
Pay Invoice: ${data.paymentUrl}
` : ''}

Thank you for your business!

Freedom Aviation
  `;

  switch (emailService) {
    case "console":
      // Development: just log
      console.log(`[CONSOLE MODE] Invoice email would be sent to ${data.ownerEmail} for invoice ${data.invoiceNumber}`);
      console.log("To actually send emails, set EMAIL_SERVICE=resend and RESEND_API_KEY");
      // Don't throw - console mode is valid for development
      return;

    case "smtp":
      // Use nodemailer for SMTP
      return sendViaSMTP(data.ownerEmail, `Invoice ${data.invoiceNumber} - Freedom Aviation`, html, text);

    case "resend":
      // Use Resend API
      return sendViaResend(data.ownerEmail, `Invoice ${data.invoiceNumber} - Freedom Aviation`, html, text);

    default:
      console.warn(`⚠️ Unknown email service: ${emailService}, using console mode`);
      console.warn(`⚠️ Valid options: 'console', 'resend', 'smtp'`);
      console.warn(`⚠️ Email will NOT be sent - only logged to console`);
      return;
  }
}

async function sendViaSMTP(to: string, subject: string, html: string, text: string): Promise<void> {
  // TODO: Implement nodemailer if needed
  // For now, just log
  console.log(`[SMTP] Email would be sent to ${to}: ${subject} (not implemented)`);
}

async function sendViaResend(to: string, subject: string, html: string, text: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("RESEND_API_KEY not set, cannot send email");
    throw new Error("RESEND_API_KEY environment variable is not set. Please configure it in your environment variables.");
  }

  // Use test domain if custom domain not verified, otherwise use configured EMAIL_FROM
  // Use Resend test domain if custom domain not verified
  // Default to test domain to avoid verification errors
  const fromEmail = process.env.EMAIL_FROM || "Freedom Aviation <onboarding@resend.dev>";
  
  // Check if using custom domain and provide helpful error if domain not verified
  if (fromEmail.includes("@freedomaviationco.com") && !fromEmail.includes("onboarding@resend.dev")) {
    console.warn("Using custom domain. Make sure freedomaviationco.com is verified in Resend.");
  }

  try {
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
      // Try to parse error for better message
      let errorMessage = `Resend API error (${response.status}): ${responseText}`;
      let errorJson: any = null;
      try {
        errorJson = JSON.parse(responseText);
        if (errorJson.message) {
          errorMessage = `Resend API error: ${errorJson.message}`;
        }
      } catch (e) {
        // Keep original error message
      }
      
      // Check if it's a domain verification error
      if (errorJson?.name === "validation_error" && errorJson?.message?.includes("domain is not verified")) {
        const helpfulMessage = `Domain not verified in Resend. The email address "${fromEmail}" uses a domain that hasn't been verified. 
        
To fix this:
1. Go to https://resend.com/domains and verify freedomaviationco.com, OR
2. Set EMAIL_FROM to use the test domain: "Freedom Aviation <onboarding@resend.dev>"

For now, update your Vercel environment variable EMAIL_FROM to: Freedom Aviation <onboarding@resend.dev>`;
        
        console.error("Domain verification error:", helpfulMessage);
        throw new Error(helpfulMessage);
      }
      
      throw new Error(errorMessage);
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse Resend response:", responseText);
      throw new Error(`Invalid JSON response from Resend: ${responseText}`);
    }
    
    if (!result.id) {
      console.warn("Warning: Resend response missing email ID");
    }
  } catch (error: any) {
    console.error("Failed to send invoice email via Resend:", error);
    
    // Provide helpful error message
    if (error.message?.includes("RESEND_API_KEY")) {
      throw new Error("Email service not configured. Please set RESEND_API_KEY environment variable. See EMAIL_SETUP.md for instructions.");
    }
    
    throw error;
  }
}

