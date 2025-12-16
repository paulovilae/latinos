import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PageName from './PageName';
import botService from '../../../services/botService';

// Mock dependencies
jest.mock('../../../services/botService', () => ({
  getSystemStatus: jest.fn(),
  // Add other mocked methods as needed
}));

// Mock data
const mockSystemStatus = {
  id: 1,
  status: 'running',
  start_time: '2025-06-19T12:00:00Z',
  active_formulas: 5,
  last_execution: '2025-06-19T12:05:00Z',
  next_execution: '2025-06-19T12:10:00Z',
  error_message: null,
  updated_at: '2025-06-19T12:05:00Z'
};

describe('PageName Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock responses
    (botService.getSystemStatus as jest.Mock).mockResolvedValue(mockSystemStatus);
  });

  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <PageName />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Page Title')).toBeInTheDocument();
    expect(screen.getByText('Page description or subtitle goes here.')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(
      <BrowserRouter>
        <PageName isLoading={true} />
      </BrowserRouter>
    );
    
    // This assumes your LoadingSpinner has a test ID or accessible role
    // Adjust this according to your actual implementation
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays error message when API call fails', async () => {
    // Mock API failure
    (botService.getSystemStatus as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(
      <BrowserRouter>
        <PageName />
      </BrowserRouter>
    );
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to load data. Please try again later.')).toBeInTheDocument();
    });
    
    // Verify retry button is present
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('handles button click', async () => {
    render(
      <BrowserRouter>
        <PageName />
      </BrowserRouter>
    );
    
    // Wait for data loading to complete
    await waitFor(() => {
      expect(screen.getByText('Main Section')).toBeInTheDocument();
    });
    
    // Find and click the button
    const button = screen.getByText('Action Button');
    fireEvent.click(button);
    
    // Add assertions for expected behavior after button click
    // This will depend on what your handleButtonClick function does
  });

  it('fetches data on component mount', async () => {
    render(
      <BrowserRouter>
        <PageName />
      </BrowserRouter>
    );
    
    // Verify the API was called
    expect(botService.getSystemStatus).toHaveBeenCalledTimes(1);
    
    // Wait for data to be displayed
    await waitFor(() => {
      expect(screen.getByText('Main Section')).toBeInTheDocument();
    });
  });

  // Add more tests as needed for your specific page functionality
});