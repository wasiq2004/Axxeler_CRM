import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal, GripVertical, DollarSign, Edit, Eye, Trash2, Plus, ChevronRight } from 'lucide-react';
import type { Deal, DealStage } from '../../types';
import { useDeals } from '../../contexts/DealsContext';
import { useUsers } from '../../contexts/UsersContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { DEAL_STAGES } from '../../constants';
import EditDealModal from './components/EditDealModal';
import Button from '@/components/ui/Button';

const DealCard: React.FC<{ deal: Deal; onSelectDeal: (deal: Deal) => void }> = ({ deal, onSelectDeal }) => {
  const { users } = useUsers();
  const { currency, formatCurrency } = useCurrency();
  const { deleteDeal } = useDeals();
  const { openEditDealModal } = useUI();
  const [showActions, setShowActions] = useState(false);
  const owner = users[deal.ownerId];

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('dealId', deal.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectDeal(deal);
    openEditDealModal();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the deal "${deal.name}"?`)) {
      deleteDeal(deal.id);
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
        <div className="flex flex-col">
          <span className="font-bold text-sm text-gray-900 leading-tight group-hover:text-primary transition-colors">{deal.name}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{deal.accountName}</span>
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
                  to={`/deals/${deal.id}`}
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
                  Remove Deal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-1 mt-auto">
        <span className="text-[10px] font-bold text-primary opacity-50">{currency.symbol}</span>
        <span className="text-lg font-black text-gray-900 tracking-tight">
          {Number(deal.value).toLocaleString()}
        </span>
      </div>

      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all opacity-60 group-hover:opacity-100">
          {owner && <img src={owner.avatar} alt={owner.name} className="w-5 h-5 rounded-full ring-2 ring-white ring-offset-1 border border-gray-100" title={owner.name} />}
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{owner?.name.split(' ')[0]}</span>
        </div>
        <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <ChevronRight size={12} className="text-gray-300 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </div>
  );
};

const DealColumn: React.FC<{ stage: DealStage; deals: Deal[]; onSelectDeal: (deal: Deal) => void; onCreateDeal: (stage: DealStage) => void }> = ({ stage, deals, onSelectDeal, onCreateDeal }) => {
  const { updateDealStage } = useDeals();
  const { currency } = useCurrency();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    if (dealId) {
      updateDealStage(dealId, stage);
    }
    setIsDragOver(false);
  };

  const totalValue = useMemo(() => deals.reduce((sum, deal) => sum + Number(deal.value), 0), [deals]);

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
            {stage}
          </h2>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{deals.length} active deals</span>
        </div>
        <div className="px-3 py-1 bg-white border border-gray-100 rounded-full shadow-sm">
          <span className="text-xs font-black text-gray-900 tracking-tight">{currency.symbol}{totalValue.toLocaleString()}</span>
        </div>
      </div>
      <div className="overflow-y-auto px-2 flex-1 scrollbar-hide">
        {deals.map(deal => <DealCard key={deal.id} deal={deal} onSelectDeal={onSelectDeal} />)}
        <div className="mt-2 mb-4">
          <button
            onClick={() => onCreateDeal(stage)}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-primary/20 hover:text-primary hover:bg-white transition-all group active:scale-[0.98]"
          >
            + Add Opportunity
          </button>
        </div>
      </div>
    </div>
  );
};

const DealsPage: React.FC = () => {
  const { deals } = useDeals();
  const { users } = useUsers();
  const { user } = useAuth();
  const { isEditDealModalOpen, isCreateDealModalOpen, openCreateLeadModal, openCreateDealModal, closeCreateDealModal } = useUI();
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [newDealStage, setNewDealStage] = useState<DealStage | null>(null);

  const dealsByStage = useMemo(() => {
    const grouped: { [key in DealStage]?: Deal[] } = {};
    for (const deal of deals) {
      if (!grouped[deal.stage]) {
        grouped[deal.stage] = [];
      }
      grouped[deal.stage]!.push(deal);
    }
    return grouped;
  }, [deals]);

  const handleSelectDeal = (deal: Deal) => {
    setSelectedDeal(deal);
  };

  const handleCreateDeal = (stage: DealStage) => {
    setNewDealStage(stage);
    openCreateDealModal();
  };

  return (
    <div className="space-y-6 flex flex-col h-full animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Sales Pipeline</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => {
              setNewDealStage('Prospecting');
              openCreateDealModal();
            }}
            className="bg-gray-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-gray-200"
          >
            Create Deal
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden min-h-[600px]">
        <div className="flex space-x-6 overflow-x-auto pb-8 h-full scrollbar-hide">
          {DEAL_STAGES.map(stage => (
            <DealColumn
              key={stage}
              stage={stage}
              deals={dealsByStage[stage] || []}
              onSelectDeal={handleSelectDeal}
              onCreateDeal={handleCreateDeal}
            />
          ))}
        </div>
      </div>
      {isEditDealModalOpen && selectedDeal && <EditDealModal deal={selectedDeal} />}
      {isCreateDealModalOpen && !selectedDeal && newDealStage && (
        <EditDealModal
          defaultStage={newDealStage}
          defaultOwnerId={user?.id || ''}
        />
      )}
    </div>
  );
};

export default DealsPage;
