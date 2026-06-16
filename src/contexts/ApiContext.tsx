import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import CrmApi from '../api/crmApi';

interface ApiContextType {
  crmApi: CrmApi;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const crmApi = useMemo(() => new CrmApi(), []);

  return (
    <ApiContext.Provider value={{ crmApi }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};
