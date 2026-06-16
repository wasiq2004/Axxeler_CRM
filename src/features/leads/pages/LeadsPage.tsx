import React, { useState, useMemo } from 'react';
import { Plus, Search, List, LayoutGrid } from 'lucide-react';
import Button from '@/components/ui/Button';
import LeadsTable from '@/features/leads/components/LeadsTable';
import LeadsPipelineView, { NewLeadProvider } from '@/features/leads/components/LeadsPipelineView';
import EditLeadModal from '@/features/leads/components/EditLeadModal';
import CreateLeadModal from '@/features/leads/components/CreateLeadModal';
import { useLeads } from '@/contexts/LeadsContext';
import { useUI } from '@/contexts/UIContext';
import { Lead, LeadStatus } from '@/types';

const LeadsPage: React.FC = () => {
  const { leads } = useLeads();
  const { isEditLeadModalOpen, isCreateLeadModalOpen, openCreateLeadModal } = useUI();
  const [view, setView] = useState<'pipeline' | 'table'>('pipeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Lead; direction: 'ascending' | 'descending' } | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newLeadStatus, setNewLeadStatus] = useState<LeadStatus | null>(null);

  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads;
    const lowercasedQuery = searchQuery.toLowerCase();
    return leads.filter(lead =>
      lead.firstName.toLowerCase().includes(lowercasedQuery) ||
      lead.lastName.toLowerCase().includes(lowercasedQuery) ||
      lead.company.toLowerCase().includes(lowercasedQuery) ||
      lead.email.toLowerCase().includes(lowercasedQuery)
    );
  }, [leads, searchQuery]);

  const sortedLeads = useMemo(() => {
    let sortableLeads = [...filteredLeads];
    if (sortConfig !== null) {
      sortableLeads.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableLeads;
  }, [filteredLeads, sortConfig]);

  const requestSort = (key: keyof Lead) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const newLeadContextValue = {
    newLeadStatus,
    setNewLeadStatus
  };

  return (
    <div className="space-y-6 flex flex-col h-full animate-fadeIn">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            Leads <span className="text-primary/50 text-sm font-bold ml-1">{leads.length}</span>
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full sm:w-64 bg-white border border-gray-100 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all placeholder:text-gray-400"
            />
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-gray-50 rounded-xl border border-gray-100 shadow-inner">
            <button
              onClick={() => setView('pipeline')}
              className={`p-2 px-3 rounded-lg transition-all flex items-center gap-1.5 ${view === 'pipeline' ? 'bg-white shadow-sm text-gray-900 border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Pipeline</span>
            </button>
            <button
              onClick={() => setView('table')}
              className={`p-2 px-3 rounded-lg transition-all flex items-center gap-1.5 ${view === 'table' ? 'bg-white shadow-sm text-gray-900 border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">List</span>
            </button>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={openCreateLeadModal}
            className="!bg-gray-900 hover:!bg-black !text-white !font-black text-xs uppercase tracking-widest !rounded-xl shadow-lg shadow-gray-200 transform active:scale-95 transition-all w-full sm:w-auto"
          >
            Add Lead
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden min-h-[600px]">
        {view === 'pipeline' ? (
          <NewLeadProvider value={newLeadContextValue}>
            <LeadsPipelineView leads={filteredLeads} onSelectLead={handleSelectLead} />
          </NewLeadProvider>
        ) : (
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100/80 h-full overflow-hidden">
            <LeadsTable leads={sortedLeads} requestSort={requestSort} sortConfig={sortConfig} />
          </div>
        )}
      </div>
      {isEditLeadModalOpen && <EditLeadModal lead={selectedLead} />}
      {isCreateLeadModalOpen && <CreateLeadModal defaultStatus={newLeadStatus || undefined} />}
    </div>
  );
};

export default LeadsPage;
