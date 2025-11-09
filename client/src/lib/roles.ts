const STAFF_ROLES = new Set(['admin', 'cfi', 'staff']);

export type StaffRole = 'admin' | 'cfi' | 'staff';

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  if (!role) return false;
  return STAFF_ROLES.has(role);
}

export function normalizeStaffRole(role: string | null | undefined): StaffRole | null {
  if (!role) return null;
  if (role === 'cfi' || role === 'staff') return role;
  if (role === 'admin') return 'admin';
  return null;
}

