import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useApi } from './ApiContext';
import { useAuth } from './AuthContext';
import type { User } from '../types';

interface UsersContextType {
  users: Record<string, User>;
  isLoading: boolean;
  updateUser: (userId: string, userData: Partial<User>) => void;
  refresh: () => Promise<void>;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export const UsersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<Record<string, User>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { crmApi } = useApi();
  const { isAuthenticated } = useAuth();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await crmApi.getUsers();
      const list: User[] = res.data || [];
      setUsers(Object.fromEntries(list.map(u => [u.id, u])));
    } catch {
      setUsers({});
    } finally {
      setIsLoading(false);
    }
  }, [crmApi]);

  useEffect(() => {
    if (isAuthenticated) fetchUsers();
    else setUsers({});
  }, [isAuthenticated, fetchUsers]);

  const updateUser = (userId: string, userData: Partial<User>) => {
    setUsers(prev => ({
      ...prev,
      [userId]: { ...prev[userId], ...userData },
    }));
  };

  return (
    <UsersContext.Provider value={{ users, isLoading, updateUser, refresh: fetchUsers }}>
      {children}
    </UsersContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (context === undefined) throw new Error('useUsers must be used within a UsersProvider');
  return context;
};
