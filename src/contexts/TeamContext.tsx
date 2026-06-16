import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useApi } from './ApiContext';
import { useAuth } from './AuthContext';

export type TeamMemberRole = 'Manager' | 'Team Member' | 'Admin';
export type TeamMemberStatus = 'Active' | 'Inactive';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  avatar: string;
  joinedDate: string;
  permissions: {
    viewLeads: boolean;
    editLeads: boolean;
    deleteLeads: boolean;
    viewDeals: boolean;
    editDeals: boolean;
    manageTeam: boolean;
    viewReports: boolean;
    exportData: boolean;
  };
}

interface TeamContextType {
  teamMembers: TeamMember[];
  isLoading: boolean;
  addTeamMember: (member: Omit<TeamMember, 'id'>) => Promise<void>;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => Promise<void>;
  deleteTeamMember: (id: string) => Promise<void>;
  getTeamMemberById: (id: string) => TeamMember | undefined;
  refresh: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

const DEFAULT_PERMISSIONS = {
  viewLeads: true,
  editLeads: false,
  deleteLeads: false,
  viewDeals: true,
  editDeals: false,
  manageTeam: false,
  viewReports: false,
  exportData: false,
};

const dbRoleToUi = (role: string): TeamMemberRole => {
  if (role === 'admin') return 'Admin';
  if (role === 'manager') return 'Manager';
  return 'Team Member';
};

const uiRoleToDb = (role: TeamMemberRole): string => {
  if (role === 'Admin') return 'admin';
  if (role === 'Manager') return 'manager';
  return 'team_member';
};

const mapUserToMember = (u: any): TeamMember => ({
  id: u.id,
  name: u.name || '',
  email: u.email || '',
  phone: u.phone || '',
  role: dbRoleToUi(u.role),
  status: 'Active',
  avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || '')}&background=6366F1&color=fff`,
  joinedDate: u.createdAt ? u.createdAt.split('T')[0] : '',
  permissions: u.permissions && typeof u.permissions === 'object' && 'viewLeads' in u.permissions
    ? u.permissions
    : DEFAULT_PERMISSIONS,
});

export const TeamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { crmApi } = useApi();
  const { isAuthenticated } = useAuth();

  const fetchTeam = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await crmApi.getUsers();
      setTeamMembers((res.data || []).map(mapUserToMember));
    } catch {
      setTeamMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [crmApi]);

  useEffect(() => {
    if (isAuthenticated) fetchTeam();
    else setTeamMembers([]);
  }, [isAuthenticated, fetchTeam]);

  const addTeamMember = async (member: Omit<TeamMember, 'id'>) => {
    const res = await crmApi.createUser({
      name: member.name,
      email: member.email,
      password: 'Password123',
      role: uiRoleToDb(member.role),
      phone: member.phone,
      avatar: member.avatar,
      permissions: member.permissions,
    });
    setTeamMembers(prev => [...prev, mapUserToMember(res.data)]);
  };

  const updateTeamMember = async (id: string, updates: Partial<TeamMember>) => {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.avatar) dbUpdates.avatar = updates.avatar;
    if (updates.role) dbUpdates.role = uiRoleToDb(updates.role);
    if (updates.permissions) dbUpdates.permissions = updates.permissions;

    const res = await crmApi.updateUser(id, dbUpdates);
    setTeamMembers(prev => prev.map(m => (m.id === id ? mapUserToMember(res.data) : m)));
  };

  const deleteTeamMember = async (id: string) => {
    await crmApi.deleteUser(id);
    setTeamMembers(prev => prev.filter(m => m.id !== id));
  };

  const getTeamMemberById = (id: string) => teamMembers.find(m => m.id === id);

  return (
    <TeamContext.Provider value={{ teamMembers, isLoading, addTeamMember, updateTeamMember, deleteTeamMember, getTeamMemberById, refresh: fetchTeam }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) throw new Error('useTeam must be used within TeamProvider');
  return context;
};
