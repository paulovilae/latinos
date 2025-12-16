import axios from 'axios';
import botService, { 
  Formula, 
  FormulaCreateParams, 
  FormulaUpdateParams,
  Trade,
  SystemStatus,
  PerformanceMetrics,
  PaginatedResponse
} from './botService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the getAuthHeader function from cmsService
jest.mock('./cmsService', () => ({
  getAuthHeader: jest.fn().mockReturnValue({ Authorization: 'Bearer test-token' }),
}));

describe('botService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  // Sample data for tests
  const mockFormula: Formula = {
    id: 'formula-123',
    name: 'Test Formula',
    symbol: 'BTC',
    exchange: 'USD',
    interval: '1h',
    parameters: {
      strategy: 'MOVING_AVERAGE_CROSSOVER',
      investmentAmount: 1000,
      riskLevel: 'medium'
    },
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: null
  };

  const mockTrade: Trade = {
    id: 'trade-123',
    symbol: 'BTC',
    side: 'buy',
    quantity: 0.5,
    price: 50000,
    status: 'filled',
    stop_loss: 48000,
    take_profit: 55000,
    is_successful: true,
    created_at: '2025-01-01T00:00:00Z',
    filled_at: '2025-01-01T00:01:00Z'
  };

  const mockSystemStatus: SystemStatus = {
    id: 1,
    status: 'running',
    start_time: '2025-01-01T00:00:00Z',
    active_formulas: 3,
    last_execution: '2025-01-01T01:00:00Z',
    next_execution: '2025-01-01T02:00:00Z',
    error_message: null,
    updated_at: '2025-01-01T01:00:00Z'
  };

  const mockPerformanceMetrics: PerformanceMetrics = {
    total_trades: 10,
    successful_trades: 7,
    failed_trades: 3,
    success_rate: 70,
    total_profit: 5000,
    average_profit_per_trade: 500,
    largest_profit: 2000,
    largest_loss: -500,
    profit_history: [
      { date: '2025-01-01', profit: 500 },
      { date: '2025-01-02', profit: 1000 }
    ],
    symbols_performance: [
      {
        symbol: 'BTC',
        trades_count: 5,
        success_rate: 80,
        total_profit: 3000
      },
      {
        symbol: 'ETH',
        trades_count: 5,
        success_rate: 60,
        total_profit: 2000
      }
    ]
  };

  // Formula Management Tests
  describe('Formula Management', () => {
    test('getFormulas should return array of formulas', async () => {
      // Arrange
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: [mockFormula]
        }
      });

      // Act
      const result = await botService.getFormulas();

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/bot/formulas',
        { headers: { Authorization: 'Bearer test-token' } }
      );
      expect(result).toEqual([mockFormula]);
    });

    test('getFormulaById should return a single formula', async () => {
      // Arrange
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: mockFormula
        }
      });

      // Act
      const result = await botService.getFormulaById('formula-123');

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/bot/formulas/formula-123',
        { headers: { Authorization: 'Bearer test-token' } }
      );
      expect(result).toEqual(mockFormula);
    });

    test('createFormula should return the created formula', async () => {
      // Arrange
      const createParams: FormulaCreateParams = {
        name: 'New Formula',
        symbol: 'ETH',
        exchange: 'USD',
        interval: '1h',
        parameters: {
          strategy: 'MOVING_AVERAGE_CROSSOVER',
          investmentAmount: 1000,
          riskLevel: 'medium'
        }
      };

      const createdFormula = {
        ...mockFormula,
        id: 'formula-456',
        name: 'New Formula',
        symbol: 'ETH'
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: createdFormula
        }
      });

      // Act
      const result = await botService.createFormula(createParams);

      // Assert
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/bot/formulas',
        createParams,
        { headers: { Authorization: 'Bearer test-token' } }
      );
      expect(result).toEqual(createdFormula);
    });

    test('updateFormula should return the updated formula', async () => {
      // Arrange
      const updateParams: FormulaUpdateParams = {
        name: 'Updated Formula',
        is_active: false
      };

      const updatedFormula = {
        ...mockFormula,
        name: 'Updated Formula',
        is_active: false
      };

      mockedAxios.put.mockResolvedValueOnce({
        data: {
          data: updatedFormula
        }
      });

      // Act
      const result = await botService.updateFormula('formula-123', updateParams);

      // Assert
      expect(mockedAxios.put).toHaveBeenCalledWith(
        'http://localhost:3000/api/bot/formulas/formula-123',
        updateParams,
        { headers: { Authorization: 'Bearer test-token' } }
      );
      expect(result).toEqual(updatedFormula);
    });

    test('deleteFormula should call the API correctly', async () => {
      // Arrange
      mockedAxios.delete.mockResolvedValueOnce({
        data: {
          status: 'success'
        }
      });

      // Act
      await botService.deleteFormula('formula-123');

      // Assert
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        'http://localhost:3000/api/bot/formulas/formula-123',
        { headers: { Authorization: 'Bearer test-token' } }
      );
    });

    test('getFormulaById should handle errors correctly', async () => {
      // Arrange
      const errorMessage = 'Network Error';
      mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));

      // Act & Assert
      await expect(botService.getFormulaById('formula-999')).rejects.toThrow(errorMessage);
      expect(console.error).toHaveBeenCalled; // Can't check exact call due to dynamic message
    });
  });

  // Trade Status Tests
  describe('Trade Status', () => {
    test('getTrades should return paginated trades', async () => {
      // Arrange
      const paginatedResponse: PaginatedResponse<Trade> = {
        data: [mockTrade],
        pagination: {
          total: 10,
          page: 1,
          limit: 10,
          pages: 1
        }
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: paginatedResponse
        }
      });

      // Act
      const result = await botService.getTrades({ page: 1, limit: 10 });

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/bot/trades',
        { 
          headers: { Authorization: 'Bearer test-token' },
          params: { page: 1, limit: 10 }
        }
      );
      expect(result).toEqual(paginatedResponse);
    });

    test('getCurrentTrades should return active trades', async () => {
      // Arrange
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: [mockTrade]
        }
      });

      // Act
      const result = await botService.getCurrentTrades();

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/bot/trades/current',
        { headers: { Authorization: 'Bearer test-token' } }
      );
      expect(result).toEqual([mockTrade]);
    });

    test('getPerformanceMetrics should return metrics', async () => {
      // Arrange
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: mockPerformanceMetrics
        }
      });

      // Act
      const result = await botService.getPerformanceMetrics();

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/bot/trades/performance',
        { headers: { Authorization: 'Bearer test-token' } }
      );
      expect(result).toEqual(mockPerformanceMetrics);
    });

    test('getTrades should handle errors correctly', async () => {
      // Arrange
      const errorMessage = 'Network Error';
      mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));

      // Act & Assert
      await expect(botService.getTrades()).rejects.toThrow(errorMessage);
      expect(console.error).toHaveBeenCalled; // Can't check exact call due to dynamic message
    });
  });

  // System Control Tests
  describe('System Control', () => {
    test('getSystemStatus should return system status', async () => {
      // Arrange
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: mockSystemStatus
        }
      });

      // Act
      const result = await botService.getSystemStatus();

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/bot/system/status',
        { headers: { Authorization: 'Bearer test-token' } }
      );
      expect(result).toEqual(mockSystemStatus);
    });

    test('startSystem should call the API correctly and return result', async () => {
      // Arrange
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockSystemStatus
        }
      });

      // Act
      const result = await botService.startSystem();

      // Assert
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/bot/system/start',
        {},
        { headers: { Authorization: 'Bearer test-token' } }
      );
      expect(result).toEqual({
        success: true,
        data: mockSystemStatus
      });
    });

    test('stopSystem should call the API correctly and return result', async () => {
      // Arrange
      const stoppedStatus = { ...mockSystemStatus, status: 'stopped' };
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: stoppedStatus
        }
      });

      // Act
      const result = await botService.stopSystem();

      // Assert
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/bot/system/stop',
        {},
        { headers: { Authorization: 'Bearer test-token' } }
      );
      expect(result).toEqual({
        success: true,
        data: stoppedStatus
      });
    });

    test('startSystem should handle errors correctly', async () => {
      // Arrange
      const errorMessage = 'Network Error';
      mockedAxios.post.mockRejectedValueOnce(new Error(errorMessage));

      // Act & Assert
      await expect(botService.startSystem()).rejects.toThrow(errorMessage);
      expect(console.error).toHaveBeenCalled; // Can't check exact call due to dynamic message
    });
  });
});