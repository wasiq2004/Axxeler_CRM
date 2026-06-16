import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useUI } from '../../../contexts/UIContext';
import { useTasks } from '../../../contexts/TasksContext';
import { useUsers } from '../../../contexts/UsersContext';
import { useLeads } from '../../../contexts/LeadsContext';
import { useContacts } from '../../../contexts/ContactsContext';
import { useDeals } from '../../../contexts/DealsContext';
import { Task, TaskStatus, TaskPriority, User, Lead, Contact, Deal } from '../../../types';
import Button from '@/components/ui/Button';

interface EditTaskModalProps {
  task?: Task | null;
}

const statusOptions: TaskStatus[] = ['Pending', 'In Progress', 'Completed'];
const priorityOptions: TaskPriority[] = ['High', 'Medium', 'Low'];

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task }) => {
  const { isEditTaskModalOpen, closeEditTaskModal } = useUI();
  const { editTask, updateTaskStatus } = useTasks();
  const { users } = useUsers();
  const { leads } = useLeads();
  const { contacts } = useContacts();
  const { deals } = useDeals();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('Pending');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [relatedToType, setRelatedToType] = useState<'Lead' | 'Contact' | 'Deal' | ''>('');
  const [relatedToId, setRelatedToId] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setAssignedToId(task.assignedToId || '');
      setRelatedToType((task.relatedTo?.type as 'Lead' | 'Contact' | 'Deal') || '');
      setRelatedToId(task.relatedTo?.id || '');
    }
  }, [task]);

  const getRelatedEntities = () => {
    switch (relatedToType) {
      case 'Lead': return leads.map((l: Lead) => ({ id: l.id, name: `${l.firstName} ${l.lastName}` }));
      case 'Contact': return contacts.map((c: Contact) => ({ id: c.id, name: c.name || '' }));
      case 'Deal': return deals.map((d: Deal) => ({ id: d.id, name: d.name }));
      default: return [];
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) {
      alert('Please fill in Title and Due Date.');
      return;
    }
    
    if (task) {
      let relatedToName = '';
      if (relatedToType && relatedToId) {
        const entity = getRelatedEntities().find(e => e.id === relatedToId);
        relatedToName = entity?.name || '';
      }
      editTask(task.id, {
        title,
        description: description || undefined,
        status,
        priority,
        dueDate,
        assignedToId,
        relatedTo: relatedToType && relatedToId ? { type: relatedToType, id: relatedToId, name: relatedToName } : undefined,
      });
    }
    
    closeEditTaskModal();
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (task) {
      updateTaskStatus(task.id, newStatus);
      setStatus(newStatus);
    }
  };

  if (!isEditTaskModalOpen || !task) return null;

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
            Edit Task
          </h2>
          <button 
            onClick={closeEditTaskModal} 
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
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                required 
                className={inputClass} 
              />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                rows={3}
                className={`${inputClass} resize-none`} 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Status</label>
                <select 
                  value={status} 
                  onChange={e => handleStatusChange(e.target.value as TaskStatus)}
                  className={inputClass}
                >
                  {statusOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Priority</label>
                <select 
                  value={priority} 
                  onChange={e => setPriority(e.target.value as TaskPriority)}
                  className={inputClass}
                >
                  {priorityOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Due Date <span className="text-red-500">*</span></label>
              <input 
                type="date" 
                value={dueDate} 
                onChange={e => setDueDate(e.target.value)} 
                required 
                className={inputClass} 
              />
            </div>
            <div>
              <label className={labelClass}>Assigned To</label>
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
                  onChange={e => { setRelatedToType(e.target.value as any); setRelatedToId(''); }}
                  className={inputClass}
                >
                  <option value="">None</option>
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
                  className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="">Select entity</option>
                  {getRelatedEntities().map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
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
              onClick={closeEditTaskModal}
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

export default EditTaskModal;
