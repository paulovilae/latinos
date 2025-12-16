import React from 'react';
import { useLanguage } from '../contexts/LanguageContext'; // If label is a key

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelKey?: string; // For i18n
  error?: string;
  containerClassName?: string;
}

const Input: React.FC<InputProps> = ({ label, labelKey, id, error, className = '', containerClassName = '', ...props }) => {
  const { t } = useLanguage();
  const displayLabel = labelKey ? t(labelKey) : label;
  
  const baseInputClasses = "mt-1 block w-full px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md shadow-sm placeholder-light-text-secondary dark:placeholder-dark-text-secondary focus:outline-none focus:ring-light-accent dark:focus:ring-dark-accent focus:border-light-accent dark:focus:border-dark-accent sm:text-sm text-light-text dark:text-dark-text";
  
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {displayLabel && <label htmlFor={id} className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">{displayLabel}</label>}
      <input
        id={id}
        className={`${baseInputClasses} ${error ? 'border-light-negative dark:border-dark-negative focus:ring-light-negative dark:focus:ring-dark-negative focus:border-light-negative dark:focus:border-dark-negative' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-light-negative dark:text-dark-negative">{error}</p>}
    </div>
  );
};

export default Input;