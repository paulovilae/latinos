# WYSIWYG Rich Text Editor Implementation

This directory contains a complete WYSIWYG rich text editor implementation that integrates with our CMS backend and media system. The editor provides rich text editing, media management, version history, and a complete content editing workflow.

## Components

### RichTextEditor

The main rich text editor component built with React-Quill. Features include:

- Text formatting (bold, italic, underline, strikethrough)
- Lists (ordered and unordered)
- Headings (H1-H6)
- Alignment options (left, center, right, justify)
- Link insertion
- Image insertion with media library integration

### MediaSelector

A modal component that allows users to:
- View existing media assets from the CMS
- Upload new images directly to the media library
- Search and paginate through media assets
- Select images for insertion into the editor

### EditableField

A versatile component that handles rendering and editing of different field types:
- Plain text fields
- Rich text (WYSIWYG) fields
- Image fields
- Boolean fields (checkboxes)
- Number fields

### EditablePage

A page container that provides context for EditableField components:
- Loads content from the CMS
- Manages edit mode state
- Handles save and publish operations
- Provides version history functionality
- Coordinates communication between fields and the CMS

### EditorToolbar

The toolbar component that provides editing controls:
- Toggle edit mode
- Save changes
- Publish content
- Access version history
- Display editing status

### VersionHistoryPanel

Provides version history functionality:
- List of previous versions
- Version comparison
- Version preview
- Version restoration

### EditorDemo

A demonstration page that showcases all features of the WYSIWYG editor:
- Basic text editing
- Rich text formatting
- Media insertion and management
- Version history and comparison
- Save and publish workflow

## Usage

### Basic Usage

To make any content editable, wrap it in an `EditablePage` component and use `EditableField` components for individual fields:

```tsx
import { EditablePage, EditableField } from '../components/editor';
import { useEditor } from '../contexts/EditorContext';

const MyPage = () => {
  return (
    <EditablePage
      contentId="page-123"
      contentTypeSlug="page"
    >
      <div className="page-content">
        <h1><EditableField fieldKey="title" defaultValue="Default Title" /></h1>
        <div className="content">
          <EditableField fieldKey="content" defaultValue="<p>Default content</p>" />
        </div>
        <div className="featured-image">
          <EditableField fieldKey="featuredImage" defaultValue="" />
        </div>
        <div className="featured-toggle">
          <label>Featured: </label>
          <EditableField fieldKey="isFeatured" defaultValue={false} />
        </div>
      </div>
    </EditablePage>
  );
};
```

### Required Setup

1. Wrap your application (or the relevant parts) with the `EditorProvider`:

```tsx
import { EditorProvider } from '../contexts/EditorContext';

const App = () => {
  return (
    <EditorProvider>
      {/* Your app content */}
    </EditorProvider>
  );
};
```

2. Ensure the Auth context is available, as editor permissions are based on user roles:

```tsx
import { AuthProvider } from '../contexts/AuthContext';
import { EditorProvider } from '../contexts/EditorContext';

const App = () => {
  return (
    <AuthProvider>
      <EditorProvider>
        {/* Your app content */}
      </EditorProvider>
    </AuthProvider>
  );
};
```

### Field Types

The `EditableField` component automatically handles different field types:

```tsx
// Text field
<EditableField fieldKey="title" defaultValue="Default Title" />

// Rich text field
<EditableField fieldKey="content" defaultValue="<p>Default content</p>" />

// Image field
<EditableField fieldKey="image" defaultValue="" />

// Boolean field
<EditableField fieldKey="isActive" defaultValue={false} />

// Number field
<EditableField fieldKey="priority" defaultValue={0} />
```

### Custom Styling

You can add custom styling to any editable field:

```tsx
<EditableField 
  fieldKey="title" 
  defaultValue="Default Title" 
  className="custom-title-field"
/>
```

## Permissions System

The editor has a built-in permissions system based on user roles:

- **Admin users** (role: 'admin'): Can edit and publish content
- **Editor users** (role: 'editor'): Can edit content but not publish
- **Other users**: Can only view content

Permissions are checked in the `EditorProvider` using the `useAuth` hook.

## Version History

The version history system allows users to:

1. View a list of previous versions
2. Preview a specific version
3. Compare changes between versions
4. Restore to a previous version

Each time content is saved, a new version is created in the CMS with:
- Version number
- Timestamp
- User information
- Change notes (optional)

## Extending the Editor

### Adding New Field Types

To add support for new field types:

1. Update the `EditableField` component with a new case in the switch statement
2. Define the UI for both edit and view modes
3. Add appropriate onChange handlers

Example for adding a color picker field:

```tsx
case 'color':
  return (
    <div className={`editable-field editable-field--color ${className}`}>
      <input
        type="color"
        value={fieldValue}
        onChange={handleTextChange}
        className="p-1 border rounded"
      />
    </div>
  );
```

### Customizing the Rich Text Editor

The RichTextEditor component can be customized by modifying the modules and formats:

```tsx
// In RichTextEditor.tsx
const modules = {
  toolbar: {
    container: [
      // Customize toolbar options here
    ],
    handlers: {
      // Custom handlers
    }
  }
};

const formats = [
  // List of allowed formats
];
```

## API Integration

The editor integrates with the CMS backend through several service methods:

- `cmsEditorService.getPageContent(contentId)`: Load content for editing
- `cmsEditorService.savePageContent(content)`: Save changes
- `cmsEditorService.publishPageContent(contentId)`: Publish content
- `cmsEditorService.getVersionHistory(contentId)`: Get version history
- `cmsEditorService.getVersion(contentId, versionNumber)`: Get specific version
- `cmsEditorService.restoreVersion(contentId, versionNumber)`: Restore to a version

## Dependencies

The implementation requires:
- react-quill
- quill-image-uploader (optional, for enhanced functionality)

These have been added to the package.json file.

## Installation

After updating the code, run `npm install` to install the required dependencies.

## Testing

Comprehensive tests are available for all components:

- **Unit Tests**: Test individual components in isolation
  - `EditorContext.test.tsx`
  - `EditableField.test.tsx`
  - `RichTextEditor.test.tsx`

- **Integration Tests**: Test components working together
  - `integration.test.tsx`

Run tests with `npm test`.

## Demo

To see all features in action, visit the EditorDemo page at `/editor-demo`.