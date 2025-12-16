import React from 'react';
import { useLanguage, Locale } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (lang: Locale) => {
    setLanguage(lang);
  };

  const buttonClass = (lang: Locale) => `px-3 py-1 text-xs sm:text-sm rounded-md transition-colors font-medium
    ${language === lang 
      ? 'bg-light-accent dark:bg-dark-accent text-light-accent-text dark:text-dark-accent-text cursor-default' 
      : 'bg-light-card dark:bg-dark-card text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-border dark:hover:bg-dark-border hover:text-light-text dark:hover:text-dark-text'}`;

  return (
    <div className="flex items-center space-x-1 sm:space-x-2 p-1 bg-light-card dark:bg-dark-card rounded-md">
      <button
        onClick={() => handleLanguageChange('en')}
        className={buttonClass('en')}
        aria-pressed={language === 'en'}
        aria-label="Switch to English"
        disabled={language === 'en'}
      >
        EN
      </button>
      <button
        onClick={() => handleLanguageChange('es')}
        className={buttonClass('es')}
        aria-pressed={language === 'es'}
        aria-label="Switch to Spanish"
        disabled={language === 'es'}
      >
        ES
      </button>
    </div>
  );
};

export default LanguageSwitcher;
