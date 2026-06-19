import React, { useState, useEffect } from 'react';
import { Settings, User, Users, Zap, Building, Mail, Phone, Globe, MapPin, Shield, Bell, Camera, ChevronRight, Coins, Eye, EyeOff, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useUsers } from '../../contexts/UsersContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useApi } from '../../contexts/ApiContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '@/components/ui/Button';
import GoogleSheetsTab from './components/GoogleSheetsTab';
import { getServerOrigin } from '@/api/serverOrigin';

const SettingsPage: React.FC = () => {
    const { updateUser } = useUsers();
    const { companyInfo, updateCompanyInfo } = useCompany();
    const { currency, setCurrencyByCode, availableCurrencies } = useCurrency();
    const { user } = useAuth();
    const { crmApi } = useApi();

    const [activeTab, setActiveTab] = useState('Profile');
    const [userData, setUserData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        avatar: user?.avatar || '',
        phone: '',
        timezone: 'America/New_York',
        language: 'English'
    });

    const [companyData, setCompanyData] = useState({
        name: companyInfo.name,
        address: companyInfo.address,
        phone: companyInfo.phone,
        email: companyInfo.email,
        website: companyInfo.website,
        logo: companyInfo.logo
    });

    const handleSaveProfile = async () => {
        try {
            const res = await crmApi.updateProfile({ name: userData.name, avatar: userData.avatar, phone: userData.phone });
            if (user?.id) updateUser(user.id, res.data);
            alert('Profile updated successfully!');
        } catch {
            alert('Failed to save profile. Please try again.');
        }
    };

    const handleSaveCompany = () => {
        updateCompanyInfo(companyData);
        alert('Company information updated successfully!');
    };

    const allTabs = [
        { id: 'Profile', label: 'My Profile', icon: User, desc: 'Personal details and credentials' },
        { id: 'Company', label: 'Company Info', icon: Building, desc: 'Branding and corporate data' },
        { id: 'Users', label: 'Team access', icon: Users, desc: 'Manage roles & permissions' },
        { id: 'Integrations', label: 'Connections', icon: Zap, desc: 'Sync with external tools' },
    ];

    const tabs = allTabs.filter(tab => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        // Company branding and Integration credentials are admin-only.
        if (user.role === 'manager') return tab.id !== 'Company' && tab.id !== 'Integrations';
        if (user.role === 'team_member') return tab.id === 'Profile';
        return false;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Settings className="w-7 h-7 text-primary" />
                        </div>
                        Settings
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Control your workspace, security, and team preferences.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <aside className="w-full lg:w-72 flex-shrink-0">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${activeTab === tab.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <tab.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-primary'}`} />
                                <div className="text-left">
                                    <p className="text-sm font-bold leading-none mb-1">{tab.label}</p>
                                    <p className={`text-[10px] ${activeTab === tab.id ? 'text-white/70' : 'text-gray-400'}`}>
                                        {tab.desc}
                                    </p>
                                </div>
                                {activeTab === tab.id && <ChevronRight className="ml-auto w-4 h-4 opacity-70" />}
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 p-5 bg-gradient-to-br from-indigo-600 to-primary rounded-2xl shadow-lg relative overflow-hidden group">
                        <div className="relative z-10 text-white">
                            <h4 className="font-bold flex items-center gap-2 mb-2">
                                <Shield className="w-4 h-4" />
                                Security Status
                            </h4>
                            <p className="text-xs text-white/80 leading-relaxed mb-4">
                                Your account is 75% protected. Enable 2FA for maximum security.
                            </p>
                            <button className="text-[10px] font-bold uppercase tracking-widest bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors">
                                View Security Log
                            </button>
                        </div>
                        <Zap className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10 group-hover:scale-110 transition-transform" />
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col animate-slideIn">
                    {activeTab === 'Profile' && (
                        <ProfileTab userData={userData} setUserData={setUserData} onSave={handleSaveProfile} />
                    )}
                    {activeTab === 'Company' && (
                        <CompanyTab 
                            companyData={companyData} 
                            setCompanyData={setCompanyData} 
                            onSave={handleSaveCompany}
                            currency={currency}
                            setCurrencyByCode={setCurrencyByCode}
                            availableCurrencies={availableCurrencies}
                        />
                    )}
                    {activeTab === 'Users' && (
                        <div className="p-8 flex flex-col items-center justify-center h-full text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Users className="w-8 h-8 text-gray-300" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">User Management</h2>
                            <p className="text-gray-500 mt-2 max-w-sm">This module is currently being optimized for high-performance teams.</p>
                        </div>
                    )}
                    {activeTab === 'Integrations' && (
                        <IntegrationsTab />
                    )}
                </main>
            </div>
        </div>
    );
};

const ProfileTab: React.FC<{ userData: any; setUserData: any; onSave: () => void }> = ({ userData, setUserData, onSave }) => {
    const { crmApi } = useApi();
    const [uploading, setUploading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUserData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const res = await crmApi.uploadImage(file);
            setUserData((prev: any) => ({ ...prev, avatar: res.data.url }));
        } catch (err: any) {
            alert(err?.message || 'Failed to upload image. Please try a smaller image (max 5 MB).');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-8 space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Personal Profile</h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Manage your identity and public preferences.</p>
                </div>
                <Button onClick={onSave} variant="primary" className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20">
                    Update Profile
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-10">
                <div className="flex-shrink-0 text-center">
                    <div className="relative group mx-auto w-32 h-32">
                        {userData.avatar ? (
                            <img
                                src={userData.avatar}
                                alt={userData.name}
                                className="w-32 h-32 rounded-3xl object-cover border-4 border-gray-50 shadow-md ring-1 ring-gray-100 transition-transform group-hover:scale-[1.02]"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-3xl bg-primary/10 border-4 border-gray-50 shadow-md ring-1 ring-gray-100 flex items-center justify-center text-3xl font-bold text-primary">
                                {(userData.name || '?').trim().charAt(0).toUpperCase()}
                            </div>
                        )}
                        {uploading && (
                            <div className="absolute inset-0 rounded-3xl bg-black/40 flex items-center justify-center">
                                <Loader className="w-6 h-6 text-white animate-spin" />
                            </div>
                        )}
                        <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-white shadow-xl rounded-xl border border-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                            <Camera className="w-5 h-5 text-gray-600" />
                            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={uploading} />
                        </label>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                            <User className="w-3 h-3" /> Full Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={userData.name}
                            onChange={handleChange}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all transition-duration-300"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                            <Mail className="w-3 h-3" /> Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={userData.email}
                            onChange={handleChange}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                            <Phone className="w-3 h-3" /> Phone
                        </label>
                        <input
                            type="text"
                            name="phone"
                            value={userData.phone}
                            onChange={handleChange}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                            <Globe className="w-3 h-3" /> Timezone
                        </label>
                        <select
                            name="timezone"
                            value={userData.timezone}
                            onChange={handleChange}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                        >
                            <option value="America/New_York">Eastern Time (EST)</option>
                            <option value="America/Chicago">Central Time (CST)</option>
                            <option value="America/Denver">Mountain Time (MST)</option>
                            <option value="America/Los_Angeles">Pacific Time (PST)</option>
                        </select>
                    </div>
                </div>
            </div>

            <ChangePasswordSection />
        </div>
    );
};

const ChangePasswordSection: React.FC = () => {
    const { crmApi } = useApi();
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const handleSave = async () => {
        if (form.newPassword !== form.confirmPassword) {
            setToast({ type: 'error', msg: 'New passwords do not match.' });
            return;
        }
        if (form.newPassword.length < 6) {
            setToast({ type: 'error', msg: 'New password must be at least 6 characters.' });
            return;
        }
        setSaving(true);
        setToast(null);
        try {
            await crmApi.changePassword(form.currentPassword, form.newPassword);
            setToast({ type: 'success', msg: 'Password updated successfully.' });
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            setToast({ type: 'error', msg: err?.message || 'Failed to update password.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="pt-8 border-t border-gray-50 space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-gray-900">Change Password</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Update your account password.</p>
                </div>
            </div>
            {toast && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-semibold ${toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {toast.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    {toast.msg}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                    { label: 'Current Password', key: 'currentPassword' },
                    { label: 'New Password', key: 'newPassword' },
                    { label: 'Confirm New Password', key: 'confirmPassword' },
                ].map(({ label, key }) => (
                    <div key={key} className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</label>
                        <input
                            type="password"
                            value={form[key as keyof typeof form]}
                            onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        />
                    </div>
                ))}
            </div>
            <div className="flex justify-end">
                <Button onClick={handleSave} variant="primary" disabled={saving || !form.currentPassword || !form.newPassword} className="rounded-xl px-5 font-bold">
                    {saving ? 'Saving…' : 'Update Password'}
                </Button>
            </div>
        </div>
    );
};

const CompanyTab: React.FC<{ 
    companyData: any; 
    setCompanyData: any; 
    onSave: () => void;
    currency: any;
    setCurrencyByCode: (code: string) => void;
    availableCurrencies: any[];
}> = ({ companyData, setCompanyData, onSave, currency, setCurrencyByCode, availableCurrencies }) => {
    const { crmApi } = useApi();
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCompanyData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingLogo(true);
        try {
            const res = await crmApi.uploadImage(file);
            setCompanyData((prev: any) => ({ ...prev, logo: res.data.url }));
        } catch (err: any) {
            alert(err?.message || 'Failed to upload logo. Please try a smaller image (max 5 MB).');
        } finally {
            setUploadingLogo(false);
        }
    };

    return (
        <div className="p-8 space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Workspace Details</h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Branding and essential company information.</p>
                </div>
                <Button onClick={onSave} variant="primary" className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20">
                    Save Updates
                </Button>
            </div>

            <div className="flex flex-col lg:flex-row gap-12">
                <div className="lg:w-1/3 space-y-8">
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Brand Identity</label>
                        <div className="bg-gray-50/50 p-8 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center group hover:bg-gray-50 hover:border-primary/30 transition-all">
                            <img
                                src={companyData.logo}
                                alt={companyData.name}
                                className="w-full max-w-[150px] h-12 object-contain mb-4 transition-transform group-hover:scale-105"
                            />
                            <label className="px-4 py-2 bg-white shadow-sm border border-gray-100 text-primary text-xs font-bold rounded-lg cursor-pointer hover:shadow-md transition-all">
                                {uploadingLogo ? 'Uploading…' : 'Replace Logo'}
                                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} disabled={uploadingLogo} />
                            </label>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                            <Coins className="w-3 h-3" /> Currency Settings
                        </label>
                        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Primary Currency</p>
                            <select 
                                value={currency.code}
                                onChange={(e) => setCurrencyByCode(e.target.value)}
                                className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                            >
                                {availableCurrencies.map((cur) => (
                                    <option key={cur.code} value={cur.code}>
                                        {cur.name} ({cur.symbol})
                                    </option>
                                ))}
                            </select>
                            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                                <p className="text-[10px] text-primary font-black uppercase tracking-widest leading-relaxed">
                                    Current display: <span className="text-lg ml-2">{currency.symbol} 1,250.00</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Corporate Name</label>
                        <input
                            type="text"
                            name="name"
                            value={companyData.name}
                            onChange={handleChange}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Website URL</label>
                        <input
                            type="text"
                            name="website"
                            value={companyData.website}
                            onChange={handleChange}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 font-sans">Support Email</label>
                        <input
                            type="email"
                            name="email"
                            value={companyData.email}
                            onChange={handleChange}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Contact Line</label>
                        <input
                            type="text"
                            name="phone"
                            value={companyData.phone}
                            onChange={handleChange}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                            <MapPin className="w-3 h-3" /> Registered Address
                        </label>
                        <textarea
                            name="address"
                            value={companyData.address}
                            onChange={handleChange}
                            rows={3}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const MASKED = '••••••••';

const IntegrationsTab: React.FC = () => {
    const [activeIntegration, setActiveIntegration] = useState<'meta' | 'google'>('meta');

    return (
        <div className="p-8 space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Integrations</h2>
                <p className="text-sm text-gray-500 mt-1 font-medium">Configure third-party connections for your CRM.</p>
            </div>
            <div className="flex gap-2 border-b border-gray-100 pb-0">
                <button
                    onClick={() => setActiveIntegration('meta')}
                    className={`px-4 py-2 text-sm font-bold rounded-t-xl border-b-2 transition-all ${activeIntegration === 'meta' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                >
                    Meta Ads
                </button>
                <button
                    onClick={() => setActiveIntegration('google')}
                    className={`px-4 py-2 text-sm font-bold rounded-t-xl border-b-2 transition-all ${activeIntegration === 'google' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                >
                    Google Sheets
                </button>
            </div>
            {activeIntegration === 'meta' ? <MetaIntegrationSection /> : <GoogleSheetsTab />}
        </div>
    );
};

const MetaIntegrationSection: React.FC = () => {
    const { crmApi } = useApi();
    const [config, setConfig] = useState({
        appId: '',
        appSecret: '',
        webhookVerifyToken: '',
        redirectUri: '',
    });
    const [showSecret, setShowSecret] = useState(false);
    const [showToken, setShowToken] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const defaultRedirectUri = `${getServerOrigin()}/api/meta/callback`;

    useEffect(() => {
        (async () => {
            try {
                const res = await crmApi.getIntegrationConfig('meta');
                const cfg = res.data?.config || {};
                setConfig({
                    appId: cfg.appId || '',
                    appSecret: cfg.appSecret || '',
                    webhookVerifyToken: cfg.webhookVerifyToken || '',
                    redirectUri: cfg.redirectUri || defaultRedirectUri,
                });
            } catch {
                setConfig(prev => ({ ...prev, redirectUri: defaultRedirectUri }));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setToast(null);
        try {
            await crmApi.updateIntegrationConfig('meta', config);
            setToast({ type: 'success', msg: 'Meta credentials saved successfully.' });
        } catch {
            setToast({ type: 'error', msg: 'Failed to save credentials. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center h-full">
                <Loader className="w-6 h-6 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-semibold ${
                    toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                    {toast.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    {toast.msg}
                </div>
            )}

            {/* Meta Ads Integration */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100">
                    <div className="w-10 h-10 bg-[#1877F2] rounded-xl flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Meta Ads (Facebook / Instagram)</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Import leads directly from Meta Lead Ads into your CRM</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800">
                        <p className="font-bold mb-1">How to set up</p>
                        <ol className="list-decimal list-inside space-y-1 text-blue-700 font-medium">
                            <li>Create a Meta App at <span className="font-mono bg-blue-100 px-1 rounded">developers.facebook.com</span></li>
                            <li>Add <strong>Facebook Login</strong> and <strong>Marketing API</strong> products</li>
                            <li>Set the OAuth Redirect URI to the value shown below</li>
                            <li>Copy your App ID and App Secret here, then save</li>
                        </ol>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">App ID</label>
                            <input
                                type="text"
                                value={config.appId}
                                onChange={e => setConfig(p => ({ ...p, appId: e.target.value }))}
                                placeholder="1234567890"
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">App Secret</label>
                            <div className="relative">
                                <input
                                    type={showSecret ? 'text' : 'password'}
                                    value={config.appSecret}
                                    onChange={e => setConfig(p => ({ ...p, appSecret: e.target.value }))}
                                    placeholder={MASKED}
                                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 pr-12 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSecret(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Webhook Verify Token</label>
                            <div className="relative">
                                <input
                                    type={showToken ? 'text' : 'password'}
                                    value={config.webhookVerifyToken}
                                    onChange={e => setConfig(p => ({ ...p, webhookVerifyToken: e.target.value }))}
                                    placeholder="your-secret-verify-token"
                                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 pr-12 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowToken(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 px-1">A secret string you choose — paste this into Meta Webhooks → Verify Token</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">OAuth Redirect URI</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={config.redirectUri}
                                    onChange={e => setConfig(p => ({ ...p, redirectUri: e.target.value }))}
                                    className="flex-1 bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-mono text-gray-600 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText(config.redirectUri)}
                                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-600 transition-colors whitespace-nowrap"
                                >
                                    Copy
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 px-1">Add this URL to your Meta App's Valid OAuth Redirect URIs</p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleSave}
                            variant="primary"
                            disabled={saving}
                            className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20"
                        >
                            {saving ? 'Saving…' : 'Save Credentials'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
