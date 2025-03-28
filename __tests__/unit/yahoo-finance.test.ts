import yahooFinance from 'yahoo-finance2';
import { fetchAllTopIndicators } from '../../lib/api/yahoo-finance';
import { validateMarketData, validateSparklineData } from '../../lib/api/validation';

// Mock the Yahoo Finance library
jest.mock('yahoo-finance2', () => ({
  __esModule: true,
  default: {
    quote: jest.fn(),
    historical: jest.fn()
  }
}));

// Mock the validation functions to avoid validation errors
jest.mock('../../lib/api/validation', () => ({
  validateMarketData: jest.fn().mockReturnValue(true),
  validateSparklineData: jest.fn().mockReturnValue(true)
}));

describe('Yahoo Finance API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('fetchAllTopIndicators should return indicators in the correct format', async () => {
    // Mock quote to return valid data
    (yahooFinance.quote as jest.Mock).mockImplementation((symbol) => {
      return Promise.resolve({
        symbol: symbol,
        regularMarketPrice: 100,
        regularMarketChangePercent: 1.0,
        regularMarketTime: Date.now() / 1000
      });
    });
    
    // Mock historical to return valid data
    (yahooFinance.historical as jest.Mock).mockResolvedValue([
      { date: new Date(), close: 98 },
      { date: new Date(), close: 99 },
      { date: new Date(), close: 100 }
    ]);

    // Call the function
    const result = await fetchAllTopIndicators();
    
    // Verify we get 4 indicators
    expect(result.length).toBe(4);
    
    // Check structure of each indicator
    result.forEach(indicator => {
      // Each indicator should have these properties
      expect(indicator).toHaveProperty('title');
      expect(indicator).toHaveProperty('value');
      expect(indicator).toHaveProperty('change');
      expect(indicator).toHaveProperty('sparklineData');
      
      // Sparkline data should be an array with elements
      expect(Array.isArray(indicator.sparklineData)).toBe(true);
      expect(indicator.sparklineData.length).toBeGreaterThan(0);
      
      // First element of sparkline data should have date and value
      if (indicator.sparklineData.length > 0) {
        expect(indicator.sparklineData[0]).toHaveProperty('date');
        expect(indicator.sparklineData[0]).toHaveProperty('value');
      }
    });
    
    // Verify the titles match our expected indicators
    const titles = result.map(i => i.title);
    expect(titles).toContain('S&P 500');
    expect(titles).toContain('10Y Treasury');
    expect(titles).toContain('Gold');
    expect(titles).toContain('VIX');
  });
  
  test('fetchAllTopIndicators should handle API errors gracefully', async () => {
    // Mock quote to throw errors
    (yahooFinance.quote as jest.Mock).mockRejectedValue(new Error('API error'));
    
    // Mock historical to throw errors
    (yahooFinance.historical as jest.Mock).mockRejectedValue(new Error('API error'));
    
    // Call the function - it should not throw
    const result = await fetchAllTopIndicators();
    
    // Should still return 4 indicators with mock data
    expect(result.length).toBe(4);
    
    // Verify the mock data structure
    result.forEach(indicator => {
      expect(indicator).toHaveProperty('title');
      expect(indicator).toHaveProperty('value');
      expect(indicator).toHaveProperty('change');
      expect(indicator).toHaveProperty('sparklineData');
      expect(indicator.sparklineData.length).toBeGreaterThan(0);
    });
  });
});
