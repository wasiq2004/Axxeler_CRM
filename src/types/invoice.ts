export type InvoiceStatus = 'Paid' | 'Due' | 'Overdue' | 'Draft';
export type InvoiceType = 'General' | 'Tax';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  invoiceType?: InvoiceType;
  items: InvoiceItem[];
  taxRate: number; // as a percentage, e.g., 8 for 8%
  paymentTerms?: string | null;
  templateId?: string | null;
  customHtml?: string | null;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  html: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
