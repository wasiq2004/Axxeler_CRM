import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useApi } from './ApiContext';
import { useAuth } from './AuthContext';
import type { Lead, AdLead, LeadStatus } from '../types';

interface LeadsContextType {
  leads: Lead[];
  isLoading: boolean;
  addLeads: (adLeads: AdLead[]) => Promise<void>;
  createLead: (leadData: Pick<Lead, 'firstName' | 'lastName' | 'email' | 'company' | 'phone' | 'ownerId'>, status?: LeadStatus) => Promise<void>;
  updateLeadStatus: (leadId: string, newStatus: LeadStatus) => Promise<void>;
  editLead: (leadId: string, leadData: Partial<Lead>) => Promise<void>;
  deleteLead: (leadId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const LeadsContext = createContext<LeadsContextType | undefined>(undefined);

export const LeadsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { crmApi } = useApi();
  const { isAuthenticated } = useAuth();

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await crmApi.getLeads();
      setLeads(res.data || []);
    } catch {
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, [crmApi]);

  useEffect(() => {
    if (isAuthenticated) fetchLeads();
    else setLeads([]);
  }, [isAuthenticated, fetchLeads]);

  const addLeads = async (adLeads: AdLead[]) => {
    const existingEmails = new Set(leads.map(l => l.email));
    const newLeads = adLeads
      .filter(al => !existingEmails.has(al.field_data.email))
      .map(al => {
        const parts = al.field_data.full_name.trim().split(' ');
        return {
          firstName: parts[0] || '',
          lastName: parts.slice(1).join(' ') || '',
          company: al.field_data.company_name || 'N/A',
          email: al.field_data.email,
          phone: al.field_data.phone_number || '',
          source: al.campaign_name ? `Meta Ad: ${al.campaign_name}` : 'Meta Ad',
          status: 'New' as LeadStatus,
          tags: ['Meta Ad'],
          score: 50,
        };
      });
    if (newLeads.length === 0) return;
    await crmApi.importLeads({ leads: newLeads });
    await fetchLeads();
  };

  const createLead = async (
    leadData: Pick<Lead, 'firstName' | 'lastName' | 'email' | 'company' | 'phone' | 'ownerId'>,
    status: LeadStatus = 'New',
  ) => {
    const res = await crmApi.createLead({ ...leadData, status, source: 'Manual Entry', score: 50, tags: [] });
    setLeads(prev => [res.data, ...prev]);
  };

  const updateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    const res = await crmApi.updateLeadStatus(leadId, newStatus);
    setLeads(prev => prev.map(l => (l.id === leadId ? res.data : l)));
  };

  const editLead = async (leadId: string, leadData: Partial<Lead>) => {
    const res = await crmApi.updateLead(leadId, leadData);
    setLeads(prev => prev.map(l => (l.id === leadId ? res.data : l)));
  };

  const deleteLead = async (leadId: string) => {
    await crmApi.deleteLead(leadId);
    setLeads(prev => prev.filter(l => l.id !== leadId));
  };

  return (
    <LeadsContext.Provider value={{ leads, isLoading, addLeads, createLead, updateLeadStatus, editLead, deleteLead, refresh: fetchLeads }}>
      {children}
    </LeadsContext.Provider>
  );
};

export const useLeads = () => {
  const context = useContext(LeadsContext);
  if (context === undefined) throw new Error('useLeads must be used within a LeadsProvider');
  return context;
};
