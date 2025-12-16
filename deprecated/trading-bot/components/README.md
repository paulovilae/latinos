# Frontend Components

This directory contains all React UI components for the AI Trading Bot Platform. These components form the building blocks of the application's user interface, providing a consistent look and feel while implementing the required functionality.

## Key Features

- **Dashboard Components**: Charts, metrics, and controls for the trading dashboard
- **Marketing Pages**: Home, products, testimonials, news, and contact pages
- **Authentication UI**: Login and registration forms
- **WYSIWYG Editor**: Rich text editor for content management
- **Shared UI Elements**: Buttons, cards, inputs, and other reusable components
- **Layout Components**: Navigation, sidebars, and page layouts

## Directory Structure

```
components/
├── dashboard/              # Dashboard-specific components
│   ├── TrainingPage.tsx    # User training interface
│   └── UserProgressCard.tsx  # User progress visualization
├── editor/                 # WYSIWYG editor components
│   ├── EditableField.tsx   # Editable content field
│   ├── EditablePage.tsx    # Container for editable content
│   ├── RichTextEditor.tsx  # Rich text editing interface
│   ├── MediaSelector.tsx   # Media library browser
│   └── ...                 # Other editor components
├── docs/                   # Documentation
├── BotConfigurationPage.tsx  # Bot setup interface
├── DashboardLayout.tsx     # Dashboard page layout
├── PerformancePage.tsx     # Performance metrics display
├── TechnicalAnalysisPage.tsx  # Market data visualization
├── LoginPage.tsx           # User authentication
├── RegisterPage.tsx        # User registration
└── ... (shared UI components)
```

## Component Categories

### Page Components
- **HomePage.tsx**: Landing page with marketing content
- **ProductsPage.tsx**: Product information and pricing
- **TestimonialsPage.tsx**: Customer testimonials
- **NewsPage.tsx**: Platform news and updates
- **ContactPage.tsx**: Contact form and information
- **LoginPage.tsx** & **RegisterPage.tsx**: Authentication interfaces
- **BotConfigurationPage.tsx**: Bot setup and customization
- **PerformancePage.tsx**: Trading performance visualization
- **TechnicalAnalysisPage.tsx**: Market data analysis tools

### Layout Components
- **DashboardLayout.tsx**: Layout for authenticated dashboard
- **Navbar.tsx**: Top navigation bar
- **Sidebar.tsx**: Dashboard sidebar navigation
- **Footer.tsx**: Page footer with links and information

### Shared UI Components
- **Button.tsx**: Reusable button component
- **Card.tsx**: Container component for content blocks
- **Input.tsx**: Form input elements
- **LoadingSpinner.tsx**: Loading indicator
- **ParallaxSection.tsx**: Parallax scrolling effect
- **ThemeSwitcher.tsx**: Toggle between light and dark modes
- **LanguageSwitcher.tsx**: Language selection component

### Editor Components
The `editor/` subdirectory contains components for the WYSIWYG content editor. See [Editor README](editor/README.md) for detailed documentation.

## Usage

Components are designed to be imported and used within the React application:

```tsx
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import DashboardLayout from '../components/DashboardLayout';
```

## Testing

Component tests are located alongside their implementation files with a `.test.tsx` extension. Run tests with:

```
npm test
```

## Integration with Backend

These components interact with the backend services through the API clients defined in the `/services` directory.