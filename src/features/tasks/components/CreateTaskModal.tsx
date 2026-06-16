import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useUI } from '../../../contexts/UIContext';
import { useTasks } from '../../../contexts/TasksContext';
import { useUsers } from '../../../contexts/UsersContext';
import { useLeads } from '../../../contexts/LeadsContext';
import { useContacts } from '../../../contexts/ContactsContext';
import { useDeals } from '../../../contexts/DealsContext';
import type { TaskPriority, User, Lead, Contact, Deal } from '../../../types';
import Button from '@/components/ui/Button';

const CreateTaskModal: React.FC = () => {
  const { isCreateTaskModalOpen, closeCreateTaskModal } = useUI();
  const { addTask } = useTasks();
  const { users } = useUsers();
  const { leads } = useLeads();
  const { contacts } = useContacts();
  const { deals } = useDeals();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [assignedToId, setAssignedToId] = useState('');
  const [relatedToType, setRelatedToType] = useState<'Lead' | 'Contact' | 'Deal' | ''>('');
  const [relatedToId, setRelatedToId] = useState('');

  React.useEffect(() => {
    if (!isCreateTaskModalOpen) {
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('Medium');
      setAssignedToId('');
      setRelatedToType('');
      setRelatedToId('');
    }
  }, [isCreateTaskModalOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) {
      alert('Please fill in Title and Due Date.');
      return;
    }
    
    let relatedToName = '';
    if (relatedToType && relatedToId) {
      switch (relatedToType) {
        case 'Lead':
          const lead = leads.find(l => l.id === relatedToId);
          relatedToName = lead ? `${lead.firstName} ${lead.lastName}` : '';
          break;
        case 'Contact':
          const contact = contacts.find(c => c.id === relatedToId);
          relatedToName = contact ? (contact.name || '') : '';
          break;
        case 'Deal':
          const deal = deals.find(d => d.id === relatedToId);
          relatedToName = deal ? deal.name : '';
          break;
      }
    }
    
    addTask({ 
      title, 
      description, 
      dueDate, 
      priority,
      assignedToId: assignedToId || undefined,
      relatedTo: relatedToType && relatedToId ? {
        type: relatedToType,
        id: relatedToId,
        name: relatedToName
      } : undefined
    });
    
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('Medium');
    setAssignedToId('');
    setRelatedToType('');
    setRelatedToId('');
    closeCreateTaskModal();
  };

  const getRelatedEntities = () => {
    switch (relatedToType) {
      case 'Lead':
        return leads.map((lead: Lead) => ({ id: lead.id, name: `${lead.firstName} ${lead.lastName}` }));
      case 'Contact':
        return contacts.map((contact: Contact) => ({ id: contact.id, name: contact.name || '' }));
      case 'Deal':
        return deals.map((deal: Deal) => ({ id: deal.id, name: deal.name }));
      default:
        return [];
    }
  };

  const relatedEntities = getRelatedEntities();

  if (!isCreateTaskModalOpen) return null;

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
            Create New Task
          </h2>
          <button 
            onClick={closeCreateTaskModal} 
            className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-colors focus:outline-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto">
            <div>
              <label className={labelClass}>Title <span className="text-red-500">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className={inputClass} placeholder="Task Title" />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={`${inputClass} resize-none`} placeholder="Task details..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Due Date <span className="text-red-500">*</span></label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className={inputClass}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Assign To</label>
              <select 
                value={assignedToId} 
                onChange={e => setAssignedToId(e.target.value)} 
                className={inputClass}
              >
                <option value="">Select user</option>
                {Object.values(users).map((user: User) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Related To Type</label>
                <select 
                  value={relatedToType} 
                  onChange={e => {
                    setRelatedToType(e.target.value as 'Lead' | 'Contact' | 'Deal' | '');
                    setRelatedToId('');
                  }} 
                  className={inputClass}
                >
                  <option value="">Select type</option>
                  <option value="Lead">Lead</option>
                  <option value="Contact">Contact</option>
                  <option value="Deal">Deal</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Related To</label>
                <select 
                  value={relatedToId} 
                  onChange={e => setRelatedToId(e.target.value)} 
                  disabled={!relatedToType}
                  className={`${inputClass} disabled:opacity-50 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                >
                  <option value="">Select entity</option>
                  {relatedEntities.map(entity => (
                    <option key={entity.id} value={entity.id}>{entity.name}</option>
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
              onClick={closeCreateTaskModal}
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
              Create Task
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
