/**
 * Script to record the end-of-day put-call ratio at 3:15 PM ET
 * This script takes the latest intraday value and records it as the official 
 * end-of-day value for historical tracking and charting.
 * 
 * Run with: node scripts/record-eod-put-call-ratio.js
 */

// Use require for Node.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Record the end-of-day put-call ratio
 */
async function recordEndOfDayPutCallRatio() {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log(`[EOD] Recording end-of-day put-call ratio for ${today}...`);
    
    // First check if we have any intraday data for today
    const { data: intradayData, error: intradayError } = await supabase
      .from('intraday_put_call_ratios')
      .select('*')
      .eq('date', today)
      .order('timestamp', { ascending: false })
      .limit(1);
    
    if (intradayError) {
      console.error('[EOD] Error fetching intraday data:', intradayError);
      return false;
    }
    
    if (!intradayData || intradayData.length === 0) {
      console.error('[EOD] No intraday data found for today');
      return false;
    }
    
    const latestIntraday = intradayData[0];
    console.log(`[EOD] Latest intraday value: ${latestIntraday.ratio_value} at ${latestIntraday.timestamp}`);
    
    // Store the end-of-day value
    const { data, error } = await supabase
      .from('daily_put_call_ratios')
      .upsert({
        date: today,
        ratio_value: latestIntraday.ratio_value,
        status: latestIntraday.status,
        updated_at: now.toISOString()
      }, { onConflict: 'date' });
    
    if (error) {
      console.error('[EOD] Error recording end-of-day value:', error);
      return false;
    }
    
    console.log(`[EOD] Successfully recorded end-of-day put-call ratio ${latestIntraday.ratio_value} for ${today}`);
    return true;
  } catch (error) {
    console.error('[EOD] Failed to record end-of-day put-call ratio:', error);
    return false;
  }
}

// Run the recording process
recordEndOfDayPutCallRatio().then((success) => {
  if (success) {
    console.log('[EOD] End-of-day put-call ratio recording completed successfully');
  } else {
    console.error('[EOD] End-of-day put-call ratio recording failed');
    process.exit(1);
  }
  process.exit(0);
}).catch(error => {
  console.error('[EOD] Fatal error:', error);
  process.exit(1);
}); 