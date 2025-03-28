// Script to fetch and store 5 years of historical yield curve data
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const fredApiKey = process.env.FRED_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please check .env.local file.');
  process.exit(1);
}

if (!fredApiKey) {
  console.error('❌ Missing FRED API key. Please set FRED_API_KEY in .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// FRED Series IDs
const SERIES = {
  T10Y2Y: 'T10Y2Y',  // 10-Year Treasury Constant Maturity Minus 2-Year Treasury Constant Maturity
  DGS10: 'DGS10',    // 10-Year Treasury Constant Maturity Rate
  DGS2: 'DGS2',      // 2-Year Treasury Constant Maturity Rate
};

// Function to fetch data from FRED API
async function fetchFredSeries(series, limit = 1825) { // Default to ~5 years (1825 days)
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=${limit}`;
  
  console.log(`Fetching ${series} data from FRED API with limit ${limit}...`);
  
  try {
    const response = await fetch(url);
    
    if (response.status === 429) {
      console.error(`❌ Rate limit exceeded for FRED API (${series})`);
      throw new Error('FRED API rate limit exceeded');
    }
    
    if (!response.ok) {
      throw new Error(`FRED API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Successfully fetched ${data.observations.length} observations for ${series}`);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching ${series} data:`, error);
    throw error;
  }
}

// Main function to fetch and store historical data
async function fetchAndStoreHistoricalData() {
  try {
    console.log('🔍 Fetching 5 years of historical yield curve data from FRED...');
    
    // Step 1: Check if tables exist
    try {
      console.log('Verifying database tables...');
      const { count: dailyCount, error: dailyError } = await supabase
        .from('daily_yield_curves')
        .select('*', { count: 'exact', head: true });
        
      const { count: sparklineCount, error: sparklineError } = await supabase
        .from('yield_curve_sparklines')
        .select('*', { count: 'exact', head: true });
        
      if (dailyError || sparklineError) {
        console.error('❌ Tables verification failed. Error:', dailyError || sparklineError);
        console.error('Please run the create-yield-curve-tables script first.');
        process.exit(1);
      }
      
      console.log(`✅ Tables verified. Found ${dailyCount} daily records and ${sparklineCount} sparkline records.`);
    } catch (verifyError) {
      console.error('❌ Tables verification failed:', verifyError);
      console.error('Please run the create-yield-curve-tables script first.');
      process.exit(1);
    }
    
    // Step 2: Fetch all required data from FRED
    console.log('Fetching T10Y2Y spread data for the last 5 years...');
    const spreadData = await fetchFredSeries(SERIES.T10Y2Y, 1825); // ~5 years of daily data
    
    // Add delay to avoid rate limiting
    console.log('Waiting 2 seconds before next API call...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Fetching DGS10 (10-year yield) data for the last 5 years...');
    const tenYearData = await fetchFredSeries(SERIES.DGS10, 1825);
    
    // Add delay to avoid rate limiting
    console.log('Waiting 2 seconds before next API call...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Fetching DGS2 (2-year yield) data for the last 5 years...');
    const twoYearData = await fetchFredSeries(SERIES.DGS2, 1825);
    
    // Step 3: Process and merge the data
    console.log('Processing data...');
    
    // Create a map of dates to data points
    const spreadMap = new Map();
    const tenYearMap = new Map();
    const twoYearMap = new Map();
    
    // Map the observations by date
    spreadData.observations.forEach(obs => {
      if (obs.value !== '.') {
        spreadMap.set(obs.date, parseFloat(obs.value));
      }
    });
    
    tenYearData.observations.forEach(obs => {
      if (obs.value !== '.') {
        tenYearMap.set(obs.date, parseFloat(obs.value) / 100); // Convert percentage to decimal
      }
    });
    
    twoYearData.observations.forEach(obs => {
      if (obs.value !== '.') {
        twoYearMap.set(obs.date, parseFloat(obs.value) / 100); // Convert percentage to decimal
      }
    });
    
    // Create records with all three data points where available
    const completeRecords = [];
    const sparklineRecords = [];
    
    spreadMap.forEach((spreadValue, date) => {
      const tenYearValue = tenYearMap.get(date);
      const twoYearValue = twoYearMap.get(date);
      
      if (tenYearValue !== undefined && twoYearValue !== undefined) {
        // Create daily yield curve record
        completeRecords.push({
          date,
          spread: spreadValue,
          ten_year_yield: tenYearValue,
          two_year_yield: twoYearValue,
          status: determineStatus(spreadValue)
        });
        
        // Create sparkline records for different timeframes
        const timeframes = ['1m', '3m', '6m', '1y', '2y', '5y'];
        timeframes.forEach(timeframe => {
          sparklineRecords.push({
            date,
            timeframe,
            spread: spreadValue
          });
        });
      }
    });
    
    console.log(`Generated ${completeRecords.length} complete data records and ${sparklineRecords.length} sparkline data points`);
    
    // Step 4: Store data in database
    if (completeRecords.length > 0) {
      console.log('Storing daily yield curve data...');
      
      // Store in batches to avoid hitting statement limits
      const batchSize = 100;
      
      for (let i = 0; i < completeRecords.length; i += batchSize) {
        const batch = completeRecords.slice(i, i + batchSize);
        const { error: dailyError } = await supabase
          .from('daily_yield_curves')
          .upsert(batch, { 
            onConflict: 'date',
            ignoreDuplicates: false // Update if exists
          });
        
        if (dailyError) {
          console.error(`❌ Error inserting daily data batch ${i/batchSize + 1}:`, dailyError.message);
        } else {
          console.log(`✅ Successfully inserted daily batch ${i/batchSize + 1} of ${Math.ceil(completeRecords.length/batchSize)}`);
        }
      }
    }
    
    if (sparklineRecords.length > 0) {
      console.log('Storing sparkline data...');
      
      // Store in batches to avoid hitting statement limits
      const batchSize = 100;
      
      for (let i = 0; i < sparklineRecords.length; i += batchSize) {
        const batch = sparklineRecords.slice(i, i + batchSize);
        const { error: sparklineError } = await supabase
          .from('yield_curve_sparklines')
          .upsert(batch, { 
            onConflict: 'date,timeframe',
            ignoreDuplicates: false // Update if exists
          });
        
        if (sparklineError) {
          console.error(`❌ Error inserting sparkline batch ${i/batchSize + 1}:`, sparklineError.message);
        } else {
          console.log(`✅ Successfully inserted sparkline batch ${i/batchSize + 1} of ${Math.ceil(sparklineRecords.length/batchSize)}`);
        }
      }
    }
    
    console.log('\n🎉 Historical yield curve data stored successfully!');
    console.log(`Stored ${completeRecords.length} daily records and ${sparklineRecords.length} sparkline data points.`);
    
  } catch (error) {
    console.error('❌ Error fetching and storing historical data:', error);
    process.exit(1);
  }
}

// Helper function to determine status based on spread
function determineStatus(spread) {
  if (spread < 0) return 'danger';     // Inverted yield curve (negative spread)
  if (spread < 0.001) return 'warning'; // Very close to inversion
  return 'normal';                      // Normal yield curve
}

// Run the function
fetchAndStoreHistoricalData(); 