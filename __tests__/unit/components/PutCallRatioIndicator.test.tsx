import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { PutCallRatioIndicator } from '@/components/dashboard/PutCallRatioIndicator';
import { PutCallRatioData } from '@/lib/types/indicators';

// Mock fetch
global.fetch = jest.fn();

describe('PutCallRatioIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should render loading state initially', () => {
    // Mock fetch to never resolve during this test
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(<PutCallRatioIndicator />);
    
    // Initially should show Loading... value
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  it('should render data after successful fetch', async () => {
    // Mock successful API response
    const mockData: PutCallRatioData = {
      totalPutCallRatio: 0.85,
      equityPutCallRatio: null,
      indexPutCallRatio: null,
      twentyDayAverage: 0.92,
      status: 'warning',
      value: 0.85,
      timestamp: Date.now(),
      source: 'CBOE via Firecrawl',
      lastUpdated: new Date().toISOString(),
      historical: [
        { date: Date.now() - 86400000, putCallRatio: 0.82 },
        { date: Date.now() - 86400000 * 2, putCallRatio: 0.88 },
        { date: Date.now() - 86400000 * 3, putCallRatio: 0.91 },
      ],
      isApproximateData: false
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });
    
    render(<PutCallRatioIndicator />);
    
    // Wait for the data to be rendered
    await waitFor(() => {
      expect(screen.getByText('0.85')).toBeInTheDocument();
    });
    
    // Verify the indicator card has the correct data
    expect(screen.getByText('Put/Call Ratio')).toBeInTheDocument();
    expect(screen.getByText('CBOE Options Put/Call Ratio')).toBeInTheDocument();
    
    // Status badge should be rendered
    expect(screen.getByText('Warning')).toBeInTheDocument();
    
    // Verify API was called correctly
    expect(global.fetch).toHaveBeenCalledWith('/api/indicators/put-call-ratio');
  });
  
  it('should render error state if API call fails', async () => {
    // Mock API error
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    
    render(<PutCallRatioIndicator />);
    
    // Wait for the error state to be rendered
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
    
    // Should show error in explanation
    const errorText = screen.getByText(/Failed to load put-call ratio data/);
    expect(errorText).toBeInTheDocument();
  });
  
  it('should show percentage change from 20-day average', async () => {
    // Mock data with 20-day average
    const mockData: PutCallRatioData = {
      totalPutCallRatio: 0.75,
      equityPutCallRatio: null,
      indexPutCallRatio: null,
      twentyDayAverage: 1.0, // 25% decrease
      status: 'warning',
      value: 0.75,
      timestamp: Date.now(),
      source: 'CBOE via Firecrawl',
      lastUpdated: new Date().toISOString(),
      historical: [],
      isApproximateData: false
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });
    
    render(<PutCallRatioIndicator />);
    
    // Wait for the data to be rendered
    await waitFor(() => {
      expect(screen.getByText('0.75')).toBeInTheDocument();
    });
    
    // Should show percentage change
    expect(screen.getByText('-25.00%')).toBeInTheDocument();
  });
  
  it('should refresh data on interval', async () => {
    // Setup Jest fake timers
    jest.useFakeTimers();
    
    // Mock successive API responses
    const mockData1: PutCallRatioData = {
      totalPutCallRatio: 0.80,
      equityPutCallRatio: null,
      indexPutCallRatio: null,
      twentyDayAverage: 0.85,
      status: 'warning',
      value: 0.80,
      timestamp: Date.now(),
      source: 'CBOE via Firecrawl',
      historical: [],
      isApproximateData: false
    };
    
    const mockData2: PutCallRatioData = {
      totalPutCallRatio: 0.95,
      equityPutCallRatio: null,
      indexPutCallRatio: null,
      twentyDayAverage: 0.85,
      status: 'warning',
      value: 0.95,
      timestamp: Date.now(),
      source: 'CBOE via Firecrawl',
      historical: [],
      isApproximateData: false
    };
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData1,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData2,
      });
    
    render(<PutCallRatioIndicator />);
    
    // Wait for initial data
    await waitFor(() => {
      expect(screen.getByText('0.80')).toBeInTheDocument();
    });
    
    // Fast-forward past the refresh interval (1 hour)
    act(() => {
      jest.advanceTimersByTime(60 * 60 * 1000 + 100);
    });
    
    // Wait for refreshed data
    await waitFor(() => {
      expect(screen.getByText('0.95')).toBeInTheDocument();
    });
    
    // Verify fetch was called twice
    expect(global.fetch).toHaveBeenCalledTimes(2);
    
    // Clean up fake timers
    jest.useRealTimers();
  });
}); 