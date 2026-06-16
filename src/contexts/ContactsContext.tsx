import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useApi } from './ApiContext';
import { useAuth } from './AuthContext';
import type { Contact } from '../types';

interface ContactsContextType {
  contacts: Contact[];
  isLoading: boolean;
  addContact: (contactData: Omit<Contact, 'id' | 'tags' | 'source' | 'customFields' | 'createdAt' | 'updatedAt' | 'normalizedPhone'>) => Promise<void>;
  editContact: (contactId: string, contactData: Partial<Contact>) => Promise<void>;
  deleteContact: (contactId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

export const ContactsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { crmApi } = useApi();
  const { isAuthenticated } = useAuth();

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await crmApi.getContacts();
      setContacts(res.data || []);
    } catch {
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, [crmApi]);

  useEffect(() => {
    if (isAuthenticated) fetchContacts();
    else setContacts([]);
  }, [isAuthenticated, fetchContacts]);

  const addContact = async (
    contactData: Omit<Contact, 'id' | 'tags' | 'source' | 'customFields' | 'createdAt' | 'updatedAt' | 'normalizedPhone'>,
  ) => {
    const res = await crmApi.createContact({
      ...contactData,
      tags: [],
      source: 'Manual Entry',
      customFields: {},
    });
    setContacts(prev => [res.data, ...prev]);
  };

  const editContact = async (contactId: string, contactData: Partial<Contact>) => {
    const res = await crmApi.updateContact(contactId, contactData);
    setContacts(prev => prev.map(c => (c.id === contactId ? res.data : c)));
  };

  const deleteContact = async (contactId: string) => {
    await crmApi.deleteContact(contactId);
    setContacts(prev => prev.filter(c => c.id !== contactId));
  };

  return (
    <ContactsContext.Provider value={{ contacts, isLoading, addContact, editContact, deleteContact, refresh: fetchContacts }}>
      {children}
    </ContactsContext.Provider>
  );
};

export const useContacts = () => {
  const context = useContext(ContactsContext);
  if (context === undefined) throw new Error('useContacts must be used within a ContactsProvider');
  return context;
};
