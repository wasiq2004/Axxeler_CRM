import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_LINKS } from '../../constants';
import { X, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();

  const filteredNavLinks = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin') return NAV_LINKS;

    const managerAccess = ['Dashboard', 'Leads', 'Contacts', 'Deals', 'Tasks', 'Campaigns', 'Ads Sync', 'Reports', 'Notifications', 'Team', 'Settings'];
    const teamMemberAccess = ['Dashboard', 'Leads', 'Tasks', 'Contacts', 'Campaigns', 'Settings'];

    const allowedNames = user.role === 'manager' ? managerAccess : teamMemberAccess;

    return NAV_LINKS.filter(link => allowedNames.includes(link.name));
  }, [user]);

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-30 transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      ></div>

      <aside
        className={`w-64 bg-sidebar text-white flex flex-col fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto border-r border-gray-800 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-gray-700/50 bg-sidebar">
          <div className="flex items-center gap-3 w-full">
            <img src="/axxeler-logo-white.png" alt="Axxeler CRM" className="h-14 w-auto object-contain" />
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 overflow-y-auto">
          <ul className="space-y-1">
            {filteredNavLinks.map((link) => (
              <li key={link.name}>
                <NavLink
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-sidebar-hover'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <link.icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
                        }`} />
                      <span>{link.name}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

      </aside>
    </>
  );
};

export default Sidebar;
