import React, { useState } from 'react';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

interface LeadForm {
  id: string;
  name: string;
  locale: string;
  created_time: string;
  last_updated_time: string;
  leads_count: number;
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
}

interface LeadFormLead {
  id: string;
  created_time: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
  ad_id: string;
  ad_name: string;
  campaign_id: string;
  campaign_name: string;
}

interface LeadFormsTableProps {
  leadForms: LeadForm[];
  onFetchLeads: (formId: string) => void;
  isFetchingLeads: boolean;
  selectedFormId: string | null;
  leads: LeadFormLead[];
  onImportLeads: (leads: LeadFormLead[]) => void;
  onBack: () => void;
}

const LeadFormsTable: React.FC<LeadFormsTableProps> = ({ 
  leadForms, 
  onFetchLeads, 
  isFetchingLeads, 
  selectedFormId,
  leads,
  onImportLeads,
  onBack
}) => {
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  const handleToggleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedLeads(new Set(leads.map(lead => lead.id)));
    } else {
      setSelectedLeads(new Set());
    }
  };

  const handleToggleSelectLead = (leadId: string) => {
    const newSelection = new Set(selectedLeads);
    if (newSelection.has(leadId)) {
      newSelection.delete(leadId);
    } else {
      newSelection.add(leadId);
    }
    setSelectedLeads(newSelection);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'ARCHIVED':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderLeadForms = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="mb-2"
        >
          ← Back to Campaigns
        </Button>
        <h2 className="text-xl font-semibold text-text-main">Lead Forms</h2>
        <p className="text-sm text-gray-500 mt-1">
          Select a lead form to view and import leads
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Locale</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leads</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leadForms.map((form) => (
              <tr key={form.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{form.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(form.status)}`}>
                    {form.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{form.locale}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{form.leads_count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(form.last_updated_time).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onFetchLeads(form.id)}
                    disabled={isFetchingLeads}
                  >
                    {isFetchingLeads && selectedFormId === form.id ? 'Loading...' : 'View Leads'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {leadForms.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No lead forms found</p>
        </div>
      )}
    </div>
  );

  const renderLeads = () => {
    const selectedLeadsData = leads.filter(lead => selectedLeads.has(lead.id));
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="mb-2"
          >
            ← Back to Forms
          </Button>
          <h2 className="text-xl font-semibold text-text-main">
            Leads ({leads.length})
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Select leads to import into your CRM
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    checked={selectedLeads.size > 0 && selectedLeads.size === leads.length}
                    onChange={(e) => handleToggleSelectAll(e.target.checked)}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead) => {
                // Extract field data
                const fullName = lead.field_data.find(field => field.name === 'full_name')?.values[0] || 'N/A';
                const email = lead.field_data.find(field => field.name === 'email')?.values[0] || 'N/A';
                const phone = lead.field_data.find(field => field.name === 'phone_number')?.values[0] || 'N/A';
                const company = lead.field_data.find(field => field.name === 'company_name')?.values[0] || 'N/A';
                
                return (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                        checked={selectedLeads.has(lead.id)}
                        onChange={() => handleToggleSelectLead(lead.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(lead.created_time).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {leads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No leads found for this form</p>
          </div>
        )}
        
        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedLeads.size} of {leads.length} leads selected
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => onImportLeads(selectedLeadsData)}
            disabled={selectedLeads.size === 0}
          >
            Import Selected Leads ({selectedLeads.size})
          </Button>
        </div>
      </div>
    );
  };

  return selectedFormId && leads.length > 0 ? renderLeads() : renderLeadForms();
};

export default LeadFormsTable;
