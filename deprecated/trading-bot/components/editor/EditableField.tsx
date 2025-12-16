import React from 'react';
import RichTextEditor from './RichTextEditor';

interface EditorContextValue {
  isEditMode: boolean;
  pageContent: any;
  updateFieldValue: (fieldKey: string, value: any) => void;
}

interface EditableFieldProps {
  fieldKey: string;
  defaultValue?: string;
  className?: string;
  editorContext?: EditorContextValue;
}

const EditableField: React.FC<EditableFieldProps> = ({
  fieldKey,
  defaultValue = '',
  className = '',
  editorContext
}) => {
  // If no editor context is provided, just render the default value
  if (!editorContext) {
    return <div className={className}>{defaultValue}</div>;
  }

  const { isEditMode, pageContent, updateFieldValue } = editorContext;

  // Find the field in the page content
  const field = pageContent?.fields?.find((f: any) => f.key === fieldKey);
  
  // If the field is not found, use the default value
  const fieldValue = field?.value ?? defaultValue;
  const fieldType = field?.type ?? 'text';

  // Handle change for text inputs
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateFieldValue(fieldKey, e.target.value);
  };

  // Render edit mode
  if (isEditMode) {
    switch (fieldType) {
      case 'text':
        return (
          <div className="editable-field-container">
            <label className="sr-only" htmlFor={`edit-field-${fieldKey}`}>Edit {field?.name || fieldKey}</label>
            <input
              id={`edit-field-${fieldKey}`}
              type="text"
              value={fieldValue}
              onChange={handleTextChange}
              placeholder={`Edit ${field?.name || fieldKey}`}
              aria-label={`Edit ${field?.name || fieldKey}`}
              className={`editable-field editable-field--text p-1 border border-light-accent dark:border-dark-accent rounded ${className}`}
            />
          </div>
        );
      
      case 'richText':
        // Use the rich text editor component
        return (
          <RichTextEditor
            value={fieldValue}
            onChange={(content) => updateFieldValue(fieldKey, content)}
            className={`editable-field editable-field--richtext ${className}`}
          />
        );
      
      case 'image':
        // Simple image field - just show URL input for now
        // In a later phase, this would include media library integration
        return (
          <div className={`editable-field editable-field--image ${className}`}>
            {fieldValue && (
              <img 
                src={fieldValue} 
                alt="Field content" 
                className="max-w-full h-auto mb-2"
              />
            )}
            <input
              type="text"
              value={fieldValue}
              onChange={handleTextChange}
              className="p-1 border border-light-accent dark:border-dark-accent rounded w-full"
              placeholder="Image URL"
            />
          </div>
        );
      
      case 'number':
        return (
          <div className="editable-field-container">
            <label className="sr-only" htmlFor={`edit-field-${fieldKey}-number`}>Edit {field?.name || fieldKey}</label>
            <input
              id={`edit-field-${fieldKey}-number`}
              type="number"
              value={fieldValue}
              onChange={handleTextChange}
              placeholder={`Edit ${field?.name || fieldKey}`}
              aria-label={`Edit ${field?.name || fieldKey}`}
              className={`editable-field editable-field--number p-1 border border-light-accent dark:border-dark-accent rounded ${className}`}
            />
          </div>
        );
      
      case 'boolean':
        return (
          <label className={`editable-field editable-field--boolean flex items-center ${className}`}>
            <input
              type="checkbox"
              checked={Boolean(fieldValue)}
              onChange={(e) => updateFieldValue(fieldKey, e.target.checked)}
              className="mr-2"
            />
            <span>Toggle value</span>
          </label>
        );
      
      // Additional field types would be added in later phases
      
      default:
        return (
          <div className="editable-field-container">
            <label className="sr-only" htmlFor={`edit-field-${fieldKey}-default`}>Edit {field?.name || fieldKey}</label>
            <input
              id={`edit-field-${fieldKey}-default`}
              type="text"
              value={fieldValue}
              onChange={handleTextChange}
              placeholder={`Edit ${field?.name || fieldKey}`}
              aria-label={`Edit ${field?.name || fieldKey}`}
              className={`editable-field p-1 border border-light-accent dark:border-dark-accent rounded ${className}`}
            />
          </div>
        );
    }
  }
  
  // Render view mode
  return (
    <div className={`editable-field ${className} ${isEditMode ? 'editable-field--highlight' : ''}`}>
      {fieldType === 'richText' ? (
        // For rich text, render HTML content
        <div dangerouslySetInnerHTML={{ __html: fieldValue }} />
      ) : fieldType === 'image' ? (
        // For images, render the image with error handling
        fieldValue ? (
          <div className="image-container relative">
            <img
              src={fieldValue}
              alt="Field content"
              className="max-w-full h-auto"
              onError={(e) => {
                console.log('Image failed to load:', fieldValue);
                // Use a reliable fallback image from constants
                e.currentTarget.src = 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800';
              }}
              loading="eager"
            />
          </div>
        ) : (
          // Placeholder for empty image
          <div className="bg-gray-200 dark:bg-gray-700 h-32 flex items-center justify-center text-gray-500 dark:text-gray-400">
            No image available
          </div>
        )
      ) : fieldType === 'boolean' ? (
        // For boolean, render yes/no
        fieldValue ? 'Yes' : 'No'
      ) : (
        // For all other types, render as text
        fieldValue
      )}
    </div>
  );
};

export default EditableField;