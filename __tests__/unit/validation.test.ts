import { validateMarketData, validateSparklineData } from '../../lib/api/validation';
import { MarketDataResponse, SparklineDataPoint } from '../../lib/api/types';

describe('Market Data Validation', () => {
  // Valid data test cases
  test('validates valid S&P 500 data', () => {
    const validData: MarketDataResponse = {
      symbol: '^GSPC',
      value: 4500,
      change: 0.5,
      timestamp: new Date()
    };
    
    expect(validateMarketData(validData)).toBe(true);
  });
  
  test('validates valid 10Y Treasury data', () => {
    const validData: MarketDataResponse = {
      symbol: '^TNX',
      value: 4.25,
      change: -0.1,
      timestamp: new Date()
    };
    
    expect(validateMarketData(validData)).toBe(true);
  });
  
  test('validates valid Gold data', () => {
    const validData: MarketDataResponse = {
      symbol: 'GC=F',
      value: 2100,
      change: 1.2,
      timestamp: new Date()
    };
    
    expect(validateMarketData(validData)).toBe(true);
  });
  
  test('validates valid VIX data', () => {
    const validData: MarketDataResponse = {
      symbol: '^VIX',
      value: 15.5,
      change: -2.3,
      timestamp: new Date()
    };
    
    expect(validateMarketData(validData)).toBe(true);
  });
  
  // Invalid data test cases
  test('rejects S&P 500 with negative value', () => {
    const invalidData: MarketDataResponse = {
      symbol: '^GSPC',
      value: -100,
      change: 0.5,
      timestamp: new Date()
    };
    
    expect(validateMarketData(invalidData)).toBe(false);
  });
  
  test('rejects 10Y Treasury with out-of-range value', () => {
    const invalidData: MarketDataResponse = {
      symbol: '^TNX',
      value: 30, // Treasury yields rarely go above 25%
      change: 0.5,
      timestamp: new Date()
    };
    
    expect(validateMarketData(invalidData)).toBe(false);
  });
  
  test('rejects Gold with out-of-range value', () => {
    const invalidData: MarketDataResponse = {
      symbol: 'GC=F',
      value: 10000, // Gold price above reasonable range
      change: 0.5,
      timestamp: new Date()
    };
    
    expect(validateMarketData(invalidData)).toBe(false);
  });
  
  test('rejects VIX with out-of-range value', () => {
    const invalidData: MarketDataResponse = {
      symbol: '^VIX',
      value: 150, // VIX has never been this high
      change: 0.5,
      timestamp: new Date()
    };
    
    expect(validateMarketData(invalidData)).toBe(false);
  });
  
  test('rejects data with extreme change percentage', () => {
    const invalidData: MarketDataResponse = {
      symbol: '^GSPC',
      value: 4500,
      change: 25, // 25% change is unrealistic for S&P 500
      timestamp: new Date()
    };
    
    expect(validateMarketData(invalidData)).toBe(false);
  });
  
  test('rejects data with non-numeric value', () => {
    const invalidData = {
      symbol: '^GSPC',
      value: 'not-a-number',
      change: 0.5,
      timestamp: new Date()
    } as unknown as MarketDataResponse;
    
    expect(validateMarketData(invalidData)).toBe(false);
  });
  
  test('rejects data with non-numeric change', () => {
    const invalidData = {
      symbol: '^GSPC',
      value: 4500,
      change: 'not-a-number',
      timestamp: new Date()
    } as unknown as MarketDataResponse;
    
    expect(validateMarketData(invalidData)).toBe(false);
  });
  
  test('rejects data with old timestamp on weekdays', () => {
    // Create a date that's more than 24 hours in the past
    const oldDate = new Date();
    oldDate.setHours(oldDate.getHours() - 30); // 30 hours is more than 24
    
    const invalidData: MarketDataResponse = {
      symbol: '^GSPC',
      value: 4500,
      change: 0.5,
      timestamp: oldDate
    };
    
    // Mock current date to be a fixed weekday
    const mockNow = jest.spyOn(Date, 'now').mockImplementation(() => {
      return new Date(2025, 2, 26, 12, 0, 0).getTime(); // Wednesday
    });
    
    // Test that data older than 24 hours on a weekday should fail
    expect(validateMarketData(invalidData)).toBe(false);
    
    // Restore Date.now
    mockNow.mockRestore();
  });
});

describe('Sparkline Data Validation', () => {
  test('validates valid sparkline data', () => {
    const validSparkline: SparklineDataPoint[] = [
      { date: 'Mar 1', value: 4500 },
      { date: 'Mar 2', value: 4520 },
      { date: 'Mar 3', value: 4510 },
      { date: 'Mar 4', value: 4530 },
      { date: 'Mar 5', value: 4540 },
    ];
    
    expect(validateSparklineData('^GSPC', validSparkline)).toBe(true);
  });
  
  test('rejects sparkline with insufficient data points', () => {
    const invalidSparkline: SparklineDataPoint[] = [
      { date: 'Mar 1', value: 4500 },
    ];
    
    expect(validateSparklineData('^GSPC', invalidSparkline)).toBe(false);
  });
  
  test('rejects sparkline with empty array', () => {
    expect(validateSparklineData('^GSPC', [])).toBe(false);
  });
  
  test('rejects sparkline with non-numeric values', () => {
    const invalidSparkline = [
      { date: 'Mar 1', value: 'not-a-number' },
      { date: 'Mar 2', value: 4520 },
    ] as unknown as SparklineDataPoint[];
    
    expect(validateSparklineData('^GSPC', invalidSparkline)).toBe(false);
  });
  
  test('rejects sparkline with out-of-range values for S&P 500', () => {
    const invalidSparkline: SparklineDataPoint[] = [
      { date: 'Mar 1', value: 4500 },
      { date: 'Mar 2', value: -100 }, // Negative value
      { date: 'Mar 3', value: 4510 },
    ];
    
    expect(validateSparklineData('^GSPC', invalidSparkline)).toBe(false);
  });
  
  test('rejects sparkline with dates not in sequence', () => {
    // Create dates in wrong order
    const dates = [
      new Date(2025, 2, 5),
      new Date(2025, 2, 4), // Out of sequence
      new Date(2025, 2, 6)
    ];
    
    const invalidSparkline: SparklineDataPoint[] = dates.map(date => ({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: 4500
    }));
    
    expect(validateSparklineData('^GSPC', invalidSparkline)).toBe(false);
  });
});
