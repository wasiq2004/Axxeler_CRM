import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, User, ChevronDown, Settings as SettingsIcon, X, AlertCircle, Clock, CheckCircle, LogOut } from 'lucide-react';
import { useUI } from '../../contexts/UIContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import GlobalSearch from '@/components/common/GlobalSearch';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { logout, user } = useAuth();
  const currentUser = user;
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const { openCreateLeadModal } = useUI();
  const navigate = useNavigate();
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileSettings = () => {
    navigate('/settings');
    setProfileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setProfileMenuOpen(false);
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invoice_overdue':
        return <div className="p-1.5 rounded-lg bg-rose-50"><AlertCircle className="w-4 h-4 text-rose-500" /></div>;
      case 'invoice_due_soon':
        return <div className="p-1.5 rounded-lg bg-amber-50"><Clock className="w-4 h-4 text-amber-500" /></div>;
      case 'payment_received':
        return <div className="p-1.5 rounded-lg bg-emerald-50"><CheckCircle className="w-4 h-4 text-emerald-500" /></div>;
      default:
        return <div className="p-1.5 rounded-lg bg-cyan-50"><Bell className="w-4 h-4 text-cyan-500" /></div>;
    }
  };

  const recentNotifications = notifications
    .filter(n => !n.isRead)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <header className="h-16 shrink-0 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-6 sm:px-8 sticky top-0 z-20 transition-all duration-300">
      {/* Left side */}
      <div className="flex items-center gap-4 flex-1 mr-6">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all focus:outline-none shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
        <GlobalSearch />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative" ref={notificationsDropdownRef}>
            <button
              onClick={() => setNotificationsOpen(!isNotificationsOpen)}
              className="p-2.5 text-slate-500 hover:text-primary hover:bg-blue-50 rounded-xl transition-all relative group"
              aria-label="Notifications"
            >
              <Bell className="w-[22px] h-[22px] group-hover:scale-110 transition-transform" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-4 w-[360px] bg-white rounded-2xl shadow-2xl shadow-slate-200/80 animate-fadeIn ring-1 ring-slate-200/60 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900">Recent Notifications</h3>
                  <Link
                    to="/notifications"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-xs font-bold text-primary hover:text-primary-dark"
                  >
                    View detail
                  </Link>
                </div>

                {recentNotifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">Everything up to date!</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    {recentNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="p-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <h4 className="text-sm font-bold text-slate-900 truncate">
                                {notification.title}
                              </h4>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                {formatDate(notification.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed truncate">
                              {notification.message}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-4 bg-slate-50/50 text-center border-t border-slate-100">
                  <Link
                    to="/notifications"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-xs font-bold text-primary hover:text-primary-dark uppercase tracking-wider"
                  >
                    Clear all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Profile */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
            aria-label="User profile"
          >
            <div className="relative">
              <img src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=6366F1&color=fff`} alt={currentUser?.name || 'User'} className="w-9 h-9 rounded-xl object-cover ring-2 ring-white shadow-md" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-bold text-slate-900 tracking-tight leading-none mb-1">{currentUser?.name || 'User'}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{currentUser?.role?.replace('_', ' ') || 'User'}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-4 w-56 bg-white rounded-2xl shadow-2xl shadow-slate-200/80 animate-fadeIn ring-1 ring-slate-200/60 py-2 z-50">
              <div className="px-5 py-3 border-b border-slate-50 mb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Signed in as</p>
                <p className="text-sm font-bold text-slate-900 truncate">{currentUser?.email || ''}</p>
              </div>

              <button
                onClick={handleProfileSettings}
                className="w-full text-left flex items-center px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-primary hover:bg-blue-50 transition-colors"
              >
                <SettingsIcon className="w-4 h-4 mr-3" />
                Profile Settings
              </button>

              <button
                className="w-full text-left flex items-center px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-primary hover:bg-blue-50 transition-colors"
              >
                <User className="w-4 h-4 mr-3" />
                Security Logs
              </button>

              <div className="h-px bg-slate-50 my-2" />

              <button
                onClick={handleLogout}
                className="w-full text-left flex items-center px-5 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
