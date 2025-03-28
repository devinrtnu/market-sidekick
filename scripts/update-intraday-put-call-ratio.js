/**
 * Script to update intraday put-call ratio in the database (runs every 30 minutes)
 * Run with: node scripts/update-intraday-put-call-ratio.js
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
 * Extract detailed put-call ratio data from CBOE website using Firecrawl
 * Tries to get total volumes for puts and calls if available
 */
async function extractDetailedPutCallRatio() {
  try {
    console.log('[Intraday] Extracting put-call ratio from CBOE...');
    
    // Initialize FireCrawlApp with the provided API key
    const app = new FireCrawlApp({ apiKey: FIRECRAWL_API_KEY });
    
    // Use the extract method with a more detailed prompt to pull data from the CBOE website
    const result = await app.extract([
      "https://cboe.com/us/options/market_statistics/"
    ], {
      prompt: `
        Find the most recent Put/Call Ratio data from the webpage. 
        Extract these values:
        1. Total Put/Call Ratio (as decimal number)
        2. Total Put Volume (as number)
        3. Total Call Volume (as number)
        
        Return as a structured JSON with these exact keys:
        {
          "totalPutCallRatio": number,
          "putVolume": number,
          "callVolume": number,
          "totalVolume": number
        }
      `
    });
    
    // Log the raw response for debugging
    console.log('[Intraday] Firecrawl response:', JSON.stringify(result, null, 2));
    
    // Check if we got a direct result in the data object with all fields
    if (result.data && 
        typeof result.data.totalPutCallRatio === 'number' && 
        typeof result.data.putVolume === 'number' && 
        typeof result.data.callVolume === 'number') {
      return {
        ratio: result.data.totalPutCallRatio,
        putsVolume: result.data.putVolume,
        callsVolume: result.data.callVolume,
        totalVolume: result.data.totalVolume || (result.data.putVolume + result.data.callVolume)
      };
    }
    
    // If we didn't get the complete structured data, try to extract just the ratio
    // as a fallback method similar to the original script
    if (result.data && typeof result.data.totalPutCallRatio === 'number') {
      return {
        ratio: result.data.totalPutCallRatio,
        putsVolume: null,
        callsVolume: null,
        totalVolume: null
      };
    }
    
    // Try to find the ratio in any property of the data object
    if (result.data) {
      for (const key in result.data) {
        const value = result.data[key];
        if (typeof value === 'number' && value >= 0.5 && value <= 1.5) {
          return {
            ratio: value,
            putsVolume: null,
            callsVolume: null,
            totalVolume: null
          };
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
        return {
          ratio: potentialRatios[0],
          putsVolume: null,
          callsVolume: null,
          totalVolume: null
        };
      }
    }
    
    throw new Error('Could not find put-call ratio in Firecrawl response');
  } catch (error) {
    console.error('[Intraday] Error extracting put-call ratio with Firecrawl:', error);
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
 * Update the intraday put-call ratio in the database
 */
async function updateIntradayPutCallRatio() {
  try {
    // Get current timestamp
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const timeOfDay = now.toISOString().split('T')[1].substring(0, 8); // HH:MM:SS format
    
    console.log(`[Intraday] Updating put-call ratio for ${date} at ${timeOfDay}...`);
    
    // Extract the detailed put-call ratio from CBOE
    const ratioData = await extractDetailedPutCallRatio();
    
    console.log(`[Intraday] Extracted put-call ratio: ${ratioData.ratio} (Puts: ${ratioData.putsVolume}, Calls: ${ratioData.callsVolume})`);
    
    // Determine the status
    const status = determinePutCallStatus(ratioData.ratio);
    console.log(`[Intraday] Status: ${status}`);
    
    // Store the value in the intraday database
    const { data, error } = await supabase
      .from('intraday_put_call_ratios')
      .insert({
        timestamp: now.toISOString(),
        date: date,
        time_of_day: timeOfDay,
        ratio_value: ratioData.ratio,
        puts_volume: ratioData.putsVolume,
        calls_volume: ratioData.callsVolume,
        total_volume: ratioData.totalVolume,
        status: status,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      });
    
    if (error) {
      console.error('[Intraday] Error updating database:', error);
      return false;
    }
    
    console.log('[Intraday] Successfully updated intraday put-call ratio in database');
    
    // Check if it's 3:15 PM ET to record the end-of-day value
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    
    // 3:15 PM ET = 19:15 UTC during standard time, 20:15 during daylight saving
    const isEndOfDay = (hours === 19 || hours === 20) && minutes >= 15 && minutes < 30;
    
    if (isEndOfDay) {
      console.log('[Intraday] It\'s approximately 3:15 PM ET, recording end-of-day value');
      
      // Call the database function to record the end-of-day value
      const { error: funcError } = await supabase.rpc('record_eod_put_call_ratio');
      
      if (funcError) {
        console.error('[Intraday] Error recording end-of-day value:', funcError);
      } else {
        console.log('[Intraday] Successfully recorded end-of-day put-call ratio');
      }
    }
    
    return true;
  } catch (error) {
    console.error('[Intraday] Failed to update intraday put-call ratio:', error);
    return false;
  }
}

// Run the update
updateIntradayPutCallRatio().then((success) => {
  if (success) {
    console.log('[Intraday] Put-call ratio update completed successfully');
  } else {
    console.error('[Intraday] Put-call ratio update failed');
    process.exit(1);
  }
  process.exit(0);
}).catch(error => {
  console.error('[Intraday] Fatal error:', error);
  process.exit(1);
}); 