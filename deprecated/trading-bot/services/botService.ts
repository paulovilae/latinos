import axios from 'axios';
import { getAuthHeader } from './cmsService';

// API base URL - use environment variable or default
const API_URL = 'http://localhost:3000/api';

/**
 * Formula interface - represents a trading formula configuration
 */
export interface Formula {
  id: string;
  name: string;
  symbol: string;
  exchange: string;
  interval: '1m' | '5m' | '15m' | '1h' | '1d';
  parameters: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

/**
 * Formula creation parameters
 */
export interface FormulaCreateParams {
  name: string;
  symbol: string;
  exchange?: string;
  interval: '1m' | '5m' | '15m' | '1h' | '1d';
  parameters: Record<string, any>;
  is_active?: boolean;
}

/**
 * Formula update parameters
 */
export interface FormulaUpdateParams {
  name?: string;
  symbol?: string;
  exchange?: string;
  interval?: '1m' | '5m' | '15m' | '1h' | '1d';
  parameters?: Record<string, any>;
  is_active?: boolean;
}

/**
 * Trade interface - represents a trade execution
 */
export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  status: 'open' | 'filled' | 'cancelled' | 'expired' | 'rejected';
  stop_loss: number | null;
  take_profit: number | null;
  is_successful: boolean | null;
  created_at: string;
  filled_at: string | null;
}

/**
 * System status interface - represents the trading system state
 */
export interface SystemStatus {
  id: number;
  status: 'running' | 'stopped' | 'error';
  start_time: string | null;
  active_formulas: number;
  last_execution: string | null;
  next_execution: string | null;
  error_message: string | null;
  updated_at: string;
}

/**
 * Health check response interface
 */
export interface HealthCheckResponse {
  success: boolean;
  message: string;
  status: 'connected' | 'disconnected' | 'error';
  timestamp: string;
}

/**
 * Performance metrics interface - represents trading performance data
 */
export interface PerformanceMetrics {
  total_trades: number;
  successful_trades: number;
  failed_trades: number;
  success_rate: number;
  total_profit: number;
  average_profit_per_trade: number;
  largest_profit: number;
  largest_loss: number;
  profit_history: {
    date: string;
    profit: number;
  }[];
  symbols_performance: {
    symbol: string;
    trades_count: number;
    success_rate: number;
    total_profit: number;
  }[];
}

/**
 * Generic paginated response interface
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
 * Generic API response interface
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

/**
 * Bot Service
 * Provides methods for interacting with the trading bot API
 */
class BotService {
  /**
   * Check if the backend is connected
   * @returns Promise with boolean indicating connectivity
   */
  async checkBackendConnectivity(): Promise<boolean> {
    try {
      const authHeader = getAuthHeader();
      await axios.get(`${API_URL}/bot/system/health`, {
        headers: authHeader,
        timeout: 3000 // 3 second timeout for health checks
      });
      return true;
    } catch (error) {
      console.error('Backend connectivity check failed:', error);
      return false;
    }
  }

  /**
   * Formula Management Methods
   */

  /**
   * Get all trading formulas
   * @returns Promise with array of formula configurations
   */
  async getFormulas(): Promise<Formula[]> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.get(`${API_URL}/bot/formulas`, {
        headers: authHeader
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching formulas:', error);
      throw error;
    }
  }

  /**
   * Get a specific formula by ID
   * @param id Formula ID
   * @returns Promise with formula configuration
   */
  async getFormulaById(id: string): Promise<Formula> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.get(`${API_URL}/bot/formulas/${id}`, {
        headers: authHeader
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching formula ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new formula configuration
   * @param formula Formula data to create
   * @returns Promise with created formula
   */
  async createFormula(formula: FormulaCreateParams): Promise<Formula> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.post(`${API_URL}/bot/formulas`, formula, {
        headers: authHeader
      });
      return response.data.data;
    } catch (error) {
      console.error('Error creating formula:', error);
      throw error;
    }
  }

  /**
   * Update an existing formula
   * @param id Formula ID
   * @param formula Formula data to update
   * @returns Promise with updated formula
   */
  async updateFormula(id: string, formula: FormulaUpdateParams): Promise<Formula> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.put(`${API_URL}/bot/formulas/${id}`, formula, {
        headers: authHeader
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error updating formula ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a formula configuration
   * @param id Formula ID
   * @returns Promise resolving when deletion is complete
   */
  async deleteFormula(id: string): Promise<void> {
    try {
      const authHeader = getAuthHeader();
      await axios.delete(`${API_URL}/bot/formulas/${id}`, {
        headers: authHeader
      });
    } catch (error) {
      console.error(`Error deleting formula ${id}:`, error);
      throw error;
    }
  }

  /**
   * Trading Status Methods
   */

  /**
   * Get all trade history
   * @param params Optional pagination and filtering parameters
   * @returns Promise with paginated trade history
   */
  async getTrades(params: {
    page?: number;
    limit?: number;
    symbol?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<PaginatedResponse<Trade>> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.get(`${API_URL}/bot/trades`, {
        headers: authHeader,
        params
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching trades:', error);
      throw error;
    }
  }

  /**
   * Get currently active trades
   * @returns Promise with current trades
   */
  async getCurrentTrades(): Promise<Trade[]> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.get(`${API_URL}/bot/trades/current`, {
        headers: authHeader
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching current trades:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   * @returns Promise with performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.get(`${API_URL}/bot/trades/performance`, {
        headers: authHeader
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw error;
    }
  }

  /**
   * System Control Methods
   */

  /**
   * Start the trading system
   * @returns Promise with start operation result
   */
  async startSystem(): Promise<ApiResponse<SystemStatus>> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.post(`${API_URL}/bot/system/start`, {}, {
        headers: authHeader
      });
      return response.data;
    } catch (error) {
      console.error('Error starting trading system:', error);
      throw error;
    }
  }

  /**
   * Stop the trading system
   * @returns Promise with stop operation result
   */
  async stopSystem(): Promise<ApiResponse<SystemStatus>> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.post(`${API_URL}/bot/system/stop`, {}, {
        headers: authHeader
      });
      return response.data;
    } catch (error) {
      console.error('Error stopping trading system:', error);
      throw error;
    }
  }

  /**
   * Get system status
   * @returns Promise with system status
   */
  async getSystemStatus(): Promise<SystemStatus> {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.get(`${API_URL}/bot/system/status`, {
        headers: authHeader
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching system status:', error);
      throw error;
    }
  }
}

// Export a singleton instance
const botService = new BotService();
export default botService;