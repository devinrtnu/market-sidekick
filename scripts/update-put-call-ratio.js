/**
 * Script to update today's put-call ratio in the database
 * Run with: node scripts/update-put-call-ratio.js
 */

// Use require for Node.js
const { default: FireCrawlApp } = require('@mendable/firecrawl-js');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Environment variables
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || "fc-200cbf4607c74ea5b7e038609edb0dc7";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Extract the put-call ratio from CBOE website using Firecrawl
 */
async function extractPutCallRatio() {
  try {
    console.log('Extracting put-call ratio from CBOE...');
    
    // Initialize FireCrawlApp with the provided API key
    const app = new FireCrawlApp({ apiKey: FIRECRAWL_API_KEY });
    
    // Use the extract method to pull data from the CBOE website
    const result = await app.extract([
      "https://cboe.com/us/options/market_statistics/"
    ], {
      prompt: "Find the current Put/Call Ratio value from the webpage and return it as a decimal number."
    });
    
    // Log the raw response for debugging
    console.log('Firecrawl response:', JSON.stringify(result, null, 2));
    
    // Check if we got a direct result in the data object
    if (result.data && result.data.putCallRatio && typeof result.data.putCallRatio === 'number') {
      return result.data.putCallRatio;
    }
    
    // Try to find the ratio in any property of the data object
    if (result.data) {
      for (const key in result.data) {
        const value = result.data[key];
        if (typeof value === 'number' && value >= 0.5 && value <= 1.5) {
          return value;
        }
      }
    }
    
    // If we didn't find it in a structured way, search for numbers in the whole response
    const jsonString = JSON.stringify(result);
    const matches = jsonString.match(/\d+\.\d+/g);
    
    if (matches && matches.length > 0) {
      // Filter to only include values that are likely to be P/C ratios (between 0.5 and 1.5)
      const potentialRatios = matches
        .map(m => parseFloat(m))
        .filter(n => n >= 0.5 && n <= 1.5);
      
      if (potentialRatios.length > 0) {
        return potentialRatios[0];
      }
    }
    
    throw new Error('Could not find put-call ratio in Firecrawl response');
  } catch (error) {
    console.error('Error extracting put-call ratio with Firecrawl:', error);
    throw error;
  }
}

/**
 * Determine status based on put-call ratio value
 */
function determinePutCallStatus(ratio) {
  if (ratio < 0.7) {
    return 'normal';  // Low ratio = bullish sentiment = normal
  } else if (ratio < 1.0) {
    return 'warning'; // Medium ratio = neutral to cautious = warning
  } else {
    return 'danger';  // High ratio = bearish sentiment = danger
  }
}

/**
 * Update the put-call ratio in the database
 */
async function updatePutCallRatio() {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`Updating put-call ratio for ${today}...`);
    
    // Extract the put-call ratio from CBOE
    const ratio = await extractPutCallRatio();
    
    console.log(`Extracted put-call ratio: ${ratio}`);
    
    // Determine the status
    const status = determinePutCallStatus(ratio);
    console.log(`Status: ${status}`);
    
    // Store the value in the database with upsert to avoid duplicates
    const { data, error } = await supabase
      .from('put_call_ratios')
      .upsert({
        date: today,
        ratio_value: ratio,
        status: status,
        updated_at: new Date().toISOString()
      }, { onConflict: 'date' });
    
    if (error) {
      console.error('Error updating database:', error);
      return false;
    }
    
    console.log('Successfully updated put-call ratio in database');
    return true;
  } catch (error) {
    console.error('Failed to update put-call ratio:', error);
    return false;
  }
}

// Run the update
updatePutCallRatio().then((success) => {
  if (success) {
    console.log('Put-call ratio update completed successfully');
  } else {
    console.error('Put-call ratio update failed');
    process.exit(1);
  }
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 