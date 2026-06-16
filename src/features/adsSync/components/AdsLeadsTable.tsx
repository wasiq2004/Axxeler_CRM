import React from 'react';
import type { AdLead } from '../../../types';

interface AdsLeadsTableProps {
  adLeads: (AdLead & { isImported: boolean })[];
  selectedLeads: Set<string>;
  onToggleSelectAll: (isChecked: boolean) => void;
  onToggleSelectLead: (leadId: string) => void;
}

const AdsLeadsTable: React.FC<AdsLeadsTableProps> = ({ adLeads, selectedLeads, onToggleSelectAll, onToggleSelectLead }) => {
  const unimportedLeads = adLeads.filter(l => !l.isImported);
  const isAllSelected = unimportedLeads.length > 0 && unimportedLeads.every(lead => selectedLeads.has(lead.id));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input
                type="checkbox"
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                checked={isAllSelected}
                onChange={(e) => onToggleSelectAll(e.target.checked)}
                disabled={unimportedLeads.length === 0}
              />
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Time</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {adLeads.map((lead) => (
            <tr key={lead.id} className={`hover:bg-gray-50 ${lead.isImported ? 'bg-green-50' : ''}`}>
              <td className="px-6 py-4 whitespace-nowrap">
                 <input
                    type="checkbox"
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    checked={selectedLeads.has(lead.id)}
                    onChange={() => onToggleSelectLead(lead.id)}
                    disabled={lead.isImported}
                 />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.field_data.full_name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.field_data.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.field_data.phone_number || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.field_data.company_name || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.campaign_name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.ad_name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(lead.created_time).toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {lead.isImported ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Imported
                    </span>
                ) : (
                     <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Pending
                    </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdsLeadsTable;
