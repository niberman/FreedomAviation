import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import type { ServiceRequest, ServiceRequestInsert, ServiceRequestUpdate, ServiceStatus } from '@shared/database-types';

// ── Validation schemas ──────────────────────────────────────────────────────

export const serviceRequestSchema = z.object({
  aircraft_id: z.string().uuid("Invalid aircraft ID"),
  service_type: z.string().min(1, "Service type is required"),
  priority: z.enum(["low", "medium", "high"]).optional().nullable(),
  description: z.string().optional().nullable(),
  airport: z.string().regex(/^[A-Z0-9]{3,4}$/, "Airport must be 3-4 characters").optional().nullable(),
  requested_departure: z.string().datetime().optional().nullable(),
  fuel_grade: z.enum(["100LL", "Jet-A", "Jet-A+", "MOGAS"]).optional().nullable(),
  fuel_quantity: z.number().min(0).optional().nullable(),
  cabin_provisioning: z.union([z.record(z.any()), z.string()]).optional().nullable(),
  o2_topoff: z.boolean().optional().nullable(),
  tks_topoff: z.boolean().optional().nullable(),
  gpu_required: z.boolean().optional().nullable(),
  hangar_pullout: z.boolean().optional().nullable(),
  is_extra_charge: z.boolean().optional().nullable(),
  credits_used: z.number().min(0).optional().nullable(),
});

export type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>;

// ── Data access functions ───────────────────────────────────────────────────

/** Fetch a single service request by ID */
export async function getServiceRequestById(id: string): Promise<ServiceRequest | null> {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/** Fetch all service requests for an owner, optionally filtered by aircraft */
export async function getOwnerServiceRequests(
  userId: string,
  aircraftId?: string,
): Promise<ServiceRequest[]> {
  let query = supabase
    .from('service_requests')
    .select('*')
    .eq('user_id', userId);

  if (aircraftId) {
    query = query.eq('aircraft_id', aircraftId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/** Fetch upcoming preflight requests for a user (max 5) */
export async function getUpcomingPreflights(userId: string): Promise<ServiceRequest[]> {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('user_id', userId)
    .eq('service_type', 'Pre-Flight Concierge')
    .not('requested_departure', 'is', null)
    .gte('requested_departure', new Date().toISOString())
    .order('requested_departure', { ascending: true })
    .limit(5);

  if (error) throw error;
  return data || [];
}

/** Create a new service request with validation */
export async function createServiceRequest(
  input: ServiceRequestFormData,
  userId: string,
): Promise<ServiceRequest> {
  const validated = serviceRequestSchema.parse(input);

  const insertData: ServiceRequestInsert = {
    aircraft_id: validated.aircraft_id,
    service_type: validated.service_type,
    description: validated.description ?? `Service request: ${validated.service_type}`,
    user_id: userId,
    status: 'pending',
    priority: validated.priority ?? 'medium',
    is_extra_charge: validated.is_extra_charge ?? false,
    credits_used: validated.credits_used ?? 0,
    airport: validated.airport ?? undefined,
    requested_departure: validated.requested_departure ?? undefined,
    fuel_grade: validated.fuel_grade ?? undefined,
    fuel_quantity: validated.fuel_quantity ?? undefined,
    cabin_provisioning:
      typeof validated.cabin_provisioning === 'object' && validated.cabin_provisioning !== null
        ? validated.cabin_provisioning
        : undefined,
    o2_topoff: validated.o2_topoff ?? undefined,
    tks_topoff: validated.tks_topoff ?? undefined,
    gpu_required: validated.gpu_required ?? undefined,
    hangar_pullout: validated.hangar_pullout ?? undefined,
  };

  const { data, error } = await supabase
    .from('service_requests')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Update a service request with partial data and/or status change */
export async function updateServiceRequest(
  id: string,
  updateData: Partial<ServiceRequestFormData> & { status?: ServiceStatus },
): Promise<ServiceRequest> {
  const validated = serviceRequestSchema.partial().parse(updateData);

  const { data, error } = await supabase
    .from('service_requests')
    .update({
      ...validated,
      ...(updateData.status ? { status: updateData.status } : {}),
    } as ServiceRequestUpdate)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Cancel a service request by setting status to 'cancelled' */
export async function cancelServiceRequest(id: string): Promise<ServiceRequest> {
  const { data, error } = await supabase
    .from('service_requests')
    .update({ status: 'cancelled' as ServiceStatus })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
