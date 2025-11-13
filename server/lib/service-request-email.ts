/**
 * Email notifications for service requests and flight instruction requests
 */
import { escapeHtml } from './email';

interface ServiceRequestEmailData {
  requestId: string;
  requestType: string;
  aircraftTailNumber: string;
  ownerName: string;
  priority: string;
  description: string;
  airport?: string | null;
  requestedDeparture?: string | null;
  dashboardUrl: string;
}

interface FlightInstructionRequestEmailData {
  requestId: string;
  studentName: string;
  aircraftTailNumber: string;
  requestedDate: string;
  requestedTime?: string;
  instructionType: string;
  notes?: string;
  dashboardUrl: string;
}

/**
 * Generate HTML email template for service request notification
 */
export function generateServiceRequestEmailHTML(data: ServiceRequestEmailData): string {
  const BRAND = {
    name: "Freedom Aviation",
    email: "info@freedomaviationco.com",
    phone: "(970) 618-2094",
    address: "7565 S Peoria St, Englewood, CO 80112",
  };

  // Priority badge colors
  const priorityColors = {
    high: '#dc2626',
    medium: '#f59e0b',
    low: '#10b981'
  };
  
  const priorityColor = priorityColors[data.priority as keyof typeof priorityColors] || priorityColors.medium;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Service Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; background-color: #1f2937; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">New Service Request</h1>
              <p style="margin: 8px 0 0; color: #d1d5db; font-size: 14px;">Immediate attention required</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Priority Badge -->
              <div style="margin-bottom: 24px;">
                <span style="display: inline-block; padding: 4px 12px; background-color: ${priorityColor}; color: #ffffff; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                  ${escapeHtml(data.priority)} Priority
                </span>
              </div>
              
              <h2 style="margin: 0 0 24px; color: #111827; font-size: 20px; font-weight: 600;">
                ${escapeHtml(data.requestType)} Request
              </h2>
              
              <!-- Request Details -->
              <table role="presentation" style="width: 100%; margin: 24px 0; background-color: #f9fafb; border-radius: 6px; padding: 16px;">
                <tr>
                  <td style="padding: 12px 16px;">
                    <strong style="color: #374151; display: inline-block; width: 140px;">Aircraft:</strong>
                    <span style="color: #111827;">${escapeHtml(data.aircraftTailNumber)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px;">
                    <strong style="color: #374151; display: inline-block; width: 140px;">Owner:</strong>
                    <span style="color: #111827;">${escapeHtml(data.ownerName)}</span>
                  </td>
                </tr>
                ${data.airport ? `
                <tr>
                  <td style="padding: 12px 16px;">
                    <strong style="color: #374151; display: inline-block; width: 140px;">Airport:</strong>
                    <span style="color: #111827;">${escapeHtml(data.airport)}</span>
                  </td>
                </tr>
                ` : ''}
                ${data.requestedDeparture ? `
                <tr>
                  <td style="padding: 12px 16px;">
                    <strong style="color: #374151; display: inline-block; width: 140px;">Departure:</strong>
                    <span style="color: #111827;">${new Date(data.requestedDeparture).toLocaleString('en-US', { 
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      timeZoneName: 'short'
                    })}</span>
                  </td>
                </tr>
                ` : ''}
              </table>
              
              <!-- Description -->
              <div style="margin: 24px 0; padding: 16px; background-color: #f3f4f6; border-radius: 6px; border-left: 4px solid ${priorityColor};">
                <h3 style="margin: 0 0 8px; color: #111827; font-size: 14px; font-weight: 600;">Request Details:</h3>
                <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(data.description)}</p>
              </div>
              
              <!-- CTA Button -->
              <div style="margin: 32px 0; text-align: center;">
                <a href="${data.dashboardUrl}" style="display: inline-block; padding: 14px 32px; background-color: #1f2937; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  View Request in Dashboard
                </a>
              </div>
              
              <p style="margin: 16px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                Or copy and paste this link into your browser:<br>
                <a href="${data.dashboardUrl}" style="color: #3b82f6; word-break: break-all;">${data.dashboardUrl}</a>
              </p>
              
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
              
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                This is an automated notification from Freedom Aviation's service request system.
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

/**
 * Generate HTML email template for flight instruction request notification
 */
export function generateFlightInstructionEmailHTML(data: FlightInstructionRequestEmailData): string {
  const BRAND = {
    name: "Freedom Aviation",
    email: "info@freedomaviationco.com",
    phone: "(970) 618-2094",
    address: "7565 S Peoria St, Englewood, CO 80112",
  };

  const requestDate = new Date(data.requestedDate);
  const formattedDate = requestDate.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flight Instruction Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; background-color: #1f2937; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Flight Instruction Request</h1>
              <p style="margin: 8px 0 0; color: #d1d5db; font-size: 14px;">New instruction request for your review</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 24px; color: #111827; font-size: 20px; font-weight: 600;">
                ${escapeHtml(data.instructionType)} Request
              </h2>
              
              <!-- Request Details -->
              <table role="presentation" style="width: 100%; margin: 24px 0; background-color: #f9fafb; border-radius: 6px; padding: 16px;">
                <tr>
                  <td style="padding: 12px 16px;">
                    <strong style="color: #374151; display: inline-block; width: 140px;">Student:</strong>
                    <span style="color: #111827;">${escapeHtml(data.studentName)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px;">
                    <strong style="color: #374151; display: inline-block; width: 140px;">Aircraft:</strong>
                    <span style="color: #111827;">${escapeHtml(data.aircraftTailNumber)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px;">
                    <strong style="color: #374151; display: inline-block; width: 140px;">Date:</strong>
                    <span style="color: #111827;">${formattedDate}</span>
                  </td>
                </tr>
                ${data.requestedTime ? `
                <tr>
                  <td style="padding: 12px 16px;">
                    <strong style="color: #374151; display: inline-block; width: 140px;">Time:</strong>
                    <span style="color: #111827;">${escapeHtml(data.requestedTime)}</span>
                  </td>
                </tr>
                ` : ''}
              </table>
              
              ${data.notes ? `
              <!-- Notes -->
              <div style="margin: 24px 0; padding: 16px; background-color: #f3f4f6; border-radius: 6px; border-left: 4px solid #3b82f6;">
                <h3 style="margin: 0 0 8px; color: #111827; font-size: 14px; font-weight: 600;">Student Notes:</h3>
                <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(data.notes)}</p>
              </div>
              ` : ''}
              
              <!-- CTA Button -->
              <div style="margin: 32px 0; text-align: center;">
                <a href="${data.dashboardUrl}" style="display: inline-block; padding: 14px 32px; background-color: #1f2937; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  View & Schedule in Dashboard
                </a>
              </div>
              
              <p style="margin: 16px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                Or copy and paste this link into your browser:<br>
                <a href="${data.dashboardUrl}" style="color: #3b82f6; word-break: break-all;">${data.dashboardUrl}</a>
              </p>
              
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
              
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                This is an automated notification from Freedom Aviation's instruction scheduling system.
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

/**
 * Generate plain text version of service request email
 */
export function generateServiceRequestEmailText(data: ServiceRequestEmailData): string {
  return `
New Service Request - ${data.priority.toUpperCase()} Priority

${data.requestType} Request

Aircraft: ${data.aircraftTailNumber}
Owner: ${data.ownerName}
${data.airport ? `Airport: ${data.airport}` : ''}
${data.requestedDeparture ? `Departure: ${new Date(data.requestedDeparture).toLocaleString()}` : ''}

Request Details:
${data.description}

View Request in Dashboard: ${data.dashboardUrl}

---
This is an automated notification from Freedom Aviation.
`;
}

/**
 * Generate plain text version of flight instruction email
 */
export function generateFlightInstructionEmailText(data: FlightInstructionRequestEmailData): string {
  const requestDate = new Date(data.requestedDate);
  const formattedDate = requestDate.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
Flight Instruction Request

${data.instructionType} Request

Student: ${data.studentName}
Aircraft: ${data.aircraftTailNumber}
Date: ${formattedDate}
${data.requestedTime ? `Time: ${data.requestedTime}` : ''}

${data.notes ? `Student Notes:\n${data.notes}\n` : ''}

View & Schedule in Dashboard: ${data.dashboardUrl}

---
This is an automated notification from Freedom Aviation.
`;
}

// Re-export escapeHtml from email.ts
export { escapeHtml } from './email';
