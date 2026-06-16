import React from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import type { InvoiceItem } from '@/types';
import Button from '@/components/ui/Button';
import { useCurrency } from '@/contexts/CurrencyContext';

interface InvoiceItemsStepProps {
    formData: {
        items: InvoiceItem[];
        taxRate: number;
    };
    updateFormData: (updates: Partial<{
        items: InvoiceItem[];
        taxRate: number;
    }>) => void;
    errors: Record<string, string>;
}

const InvoiceItemsStep: React.FC<InvoiceItemsStepProps> = ({ formData, updateFormData, errors }) => {
    const { currency } = useCurrency();

    const handleItemChange = (id: string, field: keyof Omit<InvoiceItem, 'id'>, value: string | number) => {
        const newItems = formData.items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        );
        updateFormData({ items: newItems });
    };

    const addItem = () => {
        const newItems = [...formData.items, { id: crypto.randomUUID(), description: '', quantity: 1, price: 0 }];
        updateFormData({ items: newItems });
    };

    const removeItem = (id: string) => {
        if (formData.items.length > 1) {
            const newItems = formData.items.filter(item => item.id !== id);
            updateFormData({ items: newItems });
        }
    };

    const calculateSubtotal = () => {
        return formData.items.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const taxAmount = subtotal * (formData.taxRate / 100);
        return subtotal + taxAmount;
    };

    return (
        <div className="animate-fadeIn">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Invoice Items</h2>

            <div className="bg-gray-50 rounded-lg p-1 mb-4 hidden sm:grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <div className="col-span-5 px-4 py-2">Description</div>
                <div className="col-span-2 px-4 py-2 text-center">Qty</div>
                <div className="col-span-3 px-4 py-2 text-right">Price</div>
                <div className="col-span-2 px-4 py-2"></div>
            </div>

            <div className="space-y-3">
                {formData.items.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 sm:gap-4 items-center bg-white sm:bg-transparent p-4 sm:p-0 rounded-lg border sm:border-0 border-gray-200 shadow-sm sm:shadow-none relative">
                        <div className="col-span-12 sm:col-span-5">
                            <label className="sm:hidden text-xs font-medium text-gray-500 mb-1 block">Description</label>
                            <input
                                type="text"
                                placeholder="Item description"
                                value={item.description}
                                onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                                className={`w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#0079C1] focus:border-transparent transition-all text-sm ${!item.description.trim() && errors.items ? 'border-red-300' : 'border-gray-200'
                                    }`}
                            />
                        </div>
                        <div className="col-span-6 sm:col-span-2">
                            <label className="sm:hidden text-xs font-medium text-gray-500 mb-1 block">Qty</label>
                            <input
                                type="number"
                                min="1"
                                value={item.quantity === 0 ? '' : item.quantity}
                                onFocus={e => e.target.select()}
                                onChange={e => handleItemChange(item.id, 'quantity', e.target.value === '' ? 0 : parseInt(e.target.value, 10))}
                                className={`w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#0079C1] focus:border-transparent transition-all text-sm text-center ${item.quantity <= 0 && errors.items ? 'border-red-300' : 'border-gray-200'
                                    }`}
                            />
                        </div>
                        <div className="col-span-6 sm:col-span-3">
                            <label className="sm:hidden text-xs font-medium text-gray-500 mb-1 block">Price</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{currency.symbol}</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.price === 0 ? '' : item.price}
                                    onFocus={e => e.target.select()}
                                    onChange={e => handleItemChange(item.id, 'price', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                    className={`w-full border rounded-lg shadow-sm py-2 pl-7 pr-3 focus:outline-none focus:ring-2 focus:ring-[#0079C1] focus:border-transparent transition-all text-sm text-right ${item.price < 0 && errors.items ? 'border-red-300' : 'border-gray-200'
                                        }`}
                                />
                            </div>
                        </div>
                        <div className="col-span-12 sm:col-span-2 flex justify-end sm:justify-center mt-2 sm:mt-0">
                            {formData.items.length > 1 && (
                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 sm:gap-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="sm:hidden text-sm font-medium">Remove Item</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {errors.items && (
                <p className="mt-3 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Please fix invalid items
                </p>
            )}

            <div className="mt-4">
                <Button
                    variant="outline"
                    size="sm"
                    icon={Plus}
                    onClick={addItem}
                    className="text-[#0079C1] border-[#0079C1] hover:bg-blue-50"
                >
                    Add Another Item
                </Button>
            </div>

            <div className="mt-8 flex justify-end border-t border-gray-100 pt-6">
                <div className="w-full max-w-sm space-y-3 bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between text-gray-600 text-sm">
                        <span>Subtotal</span>
                        <span className="font-medium">{currency.symbol}{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600 text-sm">
                        <span>Tax Rate (%)</span>
                        <input
                            type="number"
                            value={formData.taxRate === 0 ? '' : formData.taxRate}
                            onFocus={e => e.target.select()}
                            onChange={e => updateFormData({ taxRate: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                            className="w-20 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#0079C1] focus:border-transparent"
                        />
                    </div>
                    <div className="flex justify-between text-gray-600 text-sm">
                        <span>Tax Amount</span>
                        <span className="font-medium">{currency.symbol}{(calculateSubtotal() * (formData.taxRate / 100)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-900 font-bold text-lg pt-3 border-t border-gray-200">
                        <span>Total Due</span>
                        <span className="text-[#0079C1]">{currency.symbol}{calculateTotal().toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceItemsStep;
