import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, User, FileText, CheckCircle } from 'lucide-react';
import type { InvoiceItem } from '@/types';
import { useInvoices } from '@/contexts/InvoicesContext';
import Button from '@/components/ui/Button';

// Step components
import ClientDetailsStep from '@/features/invoices/components/wizard/ClientDetailsStep';
import InvoiceItemsStep from '@/features/invoices/components/wizard/InvoiceItemsStep';
import ReviewInvoiceStep from '@/features/invoices/components/wizard/ReviewInvoiceStep';

const CreateInvoicePage: React.FC = () => {
  const navigate = useNavigate();
  const { addInvoice } = useInvoices();

  // Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Form State
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientCompany: '',
    dueDate: '',
    items: [
      { id: crypto.randomUUID(), description: '', quantity: 1, price: 0 }
    ] as InvoiceItem[],
    taxRate: 8
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear errors for updated fields
    const newErrors = { ...errors };
    Object.keys(updates).forEach(key => delete newErrors[key]);
    setErrors(newErrors);
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.clientName.trim()) newErrors.clientName = 'Client name is required';
    if (!formData.clientEmail.trim()) {
      newErrors.clientEmail = 'Client email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = 'Invalid email format';
    }
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    const invalidItems = formData.items.filter(item =>
      !item.description.trim() || item.quantity <= 0 || item.price < 0
    );
    if (invalidItems.length > 0) newErrors.items = 'Please fix invalid items';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    addInvoice({
      invoiceNumber: `INV-${String(Date.now()).slice(-4)}`,
      clientName: formData.clientName,
      clientCompany: formData.clientCompany,
      clientEmail: formData.clientEmail,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: formData.dueDate,
      status: 'Draft',
      items: formData.items,
      taxRate: formData.taxRate,
    });
    navigate('/invoices');
  };

  // Render Step Indicators
  const renderSteps = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${step === currentStep
            ? 'border-[#0079C1] bg-[#0079C1] text-white'
            : step < currentStep
              ? 'border-[#0079C1] bg-[#0079C1] text-white'
              : 'border-gray-200 text-gray-400'
            }`}>
            {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
          </div>
          {step < totalSteps && (
            <div className={`w-12 h-1 mx-2 ${step < currentStep ? 'bg-[#0079C1]' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      <div>
        <Link to="/invoices" className="inline-flex items-center text-sm text-gray-500 hover:text-[#0079C1] mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Invoices
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Invoice</h1>
        <p className="text-gray-500 text-sm mt-1">Create a professional invoice in 3 simple steps.</p>
      </div>

      {renderSteps()}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        {currentStep === 1 && (
          <ClientDetailsStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        )}
        {currentStep === 2 && (
          <InvoiceItemsStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        )}
        {currentStep === 3 && (
          <ReviewInvoiceStep
            formData={formData}
          />
        )}

        <div className="flex justify-between pt-6 mt-6 border-t border-gray-100">
          {currentStep > 1 ? (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          ) : (
            <div></div>
          )}

          {currentStep < 3 ? (
            <Button variant="primary" onClick={handleNext} className="bg-[#0079C1] text-white">
              Next Step
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSave} icon={Save} className="bg-[#0079C1] text-white">
              Create Invoice
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateInvoicePage;
