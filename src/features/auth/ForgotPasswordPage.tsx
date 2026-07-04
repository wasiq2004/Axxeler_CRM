import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApi } from '@/contexts/ApiContext';

const ForgotPasswordPage: React.FC = () => {
  const { crmApi } = useApi();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await crmApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
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
            <h2 className="text-3xl font-black text-gray-900 tracking-tight text-center">Reset Password</h2>
            <p className="text-sm text-gray-500 mt-2 text-center">Enter your email and we'll send you a reset link.</p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <p className="text-sm text-gray-600">
                If an account exists for <span className="font-semibold">{email}</span>, a password reset link has been sent. The link expires in 30 minutes.
              </p>
              <Link to="/login" className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:underline">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <p className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-xs font-bold text-rose-600 text-center">{error}</p>
              )}
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-600 transition-all" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-transparent rounded-[20px] text-sm font-bold text-gray-900 focus:bg-white focus:border-blue-200 focus:ring-8 focus:ring-blue-100/50 transition-all outline-none placeholder:text-gray-300"
                  placeholder="your@email.com"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-14 bg-blue-600 hover:bg-blue-800 disabled:opacity-60 text-white font-black text-xs uppercase tracking-[0.3em] rounded-[20px] transition-all"
              >
                {submitting ? 'Sending…' : 'Send Reset Link'}
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

export default ForgotPasswordPage;
