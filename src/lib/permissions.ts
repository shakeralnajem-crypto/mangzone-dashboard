import type { UserRole } from '@/types';

// ─── Page Access ──────────────────────────────────────────────────────────────

export const PAGE_ROLES: Record<string, UserRole[]> = {
  '/dashboard':    ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'ACCOUNTANT'],
  '/appointments': ['ADMIN', 'DOCTOR', 'RECEPTIONIST'],
  '/patients':     ['ADMIN', 'DOCTOR', 'RECEPTIONIST'],
  '/leads':        ['ADMIN', 'RECEPTIONIST'],
  '/treatments':   ['ADMIN', 'DOCTOR'],
  '/billing':      ['ADMIN', 'ACCOUNTANT'],
  '/followup':     ['ADMIN', 'RECEPTIONIST'],
  '/reports':      ['ADMIN', 'ACCOUNTANT'],
  '/accounting':   ['ADMIN', 'ACCOUNTANT'],
  '/services':     ['ADMIN'],
  '/staff':        ['ADMIN'],
  '/content':      ['ADMIN'],
  '/settings':     ['ADMIN'],
};

/** Returns true when the role is allowed to open the given pathname. */
export function canAccessPage(
  role: UserRole | null | undefined,
  path: string,
): boolean {
  if (!role) return false;
  const allowed = PAGE_ROLES[path];
  if (!allowed) return true; // unknown/unguarded paths pass through
  return allowed.includes(role);
}

// ─── Action (Add / Edit / Export) Permissions ────────────────────────────────

export type ActionPermission =
  | 'create:appointment'
  | 'create:patient'
  | 'create:lead'
  | 'create:invoice'
  | 'create:treatment'
  | 'create:expense'
  | 'create:service'
  | 'create:staff'
  | 'create:content'
  | 'create:followup'
  | 'export:patients'
  | 'export:invoices';

const ACTION_ROLES: Record<ActionPermission, UserRole[]> = {
  'create:appointment': ['ADMIN', 'DOCTOR', 'RECEPTIONIST'],
  'create:patient':     ['ADMIN', 'DOCTOR', 'RECEPTIONIST'],
  'create:lead':        ['ADMIN', 'RECEPTIONIST'],
  'create:invoice':     ['ADMIN', 'ACCOUNTANT'],
  'create:treatment':   ['ADMIN', 'DOCTOR'],
  'create:expense':     ['ADMIN', 'ACCOUNTANT'],
  'create:service':     ['ADMIN'],
  'create:staff':       ['ADMIN'],
  'create:content':     ['ADMIN'],
  'create:followup':    ['ADMIN', 'RECEPTIONIST'],
  'export:patients':    ['ADMIN', 'DOCTOR', 'RECEPTIONIST'],
  'export:invoices':    ['ADMIN', 'ACCOUNTANT'],
};

/** Returns true when the role is allowed to perform the given UI action. */
export function canSeeAction(
  role: UserRole | null | undefined,
  action: ActionPermission,
): boolean {
  if (!role) return false;
  return ACTION_ROLES[action]?.includes(role) ?? false;
}

// ─── Delete Permissions ───────────────────────────────────────────────────────

export type DeletePermission =
  | 'delete:appointment'
  | 'delete:patient'
  | 'delete:lead'
  | 'delete:treatment'
  | 'delete:invoice'
  | 'delete:expense'
  | 'delete:service'
  | 'delete:staff'
  | 'delete:content';

const ROLE_DELETE_PERMISSIONS: Record<UserRole, DeletePermission[]> = {
  ADMIN: [
    'delete:appointment',
    'delete:patient',
    'delete:lead',
    'delete:treatment',
    'delete:invoice',
    'delete:expense',
    'delete:service',
    'delete:staff',
    'delete:content',
  ],
  DOCTOR:       ['delete:appointment'],
  RECEPTIONIST: [],
  ACCOUNTANT:   ['delete:expense', 'delete:invoice'],
};

/** Returns true when the role is allowed to delete the given entity type. */
export function can(
  role: UserRole | null | undefined,
  permission: DeletePermission,
): boolean {
  if (!role) return false;
  return ROLE_DELETE_PERMISSIONS[role]?.includes(permission) ?? false;
}
