import { fetchYieldCurveData } from '@/lib/api/fred';
import { YieldCurveData } from '@/lib/api/types';
import { validateYieldCurveData } from '@/lib/api/validation';

// Mock the cache module
jest.mock('@/lib/api/cache');

// Mock the fetch function
global.fetch = jest.fn();

describe('Yield Curve Data', () => {
  // Create mock functions for the cache
  const mockGet = jest.fn();
  const mockGetStale = jest.fn();
  const mockSet = jest.fn();
  const mockForceRefresh = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FRED_API_KEY = 'test-api-key';
    
    // Setup cache mock implementation for each test
    const { Cache } = require('@/lib/api/cache');
    Cache.mockImplementation(() => ({
      get: mockGet,
      getStale: mockGetStale,
      set: mockSet,
      forceRefresh: mockForceRefresh,
      clear: jest.fn()
    }));
  });

  afterEach(() => {
    delete process.env.FRED_API_KEY;
  });

  describe('Data Fetching and Processing', () => {
    it('should fetch and process yield curve data correctly', async () => {
      // Sample of actual FRED data (most recent 30 days)
      const mockSpreadData = {
        observations: [
          { date: '2025-03-27', value: '0.41' },
          { date: '2025-03-26', value: '0.37' },
          { date: '2025-03-25', value: '0.35' },
          { date: '2025-03-24', value: '0.30' },
          { date: '2025-03-21', value: '0.31' },
          { date: '2025-03-20', value: '0.29' }
        ]
      };

      const mockTenYearData = {
        observations: [
          { date: '2025-03-27', value: '4.20' }
        ]
      };

      const mockTwoYearData = {
        observations: [
          { date: '2025-03-27', value: '3.79' }
        ]
      };

      // Setup fetch mock
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('series_id=T10Y2Y')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSpreadData)
          });
        } else if (url.includes('series_id=DGS10')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTenYearData)
          });
        } else if (url.includes('series_id=DGS2')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTwoYearData)
          });
        }
        return Promise.reject(new Error('Unknown series'));
      });

      // Fetch the data
      const result = await fetchYieldCurveData('1m');

      // Verify the current spread value (as decimals)
      expect(result.spread).toBeCloseTo(0.0041, 6); // 0.41%
      expect(result.tenYearYield).toBeCloseTo(0.042, 6); // 4.20%
      expect(result.twoYearYield).toBeCloseTo(0.0379, 6); // 3.79%

      // Verify sparkline data has correct values and length
      expect(result.sparklineData.length).toBe(6);
      
      // Verify change calculation (as decimals)
      const expectedChange = 0.0041 - 0.0037; // Current value minus previous value
      expect(result.change).toBeCloseTo(expectedChange, 6);

      // Verify status based on current spread
      expect(result.status).toBe('normal'); // 0.41% > 0.2% should be normal
      
      // Verify formatted value string
      expect(result.value).toBe('0.41%');
      
      // Verify data structure
      expect(validateYieldCurveData(result)).toBe(true);
    });

    it('should handle data gaps and holidays correctly', async () => {
      // Mock data with gaps (weekends and holidays)
      const mockSpreadData = {
        observations: [
          { date: '2025-03-27', value: '0.41' },
          { date: '2025-03-26', value: '0.37' },
          { date: '2025-03-25', value: '0.35' },
          // Weekend gap
          { date: '2025-03-24', value: '0.30' },
          { date: '2025-03-21', value: '0.31' },
          // Holiday
          { date: '2025-03-20', value: '' },
          { date: '2025-03-19', value: '0.26' }
        ]
      };

      const mockTenYearData = {
        observations: [
          { date: '2025-03-27', value: '4.20' }
        ]
      };

      const mockTwoYearData = {
        observations: [
          { date: '2025-03-27', value: '3.79' }
        ]
      };

      // Setup fetch mock
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('series_id=T10Y2Y')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSpreadData)
          });
        } else if (url.includes('series_id=DGS10')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTenYearData)
          });
        } else if (url.includes('series_id=DGS2')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTwoYearData)
          });
        }
        return Promise.reject(new Error('Unknown series'));
      });

      const result = await fetchYieldCurveData('1m');

      // Verify that gaps are handled correctly - should filter out empty values
      expect(result.sparklineData.length).toBe(6);
      
      // Just check that the sparkline data is valid
      expect(result.sparklineData).toBeDefined();
      expect(Array.isArray(result.sparklineData)).toBe(true);
      expect(validateYieldCurveData(result)).toBe(true);
    });
  });

  describe('Error Handling and Caching', () => {
    it('should use cached data when available', async () => {
      // Mock cache to return valid data
      const mockCacheData: YieldCurveData = {
        title: 'Yield Curve (10Y-2Y)',
        value: '0.41%',
        change: 0.0004,
        sparklineData: [
          { date: 'Mar 25', value: 0.0035 },
          { date: 'Mar 26', value: 0.0037 },
          { date: 'Mar 27', value: 0.0041 }
        ],
        status: 'normal',
        spread: 0.0041,
        tenYearYield: 0.042,
        twoYearYield: 0.0379,
        lastUpdated: new Date().toISOString(),
        latestDataDate: '2025-03-27'
      };
      
      // Setup the cache mock to return our mock data
      mockGet.mockReturnValue(mockCacheData);
      
      // Should use cached data and not call fetch
      const result = await fetchYieldCurveData('1m');
      
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result).toEqual(mockCacheData);
    });

    it('should handle API failures gracefully', async () => {
      // Mock fetch to fail
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API failure'));
      
      // Mock cache to return null for get but have stale data
      mockGet.mockReturnValue(null);
      
      const staleData: YieldCurveData = {
        title: 'Yield Curve (10Y-2Y)',
        value: '0.38%',
        change: 0.0002,
        sparklineData: [
          { date: 'Mar 24', value: 0.0033 },
          { date: 'Mar 25', value: 0.0036 },
          { date: 'Mar 26', value: 0.0038 }
        ],
        status: 'normal',
        spread: 0.0038,
        tenYearYield: 0.041,
        twoYearYield: 0.0372,
        lastUpdated: new Date().toISOString(),
        latestDataDate: '2025-03-26'
      };
      
      mockGetStale.mockReturnValue(staleData);
      
      // Should return stale data with error status
      const result = await fetchYieldCurveData('1m');
      
      expect(result.status).toBe('error');
      expect(result.spread).toBe(staleData.spread);
      expect(result.sparklineData).toEqual(staleData.sparklineData);
    });

    it('should throw error when no data is available', async () => {
      // Mock fetch to fail
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API failure'));
      
      // Mock cache to return null for both fresh and stale data
      mockGet.mockReturnValue(null);
      mockGetStale.mockReturnValue(null);
      
      // Should throw error
      await expect(fetchYieldCurveData('1m')).rejects.toThrow('Failed to fetch yield curve data');
    });

    it('should force refresh when requested', async () => {
      // Setup fetch mock with successful response
      const mockSpreadData = {
        observations: [
          { date: '2025-03-27', value: '0.41' },
          { date: '2025-03-26', value: '0.37' }
        ]
      };

      const mockTenYearData = {
        observations: [
          { date: '2025-03-27', value: '4.20' }
        ]
      };

      const mockTwoYearData = {
        observations: [
          { date: '2025-03-27', value: '3.79' }
        ]
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('series_id=T10Y2Y')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSpreadData)
          });
        } else if (url.includes('series_id=DGS10')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTenYearData)
          });
        } else if (url.includes('series_id=DGS2')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTwoYearData)
          });
        }
        return Promise.reject(new Error('Unknown series'));
      });
      
      // Call with forceRefresh = true
      await fetchYieldCurveData('1m', true);
      
      // Should call forceRefresh on the cache
      expect(mockForceRefresh).toHaveBeenCalled();
      
      // Should call fetch even if there's cache data
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Data Validation', () => {
    it('should validate data structure correctly', () => {
      // Valid data
      const validData: YieldCurveData = {
        title: 'Yield Curve (10Y-2Y)',
        value: '0.41%',
        change: 0.0004,
        sparklineData: [
          { date: 'Mar 25', value: 0.0035 },
          { date: 'Mar 26', value: 0.0037 },
          { date: 'Mar 27', value: 0.0041 }
        ],
        status: 'normal',
        spread: 0.0041,
        tenYearYield: 0.042,
        twoYearYield: 0.0379,
        lastUpdated: new Date().toISOString(),
        latestDataDate: '2025-03-27'
      };
      
      expect(validateYieldCurveData(validData)).toBe(true);
      
      // Invalid data - missing title
      const missingTitle = { ...validData, title: '' };
      expect(validateYieldCurveData(missingTitle)).toBe(false);
      
      // Invalid data - invalid spread
      const invalidSpread = { ...validData, spread: NaN };
      expect(validateYieldCurveData(invalidSpread)).toBe(false);
      
      // Invalid data - spread out of range
      const outOfRangeSpread = { ...validData, spread: 0.1 }; // 10% is too high
      expect(validateYieldCurveData(outOfRangeSpread)).toBe(false);
      
      // Invalid data - empty sparkline data
      const emptySparkline = { ...validData, sparklineData: [] };
      expect(validateYieldCurveData(emptySparkline)).toBe(false);
      
      // Invalid data - invalid last inversion
      const invalidLastInversion = {
        ...validData,
        lastInversion: {
          date: 'not-a-date',
          duration: '3 months',
          followedByRecession: true
        }
      };
      expect(validateYieldCurveData(invalidLastInversion)).toBe(false);
    });
  });
});
