import React from 'react';
import { MERGE_FIELDS, renderInvoiceTemplate, sanitizeInvoiceHtml } from '@/features/invoices/utils/invoiceTemplate';

interface InvoiceHtmlEditorProps {
  html: string;
  onChange: (html: string) => void;
  previewCtx: Record<string, string>;
}

// Split editor: HTML source on the left, live rendered preview on the right,
// with clickable merge-field chips that insert tokens at the cursor.
const InvoiceHtmlEditor: React.FC<InvoiceHtmlEditorProps> = ({ html, onChange, previewCtx }) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const insertToken = (key: string) => {
    const token = `{{${key}}}`;
    const el = textareaRef.current;
    if (!el) {
      onChange(html + token);
      return;
    }
    const start = el.selectionStart ?? html.length;
    const end = el.selectionEnd ?? html.length;
    const next = html.slice(0, start) + token + html.slice(end);
    onChange(next);
    // Restore cursor just after the inserted token.
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const renderedHtml = sanitizeInvoiceHtml(renderInvoiceTemplate(html, previewCtx));

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Merge fields (click to insert)</p>
        <div className="flex flex-wrap gap-1.5">
          {MERGE_FIELDS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => insertToken(f.key)}
              title={f.label}
              className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold hover:bg-blue-100 transition-colors"
            >
              {`{{${f.key}}}`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">HTML</p>
          <textarea
            ref={textareaRef}
            value={html}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            className="w-full h-[520px] p-4 font-mono text-xs leading-relaxed bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 outline-none resize-none"
            placeholder="Write your invoice HTML with {{mergeFields}}…"
          />
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Live preview</p>
          <div className="h-[520px] overflow-auto bg-gray-100 border border-gray-200 rounded-xl p-4">
            <div className="bg-white shadow-sm mx-auto" style={{ width: 800, transformOrigin: 'top left' }}>
              {/* Author-controlled template (admin/manager only) rendered with sample/real data. */}
              <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceHtmlEditor;
