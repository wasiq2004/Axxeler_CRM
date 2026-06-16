import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Download, LogOut, Facebook, Users, LayoutDashboard,
  List, ChevronRight, Search, Filter, AlertCircle, CheckCircle2,
  Loader2, FileText, Zap, ArrowLeft, Copy, Eye, EyeOff,
} from 'lucide-react';
import { useMetaAccount, MetaCampaign, MetaPage, MetaLeadForm, MetaFormLead } from '../../contexts/MetaAccountContext';
import { useLeads } from '../../contexts/LeadsContext';
import MetaOAuthButton from './components/MetaOAuthButton';
import AdsOverview from './components/AdsOverview';
import { useSearchParams } from 'react-router-dom';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getField = (lead: MetaFormLead, name: string) =>
  lead.field_data.find(f => f.name === name)?.values?.[0] || '';

const statusColor = (s: string) =>
  s === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200'
    : s === 'PAUSED' ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
      : 'bg-gray-50 text-gray-600 border-gray-200';

// ─── Sub-components ───────────────────────────────────────────────────────────

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg z-50 animate-slideUp ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
    {type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
    <span className="text-sm font-medium">{message}</span>
    <button onClick={onClose} className="ml-2 text-white/70 hover:text-white">✕</button>
  </div>
);

// ─── Connect Screen ───────────────────────────────────────────────────────────

const ConnectScreen: React.FC<{ error?: string | null }> = ({ error }) => {
  const { connectWithToken, isLoading } = useMetaAccount();
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const handleTokenConnect = async () => {
    if (!token.trim()) { setTokenError('Please enter an access token'); return; }
    setTokenError('');
    try {
      await connectWithToken(token.trim());
    } catch (err) {
      setTokenError(err instanceof Error ? err.message : 'Invalid token');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 animate-fadeIn">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-0 bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Left hero */}
        <div className="bg-gradient-to-br from-[#1877F2] to-[#0d47a1] p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-black opacity-10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <Facebook className="w-10 h-10 mb-4 opacity-90" />
            <h2 className="text-3xl font-extrabold mb-3">Meta Ads → CRM</h2>
            <p className="text-blue-100 text-base leading-relaxed">
              Connect your Meta Ads account to automatically sync leads from Lead Ad forms directly into your CRM pipeline.
            </p>
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-4 mt-10">
            {[
              { icon: <Zap className="w-6 h-6 mb-1 opacity-80" />, stat: 'Real-time', label: 'Webhook Sync' },
              { icon: <Users className="w-6 h-6 mb-1 opacity-80" />, stat: 'Instant', label: 'Lead Import' },
            ].map(item => (
              <div key={item.label} className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                {item.icon}
                <div className="text-xl font-bold">{item.stat}</div>
                <div className="text-xs text-blue-200 mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right form */}
        <div className="p-12 flex flex-col justify-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Account</h3>
          <p className="text-gray-500 text-sm mb-8">Choose a connection method below.</p>

          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            {/* Meta OAuth */}
            <MetaOAuthButton
              onConnectError={(e) => console.error(e)}
            />

            <div className="relative flex items-center gap-3 my-4">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400 shrink-0">OR</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            {/* Manual token input */}
            {!showTokenInput ? (
              <button
                onClick={() => setShowTokenInput(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-all"
              >
                <Copy className="w-4 h-4" />
                Paste Access Token manually
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">
                  Generate a <strong>System User Access Token</strong> or <strong>Page Access Token</strong> in{' '}
                  <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Meta Business Manager</a>. Requires <code>ads_read</code> + <code>leads_retrieval</code> permissions.
                </p>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    placeholder="EAABwzLixnjY..."
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {tokenError && <p className="text-xs text-red-600">{tokenError}</p>}
                <button
                  onClick={handleTokenConnect}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-all"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isLoading ? 'Validating…' : 'Connect with Token'}
                </button>
                <button onClick={() => setShowTokenInput(false)} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">
                  Cancel
                </button>
              </div>
            )}
          </div>

          <p className="mt-8 text-xs text-center text-gray-400">
            Leads from your Meta Lead Ad forms will automatically appear in CRM Leads after import.
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Leads Panel (Pages → Forms → Leads) ──────────────────────────────────────

const LeadsPanel: React.FC<{ onImported: (count: number) => void }> = ({ onImported }) => {
  const { fetchPages, fetchLeadForms, fetchFormLeads, importLeads, isLoading } = useMetaAccount();

  const [pages, setPages] = useState<MetaPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<MetaPage | null>(null);
  const [forms, setForms] = useState<MetaLeadForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<MetaLeadForm | null>(null);
  const [formLeads, setFormLeads] = useState<MetaFormLead[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<'pages' | 'forms' | 'leads'>('pages');

  useEffect(() => {
    fetchPages().then(setPages).catch(console.error);
  }, []);

  const handleSelectPage = async (page: MetaPage) => {
    setSelectedPage(page);
    setStep('forms');
    const fs = await fetchLeadForms(page.id, page.access_token);
    setForms(fs);
  };

  const handleSelectForm = async (form: MetaLeadForm) => {
    setSelectedForm(form);
    setStep('leads');
    const leads = await fetchFormLeads(form.id);
    setFormLeads(leads);
    setSelected(new Set(leads.map(l => l.id)));
  };

  const handleImport = async () => {
    const toImport = formLeads.filter(l => selected.has(l.id));
    if (!toImport.length) return;
    setImporting(true);
    try {
      const imported = await importLeads(toImport);
      onImported(imported.length);
      setSelected(new Set());
    } finally {
      setImporting(false);
    }
  };

  const toggleLead = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  if (step === 'pages') return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Select a Facebook Page</h3>
        <p className="text-xs text-gray-500 mt-1">Choose the page whose Lead Ad forms you want to import from.</p>
      </div>
      {isLoading ? (
        <div className="py-16 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : pages.length === 0 ? (
        <div className="py-16 text-center text-gray-500">
          <Facebook className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium">No Facebook pages found</p>
          <p className="text-xs text-gray-400 mt-1">Make sure your Meta account manages at least one page with Lead Ads.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {pages.map(page => (
            <li key={page.id}>
              <button
                onClick={() => handleSelectPage(page)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-blue-50/40 transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                    {page.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-primary">{page.name}</p>
                    <p className="text-xs text-gray-400">{page.category}{page.fan_count ? ` · ${page.fan_count.toLocaleString()} fans` : ''}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  if (step === 'forms') return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-5 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => setStep('pages')} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </button>
        <div>
          <h3 className="font-semibold text-gray-900">Lead Forms · {selectedPage?.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">Select a form to view and import its leads.</p>
        </div>
      </div>
      {isLoading ? (
        <div className="py-16 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : forms.length === 0 ? (
        <div className="py-16 text-center text-gray-500">
          <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium">No lead forms found</p>
          <p className="text-xs text-gray-400 mt-1">Create a Lead Ad in Meta Ads Manager first.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {forms.map(form => (
            <li key={form.id}>
              <button
                onClick={() => handleSelectForm(form)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-blue-50/40 transition-colors group text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-primary">{form.name}</p>
                  <p className="text-xs text-gray-400">
                    {form.leads_count} lead{form.leads_count !== 1 ? 's' : ''} · Created {new Date(form.created_time).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${form.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                    {form.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // step === 'leads'
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => { setStep('forms'); setFormLeads([]); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div>
            <h3 className="font-semibold text-gray-900">{selectedForm?.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{formLeads.length} leads · {selected.size} selected</p>
          </div>
        </div>
        <button
          onClick={handleImport}
          disabled={importing || selected.size === 0}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-all"
        >
          {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {importing ? 'Importing…' : `Import ${selected.size} Lead${selected.size !== 1 ? 's' : ''} to CRM`}
        </button>
      </div>
      {isLoading ? (
        <div className="py-16 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : formLeads.length === 0 ? (
        <div className="py-16 text-center text-gray-500">
          <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium">No leads yet</p>
          <p className="text-xs text-gray-400 mt-1">Leads will appear here once people fill out your ad form.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === formLeads.length}
                    onChange={e => setSelected(e.target.checked ? new Set(formLeads.map(l => l.id)) : new Set())}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Campaign</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {formLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(lead.id)}
                      onChange={() => toggleLead(lead.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {getField(lead, 'full_name') || getField(lead, 'name') || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {getField(lead, 'email') || getField(lead, 'email_address') || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {getField(lead, 'phone_number') || getField(lead, 'phone') || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{lead.campaign_name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(lead.created_time).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const AdsSyncPage: React.FC = () => {
  const {
    connection, adAccounts, isConnected, isLoading, error,
    fetchAdAccounts, fetchCampaigns, disconnect, refresh,
  } = useMetaAccount();

  const { refresh: refreshLeads } = useLeads();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'leads'>('leads');
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignStatus, setCampaignStatus] = useState('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Handle OAuth callback query params
  useEffect(() => {
    const connected = searchParams.get('meta_connected');
    const oauthError = searchParams.get('meta_error');

    if (connected === '1') {
      setSearchParams({}, { replace: true });
      refresh().then(() => {
        showToast('Meta account connected successfully!', 'success');
      });
    } else if (oauthError) {
      setSearchParams({}, { replace: true });
      showToast(decodeURIComponent(oauthError), 'error');
    }
  }, []);

  // Load ad accounts + campaigns when connected
  useEffect(() => {
    if (!isConnected) return;
    fetchAdAccounts().then(accounts => {
      if (accounts.length > 0) {
        fetchCampaigns(accounts[0].id).then(setCampaigns).catch(console.error);
      }
    }).catch(console.error);
  }, [isConnected]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect your Meta account?')) return;
    try {
      await disconnect();
      setCampaigns([]);
    } catch {
      showToast('Failed to disconnect', 'error');
    }
  };

  const handleRefreshCampaigns = async () => {
    if (adAccounts.length === 0) return;
    try {
      const c = await fetchCampaigns(adAccounts[0].id);
      setCampaigns(c);
      showToast('Campaigns refreshed', 'success');
    } catch {
      showToast('Failed to refresh campaigns', 'error');
    }
  };

  const handleLeadsImported = async (count: number) => {
    showToast(`${count} lead${count !== 1 ? 's' : ''} imported to CRM`, 'success');
    await refreshLeads();
  };

  const oauthError = searchParams.get('meta_error');

  if (!isConnected) {
    return <ConnectScreen error={oauthError ? decodeURIComponent(oauthError) : error} />;
  }

  const filteredCampaigns = campaigns.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(campaignSearch.toLowerCase());
    const matchStatus = campaignStatus === 'all' || c.status === campaignStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Facebook className="w-6 h-6 text-[#1877F2]" />
            Meta Ads Sync
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <p className="text-sm text-gray-500">
              Connected as <span className="font-semibold text-gray-700">{connection?.name}</span>
              {connection?.lastSynced && (
                <span className="text-gray-400"> · Last synced {new Date(connection.lastSynced).toLocaleString()}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefreshCampaigns}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Sync
          </button>
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-2 px-3 py-2 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          {([
            { id: 'leads', label: 'Import Leads', icon: <Users className="w-4 h-4" /> },
            { id: 'campaigns', label: 'Campaigns', icon: <List className="w-4 h-4" />, badge: campaigns.length },
            { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
              {'badge' in tab && tab.badge > 0 && (
                <span className="ml-1 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{tab.badge}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
            <Zap className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Real-time webhook sync is active</p>
              <p className="text-xs text-blue-600 mt-0.5">
                New leads from your Meta Lead Ad forms are automatically added to the CRM when submitted. Use the form browser below to manually import existing leads.
              </p>
            </div>
          </div>
          <LeadsPanel onImported={handleLeadsImported} />
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                placeholder="Search campaigns…"
                value={campaignSearch}
                onChange={e => setCampaignSearch(e.target.value)}
                className="pl-9 pr-3 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={campaignStatus}
                onChange={e => setCampaignStatus(e.target.value)}
                className="bg-transparent text-sm text-gray-700 focus:outline-none border-none"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Campaign', 'Status', 'Leads / Clicks', 'Spend', 'Impressions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-gray-400 text-sm">
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'No campaigns found'}
                    </td>
                  </tr>
                ) : filteredCampaigns.map(c => (
                  <tr key={c.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{c.objective?.replace(/_/g, ' ').toLowerCase()}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${statusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <span className="font-semibold text-gray-900">{(c.leads_count || 0).toLocaleString()}</span>
                      <span className="text-gray-400"> / {(c.clicks || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-700">${(c.spend || 0).toFixed(2)}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{(c.impressions || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'overview' && <AdsOverview campaigns={campaigns} />}
    </div>
  );
};

export default AdsSyncPage;
