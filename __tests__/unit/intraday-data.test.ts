import yahooFinance from 'yahoo-finance2';
import { fetchSparklineData } from '../../lib/api/yahoo-finance';
import { validateSparklineData } from '../../lib/api/validation';
import { SparklineDataPoint } from '../../lib/api/types';
import { Cache } from '../../lib/api/cache';

// Mock the Yahoo Finance library
jest.mock('yahoo-finance2', () => ({
  __esModule: true,
  default: {
    chart: jest.fn()
  }
}));

// Mock the validation functions to avoid validation errors in tests
jest.mock('../../lib/api/validation', () => ({
  validateSparklineData: jest.fn().mockReturnValue(true)
}));

// Mock the cache class
jest.mock('../../lib/api/cache', () => {
  const mockGet = jest.fn();
  const mockGetStale = jest.fn();
  const mockSet = jest.fn();
  
  return {
    Cache: jest.fn().mockImplementation(() => ({
      get: mockGet,
      getStale: mockGetStale,
      set: mockSet
    }))
  };
});

describe('Intraday Data for Sparklines', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset Date.now to use the real implementation
    jest.spyOn(Date, 'now').mockRestore();
    
    // Mock the current date to be a trading day (Wednesday at noon)
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2025, 2, 26, 12, 0, 0)); // March 26, 2025, 12:00 PM
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  test('should fetch intraday data for the current trading day', async () => {
    // Setup mock chart response with intraday data
    const mockChartResponse = {
      quotes: [
        { date: new Date(2025, 2, 26, 9, 30), close: 4500 },  // 9:30 AM
        { date: new Date(2025, 2, 26, 10, 0), close: 4510 },  // 10:00 AM
        { date: new Date(2025, 2, 26, 10, 30), close: 4505 }, // 10:30 AM
        { date: new Date(2025, 2, 26, 11, 0), close: 4515 },  // 11:00 AM
        { date: new Date(2025, 2, 26, 11, 30), close: 4525 }  // 11:30 AM
      ]
    };
    
    (yahooFinance.chart as jest.Mock).mockResolvedValueOnce(mockChartResponse);
    
    // Call the function
    const result = await fetchSparklineData('^GSPC');
    
    // Verify the result contains intraday data points
    expect(result.length).toBe(5);
    
    // Verify the function calls chart with correct parameters for intraday data
    expect(yahooFinance.chart).toHaveBeenCalledWith('^GSPC', {
      period1: expect.any(Date), // Start time (market open)
      period2: expect.any(Date), // Current time
      interval: '5m',
      includePrePost: true
    });
    
    // Verify time formatting in the result
    expect(result[0].date).toMatch(/^[0-9]+(:[0-9]+)? (AM|PM)$/); // Format like "9:30 AM"
    
    // Verify values are correctly passed
    expect(result[0].value).toBe(4500);
    expect(result[4].value).toBe(4525);
  });
  
  test('should handle weekend/non-trading days correctly', async () => {
    // Mock the current date to be a Sunday
    jest.setSystemTime(new Date(2025, 2, 23, 12, 0, 0)); // March 23, 2025 (Sunday)
    
    // Mock chart response
    const mockChartResponse = {
      quotes: [
        { date: new Date(2025, 2, 21, 9, 30), close: 4500 },  // Friday data
        { date: new Date(2025, 2, 21, 10, 0), close: 4510 },
        { date: new Date(2025, 2, 21, 15, 30), close: 4520 },
      ]
    };
    
    (yahooFinance.chart as jest.Mock).mockResolvedValueOnce(mockChartResponse);
    
    // Call the function
    const result = await fetchSparklineData('^GSPC');
    
    // Verify the chart function was called with Friday's date
    expect(yahooFinance.chart).toHaveBeenCalledWith('^GSPC', {
      period1: expect.any(Date), 
      period2: expect.any(Date),
      interval: '5m',
      includePrePost: true
    });
    
    // Extract the first argument (period1) from the mock call
    const callArgs = (yahooFinance.chart as jest.Mock).mock.calls[0][1];
    const period1 = callArgs.period1;
    
    // Verify it's Friday (day 5 is Friday)
    expect(period1.getDay()).toBe(5);
  });
  
  test('should generate mock intraday data when API fails', async () => {
    // Reset all mocks and clear cache
    jest.clearAllMocks();
    
    // Ensure cache returns null
    const mockCache = new Cache(15 * 60 * 1000);
    (mockCache.get as jest.Mock).mockReturnValue(null);
    (mockCache.getStale as jest.Mock).mockReturnValue(null);
    
    // Mock API error
    (yahooFinance.chart as jest.Mock).mockRejectedValueOnce(new Error('API error'));
    
    // Call the function
    const result = await fetchSparklineData('^GSPC');
    
    // Verify we get mock data back
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('date');
    expect(result[0]).toHaveProperty('value');
    
    // Verify the date format is time-based for intraday
    expect(result[0].date).toMatch(/^[0-9]+(:[0-9]+)? (AM|PM)$/);
  });
  
  test('should sort data points chronologically', async () => {
    // Reset mocks and clear cache
    jest.clearAllMocks();
    
    // Ensure cache returns null
    const mockCache = new Cache(15 * 60 * 1000);
    (mockCache.get as jest.Mock).mockReturnValue(null);
    
    // Setup mock chart response with out-of-order data
    const mockChartResponse = {
      quotes: [
        { date: new Date(2025, 2, 26, 11, 0), close: 4515 },  // 11:00 AM
        { date: new Date(2025, 2, 26, 9, 30), close: 4500 },  // 9:30 AM
        { date: new Date(2025, 2, 26, 10, 30), close: 4505 }, // 10:30 AM
        { date: new Date(2025, 2, 26, 10, 0), close: 4510 },  // 10:00 AM
      ]
    };
    
    (yahooFinance.chart as jest.Mock).mockResolvedValueOnce(mockChartResponse);
    
    // Call the function
    const result = await fetchSparklineData('^GSPC');
    
    // Expect times to be in correct order
    expect(result[0].date.toLowerCase()).toContain('9:30');
    expect(result[1].date.toLowerCase()).toContain('10:00');
    expect(result[2].date.toLowerCase()).toContain('10:30');
    expect(result[3].date.toLowerCase()).toContain('11:00');
  });
  
  test('should filter out null values', async () => {
    // Reset mocks and clear cache
    jest.clearAllMocks();
    
    // Ensure cache returns null
    const mockCache = new Cache(15 * 60 * 1000);
    (mockCache.get as jest.Mock).mockReturnValue(null);
    
    // Setup mock chart response with some null values
    const mockChartResponse = {
      quotes: [
        { date: new Date(2025, 2, 26, 9, 30), close: 4500 },
        { date: new Date(2025, 2, 26, 10, 0), close: null },  // Null value
        { date: new Date(2025, 2, 26, 10, 30), close: 4505 },
        { date: new Date(2025, 2, 26, 11, 0), close: null },  // Null value
        { date: new Date(2025, 2, 26, 11, 30), close: 4525 }
      ]
    };
    
    (yahooFinance.chart as jest.Mock).mockResolvedValueOnce(mockChartResponse);
    
    // Call the function
    const result = await fetchSparklineData('^GSPC');
    
    // Should have filtered out the null values
    expect(result).toBeDefined();
    expect(result.length).toBe(3);
    
    // Values should be from non-null entries
    const values = result.map(point => point.value);
    expect(values).toContain(4500);
    expect(values).toContain(4505);
    expect(values).toContain(4525);
  });
});
