import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Lead, LeadStatus } from '../../../types';
import { ChevronsUpDown, ChevronUp, ChevronDown, MoreHorizontal, Edit, Trash2, Eye, X, ChevronDown as StatusIcon, Loader2 } from 'lucide-react';
import { useUI } from '../../../contexts/UIContext';
import { useLeads } from '../../../contexts/LeadsContext';
import { useApi } from '../../../contexts/ApiContext';

interface LeadsTableProps {
  leads: Lead[];
  requestSort: (key: keyof Lead) => void;
  sortConfig: { key: keyof Lead; direction: 'ascending' | 'descending' } | null;
}

const statusColors: Record<LeadStatus, string> = {
  'New': 'bg-blue-100 text-blue-800',
  'Contacted': 'bg-yellow-100 text-yellow-800',
  'Proposal': 'bg-orange-100 text-orange-800',
  'Negotiation': 'bg-indigo-100 text-indigo-800',
  'Closed - Won': 'bg-purple-100 text-purple-800',
  'Lost': 'bg-red-100 text-red-800',
  'Qualified': 'bg-green-100 text-green-800',
};

const ALL_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed - Won', 'Lost'];

const LeadsTable: React.FC<LeadsTableProps> = ({ leads, requestSort, sortConfig }) => {
  const { openEditLeadModal } = useUI();
  const { deleteLead, refresh } = useLeads();
  const { crmApi } = useApi();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showActions, setShowActions] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const getSortIcon = (key: keyof Lead) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronsUpDown className="w-4 h-4 ml-1 opacity-40" />;
    return sortConfig.direction === 'ascending' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />;
  };

  const handleEditClick = (lead: Lead) => {
    setSelectedLead(lead);
    openEditLeadModal();
    setShowActions(null);
  };

  const handleDeleteClick = (lead: Lead) => {
    if (window.confirm(`Delete lead ${lead.firstName} ${lead.lastName}?`)) {
      deleteLead(lead.id);
      setSelectedIds(prev => { const next = new Set(prev); next.delete(lead.id); return next; });
    }
    setShowActions(null);
  };

  const allSelected = leads.length > 0 && leads.every(l => selectedIds.has(l.id));
  const someSelected = selectedIds.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map(l => l.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!window.confirm(`Delete ${ids.length} lead(s)? This cannot be undone.`)) return;
    setBulkLoading(true);
    try {
      await crmApi.bulkDeleteLeads(ids);
      await refresh();
      clearSelection();
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkStatus = async (status: LeadStatus) => {
    const ids = Array.from(selectedIds);
    setBulkLoading(true);
    setShowStatusMenu(false);
    try {
      await crmApi.bulkUpdateLeadStatus(ids, status);
      await refresh();
      clearSelection();
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 relative">
      {/* Bulk Action Bar */}
      {someSelected && (
        <div className="sticky top-0 z-20 bg-primary text-white px-4 py-2.5 flex items-center gap-3 text-sm font-semibold shadow-md">
          {bulkLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <span className="bg-white/20 px-2 py-0.5 rounded-md text-xs font-black">{selectedIds.size}</span>
          )}
          <span className="flex-1">{selectedIds.size} lead{selectedIds.size > 1 ? 's' : ''} selected</span>
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(v => !v)}
              disabled={bulkLoading}
              className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold disabled:opacity-50"
            >
              Change Status <StatusIcon className="w-3 h-3" />
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white text-gray-900 rounded-xl shadow-xl border border-gray-100 z-30 py-1 overflow-hidden">
                {ALL_STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => handleBulkStatus(s)}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs font-semibold hover:bg-gray-50 transition-colors"
                  >
                    <span className={`w-2 h-2 rounded-full ${statusColors[s].split(' ')[0]}`} />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleBulkDelete}
            disabled={bulkLoading}
            className="flex items-center gap-1 bg-red-500/80 hover:bg-red-500 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold disabled:opacity-50"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
          <button onClick={clearSelection} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 sm:px-6 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
              />
            </th>
            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button onClick={() => requestSort('firstName')} className="flex items-center hover:text-gray-700">Lead Name {getSortIcon('firstName')}</button>
            </th>
            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              <button onClick={() => requestSort('company')} className="flex items-center hover:text-gray-700">Company {getSortIcon('company')}</button>
            </th>
            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
              <button onClick={() => requestSort('email')} className="flex items-center hover:text-gray-700">Email {getSortIcon('email')}</button>
            </th>
            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button onClick={() => requestSort('status')} className="flex items-center hover:text-gray-700">Status {getSortIcon('status')}</button>
            </th>
            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              <button onClick={() => requestSort('ownerName')} className="flex items-center hover:text-gray-700">Owner {getSortIcon('ownerName')}</button>
            </th>
            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className={`hover:bg-gray-50 transition-colors ${selectedIds.has(lead.id) ? 'bg-primary/5' : ''}`}
            >
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedIds.has(lead.id)}
                  onChange={() => toggleOne(lead.id)}
                  onClick={e => e.stopPropagation()}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                />
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <Link to={`/leads/${lead.id}`} className="text-sm font-medium text-primary hover:underline">
                  {lead.firstName} {lead.lastName}
                </Link>
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{lead.company}</td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">{lead.email}</td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[lead.status]}`}>
                  {lead.status}
                </span>
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                <div className="flex items-center">
                  <img className="h-8 w-8 rounded-full" src={lead.ownerAvatar} alt={lead.ownerName} />
                  <div className="ml-3 text-sm text-gray-900 hidden lg:block">{lead.ownerName}</div>
                </div>
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="relative">
                  <button
                    onClick={() => setShowActions(showActions === lead.id ? null : lead.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  {showActions === lead.id && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1" role="menu">
                        <Link
                          to={`/leads/${lead.id}`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Link>
                        <button
                          onClick={() => handleEditClick(lead)}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(lead)}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          role="menuitem"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeadsTable;
