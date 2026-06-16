import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Invoice, InvoiceStatus } from '../../../types';
import { ChevronsUpDown, ChevronUp, ChevronDown, Download, Edit, MoreVertical, Check, Send, Trash2 } from 'lucide-react';
import { getInvoiceStatusMeta } from '../constants';
import { useCurrency } from '../../../contexts/CurrencyContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [showMenu, setShowMenu] = useState(false);
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

  const handleDownload = () => {
    const doc = new jsPDF();

    // Add Logo or Brand Color Header
    doc.setFillColor(0, 121, 193); // #0079C1
    doc.rect(0, 0, 210, 20, 'F');

    // Invoice Header
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('INVOICE', 14, 13);

    // Invoice Details
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 14, 30);
    doc.text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 14, 35);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 14, 40);

    // Bill To Section
    doc.setFontSize(12);
    doc.setTextColor(0, 121, 193);
    doc.text('Bill To:', 14, 55);

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(invoice.clientName, 14, 62);
    if (invoice.clientCompany) {
      doc.text(invoice.clientCompany, 14, 67);
    }
    doc.text(invoice.clientEmail, 14, invoice.clientCompany ? 72 : 67);

    // Table
    const tableColumn = ["Item", "Quantity", "Price", "Total"];
    const tableRows = invoice.items.map(item => [
      item.description,
      item.quantity,
      `${currency.symbol}${(item.price || 0).toLocaleString()}`,
      `${currency.symbol}${(item.quantity * item.price).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 85,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [0, 121, 193] },
      styles: { fontSize: 10, cellPadding: 3 },
    });

    // Totals Section
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.text(`Subtotal:`, 140, finalY);
    doc.text(`${currency.symbol}${(invoice.totalAmount / (1 + (invoice.taxRate || 0) / 100)).toLocaleString()}`, 195, finalY, { align: 'right' });

    doc.text(`Tax (${invoice.taxRate || 0}%):`, 140, finalY + 5);
    doc.text(`${currency.symbol}${(invoice.totalAmount - (invoice.totalAmount / (1 + (invoice.taxRate || 0) / 100))).toLocaleString()}`, 195, finalY + 5, { align: 'right' });

    doc.setFontSize(12);
    doc.setTextColor(0, 121, 193);
    doc.text(`Total:`, 140, finalY + 12);
    doc.text(`${currency.symbol}${invoice.totalAmount.toLocaleString()}`, 195, finalY + 12, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });

    doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
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
            className="text-gray-400 hover:text-[#0079C1] p-1.5 rounded-md hover:bg-blue-50 transition-colors"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
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
