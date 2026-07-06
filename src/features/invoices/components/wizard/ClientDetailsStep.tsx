import React from 'react';
import { AlertCircle, FileText, ReceiptText } from 'lucide-react';
import type { InvoiceItem, InvoiceType } from '@/types';

interface ClientDetailsFormData {
    clientName: string;
    clientEmail: string;
    clientCompany: string;
    dueDate: string;
    items: InvoiceItem[];
    taxRate: number;
    invoiceType?: InvoiceType;
    paymentTerms?: string;
}

interface ClientDetailsStepProps {
    formData: ClientDetailsFormData;
    updateFormData: (updates: Partial<ClientDetailsFormData>) => void;
    errors: Record<string, string>;
}

const ClientDetailsStep: React.FC<ClientDetailsStepProps> = ({ formData, updateFormData, errors }) => {
    const invoiceType: InvoiceType = formData.invoiceType || 'Tax';

    const typeOptions: { value: InvoiceType; title: string; desc: string; icon: React.ElementType }[] = [
        { value: 'Tax', title: 'Tax Invoice', desc: 'Includes tax (GST/VAT)', icon: ReceiptText },
        { value: 'General', title: 'General Invoice', desc: 'No tax applied', icon: FileText },
    ];

    return (
        <div className="animate-fadeIn">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {typeOptions.map((opt) => {
                    const active = invoiceType === opt.value;
                    const Icon = opt.icon;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateFormData({ invoiceType: opt.value, ...(opt.value === 'General' ? { taxRate: 0 } : {}) })}
                            className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                                active ? 'border-[#0079C1] bg-[#0079C1]/5 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                        >
                            <div className={`p-2 rounded-xl ${active ? 'bg-[#0079C1] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className={`font-bold ${active ? 'text-[#0079C1]' : 'text-gray-900'}`}>{opt.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                            </div>
                            <span className={`ml-auto mt-1 w-4 h-4 rounded-full border-2 ${active ? 'border-[#0079C1] bg-[#0079C1]' : 'border-gray-300'}`} />
                        </button>
                    );
                })}
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mb-6">Client Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Name <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={formData.clientName}
                        onChange={e => updateFormData({ clientName: e.target.value })}
                        className={`mt-1 block w-full border rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0079C1] focus:border-transparent transition-all sm:text-sm ${errors.clientName ? 'border-red-300' : 'border-gray-200'
                            }`}
                        placeholder="e.g. Acme Corp"
                    />
                    {errors.clientName && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.clientName}
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Company</label>
                    <input
                        type="text"
                        value={formData.clientCompany}
                        onChange={e => updateFormData({ clientCompany: e.target.value })}
                        className="mt-1 block w-full border border-gray-200 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0079C1] focus:border-transparent transition-all sm:text-sm"
                        placeholder="Optional"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Email <span className="text-red-500">*</span></label>
                    <input
                        type="email"
                        value={formData.clientEmail}
                        onChange={e => updateFormData({ clientEmail: e.target.value })}
                        className={`mt-1 block w-full border rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0079C1] focus:border-transparent transition-all sm:text-sm ${errors.clientEmail ? 'border-red-300' : 'border-gray-200'
                            }`}
                        placeholder="billing@example.com"
                    />
                    {errors.clientEmail && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.clientEmail}
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-red-500">*</span></label>
                    <input
                        type="date"
                        value={formData.dueDate}
                        onChange={e => updateFormData({ dueDate: e.target.value })}
                        className={`mt-1 block w-full border rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0079C1] focus:border-transparent transition-all sm:text-sm ${errors.dueDate ? 'border-red-300' : 'border-gray-200'
                            }`}
                    />
                    {errors.dueDate && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.dueDate}
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Ref / Terms</label>
                <textarea
                    value={formData.paymentTerms || ''}
                    onChange={e => updateFormData({ paymentTerms: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full border border-gray-200 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0079C1] focus:border-transparent transition-all sm:text-sm"
                    placeholder="e.g. Payment due within 15 days. Ref: PO-1234"
                />
            </div>
        </div>
    );
};

export default ClientDetailsStep;
