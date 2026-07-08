import React, { useEffect, useMemo, useState } from 'react';
import type { Invoice, InvoiceItem, InvoiceTemplate } from '@/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useApi } from '@/contexts/ApiContext';
import { FileCode, Plus, Pencil } from 'lucide-react';
import { buildInvoiceContext, renderInvoiceTemplate, sanitizeInvoiceHtml, DEFAULT_INVOICE_TEMPLATE } from '@/features/invoices/utils/invoiceTemplate';
import TemplateEditorModal from '@/features/invoices/components/TemplateEditorModal';

interface ReviewFormData {
    clientName: string;
    clientEmail: string;
    clientCompany: string;
    dueDate: string;
    items: InvoiceItem[];
    taxRate: number;
    invoiceType?: 'General' | 'Tax';
    paymentTerms?: string;
    templateId?: string;
}

interface ReviewInvoiceStepProps {
    formData: ReviewFormData;
    updateFormData: (updates: Partial<ReviewFormData>) => void;
}

const STANDARD = '';

const ReviewInvoiceStep: React.FC<ReviewInvoiceStepProps> = ({ formData, updateFormData }) => {
    const { currency } = useCurrency();
    const { companyInfo } = useCompany();
    const { crmApi } = useApi();
    const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editorInitial, setEditorInitial] = useState<{ id?: string; name?: string; html?: string } | null>(null);

    const subtotal = formData.items.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
    const taxAmount = subtotal * (formData.taxRate / 100);
    const total = subtotal + taxAmount;

    useEffect(() => {
        crmApi.getInvoiceTemplates()
            .then((res) => {
                const list: InvoiceTemplate[] = res.data || [];
                setTemplates(list);
                // Preselect the default template if the user hasn't chosen one yet.
                if (formData.templateId === undefined) {
                    const def = list.find((t) => t.isDefault);
                    if (def) updateFormData({ templateId: def.id });
                }
            })
            .catch(() => undefined);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectedTemplate = templates.find((t) => t.id === formData.templateId);
    const templateHtml = selectedTemplate?.html || DEFAULT_INVOICE_TEMPLATE;

    // Real invoice data for live previews (shared by the inline preview + the editor).
    const previewCtx = useMemo(() => {
        const previewInvoice: Invoice = {
            id: 'preview',
            invoiceNumber: 'Assigned on creation',
            clientName: formData.clientName,
            clientCompany: formData.clientCompany,
            clientEmail: formData.clientEmail,
            issueDate: new Date().toISOString().slice(0, 10),
            dueDate: formData.dueDate,
            status: 'Draft',
            invoiceType: formData.invoiceType || 'Tax',
            taxRate: (formData.invoiceType || 'Tax') === 'General' ? 0 : formData.taxRate,
            paymentTerms: formData.paymentTerms,
            items: formData.items,
        };
        return buildInvoiceContext(previewInvoice, companyInfo, currency.symbol);
    }, [formData, companyInfo, currency.symbol]);

    const customPreviewHtml = useMemo(
        () => sanitizeInvoiceHtml(renderInvoiceTemplate(templateHtml, previewCtx)),
        [templateHtml, previewCtx],
    );

    // Add or update a template in the local list and select it for this invoice.
    const handleTemplateSaved = (t: InvoiceTemplate) => {
        setTemplates((prev) => (prev.some((x) => x.id === t.id) ? prev.map((x) => (x.id === t.id ? t : x)) : [...prev, t]));
        updateFormData({ templateId: t.id });
    };

    return (
        <div className="animate-fadeIn space-y-8">
            {/* Template selection — the user picks their own custom invoice design */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                    <FileCode className="w-4 h-4 text-primary" />
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">Invoice Design</label>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={formData.templateId ?? STANDARD}
                        onChange={(e) => updateFormData({ templateId: e.target.value || undefined })}
                        className="w-full sm:w-72 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none"
                    >
                        <option value={STANDARD}>Standard (built-in)</option>
                        {templates.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}{t.isDefault ? ' (default)' : ''}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={() => { setEditorInitial({ html: templateHtml }); setEditorOpen(true); }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all"
                    >
                        <Plus className="w-4 h-4" /> Custom Template
                    </button>
                    {selectedTemplate && (
                        <button
                            type="button"
                            onClick={() => { setEditorInitial({ id: selectedTemplate.id, name: selectedTemplate.name, html: selectedTemplate.html }); setEditorOpen(true); }}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
                        >
                            <Pencil className="w-4 h-4" /> Edit
                        </button>
                    )}
                </div>
                <p className="mt-2 text-xs text-gray-400">Pick a saved design, or create your own reusable template — it’s stored for future invoices. Also manageable under Invoices → Templates.</p>
                <div className="mt-4 max-h-[420px] overflow-auto bg-gray-100 rounded-xl p-3 border border-gray-200">
                    <div className="bg-white shadow-sm mx-auto" style={{ width: 800 }}>
                        <div dangerouslySetInnerHTML={{ __html: customPreviewHtml }} />
                    </div>
                </div>
            </div>

            <TemplateEditorModal
                open={editorOpen}
                onClose={() => setEditorOpen(false)}
                previewCtx={previewCtx}
                initial={editorInitial}
                onSaved={handleTemplateSaved}
            />

            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                {/* Header Preview */}
                <div className="flex justify-between items-start border-b border-gray-200 pb-8">
                    <div>
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-[#0079C1] text-xs font-semibold uppercase tracking-wider">
                            Draft Invoice
                        </span>
                        <h2 className="text-3xl font-bold text-gray-900 mt-4">Invoice</h2>
                        <p className="text-gray-500 mt-1">Invoice number assigned on creation</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Amount Due</p>
                        <p className="text-3xl font-bold text-[#0079C1] mt-1">{currency.symbol}{total.toFixed(2)}</p>
                        <p className="text-sm text-gray-500 mt-1">Due Date: {formData.dueDate}</p>
                    </div>
                </div>

                {/* Bill To */}
                <div className="py-8 border-b border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Bill To</h3>
                    <p className="text-lg font-bold text-gray-900">{formData.clientName}</p>
                    {formData.clientCompany && <p className="text-gray-600">{formData.clientCompany}</p>}
                    <p className="text-gray-600">{formData.clientEmail}</p>
                </div>

                {/* Items */}
                <div className="py-8">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Line Items</h3>
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {formData.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.quantity}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{currency.symbol}{item.price.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right">{currency.symbol}{(item.quantity * item.price).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end mt-4">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span>{currency.symbol}{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Tax ({formData.taxRate}%)</span>
                                <span>{currency.symbol}{taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-200 pt-2 mt-2">
                                <span>Total</span>
                                <span>{currency.symbol}{total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewInvoiceStep;
