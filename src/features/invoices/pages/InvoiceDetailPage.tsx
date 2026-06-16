import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, CreditCard, ShieldCheck, Edit, FileText, Loader2 } from 'lucide-react';
import type { Invoice, InvoiceStatus } from '@/types';
import { useInvoices } from '@/contexts/InvoicesContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import Button from '@/components/ui/Button';
import { getInvoiceStatusMeta } from '@/features/invoices/constants';
import { useApi } from '@/contexts/ApiContext';

const PaymentModal = ({ amount, onPay, onCancel, currency }: { amount: number; onPay: () => void; onCancel: () => void; currency: any }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-center">Simulated Payment</h2>
            <p className="text-center text-gray-600 mt-2">You are about to pay {currency.symbol}{amount.toLocaleString()}</p>
            <div className="mt-6 bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total</span>
                    <span className="font-bold text-lg">{currency.symbol}{amount.toLocaleString()}</span>
                </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-4 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                This is a secure, simulated payment environment. No real transaction will occur.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={onPay}
                  icon={CreditCard}
                  iconPosition="left"
                >
                  Pay Now
                </Button>
            </div>
        </div>
    </div>
);


const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invoices, updateInvoice } = useInvoices();
  const { crmApi } = useApi();
  const { companyInfo } = useCompany();
  const { currency, formatCurrency } = useCurrency();
  
  const invoice = invoices.find(inv => inv.id === id);

  const [isPaying, setIsPaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { subtotal, taxAmount, total } = useMemo(() => {
    if (!invoice) return { subtotal: 0, taxAmount: 0, total: 0 };
    const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const taxAmount = subtotal * (invoice.taxRate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  }, [invoice]);

  if (!invoice) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold">Invoice not found</h2>
        <Link to="/invoices" className="text-primary hover:underline mt-4 inline-block"><ArrowLeft className="inline w-4 h-4 mr-2" />Back to Invoices</Link>
      </div>
    );
  }
  
  const statusMeta = getInvoiceStatusMeta(invoice.status);

  const handlePayment = () => {
      setIsProcessing(true);
      setTimeout(() => {
          setIsProcessing(false);
          setPaymentSuccess(true);
          if (invoice) {
            updateInvoice(invoice.id, { status: 'Paid' });
          }
          setTimeout(() => {
            setIsPaying(false);
            setPaymentSuccess(false);
          }, 2000);
      }, 1500);
  }

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    setIsDownloading(true);
    try {
      await crmApi.downloadInvoicePdf(invoice.id);
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Add function to update invoice status
  const updateStatus = (newStatus: InvoiceStatus) => {
    if (invoice) {
      updateInvoice(invoice.id, { status: newStatus });
    }
  };
  
  return (
    <div className="space-y-6">
      <Link to="/invoices" className="text-sm text-primary hover:underline flex items-center mb-2">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Invoices
      </Link>
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-main">Invoice {invoice.invoiceNumber}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {invoice.status === 'Draft' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => updateStatus('Due')}
            >
              Mark as Sent
            </Button>
          )}
          {invoice.status === 'Due' && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => updateStatus('Draft')}
              >
                Mark as Draft
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => updateStatus('Paid')}
              >
                Mark as Paid
              </Button>
            </div>
          )}
          {invoice.status === 'Overdue' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => updateStatus('Paid')}
            >
              Mark as Paid
            </Button>
          )}
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="md" 
              icon={Edit}
              onClick={() => navigate(`/invoices/${id}/edit`)}
              aria-label="Edit invoice"
            />
            <Button 
              variant="outline" 
              size="md" 
              icon={Printer} 
              onClick={() => window.print()}
              aria-label="Print invoice"
            />
            <Button
              variant="outline"
              size="md"
              icon={isDownloading ? Loader2 : Download}
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              aria-label="Download as PDF"
            >
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </Button>
            {invoice.status !== 'Paid' && invoice.status !== 'Draft' && (
              <Button
                variant="primary"
                size="md"
                icon={CreditCard}
                iconPosition="left"
                onClick={() => setIsPaying(true)}
              >
                Pay Now
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 lg:p-10 invoice-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
          <div>
            <div className="flex items-center mb-2">
              <img src={companyInfo.logo} alt={companyInfo.name} className="h-10 mr-3" />
              <h2 className="text-xl font-bold text-primary">{companyInfo.name}</h2>
            </div>
            <p className="text-gray-500 whitespace-pre-line">{companyInfo.address}</p>
            <p className="text-gray-500">Phone: {companyInfo.phone}</p>
            <p className="text-gray-500">Email: {companyInfo.email}</p>
            <p className="text-gray-500">Website: {companyInfo.website}</p>
          </div>
          <div className="sm:text-right">
            <div className={`inline-block px-4 py-2 rounded-lg border-2 ${statusMeta.badge.bg} ${statusMeta.badge.border}`}>
              <span className={`text-lg font-bold uppercase ${statusMeta.badge.text}`}>{statusMeta.label}</span>
            </div>
            <p className="mt-2 text-gray-600"><strong>Amount Due:</strong> <span className="text-xl font-bold">{formatCurrency(total)}</span></p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8 pb-8 border-b">
            <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Billed To</h3>
                <p className="font-bold">{invoice.clientName}</p>
                <p>{invoice.clientCompany}</p>
                <p>{invoice.clientEmail}</p>
            </div>
            <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Invoice Number</h3>
                <p className="font-bold">{invoice.invoiceNumber}</p>
            </div>
             <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Dates</h3>
                <p><strong>Issued:</strong> {invoice.issueDate}</p>
                 <p><strong>Due:</strong> {invoice.dueDate}</p>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead>
                    <tr className="border-b border-gray-300 text-left text-sm text-gray-500 uppercase">
                        <th className="py-2 pr-4">Description</th>
                        <th className="py-2 px-4 text-center">Qty</th>
                        <th className="py-2 px-4 text-right">Unit Price</th>
                        <th className="py-2 pl-4 text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items.map(item => (
                        <tr key={item.id} className="border-b border-gray-200">
                            <td className="py-3 pr-4 font-medium text-gray-800">{item.description}</td>
                            <td className="py-3 px-4 text-center text-gray-600">{item.quantity}</td>
                            <td className="py-3 px-4 text-right text-gray-600">{currency.symbol}{item.price.toLocaleString()}</td>
                            <td className="py-3 pl-4 text-right font-semibold text-gray-800">{currency.symbol}{(item.quantity * item.price).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className="flex justify-end mt-6">
            <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{currency.symbol}{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-gray-600"><span>Tax ({invoice.taxRate}%)</span><span>{currency.symbol}{taxAmount.toLocaleString()}</span></div>
                <div className="flex justify-between text-gray-800 font-bold text-lg border-t pt-2 mt-2"><span>Total</span><span>{currency.symbol}{total.toLocaleString()}</span></div>
            </div>
        </div>
      </div>
      
      {isPaying && !isProcessing && !paymentSuccess && (
        <PaymentModal amount={total} onPay={handlePayment} onCancel={() => setIsPaying(false)} currency={currency} />
      )}
      {isPaying && isProcessing && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 font-semibold">Processing Payment...</p>
            </div>
        </div>
      )}
       {isPaying && paymentSuccess && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center">
                <ShieldCheck className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="text-xl font-bold mt-4">Payment Successful!</h3>
                <p className="text-gray-600">The invoice has been marked as paid.</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetailPage;
