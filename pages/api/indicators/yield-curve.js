// Make sure we're getting data directly from Supabase
const { createClient } = require('@supabase/supabase-js');

// Constants for FRED API integration
const FRED_SERIES = {
  T10Y2Y: 'T10Y2Y', // 10-Year Treasury Constant Maturity Minus 2-Year Treasury Constant Maturity
  DGS10: 'DGS10',   // 10-Year Treasury Constant Maturity Rate
  DGS2: 'DGS2'      // 2-Year Treasury Constant Maturity Rate
};

// Helper function to fetch data from FRED API
async function fetchFredData(seriesId, limit) {
  // Get FRED API key from environment
  const FRED_API_KEY = process.env.FRED_API_KEY;
  
  if (!FRED_API_KEY) {
    console.error('FRED_API_KEY not found in environment variables');
    throw new Error('FRED_API_KEY not found in environment variables');
  }
  
  // Use tomorrow's date to ensure we get the latest data
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  // Add timestamp to prevent caching
  const timestamp = new Date().getTime();
  
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=${limit}&observation_end=${tomorrowStr}&_=${timestamp}`;
  
  console.log(`Fetching FRED data for ${seriesId}...`);
  
  const response = await fetch(url, { 
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache, no-store'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`FRED API error for ${seriesId}:`, {
      status: response.status,
      statusText: response.statusText,
      responseText: errorText
    });
    throw new Error(`FRED API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.observations && data.observations.length > 0) {
    console.log(`Received ${data.observations.length} observations for ${seriesId}, latest date: ${data.observations[0].date}`);
  } else {
    console.warn(`No observations returned for ${seriesId}`);
  }
  
  return data;
}

// Helper function to get appropriate limit based on timeframe
function getLimitFromTimeframe(timeframe) {
  switch(timeframe) {
    case '1m': return 30;   // ~1 month of trading days
    case '3m': return 90;   // ~3 months of trading days
    case '6m': return 180;  // ~6 months of trading days
    case '1y': return 365;  // ~1 year of data
    case '2y': return 600;  // ~2 years of data
    case '5y': return 1250; // ~5 years of data
    default: return 30;     // Default to 1 month
  }
}

// Fetch yield curve data from FRED API
async function fetchYieldCurveDataFromFRED(period) {
  console.log('Attempting to fetch treasury yield data from FRED API');
  
  try {
    const limit = getLimitFromTimeframe(period);
    
    // 1. Fetch the 10Y-2Y spread data
    const spreadData = await fetchFredData(FRED_SERIES.T10Y2Y, limit);
    
    // 2. Fetch the latest 10Y and 2Y yields
    const [tenYearData, twoYearData] = await Promise.all([
      fetchFredData(FRED_SERIES.DGS10, 1),
      fetchFredData(FRED_SERIES.DGS2, 1)
    ]);
    
    // Check if we have valid observations
    if (!spreadData.observations || spreadData.observations.length === 0) {
      throw new Error('No spread data observations returned from FRED API');
    }
    
    if (!tenYearData.observations || tenYearData.observations.length === 0) {
      throw new Error('No 10-year yield data observations returned from FRED API');
    }
    
    if (!twoYearData.observations || twoYearData.observations.length === 0) {
      throw new Error('No 2-year yield data observations returned from FRED API');
    }
    
    // Get the latest valid values
    const currentSpreadStr = spreadData.observations[0].value;
    const tenYearYieldStr = tenYearData.observations[0].value;
    const twoYearYieldStr = twoYearData.observations[0].value;
    
    // Check for missing values (FRED uses '.' for missing data)
    if (currentSpreadStr === '.' || currentSpreadStr === '') {
      throw new Error('Invalid spread value returned from FRED API');
    }
    
    if (tenYearYieldStr === '.' || tenYearYieldStr === '') {
      throw new Error('Invalid 10-year yield value returned from FRED API');
    }
    
    if (twoYearYieldStr === '.' || twoYearYieldStr === '') {
      throw new Error('Invalid 2-year yield value returned from FRED API');
    }
    
    // Convert to decimal values (FRED returns percentages)
    const spread = parseFloat(currentSpreadStr) / 100;
    const tenYearYield = parseFloat(tenYearYieldStr) / 100;
    const twoYearYield = parseFloat(twoYearYieldStr) / 100;
    
    // Calculate change from previous day
    const previousSpread = spreadData.observations.length > 1 
      ? parseFloat(spreadData.observations[1].value || '0') / 100
      : spread;
    const change = spread - previousSpread;
    
    // Format the sparkline data (convert percentage to decimal)
    const sparklineData = spreadData.observations
      .filter(obs => obs.value !== '.' && obs.value !== '')
      .map(obs => ({
        date: new Date(obs.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: parseFloat(obs.value) / 100, // Convert to decimal
        isoDate: obs.date
      }))
      .reverse(); // Reverse to get chronological order
    
    console.log('Successfully processed FRED API data');
    
    return {
      title: "Yield Curve",
      value: `${(spread * 100).toFixed(2)}%`,
      change: change,
      status: spread < 0 ? 'danger' : 'normal',
      spread: spread,
      tenYearYield: tenYearYield,
      twoYearYield: twoYearYield,
      sparklineData: sparklineData,
      latestDataDate: spreadData.observations[0].date,
      lastUpdated: new Date().toISOString(),
      source: 'FRED'
    };
  } catch (error) {
    console.error('Error fetching yield curve data from FRED:', error);
    throw error;
  }
}

// Fallback data generator for when all other data sources fail
function generateFallbackData(period) {
  console.log('Using fallback data generator since both Supabase and FRED API failed');
  const today = new Date();
  const dataPoints = [];
  const pointsCount = period === '1m' ? 30 : 
                     period === '3m' ? 90 :
                     period === '6m' ? 180 :
                     period === '1y' ? 365 :
                     period === '2y' ? 730 : 1825; // 5y
  
  // Use realistic yield curve values
  const baseSpread = -0.0055; // -0.55% is a realistic inverted yield curve value
  
  // Create synthetic data points with slight variations
  for (let i = 0; i < pointsCount; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    
    // Add some random variation to make it look realistic
    const randomVariation = (Math.random() * 0.002) - 0.001; // +/- 0.1%
    const spread = baseSpread + randomVariation;
    
    dataPoints.push({
      date: date.toISOString().split('T')[0],
      spread: spread,
      ten_year_yield: 0.0415 + (Math.random() * 0.002), // Around 4.15%
      two_year_yield: 0.047 + (Math.random() * 0.002),  // Around 4.7%
      status: spread < 0 ? 'danger' : 'normal'
    });
  }
  
  // Sort by date descending (newest first)
  return dataPoints.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

module.exports = async function handler(req, res) {
  try {
    const { period = '1m', source = 'supabase' } = req.query;
    console.log(`API Request: period=${period}, source=${source}`);
    
    let yieldCurveData;
    let dataSource = 'Supabase';
    
    // STEP 1: Try to get data from Supabase
    if (source !== 'fred-only') {
      try {
        console.log('Attempting to fetch data from Supabase');
        
        // Initialize Supabase client
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        // Calculate date range based on period
        const today = new Date();
        let lookbackDate = new Date();
        
        switch(period) {
          case '1m': lookbackDate.setMonth(today.getMonth() - 1); break;
          case '3m': lookbackDate.setMonth(today.getMonth() - 3); break;
          case '6m': lookbackDate.setMonth(today.getMonth() - 6); break;
          case '1y': lookbackDate.setFullYear(today.getFullYear() - 1); break;
          case '2y': lookbackDate.setFullYear(today.getFullYear() - 2); break;
          case '5y': lookbackDate.setFullYear(today.getFullYear() - 5); break;
          default: lookbackDate.setMonth(today.getMonth() - 1);
        }
        
        // Format dates for query
        const fromDate = lookbackDate.toISOString().split('T')[0];
        console.log(`Date range: ${fromDate} to present`);
        
        // Attempt to fetch data from Supabase
        const { data, error } = await supabase
          .from('yield_curve')
          .select('*')
          .gte('date', fromDate)
          .order('date', { ascending: false });
          
        if (error) {
          // If table doesn't exist, we'll try FRED API
          if (error.code === '42P01') {
            console.warn('Yield curve table does not exist in Supabase, trying FRED API');
            throw new Error('Supabase table does not exist');
          } else {
            // For other errors, propagate the error
            throw error;
          }
        }
        
        // If no data was found, we'll try FRED API
        if (!data || data.length === 0) {
          console.warn('No yield curve data found in Supabase, trying FRED API');
          throw new Error('No data found in Supabase');
        }
        
        console.log(`Retrieved ${data.length} records from Supabase`);
        yieldCurveData = data;
        dataSource = 'Supabase';
      } catch (error) {
        console.warn(`Supabase query failed: ${error.message}`);
        // Continue to Step 2 (FRED API)
      }
    }
    
    // STEP 2: If Supabase failed or returned no data, try FRED API
    if (!yieldCurveData && source !== 'supabase-only') {
      try {
        console.log('Supabase data not available, attempting to fetch from FRED API');
        const fredData = await fetchYieldCurveDataFromFRED(period);
        
        // Use FRED data as is - it's already in the right format
        return res.status(200).json(fredData);
      } catch (fredError) {
        console.error('FRED API fetch failed:', fredError);
        // Continue to Step 3 (fallback data)
      }
    }
    
    // STEP 3: Generate fallback data only if both Supabase and FRED API failed
    if (!yieldCurveData) {
      console.warn('Both Supabase and FRED API failed, using fallback data generator');
      yieldCurveData = generateFallbackData(period);
      dataSource = 'Fallback Generator';
    }
    
    console.log(`Using ${yieldCurveData.length} records from ${dataSource}`);
    console.log('First record sample:', JSON.stringify(yieldCurveData[0]));
    
    // Get the most recent data point
    const latestData = yieldCurveData[0];
    
    // Calculate change from previous day
    const previousData = yieldCurveData[1] || null;
    const change = previousData ? Number(latestData.spread) - Number(previousData.spread) : 0;
    
    // Format the response with correct data types - ENSURE ALL VALUES ARE PROPER NUMBERS
    const sparklineData = yieldCurveData.map(point => ({
      date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Number(point.spread), // Convert to number explicitly
      isoDate: point.date
    })).reverse(); // Reverse to get chronological order
    
    // Sample a few values to verify they're correct
    console.log('Sample sparkline data (first 3 points):');
    sparklineData.slice(0, 3).forEach((point, i) => {
      console.log(`  Point ${i}: ${point.date}, value=${point.value}, converted to ${(point.value * 100).toFixed(2)}%`);
    });
    
    // Format the response
    const response = {
      title: "Yield Curve",
      value: `${(Number(latestData.spread) * 100).toFixed(2)}%`,
      change: change,
      status: latestData.status || (Number(latestData.spread) < 0 ? 'danger' : 'normal'),
      spread: Number(latestData.spread), // Convert to number explicitly
      tenYearYield: Number(latestData.ten_year_yield), // Convert to number explicitly
      twoYearYield: Number(latestData.two_year_yield), // Convert to number explicitly
      sparklineData,
      latestDataDate: latestData.date,
      lastUpdated: new Date().toISOString(),
      source: dataSource
    };
    
    console.log('Sending API response with values:', {
      spread: response.spread,
      tenYearYield: response.tenYearYield,
      twoYearYield: response.twoYearYield,
      change: response.change,
      dataPoints: response.sparklineData.length,
      source: response.source
    });
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in yield-curve API:', error);
    
    // Try FRED API as a last resort if we haven't tried it yet
    try {
      console.log('Attempting emergency FRED API fetch after error');
      const fredData = await fetchYieldCurveDataFromFRED('1m');
      return res.status(200).json(fredData);
    } catch (fredError) {
      console.error('Emergency FRED API fetch also failed:', fredError);
    }
    
    // Return fallback data if everything else fails
    const fallbackData = generateFallbackData('1m');
    const latestData = fallbackData[0];
    
    const sparklineData = fallbackData.map(point => ({
      date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Number(point.spread),
      isoDate: point.date
    })).reverse();
    
    const response = {
      title: "Yield Curve",
      value: `${(Number(latestData.spread) * 100).toFixed(2)}%`,
      change: 0,
      status: 'danger',
      spread: Number(latestData.spread),
      tenYearYield: Number(latestData.ten_year_yield),
      twoYearYield: Number(latestData.two_year_yield),
      sparklineData,
      latestDataDate: latestData.date,
      lastUpdated: new Date().toISOString(),
      source: 'Emergency Fallback Generator'
    };
    
    console.log('Sending emergency fallback response after all data sources failed');
    res.status(200).json(response);
  }
} 