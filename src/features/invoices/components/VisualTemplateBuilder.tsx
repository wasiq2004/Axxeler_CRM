import React from 'react';
import {
  TemplateConfig,
  FONT_OPTIONS,
  buildTemplateFromConfig,
  renderInvoiceTemplate,
  sanitizeInvoiceHtml,
} from '@/features/invoices/utils/invoiceTemplate';

interface VisualTemplateBuilderProps {
  config: TemplateConfig;
  onChange: (config: TemplateConfig) => void;
  previewCtx: Record<string, string>;
}

const HEADER_STYLES: { value: TemplateConfig['headerStyle']; label: string; hint: string }[] = [
  { value: 'line', label: 'Underline', hint: 'Accent line under the header' },
  { value: 'band', label: 'Color band', hint: 'Full-width colored header' },
  { value: 'minimal', label: 'Minimal', hint: 'Clean, no divider' },
];

const SWATCHES = ['#0079C1', '#0f172a', '#7c3aed', '#059669', '#dc2626', '#d97706', '#db2777', '#0891b2'];

// No-HTML template editing: tweak a few options and see the invoice update live.
const VisualTemplateBuilder: React.FC<VisualTemplateBuilderProps> = ({ config, onChange, previewCtx }) => {
  const set = (patch: Partial<TemplateConfig>) => onChange({ ...config, ...patch });

  const previewHtml = sanitizeInvoiceHtml(renderInvoiceTemplate(buildTemplateFromConfig(config), previewCtx));

  const labelCls = 'text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 block';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Controls */}
      <div className="space-y-5">
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
            <label className="inline-flex items-center gap-2 ml-1">
              <input
                type="color"
                value={config.accentColor}
                onChange={(e) => set({ accentColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border border-gray-200"
              />
              <span className="text-xs text-gray-400">Custom</span>
            </label>
          </div>
        </div>

        <div>
          <span className={labelCls}>Header style</span>
          <div className="grid grid-cols-3 gap-2">
            {HEADER_STYLES.map((h) => (
              <button
                key={h.value}
                type="button"
                onClick={() => set({ headerStyle: h.value })}
                title={h.hint}
                className={`p-3 rounded-xl border-2 text-left transition-all ${config.headerStyle === h.value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <span className={`block text-sm font-bold ${config.headerStyle === h.value ? 'text-primary' : 'text-gray-800'}`}>{h.label}</span>
                <span className="block text-[10px] text-gray-400 mt-0.5 leading-tight">{h.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className={labelCls}>Font</span>
          <select
            value={config.fontFamily}
            onChange={(e) => set({ fontFamily: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
          <span className="text-sm font-semibold text-gray-700">Show company logo</span>
          <input type="checkbox" checked={config.showLogo} onChange={(e) => set({ showLogo: e.target.checked })} className="w-5 h-5" />
        </label>

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
