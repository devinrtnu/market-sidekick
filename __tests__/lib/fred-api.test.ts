import { fetchYieldCurveData } from '@/lib/api/fred';

// Mock fetch to avoid real API calls during tests
global.fetch = jest.fn();

describe('FRED API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FRED_API_KEY = 'test-api-key';
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    delete process.env.FRED_API_KEY;
  });

  it('should fetch the latest data from FRED API', async () => {
    // Current date for the test
    const testDate = new Date('2025-03-28');
    jest.spyOn(global, 'Date').mockImplementation(() => testDate as unknown as Date);
    
    // Mock responses for T10Y2Y (yesterday should be 2025-03-27)
    const mockT10Y2YData = {
      observations: [
        { date: '2025-03-27', value: '0.41' }, // Latest data
        { date: '2025-03-26', value: '0.37' },
        { date: '2025-03-25', value: '0.35' },
        // ...additional historical data
      ]
    };
    
    // Mock responses for DGS10 and DGS2
    const mockDGS10Data = {
      observations: [
        { date: '2025-03-27', value: '4.29' }
      ]
    };
    
    const mockDGS2Data = {
      observations: [
        { date: '2025-03-27', value: '3.88' }
      ]
    };

    // Setup fetch mock
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('series_id=T10Y2Y')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockT10Y2YData)
        });
      } else if (url.includes('series_id=DGS10')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDGS10Data)
        });
      } else if (url.includes('series_id=DGS2')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDGS2Data)
        });
      }
      return Promise.reject(new Error('Unknown series'));
    });

    // Call the function
    const result = await fetchYieldCurveData('1m', true);

    // Verify we got the latest data (0.41%)
    expect(result.spread).toBeCloseTo(0.0041, 4); // 0.41%
    
    // Verify the latest date in latestDataDate
    expect(result.latestDataDate).toBe('2025-03-27');
    
    // Verify the sparkline data includes the latest date (March 27)
    const dates = result.sparklineData.map(point => point.date);
    expect(dates).toContain('Mar 27');
    
    // Verify the latest sparkline data point value
    const latestDataPoint = result.sparklineData.find(point => point.date === 'Mar 27');
    expect(latestDataPoint?.value).toBeCloseTo(0.0041, 4);
    
    // Verify the API URL parameters included the tomorrow's date
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('observation_end=2025-03-29');
    
    // Verify force-refresh was used
    expect((global.fetch as jest.Mock).mock.calls[0][1].cache).toBe('no-store');
  });

  it('should handle data gaps correctly', async () => {
    // Mock data with a gap (missing March 26)
    const mockT10Y2YData = {
      observations: [
        { date: '2025-03-27', value: '0.41' }, // Latest data
        { date: '2025-03-25', value: '0.35' }, // Missing March 26
        { date: '2025-03-24', value: '0.30' },
        // ...additional historical data
      ]
    };
    
    const mockDGS10Data = {
      observations: [
        { date: '2025-03-27', value: '4.29' }
      ]
    };
    
    const mockDGS2Data = {
      observations: [
        { date: '2025-03-27', value: '3.88' }
      ]
    };

    // Setup fetch mock
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('series_id=T10Y2Y')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockT10Y2YData)
        });
      } else if (url.includes('series_id=DGS10')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDGS10Data)
        });
      } else if (url.includes('series_id=DGS2')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDGS2Data)
        });
      }
      return Promise.reject(new Error('Unknown series'));
    });

    // Call the function
    const result = await fetchYieldCurveData('1m', true);

    // Verify the data is still processed correctly
    expect(result.sparklineData).toBeDefined();
    expect(result.sparklineData.length).toBeGreaterThan(0);
    
    // Should include March 27 but not have duplicates
    const dates = result.sparklineData.map(point => point.date);
    expect(dates).toContain('Mar 27');
    expect(dates).toContain('Mar 25');
    expect(dates).not.toContain('Mar 26'); // Should be missing as expected
    
    // Ensure dates are unique
    const uniqueDates = new Set(dates);
    expect(uniqueDates.size).toBe(dates.length);
  });
}); 