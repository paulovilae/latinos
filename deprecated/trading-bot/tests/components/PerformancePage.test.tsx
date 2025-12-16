import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PerformancePage from './PerformancePage';
import botService from '../services/botService';
import { LanguageProvider } from '../contexts/LanguageContext';

// Mock the botService
jest.mock('../services/botService', () => ({
  __esModule: true,
  default: {
    getPerformanceMetrics: jest.fn(),
    getTrades: jest.fn()
  }
}));

// Mock language context
jest.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key, // Return the key as the translation
    setLanguage: jest.fn()
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('PerformancePage Component', () => {
  // Sample performance metrics
  const mockPerformanceMetrics = {
    total_trades: 25,
    successful_trades: 18,
    failed_trades: 7,
    success_rate: 72,
    total_profit: 3500.75,
    average_profit_per_trade: 140.03,
    largest_profit: 750.25,
    largest_loss: -420.50,
    profit_history: [
      { date: '2025-01-01', profit: 120.50 },
      { date: '2025-01-02', profit: 250.75 },
      { date: '2025-01-03', profit: -50.25 },
      { date: '2025-01-04', profit: 350.00 }
    ],
    symbols_performance: [
      {
        symbol: 'BTC',
        trades_count: 15,
        success_rate: 80,
        total_profit: 2500.50
      },
      {
        symbol: 'ETH',
        trades_count: 10,
        success_rate: 60,
        total_profit: 1000.25
      }
    ]
  };

  // Sample trades data
  const mockTrades = [
    {
      id: 'trade-1',
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
    },
    {
      id: 'trade-2',
      symbol: 'ETH',
      side: 'sell',
      quantity: 2.0,
      price: 2500,
      status: 'filled',
      stop_loss: null,
      take_profit: null,
      is_successful: true,
      created_at: '2025-01-02T00:00:00Z',
      filled_at: '2025-01-02T00:01:00Z'
    }
  ];

  // Mock paginated response
  const mockPaginatedTrades = {
    data: mockTrades,
    pagination: {
      total: 25,
      page: 1,
      limit: 10,
      pages: 3
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    (botService.getPerformanceMetrics as jest.Mock).mockResolvedValue(mockPerformanceMetrics);
    (botService.getTrades as jest.Mock).mockResolvedValue(mockPaginatedTrades);
  });

  test('renders loading state initially', () => {
    render(<PerformancePage />);
    
    expect(screen.getByText(/dashboard.sidebar.performance/i)).toBeInTheDocument();
    expect(screen.getAllByTestId('loading-spinner')[0]).toBeInTheDocument();
  });

  test('renders performance metrics after loading', async () => {
    render(<PerformancePage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(botService.getPerformanceMetrics).toHaveBeenCalledTimes(1);
      expect(botService.getTrades).toHaveBeenCalledTimes(1);
    });
    
    // Check for performance summary metrics
    await waitFor(() => {
      expect(screen.getByText(/dashboard.performance.totalTrades/i)).toBeInTheDocument();
      expect(screen.getByText(/dashboard.performance.successRate/i)).toBeInTheDocument();
      expect(screen.getByText(/dashboard.performance.totalProfit/i)).toBeInTheDocument();
      expect(screen.getByText(/dashboard.performance.avgProfitPerTrade/i)).toBeInTheDocument();
    });
    
    // Check for chart visualization
    expect(screen.getByText(/dashboard.performance.chartVisualization/i)).toBeInTheDocument();
    
    // Check for symbol breakdown table
    expect(screen.getByText(/dashboard.performance.symbolBreakdown/i)).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('ETH')).toBeInTheDocument();
    
    // Check for trade history table
    expect(screen.getByText(/dashboard.performance.tradeHistory/i)).toBeInTheDocument();
  });

  test('displays trade history table with correct data', async () => {
    render(<PerformancePage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(botService.getTrades).toHaveBeenCalledTimes(1);
    });
    
    // Check trade table rows
    await waitFor(() => {
      expect(screen.getAllByText('BTC')[0]).toBeInTheDocument();
      expect(screen.getByText('ETH')).toBeInTheDocument();
      expect(screen.getByText('BUY')).toBeInTheDocument();
      expect(screen.getByText('SELL')).toBeInTheDocument();
      expect(screen.getAllByText('FILLED')[0]).toBeInTheDocument();
    });
  });

  test('handles trade history filtering', async () => {
    render(<PerformancePage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(botService.getTrades).toHaveBeenCalledTimes(1);
    });
    
    // Find filter inputs
    const symbolSelect = screen.getByLabelText(/dashboard.performance.symbol/i);
    const statusSelect = screen.getByLabelText(/dashboard.performance.status/i);
    const applyButton = screen.getByRole('button', { name: /dashboard.performance.applyFilters/i });
    
    // Set filter values
    fireEvent.change(symbolSelect, { target: { value: 'BTC' } });
    fireEvent.change(statusSelect, { target: { value: 'filled' } });
    
    // Reset mock to verify new call with filters
    (botService.getTrades as jest.Mock).mockClear();
    
    // Click apply filters
    fireEvent.click(applyButton);
    
    // Verify API call with filters
    await waitFor(() => {
      expect(botService.getTrades).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'BTC',
          status: 'filled',
          page: 1
        })
      );
    });
  });

  test('handles pagination in trade history', async () => {
    render(<PerformancePage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(botService.getTrades).toHaveBeenCalledTimes(1);
    });
    
    // Find next page button
    const nextPageButton = screen.getByLabelText(/dashboard.performance.nextPage/i);
    
    // Reset mock to verify new call with page 2
    (botService.getTrades as jest.Mock).mockClear();
    
    // Click next page
    fireEvent.click(nextPageButton);
    
    // Verify API call with page 2
    await waitFor(() => {
      expect(botService.getTrades).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2
        })
      );
    });
  });

  test('handles refreshing trade data', async () => {
    render(<PerformancePage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(botService.getTrades).toHaveBeenCalledTimes(1);
    });
    
    // Find refresh button
    const refreshButton = screen.getByRole('button', { name: /dashboard.performance.refresh/i });
    
    // Reset mock to verify new call
    (botService.getTrades as jest.Mock).mockClear();
    
    // Click refresh button
    fireEvent.click(refreshButton);
    
    // Verify API call was made again
    await waitFor(() => {
      expect(botService.getTrades).toHaveBeenCalledTimes(1);
    });
  });

  test('handles API errors gracefully', async () => {
    // Mock an API error
    (botService.getPerformanceMetrics as jest.Mock).mockRejectedValue(new Error('API error'));
    
    render(<PerformancePage />);
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/dashboard.performance.fetchError/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /common.retry/i })).toBeInTheDocument();
    });
  });
});