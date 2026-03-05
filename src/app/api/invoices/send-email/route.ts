import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase-server';
import { requireRole } from '@/lib/api-auth';
import { API_ROLES } from '@/lib/roles';
import { normalizeLineItem } from '@/lib/stripe-utils';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const emailService = process.env.EMAIL_SERVICE || 'console';
const emailFrom = process.env.EMAIL_FROM || 'Freedom Aviation <onboarding@resend.dev>';
const frontendUrl = process.env.FRONTEND_URL || process.env.SITE_URL || 'https://www.freedomaviationco.com';

let stripe: Stripe | null = null;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey);
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

interface InvoiceEmailData {
  invoiceNumber: string;
  ownerName: string;
  ownerEmail: string;
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

function generateInvoiceEmailHTML(data: InvoiceEmailData): string {
  const BRAND = {
    name: 'Freedom Aviation',
    email: 'info@freedomaviationco.com',
    phone: '(970) 618-2094',
    address: '7565 S Peoria St, Englewood, CO 80112',
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
    .join('');

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
                Please find your invoice below.
              </p>
              
              ${data.aircraftTailNumber ? `<p style="margin: 0 0 24px; color: #4b5563; font-size: 14px;"><strong>Aircraft:</strong> ${escapeHtml(data.aircraftTailNumber)}</p>` : ''}
              
              <!-- Invoice Table -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Description</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Qty</th>
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
              
              ${data.dueDate ? `<p style="margin: 16px 0 0; color: #6b7280; font-size: 14px;"><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
              
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
              ` : ''}
              
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

async function sendEmailViaResend(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<void> {
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: emailFrom,
      reply_to: 'info@freedomaviationco.com',
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API error (${response.status}): ${errorText}`);
  }
}

// =============================================================================
// Route Handler
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(request, [...API_ROLES.INVOICING]);
    if (!authResult.ok) {
      return NextResponse.json(
        { error: authResult.status === 401 ? 'Unauthorized' : 'Forbidden', message: authResult.message },
        { status: authResult.status }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Missing invoiceId' },
        { status: 400 }
      );
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_lines(*),
        owner:owner_id(id, full_name, email),
        aircraft:aircraft_id(id, tail_number)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const owner = invoice.owner as { id: string; email?: string; full_name?: string } | null;
    if (!owner?.email) {
      return NextResponse.json(
        { error: 'Owner email not found' },
        { status: 400 }
      );
    }

    // Validate invoice status (allow draft for initial send; API will set sent after email)
    if (invoice.status !== 'finalized' && invoice.status !== 'sent' && invoice.status !== 'draft') {
      return NextResponse.json(
        { error: `Can only send email for draft, finalized, or sent invoices. Current status: ${invoice.status}` },
        { status: 400 }
      );
    }

    // Transform invoice lines
    const invoiceLines = ((invoice.invoice_lines || []) as Array<{
      description: string;
      quantity: number;
      unit_cents: number;
    }>).map((line) => ({
      description: line.description,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unit_cents) / 100,
      total: (Number(line.quantity) * Number(line.unit_cents)) / 100,
    }));

    // Calculate total
    const totalAmount = invoiceLines.length > 0
      ? invoiceLines.reduce((sum, line) => sum + line.total, 0)
      : Number(invoice.amount) || 0;

    // Require Stripe to be configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Cannot send invoice without payment link.' },
        { status: 503 }
      );
    }

    if (!invoice.owner_id) {
      return NextResponse.json(
        { error: 'Invoice has no owner. Cannot create payment link.' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    let paymentUrl: string | null = null;
    try {
      // Check for existing session
      if (invoice.stripe_checkout_session_id) {
        try {
          const existingSession = await stripe.checkout.sessions.retrieve(invoice.stripe_checkout_session_id);
          if (existingSession.status === 'open' || existingSession.status === 'complete') {
            paymentUrl = existingSession.url;
          }
        } catch {
          // Session expired, create new one
        }
      }

      // Create new session if needed
      if (!paymentUrl) {
        const totalCents = invoiceLines.length > 0
          ? Math.round(totalAmount * 100)
          : Math.round(Number(invoice.amount) * 100);

        if (totalCents <= 0) {
          return NextResponse.json(
            { error: 'Invoice total must be greater than $0 to create a payment link.' },
            { status: 400 }
          );
        }

        const lineItems = invoiceLines.length > 0
          ? invoiceLines.map((line) => normalizeLineItem({
              price_data: {
                currency: 'usd',
                product_data: { name: line.description || 'Service' },
                unit_amount: Math.round(line.unitPrice * 100),
              },
              quantity: line.quantity,
            }))
          : [{
              price_data: {
                currency: 'usd',
                product_data: { name: `Invoice ${invoice.invoice_number}` },
                unit_amount: totalCents,
              },
              quantity: 1,
            }];

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: lineItems,
          mode: 'payment',
          success_url: `${frontendUrl}/dashboard/more?payment=success&invoice_id=${invoice.id}`,
          cancel_url: `${frontendUrl}/dashboard/more?payment=cancelled&invoice_id=${invoice.id}`,
          customer_email: owner.email,
          metadata: {
            invoice_id: invoice.id,
            owner_id: invoice.owner_id,
            invoice_number: invoice.invoice_number,
          },
        });

        paymentUrl = session.url;

        // Save checkout session ID
        await supabase
          .from('invoices')
          .update({ stripe_checkout_session_id: session.id })
          .eq('id', invoice.id);
      }
    } catch (stripeError) {
      console.error('Error creating Stripe checkout session:', stripeError);
      return NextResponse.json(
        { 
          error: 'Failed to create payment link. Invoice not sent.',
          message: stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error',
        },
        { status: 500 }
      );
    }

    // Final check - ensure we have a payment URL
    if (!paymentUrl) {
      return NextResponse.json(
        { error: 'Could not generate payment link. Invoice not sent.' },
        { status: 500 }
      );
    }

    // Generate email content
    const aircraft = invoice.aircraft as { tail_number?: string } | null;
    const emailData: InvoiceEmailData = {
      invoiceNumber: invoice.invoice_number,
      ownerName: owner.full_name || owner.email,
      ownerEmail: owner.email,
      totalAmount,
      invoiceLines,
      dueDate: invoice.due_date,
      aircraftTailNumber: aircraft?.tail_number,
      paymentUrl,
    };

    const html = generateInvoiceEmailHTML(emailData);
    const text = `
Invoice ${emailData.invoiceNumber}

Dear ${emailData.ownerName},

Please find your invoice below.

${invoiceLines.map(line => `${line.description} - ${line.quantity} x $${line.unitPrice.toFixed(2)} = $${line.total.toFixed(2)}`).join('\n')}

Total: $${totalAmount.toFixed(2)}

${emailData.dueDate ? `Due Date: ${new Date(emailData.dueDate).toLocaleDateString()}` : ''}

${paymentUrl ? `Pay Invoice: ${paymentUrl}` : ''}

Thank you for your business!

Freedom Aviation
    `;

    // Send email based on service
    if (emailService === 'resend' && resendApiKey) {
      await sendEmailViaResend(
        owner.email,
        `Invoice ${invoice.invoice_number} - Freedom Aviation`,
        html,
        text
      );

      // Update invoice status to sent
      await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoice.id);

      return NextResponse.json({
        success: true,
        message: 'Invoice email sent successfully with payment link',
        emailService: 'resend',
        sent: true,
      });
    } else {
      // Console mode - log but don't send

      return NextResponse.json({
        success: true,
        message: 'Email logged to console with payment link (EMAIL_SERVICE=console mode)',
        emailService: 'console',
        sent: false,
      });
    }
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send invoice email',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


