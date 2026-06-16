import React, { useState } from 'react';
import { X, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { Contact } from '@/types';
import { useApi } from '@/contexts/ApiContext';
import Button from '@/components/ui/Button';

interface Props {
  contact: Contact;
  onClose: () => void;
}

const ComposeEmailModal: React.FC<Props> = ({ contact, onClose }) => {
  const { crmApi } = useApi();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const contactEmail = (contact.customFields as any)?.email || '';

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await crmApi.sendEmailToContact(contact.id, { subject, message });
      setResult({ ok: true, msg: res.message || 'Email sent successfully' });
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setResult({ ok: false, msg: err.message || 'Failed to send email' });
    } finally {
      setSending(false);
    }
  };

  const labelClass = 'block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1';
  const inputClass = 'w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-gray-400';

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg border border-gray-100 flex flex-col max-h-full">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Send Email</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              To: <span className="font-semibold text-gray-700">{contact.name}</span>
              {contactEmail && <span className="text-gray-400"> &lt;{contactEmail}&gt;</span>}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!contactEmail ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <p className="text-gray-700 font-semibold">No email address on file</p>
            <p className="text-sm text-gray-500 mt-1">Edit this contact and add an email address to send messages.</p>
            <Button variant="outline" size="md" onClick={onClose} className="mt-4">Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 space-y-4 overflow-y-auto">
              {result && (
                <div className={`flex items-start gap-3 p-4 rounded-xl text-sm font-semibold ${result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {result.ok ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                  {result.msg}
                </div>
              )}
              <div>
                <label className={labelClass}>Subject <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                  placeholder="Email subject..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Message <span className="text-red-500">*</span></label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={8}
                  placeholder="Type your message here..."
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex justify-end items-center space-x-3 rounded-b-[24px] shrink-0">
              <Button type="button" variant="outline" size="md" onClick={onClose}
                className="!bg-white !text-gray-600 !border-gray-200 hover:!bg-gray-50 !rounded-xl !font-bold text-xs uppercase tracking-widest shadow-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={sending ? Loader2 : Send}
                disabled={sending || !subject.trim() || !message.trim()}
                className="!bg-gray-900 hover:!bg-black !text-white !font-black text-xs uppercase tracking-widest !rounded-xl shadow-lg shadow-gray-200/50"
              >
                {sending ? 'Sending...' : 'Send Email'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ComposeEmailModal;
