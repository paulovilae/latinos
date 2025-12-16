import React from 'react';
import { SOCIAL_MEDIA_LINKS, APP_NAME_KEY } from '../constants';
import SocialLinks from './SocialLinks';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';

const FutureEnhancements: React.FC = () => {
  const { t } = useLanguage();
  // These could also be translation keys if needed
  const enhancements = [
    "Real-time data feeds via WebSockets.",
    "Advanced strategy backtesting module.",
    "Integration with more cryptocurrency exchanges and brokers.",
    "AI-powered portfolio optimization suggestions.",
    "Community forum for users to share strategies and insights.",
    "Mobile applications (iOS and Android).",
    "Enhanced AI models for predictive analysis.",
    "Gamification elements to encourage learning and engagement.",
    "Two-factor authentication and advanced security features.",
    "Direct API access for developers."
  ];

  return (
    <div className="mt-8">
      <h4 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">{t('footer.enhancementsTitle')}</h4>
      <ul className="list-disc list-inside text-sm text-light-text-secondary dark:text-dark-text-secondary space-y-1">
        {enhancements.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </div>
  );
};


const Footer: React.FC = () => {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-light-card dark:bg-dark-card border-t border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold text-light-accent dark:text-dark-accent mb-2">{t(APP_NAME_KEY)}</h3>
            <p className="text-sm">{t('appSubtitle') /* Add a generic subtitle key */}</p>
            <div className="mt-4">
              <SocialLinks links={SOCIAL_MEDIA_LINKS} />
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">{t('footer.quickLinks')}</h4>
            <ul className="space-y-1 text-sm">
              <li><a href="#/products" className="hover:text-light-accent dark:hover:text-dark-accent transition-colors">{t('nav.products')}</a></li>
              <li><a href="#/news" className="hover:text-light-accent dark:hover:text-dark-accent transition-colors">{t('nav.news')}</a></li>
              <li><a href="#/contact" className="hover:text-light-accent dark:hover:text-dark-accent transition-colors">{t('nav.contact')}</a></li>
              <li><a href="#/login" className="hover:text-light-accent dark:hover:text-dark-accent transition-colors">{t('nav.login')}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">{t('footer.legal')}</h4>
            <ul className="space-y-1 text-sm">
              <li><a href="#" className="hover:text-light-accent dark:hover:text-dark-accent transition-colors">{t('footer.privacyPolicy')}</a></li>
              <li><a href="#" className="hover:text-light-accent dark:hover:text-dark-accent transition-colors">{t('footer.termsOfService')}</a></li>
              <li><a href="#" className="hover:text-light-accent dark:hover:text-dark-accent transition-colors">{t('footer.disclaimer')}</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 my-8">
            <LanguageSwitcher />
            <ThemeSwitcher />
        </div>
        
        <div className="border-t border-light-border dark:border-dark-border pt-8">
          <FutureEnhancements />
        </div>
        <div className="mt-8 text-center text-xs">
          <p>{t('footer.copyright', { year, appName: t(APP_NAME_KEY) })}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;