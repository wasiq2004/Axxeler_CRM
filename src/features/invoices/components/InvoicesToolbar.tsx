import React from 'react';
import { Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

interface InvoicesToolbarProps {
  onSearch: (query: string) => void;
}

const InvoicesToolbar: React.FC<InvoicesToolbarProps> = ({ onSearch }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
      <h1 className="text-2xl md:text-3xl font-bold text-text-main">Invoices</h1>
      <div className="flex items-center space-x-2 w-full sm:w-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            onChange={(e) => onSearch(e.target.value)}
            className="pl-9 pr-3 py-2 w-full sm:w-40 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Link 
          to="/invoices/new"
          className="focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
        >
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            iconPosition="left"
            responsive
          >
            Create Invoice
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default InvoicesToolbar;
