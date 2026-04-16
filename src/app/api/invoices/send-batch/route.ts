import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { requireRole } from '@/lib/api-auth';
import { API_ROLES } from '@/lib/roles';
import { normalizeLineItem } from '@/lib/stripe-utils';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const emailService = process.env.EMAIL_SERVICE || 'console';
const emailFrom = process.env.EMAIL_FROM || 'Freedom Aviation <onboarding@resend.dev>';
const frontendUrl = process.env.FRONTEND_URL || process.env.SITE_URL || 'https://www.freedomaviationco.com';

const stripe: Stripe | null = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

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

interface BatchLine {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface BatchEmailData {
  ownerName: string;
  ownerEmail: string;
  invoiceNumbers: string[];
  totalAmount: number;
  lines: BatchLine[];
  paymentUrl: string;
}

function generateBatchEmailHTML(data: BatchEmailData): string {
  const BRAND = {
    name: 'Freedom Aviation',
    email: 'info@freedomaviationco.com',
    phone: '(970) 618-2094',
    address: '7565 S Peoria St, Englewood, CO 80112',
  };

  const linesHTML = data.lines
    .map(
      (line) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(line.description)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${line.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${line.unitPrice.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${line.total.toFixed(2)}</td>
    </tr>
  `,
    )
    .join('');

  const invoiceList = data.invoiceNumbers.map((n) => escapeHtml(n)).join(', ');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Combined Payment - Freedom Aviation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; background-color: #1f2937; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Freedom Aviation</h1>
              <p style="margin: 8px 0 0; color: #d1d5db; font-size: 14px;">Colorado-Based. Front Range Focused.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 24px; color: #111827; font-size: 20px; font-weight: 600;">Combined Payment</h2>

              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.5;">
                Dear ${escapeHtml(data.ownerName)},
              </p>

              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.5;">
                This payment link covers the following ${data.invoiceNumbers.length} invoice${data.invoiceNumbers.length === 1 ? '' : 's'}: <strong>${invoiceList}</strong>.
              </p>

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

              <div style="margin: 32px 0; text-align: center;">
                <a href="${data.paymentUrl}" style="display: inline-block; padding: 14px 32px; background-color: #1f2937; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; text-align: center;">
                  Pay $${data.totalAmount.toFixed(2)}
                </a>
              </div>
              <p style="margin: 16px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                Or copy and paste this link into your browser:<br>
                <a href="${data.paymentUrl}" style="color: #3b82f6; word-break: break-all;">${data.paymentUrl}</a>
              </p>

              <p style="margin: 32px 0 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                Thank you for your business!
              </p>

              <p style="margin: 24px 0 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                Best regards,<br>
                <strong>Freedom Aviation</strong>
              </p>
            </td>
          </tr>
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

async function sendEmailViaResend(to: string, subject: string, html: string, text: string): Promise<void> {
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

interface InvoiceLineRow {
  description: string;
  quantity: number | string;
  unit_cents: number | string;
}

interface InvoiceRow {
  id: string;
  owner_id: string;
  invoice_number: string;
  status: string;
  paid_date: string | null;
  amount: string | number;
  invoice_lines: InvoiceLineRow[] | null;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(request, [...API_ROLES.INVOICING]);
    if (!authResult.ok) {
      return NextResponse.json(
        { error: authResult.status === 401 ? 'Unauthorized' : 'Forbidden', message: authResult.message },
        { status: authResult.status },
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
    }

    const body = await request.json();
    const invoiceIds: string[] = Array.isArray(body?.invoiceIds) ? body.invoiceIds : [];

    if (invoiceIds.length < 2) {
      return NextResponse.json(
        { error: 'Provide at least 2 invoiceIds to combine.' },
        { status: 400 },
      );
    }

    const { data: invoices, error: fetchError } = await supabase
      .from('invoices')
      .select('id, owner_id, invoice_number, status, paid_date, amount, batch_id, invoice_lines(description, quantity, unit_cents)')
      .in('id', invoiceIds);

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to load invoices', message: fetchError.message }, { status: 500 });
    }
    if (!invoices || invoices.length !== invoiceIds.length) {
      return NextResponse.json({ error: 'One or more invoices not found.' }, { status: 404 });
    }

    const ownerId = invoices[0].owner_id;
    if (!ownerId || !invoices.every((inv) => inv.owner_id === ownerId)) {
      return NextResponse.json(
        { error: 'All invoices must belong to the same owner.' },
        { status: 400 },
      );
    }

    for (const inv of invoices) {
      if (inv.status === 'paid' || inv.paid_date) {
        return NextResponse.json(
          { error: `Invoice ${inv.invoice_number} is already paid.` },
          { status: 400 },
        );
      }
      if (inv.status !== 'finalized' && inv.status !== 'sent' && inv.status !== 'draft') {
        return NextResponse.json(
          { error: `Invoice ${inv.invoice_number} has status ${inv.status}; only draft/finalized/sent can be combined.` },
          { status: 400 },
        );
      }
      if ((inv as { batch_id?: string | null }).batch_id) {
        return NextResponse.json(
          { error: `Invoice ${inv.invoice_number} is already part of an open batch.` },
          { status: 400 },
        );
      }
    }

    const { data: owner, error: ownerError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .eq('id', ownerId)
      .single();

    if (ownerError || !owner?.email) {
      return NextResponse.json({ error: 'Owner email not found.' }, { status: 400 });
    }

    const typedInvoices = invoices as unknown as InvoiceRow[];
    const batchLines: BatchLine[] = [];
    let totalCents = 0;

    for (const inv of typedInvoices) {
      const lines = inv.invoice_lines || [];
      if (lines.length === 0) {
        const amountCents = Math.round(Number(inv.amount) * 100);
        if (amountCents <= 0) continue;
        totalCents += amountCents;
        batchLines.push({
          description: `Invoice ${inv.invoice_number}`,
          quantity: 1,
          unitPrice: amountCents / 100,
          total: amountCents / 100,
        });
      } else {
        for (const line of lines) {
          const qty = Number(line.quantity);
          const unit = Number(line.unit_cents);
          if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(unit) || unit <= 0) continue;
          const lineCents = Math.round(qty * unit);
          totalCents += lineCents;
          batchLines.push({
            description: `${line.description} (Inv ${inv.invoice_number})`,
            quantity: qty,
            unitPrice: unit / 100,
            total: lineCents / 100,
          });
        }
      }
    }

    if (totalCents <= 0 || batchLines.length === 0) {
      return NextResponse.json({ error: 'Combined invoice total must be greater than $0.' }, { status: 400 });
    }

    const { data: batch, error: batchInsertError } = await supabase
      .from('invoice_batches')
      .insert({
        owner_id: ownerId,
        total_cents: totalCents,
        status: 'pending',
        created_by: authResult.auth.user.id,
      })
      .select('id')
      .single();

    if (batchInsertError || !batch) {
      return NextResponse.json(
        { error: 'Failed to create batch', message: batchInsertError?.message },
        { status: 500 },
      );
    }

    const batchId = batch.id;

    const { error: linkError } = await supabase
      .from('invoices')
      .update({ batch_id: batchId })
      .in('id', invoiceIds);

    if (linkError) {
      await supabase.from('invoice_batches').delete().eq('id', batchId);
      return NextResponse.json(
        { error: 'Failed to link invoices to batch', message: linkError.message },
        { status: 500 },
      );
    }

    let paymentUrl: string | null = null;
    let sessionId: string | null = null;
    try {
      const stripeLineItems = batchLines.map((line) =>
        normalizeLineItem({
          price_data: {
            currency: 'usd',
            product_data: { name: line.description },
            unit_amount: Math.round(line.unitPrice * 100),
          },
          quantity: line.quantity,
        }),
      );

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: stripeLineItems,
        mode: 'payment',
        success_url: `${frontendUrl}/dashboard/more?payment=success&batch_id=${batchId}`,
        cancel_url: `${frontendUrl}/dashboard/more?payment=cancelled&batch_id=${batchId}`,
        customer_email: owner.email,
        metadata: {
          batch_id: batchId,
          owner_id: ownerId,
          invoice_ids: invoiceIds.join(','),
        },
      });

      paymentUrl = session.url;
      sessionId = session.id;
    } catch (stripeError) {
      await supabase.from('invoices').update({ batch_id: null }).in('id', invoiceIds);
      await supabase.from('invoice_batches').delete().eq('id', batchId);
      return NextResponse.json(
        {
          error: 'Failed to create payment link.',
          message: stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error',
        },
        { status: 500 },
      );
    }

    if (!paymentUrl || !sessionId) {
      await supabase.from('invoices').update({ batch_id: null }).in('id', invoiceIds);
      await supabase.from('invoice_batches').delete().eq('id', batchId);
      return NextResponse.json({ error: 'Could not generate payment link.' }, { status: 500 });
    }

    await supabase
      .from('invoice_batches')
      .update({ stripe_checkout_session_id: sessionId })
      .eq('id', batchId);

    const emailData: BatchEmailData = {
      ownerName: owner.full_name || owner.email,
      ownerEmail: owner.email,
      invoiceNumbers: typedInvoices.map((i) => i.invoice_number),
      totalAmount: totalCents / 100,
      lines: batchLines,
      paymentUrl,
    };

    const html = generateBatchEmailHTML(emailData);
    const text = `Combined Payment - Freedom Aviation

Dear ${emailData.ownerName},

This payment link covers invoices: ${emailData.invoiceNumbers.join(', ')}.

${batchLines.map((l) => `${l.description} - ${l.quantity} x $${l.unitPrice.toFixed(2)} = $${l.total.toFixed(2)}`).join('\n')}

Total: $${emailData.totalAmount.toFixed(2)}

Pay now: ${paymentUrl}

Thank you,
Freedom Aviation`;

    if (emailService === 'resend' && resendApiKey) {
      await sendEmailViaResend(
        owner.email,
        `Combined Payment for ${emailData.invoiceNumbers.length} Invoices - Freedom Aviation`,
        html,
        text,
      );

      const nowIso = new Date().toISOString();
      await supabase
        .from('invoice_batches')
        .update({ status: 'sent', sent_at: nowIso })
        .eq('id', batchId);
      await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .in('id', invoiceIds);

      return NextResponse.json({
        success: true,
        batchId,
        paymentUrl,
        totalAmount: emailData.totalAmount,
        invoiceCount: invoiceIds.length,
        emailService: 'resend',
        sent: true,
      });
    }

    return NextResponse.json({
      success: true,
      batchId,
      paymentUrl,
      totalAmount: emailData.totalAmount,
      invoiceCount: invoiceIds.length,
      emailService: 'console',
      sent: false,
      message: 'Email logged to console (EMAIL_SERVICE=console).',
    });
  } catch (error) {
    console.error('Error sending batch invoice:', error);
    return NextResponse.json(
      { error: 'Failed to send batch invoice', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
