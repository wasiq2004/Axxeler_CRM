import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import {
  WhatsAppBusinessAccount,
  Contact,
  ContactGroup,
  CampaignModuleItem,
  CampaignRecipient,
  CampaignLead,
  ImportJob,
  CampaignAuditLog,
  WhatsAppTemplate
} from '../types';
import { useApi } from './ApiContext';
import { useAuth } from './AuthContext';

interface CampaignModuleContextType {
  accounts: WhatsAppBusinessAccount[];
  contacts: Contact[];
  groups: ContactGroup[];
  campaigns: CampaignModuleItem[];
  recipients: CampaignRecipient[];
  leads: CampaignLead[];
  importJobs: ImportJob[];
  auditLogs: CampaignAuditLog[];
  templates: WhatsAppTemplate[];
  isLoading: boolean;

  // Account methods
  connectAccount: (account: Omit<WhatsAppBusinessAccount, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  disconnectAccount: (accountId: string) => void;
  refreshAccount: (accountId: string) => void;
  removeAccount: (accountId: string) => void;

  // Contact methods
  importContacts: (contacts: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  createContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateContact: (contactId: string, updates: Partial<Contact>) => void;

  // Campaign methods
  createCampaign: (campaign: Omit<CampaignModuleItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCampaign: (campaignId: string, updates: Partial<CampaignModuleItem>) => Promise<void>;
  deleteCampaign: (campaignId: string) => Promise<void>;
  sendCampaign: (campaignId: string) => Promise<void>;
  sendTestMessage: (campaignId: string, testPhone: string) => void;

  // Lead methods
  createLead: (lead: Omit<CampaignLead, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLead: (leadId: string, updates: Partial<CampaignLead>) => void;

  // Import job methods
  createImportJob: (job: Omit<ImportJob, 'id' | 'createdAt'>) => void;
  updateImportJob: (jobId: string, updates: Partial<ImportJob>) => void;

  // Audit log methods
  createAuditLog: (log: Omit<CampaignAuditLog, 'id' | 'createdAt'>) => void;
}

const CampaignModuleContext = createContext<CampaignModuleContextType | undefined>(undefined);

export const CampaignModuleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<WhatsAppBusinessAccount[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignModuleItem[]>([]);
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
  const [leads, setLeads] = useState<CampaignLead[]>([]);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [auditLogs, setAuditLogs] = useState<CampaignAuditLog[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { crmApi } = useApi();
  const { isAuthenticated, user } = useAuth();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [accountsRes, templatesRes, campaignsRes, contactsRes, importJobsRes] = await Promise.all([
        crmApi.getWhatsAppAccounts(),
        crmApi.getWhatsAppTemplates(),
        crmApi.getCampaigns(),
        crmApi.getContacts(),
        crmApi.getImportJobs(),
      ]);
      setAccounts(accountsRes.data || []);
      setTemplates(templatesRes.data || []);
      setCampaigns(campaignsRes.data || []);
      setContacts(contactsRes.data || []);
      setImportJobs(importJobsRes.data || []);
    } catch {
      // keep existing state on error
    } finally {
      setIsLoading(false);
    }
  }, [crmApi]);

  useEffect(() => {
    if (isAuthenticated) fetchData();
    else {
      setAccounts([]);
      setTemplates([]);
      setCampaigns([]);
      setContacts([]);
      setImportJobs([]);
    }
  }, [isAuthenticated, fetchData]);

  // Account methods
  const connectAccount = async (account: Omit<WhatsAppBusinessAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await crmApi.connectWhatsAppAccount({
      accountIdFromProvider: account.accountIdFromProvider,
      name: account.name,
      phoneNumber: account.phoneNumber,
      tokenEncrypted: account.tokenEncrypted,
      status: account.status,
    });
    setAccounts(prev => [...prev, res.data]);
  };

  const disconnectAccount = (accountId: string) => {
    setAccounts(prev =>
      prev.map(account =>
        account.id === accountId
          ? { ...account, status: 'disconnected', updatedAt: new Date().toISOString() }
          : account
      )
    );
  };

  const refreshAccount = (accountId: string) => {
    setAccounts(prev =>
      prev.map(account =>
        account.id === accountId
          ? { ...account, updatedAt: new Date().toISOString() }
          : account
      )
    );
  };

  const removeAccount = (accountId: string) => {
    setAccounts(prev => prev.filter(account => account.id !== accountId));
  };

  // Contact methods
  const importContacts = (newContacts: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    const contactsToAdd: Contact[] = newContacts.map(contact => ({
      ...contact,
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    setContacts(prev => [...prev, ...contactsToAdd]);
  };

  const createContact = (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newContact: Contact = {
      ...contact,
      id: `contact_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setContacts(prev => [...prev, newContact]);
  };

  const updateContact = (contactId: string, updates: Partial<Contact>) => {
    setContacts(prev =>
      prev.map(contact =>
        contact.id === contactId
          ? { ...contact, ...updates, updatedAt: new Date().toISOString() }
          : contact
      )
    );
  };

  // Campaign methods
  const createCampaign = async (campaign: Omit<CampaignModuleItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await crmApi.createCampaign({ ...campaign, createdBy: user?.id });
    setCampaigns(prev => [...prev, res.data]);
  };

  const updateCampaign = async (campaignId: string, updates: Partial<CampaignModuleItem>) => {
    const res = await crmApi.updateCampaign(campaignId, updates);
    setCampaigns(prev =>
      prev.map(campaign => campaign.id === campaignId ? res.data : campaign)
    );
  };

  const deleteCampaign = async (campaignId: string) => {
    await crmApi.deleteCampaign(campaignId);
    setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
    setRecipients(prev => prev.filter(recipient => recipient.campaignId !== campaignId));
  };

  const sendCampaign = async (campaignId: string) => {
    await crmApi.sendCampaign(campaignId);
    setCampaigns(prev =>
      prev.map(campaign => campaign.id === campaignId ? { ...campaign, status: 'sending' } : campaign)
    );
  };

  const sendTestMessage = (campaignId: string, testPhone: string) => {
    console.log(`Sending test message for campaign ${campaignId} to ${testPhone}`);
  };

  // Lead methods
  const createLead = (lead: Omit<CampaignLead, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newLead: CampaignLead = {
      ...lead,
      id: `lead_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setLeads(prev => [...prev, newLead]);
  };

  const updateLead = (leadId: string, updates: Partial<CampaignLead>) => {
    setLeads(prev =>
      prev.map(lead =>
        lead.id === leadId
          ? { ...lead, ...updates, updatedAt: new Date().toISOString() }
          : lead
      )
    );
  };

  // Import job methods
  const createImportJob = (job: Omit<ImportJob, 'id' | 'createdAt'>) => {
    const newJob: ImportJob = {
      ...job,
      id: `import_job_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setImportJobs(prev => [...prev, newJob]);
  };

  const updateImportJob = (jobId: string, updates: Partial<ImportJob>) => {
    setImportJobs(prev =>
      prev.map(job =>
        job.id === jobId
          ? { ...job, ...updates }
          : job
      )
    );
  };

  // Audit log methods
  const createAuditLog = (log: Omit<CampaignAuditLog, 'id' | 'createdAt'>) => {
    const newLog: CampaignAuditLog = {
      ...log,
      id: `log_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setAuditLogs(prev => [...prev, newLog]);
  };

  return (
    <CampaignModuleContext.Provider value={{
      accounts,
      contacts,
      groups,
      campaigns,
      recipients,
      leads,
      importJobs,
      auditLogs,
      templates,
      isLoading,
      connectAccount,
      disconnectAccount,
      refreshAccount,
      removeAccount,
      importContacts,
      createContact,
      updateContact,
      createCampaign,
      updateCampaign,
      deleteCampaign,
      sendCampaign,
      sendTestMessage,
      createLead,
      updateLead,
      createImportJob,
      updateImportJob,
      createAuditLog
    }}>
      {children}
    </CampaignModuleContext.Provider>
  );
};

export const useCampaignModule = () => {
  const context = useContext(CampaignModuleContext);
  if (context === undefined) {
    throw new Error('useCampaignModule must be used within a CampaignModuleProvider');
  }
  return context;
};
