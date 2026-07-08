import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Invoice, InvoiceStatus } from '../../../types';
import { ChevronsUpDown, ChevronUp, ChevronDown, Download, Edit, MoreVertical, Check, Send, Trash2, Loader2 } from 'lucide-react';
import { getInvoiceStatusMeta } from '../constants';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { useCompany } from '../../../contexts/CompanyContext';
import { useApi } from '../../../contexts/ApiContext';
import { buildInvoiceContext, renderInvoiceTemplate, resolveInvoiceHtml } from '@/features/invoices/utils/invoiceTemplate';
import { generateInvoicePdf } from '@/features/invoices/utils/htmlToPdf';

interface InvoicesTableProps {
  invoices: (Invoice & { totalAmount: number })[];
  requestSort: (key: string) => void;
  sortConfig: { key: string; direction: 'ascending' | 'descending' } | null;
  onUpdateStatus?: (id: string, status: InvoiceStatus) => void;
  onDelete?: (id: string) => void;
}

const InvoiceRow: React.FC<{
  invoice: Invoice & { totalAmount: number };
  onUpdateStatus?: (id: string, status: InvoiceStatus) => void;
  onDelete?: (id: string) => void;
}> = ({ invoice, onUpdateStatus, onDelete }) => {
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const { companyInfo } = useCompany();
  const { crmApi } = useApi();
  const [showMenu, setShowMenu] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Download the SAME design shown on the invoice page (custom design / template /
  // default) so the list and detail downloads are identical.
  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const html = await resolveInvoiceHtml(invoice, crmApi);
      const ctx = buildInvoiceContext(invoice, companyInfo, currency.symbol);
      await generateInvoicePdf(renderInvoiceTemplate(html, ctx), `Invoice_${invoice.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
      alert('Could not generate the PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <tr className="hover:bg-gray-50/80 transition-colors group relative">
      <td className="px-4 py-3 whitespace-nowrap">
        <Link to={`/invoices/${invoice.id}`} className="text-sm font-medium text-[#0079C1] hover:text-[#005a91] hover:underline transition-colors">
          {invoice.invoiceNumber}
        </Link>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{invoice.clientName}</span>
          <span className="text-xs text-gray-500">{invoice.clientCompany}</span>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
        {currency.symbol}{invoice.totalAmount.toLocaleString()}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{invoice.dueDate}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        {(() => {
          const statusMeta = getInvoiceStatusMeta(invoice.status);
          return (
            <span className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full border ${statusMeta.chipClass} bg-opacity-10 border-opacity-20`}>
              {statusMeta.label}
            </span>
          );
        })()}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end gap-1">

          {/* Quick Actions */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/invoices/${invoice.id}/edit`);
            }}
            className="text-gray-400 hover:text-[#0079C1] p-1.5 rounded-md hover:bg-blue-50 transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            disabled={downloading}
            className="text-gray-400 hover:text-[#0079C1] p-1.5 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50"
            title="Download PDF"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>

          {/* More Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className={`text-gray-400 hover:text-gray-600 p-1.5 rounded-md hover:bg-gray-100 transition-colors ${showMenu ? 'bg-gray-100 text-gray-600' : ''}`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-fadeIn origin-top-right">
                <div className="px-3 py-2 border-b border-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Update Status
                </div>
                <button
                  onClick={() => {
                    onUpdateStatus?.(invoice.id, 'Due');
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4 text-blue-500" /> Mark as Sent
                </button>
                <button
                  onClick={() => {
                    onUpdateStatus?.(invoice.id, 'Paid');
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-green-500" /> Mark as Paid
                </button>
                <div className="my-1 border-t border-gray-50"></div>
                <button
                  onClick={() => {
                    onDelete?.(invoice.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};

const InvoicesTable: React.FC<InvoicesTableProps> = ({
  invoices,
  requestSort,
  sortConfig,
  onUpdateStatus,
  onDelete
}) => {

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronsUpDown className="w-3 h-3 ml-1 opacity-20 group-hover:opacity-50 transition-opacity" />;
    }
    return sortConfig.direction === 'ascending' ? <ChevronUp className="w-3 h-3 ml-1 text-gray-700" /> : <ChevronDown className="w-3 h-3 ml-1 text-gray-700" />;
  };

  return (
    <div className="overflow-visible rounded-lg border border-gray-100 min-h-[400px]">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50/50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left">
              <button onClick={() => requestSort('invoiceNumber')} className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider group hover:text-gray-700 transition-colors">
                Invoice # {getSortIcon('invoiceNumber')}
              </button>
            </th>
            <th scope="col" className="px-4 py-3 text-left">
              <button onClick={() => requestSort('clientName')} className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider group hover:text-gray-700 transition-colors">
                Client {getSortIcon('clientName')}
              </button>
            </th>
            <th scope="col" className="px-4 py-3 text-left">
              <button onClick={() => requestSort('totalAmount')} className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider group hover:text-gray-700 transition-colors">
                Amount {getSortIcon('totalAmount')}
              </button>
            </th>
            <th scope="col" className="px-4 py-3 text-left">
              <button onClick={() => requestSort('dueDate')} className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider group hover:text-gray-700 transition-colors">
                Due Date {getSortIcon('dueDate')}
              </button>
            </th>
            <th scope="col" className="px-4 py-3 text-left">
              <button onClick={() => requestSort('status')} className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider group hover:text-gray-700 transition-colors">
                Status {getSortIcon('status')}
              </button>
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-50">
          {invoices.map((invoice) => (
            <InvoiceRow
              key={invoice.id}
              invoice={invoice}
              onUpdateStatus={onUpdateStatus}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoicesTable;
