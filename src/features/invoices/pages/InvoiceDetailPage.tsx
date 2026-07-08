import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Edit, Loader2, FileCode } from 'lucide-react';
import InvoiceDesignerModal from '@/features/invoices/components/InvoiceDesignerModal';
import { buildInvoiceContext, renderInvoiceTemplate, sanitizeInvoiceHtml, resolveInvoiceHtml } from '@/features/invoices/utils/invoiceTemplate';
import { generateInvoicePdf } from '@/features/invoices/utils/htmlToPdf';
import type { InvoiceStatus } from '@/types';
import { useInvoices } from '@/contexts/InvoicesContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import Button from '@/components/ui/Button';
import { useApi } from '@/contexts/ApiContext';

const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invoices, updateInvoice } = useInvoices();
  const { crmApi } = useApi();
  const { companyInfo } = useCompany();
  const { currency } = useCurrency();

  const invoice = invoices.find(inv => inv.id === id);

  const [isDownloading, setIsDownloading] = useState(false);
  const [showDesigner, setShowDesigner] = useState(false);
  // The invoice's HTML (custom design / template / default) — the single design
  // shared by the on-screen view, the PDF download and the designer.
  const [rawHtml, setRawHtml] = useState<string>('');

  useEffect(() => {
    if (!invoice) return;
    let cancelled = false;
    resolveInvoiceHtml(invoice, crmApi).then((html) => { if (!cancelled) setRawHtml(html); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice?.id, invoice?.customHtml, invoice?.templateId]);

  const previewHtml = useMemo(() => {
    if (!invoice || !rawHtml) return '';
    const ctx = buildInvoiceContext(invoice, companyInfo, currency.symbol);
    return sanitizeInvoiceHtml(renderInvoiceTemplate(rawHtml, ctx));
  }, [invoice, rawHtml, companyInfo, currency.symbol]);

  if (!invoice) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold">Invoice not found</h2>
        <Link to="/invoices" className="text-primary hover:underline mt-4 inline-block"><ArrowLeft className="inline w-4 h-4 mr-2" />Back to Invoices</Link>
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    setIsDownloading(true);
    try {
      const html = rawHtml || (await resolveInvoiceHtml(invoice, crmApi));
      const ctx = buildInvoiceContext(invoice, companyInfo, currency.symbol);
      await generateInvoicePdf(renderInvoiceTemplate(html, ctx), `Invoice_${invoice.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
      alert('Could not generate the PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

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
            <Button
              variant="primary"
              size="md"
              icon={FileCode}
              iconPosition="left"
              onClick={() => setShowDesigner(true)}
            >
              Custom Design
            </Button>
          </div>
        </div>
      </div>

      {/* Single source of truth: the same template that the PDF + designer use. */}
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto invoice-container">
        {previewHtml
          ? <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          : <div className="p-16 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}
      </div>

      {showDesigner && <InvoiceDesignerModal invoice={invoice} onClose={() => setShowDesigner(false)} />}
    </div>
  );
};

export default InvoiceDetailPage;
