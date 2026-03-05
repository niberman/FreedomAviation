import { supabase } from '@/lib/supabase';

// ── Types ───────────────────────────────────────────────────────────────────

export interface ClientDetails {
  profile: Record<string, unknown>;
  aircraft: Array<Record<string, unknown>>;
  invoices: Array<Record<string, unknown>>;
  serviceRequests: Array<Record<string, unknown>>;
}

// ── Data access functions ───────────────────────────────────────────────────

/**
 * Fetch detailed client information: profile, aircraft, invoices, and service requests.
 * Used in the staff client-details view dialog.
 */
export async function getClientDetails(clientId: string): Promise<ClientDetails> {
  // Fetch all data in parallel
  const [profileResult, aircraftResult, invoicesResult, serviceRequestsResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('*')
      .eq('id', clientId)
      .single(),
    supabase
      .from('aircraft')
      .select('*')
      .eq('owner_id', clientId),
    supabase
      .from('invoices')
      .select('*, invoice_lines(description, quantity, unit_cents)')
      .eq('owner_id', clientId)
      .order('created_at', { ascending: false }),
    supabase
      .from('service_requests')
      .select('*, aircraft:aircraft_id(tail_number)')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false }),
  ]);

  if (profileResult.error) throw profileResult.error;

  return {
    profile: profileResult.data,
    aircraft: aircraftResult.data || [],
    invoices: invoicesResult.data || [],
    serviceRequests: serviceRequestsResult.data || [],
  };
}

/**
 * Update a client's profile (full_name, phone).
 */
export async function updateClientProfile(
  clientId: string,
  data: { full_name: string; phone?: string | null },
): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update(data)
    .eq('id', clientId);

  if (error) throw error;
}
