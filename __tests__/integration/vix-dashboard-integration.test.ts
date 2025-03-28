/**
 * Integration test for VIX dashboard integration
 */

import { fetchVixIndicator } from '../../lib/api/vix';

describe('VIX Dashboard Integration', () => {
  // Set longer timeout for API calls
  jest.setTimeout(30000);

  // Ensure we're in development mode for the tests
  const originalNodeEnv = process.env.NODE_ENV;
  beforeAll(() => {
    process.env.NODE_ENV = 'development';
  });
  
  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  test('should return correctly formatted VIX data for dashboard display', async () => {
    const vixData = await fetchVixIndicator();
    
    // Verify the structure meets the IndicatorProps interface requirements
    expect(vixData).toHaveProperty('id');
    expect(vixData).toHaveProperty('name');
    expect(vixData).toHaveProperty('description');
    expect(vixData).toHaveProperty('value');
    expect(vixData).toHaveProperty('status');
    expect(vixData).toHaveProperty('explanation');
    
    // Check ID and name
    expect(vixData.id).toBe('vix');
    expect(vixData.name).toBe('VIX (Fear Index)');
    
    // Check sparkline data format if it exists
    if (vixData.sparklineData && vixData.sparklineData.length > 0) {
      const firstPoint = vixData.sparklineData[0];
      expect(firstPoint).toHaveProperty('date');
      expect(firstPoint).toHaveProperty('value');
      expect(typeof firstPoint.date).toBe('string');
      expect(typeof firstPoint.value).toBe('number');
    }
    
    // Check that status is one of the valid options
    expect(['normal', 'warning', 'danger', 'good']).toContain(vixData.status);
    
    // Ensure explanation text is provided
    expect(Array.isArray(vixData.explanation)).toBe(true);
    expect(vixData.explanation.length).toBeGreaterThan(0);
    
    // Log the data for manual verification
    console.log('VIX Data for Dashboard:', {
      value: vixData.value,
      status: vixData.status,
      change: vixData.change,
      sparklinePoints: vixData.sparklineData?.length || 0
    });
  });
}); 