import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, User, LayoutDashboard, AlertCircle, ChevronRight, ShieldCheck, Sparkles, Globe, Zap, Building2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await signup(email, password, name);
      navigate(from, { replace: true });
    } catch (err) {
      setError('An error occurred during signup. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-white font-sans overflow-hidden">
      {/* Left Column: Branding Section - Full Height, No Scroll */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#021025] relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute top-0 right-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[180px] rounded-full animate-pulse opacity-70" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[70%] h-[70%] bg-purple-600/5 blur-[180px] rounded-full animate-pulse delay-1000 opacity-50" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative z-10 animate-slideDown">
          <div className="flex items-center mb-10">
             <img src="/axxeler-logo-white.png" alt="Axxeler CRM" className="h-16 w-auto object-contain drop-shadow-2xl" />
          </div>

          <h1 className="text-6xl font-black text-white leading-tight tracking-tighter mb-6 animate-fadeIn delay-300">
            Build your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#00A3FF]">Enterprise.</span>
          </h1>
          <p className="text-xl text-gray-400 font-medium max-w-md leading-relaxed animate-fadeIn delay-500">
            Automate your lead lifecycle and grow your sales.
          </p>
        </div>

        <div className="relative z-10 space-y-6 mb-4 animate-fadeIn delay-700">
            <div className="flex items-center gap-6 p-6 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-2xl max-w-lg transition-all duration-300 hover:bg-blue-600/5">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center border border-blue-400/20 group-hover:scale-110 transition-transform">
                    <Building2 className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg tracking-tight">Best Support</h3>
                    <p className="text-[10px] text-gray-500 font-black leading-relaxed mt-1 uppercase tracking-widest opacity-40">Expert Management</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 max-w-lg">
                <div className="p-6 bg-white/5 border border-white/10 rounded-[28px] flex flex-col items-center justify-center text-center">
                    <p className="text-2xl font-black text-white tracking-tighter">99%</p>
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.4em] mt-2 opacity-40">System Active</p>
                </div>
                <div className="p-6 bg-white/5 border border-white/10 rounded-[28px] flex flex-col items-center justify-center text-center">
                    <p className="text-2xl font-black text-white tracking-tighter">AES</p>
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.4em] mt-2 opacity-40">Secure Node</p>
                </div>
            </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-gray-600 pt-8 border-t border-white/5 animate-fadeIn delay-1000">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30">Global Intelligence Network</p>
          <div className="flex gap-6 opacity-30">
            <ShieldCheck className="w-4 h-4" />
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Right Column: Compact Signup Form - Full Height, No Scroll */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-[#F1F5F9] overflow-y-auto">
        <div className="w-full max-w-[480px] animate-slideUp">
          <div className="bg-white rounded-[40px] shadow-[0_40px_120px_rgba(0,0,0,0.06)] border border-white p-8 sm:p-10 relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-100/30 blur-[100px] rounded-full animate-pulse pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex flex-col items-center mb-8 animate-fadeIn">
                <img src="/black%20logo.png" alt="Axxeler CRM" className="h-20 w-auto object-contain mb-6 transition-transform duration-700 hover:rotate-3" />
                <h2 className="text-3xl font-black text-gray-900 tracking-tight text-center">Sign Up</h2>
                <div className="h-1 w-12 bg-blue-600 rounded-full mt-3 animate-scaleX" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 stagger-container">
                {error && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 animate-shake">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    </div>
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2 animate-fadeIn delay-100">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-600 transition-all" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-transparent rounded-[18px] text-sm font-bold text-gray-900 focus:bg-white focus:border-blue-200 focus:ring-8 focus:ring-blue-100/50 transition-all outline-none placeholder:text-gray-300"
                        placeholder="John Smith"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 animate-fadeIn delay-200">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-600 transition-all" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-transparent rounded-[18px] text-sm font-bold text-gray-900 focus:bg-white focus:border-blue-200 focus:ring-8 focus:ring-blue-100/50 transition-all outline-none placeholder:text-gray-300"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 animate-fadeIn delay-300">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-600 transition-all" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-transparent rounded-[18px] text-sm font-bold text-gray-900 focus:bg-white focus:border-blue-200 focus:ring-8 focus:ring-blue-100/50 transition-all outline-none placeholder:text-gray-300"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 animate-fadeIn delay-400">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Confirm</label>
                      <div className="relative group">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-600 transition-all" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-transparent rounded-[18px] text-sm font-bold text-gray-900 focus:bg-white focus:border-blue-200 focus:ring-8 focus:ring-blue-100/50 transition-all outline-none placeholder:text-gray-300"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 px-2 group cursor-pointer animate-fadeIn delay-500">
                  <div className="mt-1 relative flex items-center justify-center cursor-pointer">
                      <input type="checkbox" required className="peer sr-only" id="terms" />
                      <div className="w-5 h-5 border-2 border-gray-100 rounded-lg bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all duration-300 ease-out group-hover:border-blue-300"></div>
                      <svg className="w-3 h-3 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transform rotate-[-45deg] peer-checked:rotate-0 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                  </div>
                  <label htmlFor="terms" className="text-[10px] font-black text-gray-400 cursor-pointer select-none leading-relaxed transition-colors group-hover:text-gray-700 uppercase tracking-widest">
                      I agree to the <span className="text-blue-600 underline">Terms</span> and <span className="text-blue-600 underline">Policies</span>.
                  </label>
                </div>

                <div className="pt-2 animate-fadeIn delay-600">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 !bg-blue-600 hover:!bg-blue-800 text-white font-black text-xs uppercase tracking-[0.3em] rounded-[18px] shadow-[0_12px_32px_rgba(37,99,235,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group overflow-hidden"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                        <span>Create Account</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform inline-block shrink-0" />
                      </div>
                    )}
                  </Button>
                </div>
              </form>

              <div className="mt-8 text-center pt-6 border-t border-gray-50 animate-fadeIn delay-800">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
                  Already have an account? <Link to="/login" className="text-blue-600 hover:underline underline-offset-4 decoration-2">Sign In</Link>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4 text-gray-300 opacity-50 animate-fadeIn delay-1000">
            <ShieldCheck className="w-5 h-5" />
            <p className="text-[9px] font-black uppercase tracking-[0.5em] leading-none text-center">Protocol V2 Enabled</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
