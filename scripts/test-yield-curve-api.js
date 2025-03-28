// Test script for yield curve API
const handler = require('../pages/api/indicators/yield-curve');

// Mock environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase-url.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
process.env.FRED_API_KEY = process.env.FRED_API_KEY || 'YOUR_FRED_API_KEY'; // Use actual key if available

// Function to run a test with specific parameters
async function runTest(description, query = {}) {
  console.log(`\n=== ${description} ===`);
  
  // Mock request and response
  const req = {
    query: {
      period: '1m',
      ...query
    }
  };

  const res = {
    status: (code) => {
      console.log(`Response status: ${code}`);
      return res;
    },
    json: (data) => {
      console.log('API Response Source:', data.source);
      
      // Analyze the response data
      console.log('\nData Analysis:');
      console.log(`- Spread value: ${data.spread} (${(data.spread * 100).toFixed(2)}%)`);
      console.log(`- 10Y Yield: ${data.tenYearYield} (${(data.tenYearYield * 100).toFixed(2)}%)`);
      console.log(`- 2Y Yield: ${data.twoYearYield} (${(data.twoYearYield * 100).toFixed(2)}%)`);
      console.log(`- Data source: ${data.source}`);
      console.log(`- Number of data points: ${data.sparklineData.length}`);
      
      // Check values are in correct range
      const valuesInRange = data.sparklineData.every(point => 
        point.value > -0.1 && point.value < 0.1
      );
      
      console.log(`- All values in correct range (-10% to 10%)? ${valuesInRange ? 'YES' : 'NO'}`);
      
      // Check values are in decimal format
      const avgValue = data.sparklineData.reduce((sum, point) => sum + point.value, 0) / data.sparklineData.length;
      console.log(`- Average value: ${avgValue} (${(avgValue * 100).toFixed(2)}%)`);
      
      return res;
    }
  };

  try {
    // Test the handler
    await handler(req, res);
    console.log('\nTest completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run tests for different scenarios
async function runAllTests() {
  // Test 1: Default behavior (should try Supabase first, then FRED)
  await runTest('Test normal API flow (Supabase -> FRED -> Fallback)');
  
  // Test 2: Force FRED API only
  await runTest('Test FRED API directly', { source: 'fred-only' });
  
  // Test 3: Force Supabase only
  await runTest('Test Supabase only (fallback to synthetic data)', { source: 'supabase-only' });
  
  // Test 4: Different time period
  await runTest('Test with 3-month period', { period: '3m' });
}

console.log('Testing yield curve API handler with proper data sources cascade...');
runAllTests(); 