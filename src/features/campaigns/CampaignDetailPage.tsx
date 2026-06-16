import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Clock, Users, Download, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useCampaignModule } from '../../contexts/CampaignModuleContext';
import Button from '@/components/ui/Button';

const CampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { campaigns, recipients, leads, sendCampaign } = useCampaignModule();
  const [activeTab, setActiveTab] = useState<'overview' | 'recipients' | 'leads'>('overview');

  const campaign = campaigns.find(c => c.id === id);

  if (!campaign) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Link to="/campaigns" className="p-2 rounded-full hover:bg-gray-100 mr-2">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-text-main">Campaign Not Found</h1>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">The campaign you're looking for doesn't exist or has been deleted.</p>
          <Button
            variant="primary"
            size="md"
            className="mt-4"
            as={Link}
            to="/campaigns"
          >
            Back to Campaigns
          </Button>
        </div>
      </div>
    );
  }

  // Filter recipients and leads for this campaign
  const campaignRecipients = recipients.filter(r => r.campaignId === campaign.id);
  const campaignLeads = leads.filter(l => l.campaignId === campaign.id);

  // Stats for overview
  const totalRecipients = campaignRecipients.length;
  const sentRecipients = campaignRecipients.filter(r => r.status === 'sent' || r.status === 'delivered' || r.status === 'read').length;
  const deliveredRecipients = campaignRecipients.filter(r => r.status === 'delivered' || r.status === 'read').length;
  const failedRecipients = campaignRecipients.filter(r => r.status === 'failed').length;
  const readRecipients = campaignRecipients.filter(r => r.status === 'read').length;

  const handleSendCampaign = () => {
    if (window.confirm(`You're about to send this campaign to ${totalRecipients} recipients. This action cannot be undone. Send now?`)) {
      sendCampaign(campaign.id);
      alert('Campaign sending started!');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link to="/campaigns" className="inline-flex items-center text-sm text-gray-500 hover:text-[#0079C1] mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Campaigns
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
      </div>

      {/* Campaign Status Banner */}
      <div className={`rounded-lg p-4 ${campaign.status === 'completed' ? 'bg-green-50 border border-green-200' :
          campaign.status === 'sending' ? 'bg-blue-50 border border-blue-200' :
            campaign.status === 'failed' ? 'bg-red-50 border border-red-200' :
              'bg-gray-50 border border-gray-200'
        }`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            {campaign.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-600 mr-2" />}
            {campaign.status === 'sending' && <Send className="w-5 h-5 text-blue-600 mr-2" />}
            {campaign.status === 'failed' && <XCircle className="w-5 h-5 text-red-600 mr-2" />}
            <span className="font-medium">
              Status: <span className="capitalize">{campaign.status.replace('_', ' ')}</span>
            </span>
          </div>
          {campaign.status === 'queued' && (
            <Button
              variant="primary"
              size="sm"
              className="mt-2 md:mt-0"
              onClick={handleSendCampaign}
            >
              Send Campaign
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('recipients')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'recipients'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Recipients <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">{totalRecipients}</span>
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'leads'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Leads <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">{campaignLeads.length}</span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Total Recipients</p>
              <p className="text-2xl font-bold text-gray-900">{totalRecipients}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Sent</p>
              <p className="text-2xl font-bold text-blue-600">{sentRecipients}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Delivered</p>
              <p className="text-2xl font-bold text-green-600">{deliveredRecipients}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Read</p>
              <p className="text-2xl font-bold text-purple-600">{readRecipients}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-2xl font-bold text-red-600">{failedRecipients}</p>
            </div>
          </div>

          {/* Campaign Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Message Type</p>
                <p className="font-medium">{campaign.messageType.charAt(0).toUpperCase() + campaign.messageType.slice(1)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Schedule</p>
                <p className="font-medium">
                  {campaign.scheduleAt
                    ? new Date(campaign.scheduleAt).toLocaleString()
                    : 'Immediate'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created By</p>
                <p className="font-medium">{campaign.createdBy}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="font-medium">{new Date(campaign.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {campaign.messageBody && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">Message Preview</p>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-800">{campaign.messageBody}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'recipients' && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recipients</h2>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              className="mt-2 md:mt-0"
            >
              Export CSV
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attempts
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaignRecipients.map((recipient) => (
                  <tr key={recipient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {recipient.contactId ? `Contact ${recipient.contactId}` : 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {recipient.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${recipient.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          recipient.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                            recipient.status === 'read' ? 'bg-purple-100 text-purple-800' :
                              recipient.status === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                        }`}>
                        {recipient.status.charAt(0).toUpperCase() + recipient.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {recipient.retries}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(recipient.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {campaignRecipients.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recipients found for this campaign</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'leads' && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Leads from Campaign</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message Snippet
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaignLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {lead.contactId ? `Contact ${lead.contactId}` : 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.messageSnippet || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                          lead.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                            lead.status === 'lost' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                        }`}>
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {campaignLeads.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No leads created from this campaign yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignDetailPage;
