/**
 * Integration test for VIX data fetching functions
 */
import { fetchCurrentVix, fetchTermStructure } from '../../lib/api/vix-utils';
import { fetchHistoricalVixData } from '../../lib/api/vix-utils';

// First, let's add the utility functions to a separate file
// Create lib/api/vix-utils.ts with the extracted functions from the API routes

describe('VIX Data Integration', () => {
  jest.setTimeout(30000); // 30 seconds timeout for API calls

  // Ensure we're in development mode for the tests
  const originalNodeEnv = process.env.NODE_ENV;
  beforeAll(() => {
    process.env.NODE_ENV = 'development';
  });
  
  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  test('should fetch current VIX data successfully', async () => {
    const { currentVix, previousClose } = await fetchCurrentVix();
    
    // In development mode, we should at least get mock data
    expect(currentVix).not.toBeNull();
    expect(typeof currentVix).toBe('number');
    
    // VIX is typically between 10 and 50
    expect(currentVix).toBeGreaterThan(5);
    expect(currentVix).toBeLessThan(100);
    
    console.log(`Current VIX: ${currentVix}, Previous Close: ${previousClose}`);
  });
  
  test('should fetch VIX term structure successfully', async () => {
    const termStructure = await fetchTermStructure();
    
    // Should have the correct structure
    expect(termStructure).toHaveProperty('oneMonth');
    expect(termStructure).toHaveProperty('threeMonth');
    expect(termStructure).toHaveProperty('sixMonth');
    
    // In development mode, at least one term should be available
    const hasTermData = termStructure.oneMonth !== null || 
                        termStructure.threeMonth !== null || 
                        termStructure.sixMonth !== null;
    expect(hasTermData).toBe(true);
    
    console.log('Term Structure:', termStructure);
  });
  
  test('should fetch historical VIX data successfully', async () => {
    const historicalData = await fetchHistoricalVixData('1mo', '1d');
    
    // Should have data points
    expect(Array.isArray(historicalData)).toBe(true);
    expect(historicalData.length).toBeGreaterThan(0);
    
    // Each data point should have the right structure
    const firstPoint = historicalData[0];
    expect(firstPoint).toHaveProperty('date');
    expect(firstPoint).toHaveProperty('value');
    expect(typeof firstPoint.date).toBe('number');
    expect(typeof firstPoint.value).toBe('number');
    
    // Log the date range
    const firstDate = new Date(historicalData[0].date).toLocaleDateString();
    const lastDate = new Date(historicalData[historicalData.length - 1].date).toLocaleDateString();
    console.log(`Historical data: ${historicalData.length} points, ${firstDate} to ${lastDate}`);
  });
}); 