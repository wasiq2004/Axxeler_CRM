import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '@/contexts/ApiContext';

const ResetPasswordPage: React.FC = () => {
  const { crmApi } = useApi();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setSubmitting(true);
    try {
      await crmApi.resetPassword({ token, newPassword: password });
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'This reset link is invalid or has expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F1F5F9] font-sans">
      <div className="w-full max-w-[420px]">
        <div className="bg-white rounded-[40px] shadow-[0_40px_120px_rgba(0,0,0,0.06)] border border-white p-8 sm:p-10">
          <div className="flex flex-col items-center mb-8">
            <img src="/black%20logo.png" alt="Axxeler CRM" className="h-16 w-auto object-contain mb-6" />
            <h2 className="text-3xl font-black text-gray-900 tracking-tight text-center">New Password</h2>
          </div>

          {!token ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">This reset link is missing its token. Please request a new one.</p>
              <Link to="/forgot-password" className="text-blue-600 font-semibold text-sm hover:underline">Request a new link</Link>
            </div>
          ) : done ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center"><CheckCircle className="w-12 h-12 text-green-500" /></div>
              <p className="text-sm text-gray-600">Your password has been reset. Redirecting to login…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <p className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-xs font-bold text-rose-600 text-center">{error}</p>
              )}
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-600 transition-all" />
                <input
                  type={show ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-transparent rounded-[20px] text-sm font-bold text-gray-900 focus:bg-white focus:border-blue-200 focus:ring-8 focus:ring-blue-100/50 transition-all outline-none placeholder:text-gray-300"
                  placeholder="New password"
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-blue-600">
                  {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-600 transition-all" />
                <input
                  type={show ? 'text' : 'password'}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-transparent rounded-[20px] text-sm font-bold text-gray-900 focus:bg-white focus:border-blue-200 focus:ring-8 focus:ring-blue-100/50 transition-all outline-none placeholder:text-gray-300"
                  placeholder="Confirm new password"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-14 bg-blue-600 hover:bg-blue-800 disabled:opacity-60 text-white font-black text-xs uppercase tracking-[0.3em] rounded-[20px] transition-all"
              >
                {submitting ? 'Saving…' : 'Reset Password'}
              </button>
              <div className="text-center">
                <Link to="/login" className="inline-flex items-center gap-2 text-gray-400 font-semibold text-xs hover:text-gray-700">
                  <ArrowLeft className="w-4 h-4" /> Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
