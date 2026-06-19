import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertCircle, Loader2, Link2, Link2Off, RefreshCw, Table2, ChevronDown, Copy, Check, ExternalLink } from 'lucide-react';
import { useApi } from '@/contexts/ApiContext';
import Button from '@/components/ui/Button';
import { getServerOrigin } from '@/api/serverOrigin';

interface GoogleConnection {
  connected: boolean;
  email?: string;
  name?: string;
}

interface Spreadsheet {
  id: string;
  name: string;
}

interface SyncConfig {
  id: string;
  entityType: string;
  spreadsheetId: string;
  spreadsheetName: string;
  sheetName: string;
  isActive: boolean;
  lastSyncedAt: string | null;
  webhookToken: string;
}

const APPS_SCRIPT_TEMPLATE = (webhookUrl: string) => `// Paste this script in your Google Sheet via Extensions → Apps Script
// Then set up an onEdit trigger: Triggers → Add Trigger → onSheetEdit → On edit

function onSheetEdit(e) {
  if (!e) return;
  var sheet = e.source.getActiveSheet();
  var range = e.range;
  var row = range.getRow();
  if (row <= 1) return; // Skip header row

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

  var data = {};
  headers.forEach(function(h, i) {
    if (h) data[String(h)] = String(values[i] || '');
  });

  try {
    UrlFetchApp.fetch('${webhookUrl}', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ row: row, data: data }),
      muteHttpExceptions: true
    });
  } catch(err) {
    Logger.log('Webhook error: ' + err);
  }
}`;

const SyncCard: React.FC<{
  entityType: 'leads' | 'contacts';
  label: string;
  config: SyncConfig | null;
  spreadsheets: Spreadsheet[];
  onSave: (entityType: string, data: any) => Promise<void>;
  onSyncNow: (entityType: string) => Promise<void>;
  onDisable: (entityType: string) => Promise<void>;
  serverOrigin: string;
}> = ({ entityType, label, config, spreadsheets, onSave, onSyncNow, onDisable, serverOrigin }) => {
  const { crmApi } = useApi();
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState(config?.spreadsheetId || '');
  const [selectedSpreadsheetName, setSelectedSpreadsheetName] = useState(config?.spreadsheetName || '');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState(config?.sheetName || 'Sheet1');
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [showScript, setShowScript] = useState(false);

  const webhookUrl = config
    ? `${serverOrigin}/api/google/sheet-webhook?token=${config.webhookToken}`
    : '';
  const appsScript = webhookUrl ? APPS_SCRIPT_TEMPLATE(webhookUrl) : '';

  useEffect(() => {
    if (config?.spreadsheetId) {
      setSelectedSpreadsheet(config.spreadsheetId);
      setSelectedSpreadsheetName(config.spreadsheetName);
      setSelectedSheet(config.sheetName);
      loadSheets(config.spreadsheetId);
    }
  }, [config]);

  const loadSheets = async (spreadsheetId: string) => {
    if (!spreadsheetId) return;
    setLoadingSheets(true);
    try {
      const res = await crmApi.getGoogleSheetNames(spreadsheetId);
      setSheetNames(res.data || []);
    } finally {
      setLoadingSheets(false);
    }
  };

  const handleSpreadsheetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const name = spreadsheets.find(s => s.id === id)?.name || '';
    setSelectedSpreadsheet(id);
    setSelectedSpreadsheetName(name);
    setSelectedSheet('Sheet1');
    setSheetNames([]);
    if (id) loadSheets(id);
  };

  const handleSave = async () => {
    if (!selectedSpreadsheet) return;
    setSaving(true);
    try {
      await onSave(entityType, {
        spreadsheetId: selectedSpreadsheet,
        spreadsheetName: selectedSpreadsheetName,
        sheetName: selectedSheet,
        isActive: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await onSyncNow(entityType);
    } finally {
      setSyncing(false);
    }
  };

  const copyScript = () => {
    navigator.clipboard.writeText(appsScript);
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 2000);
  };

  const isConfigured = !!config && config.isActive;

  return (
    <div className="border border-gray-100 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isConfigured ? 'bg-green-50' : 'bg-gray-50'}`}>
            <Table2 className={`w-5 h-5 ${isConfigured ? 'text-green-600' : 'text-gray-400'}`} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{label}</h3>
            {isConfigured ? (
              <p className="text-xs text-green-600 font-semibold">
                Syncing to "{config.spreadsheetName}" → {config.sheetName}
                {config.lastSyncedAt && ` · Last synced ${new Date(config.lastSyncedAt).toLocaleString()}`}
              </p>
            ) : (
              <p className="text-xs text-gray-400">Not configured</p>
            )}
          </div>
        </div>
        {isConfigured && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={syncing ? Loader2 : RefreshCw}
              onClick={handleSyncNow}
              disabled={syncing}
              className="!text-xs !rounded-xl"
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDisable(entityType)}
              className="!text-xs !rounded-xl !text-red-500 !border-red-100 hover:!bg-red-50"
            >
              Disable
            </Button>
          </div>
        )}
      </div>

      {/* Config form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Spreadsheet</label>
          <select
            value={selectedSpreadsheet}
            onChange={handleSpreadsheetChange}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none"
          >
            <option value="">Select a spreadsheet…</option>
            {spreadsheets.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
            Sheet (tab)
            {loadingSheets && <Loader2 className="inline w-3 h-3 ml-1 animate-spin" />}
          </label>
          {sheetNames.length > 0 ? (
            <select
              value={selectedSheet}
              onChange={e => setSelectedSheet(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none"
            >
              {sheetNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          ) : (
            <input
              type="text"
              value={selectedSheet}
              onChange={e => setSelectedSheet(e.target.value)}
              placeholder="Sheet1"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none placeholder:text-gray-400"
            />
          )}
        </div>
      </div>

      <Button
        variant="primary"
        size="md"
        onClick={handleSave}
        disabled={saving || !selectedSpreadsheet}
        icon={saving ? Loader2 : undefined}
        className="!bg-gray-900 hover:!bg-black !text-white !font-black text-xs uppercase tracking-widest !rounded-xl"
      >
        {saving ? 'Saving…' : isConfigured ? 'Update Config' : 'Enable Sync'}
      </Button>

      {/* Apps Script section */}
      {isConfigured && (
        <div className="border-t border-gray-50 pt-5 space-y-3">
          <button
            onClick={() => setShowScript(v => !v)}
            className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-primary transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showScript ? 'rotate-180' : ''}`} />
            Sheet → CRM (Real-time webhook setup)
          </button>
          {showScript && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 leading-relaxed">
                Paste this Google Apps Script into your spreadsheet (<strong>Extensions → Apps Script</strong>), then create an <strong>onEdit trigger</strong> pointing to <code className="bg-gray-100 px-1 rounded">onSheetEdit</code>. Any edits in the sheet will instantly update the CRM.
              </p>
              <div className="relative">
                <pre className="bg-gray-900 text-green-400 text-[10px] p-4 rounded-xl overflow-x-auto max-h-48 font-mono leading-relaxed">
                  {appsScript}
                </pre>
                <button
                  onClick={copyScript}
                  className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  {scriptCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="font-semibold">Webhook URL:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-gray-700 flex-1 overflow-x-auto">{webhookUrl}</code>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const GoogleSheetsTab: React.FC = () => {
  const { crmApi } = useApi();
  const [connection, setConnection] = useState<GoogleConnection | null>(null);
  const [oauthAppConfig, setOauthAppConfig] = useState({ clientId: '', clientSecret: '' });
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [syncConfigs, setSyncConfigs] = useState<SyncConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [showAppCreds, setShowAppCreds] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);

  const serverOrigin = getServerOrigin();

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [connRes, configRes] = await Promise.all([
        crmApi.getGoogleConnection(),
        crmApi.getGoogleSyncConfigs(),
      ]);
      setConnection(connRes.data);
      setSyncConfigs(configRes.data || []);

      if (connRes.data?.connected) {
        try {
          const sheetsRes = await crmApi.getGoogleSpreadsheets();
          setSpreadsheets(sheetsRes.data || []);
        } catch {
          setSpreadsheets([]);
        }
      }

      try {
        const credsRes = await crmApi.getGoogleOAuthAppConfig();
        setOauthAppConfig({ clientId: credsRes.data?.clientId || '', clientSecret: '' });
      } catch {
        // ignore
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [crmApi]);

  useEffect(() => {
    loadAll();
    // Handle OAuth callback query params
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_connected')) {
      showToast('success', 'Google account connected successfully!');
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('google_error')) {
      showToast('error', decodeURIComponent(params.get('google_error') || 'Connection failed'));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [loadAll]);

  const handleConnect = async () => {
    setConnectLoading(true);
    try {
      const res = await crmApi.getGoogleOAuthUrl();
      window.location.href = res.data.url;
    } catch (err: any) {
      showToast('error', err.message || 'Failed to get OAuth URL');
      setConnectLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect your Google account? Sync will stop working.')) return;
    await crmApi.disconnectGoogle();
    setConnection({ connected: false });
    setSpreadsheets([]);
    showToast('success', 'Google account disconnected');
  };

  const handleSaveSync = async (entityType: string, data: any) => {
    try {
      await crmApi.saveGoogleSyncConfig(entityType, data);
      await loadAll();
      showToast('success', `${entityType === 'leads' ? 'Leads' : 'Contacts'} sync configured!`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save sync config');
    }
  };

  const handleSyncNow = async (entityType: string) => {
    try {
      const res = await crmApi.googleSyncNow(entityType);
      showToast('success', `Synced ${res.data.synced} ${entityType} to Google Sheets`);
      await loadAll();
    } catch (err: any) {
      showToast('error', err.message || 'Sync failed');
    }
  };

  const handleDisableSync = async (entityType: string) => {
    if (!window.confirm(`Disable ${entityType} sync?`)) return;
    try {
      await crmApi.deleteGoogleSyncConfig(entityType);
      await loadAll();
      showToast('success', 'Sync disabled');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to disable sync');
    }
  };

  const handleSaveCreds = async () => {
    setSavingCreds(true);
    try {
      await crmApi.saveGoogleOAuthAppConfig(oauthAppConfig);
      showToast('success', 'Google OAuth credentials saved');
      setShowAppCreds(false);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save credentials');
    } finally {
      setSavingCreds(false);
    }
  };

  const leadConfig = syncConfigs.find(c => c.entityType === 'leads') || null;
  const contactConfig = syncConfigs.find(c => c.entityType === 'contacts') || null;

  const labelClass = 'block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1';
  const inputClass = 'w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-gray-400';

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold ${toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Google Sheets</h2>
        <p className="text-sm text-gray-500 mt-1">Bi-directional sync between your CRM and Google Sheets.</p>
      </div>

      {/* OAuth App Credentials */}
      <div className="border border-gray-100 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Google OAuth App</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Register an app at{' '}
              <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
                Google Cloud Console
              </a>
              {' '}and paste your Client ID & Secret below.
            </p>
          </div>
          <button
            onClick={() => setShowAppCreds(v => !v)}
            className="text-xs font-bold text-primary hover:underline"
          >
            {showAppCreds ? 'Collapse' : 'Configure'}
          </button>
        </div>

        {showAppCreds && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 space-y-1">
              <p className="font-bold">Setup steps:</p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Create a project in <a href="https://console.cloud.google.com/" target="_blank" className="underline" rel="noreferrer">Google Cloud Console</a></li>
                <li>Enable <strong>Google Sheets API</strong> and <strong>Google Drive API</strong></li>
                <li>Create OAuth 2.0 credentials (Web application type)</li>
                <li>Add Authorized redirect URI: <code className="bg-blue-100 px-1 rounded">{serverOrigin}/api/google/callback</code></li>
                <li>Paste Client ID and Secret below</li>
              </ol>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Client ID</label>
                <input
                  type="text"
                  value={oauthAppConfig.clientId}
                  onChange={e => setOauthAppConfig(p => ({ ...p, clientId: e.target.value }))}
                  placeholder="1234567890-abc.apps.googleusercontent.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Client Secret</label>
                <input
                  type="password"
                  value={oauthAppConfig.clientSecret}
                  onChange={e => setOauthAppConfig(p => ({ ...p, clientSecret: e.target.value }))}
                  placeholder="GOCSPX-…"
                  className={inputClass}
                />
              </div>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={handleSaveCreds}
              disabled={savingCreds}
              icon={savingCreds ? Loader2 : undefined}
              className="!bg-gray-900 hover:!bg-black !text-white !font-black text-xs uppercase tracking-widest !rounded-xl"
            >
              {savingCreds ? 'Saving…' : 'Save Credentials'}
            </Button>
          </div>
        )}
      </div>

      {/* Google Account connection */}
      <div className="border border-gray-100 rounded-2xl p-6">
        {connection?.connected ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Connected to Google</p>
                <p className="text-xs text-gray-500">{connection.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="md"
              icon={Link2Off}
              onClick={handleDisconnect}
              className="!text-red-500 !border-red-100 hover:!bg-red-50 !rounded-xl text-xs !font-bold"
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900">Connect Google Account</p>
              <p className="text-xs text-gray-500">Authorize access to your Google Sheets and Drive</p>
            </div>
            <Button
              variant="primary"
              size="md"
              icon={connectLoading ? Loader2 : Link2}
              onClick={handleConnect}
              disabled={connectLoading}
              className="!bg-gray-900 hover:!bg-black !text-white !font-black text-xs uppercase tracking-widest !rounded-xl"
            >
              {connectLoading ? 'Redirecting…' : 'Connect Google'}
            </Button>
          </div>
        )}
      </div>

      {/* Sync configurations — only show when connected */}
      {connection?.connected && (
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider text-gray-400">Sync Rules</h3>
          <SyncCard
            entityType="leads"
            label="Leads Sync"
            config={leadConfig}
            spreadsheets={spreadsheets}
            onSave={handleSaveSync}
            onSyncNow={handleSyncNow}
            onDisable={handleDisableSync}
            serverOrigin={serverOrigin}
          />
          <SyncCard
            entityType="contacts"
            label="Contacts Sync"
            config={contactConfig}
            spreadsheets={spreadsheets}
            onSave={handleSaveSync}
            onSyncNow={handleSyncNow}
            onDisable={handleDisableSync}
            serverOrigin={serverOrigin}
          />
        </div>
      )}

      {!connection?.connected && (
        <div className="text-center py-8 text-gray-400">
          <Table2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">Connect your Google account to configure sync rules</p>
        </div>
      )}
    </div>
  );
};

export default GoogleSheetsTab;
