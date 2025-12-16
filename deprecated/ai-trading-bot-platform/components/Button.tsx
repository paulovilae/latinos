import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  className = '', 
  fullWidth = false,
  ...props 
}) => {
  const baseStyles = "font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-colors duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center";
  
  let variantStyles = '';
  // Light theme styles
  if (props.disabled) {
     variantStyles = 'bg-light-border dark:bg-dark-border text-light-text-secondary dark:text-dark-text-secondary';
  } else {
    switch (variant) {
      case 'primary': // Main call to action
        variantStyles = 'bg-light-accent dark:bg-dark-accent text-light-accent-text dark:text-dark-accent-text hover:bg-light-accent-hover dark:hover:bg-dark-accent-hover focus:ring-light-accent dark:focus:ring-dark-accent';
        break;
      case 'secondary': // Alternative action
        variantStyles = 'bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text hover:bg-light-border dark:hover:bg-dark-border border border-light-border dark:border-dark-border focus:ring-light-accent dark:focus:ring-dark-accent';
        break;
      case 'danger':
        variantStyles = 'bg-light-negative dark:bg-dark-negative text-white dark:text-dark-bg hover:opacity-80 focus:ring-light-negative dark:focus:ring-dark-negative';
        break;
      case 'outline':
        variantStyles = 'bg-transparent border border-light-accent dark:border-dark-accent text-light-accent dark:text-dark-accent hover:bg-light-accent/10 dark:hover:bg-dark-accent/20 focus:ring-light-accent dark:focus:ring-dark-accent';
        break;
      case 'ghost':
        variantStyles = 'bg-transparent text-light-accent dark:text-dark-accent hover:bg-light-accent/10 dark:hover:bg-dark-accent/20 focus:ring-light-accent dark:focus:ring-dark-accent';
        break;
    }
  }


  let sizeStyles = '';
  switch (size) {
    case 'sm':
      sizeStyles = 'px-3 py-1.5 text-xs';
      break;
    case 'md':
      sizeStyles = 'px-4 py-2 text-sm';
      break;
    case 'lg':
      sizeStyles = 'px-6 py-3 text-base';
      break;
  }
  
  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${widthStyles} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className={`animate-spin -ml-1 mr-3 h-5 w-5 ${variant === 'primary' ? 'text-light-accent-text dark:text-dark-accent-text' : 'text-light-accent dark:text-dark-accent'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : children}
    </button>
  );
};

export default Button;