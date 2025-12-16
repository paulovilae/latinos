import axios from 'axios';
import { getAuthHeader } from './authService';

// API base URL - use environment variable or default
const API_URL = process.env.API_URL || 'http://localhost:3000/api';

/**
 * MainEntity interface - represents the main data model used by this service
 */
export interface MainEntity {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string | null;
  // Add additional properties as needed
}

/**
 * CreateParams interface - parameters for creating a new entity
 */
export interface CreateParams {
  name: string;
  description?: string;
  // Add additional properties as needed
}

/**
 * UpdateParams interface - parameters for updating an existing entity
 */
export interface UpdateParams {
  name?: string;
  description?: string;
  // Add additional properties as needed
}

/**
 * ApiResponse interface - generic API response structure
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

/**
 * PaginatedResponse interface - for paginated API responses
 */
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
 * ServiceName
 * 
 * This service provides methods for interacting with the [describe what this service does]
 * API endpoints. It handles data fetching, creation, updates, and deletion operations.
 */
class ServiceName {
  /**
   * Check if the backend API is available
   * @returns Promise with boolean indicating connectivity
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      const authHeader = getAuthHeader();
      await axios.get(`${API_URL}/health`, {
        headers: authHeader,
        timeout: 3000 // 3 second timeout for health checks
      });
      return true;
    } catch (error) {
      console.error('API connectivity check failed:', error);
      return false;
    }
  }

  /**
   * Get all entities
   * @param params Optional parameters for filtering and pagination
   * @returns Promise with array of entities
   */
  async getAll(params: {
    page?: number;
    limit?: number;
    filter?: string;
  } = {}): Promise<PaginatedResponse<MainEntity>> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.get(`${API_URL}/endpoint`, {
        headers: authHeader,
        params
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching entities:', error);
      throw error;
    }
  }

  /**
   * Get an entity by ID
   * @param id Entity ID
   * @returns Promise with the entity data
   */
  async getById(id: string): Promise<MainEntity> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.get(`${API_URL}/endpoint/${id}`, {
        headers: authHeader
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching entity ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new entity
   * @param data Entity data to create
   * @returns Promise with the created entity
   */
  async create(data: CreateParams): Promise<MainEntity> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.post(`${API_URL}/endpoint`, data, {
        headers: authHeader
      });
      return response.data.data;
    } catch (error) {
      console.error('Error creating entity:', error);
      throw error;
    }
  }

  /**
   * Update an existing entity
   * @param id Entity ID
   * @param data Entity data to update
   * @returns Promise with the updated entity
   */
  async update(id: string, data: UpdateParams): Promise<MainEntity> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.put(`${API_URL}/endpoint/${id}`, data, {
        headers: authHeader
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error updating entity ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an entity
   * @param id Entity ID
   * @returns Promise resolving when deletion is complete
   */
  async delete(id: string): Promise<void> {
    try {
      const authHeader = getAuthHeader();
      await axios.delete(`${API_URL}/endpoint/${id}`, {
        headers: authHeader
      });
    } catch (error) {
      console.error(`Error deleting entity ${id}:`, error);
      throw error;
    }
  }

  // Add additional methods as needed for your specific service
}

// Export a singleton instance
const serviceName = new ServiceName();
export default serviceName;