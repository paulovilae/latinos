import React, { useState, useEffect } from 'react';
import './RichTextEditor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * A simplified rich text editor compatible with React 19
 * This is a fallback since react-quill has compatibility issues with React 19
 */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter content here...',
  className = ''
}) => {
  const [editorValue, setEditorValue] = useState<string>(value);

  // Sync with external value
  useEffect(() => {
    setEditorValue(value);
  }, [value]);

  // Handle editor change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setEditorValue(newValue);
    onChange(newValue);
  };

  return (
    <div className={`rich-text-editor-simple ${className}`}>
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button type="button" className="toolbar-button" title="Bold" onClick={() => onChange(wrapSelection(editorValue, '<strong>', '</strong>'))}>
            B
          </button>
          <button type="button" className="toolbar-button" title="Italic" onClick={() => onChange(wrapSelection(editorValue, '<em>', '</em>'))}>
            I
          </button>
          <button type="button" className="toolbar-button" title="Underline" onClick={() => onChange(wrapSelection(editorValue, '<u>', '</u>'))}>
            U
          </button>
        </div>
        <div className="toolbar-group">
          <button type="button" className="toolbar-button" title="Paragraph" onClick={() => onChange(wrapSelection(editorValue, '<p>', '</p>'))}>
            P
          </button>
          <button type="button" className="toolbar-button" title="Heading" onClick={() => onChange(wrapSelection(editorValue, '<h3>', '</h3>'))}>
            H
          </button>
        </div>
        <div className="toolbar-group">
          <button type="button" className="toolbar-button" title="List" onClick={() => onChange(wrapSelection(editorValue, '<ul>\n<li>', '</li>\n</ul>'))}>
            UL
          </button>
          <button type="button" className="toolbar-button" title="Link" onClick={() => onChange(wrapSelection(editorValue, '<a href="#">', '</a>'))}>
            🔗
          </button>
        </div>
      </div>
      <div className="editor-content">
        <textarea
          value={editorValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="editor-textarea"
          rows={10}
        />
      </div>
      <div className="preview-panel">
        <h4 className="preview-title">Preview:</h4>
        <div 
          className="preview-content" 
          dangerouslySetInnerHTML={{ __html: editorValue }}
        />
      </div>
    </div>
  );
};

// Helper function to wrap selected text with HTML tags
const wrapSelection = (text: string, before: string, after: string): string => {
  const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement;
  if (!textarea) return text;
  
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = text.substring(start, end);
  
  if (selectedText) {
    return text.substring(0, start) + before + selectedText + after + text.substring(end);
  } else {
    // If no selection, insert at cursor position
    return text.substring(0, start) + before + after + text.substring(end);
  }
};

export default RichTextEditor;