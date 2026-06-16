import React, { useState, useEffect } from 'react';
import { X, Plus, CheckCircle2 } from 'lucide-react';
import { useUI } from '../../../contexts/UIContext';
import { useDeals } from '../../../contexts/DealsContext';
import { useUsers } from '../../../contexts/UsersContext';
import { Deal, DealStage, User } from '../../../types';
import Button from '@/components/ui/Button';

interface EditDealModalProps {
  deal?: Deal | null;
  defaultStage?: DealStage;
  defaultOwnerId?: string;
}

const EditDealModal: React.FC<EditDealModalProps> = ({ deal, defaultStage, defaultOwnerId }) => {
  const { isEditDealModalOpen, isCreateDealModalOpen, closeEditDealModal, closeCreateDealModal } = useUI();
  const { editDeal, createDeal } = useDeals();
  const { users } = useUsers();
  const [name, setName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [stage, setStage] = useState<DealStage>(defaultStage || 'Prospecting');
  const [value, setValue] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [ownerId, setOwnerId] = useState(defaultOwnerId || '');

  useEffect(() => {
    if (deal) {
      setName(deal.name);
      setAccountName(deal.accountName);
      setStage(deal.stage);
      setValue(String(Number(deal.value)));
      setCloseDate(deal.closeDate ? deal.closeDate.split('T')[0] : '');
      setOwnerId(deal.ownerId || '');
    } else {
      setName('');
      setAccountName('');
      setStage(defaultStage || 'Prospecting');
      setValue('');
      setCloseDate('');
      setOwnerId(defaultOwnerId || '');
    }
  }, [deal, defaultStage, defaultOwnerId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('Please fill in the deal name.');
      return;
    }
    
    if (deal) {
      editDeal(deal.id, { 
        name, 
        accountName, 
        stage, 
        value: parseFloat(value) || 0, 
        closeDate, 
        ownerId 
      });
    } else {
      createDeal({
        name,
        accountId: '',
        accountName,
        stage,
        value: parseFloat(value) || 0,
        closeDate,
        ownerId,
      });
    }
    
    if (deal) {
      closeEditDealModal();
    } else {
      closeCreateDealModal();
    }
  };

  const isCreating = !deal && (isCreateDealModalOpen || defaultStage);

  if ((!isEditDealModalOpen && !isCreateDealModalOpen) || (!deal && !defaultStage)) return null;

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
            {isCreating ? 'Create Deal' : 'Edit Deal'}
          </h2>
          <button 
            onClick={isCreating ? closeCreateDealModal : closeEditDealModal} 
            className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-colors focus:outline-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto">
            <div>
              <label className={labelClass}>Deal Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                className={inputClass} 
              />
            </div>
            <div>
              <label className={labelClass}>Account Name</label>
              <input 
                type="text" 
                value={accountName} 
                onChange={e => setAccountName(e.target.value)} 
                className={inputClass} 
              />
            </div>
            <div>
              <label className={labelClass}>Stage</label>
              <select 
                value={stage} 
                onChange={e => setStage(e.target.value as DealStage)}
                className={inputClass}
              >
                <option value="Prospecting">Prospecting</option>
                <option value="Qualification">Qualification</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Closed - Won">Closed - Won</option>
                <option value="Closed - Lost">Closed - Lost</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Value</label>
              <input 
                type="number" 
                value={value} 
                onChange={e => setValue(e.target.value)} 
                className={inputClass} 
              />
            </div>
            <div>
              <label className={labelClass}>Close Date</label>
              <input 
                type="date" 
                value={closeDate} 
                onChange={e => setCloseDate(e.target.value)} 
                className={inputClass} 
              />
            </div>
            <div>
              <label className={labelClass}>Owner</label>
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
          <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex justify-end items-center space-x-3 rounded-b-[24px] shrink-0">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={isCreating ? closeCreateDealModal : closeEditDealModal}
              className="!bg-white !text-gray-600 !border-gray-200 hover:!bg-gray-50 !rounded-xl !font-bold text-xs uppercase tracking-widest shadow-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={isCreating ? Plus : CheckCircle2}
              className="!bg-gray-900 hover:!bg-black !text-white !font-black text-xs uppercase tracking-widest !rounded-xl shadow-lg shadow-gray-200/50 transform active:scale-95 transition-all"
            >
              {isCreating ? 'Create Deal' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDealModal;
