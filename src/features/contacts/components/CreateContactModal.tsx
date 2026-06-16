import React, { useState } from 'react';
import { X, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useUI } from '../../../contexts/UIContext';
import { useContacts } from '../../../contexts/ContactsContext';
import Button from '@/components/ui/Button';

const CreateContactModal: React.FC = () => {
  const { isCreateContactModalOpen, closeCreateContactModal } = useUI();
  const { addContact } = useContacts();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert('Please fill in Name and Phone Number.');
      return;
    }
    addContact({ name, phone: `91${phone.replace(/\D/g, '')}` });
    
    setName('');
    setPhone('');
    closeCreateContactModal();
  };

  if (!isCreateContactModalOpen) return null;

  const labelClass = "block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1";
  const inputClass = "w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-gray-400";

  return (
    <div
      className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg transform transition-all animate-fadeIn border border-gray-100 flex flex-col max-h-full">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            Create Contact
          </h2>
          <button 
            onClick={closeCreateContactModal} 
            className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-colors focus:outline-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto">
            <div>
                <label className={labelClass}>Name <span className="text-red-500">*</span></label>
                <div className="relative">
                    <input 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      required 
                      maxLength={100} 
                      className={inputClass} 
                      placeholder="e.g. John Doe" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-300 bg-white px-1">{name.length}/100</span>
                </div>
            </div>

            <div>
                <label className={labelClass}>Phone Number <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                    <button 
                      type="button" 
                      className="inline-flex items-center justify-center space-x-2 px-4 py-3.5 border border-gray-100 rounded-xl text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none transition-all duration-200"
                    >
                        <span>IN</span>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                          +91
                      </span>
                      <input 
                        type="tel" 
                        value={phone} 
                        onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} 
                        required 
                        className={`${inputClass} pl-12`} 
                        placeholder="99999 99999" 
                      />
                    </div>
                </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex justify-end items-center space-x-3 rounded-b-[24px] shrink-0">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={closeCreateContactModal}
              className="!bg-white !text-gray-600 !border-gray-200 hover:!bg-gray-50 !rounded-xl !font-bold text-xs uppercase tracking-widest shadow-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={CheckCircle2}
              className="!bg-gray-900 hover:!bg-black !text-white !font-black text-xs uppercase tracking-widest !rounded-xl shadow-lg shadow-gray-200/50 transform active:scale-95 transition-all"
            >
              Create Contact
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateContactModal;
