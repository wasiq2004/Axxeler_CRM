// Central RBAC helper. The frontend (Team page) stores a granular permissions
// JSON on each user; this mirrors that model on the server so the flags are
// actually enforced instead of being decorative.

export type PermissionKey =
  | 'viewLeads'
  | 'editLeads'
  | 'deleteLeads'
  | 'viewDeals'
  | 'editDeals'
  | 'manageTeam'
  | 'viewReports'
  | 'exportData';

export interface AuthUser {
  id: string;
  role: string;
  permissions?: unknown;
}

// Defaults applied when a user has no explicit flag for a key. Kept in sync with
// DEFAULT_PERMISSIONS in src/contexts/TeamContext.tsx.
const MEMBER_DEFAULTS: Record<PermissionKey, boolean> = {
  viewLeads: true,
  editLeads: false,
  deleteLeads: false,
  viewDeals: true,
  editDeals: false,
  manageTeam: false,
  viewReports: false,
  exportData: false,
};

const MANAGER_DEFAULTS: Record<PermissionKey, boolean> = {
  viewLeads: true,
  editLeads: true,
  deleteLeads: true,
  viewDeals: true,
  editDeals: true,
  manageTeam: true,
  viewReports: true,
  exportData: true,
};

export function can(user: AuthUser | undefined, key: PermissionKey): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true; // admins always have every permission
  const perms =
    user.permissions && typeof user.permissions === 'object'
      ? (user.permissions as Record<string, unknown>)
      : {};
  if (key in perms) return perms[key] === true;
  return (user.role === 'manager' ? MANAGER_DEFAULTS : MEMBER_DEFAULTS)[key] ?? false;
}
