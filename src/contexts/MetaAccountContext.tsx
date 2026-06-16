import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useApi } from './ApiContext';
import { useAuth } from './AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MetaConnection {
  id: string;
  metaUserId: string;
  name: string;
  email: string;
  isConnected: boolean;
  lastSynced: string | null;
}

export interface MetaAdAccount {
  id: string;
  name: string;
  account_id: string;
  currency: string;
  timezone_name: string;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  created_time: string;
  start_time?: string;
  stop_time?: string;
  spend: number;
  clicks: number;
  impressions: number;
  reach: number;
  leads_count: number;
}

export interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  fan_count?: number;
}

export interface MetaLeadForm {
  id: string;
  name: string;
  leads_count: number;
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  created_time: string;
  last_updated_time?: string;
}

export interface MetaFormLead {
  id: string;
  created_time: string;
  field_data: Array<{ name: string; values: string[] }>;
  ad_id?: string;
  ad_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  form_id?: string;
}

// ─── Context Shape ────────────────────────────────────────────────────────────

interface MetaAccountContextType {
  connection: MetaConnection | null;
  adAccounts: MetaAdAccount[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Auth flows
  initiateOAuth: () => Promise<void>;
  connectWithToken: (accessToken: string) => Promise<void>;
  disconnect: () => Promise<void>;

  // Data fetching — all proxied through the backend
  fetchAdAccounts: () => Promise<MetaAdAccount[]>;
  fetchCampaigns: (adAccountId: string) => Promise<MetaCampaign[]>;
  fetchPages: () => Promise<MetaPage[]>;
  fetchLeadForms: (pageId: string, pageToken?: string) => Promise<MetaLeadForm[]>;
  fetchFormLeads: (formId: string) => Promise<MetaFormLead[]>;
  importLeads: (leads: MetaFormLead[]) => Promise<any[]>;

  // Refresh connection status from backend
  refresh: () => Promise<void>;
}

const MetaAccountContext = createContext<MetaAccountContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const MetaAccountProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { crmApi } = useApi();
  const { isAuthenticated } = useAuth();

  const [connection, setConnection] = useState<MetaConnection | null>(null);
  const [adAccounts, setAdAccounts] = useState<MetaAdAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = connection?.isConnected === true;

  // Load connection status from backend on mount
  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await crmApi.getMetaConnection();
      setConnection(res.data || null);
    } catch {
      setConnection(null);
    }
  }, [crmApi, isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ─── Auth Flows ─────────────────────────────────────────────────────────────

  const initiateOAuth = async () => {
    setError(null);
    try {
      const res = await crmApi.getMetaOAuthUrl();
      const { url } = res.data;
      // Redirect the browser to Meta's OAuth dialog
      window.location.href = url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to get OAuth URL';
      setError(msg);
      throw new Error(msg);
    }
  };

  const connectWithToken = async (accessToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await crmApi.connectMetaWithToken(accessToken);
      setConnection(res.data);
      // Pre-load ad accounts after connecting
      try {
        const accRes = await crmApi.getMetaAdAccounts();
        setAdAccounts(accRes.data || []);
      } catch {
        // Non-fatal — user can refresh manually
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect Meta account';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await crmApi.disconnectMeta();
      setConnection(null);
      setAdAccounts([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to disconnect';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Data Fetching ───────────────────────────────────────────────────────────

  const fetchAdAccounts = async (): Promise<MetaAdAccount[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await crmApi.getMetaAdAccounts();
      const accounts = res.data || [];
      setAdAccounts(accounts);
      return accounts;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch ad accounts';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCampaigns = async (adAccountId: string): Promise<MetaCampaign[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await crmApi.getMetaCampaigns(adAccountId);
      return res.data || [];
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch campaigns';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPages = async (): Promise<MetaPage[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await crmApi.getMetaPages();
      return res.data || [];
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch Facebook pages';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeadForms = async (pageId: string, pageToken?: string): Promise<MetaLeadForm[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await crmApi.getMetaLeadForms(pageId, pageToken);
      return res.data || [];
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch lead forms';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFormLeads = async (formId: string): Promise<MetaFormLead[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await crmApi.getMetaFormLeads(formId);
      return res.data || [];
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch leads from form';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const importLeads = async (leads: MetaFormLead[]): Promise<any[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await crmApi.importMetaLeads(leads);
      return res.data || [];
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to import leads';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MetaAccountContext.Provider
      value={{
        connection,
        adAccounts,
        isConnected,
        isLoading,
        error,
        initiateOAuth,
        connectWithToken,
        disconnect,
        fetchAdAccounts,
        fetchCampaigns,
        fetchPages,
        fetchLeadForms,
        fetchFormLeads,
        importLeads,
        refresh,
      }}
    >
      {children}
    </MetaAccountContext.Provider>
  );
};

export const useMetaAccount = () => {
  const context = useContext(MetaAccountContext);
  if (context === undefined) {
    throw new Error('useMetaAccount must be used within a MetaAccountProvider');
  }
  return context;
};
