import React from 'react';
import { Plus, Search, List, LayoutGrid } from 'lucide-react';
import { useUI } from '../../../contexts/UIContext';
import Button from '@/components/ui/Button';

interface LeadsToolbarProps {
  activeView: 'pipeline' | 'table';
  setActiveView: (view: 'pipeline' | 'table') => void;
  onSearch: (query: string) => void;
}

const LeadsToolbar: React.FC<LeadsToolbarProps> = ({ activeView, setActiveView, onSearch }) => {
  const { openCreateLeadModal } = useUI();

  const baseButtonClass = "px-3 py-2 text-text-light hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary";
  const activeButtonClass = "bg-gray-200 text-primary";

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-text-main">Leads Pipeline</h1>
        <p className="text-text-light mt-1">Visualize and track your sales opportunities.</p>
      </div>
      <div className="flex items-center space-x-2 w-full sm:w-auto">
        <div className="relative flex-grow sm:flex-grow-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search leads..."
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full sm:w-48 md:w-64 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <Button
          onClick={openCreateLeadModal}
          variant="primary"
          size="md"
          icon={Plus}
          iconPosition="left"
          responsive
        >
          Add Lead
        </Button>
        <div className="flex items-center border border-gray-300 rounded-md">
            <button 
              onClick={() => setActiveView('pipeline')}
              className={`${baseButtonClass} rounded-l-md ${activeView === 'pipeline' ? activeButtonClass : ''}`} 
              aria-label="Grid view"
              aria-pressed={activeView === 'pipeline'}
            >
                <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveView('table')}
              className={`${baseButtonClass} rounded-r-md border-l border-gray-300 ${activeView === 'table' ? activeButtonClass : ''}`} 
              aria-label="List view"
              aria-pressed={activeView === 'table'}
            >
                <List className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default LeadsToolbar;
