import { fetchVixIndicator } from '../../lib/api/vix';

describe('VIX Sparkline Data', () => {
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

  test('should generate properly formatted VIX indicator data with sparkline', async () => {
    const indicatorData = await fetchVixIndicator();
    
    // Validate the overall structure
    expect(indicatorData).toBeDefined();
    expect(indicatorData.id).toBe('vix');
    expect(indicatorData.name).toBe('VIX (Fear Index)');
    
    // Make sure we have a numerical value or fallback
    if (indicatorData.value !== 'N/A') {
      expect(parseFloat(indicatorData.value)).toBeGreaterThan(0);
    }
    
    // Check that we have sparkline data
    expect(indicatorData.sparklineData).toBeDefined();
    expect(Array.isArray(indicatorData.sparklineData)).toBe(true);
    expect(indicatorData.sparklineData.length).toBeGreaterThan(0);
    
    // Validate the sparkline data format
    const firstPoint = indicatorData.sparklineData[0];
    expect(firstPoint).toHaveProperty('date');
    expect(firstPoint).toHaveProperty('value');
    expect(typeof firstPoint.date).toBe('string');
    expect(typeof firstPoint.value).toBe('number');
    
    // Verify the date format matches what we expect (e.g., "Mar 1")
    const dateRegex = /^[A-Z][a-z]{2} \d{1,2}$/;
    expect(dateRegex.test(firstPoint.date)).toBe(true);
    
    // Log some details for manual verification
    console.log(`VIX Value: ${indicatorData.value}`);
    console.log(`Status: ${indicatorData.status}`);
    console.log(`Change: ${indicatorData.change}`);
    console.log(`Sparkline points: ${indicatorData.sparklineData.length}`);
    console.log(`First point: ${firstPoint.date} - ${firstPoint.value}`);
    console.log(`Last point: ${indicatorData.sparklineData[indicatorData.sparklineData.length-1].date} - ${indicatorData.sparklineData[indicatorData.sparklineData.length-1].value}`);
    
    // Print all the dates to verify the sequence
    console.log('All dates:', indicatorData.sparklineData.map(p => p.date).join(', '));
  });
}); 