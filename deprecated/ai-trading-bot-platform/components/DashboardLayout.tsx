import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FiMenu } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-light-bg dark:bg-dark-bg"> {/* Full height minus navbar */}
      {/* Static Sidebar for larger screens */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 pt-16"> {/* pt-16 to offset navbar */}
        <Sidebar />
      </div>

      {/* Mobile sidebar, toggled by state */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 flex z-40" role="dialog" aria-modal="true">
          {/* Off-canvas menu */}
          <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-light-bg dark:bg-dark-bg border-r border-light-border dark:border-dark-border z-50 animate-slide-in-left pt-16 shadow-xl">
            <Sidebar onLinkClick={() => setSidebarOpen(false)} />
          </div>
          {/* Overlay to close sidebar on click */}
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} aria-hidden="true"></div>
        </div>
      )}
      
      <main className="flex-1 md:pl-64 flex flex-col"> {/* Removed overflow-y-auto here, apply to content wrapper if needed */}
        <div className="sticky top-16 md:hidden p-2 sm:pl-3 sm:pt-3 bg-light-bg dark:bg-dark-bg border-b border-light-border dark:border-dark-border z-30"> {/* Ensure this is below main navbar */}
          <button
            type="button"
            className="p-2 inline-flex items-center justify-center rounded-md text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text focus:outline-none focus:ring-2 focus:ring-inset focus:ring-light-accent dark:focus:ring-dark-accent"
            onClick={() => setSidebarOpen(true)}
            aria-controls="mobile-sidebar"
            aria-expanded={sidebarOpen}
          >
            <span className="sr-only">Open sidebar</span>
            <FiMenu className="h-6 w-6" aria-hidden="true" />
          </button>
           <span className="ml-2 font-semibold text-light-text dark:text-dark-text">{t('nav.dashboard')} {user ? `- ${user.name}` : ''}</span>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6 lg:px-8"> {/* Content area scrolls */}
          <Outlet /> {/* This is where nested routes will render their components */}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;