import React, { useState } from 'react';
import { useEditor } from '../../contexts/EditorContext';
import EditablePage from './EditablePage';
import EditableField from './EditableField';
import { EditorPageContent } from '../../services/cmsEditorService';
import Card from '../Card';

// Mock page content for when backend isn't available
const mockPageContent: EditorPageContent = {
  id: "editor-demo-page",
  contentTypeId: "demo-content-type",
  contentTypeSlug: "page",
  title: "Editor Demo Page",
  slug: "editor-demo",
  status: "draft",
  fields: [
    {
      id: "demo_title",
      key: "demo_title",
      name: "Demo Title",
      type: "text",
      value: "Example Content Title",
      isRequired: false
    },
    {
      id: "demo_text",
      key: "demo_text",
      name: "Demo Text",
      type: "text",
      value: "This is a simple text field that can be edited when in edit mode. Click on it to edit the content.",
      isRequired: false
    },
    {
      id: "demo_rich_text",
      key: "demo_rich_text",
      name: "Rich Text Demo",
      type: "richText",
      value: "<p>This is a <strong>rich text</strong> field with <em>formatting</em>. It uses the WYSIWYG editor when in edit mode.</p><ul><li>Supports lists</li><li>And other formatting</li></ul>",
      isRequired: false
    },
    {
      id: "demo_image_section",
      key: "demo_image_section",
      name: "Image Section Title",
      type: "text",
      value: "Image Section",
      isRequired: false
    },
    {
      id: "demo_image",
      key: "demo_image",
      name: "Demo Image",
      type: "image",
      value: "https://images.unsplash.com/photo-1605792657660-596af9009e82?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGJsb2NrY2hhaW58ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=600&q=70",
      isRequired: false
    },
    {
      id: "demo_image_caption",
      key: "demo_image_caption",
      name: "Image Caption",
      type: "text",
      value: "This is an editable image caption. The image above can also be changed when in edit mode.",
      isRequired: false
    }
  ]
};

const EditorDemo: React.FC = () => {
  const { editorState, toggleEditMode, setEditMode, canEdit } = useEditor();
  const [pageContent, setPageContent] = useState<EditorPageContent>(mockPageContent);
  
  // Handle content loaded from CMS - fallback to mock data if it fails
  const handleContentLoaded = (content: EditorPageContent) => {
    try {
      setPageContent(content);
      console.log("Content loaded:", content);
    } catch (error) {
      console.warn("Using mock content due to loading error:", error);
      // Keep using mock content
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-3xl font-bold mb-4">WYSIWYG Editor Demo</h1>
        
        <p className="mb-6">
          This page demonstrates the WYSIWYG editor capabilities. 
          {canEdit && (
            <span className="ml-2 text-light-accent dark:text-dark-accent">
              Click the "Edit" button in the toolbar to start editing.
            </span>
          )}
          {!canEdit && (
            <span className="ml-2 text-light-negative dark:text-dark-negative">
              You don't have permission to edit. Login as admin@example.com to get edit permissions.
            </span>
          )}
        </p>
        
        <div className="bg-light-info dark:bg-dark-info p-4 rounded-md mb-6">
          <h3 className="font-semibold mb-2">Debug Information:</h3>
          <p>Edit Mode: {editorState.isEditMode ? 'ON' : 'OFF'}</p>
          <p>User Permission: {editorState.permission}</p>
          <p>Can Edit: {canEdit ? 'Yes' : 'No'}</p>
          <p>Current Page ID: {editorState.currentPageId || 'None'}</p>
          <p>Unsaved Changes: {editorState.unsavedChanges ? 'Yes' : 'No'}</p>
          
          {/* Force edit mode for testing (since backend might not be connected) */}
          <div className="mt-4">
            <button 
              onClick={() => setEditMode(!editorState.isEditMode)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Force {editorState.isEditMode ? 'Exit' : 'Enter'} Edit Mode
            </button>
          </div>
        </div>
      </div>
      
      <EditablePage
        contentId="editor-demo-page"
        contentTypeSlug="page"
        onLoad={handleContentLoaded}
      >
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <h2 className="text-2xl font-bold mb-4">
              <EditableField
                fieldKey="demo_title"
                defaultValue="Example Content Title"
                editorContext={pageContent ? { 
                  isEditMode: editorState.isEditMode,
                  pageContent,
                  updateFieldValue: (key, value) => {
                    // Find the field and update it
                    const updatedFields = pageContent.fields.map(field =>
                      field.key === key ? {...field, value} : field
                    );
                    setPageContent({...pageContent, fields: updatedFields});
                  }
                } : undefined}
              />
            </h2>
            
            <div className="mb-4">
              <EditableField
                fieldKey="demo_text"
                defaultValue="This is a simple text field that can be edited when in edit mode. Click on it to edit the content."
                editorContext={pageContent ? { 
                  isEditMode: editorState.isEditMode,
                  pageContent,
                  updateFieldValue: (key, value) => {
                    const updatedFields = pageContent.fields.map(field =>
                      field.key === key ? {...field, value} : field
                    );
                    setPageContent({...pageContent, fields: updatedFields});
                  }
                } : undefined}
              />
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Rich Text Example:</h3>
              <EditableField
                fieldKey="demo_rich_text"
                defaultValue="<p>This is a <strong>rich text</strong> field with <em>formatting</em>. It uses the WYSIWYG editor when in edit mode.</p><ul><li>Supports lists</li><li>And other formatting</li></ul>"
                editorContext={pageContent ? { 
                  isEditMode: editorState.isEditMode, 
                  pageContent: {
                    ...pageContent,
                    fields: [
                      ...(pageContent.fields || []),
                      {
                        id: 'demo_rich_text',
                        key: 'demo_rich_text',
                        name: 'Rich Text Demo',
                        type: 'richText',
                        value: "<p>This is a <strong>rich text</strong> field with <em>formatting</em>. It uses the WYSIWYG editor when in edit mode.</p><ul><li>Supports lists</li><li>And other formatting</li></ul>",
                        isRequired: false
                      }
                    ]
                  }, 
                  updateFieldValue: (key, value) => {
                    // For rich text, update the special field
                    const updatedFields = pageContent.fields.map(field =>
                      field.key === key ? {...field, value} : field
                    );
                    setPageContent({...pageContent, fields: updatedFields});
                  }
                } : undefined}
              />
            </div>
          </Card>
          
          <Card>
            <h2 className="text-2xl font-bold mb-4">
              <EditableField
                fieldKey="demo_image_section"
                defaultValue="Image Section"
                editorContext={pageContent ? { 
                  isEditMode: editorState.isEditMode,
                  pageContent,
                  updateFieldValue: (key, value) => {
                    const updatedFields = pageContent.fields.map(field =>
                      field.key === key ? {...field, value} : field
                    );
                    setPageContent({...pageContent, fields: updatedFields});
                  }
                } : undefined}
              />
            </h2>
            
            <div className="mb-4">
              <EditableField
                fieldKey="demo_image"
                defaultValue="https://images.unsplash.com/photo-1605792657660-596af9009e82?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGJsb2NrY2hhaW58ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=600&q=70"
                editorContext={pageContent ? { 
                  isEditMode: editorState.isEditMode, 
                  pageContent: {
                    ...pageContent,
                    fields: [
                      ...(pageContent.fields || []),
                      {
                        id: 'demo_image',
                        key: 'demo_image',
                        name: 'Demo Image',
                        type: 'image',
                        value: "https://images.unsplash.com/photo-1605792657660-596af9009e82?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGJsb2NrY2hhaW58ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=600&q=70",
                        isRequired: false
                      }
                    ]
                  }, 
                  updateFieldValue: (key, value) => {
                    const updatedFields = pageContent.fields.map(field =>
                      field.key === key ? {...field, value} : field
                    );
                    setPageContent({...pageContent, fields: updatedFields});
                  }
                } : undefined}
              />
            </div>
            
            <div className="mb-4">
              <EditableField
                fieldKey="demo_image_caption"
                defaultValue="This is an editable image caption. The image above can also be changed when in edit mode."
                editorContext={pageContent ? { 
                  isEditMode: editorState.isEditMode,
                  pageContent,
                  updateFieldValue: (key, value) => {
                    const updatedFields = pageContent.fields.map(field =>
                      field.key === key ? {...field, value} : field
                    );
                    setPageContent({...pageContent, fields: updatedFields});
                  }
                } : undefined}
              />
            </div>
          </Card>
        </div>
      </EditablePage>
    </div>
  );
};

export default EditorDemo;