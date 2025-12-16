# Component Templates

This directory contains standardized templates for creating new components and files in the AI Trading Bot Platform. These templates ensure consistency across the codebase and make it easier for developers to follow the established patterns and conventions.

## Available Templates

- **[React Component Templates](./react-component/)**: Templates for creating various React components
- **[Service Templates](./service/)**: Templates for creating API services and utility services
- **[Backend Templates](./backend/)**: Templates for creating backend controllers, models, and routes
- **[Documentation Templates](./docs/)**: Templates for creating documentation files

## Usage

1. Copy the relevant template directory to your working directory
2. Rename files and directories as needed for your specific component
3. Replace placeholder values with your actual implementation
4. Follow the guidelines in the template's README.md file

## Template Structure

Each template directory contains:

- **README.md**: Usage instructions and best practices
- **Example files**: Starter code with documentation and patterns
- **Test files**: Example test implementations where applicable

## File Organization Principles

These templates follow the file organization principles documented in the [File Organization Guidelines](./../docs/DEVELOPER_GUIDE.md):

1. **Logical Grouping**: Related files are grouped together
2. **Folder Threshold**: Create a dedicated folder when a feature requires more than 5-7 files
3. **Clear Hierarchy**: Maintain a clear hierarchy with appropriate nesting
4. **Discoverability**: Use consistent naming and README files
5. **Separation of Concerns**: Keep distinct types of files in appropriate subfolders
6. **File Size Management**: Split large files into smaller, focused files
7. **Avoid Single-File Folders**: Don't create folders for single files

## Contributing

When adding new templates, ensure they follow the established patterns and include comprehensive documentation. Update this README.md file to reference any new template categories.