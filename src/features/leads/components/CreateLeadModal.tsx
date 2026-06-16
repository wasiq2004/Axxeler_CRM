import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useUI } from '../../../contexts/UIContext';
import { useLeads } from '../../../contexts/LeadsContext';
import { useUsers } from '../../../contexts/UsersContext';
import { useAuth } from '../../../contexts/AuthContext';
import { LeadStatus, User } from '../../../types';
import Button from '@/components/ui/Button';

interface CreateLeadModalProps {
  defaultStatus?: LeadStatus;
}

const CreateLeadModal: React.FC<CreateLeadModalProps> = ({ defaultStatus }) => {
  const { isCreateLeadModalOpen, closeCreateLeadModal } = useUI();
  const { createLead } = useLeads();
  const { users } = useUsers();
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<LeadStatus>(defaultStatus || 'New');
  const [ownerId, setOwnerId] = useState(user?.id || '');

  useEffect(() => {
    if (!isCreateLeadModalOpen) {
      setFirstName('');
      setLastName('');
      setCompany('');
      setEmail('');
      setPhone('');
      setStatus(defaultStatus || 'New');
        setOwnerId(user?.id || '');
    }
  }, [isCreateLeadModalOpen, defaultStatus, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      alert('Please fill in First Name, Last Name, and Email.');
      return;
    }
    createLead({ firstName, lastName, company, email, phone, ownerId }, status);
    
    setFirstName('');
    setLastName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setStatus(defaultStatus || 'New');
    setOwnerId(user?.id || '');
    closeCreateLeadModal();
  };

  if (!isCreateLeadModalOpen) return null;

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
            Create New Lead
          </h2>
          <button 
            onClick={closeCreateLeadModal} 
            className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-colors focus:outline-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First Name <span className="text-red-500">*</span></label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required className={inputClass} placeholder="First Name" />
              </div>
              <div>
                <label className={labelClass}>Last Name <span className="text-red-500">*</span></label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required className={inputClass} placeholder="Last Name" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Company</label>
              <input type="text" value={company} onChange={e => setCompany(e.target.value)} className={inputClass} placeholder="Company Name" />
            </div>
            <div>
              <label className={labelClass}>Email <span className="text-red-500">*</span></label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} placeholder="Email Address" />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} placeholder="Phone Number" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Status</label>
                <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value as LeadStatus)}
                  className={inputClass}
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Closed - Won">Closed - Won</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Assign To</label>
                <select 
                  value={ownerId} 
                  onChange={e => setOwnerId(e.target.value)} 
                  className={inputClass}
                >
                  {Object.values(users).map((user: User) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex justify-end items-center space-x-3 rounded-b-[24px] shrink-0">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={closeCreateLeadModal}
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
              Create Lead
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLeadModal;
