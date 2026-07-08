import React, { useEffect, useMemo, useState } from 'react';
import { X, Download, Save, Loader2, FilePlus } from 'lucide-react';
import type { Invoice, InvoiceTemplate } from '@/types';
import { useApi } from '@/contexts/ApiContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useInvoices } from '@/contexts/InvoicesContext';
import { buildInvoiceContext, renderInvoiceTemplate, DEFAULT_INVOICE_TEMPLATE } from '@/features/invoices/utils/invoiceTemplate';
import { generateInvoicePdf } from '@/features/invoices/utils/htmlToPdf';
import InvoiceHtmlEditor from '@/features/invoices/components/InvoiceHtmlEditor';

interface InvoiceDesignerModalProps {
  invoice: Invoice;
  onClose: () => void;
}

const STANDARD = '__standard__';

// Per-invoice designer: pick a saved template (or the built-in standard one),
// tweak the HTML for THIS invoice, preview with real data, then generate a PDF
// or save the design onto the invoice.
const InvoiceDesignerModal: React.FC<InvoiceDesignerModalProps> = ({ invoice, onClose }) => {
  const { crmApi } = useApi();
  const { companyInfo } = useCompany();
  const { currency } = useCurrency();
  const { updateInvoice } = useInvoices();

  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>(invoice.templateId || STANDARD);
  const [html, setHtml] = useState<string>(invoice.customHtml || DEFAULT_INVOICE_TEMPLATE);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewCtx = useMemo(
    () => buildInvoiceContext(invoice, companyInfo, currency.symbol),
    [invoice, companyInfo, currency.symbol],
  );

  useEffect(() => {
    crmApi
      .getInvoiceTemplates()
      .then((res) => {
        const list: InvoiceTemplate[] = res.data || [];
        setTemplates(list);
        // If the invoice has no saved custom HTML, seed from its template / default.
        if (!invoice.customHtml) {
          const chosen = invoice.templateId ? list.find((t) => t.id === invoice.templateId) : list.find((t) => t.isDefault);
          if (chosen) {
            setTemplateId(chosen.id);
            setHtml(chosen.html);
          }
        }
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSelectTemplate = (id: string) => {
    setTemplateId(id);
    if (id === STANDARD) {
      setHtml(DEFAULT_INVOICE_TEMPLATE);
    } else {
      const t = templates.find((x) => x.id === id);
      if (t) setHtml(t.html);
    }
  };

  const handleDownload = async () => {
    setGenerating(true);
    setError(null);
    try {
      const rendered = renderInvoiceTemplate(html, previewCtx);
      await generateInvoicePdf(rendered, `Invoice_${invoice.invoiceNumber}.pdf`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateInvoice(invoice.id, {
        templateId: templateId === STANDARD ? null : templateId,
        customHtml: html,
      } as any);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save design');
    } finally {
      setSaving(false);
    }
  };

  // Persist the current design as a NAMED, reusable template (usable on any invoice).
  const handleSaveAsTemplate = async () => {
    const name = window.prompt('Name this template so you can reuse it on future invoices:');
    if (!name || !name.trim()) return;
    setSavingTemplate(true);
    setError(null);
    try {
      const res = await crmApi.createInvoiceTemplate({ name: name.trim(), html });
      setTemplates((prev) => [...prev, res.data]);
      setTemplateId(res.data.id);
      alert(`Saved "${res.data.name}". It's now available for all invoices.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-black text-gray-900">Design Invoice {invoice.invoiceNumber}</h2>
            <p className="text-xs text-gray-500">Customize the HTML and generate a PDF.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Template</label>
            <select
              value={templateId}
              onChange={(e) => onSelectTemplate(e.target.value)}
              className="px-3 py-2 text-sm font-semibold bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value={STANDARD}>Standard (built-in)</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}{t.isDefault ? ' (default)' : ''}</option>
              ))}
            </select>
          </div>

          {error && <p className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm font-semibold text-rose-600">{error}</p>}

          <InvoiceHtmlEditor html={html} onChange={setHtml} previewCtx={previewCtx} />
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Close</button>
          <button
            onClick={handleSaveAsTemplate}
            disabled={savingTemplate}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-60"
          >
            {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <FilePlus className="w-4 h-4" />} Save as template
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save to invoice'}
          </button>
          <button
            onClick={handleDownload}
            disabled={generating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark disabled:opacity-60 transition-all"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {generating ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDesignerModal;
