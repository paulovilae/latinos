import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { APP_NAME_KEY } from '../constants';
import { FiMenu, FiX } from 'react-icons/fi';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { path: '/', labelKey: 'nav.home' },
    { path: '/products', labelKey: 'nav.products' },
    { path: '/news', labelKey: 'nav.news' },
    { path: '/testimonials', labelKey: 'nav.testimonials' },
    { path: '/contact', labelKey: 'nav.contact' },
  ];

  const commonLinkClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out";
  const activeLinkClasses = "bg-light-accent dark:bg-dark-accent text-light-accent-text dark:text-dark-accent-text";
  const inactiveLinkClasses = "text-light-text dark:text-dark-text hover:bg-light-card dark:hover:bg-dark-card hover:text-light-accent dark:hover:text-dark-accent";
  
  const getLinkClasses = ({ isActive }: { isActive: boolean }) => 
    `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`;

  return (
    <nav className="bg-light-bg dark:bg-dark-bg border-b border-light-border dark:border-dark-border shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <span className="text-2xl font-bold text-light-accent dark:text-dark-accent">{t(APP_NAME_KEY)}</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(link => (
              <NavLink key={link.path} to={link.path} className={getLinkClasses}>
                {t(link.labelKey)}
              </NavLink>
            ))}
          </div>
          <div className="hidden md:flex items-center space-x-2">
            {user ? (
              <>
                <NavLink to="/dashboard" className={getLinkClasses}>{t('nav.dashboard')}</NavLink>
                <button 
                  onClick={handleLogout} 
                  className={`${commonLinkClasses} ${inactiveLinkClasses} bg-light-negative/10 dark:bg-dark-negative/20 text-light-negative dark:text-dark-negative hover:bg-light-negative/20 dark:hover:bg-dark-negative/30`}
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={getLinkClasses}>{t('nav.login')}</NavLink>
                <NavLink 
                  to="/register" 
                  className={`${commonLinkClasses} bg-light-accent dark:bg-dark-accent text-light-accent-text dark:text-dark-accent-text hover:bg-light-accent-hover dark:hover:bg-dark-accent-hover`}
                >
                  {t('nav.register')}
                </NavLink>
              </>
            )}
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
          <div className="md:hidden flex items-center">
            <ThemeSwitcher />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="ml-2 inline-flex items-center justify-center p-2 rounded-md text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text hover:bg-light-card dark:hover:bg-dark-card focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map(link => (
              <NavLink key={link.path} to={link.path} className={({isActive}) => `${getLinkClasses({isActive})} block`} onClick={() => setIsMobileMenuOpen(false)}>
                {t(link.labelKey)}
              </NavLink>
            ))}
            <div className="mt-2 pt-2 border-t border-light-border dark:border-dark-border">
              {user ? (
                <>
                  <NavLink to="/dashboard" className={({isActive}) => `${getLinkClasses({isActive})} block`} onClick={() => setIsMobileMenuOpen(false)}>{t('nav.dashboard')}</NavLink>
                  <button 
                    onClick={handleLogout} 
                    className={`${commonLinkClasses} ${inactiveLinkClasses} block w-full text-left mt-1 bg-light-negative/10 dark:bg-dark-negative/20 text-light-negative dark:text-dark-negative hover:bg-light-negative/20 dark:hover:bg-dark-negative/30`}
                  >
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className={({isActive}) => `${getLinkClasses({isActive})} block`} onClick={() => setIsMobileMenuOpen(false)}>{t('nav.login')}</NavLink>
                  <NavLink 
                    to="/register" 
                    className={({isActive}) => `${getLinkClasses({isActive})} block mt-1 bg-light-accent dark:bg-dark-accent text-light-accent-text dark:text-dark-accent-text hover:bg-light-accent-hover dark:hover:bg-dark-accent-hover`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('nav.register')}
                  </NavLink>
                </>
              )}
            </div>
            <div className="mt-4 flex justify-center">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;