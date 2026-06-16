import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useApi } from './ApiContext';
import { useAuth } from './AuthContext';
import type { Campaign, CampaignStatus, CampaignType } from '../types';

interface CampaignsContextType {
  campaigns: Campaign[];
  isLoading: boolean;
  createCampaign: (data: Omit<Campaign, 'id' | 'createdAt'>) => Promise<void>;
  updateCampaign: (id: string, data: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CampaignsContext = createContext<CampaignsContextType | undefined>(undefined);

const toFrontendStatus = (s: string): CampaignStatus => {
  if (s === 'completed') return 'Completed';
  if (s === 'sending' || s === 'queued') return 'Active';
  return 'Inactive';
};

const mapDbCampaign = (c: any): Campaign => ({
  id: c.id,
  name: c.name,
  type: (c.messageType === 'free_text' ? 'Broadcast' : 'Broadcast') as CampaignType,
  status: toFrontendStatus(c.status),
  audience: c.recipients?.length ?? 0,
  createdAt: c.createdAt,
});

export const CampaignsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { crmApi } = useApi();
  const { isAuthenticated } = useAuth();

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await crmApi.getCampaigns();
      setCampaigns((res.data || []).map(mapDbCampaign));
    } catch {
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  }, [crmApi]);

  useEffect(() => {
    if (isAuthenticated) fetchCampaigns();
    else setCampaigns([]);
  }, [isAuthenticated, fetchCampaigns]);

  const createCampaign = async (data: Omit<Campaign, 'id' | 'createdAt'>) => {
    const res = await crmApi.createCampaign({
      name: data.name,
      messageType: 'free_text',
      status: 'draft',
    });
    setCampaigns(prev => [mapDbCampaign(res.data), ...prev]);
  };

  const updateCampaign = async (id: string, data: Partial<Campaign>) => {
    const res = await crmApi.updateCampaign(id, data);
    setCampaigns(prev => prev.map(c => (c.id === id ? mapDbCampaign(res.data) : c)));
  };

  const deleteCampaign = async (id: string) => {
    await crmApi.deleteCampaign(id);
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  return (
    <CampaignsContext.Provider value={{ campaigns, isLoading, createCampaign, updateCampaign, deleteCampaign, refresh: fetchCampaigns }}>
      {children}
    </CampaignsContext.Provider>
  );
};

export const useCampaigns = () => {
  const context = useContext(CampaignsContext);
  if (context === undefined) throw new Error('useCampaigns must be used within a CampaignsProvider');
  return context;
};
