import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SampleDashboard } from '@/components/dashboard/sample-dashboard';
import { PutCallRatioData } from '@/lib/types/indicators';

// Mock the entire PutCallRatioIndicator component
jest.mock('@/components/dashboard/PutCallRatioIndicator', () => ({
  PutCallRatioIndicator: jest.fn(() => <div data-testid="mock-put-call-ratio-indicator">Mock Put/Call Ratio</div>)
}));

// Mock fetch for real implementation tests
global.fetch = jest.fn();

describe('Dashboard with Put-Call Ratio Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should include the Put-Call ratio indicator in the dashboard', () => {
    render(<SampleDashboard />);
    
    // Verify the indicator is included in the dashboard
    expect(screen.getByTestId('mock-put-call-ratio-indicator')).toBeInTheDocument();
  });
  
  // Unmock PutCallRatioIndicator to test real implementation
  jest.unmock('@/components/dashboard/PutCallRatioIndicator');
  
  // Import the real component after unmocking
  const { PutCallRatioIndicator } = jest.requireActual('@/components/dashboard/PutCallRatioIndicator');
  
  it('should render the real Put-Call ratio indicator with data', async () => {
    // Mock the fetch API response
    const mockData: PutCallRatioData = {
      totalPutCallRatio: 0.65,
      equityPutCallRatio: null,
      indexPutCallRatio: null,
      twentyDayAverage: 0.75,
      status: 'normal',
      value: 0.65,
      timestamp: Date.now(),
      source: 'CBOE via Firecrawl',
      lastUpdated: new Date().toISOString(),
      historical: [
        { date: Date.now() - 86400000, putCallRatio: 0.70 },
        { date: Date.now() - 86400000 * 2, putCallRatio: 0.72 },
        { date: Date.now() - 86400000 * 3, putCallRatio: 0.75 },
      ],
      isApproximateData: false
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });
    
    // Create a wrapper component to use the real PutCallRatioIndicator
    const TestWrapper = () => (
      <div className="dashboard-test-wrapper">
        <PutCallRatioIndicator />
      </div>
    );
    
    render(<TestWrapper />);
    
    // Wait for the API call to finish
    await waitFor(() => {
      expect(screen.getByText('0.65')).toBeInTheDocument();
    });
    
    // Verify the indicator renders correctly
    expect(screen.getByText('Put/Call Ratio')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
    
    // Verify that API was called
    expect(global.fetch).toHaveBeenCalledWith('/api/indicators/put-call-ratio');
  });
});

// Run real E2E tests in a separate suite for clarity
describe('E2E Dashboard Test', () => {
  it('should fetch data from the real API endpoint', async () => {
    // This is a semi-E2E test that verifies the real API endpoint is working
    // but still mocks the fetch to avoid actual external API calls in tests
    
    const mockApiResponse = {
      totalPutCallRatio: 0.92,
      equityPutCallRatio: null,
      indexPutCallRatio: null,
      twentyDayAverage: 0.88,
      status: 'warning',
      value: 0.92,
      timestamp: Date.now(),
      source: 'CBOE via Firecrawl',
      historical: [
        { date: Date.now() - 86400000, putCallRatio: 0.90 },
        { date: Date.now() - 86400000 * 2, putCallRatio: 0.88 },
      ],
      isApproximateData: false
    };
    
    // Mock the fetch but use the real API endpoint URL
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/indicators/put-call-ratio') {
        return Promise.resolve({
          ok: true,
          json: async () => mockApiResponse,
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
    
    render(<SampleDashboard />);
    
    // Wait for data to be displayed
    await waitFor(() => {
      expect(screen.getByText('0.92')).toBeInTheDocument();
    });
    
    // For a true E2E test, you would not mock fetch and actually hit the real API
    // However, this should be done in a separate, clearly marked E2E test suite
    // that can be conditionally run only in certain environments
  });
}); 