import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Users, DollarSign, User, X, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '@/contexts/ApiContext';

interface SearchResults {
  leads: Array<{ id: string; firstName: string; lastName: string; email: string; company: string; status: string }>;
  contacts: Array<{ id: string; name: string; phone: string; source: string }>;
  deals: Array<{ id: string; name: string; accountName: string; stage: string; value: number }>;
}

const GlobalSearch: React.FC = () => {
  const { crmApi } = useApi();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = results ? results.leads.length + results.contacts.length + results.deals.length : 0;

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await crmApi.globalSearch(q);
      setResults(res.data);
      setOpen(true);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [crmApi]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults(null); setOpen(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(() => search(query.trim()), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
    setQuery('');
    setResults(null);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (results && total > 0) setOpen(true); }}
          placeholder="Search leads, contacts, deals…"
          className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-white transition-all placeholder:text-gray-400"
        />
        {loading && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
        {!loading && query && (
          <button onClick={() => { setQuery(''); setResults(null); setOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && results && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          {total === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm font-semibold text-gray-500">No results for "<span className="text-gray-800">{query}</span>"</p>
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
              {results.leads.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Leads</span>
                  </div>
                  {results.leads.map(lead => (
                    <button
                      key={lead.id}
                      onClick={() => go(`/leads/${lead.id}`)}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors group"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                        {lead.firstName[0]}{lead.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-primary truncate">{lead.firstName} {lead.lastName}</p>
                        <p className="text-xs text-gray-400 truncate">{lead.email} · {lead.company}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full shrink-0">{lead.status}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.contacts.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Contacts</span>
                  </div>
                  {results.contacts.map(c => (
                    <button
                      key={c.id}
                      onClick={() => go('/contacts')}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors group"
                    >
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-xs shrink-0">
                        {(c.name || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-primary truncate">{c.name}</p>
                        <p className="text-xs text-gray-400 truncate">{c.phone}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.deals.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Deals</span>
                  </div>
                  {results.deals.map(deal => (
                    <button
                      key={deal.id}
                      onClick={() => go('/deals')}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors group"
                    >
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 shrink-0">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-primary truncate">{deal.name}</p>
                        <p className="text-xs text-gray-400 truncate">{deal.accountName} · {deal.stage}</p>
                      </div>
                      <span className="text-xs font-black text-green-700 shrink-0">${Number(deal.value).toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
            <span className="text-[10px] font-bold text-gray-400">Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-500 font-mono">Esc</kbd> to close</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
