import type { InvoiceStatus } from '../../types';

export type InvoiceStatusFilter = InvoiceStatus | 'All';

interface InvoiceStatusMeta {
  label: string;
  chipClass: string;
  badge: {
    bg: string;
    border: string;
    text: string;
  };
}

const STATUS_META: Record<InvoiceStatus, InvoiceStatusMeta> = {
  Draft: {
    label: 'Draft',
    chipClass: 'bg-gray-100 text-gray-800',
    badge: {
      bg: 'bg-gray-100',
      border: 'border-gray-500',
      text: 'text-gray-800',
    },
  },
  Due: {
    label: 'Due',
    chipClass: 'bg-yellow-100 text-yellow-800',
    badge: {
      bg: 'bg-yellow-100',
      border: 'border-yellow-500',
      text: 'text-yellow-800',
    },
  },
  Overdue: {
    label: 'Overdue',
    chipClass: 'bg-red-100 text-red-800',
    badge: {
      bg: 'bg-red-100',
      border: 'border-red-500',
      text: 'text-red-800',
    },
  },
  Paid: {
    label: 'Paid',
    chipClass: 'bg-green-100 text-green-800',
    badge: {
      bg: 'bg-green-100',
      border: 'border-green-500',
      text: 'text-green-800',
    },
  },
};

export const getInvoiceStatusMeta = (status: InvoiceStatus): InvoiceStatusMeta => {
  return STATUS_META[status] || STATUS_META.Draft;
};

export const INVOICE_STATUS_FILTER_OPTIONS: { value: InvoiceStatusFilter; label: string }[] = [
  { value: 'All', label: 'All Statuses' },
  ...Object.entries(STATUS_META).map(([key, meta]) => ({
    value: key as InvoiceStatus,
    label: meta.label,
  })),
];

