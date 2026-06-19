import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { DollarSign, IndianRupee, Euro, PoundSterling, LucideIcon } from 'lucide-react';
import { useApi } from './ApiContext';
import { useAuth } from './AuthContext';

type Currency = {
  code: string;
  symbol: string;
  name: string;
  icon: LucideIcon;
};

const CURRENCIES: Record<string, Currency> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', icon: DollarSign },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', icon: IndianRupee },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', icon: Euro },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', icon: PoundSterling },
};

const FALLBACK_CODE = 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrencyByCode: (code: string) => void;
  availableCurrencies: Currency[];
  formatCurrency: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { crmApi } = useApi();
  const { isAuthenticated } = useAuth();

  // Initialise instantly from the local cache; the company setting (the source of
  // truth) is loaded from the backend once authenticated and overrides this.
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('crm_currency');
    return (saved && CURRENCIES[saved]) || CURRENCIES[FALLBACK_CODE];
  });

  const applyCode = useCallback((code?: string | null) => {
    if (code && CURRENCIES[code]) {
      setCurrency(CURRENCIES[code]);
      localStorage.setItem('crm_currency', code);
    }
  }, []);

  // Load the company's configured currency from the backend (single source of truth).
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const res = await crmApi.getCompanySettings();
        applyCode(res.data?.currency);
      } catch {
        // keep cached value
      }
    })();
  }, [isAuthenticated, crmApi, applyCode]);

  const setCurrencyByCode = (code: string) => {
    if (!CURRENCIES[code]) return;
    applyCode(code);
    // Persist to the backend so every surface (invoices, PDFs, reports) agrees.
    crmApi.updateCompanySettings({ currency: code }).catch(() => {
      /* non-fatal: local cache still updated */
    });
  };

  const formatCurrency = (amount: number) => {
    return `${currency.symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrencyByCode,
      availableCurrencies: Object.values(CURRENCIES),
      formatCurrency
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
