import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

// Define editor permission levels
export type EditorPermission = 'none' | 'read' | 'edit' | 'publish';

// Define editor state interface
interface EditorState {
  isEditMode: boolean;
  currentPageId: string | null;
  currentContentType: string | null;
  unsavedChanges: boolean;
  permission: EditorPermission;
}

// Define editor context interface
interface EditorContextType {
  editorState: EditorState;
  toggleEditMode: () => void;
  setEditMode: (mode: boolean) => void;
  setCurrentPage: (pageId: string, contentType: string) => void;
  markUnsavedChanges: (hasChanges: boolean) => void;
  hasPermission: (requiredPermission: EditorPermission) => boolean;
  canEdit: boolean;
  canPublish: boolean;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Initialize editor state
  const [editorState, setEditorState] = useState<EditorState>({
    isEditMode: false,
    currentPageId: null,
    currentContentType: null,
    unsavedChanges: false,
    permission: 'none'
  });

  // Determine permission level based on user role when user changes
  useEffect(() => {
    if (!user) {
      setEditorState(prev => ({ ...prev, permission: 'none' }));
      return;
    }

    // This is a simplified permission check
    // In a real implementation, this would check against the user's role and permissions
    // Modified to grant edit permissions to all logged-in users for testing purposes
    let permission: EditorPermission = 'read';
    
    if (user.role === 'admin') {
      permission = 'publish';
    } else if (user.role === 'user') {
      // Grant edit permissions to regular users for testing
      permission = 'edit';
    }

    setEditorState(prev => ({ ...prev, permission }));
    
    // If user doesn't have edit permission, exit edit mode
    if (permission !== 'edit' && permission !== 'publish' && editorState.isEditMode) {
      setEditorState(prev => ({ ...prev, isEditMode: false }));
    }
  }, [user]);

  // Toggle edit mode
  const toggleEditMode = () => {
    // Only allow toggling if user has edit or publish permission
    if (editorState.permission === 'edit' || editorState.permission === 'publish') {
      setEditorState(prev => ({
        ...prev,
        isEditMode: !prev.isEditMode
      }));
    }
  };

  // Set edit mode explicitly
  const setEditMode = (mode: boolean) => {
    // Only allow entering edit mode if user has edit or publish permission
    if (!mode || editorState.permission === 'edit' || editorState.permission === 'publish') {
      setEditorState(prev => ({
        ...prev,
        isEditMode: mode
      }));
    }
  };

  // Set current page being edited
  const setCurrentPage = (pageId: string, contentType: string) => {
    setEditorState(prev => ({
      ...prev,
      currentPageId: pageId,
      currentContentType: contentType
    }));
  };

  // Mark unsaved changes
  const markUnsavedChanges = (hasChanges: boolean) => {
    setEditorState(prev => ({
      ...prev,
      unsavedChanges: hasChanges
    }));
  };

  // Check if user has required permission
  const hasPermission = (requiredPermission: EditorPermission): boolean => {
    const permissionLevels: EditorPermission[] = ['none', 'read', 'edit', 'publish'];
    const currentLevel = permissionLevels.indexOf(editorState.permission);
    const requiredLevel = permissionLevels.indexOf(requiredPermission);
    
    return currentLevel >= requiredLevel;
  };

  // Computed properties for common permission checks
  const canEdit = hasPermission('edit');
  const canPublish = hasPermission('publish');

  return (
    <EditorContext.Provider
      value={{
        editorState,
        toggleEditMode,
        setEditMode,
        setCurrentPage,
        markUnsavedChanges,
        hasPermission,
        canEdit,
        canPublish
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

// Hook for using the editor context
export const useEditor = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};