import type { UserRole } from "@shared/database-types";
export type { UserRole };

export const STAFF_ROLES: UserRole[] = ['admin', 'staff', 'cfi', 'ops', 'founder'];

export const API_ROLES = {
  ALL_STAFF: ['admin', 'staff', 'founder', 'cfi', 'ops'] as const satisfies readonly UserRole[],
  MANAGE_CLIENTS: ['admin', 'founder', 'ops'] as const satisfies readonly UserRole[],
  VIEW_CLIENTS: ['admin', 'cfi', 'founder', 'ops'] as const satisfies readonly UserRole[],
  MANAGE_STAFF: ['admin', 'founder'] as const satisfies readonly UserRole[],
  CALENDAR: ['admin', 'cfi', 'founder'] as const satisfies readonly UserRole[],
  INVOICING: ['admin', 'founder', 'cfi', 'ops'] as const satisfies readonly UserRole[],
} as const;

export function isStaffRole(role: string | null | undefined): boolean {
  if (!role) return false;
  const trimmedRole = role.trim().toLowerCase();
  return STAFF_ROLES.includes(trimmedRole as UserRole);
}

export function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  const trimmedRole = role.trim().toLowerCase();
  return trimmedRole === 'admin' || trimmedRole === 'founder';
}

export function canCreateInvoices(role: string | null | undefined): boolean {
  if (!role) return false;
  const trimmedRole = role.trim().toLowerCase();
  return ['admin', 'founder', 'cfi', 'ops'].includes(trimmedRole);
}

export function canManageClients(role: string | null | undefined): boolean {
  if (!role) return false;
  const trimmedRole = role.trim().toLowerCase();
  return ['admin', 'founder', 'ops'].includes(trimmedRole);
}

export function canManageStaff(role: string | null | undefined): boolean {
  if (!role) return false;
  const trimmedRole = role.trim().toLowerCase();
  return ['admin', 'founder'].includes(trimmedRole);
}
