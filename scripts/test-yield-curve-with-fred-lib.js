/**
 * This script tests getting yield curve data directly from the FRED library
 * in the project, which demonstrates how the API integration should work.
 */

// Import the FRED API module
const path = require('path');
const { execSync } = require('child_process');

// Setup environment variables (will be loaded from .env.local in production)
process.env.FRED_API_KEY = process.env.FRED_API_KEY;

// Check if we have a FRED API key available
if (!process.env.FRED_API_KEY) {
  console.error("Error: FRED_API_KEY not found in environment variables.");
  console.error("This test requires a valid FRED API key to run.");
  console.error("Please set the FRED_API_KEY environment variable or add it to .env.local.");
  console.error("\nTo get a FRED API key:");
  console.error("1. Go to https://fred.stlouisfed.org/docs/api/api_key.html");
  console.error("2. Create an account and request an API key");
  console.error("3. Set the environment variable: export FRED_API_KEY=your_api_key_here");
  process.exit(1);
} else {
  console.log("Found FRED API key in environment variables.");
}

// This is the main test function
async function testFredFetchForYieldCurve() {
  console.log('Starting test of FRED yield curve data fetch');

  try {
    // We'll use typescript directly to run the code from the library
    const output = execSync(`npx tsx -e "
      import { fetchYieldCurveData } from './lib/api/fred';
      
      async function runTest() {
        try {
          console.log('Fetching yield curve data from FRED API...');
          const data = await fetchYieldCurveData('1m', true);
          
          console.log('\\nYield Curve Data:');
          console.log('==================');
          console.log(\`Spread: \${(data.spread * 100).toFixed(2)}%\`);
          console.log(\`10-Year Yield: \${(data.tenYearYield * 100).toFixed(2)}%\`);
          console.log(\`2-Year Yield: \${(data.twoYearYield * 100).toFixed(2)}%\`);
          console.log(\`Status: \${data.status}\`);
          console.log(\`Latest Data Date: \${data.latestDataDate}\`);
          console.log(\`Last Updated: \${data.lastUpdated}\`);
          console.log(\`Data Points: \${data.sparklineData.length}\`);
          
          console.log('\\nSample Points:');
          data.sparklineData.slice(0, 5).forEach((point, i) => {
            console.log(\`  \${i+1}. \${point.date}: \${(point.value * 100).toFixed(2)}%\`);
          });
          
          console.log('\\nData successfully retrieved from FRED API!');
        } catch (error) {
          console.error('Error fetching yield curve data:', error);
        }
      }
      
      runTest();
    "`, { stdio: 'inherit' });
    
    console.log('\nTest completed successfully.');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testFredFetchForYieldCurve(); 