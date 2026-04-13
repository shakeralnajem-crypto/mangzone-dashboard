import { useAuthStore } from '@/store/authStore';
import {
  can,
  canAccessPage,
  canSeeAction,
  type DeletePermission,
  type ActionPermission,
} from '@/lib/permissions';

/**
 * Returns role-based permission helpers for the current user.
 *
 * Usage:
 *   const { can, canPage, canAction } = usePermissions();
 *   if (can('delete:expense'))      { ... }
 *   if (canPage('/billing'))        { ... }
 *   if (canAction('create:invoice')){ ... }
 */
export function usePermissions() {
  const profile = useAuthStore((s) => s.profile);
  const role = profile?.role ?? null;

  return {
    role,
    isAdmin:        role === 'ADMIN',
    isDoctor:       role === 'DOCTOR',
    isReceptionist: role === 'RECEPTIONIST',
    isAccountant:   role === 'ACCOUNTANT',

    /** True when the current role may delete the given entity type. */
    can: (permission: DeletePermission): boolean => can(role, permission),

    /** True when the current role may open the given page path. */
    canPage: (path: string): boolean => canAccessPage(role, path),

    /** True when the current role may perform the given UI action. */
    canAction: (action: ActionPermission): boolean => canSeeAction(role, action),
  };
}
