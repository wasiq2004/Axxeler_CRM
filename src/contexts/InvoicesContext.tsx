import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useApi } from './ApiContext';
import { useAuth } from './AuthContext';
import type { Invoice } from '../types';

interface InvoicesContextType {
  invoices: Invoice[];
  isLoading: boolean;
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Promise<void>;
  updateInvoice: (id: string, updatedInvoiceData: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const InvoicesContext = createContext<InvoicesContextType | undefined>(undefined);

export const InvoicesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { crmApi } = useApi();
  const { isAuthenticated } = useAuth();

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await crmApi.getInvoices();
      setInvoices(res.data || []);
    } catch {
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, [crmApi]);

  useEffect(() => {
    if (isAuthenticated) fetchInvoices();
    else setInvoices([]);
  }, [isAuthenticated, fetchInvoices]);

  const addInvoice = async (newInvoiceData: Omit<Invoice, 'id'>) => {
    const res = await crmApi.createInvoice(newInvoiceData);
    setInvoices(prev => [res.data, ...prev]);
  };

  const updateInvoice = async (id: string, updatedInvoiceData: Partial<Invoice>) => {
    const res = await crmApi.updateInvoice(id, updatedInvoiceData);
    setInvoices(prev => prev.map(inv => (inv.id === id ? res.data : inv)));
  };

  const deleteInvoice = async (id: string) => {
    await crmApi.deleteInvoice(id);
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  return (
    <InvoicesContext.Provider value={{ invoices, isLoading, addInvoice, updateInvoice, deleteInvoice, refresh: fetchInvoices }}>
      {children}
    </InvoicesContext.Provider>
  );
};

export const useInvoices = () => {
  const context = useContext(InvoicesContext);
  if (context === undefined) throw new Error('useInvoices must be used within an InvoicesProvider');
  return context;
};
