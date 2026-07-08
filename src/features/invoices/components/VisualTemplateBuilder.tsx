import React from 'react';
import {
  TemplateConfig,
  FONT_OPTIONS,
  LAYOUT_OPTIONS,
  buildTemplateFromConfig,
  renderInvoiceTemplate,
  sanitizeInvoiceHtml,
} from '@/features/invoices/utils/invoiceTemplate';

interface VisualTemplateBuilderProps {
  config: TemplateConfig;
  onChange: (config: TemplateConfig) => void;
  previewCtx: Record<string, string>;
}

const SWATCHES = ['#0079C1', '#0f172a', '#7c3aed', '#059669', '#dc2626', '#d97706', '#db2777', '#0891b2'];
const SIZES: { value: 'sm' | 'md' | 'lg'; label: string }[] = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
];

const VisualTemplateBuilder: React.FC<VisualTemplateBuilderProps> = ({ config, onChange, previewCtx }) => {
  const set = (patch: Partial<TemplateConfig>) => onChange({ ...config, ...patch });
  const previewHtml = sanitizeInvoiceHtml(renderInvoiceTemplate(buildTemplateFromConfig(config), previewCtx));

  const labelCls = 'text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 block';
  const Segmented = <T extends string>({ value, options, onPick }: { value: T; options: { value: T; label: string }[]; onPick: (v: T) => void }) => (
    <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onPick(o.value)}
          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${value === o.value ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
  const Toggle = ({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: (v: boolean) => void }) => (
    <label className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onToggle(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </button>
    </label>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Controls */}
      <div className="space-y-5 max-h-[520px] overflow-y-auto pr-1">
        <div>
          <span className={labelCls}>Layout</span>
          <div className="grid grid-cols-2 gap-2">
            {LAYOUT_OPTIONS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => set({ layout: l.value })}
                title={l.hint}
                className={`p-3 rounded-xl border-2 text-left transition-all ${config.layout === l.value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <span className={`block text-sm font-bold ${config.layout === l.value ? 'text-primary' : 'text-gray-800'}`}>{l.label}</span>
                <span className="block text-[10px] text-gray-400 mt-0.5 leading-tight">{l.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className={labelCls}>Brand color</span>
          <div className="flex items-center gap-2 flex-wrap">
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set({ accentColor: c })}
                className={`w-7 h-7 rounded-full border-2 transition-transform ${config.accentColor.toLowerCase() === c ? 'border-gray-900 scale-110' : 'border-white shadow'}`}
                style={{ background: c }}
                aria-label={c}
              />
            ))}
            <label className="inline-flex items-center gap-1 ml-1">
              <input type="color" value={config.accentColor} onChange={(e) => set({ accentColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className={labelCls}>Text color</span>
            <input type="color" value={config.textColor} onChange={(e) => set({ textColor: e.target.value })} className="w-full h-9 rounded cursor-pointer border border-gray-200" />
          </div>
          <div>
            <span className={labelCls}>Text size</span>
            <Segmented value={config.fontScale} options={SIZES} onPick={(v) => set({ fontScale: v })} />
          </div>
        </div>

        <div>
          <span className={labelCls}>Font</span>
          <select
            value={config.fontFamily}
            onChange={(e) => set({ fontFamily: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none"
          >
            {FONT_OPTIONS.map((f) => (<option key={f.value} value={f.value}>{f.label}</option>))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 items-start">
          <div>
            <span className={labelCls}>Logo size</span>
            <Segmented value={config.logoSize} options={SIZES} onPick={(v) => set({ logoSize: v })} />
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <span className={labelCls}>Show / hide</span>
          <div className="divide-y divide-gray-50">
            <Toggle label="Company logo" checked={config.showLogo} onToggle={(v) => set({ showLogo: v })} />
            <Toggle label="Company address" checked={config.showAddress} onToggle={(v) => set({ showAddress: v })} />
            <Toggle label="Website" checked={config.showWebsite} onToggle={(v) => set({ showWebsite: v })} />
            <Toggle label="Payment terms" checked={config.showPaymentTerms} onToggle={(v) => set({ showPaymentTerms: v })} />
            <Toggle label="Bank details" checked={config.showBankDetails} onToggle={(v) => set({ showBankDetails: v })} />
            <Toggle label="Colored table header" checked={config.accentTableHeader} onToggle={(v) => set({ accentTableHeader: v })} />
            <Toggle label="Rounded corners" checked={config.rounded} onToggle={(v) => set({ rounded: v })} />
          </div>
        </div>

        <div>
          <span className={labelCls}>Footer note</span>
          <input
            type="text"
            value={config.footerNote}
            onChange={(e) => set({ footerNote: e.target.value })}
            placeholder="Thank you for your business."
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none"
          />
        </div>
      </div>

      {/* Live preview */}
      <div>
        <span className={labelCls}>Live preview</span>
        <div className="h-[520px] overflow-auto bg-gray-100 border border-gray-200 rounded-xl p-4">
          <div className="bg-white shadow-sm mx-auto" style={{ width: 800, transformOrigin: 'top left' }}>
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualTemplateBuilder;
