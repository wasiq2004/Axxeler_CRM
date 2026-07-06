import { useAuth } from '@/contexts/AuthContext';

// Client-side mirror of the server's permission model (server/src/utils/permissions.ts).
// Used only to hide/disable controls the user can't use — the server still enforces.
export type PermissionKey =
  | 'viewLeads'
  | 'editLeads'
  | 'deleteLeads'
  | 'viewDeals'
  | 'editDeals'
  | 'manageTeam'
  | 'viewReports'
  | 'exportData';

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

export const useCan = () => {
  const { user } = useAuth();
  return (key: PermissionKey): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const perms =
      user.permissions && typeof user.permissions === 'object' && !Array.isArray(user.permissions)
        ? (user.permissions as Record<string, boolean>)
        : {};
    if (key in perms) return perms[key] === true;
    return (user.role === 'manager' ? MANAGER_DEFAULTS : MEMBER_DEFAULTS)[key] ?? false;
  };
};
