import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { EditorProvider, useEditor } from './EditorContext';
import { useAuth } from '../hooks/useAuth';

// Mock useAuth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

// Test component that uses the editor context
const TestComponent = () => {
  const { editorState, toggleEditMode, setEditMode, canEdit, canPublish } = useEditor();
  
  return (
    <div>
      <div data-testid="edit-mode">{editorState.isEditMode ? 'Edit Mode' : 'View Mode'}</div>
      <div data-testid="permission">{editorState.permission}</div>
      <div data-testid="can-edit">{canEdit ? 'Can Edit' : 'Cannot Edit'}</div>
      <div data-testid="can-publish">{canPublish ? 'Can Publish' : 'Cannot Publish'}</div>
      <button data-testid="toggle-btn" onClick={toggleEditMode}>Toggle Edit Mode</button>
      <button data-testid="set-edit-btn" onClick={() => setEditMode(true)}>Set Edit Mode</button>
      <button data-testid="set-view-btn" onClick={() => setEditMode(false)}>Set View Mode</button>
    </div>
  );
};

describe('EditorContext', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  test('provides default state with no user', () => {
    // Mock the useAuth hook to return no user
    (useAuth as jest.Mock).mockReturnValue({ user: null });

    render(
      <EditorProvider>
        <TestComponent />
      </EditorProvider>
    );

    expect(screen.getByTestId('edit-mode')).toHaveTextContent('View Mode');
    expect(screen.getByTestId('permission')).toHaveTextContent('none');
    expect(screen.getByTestId('can-edit')).toHaveTextContent('Cannot Edit');
    expect(screen.getByTestId('can-publish')).toHaveTextContent('Cannot Publish');
  });

  test('sets permission based on user role', () => {
    // Mock the useAuth hook to return a user with role 'editor'
    (useAuth as jest.Mock).mockReturnValue({ 
      user: { id: '1', username: 'editor1', role: 'editor' } 
    });

    render(
      <EditorProvider>
        <TestComponent />
      </EditorProvider>
    );

    expect(screen.getByTestId('permission')).toHaveTextContent('edit');
    expect(screen.getByTestId('can-edit')).toHaveTextContent('Can Edit');
    expect(screen.getByTestId('can-publish')).toHaveTextContent('Cannot Publish');
  });

  test('sets admin permission for admin users', () => {
    // Mock the useAuth hook to return a user with role 'admin'
    (useAuth as jest.Mock).mockReturnValue({ 
      user: { id: '1', username: 'admin1', role: 'admin' } 
    });

    render(
      <EditorProvider>
        <TestComponent />
      </EditorProvider>
    );

    expect(screen.getByTestId('permission')).toHaveTextContent('publish');
    expect(screen.getByTestId('can-edit')).toHaveTextContent('Can Edit');
    expect(screen.getByTestId('can-publish')).toHaveTextContent('Can Publish');
  });

  test('toggles edit mode with proper permissions', () => {
    // Mock the useAuth hook to return a user with role 'editor'
    (useAuth as jest.Mock).mockReturnValue({ 
      user: { id: '1', username: 'editor1', role: 'editor' } 
    });

    render(
      <EditorProvider>
        <TestComponent />
      </EditorProvider>
    );

    // Initially in view mode
    expect(screen.getByTestId('edit-mode')).toHaveTextContent('View Mode');

    // Toggle to edit mode
    act(() => {
      screen.getByTestId('toggle-btn').click();
    });
    
    expect(screen.getByTestId('edit-mode')).toHaveTextContent('Edit Mode');

    // Toggle back to view mode
    act(() => {
      screen.getByTestId('toggle-btn').click();
    });
    
    expect(screen.getByTestId('edit-mode')).toHaveTextContent('View Mode');
  });

  test('cannot toggle edit mode without proper permissions', () => {
    // Mock the useAuth hook to return a user with role 'viewer'
    (useAuth as jest.Mock).mockReturnValue({ 
      user: { id: '1', username: 'viewer1', role: 'viewer' } 
    });

    render(
      <EditorProvider>
        <TestComponent />
      </EditorProvider>
    );

    // Initially in view mode
    expect(screen.getByTestId('edit-mode')).toHaveTextContent('View Mode');
    expect(screen.getByTestId('permission')).toHaveTextContent('read');

    // Try to toggle to edit mode
    act(() => {
      screen.getByTestId('toggle-btn').click();
    });
    
    // Still in view mode since we don't have edit permission
    expect(screen.getByTestId('edit-mode')).toHaveTextContent('View Mode');
  });

  test('can set edit mode explicitly with proper permissions', () => {
    // Mock the useAuth hook to return a user with role 'editor'
    (useAuth as jest.Mock).mockReturnValue({ 
      user: { id: '1', username: 'editor1', role: 'editor' } 
    });

    render(
      <EditorProvider>
        <TestComponent />
      </EditorProvider>
    );

    // Initially in view mode
    expect(screen.getByTestId('edit-mode')).toHaveTextContent('View Mode');

    // Set to edit mode
    act(() => {
      screen.getByTestId('set-edit-btn').click();
    });
    
    expect(screen.getByTestId('edit-mode')).toHaveTextContent('Edit Mode');

    // Set back to view mode
    act(() => {
      screen.getByTestId('set-view-btn').click();
    });
    
    expect(screen.getByTestId('edit-mode')).toHaveTextContent('View Mode');
  });

  test('cannot set edit mode without proper permissions', () => {
    // Mock the useAuth hook to return a user with role 'viewer'
    (useAuth as jest.Mock).mockReturnValue({ 
      user: { id: '1', username: 'viewer1', role: 'viewer' } 
    });

    render(
      <EditorProvider>
        <TestComponent />
      </EditorProvider>
    );

    // Initially in view mode
    expect(screen.getByTestId('edit-mode')).toHaveTextContent('View Mode');

    // Try to set to edit mode
    act(() => {
      screen.getByTestId('set-edit-btn').click();
    });
    
    // Still in view mode since we don't have edit permission
    expect(screen.getByTestId('edit-mode')).toHaveTextContent('View Mode');
  });

  test('permission level check works correctly', () => {
    // Mock the useAuth hook to return a user with role 'admin'
    (useAuth as jest.Mock).mockReturnValue({ 
      user: { id: '1', username: 'admin1', role: 'admin' } 
    });

    const { container } = render(
      <EditorProvider>
        <TestComponent />
      </EditorProvider>
    );

    // Admin has 'publish' permission, which is higher than 'edit' and 'read'
    expect(screen.getByTestId('can-edit')).toHaveTextContent('Can Edit');
    expect(screen.getByTestId('can-publish')).toHaveTextContent('Can Publish');
    
    // Change to 'editor' role
    (useAuth as jest.Mock).mockReturnValue({ 
      user: { id: '1', username: 'editor1', role: 'editor' } 
    });
    
    // Re-render
    container.remove();
    render(
      <EditorProvider>
        <TestComponent />
      </EditorProvider>
    );
    
    // Editor has 'edit' permission, which is higher than 'read' but lower than 'publish'
    expect(screen.getByTestId('can-edit')).toHaveTextContent('Can Edit');
    expect(screen.getByTestId('can-publish')).toHaveTextContent('Cannot Publish');
  });
});