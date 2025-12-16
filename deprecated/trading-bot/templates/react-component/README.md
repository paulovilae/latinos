# React Component Templates

This directory contains templates for creating new React components for the AI Trading Bot Platform. These templates follow the established patterns and coding standards used throughout the project.

## Available Templates

- **[Page Component](./page/)**: Template for creating full page components
- **[UI Component](./ui/)**: Template for creating reusable UI components
- **[Dashboard Widget](./dashboard-widget/)**: Template for creating dashboard-specific widgets
- **[Form Component](./form/)**: Template for creating input and form components

## Usage Guidelines

1. Choose the appropriate template for your component type
2. Copy the template files to your target directory
3. Rename the files according to your component name (maintain the naming convention)
4. Replace placeholder content with your implementation

## Best Practices

- Use TypeScript for type safety
- Create a test file for each component
- Keep components focused on a single responsibility
- Use props for configuration and customization
- Document props using JSDoc comments
- Follow the established styling patterns

## Component Structure

Each component should follow this general structure:

```tsx
import React from 'react';
import './ComponentName.css'; // If using CSS file

// Props interface
interface ComponentNameProps {
  prop1: string;
  prop2?: number;
}

/**
 * ComponentName - Description of what this component does
 */
const ComponentName: React.FC<ComponentNameProps> = ({ prop1, prop2 = 0 }) => {
  // Component logic here
  
  return (
    <div className="component-name">
      {/* JSX markup here */}
    </div>
  );
};

export default ComponentName;
```

## Testing

Each component should have a corresponding test file that:

- Verifies the component renders without errors
- Tests any interactive functionality
- Verifies proper prop handling
- Tests any conditional rendering

## Integration with Other Components

- Use consistent prop naming across related components
- Consider composition for complex components
- Follow the existing theme and style guidelines