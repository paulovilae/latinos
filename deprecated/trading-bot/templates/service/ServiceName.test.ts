import axios from 'axios';
import serviceName, { MainEntity, CreateParams, UpdateParams } from './ServiceName';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock auth header function
jest.mock('./authService', () => ({
  getAuthHeader: jest.fn().mockReturnValue({ Authorization: 'Bearer test-token' })
}));

describe('ServiceName', () => {
  // Sample test data
  const mockEntity: MainEntity = {
    id: '123',
    name: 'Test Entity',
    description: 'Test Description',
    created_at: '2025-06-19T12:00:00Z',
    updated_at: null
  };

  const mockCreateParams: CreateParams = {
    name: 'New Entity',
    description: 'New Description'
  };

  const mockUpdateParams: UpdateParams = {
    name: 'Updated Entity'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkConnectivity', () => {
    it('returns true when API is available', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { status: 'ok' } });
      
      const result = await serviceName.checkConnectivity();
      
      expect(result).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.objectContaining({
          timeout: 3000
        })
      );
    });

    it('returns false when API is unavailable', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
      
      const result = await serviceName.checkConnectivity();
      
      expect(result).toBe(false);
      expect(mockedAxios.get).toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    it('fetches all entities successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            data: [mockEntity],
            pagination: {
              total: 1,
              page: 1,
              limit: 10,
              pages: 1
            }
          }
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await serviceName.getAll();
      
      expect(result).toEqual(mockResponse.data.data);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/endpoint'),
        expect.objectContaining({
          params: {}
        })
      );
    });

    it('handles errors properly', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API error'));
      
      await expect(serviceName.getAll()).rejects.toThrow('API error');
    });
  });

  describe('getById', () => {
    it('fetches an entity by ID successfully', async () => {
      const mockResponse = {
        data: {
          data: mockEntity
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await serviceName.getById('123');
      
      expect(result).toEqual(mockEntity);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/endpoint/123'),
        expect.any(Object)
      );
    });
  });

  describe('create', () => {
    it('creates an entity successfully', async () => {
      const mockResponse = {
        data: {
          data: mockEntity
        }
      };
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await serviceName.create(mockCreateParams);
      
      expect(result).toEqual(mockEntity);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/endpoint'),
        mockCreateParams,
        expect.any(Object)
      );
    });
  });

  describe('update', () => {
    it('updates an entity successfully', async () => {
      const updatedEntity = { ...mockEntity, name: 'Updated Entity' };
      const mockResponse = {
        data: {
          data: updatedEntity
        }
      };
      
      mockedAxios.put.mockResolvedValueOnce(mockResponse);
      
      const result = await serviceName.update('123', mockUpdateParams);
      
      expect(result).toEqual(updatedEntity);
      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/endpoint/123'),
        mockUpdateParams,
        expect.any(Object)
      );
    });
  });

  describe('delete', () => {
    it('deletes an entity successfully', async () => {
      mockedAxios.delete.mockResolvedValueOnce({});
      
      await serviceName.delete('123');
      
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/endpoint/123'),
        expect.any(Object)
      );
    });
  });
});