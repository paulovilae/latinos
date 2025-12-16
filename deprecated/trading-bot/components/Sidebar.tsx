import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiBarChart2, FiActivity, FiSettings, FiLogOut, FiBookOpen } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { APP_NAME_KEY } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  onLinkClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLinkClick }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    if (onLinkClick) onLinkClick();
    navigate('/');
  };

  const navItems = [
    { nameKey: 'dashboard.sidebar.overview', path: '/dashboard/overview', icon: FiHome },
    { nameKey: 'dashboard.sidebar.analysis', path: '/dashboard/analysis', icon: FiBarChart2 },
    { nameKey: 'dashboard.sidebar.performance', path: '/dashboard/performance', icon: FiActivity },
    { nameKey: 'dashboard.sidebar.configure', path: '/dashboard/configure', icon: FiSettings },
    { nameKey: 'dashboard.sidebar.training', path: '/dashboard/training', icon: FiBookOpen }, // New
  ];

  const baseLinkClasses = "group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out";
  const activeLinkClasses = "bg-light-accent dark:bg-dark-accent text-light-accent-text dark:text-dark-accent-text";
  const inactiveLinkClasses = "text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-card dark:hover:bg-dark-card hover:text-light-accent dark:hover:text-dark-accent";

  const iconBaseClasses = "mr-3 flex-shrink-0 h-5 w-5";
  // Icon color will inherit from text color or can be set explicitly if needed

  return (
    <div className="flex flex-col flex-grow bg-light-bg dark:bg-dark-bg border-r border-light-border dark:border-dark-border p-4">
      <div className="flex items-center flex-shrink-0 px-2 mb-6">
        <span className="text-xl font-semibold text-light-accent dark:text-dark-accent">{t(APP_NAME_KEY)}</span>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.nameKey}
            to={item.path}
            onClick={onLinkClick}
            className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
          >
            <item.icon className={`${iconBaseClasses} ${ NavLink ? 'text-inherit' : 'text-inherit'}`} aria-hidden="true" />
            {t(item.nameKey)}
          </NavLink>
        ))}
      </nav>
      {user && (
        <div className="mt-auto pt-6 border-t border-light-border dark:border-dark-border">
          <div className="flex items-center mb-3 px-2">
            {/* Minimalist user display */}
            {/* <img className="h-8 w-8 rounded-full mr-2" src={`https://avatar.vercel.sh/${user.email}.svg?text=${user.name?.[0] || user.email[0]}`} alt="User avatar" /> */}
            <div>
              <p className="text-sm font-medium text-light-text dark:text-dark-text">{user.name || user.email}</p>
              {user.role === 'admin' && <p className="text-xs text-light-accent dark:text-dark-accent">{t('role.admin')}</p>}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`${baseLinkClasses} ${inactiveLinkClasses} w-full`}
          >
            <FiLogOut className={`${iconBaseClasses}`} aria-hidden="true" />
            {t('nav.logout')}
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;