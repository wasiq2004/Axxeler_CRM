import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { DollarSign, IndianRupee, Euro, PoundSterling, LucideIcon } from 'lucide-react';

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

interface CurrencyContextType {
  currency: Currency;
  setCurrencyByCode: (code: string) => void;
  availableCurrencies: Currency[];
  formatCurrency: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('crm_currency');
    return saved ? CURRENCIES[saved] || CURRENCIES.INR : CURRENCIES.INR; // Default to INR as per user request
  });

  const setCurrencyByCode = (code: string) => {
    const newCurrency = CURRENCIES[code];
    if (newCurrency) {
      setCurrency(newCurrency);
      localStorage.setItem('crm_currency', code);
    }
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
