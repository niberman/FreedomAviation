const STAFF_ROLES = new Set(['admin', 'cfi', 'staff', 'ops', 'founder']);

export type StaffRole = 'admin' | 'cfi' | 'staff' | 'ops' | 'founder';

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  if (!role) return false;
  // Trim the role to handle any whitespace issues from the database
  return STAFF_ROLES.has(role.trim());
}

export function normalizeStaffRole(role: string | null | undefined): StaffRole | null {
  if (!role) return null;
  const trimmedRole = role.trim();
  if (['cfi', 'staff', 'ops', 'founder', 'admin'].includes(trimmedRole)) {
    return trimmedRole as StaffRole;
  }
  return null;
}

// Helper functions for specific role checks
export function isOpsRole(role: string | null | undefined): boolean {
  if (!role) return false;
  const trimmedRole = role.trim();
  return trimmedRole === 'ops' || trimmedRole === 'founder' || trimmedRole === 'admin';
}

export function isCfiRole(role: string | null | undefined): boolean {
  if (!role) return false;
  const trimmedRole = role.trim();
  return trimmedRole === 'cfi' || trimmedRole === 'founder' || trimmedRole === 'admin';
}

export function isFounderRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return role.trim() === 'founder';
}

export function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  const trimmedRole = role.trim();
  return trimmedRole === 'admin' || trimmedRole === 'founder';
}

