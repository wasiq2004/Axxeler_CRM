import React, { useState, useMemo, createContext, useContext } from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal, GripVertical, Edit, Eye, Trash2, Plus, ChevronRight } from 'lucide-react';
import type { Lead, LeadStatus } from '../../../types';
import { useLeads } from '../../../contexts/LeadsContext';
import { useUI } from '../../../contexts/UIContext';
import { PIPELINE_STAGES } from '../../../constants';

// Create a context to share the new lead status between components
interface NewLeadContextType {
  newLeadStatus: LeadStatus | null;
  setNewLeadStatus: (status: LeadStatus | null) => void;
}

const NewLeadContext = createContext<NewLeadContextType | undefined>(undefined);

export const useNewLead = () => {
  const context = useContext(NewLeadContext);
  if (context === undefined) {
    throw new Error('useNewLead must be used within a NewLeadProvider');
  }
  return context;
};

export const NewLeadProvider: React.FC<{ children: React.ReactNode; value: NewLeadContextType }> = ({ children, value }) => {
  return <NewLeadContext.Provider value={value}>{children}</NewLeadContext.Provider>;
};

interface LeadCardProps {
  lead: Lead;
  onSelectLead: (lead: Lead) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onSelectLead }) => {
  const { openEditLeadModal } = useUI();
  const { deleteLead } = useLeads();
  const [showActions, setShowActions] = useState(false);
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('leadId', lead.id);
  };
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectLead(lead);
    openEditLeadModal();
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the lead ${lead.firstName} ${lead.lastName}?`)) {
      deleteLead(lead.id);
    }
    setShowActions(false);
  };
  
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="bg-white p-3 rounded-xl shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-gray-100 cursor-grab active:cursor-grabbing mb-3 group transition-all hover:shadow-[0_8px_25px_rgba(0,0,0,0.04)] hover:border-primary/20"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col pr-2">
          <Link to={`/leads/${lead.id}`} className="font-bold text-sm text-gray-900 leading-tight group-hover:text-primary transition-colors">
            {lead.firstName} {lead.lastName}
          </Link>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{lead.company}</span>
        </div>
        <div className="relative">
          <button
            className="text-gray-300 hover:text-gray-900 transition-colors p-1"
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
          >
            <MoreHorizontal size={16} />
          </button>

          {showActions && (
            <div
              className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-xl bg-white border border-gray-100 z-20 animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
               <div className="py-1.5 p-1" role="menu">
                <Link
                  to={`/leads/${lead.id}`}
                  className="flex items-center w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  role="menuitem"
                >
                  <Eye className="w-3.5 h-3.5 mr-2 text-gray-400" />
                  View Details
                </Link>
                <button
                  onClick={handleEditClick}
                  className="flex items-center w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  role="menuitem"
                >
                  <Edit className="w-3.5 h-3.5 mr-2 text-gray-400" />
                  Quick Edit
                </button>
                <div className="my-1 border-t border-gray-50"></div>
                <button
                  onClick={handleDeleteClick}
                  className="flex items-center w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  role="menuitem"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Remove Lead
                </button>
              </div>
            </div>
          )}
        </div>
      </div>



      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all opacity-60 group-hover:opacity-100">
          {lead.ownerAvatar && <img src={lead.ownerAvatar} alt={lead.ownerName} className="w-5 h-5 rounded-full ring-2 ring-white ring-offset-1 border border-gray-100" title={lead.ownerName} />}
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{lead.ownerName?.split(' ')[0]}</span>
        </div>
        <div className="flex gap-2 items-center">
            <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded-md group-hover:bg-primary/5 transition-colors">
                <span className={`w-1.5 h-1.5 rounded-full ${lead.score > 75 ? 'bg-green-500' : lead.score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                <span className="text-[9px] font-bold text-gray-500">{lead.score}</span>
            </div>
            <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <ChevronRight size={12} className="text-gray-300 group-hover:text-primary transition-colors" />
            </div>
        </div>
      </div>
    </div>
  );
};

interface PipelineColumnProps {
  status: LeadStatus;
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onCreateLead: (status: LeadStatus) => void;
}

const PipelineColumn: React.FC<PipelineColumnProps> = ({ status, leads, onSelectLead, onCreateLead }) => {
  const { updateLeadStatus } = useLeads();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      updateLeadStatus(leadId, status);
    }
    setIsDragOver(false);
  };



  return (
    <div
      className={`w-[260px] bg-[#F8FAFC]/50 rounded-2xl p-2 flex-shrink-0 h-full flex flex-col transition-all border border-transparent ${isDragOver ? 'bg-primary/5 border-primary/20 border-dashed' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex justify-between items-center p-4">
        <div className="flex flex-col">
          <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center mb-0.5">
            {status}
          </h2>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{leads.length} leads</span>
        </div>

      </div>
      <div className="overflow-y-auto px-2 flex-1 scrollbar-hide">
        {leads.map(lead => <LeadCard key={lead.id} lead={lead} onSelectLead={onSelectLead} />)}
        <div className="mt-2 mb-4">
          <button
            onClick={() => onCreateLead(status)}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-primary/20 hover:text-primary hover:bg-white transition-all group active:scale-[0.98]"
          >
            + Add Lead
          </button>
        </div>
      </div>
    </div>
  );
};

interface LeadsPipelineViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

const LeadsPipelineView: React.FC<LeadsPipelineViewProps> = ({ leads, onSelectLead }) => {
  const { openCreateLeadModal } = useUI();
  const { newLeadStatus, setNewLeadStatus } = useNewLead();

  const leadsByStatus = useMemo(() => {
    const grouped: { [key in LeadStatus]?: Lead[] } = {};
    for (const lead of leads) {
      if (PIPELINE_STAGES.includes(lead.status)) {
        if (!grouped[lead.status]) {
            grouped[lead.status] = [];
        }
        grouped[lead.status]!.push(lead);
      }
    }
    return grouped;
  }, [leads]);
  
  // Function to handle creating a new lead
  const handleCreateLead = (status: LeadStatus) => {
    setNewLeadStatus(status);
    openCreateLeadModal();
  };

  return (
    <div className="flex space-x-4 overflow-x-auto pb-4 h-full">
      {PIPELINE_STAGES.map(status => (
        <PipelineColumn
          key={status}
          status={status}
          leads={leadsByStatus[status] || []}
          onSelectLead={onSelectLead}
          onCreateLead={handleCreateLead}
        />
      ))}
    </div>
  );
};

export default LeadsPipelineView;
