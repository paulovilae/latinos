# Developer Guide: File Organization

This guide documents the file organization principles and patterns used in the AI Trading Bot Platform. Following these guidelines ensures consistency across the codebase and makes the project more maintainable.

## Table of Contents
- [Core Principles](#core-principles)
- [Directory Structure](#directory-structure)
- [Naming Conventions](#naming-conventions)
- [Component Templates](#component-templates)
- [Feature Organization](#feature-organization)
- [File Size Management](#file-size-management)
- [Documentation Standards](#documentation-standards)

## Core Principles

The AI Trading Bot Platform follows these file organization principles:

1. **Logical Grouping**: Related files should be grouped together in appropriate directories
2. **Folder Threshold**: Create a dedicated folder when a feature requires more than 5-7 files
3. **Clear Hierarchy**: Maintain a clear hierarchy with appropriate nesting (not too deep, not too flat)
4. **Discoverability**: Use consistent naming and README files to make components discoverable
5. **Separation of Concerns**: Keep distinct types of files (code, docs, tests) in appropriate subfolders
6. **File Size Management**: Split large files (>800 lines) into smaller, focused files
7. **Avoid Single-File Folders**: Don't create folders for single files - only group related files when there are multiple files

## Directory Structure

The project follows a clear directory structure:

```
/
├── components/              # React UI components
│   ├── dashboard/           # Dashboard-specific components
│   ├── editor/              # WYSIWYG editor components
│   └── ... (UI components)
├── contexts/                # React context providers
├── services/                # API service clients
├── hooks/                   # Custom React hooks
├── locales/                 # Internationalization files
├── backend/                 # Backend server implementation
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── models/          # Database models
│   │   ├── middlewares/     # Request processing middlewares
│   │   ├── routes/          # API route definitions
│   │   ├── utils/           # Utility functions
│   │   └── migrations/      # Database schema migrations
├── bot_microservice/        # Python bot implementation
│   ├── formula_manage/      # Formula scheduling and management
│   ├── formula_calc/        # Trading formula calculations
│   ├── data_retrival/       # Market data retrieval and caching
│   ├── order_manager/       # Trade order execution
│   └── api/                 # RESTful API endpoints for integration
├── startup/                 # Unified startup system
│   ├── scripts/             # Platform startup/shutdown scripts
│   └── docs/                # Startup system documentation
├── tests/                   # Test files organized by component
│   ├── components/          # Component tests
│   ├── services/            # Service tests
│   ├── backend/             # Backend tests
│   └── startup/             # Startup system tests
├── docs/                    # Project documentation
└── templates/               # Component templates
    ├── react-component/     # React component templates
    ├── service/             # Service templates
    └── backend/             # Backend component templates
```

## Naming Conventions

1. **Files and Directories**:
   - Use kebab-case for directory names: `startup-system/`, `user-management/`
   - Use PascalCase for React component files: `LoginPage.tsx`, `UserProgressCard.tsx`
   - Use camelCase for service, utility, and hook files: `authService.ts`, `useAuth.tsx`
   - Use kebab-case for configuration and documentation files: `platform-config.js`, `user-guide.md`

2. **Component Naming**:
   - React components should use PascalCase: `Button`, `Card`, `UserProgressCard`
   - Component directories should match the component name (if the component has multiple files)
   - Test files should follow the pattern: `ComponentName.test.tsx`
   - CSS files should follow the pattern: `ComponentName.css`

3. **Backend Naming**:
   - Controllers: `resourceName.controller.js`
   - Routes: `resourceName.routes.js`
   - Models: `resourceName.model.js`
   - Middleware: `featureName.middleware.js`
   - Utilities: `featureName.utils.js`

## Component Templates

The project provides standardized templates for creating new components and files. These templates are located in the `/templates` directory and include:

1. **React Component Templates**: `/templates/react-component/`
   - Page components
   - UI components
   - Dashboard widgets
   - Form components

2. **Service Templates**: `/templates/service/`
   - API service clients
   - Utility services

3. **Backend Templates**: `/templates/backend/`
   - Controllers
   - Routes
   - Models
   - Middleware

### Using Component Templates

1. Choose the appropriate template for your component type
2. Copy the template files to your target directory
3. Rename the files according to your component name (maintain the naming convention)
4. Replace placeholder content with your implementation
5. Ensure your implementation follows the project's coding standards

## Feature Organization

When implementing a new feature that requires multiple files:

1. Determine if the feature warrants its own directory (more than 5-7 files)
2. Create a dedicated directory with a descriptive name if needed
3. Add a README.md file explaining the feature's purpose and structure
4. Group related files into appropriate subdirectories:
   - `/docs/` - Documentation files
   - `/scripts/` - Utility and execution scripts
   - `/tests/` - Test files and test runners
5. Keep the most important/entry point files at the top level of the feature directory

## File Size Management

Large monolithic files make code harder to understand, navigate, and maintain. Follow these guidelines for managing file size:

1. **800-Line Threshold**: If a file exceeds 800 lines of code, it should be split into multiple smaller files
2. **Split by Functionality**: Divide large files based on logical functional areas
3. **Common Splitting Patterns**:
   - Split by feature/domain (e.g., auth-related functionality vs. data processing)
   - Split by layer (e.g., separate API endpoints from business logic)
   - Split by component type (e.g., separate hooks from component definitions)
4. **Maintain Cohesion**: Each resulting file should have a clear, focused purpose
5. **Index Files**: Consider creating index files to re-export from multiple smaller files

## Documentation Standards

Every significant directory should have its own README.md that explains:

1. The purpose of the directory and its contents
2. The structure of files and subdirectories
3. How to use the components or code in the directory
4. Any important patterns or conventions

Documentation should be kept up-to-date as code changes. When adding new files or directories, ensure appropriate documentation is created or updated.

## Root Directory Management

The project root directory should remain clean and navigable:

1. Only essential files should reside directly in the root directory:
   - Primary entry points (index.js, main.py, etc.)
   - Essential configuration (package.json, .env.example, etc.)
   - Root-level documentation (README.md, LICENSE)
   - Git-related files (.gitignore, .git/)
2. All other files should be organized in appropriate subdirectories
3. The root README.md should provide a clear overview of the project structure