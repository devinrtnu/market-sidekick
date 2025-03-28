import { fetchYieldCurveData } from '@/lib/api/fred';
import { YieldCurveData } from '@/lib/api/types';

// Mock the fetch function
global.fetch = jest.fn();

describe('FRED API Integration', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should correctly process yield curve data from FRED API', async () => {
    // Mock the FRED API responses
    const mockSpreadData = {
      observations: [
        { date: '2025-03-27', value: '0.41' },
        { date: '2025-03-26', value: '0.37' },
        { date: '2025-03-25', value: '0.35' },
        { date: '2025-03-24', value: '0.30' },
        { date: '2025-03-21', value: '0.31' },
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

    // Setup fetch mock to return different responses for different series
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

    // Call the function
    const result = await fetchYieldCurveData('1m');

    // Verify the result matches expected format and values
    expect(result).toBeDefined();
    expect(result.spread).toBe(0.41); // Current spread should be 0.41
    expect(result.tenYearYield).toBe(0.0420); // 4.20%
    expect(result.twoYearYield).toBe(0.0379); // 3.79%
    expect(result.status).toBe('normal'); // Spread > 0.2 should be normal
    expect(result.change).toBeDefined();
    expect(result.sparklineData).toHaveLength(5);

    // Verify sparkline data format
    expect(result.sparklineData[0]).toEqual({
      date: expect.any(String),
      value: expect.any(Number)
    });

    // Verify the sparkline data values are correct
    const expectedSparklineValues = [0.41, 0.37, 0.35, 0.30, 0.31];
    result.sparklineData.forEach((point, index) => {
      expect(point.value).toBe(expectedSparklineValues[index]);
    });
  });

  it('should handle missing or invalid data points', async () => {
    // Mock data with some missing values
    const mockSpreadData = {
      observations: [
        { date: '2025-03-27', value: '0.41' },
        { date: '2025-03-26', value: '.' }, // Missing value
        { date: '2025-03-25', value: '0.35' },
        { date: '2025-03-24', value: '' }, // Empty value
        { date: '2025-03-21', value: '0.31' },
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

    const result = await fetchYieldCurveData('1m');

    // Verify that invalid data points are filtered out
    expect(result.sparklineData).toHaveLength(3); // Only valid points should be included
    expect(result.sparklineData.map(p => p.value)).toEqual([0.41, 0.35, 0.31]);
  });

  it('should handle API errors gracefully', async () => {
    // Mock a failed API response
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    await expect(fetchYieldCurveData('1m')).rejects.toThrow('Failed to fetch yield curve data');
  });
});
