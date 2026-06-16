import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { InvoiceStatus } from '../../../types';
import { INVOICE_STATUS_FILTER_OPTIONS } from '../constants';

interface InvoiceFiltersProps {
  statusFilter: InvoiceStatus | 'All';
  onStatusFilterChange: (status: InvoiceStatus | 'All') => void;
}

const InvoiceFilters: React.FC<InvoiceFiltersProps> = ({ statusFilter, onStatusFilterChange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentStatusLabel = INVOICE_STATUS_FILTER_OPTIONS.find(option => option.value === statusFilter)?.label || 'All Statuses';

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        icon={Filter}
        iconPosition="left"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
        className="!min-h-0 !py-2"
      >
        <span className="flex items-center gap-2">
          {currentStatusLabel}
          <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </span>
      </Button>
      
      {isDropdownOpen && (
        <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5">
          {INVOICE_STATUS_FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onStatusFilterChange(option.value);
                setIsDropdownOpen(false);
              }}
              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                statusFilter === option.value ? 'bg-gray-100 font-medium' : ''
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceFilters;
