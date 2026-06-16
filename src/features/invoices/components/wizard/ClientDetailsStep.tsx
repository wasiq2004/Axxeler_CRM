import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { InvoiceItem } from '@/types';

interface ClientDetailsStepProps {
    formData: {
        clientName: string;
        clientEmail: string;
        clientCompany: string;
        dueDate: string;
        items: InvoiceItem[];
        taxRate: number;
    };
    updateFormData: (updates: Partial<{
        clientName: string;
        clientEmail: string;
        clientCompany: string;
        dueDate: string;
        items: InvoiceItem[];
        taxRate: number;
    }>) => void;
    errors: Record<string, string>;
}

const ClientDetailsStep: React.FC<ClientDetailsStepProps> = ({ formData, updateFormData, errors }) => {
    return (
        <div className="animate-fadeIn">
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
        </div>
    );
};

export default ClientDetailsStep;
