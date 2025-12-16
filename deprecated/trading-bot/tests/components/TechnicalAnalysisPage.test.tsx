import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TechnicalAnalysisPage from './TechnicalAnalysisPage';
import botService from '../services/botService';
import { LanguageProvider } from '../contexts/LanguageContext';

// Mock the botService
jest.mock('../services/botService', () => ({
  __esModule: true,
  default: {
    getFormulas: jest.fn()
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

describe('TechnicalAnalysisPage Component', () => {
  const mockFormulas = [
    {
      id: 'formula-1',
      name: 'Bitcoin Strategy',
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
    },
    {
      id: 'formula-2',
      name: 'Ethereum Strategy',
      symbol: 'ETH',
      exchange: 'USD',
      interval: '1h',
      parameters: {
        strategy: 'BOLLINGER_BANDS',
        investmentAmount: 2000,
        riskLevel: 'high'
      },
      is_active: false,
      created_at: '2025-01-02T00:00:00Z',
      updated_at: null
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (botService.getFormulas as jest.Mock).mockResolvedValue(mockFormulas);
  });

  test('renders loading state initially', () => {
    render(<TechnicalAnalysisPage />);
    
    expect(screen.getByText(/dashboard.sidebar.analysis/i)).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders chart and indicators after loading', async () => {
    render(<TechnicalAnalysisPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(botService.getFormulas).toHaveBeenCalledTimes(1);
    });
    
    // Check that chart is rendered
    await waitFor(() => {
      expect(screen.getByText(/dashboard.analysis.chartVisualization/i)).toBeInTheDocument();
      // Check for technical indicators
      expect(screen.getByText(/dashboard.analysis.rsi/i)).toBeInTheDocument();
      expect(screen.getByText(/dashboard.analysis.movingAverage20/i)).toBeInTheDocument();
      expect(screen.getByText(/dashboard.analysis.movingAverage50/i)).toBeInTheDocument();
      expect(screen.getByText(/dashboard.analysis.volatility/i)).toBeInTheDocument();
    });
  });

  test('allows changing the selected symbol', async () => {
    render(<TechnicalAnalysisPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(botService.getFormulas).toHaveBeenCalledTimes(1);
    });
    
    // Find the symbol select dropdown
    const symbolSelect = await screen.findByRole('combobox');
    expect(symbolSelect).toBeInTheDocument();
    
    // Change the selected symbol
    fireEvent.change(symbolSelect, { target: { value: 'ETH' } });
    
    // Verify the symbol was changed (simulated - in the real component it would update the chart)
    // In our implementation, this doesn't show a visual change since we've mocked the chart
    // But we can verify the select value changed
    expect((symbolSelect as HTMLSelectElement).value).toBe('ETH');
  });

  test('handles refresh button click', async () => {
    // Mock window.setTimeout
    jest.useFakeTimers();
    
    render(<TechnicalAnalysisPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(botService.getFormulas).toHaveBeenCalledTimes(1);
    });
    
    // Find and click refresh button
    const refreshButton = await screen.findByTitle(/dashboard.analysis.refreshData/i);
    fireEvent.click(refreshButton);
    
    // Check refresh animation class is applied
    expect(screen.getByTitle(/dashboard.analysis.refreshData/i).firstChild).toHaveClass('animate-spin');
    
    // Fast-forward timers
    jest.advanceTimersByTime(1000);
    
    // Check refresh animation is removed
    expect(screen.getByTitle(/dashboard.analysis.refreshData/i).firstChild).not.toHaveClass('animate-spin');
    
    // Restore timers
    jest.useRealTimers();
  });

  test('handles API errors gracefully', async () => {
    // Mock an API error
    (botService.getFormulas as jest.Mock).mockRejectedValue(new Error('API error'));
    
    render(<TechnicalAnalysisPage />);
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/dashboard.analysis.fetchError/i)).toBeInTheDocument();
    });
  });

  test('shows no symbols available message when no formulas exist', async () => {
    // Mock empty formulas array
    (botService.getFormulas as jest.Mock).mockResolvedValue([]);
    
    render(<TechnicalAnalysisPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(botService.getFormulas).toHaveBeenCalledTimes(1);
    });
    
    // Check for no symbols message
    expect(screen.getByText(/dashboard.analysis.noSymbolsAvailable/i)).toBeInTheDocument();
  });
});