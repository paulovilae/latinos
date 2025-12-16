import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RichTextEditor from './RichTextEditor';
import MediaSelector from './MediaSelector';

// Mock dependencies
jest.mock('react-quill', () => {
  return jest.fn(({ value, onChange, modules, formats, placeholder }) => (
    <div data-testid="mock-quill" data-value={value} data-modules={JSON.stringify(modules)}>
      <textarea 
        defaultValue={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid="mock-quill-editor"
      />
      <button 
        data-testid="mock-image-button"
        onClick={() => modules?.toolbar?.handlers?.image()}
      >
        Add Image
      </button>
    </div>
  ));
});

jest.mock('./MediaSelector', () => {
  return jest.fn(({ onSelect, onCancel }) => (
    <div data-testid="mock-media-selector">
      <button 
        data-testid="mock-select-media"
        onClick={() => onSelect('https://example.com/image.jpg', 'image-123')}
      >
        Select Image
      </button>
      <button 
        data-testid="mock-cancel-media"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  ));
});

// Mock Quill
jest.mock('quill', () => {
  return {
    __esModule: true,
    default: class MockQuill {
      static register() {}
    }
  };
});

describe('RichTextEditor', () => {
  // Reset mocks
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('renders with provided value', () => {
    const handleChange = jest.fn();
    render(
      <RichTextEditor 
        value="<p>Initial content</p>"
        onChange={handleChange}
      />
    );
    
    expect(screen.getByTestId('mock-quill')).toBeInTheDocument();
    expect(screen.getByTestId('mock-quill')).toHaveAttribute('data-value', '<p>Initial content</p>');
    expect(screen.getByTestId('mock-quill-editor')).toHaveAttribute('defaultValue', '<p>Initial content</p>');
  });

  test('calls onChange when content changes', () => {
    const handleChange = jest.fn();
    render(
      <RichTextEditor 
        value="<p>Initial content</p>"
        onChange={handleChange}
      />
    );
    
    fireEvent.change(screen.getByTestId('mock-quill-editor'), { 
      target: { value: '<p>Updated content</p>' } 
    });
    
    expect(handleChange).toHaveBeenCalledWith('<p>Updated content</p>');
  });

  test('opens media selector when image button is clicked', () => {
    const handleChange = jest.fn();
    render(
      <RichTextEditor 
        value="<p>Initial content</p>"
        onChange={handleChange}
      />
    );
    
    // Initially, media selector should not be visible
    expect(screen.queryByTestId('mock-media-selector')).not.toBeInTheDocument();
    
    // Click the image button
    fireEvent.click(screen.getByTestId('mock-image-button'));
    
    // Media selector should now be visible
    expect(screen.getByTestId('mock-media-selector')).toBeInTheDocument();
  });

  test('closes media selector when cancel is clicked', () => {
    const handleChange = jest.fn();
    render(
      <RichTextEditor 
        value="<p>Initial content</p>"
        onChange={handleChange}
      />
    );
    
    // Open media selector
    fireEvent.click(screen.getByTestId('mock-image-button'));
    expect(screen.getByTestId('mock-media-selector')).toBeInTheDocument();
    
    // Click cancel button
    fireEvent.click(screen.getByTestId('mock-cancel-media'));
    
    // Media selector should be closed
    expect(screen.queryByTestId('mock-media-selector')).not.toBeInTheDocument();
  });

  test('applies custom class names', () => {
    const handleChange = jest.fn();
    render(
      <RichTextEditor 
        value="<p>Initial content</p>"
        onChange={handleChange}
        className="custom-editor-class"
      />
    );
    
    expect(screen.getByTestId('mock-quill').parentElement).toHaveClass('rich-text-editor');
    expect(screen.getByTestId('mock-quill').parentElement).toHaveClass('custom-editor-class');
  });

  test('configures quill with proper modules and handlers', () => {
    const handleChange = jest.fn();
    render(
      <RichTextEditor 
        value="<p>Initial content</p>"
        onChange={handleChange}
      />
    );
    
    const quillElement = screen.getByTestId('mock-quill');
    const modulesStr = quillElement.getAttribute('data-modules');
    const modules = JSON.parse(modulesStr);
    
    // Check toolbar configuration
    expect(modules.toolbar).toBeDefined();
    expect(modules.toolbar.container).toBeDefined();
    expect(modules.toolbar.handlers).toBeDefined();
    expect(modules.toolbar.handlers.image).toBeDefined();
    expect(modules.imageUploader).toBeDefined();
    expect(modules.imageUploader.showMediaSelector).toBeDefined();
  });

  test('handles media selection and inserts image', () => {
    // Mock Quill editor instance
    const mockQuillInstance = {
      getSelection: jest.fn().mockReturnValue({ index: 10, length: 0 }),
      getLength: jest.fn().mockReturnValue(20),
      insertEmbed: jest.fn(),
      setSelection: jest.fn()
    };
    
    // Mock getEditor method on ref
    const mockRef = {
      current: {
        getEditor: jest.fn().mockReturnValue(mockQuillInstance)
      }
    };
    
    // Replace React.useRef with our mock
    const originalUseRef = React.useRef;
    React.useRef = jest.fn().mockReturnValue(mockRef);
    
    const handleChange = jest.fn();
    render(
      <RichTextEditor 
        value="<p>Initial content</p>"
        onChange={handleChange}
      />
    );
    
    // Open media selector
    fireEvent.click(screen.getByTestId('mock-image-button'));
    
    // Select an image
    fireEvent.click(screen.getByTestId('mock-select-media'));
    
    // Media selector should be closed
    expect(screen.queryByTestId('mock-media-selector')).not.toBeInTheDocument();
    
    // Verify the image was inserted
    expect(mockQuillInstance.insertEmbed).toHaveBeenCalledWith(
      10, 'image', 'https://example.com/image.jpg'
    );
    
    // Verify the cursor was moved after the image
    expect(mockQuillInstance.setSelection).toHaveBeenCalledWith(11, 0);
    
    // Restore original useRef
    React.useRef = originalUseRef;
  });
});