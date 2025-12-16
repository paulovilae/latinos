import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  titleKey?: string; // For i18n
  actions?: React.ReactNode;
  titleClassName?: string;
  id?: string; // Added id property
}

// Dummy t function if useLanguage is not available or for simpler components
const dummyT = (key: string, _options?: any) => key;

const Card: React.FC<CardProps> = ({ children, className = '', title, titleKey, actions, titleClassName = '', id }) => {
  // In a real app, you might pass `t` as a prop or use context directly
  // For simplicity, assuming `t` is available globally or passed if needed.
  // const { t } = useLanguage(); // Or use a passed `t` prop
  const displayTitle = titleKey ? dummyT(titleKey) : title;

  return (
    <div id={id} className={`bg-light-card dark:bg-dark-card shadow-lg rounded-lg overflow-hidden ${className}`}>
      {displayTitle && (
        <div className={`px-4 py-3 border-b border-light-border dark:border-dark-border ${titleClassName}`}>
          <h3 className={`text-lg leading-6 font-medium text-light-text dark:text-dark-text`}>{displayTitle}</h3>
        </div>
      )}
      <div className="p-4 sm:p-6">
        {children}
      </div>
      {actions && (
        <div className="px-4 py-3 bg-light-bg dark:bg-dark-bg sm:px-6 border-t border-light-border dark:border-dark-border">
          {actions}
        </div>
      )}
    </div>
  );
};

export default Card;