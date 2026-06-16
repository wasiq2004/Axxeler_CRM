import React, { useState } from 'react';
import { X, ArrowRight, User, DollarSign, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useApi } from '@/contexts/ApiContext';
import { useLeads } from '@/contexts/LeadsContext';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import type { Lead } from '@/types';

interface Props {
  lead: Lead;
  onClose: () => void;
}

const DEAL_STAGES = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation'];

const ConvertLeadModal: React.FC<Props> = ({ lead, onClose }) => {
  const { crmApi } = useApi();
  const { refresh } = useLeads();
  const navigate = useNavigate();

  const defaultCloseDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  })();

  const [form, setForm] = useState({
    dealName: `${lead.firstName} ${lead.lastName} — ${lead.company || 'Deal'}`,
    dealValue: 0,
    dealStage: 'Qualification',
    closeDate: defaultCloseDate,
    createContact: true,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ deal: any; contact: any } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await crmApi.convertLead(lead.id, form);
      setResult(res.data);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Convert Lead</h2>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{lead.firstName} {lead.lastName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                <div>
                  <p className="font-bold text-green-800">Lead converted successfully</p>
                  <p className="text-sm text-green-700 mt-0.5">Status updated to Closed – Won.</p>
                </div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => { navigate(`/deals`); onClose(); }}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-primary/5 border border-gray-100 hover:border-primary/20 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-900">{result.deal.name}</p>
                      <p className="text-xs text-gray-500">Deal created · {result.deal.stage}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                </button>
                {result.contact && (
                  <button
                    onClick={() => { navigate(`/contacts`); onClose(); }}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-primary/5 border border-gray-100 hover:border-primary/20 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-gray-900">{result.contact.name}</p>
                        <p className="text-xs text-gray-500">Contact created · {result.contact.phone}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Lead summary */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {lead.firstName[0]}{lead.lastName[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{lead.firstName} {lead.lastName}</p>
                  <p className="text-xs text-gray-500">{lead.email} · {lead.company}</p>
                </div>
              </div>

              {/* Deal fields */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Deal details</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">Deal Name</label>
                    <input
                      type="text"
                      value={form.dealName}
                      onChange={e => setForm(p => ({ ...p, dealName: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Deal Value</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">$</span>
                        <input
                          type="number"
                          min="0"
                          value={form.dealValue}
                          onChange={e => setForm(p => ({ ...p, dealValue: Number(e.target.value) }))}
                          className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Close Date</label>
                      <input
                        type="date"
                        value={form.closeDate}
                        onChange={e => setForm(p => ({ ...p, closeDate: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">Stage</label>
                    <select
                      value={form.dealStage}
                      onChange={e => setForm(p => ({ ...p, dealStage: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                    >
                      {DEAL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Create contact toggle */}
              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={form.createContact}
                  onChange={e => setForm(p => ({ ...p, createContact: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                <div>
                  <p className="text-sm font-bold text-gray-800">Create Contact</p>
                  <p className="text-xs text-gray-500 mt-0.5">Add {lead.firstName} {lead.lastName} to Contacts</p>
                </div>
              </label>

              {error && (
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!result && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
            <Button
              variant="primary"
              onClick={handleConvert}
              disabled={loading || !form.dealName.trim()}
              className="rounded-xl font-bold bg-green-600 hover:bg-green-700"
              icon={loading ? Loader : ArrowRight}
            >
              {loading ? 'Converting…' : 'Convert Lead'}
            </Button>
          </div>
        )}
        {result && (
          <div className="flex justify-end px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Done</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConvertLeadModal;
