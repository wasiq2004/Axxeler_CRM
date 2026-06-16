import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useApi } from './ApiContext';
import { useAuth } from './AuthContext';
import { useInvoices } from './InvoicesContext';
import { Notification } from '../types';

interface NotificationsContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  unreadCount: number;
  checkNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { crmApi } = useApi();
  const { isAuthenticated } = useAuth();
  const { invoices } = useInvoices();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await crmApi.getNotifications();
      setNotifications(res.data || []);
    } catch {
      setNotifications([]);
    }
  }, [crmApi]);

  useEffect(() => {
    if (isAuthenticated) fetchNotifications();
    else setNotifications([]);
  }, [isAuthenticated, fetchNotifications]);

  const addNotification = async (data: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    try {
      const res = await crmApi.createNotification(data);
      setNotifications(prev => [res.data, ...prev]);
    } catch {
      // best-effort
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await crmApi.markNotificationAsRead(id);
    } catch {
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: false } : n)));
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await crmApi.markAllNotificationsAsRead();
    } catch {
      await fetchNotifications();
    }
  };

  const removeNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await crmApi.deleteNotification(id);
    } catch {
      await fetchNotifications();
    }
  };

  const checkOverdueInvoices = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    invoices.forEach(invoice => {
      if (invoice.status !== 'Due' && invoice.status !== 'Overdue') return;
      const dueDate = new Date(invoice.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        const exists = notifications.find(n => n.relatedEntityId === invoice.id && n.type === 'invoice_overdue');
        if (!exists) {
          addNotification({
            type: 'invoice_overdue',
            title: 'Invoice Overdue',
            message: `Invoice ${invoice.invoiceNumber} for ${invoice.clientName} is overdue.`,
            relatedEntityId: invoice.id,
            relatedEntityType: 'invoice',
          });
        }
      } else if (dueDate <= new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)) {
        const exists = notifications.find(n => n.relatedEntityId === invoice.id && n.type === 'invoice_due_soon');
        if (!exists) {
          const days = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          addNotification({
            type: 'invoice_due_soon',
            title: 'Invoice Due Soon',
            message: `Invoice ${invoice.invoiceNumber} for ${invoice.clientName} is due in ${days === 1 ? '1 day' : `${days} days`}.`,
            relatedEntityId: invoice.id,
            relatedEntityType: 'invoice',
          });
        }
      }
    });
  }, [invoices, notifications]);

  useEffect(() => {
    if (!isAuthenticated || invoices.length === 0) return;
    checkOverdueInvoices();
    const interval = setInterval(checkOverdueInvoices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [invoices, isAuthenticated]);

  return (
    <NotificationsContext.Provider value={{ notifications, addNotification, markAsRead, markAllAsRead, removeNotification, unreadCount, checkNotifications: checkOverdueInvoices }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) throw new Error('useNotifications must be used within a NotificationsProvider');
  return context;
};
