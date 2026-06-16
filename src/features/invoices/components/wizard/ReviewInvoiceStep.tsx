import React from 'react';
import type { InvoiceItem } from '@/types';
import { useCurrency } from '@/contexts/CurrencyContext';

interface ReviewInvoiceStepProps {
    formData: {
        clientName: string;
        clientEmail: string;
        clientCompany: string;
        dueDate: string;
        items: InvoiceItem[];
        taxRate: number;
    };
}

const ReviewInvoiceStep: React.FC<ReviewInvoiceStepProps> = ({ formData }) => {
    const { currency } = useCurrency();
    const subtotal = formData.items.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
    const taxAmount = subtotal * (formData.taxRate / 100);
    const total = subtotal + taxAmount;

    return (
        <div className="animate-fadeIn space-y-8">
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                {/* Header Preview */}
                <div className="flex justify-between items-start border-b border-gray-200 pb-8">
                    <div>
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-[#0079C1] text-xs font-semibold uppercase tracking-wider">
                            Draft Invoice
                        </span>
                        <h2 className="text-3xl font-bold text-gray-900 mt-4">Invoice</h2>
                        <p className="text-gray-500 mt-1">#INV-{String(Date.now()).slice(-4)}</p>
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
