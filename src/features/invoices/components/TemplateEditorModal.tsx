import React, { useEffect, useState } from 'react';
import { X, Save, Loader2, Wand2, Code2 } from 'lucide-react';
import type { InvoiceTemplate } from '@/types';
import { useApi } from '@/contexts/ApiContext';
import {
  DEFAULT_INVOICE_TEMPLATE,
  DEFAULT_TEMPLATE_CONFIG,
  TemplateConfig,
  buildTemplateFromConfig,
  parseTemplateConfig,
  stripTemplateConfig,
} from '@/features/invoices/utils/invoiceTemplate';
import InvoiceHtmlEditor from '@/features/invoices/components/InvoiceHtmlEditor';
import VisualTemplateBuilder from '@/features/invoices/components/VisualTemplateBuilder';

interface TemplateEditorModalProps {
  open: boolean;
  onClose: () => void;
  previewCtx: Record<string, string>;
  initial?: { id?: string; name?: string; html?: string } | null;
  onSaved: (template: InvoiceTemplate) => void;
}

type Mode = 'visual' | 'html';

// Create or edit a NAMED, reusable invoice template. Defaults to a no-HTML visual
// builder; power users can switch to Advanced (HTML). Saved templates are stored
// and reused everywhere (this picker, the designer, Invoices → Templates).
const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({ open, onClose, previewCtx, initial, onSaved }) => {
  const { crmApi } = useApi();
  const [name, setName] = useState('');
  const [mode, setMode] = useState<Mode>('visual');
  const [config, setConfig] = useState<TemplateConfig>(DEFAULT_TEMPLATE_CONFIG);
  const [html, setHtml] = useState(DEFAULT_INVOICE_TEMPLATE);
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name || '');
    setIsDefault(false);
    setError(null);
    const existingHtml = initial?.html;
    const cfg = existingHtml ? parseTemplateConfig(existingHtml) : null;
    if (!existingHtml) {
      // New template → start in the visual builder with sensible defaults.
      setMode('visual');
      setConfig(DEFAULT_TEMPLATE_CONFIG);
      setHtml(buildTemplateFromConfig(DEFAULT_TEMPLATE_CONFIG));
    } else if (cfg) {
      // Was built visually → reopen in the visual builder.
      setMode('visual');
      setConfig(cfg);
      setHtml(existingHtml);
    } else {
      // Hand-written HTML → open the advanced editor.
      setMode('html');
      setHtml(existingHtml);
      setConfig(DEFAULT_TEMPLATE_CONFIG);
    }
  }, [open, initial]);

  if (!open) return null;

  const isEditing = Boolean(initial?.id);

  const switchToHtml = () => {
    // Bake the current visual design into editable HTML.
    setHtml(buildTemplateFromConfig(config));
    setMode('html');
  };
  const switchToVisual = () => {
    if (!window.confirm('Switch to the simple builder? Any manual HTML changes will be replaced by the visual design.')) return;
    setMode('visual');
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Give your template a name so you can reuse it later.'); return; }
    const finalHtml = mode === 'visual' ? buildTemplateFromConfig(config) : stripTemplateConfig(html);
    if (!finalHtml.trim()) { setError('The template cannot be empty.'); return; }
    setSaving(true);
    setError(null);
    try {
      const res = isEditing
        ? await crmApi.updateInvoiceTemplate(initial!.id as string, { name: name.trim(), html: finalHtml, isDefault })
        : await crmApi.createInvoiceTemplate({ name: name.trim(), html: finalHtml, isDefault });
      onSaved(res.data);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save the template.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-black text-gray-900">{isEditing ? 'Edit Template' : 'Create Custom Template'}</h2>
            <p className="text-xs text-gray-500">Design once, reuse on any invoice.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Template Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vogue Consult — Tax Invoice"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none"
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 pb-3">
              <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="w-4 h-4" />
              Set as default
            </label>
          </div>

          {/* Mode toggle */}
          <div className="inline-flex rounded-xl border border-gray-200 p-1 bg-gray-50">
            <button
              type="button"
              onClick={() => (mode === 'visual' ? undefined : switchToVisual())}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'visual' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Wand2 className="w-4 h-4" /> Simple
            </button>
            <button
              type="button"
              onClick={() => (mode === 'html' ? undefined : switchToHtml())}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'html' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Code2 className="w-4 h-4" /> Advanced (HTML)
            </button>
          </div>

          {error && <p className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm font-semibold text-rose-600">{error}</p>}

          {mode === 'visual'
            ? <VisualTemplateBuilder config={config} onChange={setConfig} previewCtx={previewCtx} />
            : <InvoiceHtmlEditor html={html} onChange={setHtml} previewCtx={previewCtx} />}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark disabled:opacity-60 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditorModal;
