import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useUI } from '../../../contexts/UIContext';
import { useLeads } from '../../../contexts/LeadsContext';
import { useUsers } from '../../../contexts/UsersContext';
import { Lead, User } from '../../../types';
import Button from '@/components/ui/Button';

interface EditLeadModalProps {
  lead?: Lead | null;
}

const EditLeadModal: React.FC<EditLeadModalProps> = ({ lead }) => {
  const { isEditLeadModalOpen, closeEditLeadModal } = useUI();
  const { editLead } = useLeads();
  const { users } = useUsers();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<Lead['status']>('New');
  const [ownerId, setOwnerId] = useState('');

  useEffect(() => {
    if (lead) {
      setFirstName(lead.firstName);
      setLastName(lead.lastName);
      setCompany(lead.company || '');
      setEmail(lead.email);
      setPhone(lead.phone || '');
      setStatus(lead.status);
      setOwnerId(lead.ownerId || '');
    }
  }, [lead]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      alert('Please fill in First Name, Last Name, and Email.');
      return;
    }
    
    if (lead) {
      editLead(lead.id, { firstName, lastName, company, email, phone, status, ownerId });
    }
    
    closeEditLeadModal();
  };

  if (!isEditLeadModalOpen || !lead) return null;

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
            Edit Lead
          </h2>
          <button 
            onClick={closeEditLeadModal} 
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
                <input 
                  type="text" 
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)} 
                  required 
                  className={inputClass} 
                />
              </div>
              <div>
                <label className={labelClass}>Last Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                  required 
                  className={inputClass} 
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Company</label>
              <input 
                type="text" 
                value={company} 
                onChange={e => setCompany(e.target.value)} 
                className={inputClass} 
              />
            </div>
            <div>
              <label className={labelClass}>Email <span className="text-red-500">*</span></label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                className={inputClass} 
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                className={inputClass} 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Status</label>
                <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value as Lead['status'])}
                  className={inputClass}
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Closed - Won">Closed - Won</option>
                  <option value="Lost">Lost</option>
                  <option value="Qualified">Qualified</option>
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
              onClick={closeEditLeadModal}
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

export default EditLeadModal;
