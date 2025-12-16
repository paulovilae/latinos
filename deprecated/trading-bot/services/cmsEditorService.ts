import cmsService, { Content, ContentType } from './cmsService';
import { getAuthHeader } from './cmsService';

/**
 * Editor field types
 */
export type EditorFieldType = 'text' | 'richText' | 'image' | 'number' | 'boolean' | 'date' | 'select' | 'reference';

/**
 * Editor field interface
 */
export interface EditorField {
  id: string;
  key: string;
  name: string;
  type: EditorFieldType;
  value: any;
  options?: Record<string, any>;
  isRequired: boolean;
}

/**
 * Editor page content interface
 */
export interface EditorPageContent {
  id: string;
  contentTypeId: string;
  contentTypeSlug: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  fields: EditorField[];
  publishedAt?: string;
  versionId?: string;
  versionNumber?: number;
}

/**
 * Version history item interface
 */
export interface VersionHistoryItem {
  id: string;
  versionNumber: number;
  title: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  createdBy: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  notes?: string;
}

/**
 * Version comparison result interface
 */
export interface VersionComparisonResult {
  fieldKey: string;
  fieldName: string;
  currentValue: any;
  comparedValue: any;
  hasChanged: boolean;
}

/**
 * CMS Editor Service
 * Provides methods for the WYSIWYG editor to interact with the CMS API
 */
class CMSEditorService {
  
  /**
   * Transform CMS content to editor format
   */
  transformContentToEditorFormat(content: Content, contentType?: ContentType): EditorPageContent {
    // Default fields array
    const fields: EditorField[] = [];
    
    // If we have field values and/or content type with field definitions
    if (content.fieldValues) {
      // Map field values to editor fields
      Object.entries(content.fieldValues).forEach(([key, value]) => {
        fields.push({
          id: key,
          key,
          name: key, // Use key as name if we don't have content type info
          type: this.determineFieldType(value),
          value,
          isRequired: false // Default to false if we don't have content type info
        });
      });
    }
    
    // If we have content type info, use it to enhance field metadata
    if (contentType && contentType.fields) {
      // Create a map of existing fields by key for quick lookup
      const fieldMap = new Map(fields.map(field => [field.key, field]));
      
      // Process each field from content type
      contentType.fields.forEach(ctField => {
        const existingField = fieldMap.get(ctField.key);
        
        if (existingField) {
          // Update existing field with content type metadata
          existingField.name = ctField.name;
          existingField.type = this.mapCmsFieldTypeToEditorType(ctField.type);
          existingField.options = ctField.options;
          existingField.isRequired = ctField.isRequired;
        } else {
          // Field exists in content type but not in content - add with default value
          fields.push({
            id: ctField.id,
            key: ctField.key,
            name: ctField.name,
            type: this.mapCmsFieldTypeToEditorType(ctField.type),
            value: null,
            options: ctField.options,
            isRequired: ctField.isRequired
          });
        }
      });
      
      // Sort fields by display order if available in content type
      fields.sort((a, b) => {
        const aField = contentType.fields?.find(f => f.key === a.key);
        const bField = contentType.fields?.find(f => f.key === b.key);
        
        if (aField && bField) {
          return aField.displayOrder - bField.displayOrder;
        }
        return 0;
      });
    }
    
    return {
      id: content.id,
      contentTypeId: content.contentTypeId,
      contentTypeSlug: content.contentType?.slug || '',
      title: content.title,
      slug: content.slug,
      status: content.status,
      fields,
      publishedAt: content.publishedAt
    };
  }
  
  /**
   * Transform editor content back to CMS format for saving
   */
  transformEditorToContentFormat(editorContent: EditorPageContent): Partial<Content> {
    // Extract field values into a record
    const fieldValues: Record<string, any> = {};
    
    editorContent.fields.forEach(field => {
      fieldValues[field.key] = field.value;
    });
    
    return {
      title: editorContent.title,
      slug: editorContent.slug,
      status: editorContent.status,
      fieldValues
    };
  }
  
  /**
   * Get page content for editing
   */
  async getPageContent(contentId: string): Promise<EditorPageContent> {
    try {
      // Get content from CMS
      const content = await cmsService.getContent(contentId);
      
      // Get content type for additional metadata
      const contentType = await cmsService.getContentType(content.contentTypeId);
      
      // Transform to editor format
      return this.transformContentToEditorFormat(content, contentType);
    } catch (error) {
      console.error('Error fetching page content for editing:', error);
      throw error;
    }
  }
  
  /**
   * Save page content
   */
  async savePageContent(pageContent: EditorPageContent): Promise<EditorPageContent> {
    try {
      // Transform to CMS format
      const contentData = this.transformEditorToContentFormat(pageContent);
      
      // Update content in CMS
      const updatedContent = await cmsService.updateContent(pageContent.id, contentData);
      
      // Get content type for additional metadata
      const contentType = await cmsService.getContentType(updatedContent.contentTypeId);
      
      // Transform to editor format and return
      return this.transformContentToEditorFormat(updatedContent, contentType);
    } catch (error) {
      console.error('Error saving page content:', error);
      throw error;
    }
  }
  
  /**
   * Publish page content
   */
  async publishPageContent(contentId: string): Promise<void> {
    try {
      // Update content status to published
      await cmsService.updateContent(contentId, {
        status: 'published'
        // The backend will automatically set the publishedAt date
      });
    } catch (error) {
      console.error('Error publishing page content:', error);
      throw error;
    }
  }
  
  /**
   * Get version history for a content item
   */
  async getVersionHistory(contentId: string, page: number = 1, limit: number = 10): Promise<{
    versions: VersionHistoryItem[],
    pagination: {
      total: number,
      page: number,
      limit: number,
      pages: number
    }
  }> {
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(`http://localhost:3000/api/cms/content/${contentId}/versions?page=${page}&limit=${limit}`, {
        headers: authHeader as HeadersInit
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch version history');
      }
      
      const result = await response.json();
      return {
        versions: result.data.versions,
        pagination: result.data.pagination
      };
    } catch (error) {
      console.error('Error fetching version history:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific version of content
   */
  async getVersion(contentId: string, versionNumber: number): Promise<EditorPageContent> {
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(`http://localhost:3000/api/cms/content/${contentId}/versions/${versionNumber}`, {
        headers: authHeader as HeadersInit
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch version ${versionNumber}`);
      }
      
      const result = await response.json();
      const versionData = result.data;
      
      // Get content type for additional metadata
      const contentType = await cmsService.getContentType(versionData.content.contentTypeId);
      
      // Create a content-like object from version data
      const contentFromVersion: Content = {
        id: versionData.content.id,
        contentTypeId: versionData.content.contentTypeId,
        title: versionData.title,
        slug: versionData.content.slug,
        status: versionData.status,
        publishedAt: versionData.content.publishedAt,
        createdAt: versionData.content.createdAt,
        updatedAt: versionData.content.updatedAt,
        contentType: versionData.content.contentType,
        fieldValues: versionData.data
      };
      
      // Transform to editor format
      const editorContent = this.transformContentToEditorFormat(contentFromVersion, contentType);
      
      // Add version information
      editorContent.versionId = versionData.id;
      editorContent.versionNumber = versionData.versionNumber;
      
      return editorContent;
    } catch (error) {
      console.error(`Error fetching version ${versionNumber}:`, error);
      throw error;
    }
  }
  
  /**
   * Restore a previous version
   */
  async restoreVersion(contentId: string, versionNumber: number): Promise<EditorPageContent> {
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(`http://localhost:3000/api/cms/content/${contentId}/versions/${versionNumber}/restore`, {
        method: 'POST',
        headers: authHeader as HeadersInit
      });
      
      if (!response.ok) {
        throw new Error(`Failed to restore version ${versionNumber}`);
      }
      
      // After restoration, get the updated content
      return this.getPageContent(contentId);
    } catch (error) {
      console.error(`Error restoring version ${versionNumber}:`, error);
      throw error;
    }
  }
  
  /**
   * Compare two versions and identify differences
   */
  compareVersions(currentVersion: EditorPageContent, comparedVersion: EditorPageContent): VersionComparisonResult[] {
    const results: VersionComparisonResult[] = [];
    
    // Create maps for quick field lookup
    const currentFieldMap = new Map(currentVersion.fields.map(field => [field.key, field]));
    const comparedFieldMap = new Map(comparedVersion.fields.map(field => [field.key, field]));
    
    // Process all fields from both versions
    const allFieldKeys = new Set([
      ...currentVersion.fields.map(f => f.key),
      ...comparedVersion.fields.map(f => f.key)
    ]);
    
    allFieldKeys.forEach(key => {
      const currentField = currentFieldMap.get(key);
      const comparedField = comparedFieldMap.get(key);
      
      // Skip if field doesn't exist in either version
      if (!currentField && !comparedField) return;
      
      const currentValue = currentField?.value;
      const comparedValue = comparedField?.value;
      
      // Determine if there's a difference
      let hasChanged = false;
      
      if (currentField?.type === 'richText' || comparedField?.type === 'richText') {
        // For rich text, we do a more basic comparison to avoid false positives
        // due to HTML formatting differences
        const normalizeHtml = (html: string) => {
          if (!html) return '';
          return html.replace(/\s+/g, ' ').trim();
        };
        
        hasChanged = normalizeHtml(currentValue) !== normalizeHtml(comparedValue);
      } else {
        // For other types, we can do a direct comparison
        hasChanged = JSON.stringify(currentValue) !== JSON.stringify(comparedValue);
      }
      
      results.push({
        fieldKey: key,
        fieldName: currentField?.name || comparedField?.name || key,
        currentValue,
        comparedValue,
        hasChanged
      });
    });
    
    return results;
  }
  
  /**
   * Utility to determine field type from value
   */
  private determineFieldType(value: any): EditorFieldType {
    if (value === null || value === undefined) {
      return 'text';
    }
    
    switch (typeof value) {
      case 'string':
        // Check if it looks like HTML (simplified)
        if (value.includes('<') && value.includes('>')) {
          return 'richText';
        }
        // Check if it looks like an image URL
        if (value.match(/\.(jpeg|jpg|gif|png|webp)$/i) || value.startsWith('http') && value.includes('/media/')) {
          return 'image';
        }
        return 'text';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'object':
        if (value instanceof Date) {
          return 'date';
        }
        // For arrays or complex objects, default to text
        return 'text';
      default:
        return 'text';
    }
  }
  
  /**
   * Map CMS field types to editor field types
   */
  private mapCmsFieldTypeToEditorType(cmsType: string): EditorFieldType {
    const typeMap: Record<string, EditorFieldType> = {
      'text': 'text',
      'textarea': 'text',
      'html': 'richText',
      'markdown': 'richText',
      'wysiwyg': 'richText',
      'image': 'image',
      'media': 'image',
      'number': 'number',
      'integer': 'number',
      'float': 'number',
      'boolean': 'boolean',
      'checkbox': 'boolean',
      'date': 'date',
      'datetime': 'date',
      'select': 'select',
      'dropdown': 'select',
      'radio': 'select',
      'reference': 'reference',
      'relationship': 'reference'
    };
    
    return typeMap[cmsType] || 'text';
  }
}

// Export a singleton instance
const cmsEditorService = new CMSEditorService();
export default cmsEditorService;