const STAFF_ROLES = new Set(['admin', 'cfi', 'staff', 'ops', 'founder']);

export type StaffRole = 'admin' | 'cfi' | 'staff' | 'ops' | 'founder';

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  if (!role) return false;
  return STAFF_ROLES.has(role);
}

export function normalizeStaffRole(role: string | null | undefined): StaffRole | null {
  if (!role) return null;
  if (['cfi', 'staff', 'ops', 'founder', 'admin'].includes(role)) {
    return role as StaffRole;
  }
  return null;
}

// Helper functions for specific role checks
export function isOpsRole(role: string | null | undefined): boolean {
  return role === 'ops' || role === 'founder' || role === 'admin';
}

export function isCfiRole(role: string | null | undefined): boolean {
  return role === 'cfi' || role === 'founder' || role === 'admin';
}

export function isFounderRole(role: string | null | undefined): boolean {
  return role === 'founder';
}

export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'founder';
}

