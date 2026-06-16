import React, { useState, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import InvoicesTable from '@/features/invoices/components/InvoicesTable';
import InvoiceFilters from '@/features/invoices/components/InvoiceFilters';
import { useInvoices } from '@/contexts/InvoicesContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Invoice, InvoiceStatus } from '@/types';
import Button from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { invoices, updateInvoice, deleteInvoice } = useInvoices();
  const { currency, formatCurrency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'All'>('All');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);




  const filteredInvoices = useMemo(() => {
    let result = invoices;

    // Apply search filter
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      result = result.filter(invoice =>
        invoice.clientName.toLowerCase().includes(lowercasedQuery) ||
        invoice.clientCompany.toLowerCase().includes(lowercasedQuery) ||
        invoice.invoiceNumber.toLowerCase().includes(lowercasedQuery)
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      result = result.filter(invoice => invoice.status === statusFilter);
    }

    return result;
  }, [invoices, searchQuery, statusFilter]);

  const sortedInvoices = useMemo(() => {
    const calculateTotal = (invoice: Invoice) => {
      const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
      const tax = subtotal * (invoice.taxRate / 100);
      return subtotal + tax;
    };

    let sortableInvoices = filteredInvoices.map(invoice => ({
      ...invoice,
      totalAmount: calculateTotal(invoice),
    }));

    if (sortConfig !== null) {
      sortableInvoices.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof typeof a];
        const bValue = b[sortConfig.key as keyof typeof b];
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableInvoices;
  }, [filteredInvoices, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // ... (summary calculation remains same) ...
  const summary = useMemo(() => {
    const calculateTotal = (invoice: Invoice) => {
      const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
      const tax = subtotal * (invoice.taxRate / 100);
      return subtotal + tax;
    };

    const totalInvoices = sortedInvoices.length;
    const totalAmount = sortedInvoices.reduce((sum, invoice) => sum + calculateTotal(invoice), 0);
    const paidAmount = sortedInvoices
      .filter(inv => inv.status === 'Paid')
      .reduce((sum, invoice) => sum + calculateTotal(invoice), 0);

    return { totalInvoices, totalAmount, paidAmount };
  }, [sortedInvoices]);

  // Handle invoice selection (Removed as per new requirements)

  // Status Update Handler
  const handleUpdateStatus = (id: string, status: InvoiceStatus) => {
    updateInvoice(id, { status });
  };

  // Delete Handler
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoice(id);
    }
  }

  // Export all invoices as CSV
  const exportInvoicesAsCSV = () => {
    const invoicesWithTotals = sortedInvoices.map(invoice => {
      const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
      const tax = subtotal * (invoice.taxRate / 100);
      const total = subtotal + tax;
      return {
        ...invoice,
        totalAmount: total
      };
    });

    const headers = ['Invoice Number', 'Client Name', 'Client Company', 'Client Email', 'Issue Date', 'Due Date', 'Status', 'Total Amount'];
    const csvContent = [
      headers.join(','),
      ...invoicesWithTotals.map(invoice => [
        `"${invoice.invoiceNumber}"`,
        `"${invoice.clientName}"`,
        `"${invoice.clientCompany}"`,
        `"${invoice.clientEmail}"`,
        `"${invoice.issueDate}"`,
        `"${invoice.dueDate}"`,
        `"${invoice.status}"`,
        `"${invoice.totalAmount.toFixed(2)}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `invoices-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            Invoices <span className="text-primary/50 text-sm font-bold ml-1">{invoices.length}</span>
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID or Client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 w-full sm:w-64 bg-white border border-gray-100 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all placeholder:text-gray-400"
            />
          </div>
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => navigate('/invoices/new')}
            className="!bg-gray-900 hover:!bg-black !text-white !font-black text-xs uppercase tracking-widest !rounded-xl shadow-lg shadow-gray-200/50 transform active:scale-95 transition-all w-full sm:w-auto"
          >
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-50 group hover:shadow-md transition-all">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 group-hover:text-primary transition-colors">Total Invoices</h3>
          <p className="text-3xl font-black text-gray-900 tracking-tight">{summary.totalInvoices}</p>
        </div>
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-50 group hover:shadow-md transition-all">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 group-hover:text-primary transition-colors">Total Amount</h3>
          <p className="text-3xl font-black text-gray-900 tracking-tight">{currency.symbol}{summary.totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-50 group hover:shadow-md transition-all">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 group-hover:text-green-500 transition-colors">Amount Paid</h3>
          <p className="text-3xl font-black text-green-600 tracking-tight">{currency.symbol}{summary.paidAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-gray-50/50 p-4 rounded-[20px] border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 leading-none">Quick Filter</span>
          <InvoiceFilters
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportInvoicesAsCSV}
            className="!bg-white !text-gray-600 !border-gray-200 hover:!bg-gray-50 !rounded-xl !font-bold text-[10px] uppercase tracking-widest shadow-sm"
          >
            Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <InvoicesTable
          invoices={sortedInvoices}
          requestSort={requestSort}
          sortConfig={sortConfig}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default InvoicesPage;
