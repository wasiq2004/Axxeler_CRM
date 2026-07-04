import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2, Star, FileCode } from 'lucide-react';
import type { Invoice, InvoiceTemplate } from '@/types';
import { useApi } from '@/contexts/ApiContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { buildInvoiceContext, DEFAULT_INVOICE_TEMPLATE } from '@/features/invoices/utils/invoiceTemplate';
import InvoiceHtmlEditor from '@/features/invoices/components/InvoiceHtmlEditor';

// Sample data so the editor preview has something to render.
const SAMPLE_INVOICE: Invoice = {
  id: 'sample',
  invoiceNumber: 'INV-0001',
  clientName: 'Jane Cooper',
  clientCompany: 'Acme Inc.',
  clientEmail: 'jane@acme.com',
  issueDate: '2026-07-04',
  dueDate: '2026-07-19',
  status: 'Due',
  taxRate: 8,
  items: [
    { id: '1', description: 'Consulting services', quantity: 10, price: 120 },
    { id: '2', description: 'Onboarding & setup', quantity: 1, price: 500 },
  ],
};

const InvoiceTemplatesPage: React.FC = () => {
  const { crmApi } = useApi();
  const { companyInfo } = useCompany();
  const { currency } = useCurrency();

  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editor state. selectedId === null means we're editing a brand-new template.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [html, setHtml] = useState(DEFAULT_INVOICE_TEMPLATE);
  const [isDefault, setIsDefault] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const previewCtx = useMemo(
    () => buildInvoiceContext(SAMPLE_INVOICE, companyInfo, currency.symbol),
    [companyInfo, currency.symbol],
  );

  const load = async () => {
    setLoading(true);
    try {
      const res = await crmApi.getInvoiceTemplates();
      setTemplates(res.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNew = () => {
    setSelectedId(null);
    setName('Untitled Template');
    setHtml(DEFAULT_INVOICE_TEMPLATE);
    setIsDefault(false);
    setIsEditing(true);
  };

  const startEdit = (t: InvoiceTemplate) => {
    setSelectedId(t.id);
    setName(t.name);
    setHtml(t.html);
    setIsDefault(t.isDefault);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !html.trim()) {
      setError('Name and HTML are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (selectedId) {
        await crmApi.updateInvoiceTemplate(selectedId, { name, html, isDefault });
      } else {
        await crmApi.createInvoiceTemplate({ name, html, isDefault });
      }
      await load();
      setIsEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template? This cannot be undone.')) return;
    try {
      await crmApi.deleteInvoiceTemplate(id);
      if (selectedId === id) setIsEditing(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete template');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/invoices" className="inline-flex items-center text-sm text-gray-500 hover:text-primary mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Invoices
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileCode className="w-6 h-6 text-primary" /> Invoice Templates
          </h1>
          <p className="text-gray-500 text-sm mt-1">Design custom HTML invoices with merge fields, then generate PDFs from them.</p>
        </div>
        <button
          onClick={startNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {error && <p className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm font-semibold text-rose-600">{error}</p>}

      {!isEditing ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {loading ? (
            <p className="text-gray-400 text-sm">Loading templates…</p>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <FileCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No custom templates yet.</p>
              <button onClick={startNew} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark">
                <Plus className="w-4 h-4" /> Create your first template
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {templates.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <FileCode className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-bold text-gray-900 flex items-center gap-2">
                        {t.name}
                        {t.isDefault && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3" /> Default
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">Updated {t.updatedAt?.slice(0, 10)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(t)} className="px-3 py-1.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Edit</button>
                    <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" aria-label="Delete template">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Template name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none"
                placeholder="e.g. Modern Blue"
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 pb-3">
              <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="w-4 h-4" />
              Set as default
            </label>
          </div>

          <InvoiceHtmlEditor html={html} onChange={setHtml} previewCtx={previewCtx} />

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-50">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark disabled:opacity-60 transition-all"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Template'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceTemplatesPage;
