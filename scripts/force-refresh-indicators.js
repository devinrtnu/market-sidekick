/**
 * Script to force refresh indicator caches
 * Run with: node scripts/force-refresh-indicators.js
 */

// Get the API host from command line or default to localhost
const host = process.argv[2] || 'http://localhost:3000';

async function refreshIndicators() {
  try {
    console.log(`Refreshing indicators cache from ${host}...`);
    
    // Force a refresh of the put-call ratio cache
    console.log('Refreshing Put/Call ratio...');
    const putCallResponse = await fetch(`${host}/api/indicators/put-call-ratio?no-cache=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    if (!putCallResponse.ok) {
      console.error(`❌ Failed to refresh Put/Call ratio: ${putCallResponse.status}`);
    } else {
      const data = await putCallResponse.json();
      console.log(`✅ Put/Call ratio refreshed successfully: ${data.totalPutCallRatio}`);
    }
    
    // Add more indicators here as needed
    
    console.log('Refresh complete!');
  } catch (error) {
    console.error('Error refreshing indicators:', error);
    process.exit(1);
  }
}

// Run the refresh
refreshIndicators().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 