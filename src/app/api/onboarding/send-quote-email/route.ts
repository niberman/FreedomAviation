import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/onboarding/send-quote-email
 * Sends the membership quote to the client's email via Resend.
 * Called when the user completes the quote step in onboarding.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      toEmail,
      memberName,
      tierName,
      baseMonthly = 0,
      hangarCost = 0,
      totalMonthly,
      aircraftTail,
      aircraftMake,
      aircraftModel,
    } = body;

    if (!toEmail || typeof toEmail !== 'string' || !toEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Valid toEmail is required' },
        { status: 400 }
      );
    }

    const emailService = process.env.EMAIL_SERVICE || 'console';
    const fromEmail = process.env.EMAIL_FROM || 'Freedom Aviation <onboarding@resend.dev>';
    const resendApiKey = process.env.RESEND_API_KEY;

    const total = totalMonthly ?? baseMonthly + hangarCost;
    const subject = 'Your Freedom Aviation Membership Quote';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your Quote</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 32px;">
    <h1 style="margin: 0 0 8px; color: #111827;">Your Membership Quote</h1>
    <p style="color: #6b7280; margin: 0 0 24px;">Hello ${escapeHtml(memberName || 'there')},</p>
    <p style="color: #4b5563;">Here is your customized membership quote from Freedom Aviation.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 24px 0; background: #f9fafb; border-radius: 6px;">
      <tr><td style="padding: 12px 16px; color: #6b7280;">Package</td><td style="padding: 12px 16px; text-align: right; font-weight: 600;">${escapeHtml(tierName || 'Membership')}</td></tr>
      <tr><td style="padding: 12px 16px; color: #6b7280;">Base (monthly)</td><td style="padding: 12px 16px; text-align: right;">$${Number(baseMonthly).toLocaleString()}</td></tr>
      ${Number(hangarCost) > 0 ? `<tr><td style="padding: 12px 16px; color: #6b7280;">Hangar (monthly)</td><td style="padding: 12px 16px; text-align: right;">$${Number(hangarCost).toLocaleString()}</td></tr>` : ''}
      <tr><td style="padding: 12px 16px; font-weight: 600;">Total (monthly)</td><td style="padding: 12px 16px; text-align: right; font-weight: 600;">$${Number(total).toLocaleString()}</td></tr>
    </table>
    ${aircraftTail || aircraftMake ? `<p style="color: #6b7280; font-size: 14px;">Aircraft: ${escapeHtml([aircraftTail, aircraftMake, aircraftModel].filter(Boolean).join(' '))}</p>` : ''}
    <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">Our team will reach out within 24 hours. Questions? Reply to this email or call (970) 618-2094.</p>
    <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">Freedom Aviation · 7565 S Peoria St, Englewood, CO 80112</p>
  </div>
</body>
</html>`;

    const text = `Your Membership Quote\n\nHello ${memberName || 'there'},\n\nYour Freedom Aviation quote:\nPackage: ${tierName || 'Membership'}\nBase (monthly): $${Number(baseMonthly).toLocaleString()}\n${Number(hangarCost) > 0 ? `Hangar (monthly): $${Number(hangarCost).toLocaleString()}\n` : ''}Total (monthly): $${Number(total).toLocaleString()}\n\nOur team will reach out within 24 hours.`;

    if (emailService === 'console') {
      console.log('[CONSOLE] Quote email would be sent to', toEmail, subject);
      return NextResponse.json({ success: true });
    }

    if (emailService === 'resend') {
      if (!resendApiKey) {
        console.error('RESEND_API_KEY not set');
        return NextResponse.json(
          { error: 'Email service not configured' },
          { status: 503 }
        );
      }
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject,
          html,
          text,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error('Resend error:', res.status, errText);
        return NextResponse.json(
          { error: 'Failed to send quote email' },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send quote email error:', error);
    return NextResponse.json(
      { error: 'Failed to send quote email' },
      { status: 500 }
    );
  }
}

function escapeHtml(s: string): string {
  if (typeof s !== 'string') return '';
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return s.replace(/[&<>"']/g, (m) => map[m]);
}
