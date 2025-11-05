/**
 * Email service for sending invoices
 * Uses SMTP or email service API
 */

interface InvoiceEmailData {
  invoiceNumber: string;
  ownerName: string;
  ownerEmail: string;
  invoiceId: string;
  totalAmount: number;
  invoiceLines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  dueDate?: string | null;
  aircraftTailNumber?: string;
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
  
  console.log("📧 Email service configured:", emailService);
  console.log("📧 RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);
  console.log("📧 EMAIL_FROM:", process.env.EMAIL_FROM || "not set");
  
  const html = generateInvoiceEmailHTML(data);
  const text = `
Invoice ${data.invoiceNumber}

Dear ${data.ownerName},

Please find your flight instruction invoice below.

${data.invoiceLines.map(line => `${line.description} - ${line.quantity} hours @ $${line.unitPrice.toFixed(2)} = $${line.total.toFixed(2)}`).join('\n')}

Total: $${data.totalAmount.toFixed(2)}

${data.dueDate ? `Due Date: ${new Date(data.dueDate).toLocaleDateString()}` : ''}

Thank you for your business!

Freedom Aviation
  `;

  switch (emailService) {
    case "console":
      // Development: just log
      console.log("📧 INVOICE EMAIL (would send):");
      console.log("To:", data.ownerEmail);
      console.log("Subject:", `Invoice ${data.invoiceNumber} - Freedom Aviation`);
      console.log("HTML:", html);
      return;

    case "smtp":
      // Use nodemailer for SMTP
      return sendViaSMTP(data.ownerEmail, `Invoice ${data.invoiceNumber} - Freedom Aviation`, html, text);

    case "resend":
      // Use Resend API
      return sendViaResend(data.ownerEmail, `Invoice ${data.invoiceNumber} - Freedom Aviation`, html, text);

    default:
      console.warn(`Unknown email service: ${emailService}, using console`);
      return;
  }
}

async function sendViaSMTP(to: string, subject: string, html: string, text: string): Promise<void> {
  // TODO: Implement nodemailer if needed
  // For now, just log
  console.log("📧 SMTP email (not implemented, using console):");
  console.log("To:", to);
  console.log("Subject:", subject);
}

async function sendViaResend(to: string, subject: string, html: string, text: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("❌ RESEND_API_KEY not set, cannot send email");
    throw new Error("RESEND_API_KEY environment variable is not set");
  }

  const fromEmail = process.env.EMAIL_FROM || "Freedom Aviation <invoices@freedomaviationco.com>";
  
  console.log("📧 Sending email via Resend:");
  console.log("  From:", fromEmail);
  console.log("  To:", to);
  console.log("  Subject:", subject);
  console.log("  API Key present:", !!resendApiKey);

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
      console.error("❌ Resend API error response:", response.status, responseText);
      throw new Error(`Resend API error (${response.status}): ${responseText}`);
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ Failed to parse Resend response:", responseText);
      throw new Error(`Invalid JSON response from Resend: ${responseText}`);
    }
    
    console.log("✅ Invoice email sent successfully via Resend");
    console.log("  Email ID:", result.id);
    console.log("  Response:", JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error("❌ Failed to send invoice email via Resend:");
    console.error("  Error:", error.message);
    console.error("  Stack:", error.stack);
    throw error;
  }
}

