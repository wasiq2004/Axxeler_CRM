import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useApi } from './ApiContext';
import { useAuth } from './AuthContext';

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  currency?: string;
}

interface CompanyContextType {
  companyInfo: CompanyInfo;
  isLoading: boolean;
  updateCompanyInfo: (info: Partial<CompanyInfo>) => Promise<void>;
}

const DEFAULT_COMPANY: CompanyInfo = {
  name: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  logo: '/logo.png',
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(DEFAULT_COMPANY);
  const [isLoading, setIsLoading] = useState(false);
  const { crmApi } = useApi();
  const { isAuthenticated } = useAuth();

  const fetchCompany = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await crmApi.getCompanySettings();
      if (res.data) setCompanyInfo(res.data);
    } catch {
      // keep defaults
    } finally {
      setIsLoading(false);
    }
  }, [crmApi]);

  useEffect(() => {
    if (isAuthenticated) fetchCompany();
  }, [isAuthenticated, fetchCompany]);

  const updateCompanyInfo = async (info: Partial<CompanyInfo>) => {
    const updated = { ...companyInfo, ...info };
    setCompanyInfo(updated);
    try {
      const res = await crmApi.updateCompanySettings(updated);
      if (res.data) setCompanyInfo(res.data);
    } catch {
      // rollback
      setCompanyInfo(prev => ({ ...prev }));
    }
  };

  return (
    <CompanyContext.Provider value={{ companyInfo, isLoading, updateCompanyInfo }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) throw new Error('useCompany must be used within a CompanyProvider');
  return context;
};
