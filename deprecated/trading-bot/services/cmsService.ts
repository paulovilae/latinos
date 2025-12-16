import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

// API base URL - use environment variable or default
const API_URL = 'http://localhost:3000/api';

/**
 * Types for CMS content
 */
export interface ContentType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isListable: boolean;
  defaultStatus: string;
  fields?: ContentField[];
  createdAt: string;
  updatedAt: string;
}

export interface ContentField {
  id: string;
  contentTypeId: string;
  name: string;
  key: string;
  type: string;
  description?: string;
  options?: any;
  isRequired: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Content {
  id: string;
  contentTypeId: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  contentType?: {
    id: string;
    name: string;
    slug: string;
  };
  fieldValues?: Record<string, any>;
}

export interface MediaAsset {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  width?: number;
  height?: number;
  duration?: number;
  title: string;
  description?: string;
  altText?: string;
  tags?: string[];
  status: 'active' | 'archived' | 'processing';
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Get authentication header with token
 */
export const getAuthHeader = () => {
  // Get the user from localStorage since useAuth is a hook that can only be used in components
  const storedUser = localStorage.getItem('authUser');
  if (!storedUser) {
    return {};
  }
  
  try {
    // For a real implementation, we would get the JWT token
    // In this mock version, we'll simulate a token based on the user ID
    const user = JSON.parse(storedUser);
    const mockToken = `mock-token-${user.id}`;
    
    return {
      'Authorization': `Bearer ${mockToken}`
    };
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return {};
  }
};

/**
 * CMS Service
 * Provides methods for interacting with the CMS API
 */
class CMSService {
  /**
   * Content Type Methods
   */
  async getContentTypes(): Promise<ContentType[]> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.get(`${API_URL}/cms/content-types`, {
        headers: authHeader
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching content types:', error);
      throw error;
    }
  }

  async getContentType(id: string): Promise<ContentType> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.get(`${API_URL}/cms/content-types/${id}`, {
        headers: authHeader
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching content type ${id}:`, error);
      throw error;
    }
  }

  async createContentType(contentType: Partial<ContentType>): Promise<ContentType> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.post(`${API_URL}/cms/content-types`, contentType, {
        headers: authHeader
      });
      return response.data.data;
    } catch (error) {
      console.error('Error creating content type:', error);
      throw error;
    }
  }

  async updateContentType(id: string, contentType: Partial<ContentType>): Promise<ContentType> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.put(`${API_URL}/cms/content-types/${id}`, contentType, {
        headers: authHeader
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error updating content type ${id}:`, error);
      throw error;
    }
  }

  async deleteContentType(id: string): Promise<void> {
    try {
      const authHeader = getAuthHeader();
      await axios.delete(`${API_URL}/cms/content-types/${id}`, {
        headers: authHeader
      });
    } catch (error) {
      console.error(`Error deleting content type ${id}:`, error);
      throw error;
    }
  }

  /**
   * Content Methods
   */
  async getContents(params: {
    contentTypeId?: string;
    contentTypeSlug?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedResponse<Content>> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.get(`${API_URL}/cms/content`, {
        headers: authHeader,
        params
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching content entries:', error);
      throw error;
    }
  }

  async getContent(id: string): Promise<Content> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.get(`${API_URL}/cms/content/${id}`, {
        headers: authHeader
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching content ${id}:`, error);
      throw error;
    }
  }

  async createContent(content: {
    contentTypeId: string;
    title: string;
    slug: string;
    status?: 'draft' | 'published' | 'archived';
    fields?: Record<string, any>;
  }): Promise<Content> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.post(`${API_URL}/cms/content`, content, {
        headers: authHeader
      });
      return response.data.data;
    } catch (error) {
      console.error('Error creating content:', error);
      throw error;
    }
  }

  async updateContent(id: string, content: {
    title?: string;
    slug?: string;
    status?: 'draft' | 'published' | 'archived';
    fields?: Record<string, any>;
  }): Promise<Content> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.put(`${API_URL}/cms/content/${id}`, content, {
        headers: authHeader
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error updating content ${id}:`, error);
      throw error;
    }
  }

  async deleteContent(id: string): Promise<void> {
    try {
      const authHeader = getAuthHeader();
      await axios.delete(`${API_URL}/cms/content/${id}`, {
        headers: authHeader
      });
    } catch (error) {
      console.error(`Error deleting content ${id}:`, error);
      throw error;
    }
  }

  /**
   * Media Asset Methods
   */
  async getMediaAssets(params: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
  } = {}): Promise<PaginatedResponse<MediaAsset>> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.get(`${API_URL}/cms/media`, {
        headers: authHeader,
        params
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching media assets:', error);
      throw error;
    }
  }

  async getMediaAsset(id: string): Promise<MediaAsset> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.get(`${API_URL}/cms/media/${id}`, {
        headers: authHeader
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching media asset ${id}:`, error);
      throw error;
    }
  }

  async uploadMediaAsset(file: File, metadata: {
    title?: string;
    description?: string;
    altText?: string;
    tags?: string[];
  } = {}): Promise<MediaAsset> {
    try {
      const authHeader = getAuthHeader();
      const formData = new FormData();
      formData.append('file', file);
      
      if (metadata.title) formData.append('title', metadata.title);
      if (metadata.description) formData.append('description', metadata.description);
      if (metadata.altText) formData.append('altText', metadata.altText);
      if (metadata.tags) formData.append('tags', JSON.stringify(metadata.tags));
      
      const response = await axios.post(`${API_URL}/cms/media`, formData, {
        headers: {
          ...authHeader,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error uploading media asset:', error);
      throw error;
    }
  }

  async updateMediaAsset(id: string, metadata: {
    title?: string;
    description?: string;
    altText?: string;
    tags?: string[];
    status?: 'active' | 'archived' | 'processing';
  }): Promise<MediaAsset> {
    try {
      const authHeader = getAuthHeader();
      
      // Convert tags to string if provided
      const payload = {
        ...metadata,
        tags: metadata.tags ? JSON.stringify(metadata.tags) : undefined
      };
      
      const response = await axios.put(`${API_URL}/cms/media/${id}`, payload, {
        headers: authHeader
      });
      
      return response.data.data;
    } catch (error) {
      console.error(`Error updating media asset ${id}:`, error);
      throw error;
    }
  }

  async deleteMediaAsset(id: string): Promise<void> {
    try {
      const authHeader = getAuthHeader();
      await axios.delete(`${API_URL}/cms/media/${id}`, {
        headers: authHeader
      });
    } catch (error) {
      console.error(`Error deleting media asset ${id}:`, error);
      throw error;
    }
  }

  /**
   * Convenience methods for marketing pages
   */
  async getProducts(): Promise<Content[]> {
    try {
      const response = await this.getContents({
        contentTypeSlug: 'product',
        status: 'published'
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  async getTestimonials(): Promise<Content[]> {
    try {
      const response = await this.getContents({
        contentTypeSlug: 'testimonial',
        status: 'published'
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      throw error;
    }
  }

  async getNewsArticles(): Promise<Content[]> {
    try {
      const response = await this.getContents({
        contentTypeSlug: 'news',
        status: 'published'
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching news articles:', error);
      throw error;
    }
  }

  /**
   * Get media asset URL for direct access
   */
  getMediaUrl(filename: string): string {
    return `${API_URL}/cms/media/file/${filename}`;
  }

  /**
   * Get media asset URL by ID
   */
  async getMediaUrlById(id: string): Promise<string | null> {
    try {
      const mediaAsset = await this.getMediaAsset(id);
      return mediaAsset?.url || null;
    } catch (error) {
      console.error(`Error getting media URL for ID ${id}:`, error);
      return null;
    }
  }
}

// Export a singleton instance
const cmsService = new CMSService();
export default cmsService;