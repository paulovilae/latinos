# Frontend Components - User Guide

This guide provides information on how to use and extend the frontend components in the AI Trading Bot Platform.

## Getting Started

### Using Existing Components

To use any component in your React application:

1. Import the component from its location:
   ```tsx
   import { Button } from '../components/Button';
   import { Card } from '../components/Card';
   ```

2. Use the component in your JSX:
   ```tsx
   function MyComponent() {
     return (
       <Card>
         <h2>My Card Title</h2>
         <p>Card content goes here</p>
         <Button onClick={handleClick}>Click Me</Button>
       </Card>
     );
   }
   ```

### Component Props

Each component accepts specific props that control its appearance and behavior. Here are common props for key components:

#### Button

```tsx
<Button 
  variant="primary" // primary, secondary, outline, text
  size="medium"     // small, medium, large
  onClick={handler} // click event handler
  disabled={false}  // disables the button when true
>
  Button Text
</Button>
```

#### Card

```tsx
<Card
  title="Card Title"   // optional card title
  elevated={true}      // adds drop shadow
  className="my-card"  // additional CSS classes
>
  Card content
</Card>
```

#### Input

```tsx
<Input
  type="text"          // text, email, password, number, etc.
  value={inputValue}   // controlled input value
  onChange={handler}   // change event handler
  placeholder="Enter text"
  required={true}      // HTML5 validation
  error="Error message" // shows error state with message
/>
```

## Layout Components

### DashboardLayout

The `DashboardLayout` component provides a consistent structure for dashboard pages:

```tsx
<DashboardLayout>
  <h1>Dashboard Page Title</h1>
  <p>Page content goes here</p>
</DashboardLayout>
```

This will render the content within the dashboard structure, including:
- Top navigation bar
- Sidebar navigation
- Main content area
- Proper spacing and responsive behavior

## Page Components

Page components represent full pages in the application. They typically:
- Handle their own data fetching
- Manage page-specific state
- Use layout components for structure
- Compose multiple smaller components

Example:

```tsx
// In your routes configuration
import PerformancePage from '../components/PerformancePage';

const routes = [
  {
    path: "/dashboard/performance",
    element: <PerformancePage />
  }
];
```

## Theming

### Using ThemeSwitcher

The `ThemeSwitcher` component allows users to toggle between light and dark themes:

```tsx
<ThemeSwitcher />
```

This will render a toggle button that changes the application theme.

### Accessing Theme in Your Components

You can access the current theme using the `useTheme` hook:

```tsx
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

## Internationalization

### Using LanguageSwitcher

The `LanguageSwitcher` component allows users to change the application language:

```tsx
<LanguageSwitcher />
```

### Accessing Translations

Use the `useLanguage` hook to access translations:

```tsx
import { useLanguage } from '../contexts/LanguageContext';

function MyComponent() {
  const { t, language, changeLanguage } = useLanguage();
  
  return (
    <div>
      <p>{t('welcome_message')}</p>
      <p>Current language: {language}</p>
      <button onClick={() => changeLanguage('es')}>Switch to Spanish</button>
    </div>
  );
}
```

## WYSIWYG Editor

The WYSIWYG editor allows content editing with a rich text interface. See the [Editor Documentation](../editor/README.md) for detailed usage instructions.

Basic example:

```tsx
import { EditablePage, EditableField } from '../components/editor';

function MyEditablePage() {
  return (
    <EditablePage contentId="page-123" contentTypeSlug="page">
      <h1><EditableField fieldKey="title" defaultValue="Default Title" /></h1>
      <div className="content">
        <EditableField fieldKey="content" defaultValue="<p>Default content</p>" />
      </div>
    </EditablePage>
  );
}
```

## Creating New Page Components

When creating new page components:

1. Create a new file in the components directory
2. Import necessary UI components and hooks
3. Define your component with proper TypeScript typing
4. Implement the component logic and rendering
5. Export the component

Example:

```tsx
// NewFeaturePage.tsx
import React, { useState, useEffect } from 'react';
import { Card, Button, LoadingSpinner } from '../components';
import { useAuth } from '../hooks/useAuth';
import { someService } from '../services/someService';

const NewFeaturePage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await someService.getData();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="new-feature-page">
      <h1>New Feature</h1>
      <p>Welcome, {user?.name}!</p>
      
      {data.map((item) => (
        <Card key={item.id} title={item.title}>
          <p>{item.description}</p>
          <Button onClick={() => handleItemAction(item.id)}>
            Take Action
          </Button>
        </Card>
      ))}
    </div>
  );
};

export default NewFeaturePage;
```

## Testing Components

When adding new components, include tests in a corresponding `.test.tsx` file:

```tsx
// NewFeaturePage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewFeaturePage from './NewFeaturePage';
import { someService } from '../services/someService';

// Mock the service
jest.mock('../services/someService');

describe('NewFeaturePage', () => {
  beforeEach(() => {
    someService.getData.mockResolvedValue([
      { id: 1, title: 'Test Item', description: 'Test Description' }
    ]);
  });

  it('renders loading state initially', () => {
    render(<NewFeaturePage />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays data when loaded', async () => {
    render(<NewFeaturePage />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Component Size**: Keep components focused on a single responsibility
2. **Props Interface**: Define TypeScript interfaces for component props
3. **Defaults**: Provide sensible default values for optional props
4. **Error Handling**: Include proper error states and fallbacks
5. **Accessibility**: Ensure components meet accessibility standards
6. **Responsiveness**: Test components across different screen sizes
7. **Performance**: Avoid unnecessary re-renders with React.memo when appropriate
8. **Documentation**: Add JSDoc comments for component props and functions