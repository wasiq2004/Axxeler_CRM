import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import type { Invoice, InvoiceItem } from '@/types';
import { useInvoices } from '@/contexts/InvoicesContext';
import Button from '@/components/ui/Button';

const EditInvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invoices, updateInvoice } = useInvoices();
  
  const invoice = invoices.find(inv => inv.id === id);
  
  const [clientName, setClientName] = useState(invoice?.clientName || '');
  const [clientEmail, setClientEmail] = useState(invoice?.clientEmail || '');
  const [clientCompany, setClientCompany] = useState(invoice?.clientCompany || '');
  const [dueDate, setDueDate] = useState(invoice?.dueDate || '');
  const [items, setItems] = useState<InvoiceItem[]>(invoice?.items || [
    { id: crypto.randomUUID(), description: '', quantity: 1, price: 0 }
  ]);
  const [taxRate, setTaxRate] = useState(invoice?.taxRate || 8);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleItemChange = (itemId: string, field: keyof Omit<InvoiceItem, 'id'>, value: string | number) => {
    setItems(items.map(item => item.id === itemId ? { ...item, [field]: value } : item));
  };
  
  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (itemId: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== itemId));
    }
  };

  const { subtotal, taxAmount, total } = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  }, [items, taxRate]);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }
    
    if (!clientEmail.trim()) {
      newErrors.clientEmail = 'Client email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      newErrors.clientEmail = 'Invalid email format';
    }
    
    if (!dueDate) {
      newErrors.dueDate = 'Due date is required';
    }
    
    const invalidItems = items.filter(item => 
      !item.description.trim() || 
      item.quantity <= 0 || 
      item.price < 0
    );
    
    if (invalidItems.length > 0) {
      newErrors.items = 'Please fix invalid items';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = () => {
    if (!validateForm() || !id) {
      return;
    }

    updateInvoice(id, {
      clientName,
      clientCompany,
      clientEmail,
      dueDate,
      items,
      taxRate,
    });

    navigate('/invoices');
  };

  if (!invoice) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold">Invoice not found</h2>
        <Link to="/invoices" className="text-primary hover:underline mt-4 inline-block">
          <ArrowLeft className="inline w-4 h-4 mr-2" />Back to Invoices
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/invoices" className="text-sm text-primary hover:underline flex items-center mb-2">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Invoices
      </Link>
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-main">Edit Invoice {invoice.invoiceNumber}</h1>
        <Button 
          variant="primary" 
          size="md" 
          icon={Save} 
          iconPosition="left" 
          onClick={handleSave}
        >
          Update Invoice
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={clientName} 
              onChange={e => setClientName(e.target.value)} 
              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                errors.clientName ? 'border-red-300' : 'border-gray-300'
              }`} 
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
              value={clientCompany} 
              onChange={e => setClientCompany(e.target.value)} 
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Email <span className="text-red-500">*</span></label>
            <input 
              type="email" 
              value={clientEmail} 
              onChange={e => setClientEmail(e.target.value)} 
              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                errors.clientEmail ? 'border-red-300' : 'border-gray-300'
              }`} 
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
              value={dueDate} 
              onChange={e => setDueDate(e.target.value)} 
              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                errors.dueDate ? 'border-red-300' : 'border-gray-300'
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
        
        <h2 className="text-lg font-semibold mb-4">Items</h2>
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 pb-2 border-b mb-2 text-sm font-medium text-gray-500">
              <div className="col-span-6 md:col-span-5">Description</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 md:col-span-1 text-right"></div>
            </div>
            {/* Items */}
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 sm:gap-4 items-center">
                  <div className="col-span-12 sm:col-span-6 md:col-span-5">
                    <input 
                      type="text" 
                      placeholder="Item description" 
                      value={item.description} 
                      onChange={e => handleItemChange(item.id, 'description', e.target.value)} 
                      className={`w-full border rounded-md shadow-sm text-sm ${
                        !item.description.trim() && errors.items ? 'border-red-300' : 'border-gray-300'
                      }`} 
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input 
                      type="number" 
                      min="1" 
                      value={item.quantity} 
                      onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value, 10) || 0)} 
                      className={`w-full border rounded-md shadow-sm text-sm text-center ${
                        item.quantity <= 0 && errors.items ? 'border-red-300' : 'border-gray-300'
                      }`} 
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      value={item.price} 
                      onChange={e => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)} 
                      className={`w-full border rounded-md shadow-sm text-sm text-right ${
                        item.price < 0 && errors.items ? 'border-red-300' : 'border-gray-300'
                      }`} 
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2 md:col-span-1 flex justify-end">
                    {items.length > 1 && (
                      <button 
                        onClick={() => removeItem(item.id)} 
                        className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              icon={Plus} 
              iconPosition="left" 
              onClick={addItem}
              className="mt-4"
            >
              Add Item
            </Button>
            {errors.items && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Please fix invalid items
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Tax (%)</span>
              <input 
                type="number" 
                value={taxRate} 
                onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} 
                className="w-16 border-gray-300 rounded-md shadow-sm text-sm text-right" 
              />
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax Amount</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-800 font-bold text-lg border-t pt-2 mt-2">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditInvoicePage;
