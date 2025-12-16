import React, { useState } from 'react';
import { useEditor } from '../../contexts/EditorContext';
import { EditorPageContent } from '../../services/cmsEditorService';

interface EditorToolbarProps {
  isEditMode: boolean;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  onSave: () => Promise<boolean | void>;
  onPublish: () => Promise<boolean | void>;
  contentId: string;
  currentContent: EditorPageContent | null;
  onVersionPreview?: (version: EditorPageContent) => void;
  onVersionRestore?: (versionNumber: number) => Promise<void>;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  isEditMode,
  isLoading,
  hasUnsavedChanges,
  onSave,
  onPublish,
  contentId,
  currentContent,
  onVersionPreview,
  onVersionRestore
}) => {
  const { toggleEditMode, canPublish } = useEditor();
  
  const handleSave = async () => {
    if (isLoading) return;
    await onSave();
  };
  
  const handlePublish = async () => {
    if (isLoading) return;
    await onPublish();
  };
  
  return (
    <div className="editor-toolbar bg-light-card dark:bg-dark-card p-4 mb-4 rounded flex justify-between items-center">
      <div className="flex items-center">
        <button 
          onClick={toggleEditMode}
          className={`px-4 py-2 rounded mr-2 ${isEditMode 
            ? 'bg-light-negative dark:bg-dark-negative text-white' 
            : 'bg-light-accent dark:bg-dark-accent text-white'}`}
          disabled={isLoading}
        >
          {isEditMode ? 'Exit Edit Mode' : 'Edit Page'}
        </button>
        
        {isEditMode && (
          <>
            <button 
              onClick={handleSave}
              className={`px-4 py-2 rounded mr-2 ${
                hasUnsavedChanges 
                  ? 'bg-light-positive dark:bg-dark-positive text-white' 
                  : 'bg-light-border dark:bg-dark-border text-light-text dark:text-dark-text'
              }`}
              disabled={isLoading || !hasUnsavedChanges}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
            
            {canPublish && (
              <button 
                onClick={handlePublish}
                className="px-4 py-2 bg-light-accent dark:bg-dark-accent text-white rounded"
                disabled={isLoading}
              >
                {isLoading ? 'Publishing...' : 'Publish'}
              </button>
            )}
          </>
        )}
      </div>
      
      {/* Visual indicator for unsaved changes */}
      {hasUnsavedChanges && (
        <div className="flex items-center text-light-negative dark:text-dark-negative">
          <span className="h-2 w-2 rounded-full bg-light-negative dark:bg-dark-negative mr-2"></span>
          <span className="text-sm">Unsaved changes</span>
        </div>
      )}
    </div>
  );
};

export default EditorToolbar;