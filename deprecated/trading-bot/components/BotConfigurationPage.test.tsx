import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BotConfigurationPage from './BotConfigurationPage';
import botService from '../services/botService';
import { LanguageProvider } from '../contexts/LanguageContext';

// Mock the botService
jest.mock('../services/botService', () => ({
  __esModule: true,
  default: {
    getFormulas: jest.fn(),
    getSystemStatus: jest.fn(),
    createFormula: jest.fn(),
    updateFormula: jest.fn(),
    deleteFormula: jest.fn(),
    startSystem: jest.fn(),
    stopSystem: jest.fn()
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

// Mock window.confirm
const originalConfirm = window.confirm;

describe('BotConfigurationPage Component', () => {
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

  const mockSystemStatus = {
    id: 1,
    status: 'running',
    start_time: '2025-01-01T00:00:00Z',
    active_formulas: 1,
    last_execution: '2025-01-01T01:00:00Z',
    next_execution: '2025-01-01T02:00:00Z',
    error_message: null,
    updated_at: '2025-01-01T01:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window.confirm
    window.confirm = jest.fn(() => true);
    
    // Default mock implementations
    (botService.getFormulas as jest.Mock).mockResolvedValue(mockFormulas);
    (botService.getSystemStatus as jest.Mock).mockResolvedValue(mockSystemStatus);
  });

  afterEach(() => {
    window.confirm = originalConfirm;
  });

  test('renders loading state initially', () => {
    render(<BotConfigurationPage />);
    expect(screen.getByText(/dashboard.configure.title/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dashboard.configure.addBot/i })).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders bot configurations after loading', async () => {
    render(<BotConfigurationPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(botService.getFormulas).toHaveBeenCalledTimes(1);
      expect(botService.getSystemStatus).toHaveBeenCalledTimes(1);
    });
    
    // Check that bot cards are rendered
    await waitFor(() => {
      expect(screen.getByText('Bitcoin Strategy')).toBeInTheDocument();
      expect(screen.getByText('Ethereum Strategy')).toBeInTheDocument();
    });
  });

  test('handles adding a new bot', async () => {
    (botService.createFormula as jest.Mock).mockResolvedValue({
      id: 'formula-3',
      name: 'New Trading Bot',
      symbol: 'BTC',
      exchange: 'USD',
      interval: '1h',
      parameters: {
        strategy: 'MOVING_AVERAGE_CROSSOVER',
        investmentAmount: 1000,
        riskLevel: 'medium'
      },
      is_active: false,
      created_at: '2025-01-03T00:00:00Z',
      updated_at: null
    });

    render(<BotConfigurationPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(botService.getFormulas).toHaveBeenCalledTimes(1);
    });
    
    // Click add bot button
    const addButton = screen.getByRole('button', { name: /dashboard.configure.addBot/i });
    fireEvent.click(addButton);
    
    // Verify createFormula was called
    await waitFor(() => {
      expect(botService.createFormula).toHaveBeenCalledTimes(1);
    });
  });

  test('handles toggling bot active status', async () => {
    (botService.updateFormula as jest.Mock).mockResolvedValue({
      ...mockFormulas[0],
      is_active: false
    });

    render(<BotConfigurationPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(botService.getFormulas).toHaveBeenCalledTimes(1);
    });
    
    // Find and click the toggle button for the first bot
    const toggleButton = await screen.findByTitle(/dashboard.configure.deactivateBot/i);
    fireEvent.click(toggleButton);
    
    // Verify updateFormula was called with correct parameters
    await waitFor(() => {
      expect(botService.updateFormula).toHaveBeenCalledWith('formula-1', { is_active: false });
    });
  });

  test('handles deleting a bot with confirmation', async () => {
    (botService.deleteFormula as jest.Mock).mockResolvedValue({});

    render(<BotConfigurationPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(botService.getFormulas).toHaveBeenCalledTimes(1);
    });
    
    // Find and click the delete button for the first bot
    const deleteButtons = await screen.findAllByRole('button', { name: /dashboard.configure.deleteBot/i });
    fireEvent.click(deleteButtons[0]);
    
    // Verify confirm was called and deleteFormula was called
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(botService.deleteFormula).toHaveBeenCalledWith('formula-1');
    });
  });

  test('handles starting the system', async () => {
    // Mock system initially stopped
    const stoppedStatus = { ...mockSystemStatus, status: 'stopped' };
    (botService.getSystemStatus as jest.Mock).mockResolvedValue(stoppedStatus);
    
    // Mock start system response
    (botService.startSystem as jest.Mock).mockResolvedValue({
      success: true,
      data: { ...mockSystemStatus, status: 'running' }
    });

    render(<BotConfigurationPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(botService.getSystemStatus).toHaveBeenCalledTimes(1);
    });
    
    // Find and click the start button
    const startButton = await screen.findByRole('button', { name: /dashboard.configure.startSystem/i });
    fireEvent.click(startButton);
    
    // Verify startSystem was called
    await waitFor(() => {
      expect(botService.startSystem).toHaveBeenCalledTimes(1);
    });
  });

  test('handles stopping the system', async () => {
    // Mock system initially running
    (botService.getSystemStatus as jest.Mock).mockResolvedValue(mockSystemStatus);
    
    // Mock stop system response
    (botService.stopSystem as jest.Mock).mockResolvedValue({
      success: true,
      data: { ...mockSystemStatus, status: 'stopped' }
    });

    render(<BotConfigurationPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(botService.getSystemStatus).toHaveBeenCalledTimes(1);
    });
    
    // Find and click the stop button
    const stopButton = await screen.findByRole('button', { name: /dashboard.configure.stopSystem/i });
    fireEvent.click(stopButton);
    
    // Verify stopSystem was called
    await waitFor(() => {
      expect(botService.stopSystem).toHaveBeenCalledTimes(1);
    });
  });

  test('handles API errors gracefully', async () => {
    // Mock an API error
    (botService.getFormulas as jest.Mock).mockRejectedValue(new Error('API error'));
    
    render(<BotConfigurationPage />);
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/dashboard.configure.fetchError/i)).toBeInTheDocument();
    });
  });
});