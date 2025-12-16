import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { EditorProvider } from '../../contexts/EditorContext';
import EditablePage from './EditablePage';
import cmsEditorService from '../../services/cmsEditorService';
import cmsService from '../../services/cmsService';
import { useAuth } from '../../hooks/useAuth';

// Mock the services
jest.mock('../../services/cmsEditorService');
jest.mock('../../services/cmsService');
jest.mock('../../hooks/useAuth');

// Mock children components
jest.mock('./EditableField', () => {
  return jest.fn(({ fieldKey, defaultValue, editorContext }) => {
    const { isEditMode, updateFieldValue } = editorContext || { isEditMode: false };
    const field = editorContext?.pageContent?.fields?.find(f => f.key === fieldKey);
    const value = field?.value || defaultValue;
    
    if (isEditMode) {
      return (
        <div data-testid={`editable-field-${fieldKey}`}>
          <input
            type="text"
            value={value}
            onChange={e => updateFieldValue(fieldKey, e.target.value)}
            data-testid={`input-${fieldKey}`}
          />
        </div>
      );
    }
    
    return <div data-testid={`field-${fieldKey}`}>{value}</div>;
  });
});

jest.mock('./EditorToolbar', () => {
  return jest.fn(({ isEditMode, hasUnsavedChanges, onSave, onPublish, onVersionPreview, onVersionRestore }) => (
    <div data-testid="editor-toolbar">
      <div data-testid="editor-mode">{isEditMode ? 'Edit Mode' : 'View Mode'}</div>
      <div data-testid="unsaved-changes">{hasUnsavedChanges ? 'Unsaved' : 'Saved'}</div>
      <button data-testid="save-button" onClick={onSave}>Save</button>
      <button data-testid="publish-button" onClick={onPublish}>Publish</button>
      <button 
        data-testid="version-history-button" 
        onClick={() => {
          // Simulate opening version history panel and selecting a version
          const mockVersion = {
            id: 'version-1',
            versionNumber: 1,
            title: 'Test Version',
            fields: [
              { key: 'title', value: 'Previous Title', type: 'text' },
              { key: 'content', value: '<p>Previous content</p>', type: 'richText' }
            ]
          };
          onVersionPreview(mockVersion);
        }}
      >
        Version History
      </button>
      <button 
        data-testid="restore-version-button" 
        onClick={() => onVersionRestore(1)}
      >
        Restore Version
      </button>
    </div>
  ));
});

describe('Editor Integration Tests', () => {
  // Set up common test data
  const mockPageContent = {
    id: 'page-1',
    contentTypeId: 'ct-1',
    contentTypeSlug: 'page',
    title: 'Test Page',
    slug: 'test-page',
    status: 'draft',
    fields: [
      { id: 'f1', key: 'title', name: 'Title', type: 'text', value: 'Test Title', isRequired: true },
      { id: 'f2', key: 'content', name: 'Content', type: 'richText', value: '<p>Test content</p>', isRequired: true }
    ],
    publishedAt: null
  };
  
  const mockVersions = {
    versions: [
      {
        id: 'v1',
        versionNumber: 1,
        title: 'Previous Version',
        status: 'draft',
        createdAt: '2025-06-18T10:00:00Z',
        createdBy: { id: 'user1', username: 'user1', firstName: 'John', lastName: 'Doe' }
      }
    ],
    pagination: { total: 1, page: 1, limit: 10, pages: 1 }
  };
  
  const mockVersionContent = {
    id: 'page-1',
    contentTypeId: 'ct-1',
    contentTypeSlug: 'page',
    title: 'Previous Title',
    slug: 'test-page',
    status: 'draft',
    fields: [
      { id: 'f1', key: 'title', name: 'Title', type: 'text', value: 'Previous Title', isRequired: true },
      { id: 'f2', key: 'content', name: 'Content', type: 'richText', value: '<p>Previous content</p>', isRequired: true }
    ],
    versionId: 'v1',
    versionNumber: 1
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth hook to return admin user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user1', username: 'admin', role: 'admin' }
    });
    
    // Mock service methods
    (cmsEditorService.getPageContent as jest.Mock).mockResolvedValue(mockPageContent);
    (cmsEditorService.savePageContent as jest.Mock).mockResolvedValue({ ...mockPageContent, updatedAt: new Date().toISOString() });
    (cmsEditorService.publishPageContent as jest.Mock).mockResolvedValue(undefined);
    (cmsEditorService.getVersionHistory as jest.Mock).mockResolvedValue(mockVersions);
    (cmsEditorService.getVersion as jest.Mock).mockResolvedValue(mockVersionContent);
    (cmsEditorService.restoreVersion as jest.Mock).mockResolvedValue(undefined);
  });
  
  test('complete editing workflow from loading to saving', async () => {
    render(
      <EditorProvider>
        <EditablePage contentId="page-1" contentTypeSlug="page">
          <div>
            <h1 data-testid="editable-title">Title: {{title}}</h1>
            <div data-testid="editable-content">Content: {{content}}</div>
          </div>
        </EditablePage>
      </EditorProvider>
    );
    
    // Wait for page content to load
    await waitFor(() => {
      expect(cmsEditorService.getPageContent).toHaveBeenCalledWith('page-1');
    });
    
    // Initially in view mode with no unsaved changes
    expect(screen.getByTestId('editor-mode')).toHaveTextContent('View Mode');
    expect(screen.getByTestId('unsaved-changes')).toHaveTextContent('Saved');
    
    // Toggle to edit mode
    const editModeEvent = new Event('editModeToggle');
    act(() => {
      document.dispatchEvent(editModeEvent);
    });
    
    // Check if fields are editable
    await waitFor(() => {
      expect(screen.getByTestId('input-title')).toBeInTheDocument();
    });
    
    // Update a field
    fireEvent.change(screen.getByTestId('input-title'), { 
      target: { value: 'Updated Title' } 
    });
    
    // Should show unsaved changes
    expect(screen.getByTestId('unsaved-changes')).toHaveTextContent('Unsaved');
    
    // Save changes
    fireEvent.click(screen.getByTestId('save-button'));
    
    // Verify save was called with updated content
    await waitFor(() => {
      expect(cmsEditorService.savePageContent).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'page-1',
          fields: expect.arrayContaining([
            expect.objectContaining({ key: 'title', value: 'Updated Title' })
          ])
        })
      );
    });
    
    // Should show saved status after saving
    expect(screen.getByTestId('unsaved-changes')).toHaveTextContent('Saved');
  });
  
  test('version history workflow', async () => {
    render(
      <EditorProvider>
        <EditablePage contentId="page-1" contentTypeSlug="page">
          <div>
            <h1 data-testid="editable-title">Title: {{title}}</h1>
            <div data-testid="editable-content">Content: {{content}}</div>
          </div>
        </EditablePage>
      </EditorProvider>
    );
    
    // Wait for page content to load
    await waitFor(() => {
      expect(cmsEditorService.getPageContent).toHaveBeenCalledWith('page-1');
    });
    
    // Open version history and preview a version
    fireEvent.click(screen.getByTestId('version-history-button'));
    
    // Verify version preview was called
    await waitFor(() => {
      expect(screen.getByTestId('field-title')).toHaveTextContent('Previous Title');
    });
    
    // Restore version
    fireEvent.click(screen.getByTestId('restore-version-button'));
    
    // Verify restore was called
    await waitFor(() => {
      expect(cmsEditorService.restoreVersion).toHaveBeenCalledWith('page-1', 1);
    });
    
    // Verify content was reloaded after restore
    expect(cmsEditorService.getPageContent).toHaveBeenCalledTimes(2);
  });
  
  test('publishing workflow', async () => {
    render(
      <EditorProvider>
        <EditablePage contentId="page-1" contentTypeSlug="page">
          <div>
            <h1 data-testid="editable-title">Title: {{title}}</h1>
            <div data-testid="editable-content">Content: {{content}}</div>
          </div>
        </EditablePage>
      </EditorProvider>
    );
    
    // Wait for page content to load
    await waitFor(() => {
      expect(cmsEditorService.getPageContent).toHaveBeenCalledWith('page-1');
    });
    
    // Publish the page
    fireEvent.click(screen.getByTestId('publish-button'));
    
    // Verify publish was called
    await waitFor(() => {
      expect(cmsEditorService.publishPageContent).toHaveBeenCalledWith('page-1');
    });
    
    // Verify content was reloaded after publish
    expect(cmsEditorService.getPageContent).toHaveBeenCalledTimes(2);
  });
});