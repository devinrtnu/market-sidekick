/**
 * This script is for testing the FRED API integration with real data.
 * It bypasses the cache and makes direct API calls to verify the latest data is accessible.
 * 
 * Usage: npx tsx scripts/test-fred-live.ts
 */

// Set up environment manually for the test
process.env.FRED_API_KEY = process.env.FRED_API_KEY || 'YOUR_FRED_API_KEY_HERE';

// Direct API testing
async function testFredApi() {
  const FRED_API_KEY = process.env.FRED_API_KEY;
  if (!FRED_API_KEY || FRED_API_KEY === 'YOUR_FRED_API_KEY_HERE') {
    console.error('Error: FRED_API_KEY is not set. Please set it in your environment variables.');
    process.exit(1);
  }

  // Add current timestamp to prevent caching by the API
  const timestamp = new Date().getTime();
  
  // Series IDs to test
  const seriesIds = ['T10Y2Y', 'DGS10', 'DGS2'];
  
  // Use tomorrow's date to ensure we get the latest data
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  console.log(`Testing FRED API with observation_end=${tomorrowStr}`);
  
  for (const seriesId of seriesIds) {
    try {
      // Build the API URL with all necessary parameters
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=30&observation_end=${tomorrowStr}&_=${timestamp}`;
      
      console.log(`Fetching ${seriesId} data directly from FRED API...`);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`FRED API error for ${seriesId}:`, {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        });
        continue;
      }
      
      const data = await response.json();
      
      if (data.observations && data.observations.length > 0) {
        // Display the most recent observations
        console.log(`\n${seriesId} - Latest 5 observations:`);
        
        data.observations.slice(0, 5).forEach((obs: any, index: number) => {
          console.log(`  ${index + 1}. ${obs.date}: ${obs.value}`);
        });
        
        // Check for March 27 specifically
        const mar27Data = data.observations.find((obs: any) => obs.date === '2025-03-27');
        if (mar27Data) {
          console.log(`\n✅ March 27th data found for ${seriesId}: ${mar27Data.value}`);
        } else {
          console.log(`\n❌ March 27th data NOT found for ${seriesId}`);
          
          // Check what's the latest date
          const latestDate = data.observations[0]?.date;
          console.log(`  Latest available date is: ${latestDate}`);
        }
      } else {
        console.warn(`No observations returned for ${seriesId}`);
      }
    } catch (error) {
      console.error(`Error fetching ${seriesId}:`, error);
    }
  }
}

// Execute the test
testFredApi()
  .then(() => {
    console.log("\nFRED API test completed.");
  })
  .catch((error) => {
    console.error("Error running FRED API test:", error);
    process.exit(1);
  }); 