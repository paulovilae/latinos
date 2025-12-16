import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EditableField from './EditableField';
import RichTextEditor from './RichTextEditor';

// Mock the RichTextEditor component
jest.mock('./RichTextEditor', () => {
  return jest.fn(({ value, onChange, className }) => (
    <div 
      data-testid="mock-rich-text-editor" 
      className={className}
      data-value={value}
    >
      <button 
        data-testid="mock-rich-text-change" 
        onClick={() => onChange('<p>Updated content</p>')}
      >
        Update Content
      </button>
    </div>
  ));
});

describe('EditableField', () => {
  // Reset mocks
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('renders default value when no editor context is provided', () => {
    render(<EditableField fieldKey="title" defaultValue="Default Title" />);
    
    expect(screen.getByText('Default Title')).toBeInTheDocument();
  });

  test('renders field value from editor context in view mode', () => {
    const mockEditorContext = {
      isEditMode: false,
      pageContent: {
        fields: [
          { key: 'title', value: 'Content Title', type: 'text' }
        ]
      },
      updateFieldValue: jest.fn()
    };

    render(
      <EditableField 
        fieldKey="title" 
        defaultValue="Default Title" 
        editorContext={mockEditorContext} 
      />
    );
    
    expect(screen.getByText('Content Title')).toBeInTheDocument();
  });

  test('renders text input in edit mode for text fields', () => {
    const mockEditorContext = {
      isEditMode: true,
      pageContent: {
        fields: [
          { key: 'title', value: 'Content Title', type: 'text' }
        ]
      },
      updateFieldValue: jest.fn()
    };

    render(
      <EditableField 
        fieldKey="title" 
        defaultValue="Default Title" 
        editorContext={mockEditorContext} 
      />
    );
    
    const input = screen.getByDisplayValue('Content Title');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('type', 'text');
  });

  test('renders rich text editor in edit mode for richText fields', () => {
    const mockEditorContext = {
      isEditMode: true,
      pageContent: {
        fields: [
          { key: 'content', value: '<p>Rich text content</p>', type: 'richText' }
        ]
      },
      updateFieldValue: jest.fn()
    };

    render(
      <EditableField 
        fieldKey="content" 
        defaultValue="<p>Default content</p>" 
        editorContext={mockEditorContext} 
      />
    );
    
    expect(screen.getByTestId('mock-rich-text-editor')).toBeInTheDocument();
    expect(RichTextEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        value: '<p>Rich text content</p>',
      }),
      expect.anything()
    );
  });

  test('renders image field in edit mode', () => {
    const mockEditorContext = {
      isEditMode: true,
      pageContent: {
        fields: [
          { key: 'image', value: 'https://example.com/image.jpg', type: 'image' }
        ]
      },
      updateFieldValue: jest.fn()
    };

    render(
      <EditableField 
        fieldKey="image" 
        defaultValue="" 
        editorContext={mockEditorContext} 
      />
    );
    
    const img = screen.getByAltText('Field content');
    const input = screen.getByDisplayValue('https://example.com/image.jpg');
    
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(input).toBeInTheDocument();
  });

  test('renders checkbox in edit mode for boolean fields', () => {
    const mockEditorContext = {
      isEditMode: true,
      pageContent: {
        fields: [
          { key: 'isActive', value: true, type: 'boolean' }
        ]
      },
      updateFieldValue: jest.fn()
    };

    render(
      <EditableField 
        fieldKey="isActive" 
        defaultValue={false} 
        editorContext={mockEditorContext} 
      />
    );
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
  });

  test('calls updateFieldValue when text input changes', () => {
    const mockUpdateFieldValue = jest.fn();
    const mockEditorContext = {
      isEditMode: true,
      pageContent: {
        fields: [
          { key: 'title', value: 'Content Title', type: 'text' }
        ]
      },
      updateFieldValue: mockUpdateFieldValue
    };

    render(
      <EditableField 
        fieldKey="title" 
        defaultValue="Default Title" 
        editorContext={mockEditorContext} 
      />
    );
    
    const input = screen.getByDisplayValue('Content Title');
    fireEvent.change(input, { target: { value: 'Updated Title' } });
    
    expect(mockUpdateFieldValue).toHaveBeenCalledWith('title', 'Updated Title');
  });

  test('calls updateFieldValue when rich text editor changes', () => {
    const mockUpdateFieldValue = jest.fn();
    const mockEditorContext = {
      isEditMode: true,
      pageContent: {
        fields: [
          { key: 'content', value: '<p>Rich text content</p>', type: 'richText' }
        ]
      },
      updateFieldValue: mockUpdateFieldValue
    };

    render(
      <EditableField 
        fieldKey="content" 
        defaultValue="<p>Default content</p>" 
        editorContext={mockEditorContext} 
      />
    );
    
    fireEvent.click(screen.getByTestId('mock-rich-text-change'));
    
    expect(mockUpdateFieldValue).toHaveBeenCalledWith('content', '<p>Updated content</p>');
  });

  test('renders "Yes" or "No" for boolean fields in view mode', () => {
    const mockEditorContext = {
      isEditMode: false,
      pageContent: {
        fields: [
          { key: 'isActive', value: true, type: 'boolean' }
        ]
      },
      updateFieldValue: jest.fn()
    };

    const { rerender } = render(
      <EditableField 
        fieldKey="isActive" 
        defaultValue={false} 
        editorContext={mockEditorContext} 
      />
    );
    
    expect(screen.getByText('Yes')).toBeInTheDocument();
    
    // Update the context with false value
    mockEditorContext.pageContent.fields[0].value = false;
    
    rerender(
      <EditableField 
        fieldKey="isActive" 
        defaultValue={false} 
        editorContext={mockEditorContext} 
      />
    );
    
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  test('uses defaultValue when field is not found in context', () => {
    const mockEditorContext = {
      isEditMode: true,
      pageContent: {
        fields: [
          { key: 'title', value: 'Content Title', type: 'text' }
        ]
      },
      updateFieldValue: jest.fn()
    };

    render(
      <EditableField 
        fieldKey="nonExistentField" 
        defaultValue="Default Value" 
        editorContext={mockEditorContext} 
      />
    );
    
    const input = screen.getByDisplayValue('Default Value');
    expect(input).toBeInTheDocument();
  });
});