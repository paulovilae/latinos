import React, { useState, useEffect, ReactNode } from 'react';
import { useEditor } from '../../contexts/EditorContext';
import cmsEditorService, { EditorPageContent } from '../../services/cmsEditorService';
import EditorToolbar from './EditorToolbar';

interface EditablePageProps {
  contentId: string;
  contentTypeSlug: string;
  children: ReactNode;
  onLoad?: (content: EditorPageContent) => void;
  hideToolbar?: boolean; // Optional prop to hide the default toolbar
}

const EditablePage: React.FC<EditablePageProps> = ({
  contentId,
  contentTypeSlug,
  children,
  onLoad,
  hideToolbar = false // Default to false if not provided
}) => {
  const { editorState, setCurrentPage, markUnsavedChanges, canEdit } = useEditor();
  const [pageContent, setPageContent] = useState<EditorPageContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewingVersion, setPreviewingVersion] = useState<EditorPageContent | null>(null);
  const [isVersionPreviewing, setIsVersionPreviewing] = useState<boolean>(false);

  // Load page content function
  const loadContent = async () => {
    if (!contentId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const content = await cmsEditorService.getPageContent(contentId);
      setPageContent(content);
      setCurrentPage(contentId, contentTypeSlug);
      
      // Call onLoad callback if provided
      if (onLoad) {
        onLoad(content);
      }
    } catch (err) {
      console.error('Error loading page content:', err);
      
      // Special handling for demo page - don't show error if we have onLoad callback (mock data)
      if (contentId === 'editor-demo-page' && onLoad) {
        // Demo page will handle it with mock data
        console.log('Using mock data for demo page');
      } else {
        setError('Failed to load page content. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load page content when contentId changes or edit mode is toggled
  useEffect(() => {
    loadContent();
  }, [contentId, contentTypeSlug]);

  // Save content handler - to be passed to the toolbar
  const handleSave = async () => {
    if (!pageContent) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedContent = await cmsEditorService.savePageContent(pageContent);
      setPageContent(updatedContent);
      markUnsavedChanges(false);
      return true;
    } catch (err) {
      console.error('Error saving page content:', err);
      setError('Failed to save page content. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Publish content handler - to be passed to the toolbar
  const handlePublish = async () => {
    if (!pageContent) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First save any changes
      await cmsEditorService.savePageContent(pageContent);
      
      // Then publish
      await cmsEditorService.publishPageContent(pageContent.id);
      
      // Reload content to get updated status
      const updatedContent = await cmsEditorService.getPageContent(contentId);
      setPageContent(updatedContent);
      markUnsavedChanges(false);
      return true;
    } catch (err) {
      console.error('Error publishing page content:', err);
      setError('Failed to publish page content. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update a field value
  const updateFieldValue = (fieldKey: string, value: any) => {
    if (!pageContent) return;
    
    // If we're previewing a version, disallow edits
    if (isVersionPreviewing) return;
    
    // Create a new fields array with the updated value
    const updatedFields = pageContent.fields.map(field => {
      if (field.key === fieldKey) {
        return { ...field, value };
      }
      return field;
    });
    
    // Update page content
    setPageContent({
      ...pageContent,
      fields: updatedFields
    });
    
    // Mark that we have unsaved changes
    markUnsavedChanges(true);
  };
  
  // Handle version preview
  const handleVersionPreview = (version: EditorPageContent) => {
    setPreviewingVersion(version);
    setIsVersionPreviewing(true);
    
    // Update the editor context with the version content
    // but don't change the actual pageContent which holds our current draft
    setPageContent(version);
  };
  
  // Handle exiting version preview mode
  const exitVersionPreview = () => {
    setIsVersionPreviewing(false);
    
    // Reload the original content
    if (pageContent && previewingVersion) {
      loadContent();
    }
    
    setPreviewingVersion(null);
  };
  
  // Handle version restoration
  const handleVersionRestore = async (versionNumber: number) => {
    if (!contentId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await cmsEditorService.restoreVersion(contentId, versionNumber);
      
      // Exit preview mode
      setIsVersionPreviewing(false);
      setPreviewingVersion(null);
      
      // Reload content
      await loadContent();
      
      return Promise.resolve();
    } catch (err) {
      console.error(`Error restoring version ${versionNumber}:`, err);
      setError(`Failed to restore to version ${versionNumber}. Please try again.`);
      return Promise.reject(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create editor context to be passed down to children
  const editorContextValue = {
    isEditMode: editorState.isEditMode,
    pageContent,
    updateFieldValue
  };

  return (
    <div className="editable-page">
      {/* Only show toolbar if user can edit and hideToolbar is not true */}
      {canEdit && !hideToolbar && (
        <EditorToolbar
          isEditMode={editorState.isEditMode}
          isLoading={isLoading}
          hasUnsavedChanges={editorState.unsavedChanges}
          onSave={handleSave}
          onPublish={handlePublish}
          contentId={contentId}
          currentContent={pageContent}
          onVersionPreview={handleVersionPreview}
          onVersionRestore={handleVersionRestore}
        />
      )}
      
      {/* Show loading indicator */}
      {isLoading && (
        <div className="editable-page__loading bg-light-overlay dark:bg-dark-overlay fixed inset-0 flex items-center justify-center z-50 bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-light-accent dark:border-dark-accent"></div>
        </div>
      )}
      
      {/* Show error message */}
      {error && (
        <div className="editable-page__error bg-light-negative dark:bg-dark-negative text-light-text-inverse dark:text-dark-text-inverse p-4 fixed top-16 right-4 z-50 rounded-md shadow-md">
          <p>{error}</p>
          <button
            className="ml-4 underline"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Version preview indicator */}
      {isVersionPreviewing && previewingVersion && (
        <div className="fixed top-16 left-0 right-0 bg-light-primary dark:bg-dark-primary text-light-text-inverse dark:text-dark-text-inverse p-2 text-center z-40">
          <span>
            Previewing Version {previewingVersion.versionNumber} |
            <button
              className="ml-2 underline"
              onClick={exitVersionPreview}
            >
              Exit Preview
            </button>
          </span>
        </div>
      )}
      
      {/* Page content with editor context */}
      <div className={`editable-page__content ${editorState.isEditMode ? 'editing' : ''}`}>
        {/* Pass editor context to children through props - will be used by EditableField components */}
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { editorContext: editorContextValue });
          }
          return child;
        })}
      </div>
    </div>
  );
};

export default EditablePage;