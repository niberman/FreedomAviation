import { supabase } from '@/lib/supabase';
import type { InstructionInvoice } from '@/types/invoices';

// ── Types ───────────────────────────────────────────────────────────────────

export interface FetchInvoicesOptions {
  userId: string;
  canSeeAllInvoices: boolean;
}

export interface UpdateInvoiceParams {
  invoiceId: string;
  description?: string;
  flightDate?: string;
  hours?: number;
  rateCents?: number;
  notes?: string;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unit_cents: number;
    type?: 'labor' | 'part' | 'fee';
  }>;
}

// ── Data access functions ───────────────────────────────────────────────────

/**
 * Fetch instruction and maintenance invoices with nested relations.
 * Falls back to separate queries if the nested query fails
 * (e.g. when invoice_lines table doesn't exist yet).
 */
export async function fetchInvoices(opts: FetchInvoicesOptions): Promise<InstructionInvoice[]> {
  const { userId, canSeeAllInvoices } = opts;

  // Try nested query first
  let query = supabase
    .from('invoices')
    .select(`
      *,
      aircraft:aircraft_id(tail_number),
      owner:owner_id(full_name, email),
      invoice_lines(description, quantity, unit_cents)
    `)
    .in('category', ['instruction', 'maintenance']);

  // Staff/Admin see all invoices, CFIs see only their own
  if (!canSeeAllInvoices) {
    query = query.eq('created_by_cfi_id', userId);
  }

  let { data, error } = await query.order('created_at', { ascending: false });

  // If nested query fails, try fetching separately
  if (
    error &&
    (error.message?.includes('invoice_lines') ||
      error.message?.includes('aircraft') ||
      error.message?.includes('owner'))
  ) {
    return fetchInvoicesFallback(userId, canSeeAllInvoices);
  }

  if (error) throw error;
  return (data as InstructionInvoice[]) || [];
}

/** Delete an invoice by ID */
export async function deleteInvoice(invoiceId: string): Promise<void> {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId);

  if (error) throw error;
}

/**
 * Update an invoice's metadata and/or replace its line items.
 * When line items are provided, deletes existing lines and re-inserts,
 * then recalculates the invoice total.
 */
export async function updateInvoice(params: UpdateInvoiceParams): Promise<void> {
  const { invoiceId, lineItems, ...invoiceUpdates } = params;

  // 1. Update invoice metadata if provided
  if (Object.keys(invoiceUpdates).length > 0) {
    const updates: Record<string, unknown> = {};
    if (invoiceUpdates.notes !== undefined) updates.notes = invoiceUpdates.notes;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', invoiceId);
      if (error) throw error;
    }
  }

  // 2. Replace line items if provided
  if (lineItems) {
    // Delete existing lines
    const { error: deleteError } = await supabase
      .from('invoice_lines')
      .delete()
      .eq('invoice_id', invoiceId);

    if (deleteError) throw deleteError;

    // Insert new lines
    const { error: insertError } = await supabase
      .from('invoice_lines')
      .insert(
        lineItems.map((item) => ({
          invoice_id: invoiceId,
          description: item.description,
          quantity: item.quantity,
          unit_cents: item.unit_cents,
        })),
      );

    if (insertError) throw insertError;

    // Recalculate total
    const totalCents = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_cents,
      0,
    );
    const { error: updateAmountError } = await supabase
      .from('invoices')
      .update({ amount: totalCents / 100.0 })
      .eq('id', invoiceId);

    if (updateAmountError) throw updateAmountError;
  }
}

// ── Internal helpers ────────────────────────────────────────────────────────

/**
 * Fallback: fetch invoices, lines, aircraft, and owners separately,
 * then manually join them.
 */
async function fetchInvoicesFallback(
  userId: string,
  canSeeAllInvoices: boolean,
): Promise<InstructionInvoice[]> {
  let baseQuery = supabase
    .from('invoices')
    .select('*')
    .in('category', ['instruction', 'maintenance']);

  if (!canSeeAllInvoices) {
    baseQuery = baseQuery.eq('created_by_cfi_id', userId);
  }

  const invoicesResult = await baseQuery.order('created_at', { ascending: false });

  if (invoicesResult.error) throw invoicesResult.error;

  const invoiceData = invoicesResult.data || [];
  if (invoiceData.length === 0) return [];

  const invoiceIds = invoiceData.map((inv: Record<string, unknown>) => inv.id as string);
  const aircraftIds = [...new Set(invoiceData.map((inv: Record<string, unknown>) => inv.aircraft_id as string))];
  const ownerIds = [...new Set(invoiceData.map((inv: Record<string, unknown>) => inv.owner_id as string))];

  // Fetch related data in parallel
  const [linesResult, aircraftResult, ownerResult] = await Promise.all([
    invoiceIds.length > 0
      ? supabase.from('invoice_lines').select('*').in('invoice_id', invoiceIds)
      : { data: [], error: null },
    aircraftIds.length > 0
      ? supabase.from('aircraft').select('id, tail_number').in('id', aircraftIds)
      : { data: [], error: null },
    ownerIds.length > 0
      ? supabase.from('user_profiles').select('id, full_name, email').in('id', ownerIds)
      : { data: [], error: null },
  ]);

  // Build lookup maps
  const linesByInvoiceId = (linesResult.data || []).reduce(
    (acc: Record<string, unknown[]>, line: Record<string, unknown>) => {
      const id = line.invoice_id as string;
      if (!acc[id]) acc[id] = [];
      acc[id].push(line);
      return acc;
    },
    {},
  );

  const aircraftById = (aircraftResult.data || []).reduce(
    (acc: Record<string, unknown>, ac: Record<string, unknown>) => {
      acc[ac.id as string] = ac;
      return acc;
    },
    {},
  );

  const ownerById = (ownerResult.data || []).reduce(
    (acc: Record<string, unknown>, owner: Record<string, unknown>) => {
      acc[owner.id as string] = owner;
      return acc;
    },
    {},
  );

  return invoiceData.map((inv: Record<string, unknown>) => ({
    ...inv,
    aircraft: aircraftById[inv.aircraft_id as string] || null,
    owner: ownerById[inv.owner_id as string] || null,
    invoice_lines: linesByInvoiceId[inv.id as string] || [],
  })) as InstructionInvoice[];
}
