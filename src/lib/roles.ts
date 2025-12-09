// Role definitions for the application
export type UserRole = 'owner' | 'admin' | 'staff' | 'cfi' | 'ops' | 'founder';

export const STAFF_ROLES: UserRole[] = ['admin', 'staff', 'cfi', 'ops', 'founder'];

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
