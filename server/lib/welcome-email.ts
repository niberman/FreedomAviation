/**
 * Welcome email service for new members
 * Sends onboarding emails with membership details
 */

interface WelcomeEmailData {
  memberName: string;
  memberEmail: string;
  membershipTier: string;
  monthlyRate: number;
  aircraftTailNumber?: string;
  aircraftDetails?: string;
  hangarLocation?: string;
}

/**
 * Generate HTML email template for welcome message
 */
function generateWelcomeEmailHTML(data: WelcomeEmailData): string {
  // Brand info (from client/src/brand/manifest.ts)
  const BRAND = {
    name: "Freedom Aviation",
    email: "info@freedomaviationco.com",
    phone: "(970) 618-2094",
    address: "7565 S Peoria St, Englewood, CO 80112",
  };
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Freedom Aviation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; background-color: #1f2937; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; text-align: center;">Welcome to Freedom Aviation!</h1>
              <p style="margin: 8px 0 0; color: #d1d5db; font-size: 16px; text-align: center;">Your premium aircraft management journey begins now</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 24px; color: #111827; font-size: 20px; font-weight: 600;">Hello ${escapeHtml(data.memberName)},</h2>
              
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Welcome to the Freedom Aviation family! We're thrilled to have you as our newest ${escapeHtml(data.membershipTier)} member. 
                Your aircraft is in excellent hands, and we're committed to providing you with exceptional service.
              </p>
              
              <!-- Membership Details -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0; background-color: #f9fafb; border-radius: 6px;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 16px; color: #111827; font-size: 18px; font-weight: 600;">Your Membership Details</h3>
                    
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Membership Tier:</td>
                        <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">${escapeHtml(data.membershipTier)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Monthly Rate:</td>
                        <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">$${data.monthlyRate}/month</td>
                      </tr>
                      ${data.aircraftTailNumber ? `
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Aircraft:</td>
                        <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">${escapeHtml(data.aircraftTailNumber)}</td>
                      </tr>
                      ` : ''}
                      ${data.aircraftDetails ? `
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Details:</td>
                        <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">${escapeHtml(data.aircraftDetails)}</td>
                      </tr>
                      ` : ''}
                      ${data.hangarLocation && data.hangarLocation !== 'none' ? `
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Hangar:</td>
                        <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">${escapeHtml(data.hangarLocation)}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- What's Next -->
              <h3 style="margin: 32px 0 16px; color: #111827; font-size: 18px; font-weight: 600;">What Happens Next?</h3>
              
              <div style="margin: 0 0 24px;">
                <div style="margin: 0 0 16px; padding-left: 24px;">
                  <p style="margin: 0 0 4px; color: #111827; font-weight: 600;">📅 Schedule Your First Service</p>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">Log in to your dashboard to request maintenance or aircraft preparation services.</p>
                </div>
                
                <div style="margin: 0 0 16px; padding-left: 24px;">
                  <p style="margin: 0 0 4px; color: #111827; font-weight: 600;">✈️ Track Maintenance</p>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">We'll help you stay on top of all required maintenance items and compliance.</p>
                </div>
                
                <div style="margin: 0 0 16px; padding-left: 24px;">
                  <p style="margin: 0 0 4px; color: #111827; font-weight: 600;">📞 24/7 Support</p>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">${data.membershipTier === 'Class III' ? 'Your concierge team is ready to assist you anytime.' : 'Our team is here whenever you need assistance.'}</p>
                </div>
              </div>
              
              <!-- CTA Button -->
              <div style="margin: 32px 0; text-align: center;">
                <a href="https://www.freedomaviationco.com/dashboard" style="display: inline-block; padding: 16px 32px; background-color: #1f2937; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Go to Your Dashboard
                </a>
              </div>
              
              <p style="margin: 24px 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                If you have any questions or need assistance getting started, don't hesitate to reach out. 
                We're here to ensure your aircraft ownership experience is smooth and worry-free.
              </p>
              
              <p style="margin: 24px 0 0; color: #4b5563; font-size: 16px;">
                Blue skies ahead,<br>
                <strong>The Freedom Aviation Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-align: center;">
                ${BRAND.email} | ${BRAND.phone}
              </p>
              <p style="margin: 0 0 8px; color: #9ca3af; font-size: 12px; text-align: center;">
                ${BRAND.address}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                <a href="https://www.freedomaviationco.com/dashboard" style="color: #3b82f6;">Dashboard</a> | 
                <a href="https://www.freedomaviationco.com/contact" style="color: #3b82f6;">Contact</a> | 
                <a href="https://www.freedomaviationco.com/about" style="color: #3b82f6;">About</a>
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
 * Send welcome email to new member
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  const emailService = process.env.EMAIL_SERVICE || "console";
  
  const html = generateWelcomeEmailHTML(data);
  const text = `
Welcome to Freedom Aviation!

Hello ${data.memberName},

Welcome to the Freedom Aviation family! We're thrilled to have you as our newest ${data.membershipTier} member.

Your Membership Details:
- Membership Tier: ${data.membershipTier}
- Monthly Rate: $${data.monthlyRate}/month
${data.aircraftTailNumber ? `- Aircraft: ${data.aircraftTailNumber}` : ''}
${data.aircraftDetails ? `- Details: ${data.aircraftDetails}` : ''}
${data.hangarLocation && data.hangarLocation !== 'none' ? `- Hangar: ${data.hangarLocation}` : ''}

What Happens Next?

1. Schedule Your First Service
   Log in to your dashboard to request maintenance or aircraft preparation services.

2. Track Maintenance
   We'll help you stay on top of all required maintenance items and compliance.

3. 24/7 Support
   ${data.membershipTier === 'Class III' ? 'Your concierge team is ready to assist you anytime.' : 'Our team is here whenever you need assistance.'}

Go to Your Dashboard: https://www.freedomaviationco.com/dashboard

If you have any questions or need assistance getting started, don't hesitate to reach out.

Blue skies ahead,
The Freedom Aviation Team

Freedom Aviation
${process.env.EMAIL_FROM || 'info@freedomaviationco.com'} | (970) 618-2094
7565 S Peoria St, Englewood, CO 80112
  `;

  switch (emailService) {
    case "console":
      console.log(`[CONSOLE MODE] WELCOME EMAIL would be sent to ${data.memberEmail}`);
      console.log("Subject: Welcome to Freedom Aviation - Your Premium Aircraft Management Journey Begins!");
      console.log("To actually send emails, set EMAIL_SERVICE=resend and RESEND_API_KEY");
      return;

    case "resend":
      return sendViaResend(
        data.memberEmail, 
        "Welcome to Freedom Aviation - Your Premium Aircraft Management Journey Begins!", 
        html, 
        text
      );

    default:
      console.warn(`⚠️ Unknown email service: ${emailService}, using console mode`);
      return;
  }
}

async function sendViaResend(to: string, subject: string, html: string, text: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("RESEND_API_KEY not set, cannot send welcome email");
    throw new Error("RESEND_API_KEY environment variable is not set");
  }

  const fromEmail = process.env.EMAIL_FROM || "Freedom Aviation <onboarding@resend.dev>";

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

    console.log(`✅ Welcome email sent to ${to}`);
  } catch (error: any) {
    console.error("Failed to send welcome email via Resend:", error);
    throw error;
  }
}
