import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useApi } from './ApiContext';
import { useAuth } from './AuthContext';
import type { Deal, DealStage } from '../types';

interface DealsContextType {
  deals: Deal[];
  isLoading: boolean;
  updateDealStage: (dealId: string, newStage: DealStage) => Promise<void>;
  editDeal: (dealId: string, dealData: Partial<Deal>) => Promise<void>;
  deleteDeal: (dealId: string) => Promise<void>;
  createDeal: (deal: Omit<Deal, 'id'>) => Promise<void>;
  refresh: () => Promise<void>;
}

const DealsContext = createContext<DealsContextType | undefined>(undefined);

export const DealsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { crmApi } = useApi();
  const { isAuthenticated } = useAuth();

  const fetchDeals = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await crmApi.getDeals();
      setDeals(res.data || []);
    } catch {
      setDeals([]);
    } finally {
      setIsLoading(false);
    }
  }, [crmApi]);

  useEffect(() => {
    if (isAuthenticated) fetchDeals();
    else setDeals([]);
  }, [isAuthenticated, fetchDeals]);

  const updateDealStage = async (dealId: string, newStage: DealStage) => {
    const res = await crmApi.updateDealStage(dealId, newStage);
    setDeals(prev => prev.map(d => (d.id === dealId ? res.data : d)));
  };

  const editDeal = async (dealId: string, dealData: Partial<Deal>) => {
    const res = await crmApi.updateDeal(dealId, dealData);
    setDeals(prev => prev.map(d => (d.id === dealId ? res.data : d)));
  };

  const deleteDeal = async (dealId: string) => {
    await crmApi.deleteDeal(dealId);
    setDeals(prev => prev.filter(d => d.id !== dealId));
  };

  const createDeal = async (dealData: Omit<Deal, 'id'>) => {
    const res = await crmApi.createDeal(dealData);
    setDeals(prev => [res.data, ...prev]);
  };

  return (
    <DealsContext.Provider value={{ deals, isLoading, updateDealStage, editDeal, deleteDeal, createDeal, refresh: fetchDeals }}>
      {children}
    </DealsContext.Provider>
  );
};

export const useDeals = () => {
  const context = useContext(DealsContext);
  if (context === undefined) throw new Error('useDeals must be used within a DealsProvider');
  return context;
};
