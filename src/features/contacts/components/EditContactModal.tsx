import React, { useState, useEffect } from 'react';
import { X, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useUI } from '../../../contexts/UIContext';
import { useContacts } from '../../../contexts/ContactsContext';
import { Contact } from '../../../types';
import Button from '@/components/ui/Button';

interface EditContactModalProps {
  contact?: Contact | null;
}

const EditContactModal: React.FC<EditContactModalProps> = ({ contact }) => {
  const { isEditContactModalOpen, closeEditContactModal } = useUI();
  const { editContact } = useContacts();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tags, setTags] = useState('');
  const [source, setSource] = useState('');

  useEffect(() => {
    if (contact) {
      setName(contact.name || '');
      setPhone(contact.phone || '');
      setTags(contact.tags ? contact.tags.join(', ') : '');
      setSource(contact.source || '');
    }
  }, [contact]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert('Please fill in Name and Phone Number.');
      return;
    }
    
    if (contact) {
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      editContact(contact.id, { 
        name, 
        phone: phone.startsWith('91') ? phone : `91${phone.replace(/\D/g, '')}`, 
        tags: tagArray,
        source
      });
    }
    
    closeEditContactModal();
  };

  if (!isEditContactModalOpen || !contact) return null;

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
            Edit Contact
          </h2>
          <button 
            onClick={closeEditContactModal} 
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
                        value={phone.replace(/^91/, '')} 
                        onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} 
                        required 
                        className={`${inputClass} pl-12`} 
                        placeholder="99999 99999" 
                      />
                    </div>
                </div>
            </div>

            <div>
                <label className={labelClass}>Tags</label>
                <input 
                  type="text" 
                  value={tags} 
                  onChange={e => setTags(e.target.value)} 
                  className={inputClass} 
                  placeholder="e.g. VIP, Follow-up" 
                />
                <p className="mt-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide ml-1">Separate tags with commas</p>
            </div>

            <div>
                <label className={labelClass}>Source</label>
                <input 
                  type="text" 
                  value={source} 
                  onChange={e => setSource(e.target.value)} 
                  className={inputClass} 
                  placeholder="e.g. Meta Ads, Website" 
                />
            </div>
          </div>

          <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex justify-end items-center space-x-3 rounded-b-[24px] shrink-0">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={closeEditContactModal}
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
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditContactModal;
