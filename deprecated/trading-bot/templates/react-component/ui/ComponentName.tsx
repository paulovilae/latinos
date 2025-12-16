import React from 'react';
import './ComponentName.css'; // Include if using CSS file

/**
 * Props interface for the ComponentName component
 */
interface ComponentNameProps {
  /**
   * Primary content or label
   */
  label: string;
  
  /**
   * Optional description or secondary content
   */
  description?: string;
  
  /**
   * Additional CSS class names
   */
  className?: string;
  
  /**
   * Whether the component is in a disabled state
   */
  disabled?: boolean;
  
  /**
   * Click handler
   */
  onClick?: () => void;
  
  /**
   * Additional props passed to the component
   */
  [x: string]: any;
}

/**
 * ComponentName - A reusable UI component
 * 
 * This component [describe what it does and when to use it].
 * 
 * @example
 * ```tsx
 * <ComponentName 
 *   label="Example Label"
 *   description="Example description"
 *   onClick={() => console.log('Clicked')}
 * />
 * ```
 */
const ComponentName: React.FC<ComponentNameProps> = ({
  label,
  description,
  className = '',
  disabled = false,
  onClick,
  ...props
}) => {
  // Handle click events
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };
  
  // Combine CSS classes
  const componentClasses = `component-name ${disabled ? 'disabled' : ''} ${className}`.trim();
  
  return (
    <div 
      className={componentClasses}
      onClick={handleClick}
      {...props}
    >
      <div className="component-name-label">{label}</div>
      
      {description && (
        <div className="component-name-description">{description}</div>
      )}
    </div>
  );
};

export default ComponentName;