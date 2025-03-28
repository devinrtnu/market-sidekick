import { NextRequest, NextResponse } from 'next/server';
import { fetchYieldCurveData } from '../../../../lib/api/fred';
import { supabaseAdmin } from '@/lib/supabase';
import { YieldCurveData } from '@/lib/api/types';

export const dynamic = 'force-dynamic';

// Declare type for global rate limit state
declare global {
  var _apiRateLimits: {
    lastRequestTime: number;
    requestCount: number;
    resetTime: number;
  } | undefined;
}

/**
 * GET handler for the yield curve API
 * Returns the yield curve data from the FRED API
 * @param request The incoming request
 * @returns NextResponse with yield curve data
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const period = url.searchParams.get('period') || '1m';
  const forceRefresh = url.searchParams.get('refresh') === 'true';
  
  try {
    // Increase timeout for longer operations
    const timeoutMs = 30000; // 30 seconds instead of 5
    
    // 1. If not forcing refresh, try to get data from database first
    if (!forceRefresh) {
      try {
        console.log(`[API] Attempting to fetch ${period} yield curve data from database`);
        
        // Get data from database with timeout
        const dbDataPromise = getLatestYieldCurveFromDB(period);
        
        // Create the timeout promise with more specific error
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Database query for ${period} data timed out after ${timeoutMs}ms`)), timeoutMs);
        });
        
        // Use Promise.race to implement timeout
        const { data: dbData, latestDataDate } = await Promise.race([
          dbDataPromise,
          timeoutPromise
        ]);
        
        // Check if the data is from today or yesterday (FRED data is often delayed by a day)
        if (dbData && latestDataDate) {
          const dataDate = new Date(latestDataDate);
          const now = new Date();
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          
          // Convert dates to string format for comparison (YYYY-MM-DD)
          const dataDateStr = dataDate.toISOString().split('T')[0];
          const todayStr = now.toISOString().split('T')[0];
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          // If we have today's or yesterday's data, use it
          if (dataDateStr === todayStr || dataDateStr === yesterdayStr) {
            console.log(`[API] Using recent yield curve data from database (${dataDateStr})`);
            return NextResponse.json(dbData);
          } else {
            console.log(`[API] Database data is outdated (${dataDateStr}), fetching fresh data`);
          }
        }
      } catch (timeoutError) {
        // Abort the original promise if possible to free up resources
        console.error(`[API] Database query timed out: ${timeoutError.message}`);
        console.log('[API] Falling back to FRED API due to database timeout');
      }
    } else {
      console.log('[API] Force refresh requested, bypassing database cache');
    }
    
    // 2. Fetch fresh data from FRED API
    console.log(`[API] Fetching fresh yield curve data with timeframe: ${period}`);
    const yieldCurveData = await fetchYieldCurveData(period, forceRefresh);
    
    // 3. Store the fetched data in the database for future use
    // Store this in the background so we don't block the response
    storeYieldCurveData(yieldCurveData, period).catch(e => {
      console.error('[API] Background storage of yield curve data failed:', e);
    });
    
    // 4. Return the data
    return NextResponse.json(yieldCurveData);
  } catch (error) {
    console.error('[API] Error in yield-curve endpoint:', error);
    
    // If an error occurs with the API, try to use the database as fallback
    // even if it's outdated - at least show something
    try {
      console.log('[API] Attempting to use database as fallback after API error');
      const { data: dbData } = await getLatestYieldCurveFromDB(period);
      
      if (dbData) {
        console.log('[API] Successfully retrieved fallback data from database');
        // Mark as error but still return the data
        return NextResponse.json({
          ...dbData,
          status: 'error',
          error: 'Failed to fetch latest data, showing cached data'
        });
      }
    } catch (dbError) {
      console.error('[API] Database fallback also failed:', dbError);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch yield curve data' },
      { status: 500 }
    );
  }
}

// Optimize database queries by limiting data fetched
async function getLatestYieldCurveFromDB(timeframe: string = '1m'): Promise<{data: YieldCurveData | null, latestDataDate: string | null}> {
  try {
    console.log(`[API DEBUG] Getting yield curve data for timeframe: ${timeframe}`);
    
    // First, check if we have today's data - only get the fields we need
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Start timing the query
    const startTime = Date.now();
    
    // Fetch the latest record from daily_yield_curves - only select needed fields
    const { data: latestData, error } = await supabaseAdmin
      .from('daily_yield_curves')
      .select('date, spread, ten_year_yield, two_year_yield, status, updated_at')
      .order('date', { ascending: false })
      .limit(1);
    
    if (error || !latestData || latestData.length === 0) {
      console.log('[API ERROR] No yield curve data found in database');
      return { data: null, latestDataDate: null };
    }
    
    const latestRecord = latestData[0];
    const latestDate = latestRecord.date;
    
    const latestQueryTime = Date.now() - startTime;
    console.log(`[API] Found latest yield curve data for ${latestDate} in ${latestQueryTime}ms`);
    
    // Calculate days for each timeframe
    let daysLimit = 30; // Default for 1m
      
    if (timeframe === '3m') daysLimit = 90;
    else if (timeframe === '6m') daysLimit = 180;
    else if (timeframe === '1y') daysLimit = 365;
    else if (timeframe === '2y') daysLimit = 730;
    else if (timeframe === '5y') daysLimit = 1825;
    
    // Set maximum data points to prevent memory issues with long timeframes
    // For longer periods, we'll use fewer points (weekly rather than daily)
    let maxDataPoints = daysLimit;
    let skipFactor = 1;
    
    if (timeframe === '1y') {
      maxDataPoints = 365; // Daily for 1 year
    } else if (timeframe === '2y') {
      maxDataPoints = 365; // Approximately 2 points per week for 2 years
      skipFactor = 2; 
    } else if (timeframe === '5y') {
      maxDataPoints = 260; // Approximately 1 point per week for 5 years (5*52)
      skipFactor = 7; // Weekly data points
      daysLimit = 5 * 365; // Limit to 5 years of days (simplified)
    }
    
    console.log(`[API DEBUG] Using daysLimit of ${daysLimit} with maxDataPoints ${maxDataPoints} and skipFactor ${skipFactor}`);
    
    // For 5y timeframe, use a different approach with a smaller query
    if (timeframe === '5y') {
      // Start timing the query
      const sparklineStartTime = Date.now();
      
      // For 5y data, just get a sample of points directly - only select minimal fields
      const actualLimit = Math.ceil(maxDataPoints / skipFactor) + 20; // Add buffer for sampling
      console.log(`[API DEBUG] Using optimized approach for 5-year data with limit ${actualLimit}`);
      
      // Only select date and spread, order by date desc for most recent first, and limit the query
      const { data: sampleData, error: sampleError } = await supabaseAdmin
        .from('daily_yield_curves')
        .select('date, spread')
        .order('date', { ascending: false })
        .limit(actualLimit);
      
      const queryTime = Date.now() - sparklineStartTime;
      console.log(`[API DEBUG] 5y query completed in ${queryTime}ms`);
      
      if (sampleError || !sampleData || sampleData.length === 0) {
        console.log('[API ERROR] Error fetching 5-year sample data:', sampleError);
        return fallbackResponse(latestRecord, latestDate);
      }
      
      // Process the sample data
      const processStartTime = Date.now();
      
      // Reverse and apply sampling to reduce data points
      const sampledData = [...sampleData]
        .reverse()
        .filter((_, index) => index % skipFactor === 0);
      
      const processTime = Date.now() - processStartTime;
      console.log(`[API DEBUG] Processed ${sampledData.length} data points for 5y in ${processTime}ms`);
      
      return formatResponse(latestRecord, latestDate, sampledData, sampleData);
    }
    
    // Standard approach for other timeframes
    console.log(`[API] Fetching ${timeframe} sparkline data (${daysLimit} days max)`);
    
    // Start timing the query
    const sparklineStartTime = Date.now();
    
    // Query for data in descending order (newest first) - only select minimal fields
    const { data: historicalData, error: historicalError } = await supabaseAdmin
      .from('daily_yield_curves')
      .select('date, spread')
      .order('date', { ascending: false })
      .limit(daysLimit);
    
    const queryTime = Date.now() - sparklineStartTime;
    console.log(`[API DEBUG] Historical data query completed in ${queryTime}ms`);
    
    if (historicalError) {
      console.log('[API ERROR] Error fetching historical data:', historicalError);
      return fallbackResponse(latestRecord, latestDate);
    }
    
    if (!historicalData || historicalData.length === 0) {
      console.log(`[API WARNING] No historical data found for timeframe ${timeframe}`);
      return fallbackResponse(latestRecord, latestDate);
    }
    
    // Process the data
    const processStartTime = Date.now();
    
    // Reverse and apply sampling if needed
    const sampledData = skipFactor > 1 
      ? [...historicalData].reverse().filter((_, index) => index % skipFactor === 0)
      : [...historicalData].reverse();
    
    const processTime = Date.now() - processStartTime;
    console.log(`[API DEBUG] Processed ${sampledData.length} data points in ${processTime}ms`);
    
    return formatResponse(latestRecord, latestDate, sampledData, historicalData);
  } catch (error) {
    console.error('[API ERROR] Error accessing yield curve database:', error);
    return { data: null, latestDataDate: null };
  }
}

// Helper function for fallback response with no sparkline data
function fallbackResponse(latestRecord, latestDate) {
  return {
    data: {
      title: 'Yield Curve (10Y-2Y)',
      value: `${(latestRecord.spread * 100).toFixed(2)}%`,
      change: null, // We don't have the previous day's value here
      sparklineData: [], // Empty sparkline
      status: latestRecord.status,
      spread: latestRecord.spread,
      tenYearYield: latestRecord.ten_year_yield,
      twoYearYield: latestRecord.two_year_yield,
      lastUpdated: latestRecord.updated_at,
      latestDataDate: latestDate
    },
    latestDataDate: latestDate
  };
}

// Helper function to format the response
function formatResponse(latestRecord, latestDate, sampledData, historicalData) {
  // Format the historical data to sparkline format
  const formattedSparklineData = sampledData.map(point => {
    const dateObj = new Date(point.date);
    const month = dateObj.toLocaleString('en-US', { month: 'short' });
    const day = dateObj.getDate();
    
    return {
      date: `${month} ${day}`,
      value: point.spread
    };
  });
  
  // Calculate change if possible (current - previous)
  let change = null;
  if (historicalData.length >= 2) {
    // historicalData[0] is the most recent point since we queried in descending order
    const currentSpread = historicalData[0].spread;
    const previousSpread = historicalData[1].spread;
    change = currentSpread - previousSpread;
  }
  
  console.log(`[API DEBUG] Returning ${formattedSparklineData.length} sparkline data points after sampling`);
  
  return {
    data: {
      title: 'Yield Curve (10Y-2Y)',
      value: `${(latestRecord.spread * 100).toFixed(2)}%`,
      change: change,
      sparklineData: formattedSparklineData,
      status: latestRecord.status,
      spread: latestRecord.spread,
      tenYearYield: latestRecord.ten_year_yield,
      twoYearYield: latestRecord.two_year_yield,
      lastUpdated: latestRecord.updated_at,
      latestDataDate: latestDate
    },
    latestDataDate: latestDate
  };
}

// Optimize database storage function to work with batches
async function storeYieldCurveData(data: YieldCurveData, timeframe: string): Promise<void> {
  try {
    if (!data || !data.latestDataDate) {
      console.error('[API] Cannot store yield curve data: invalid data');
      return;
    }
    
    // Start timing the operation
    const startTime = Date.now();
    
    const latestDate = data.latestDataDate;
    
    // First check if we already have this record
    const { data: existingData, error: checkError } = await supabaseAdmin
      .from('daily_yield_curves')
      .select('id')
      .eq('date', latestDate)
      .limit(1);
    
    if (checkError) {
      console.error('[API] Error checking for existing yield curve data:', checkError);
      return;
    }
    
    // Store or update the daily record
    if (!existingData || existingData.length === 0) {
      // Insert new record
      const { error: insertError } = await supabaseAdmin
        .from('daily_yield_curves')
        .insert({
          date: latestDate,
          spread: data.spread,
          ten_year_yield: data.tenYearYield,
          two_year_yield: data.twoYearYield,
          status: data.status || 'normal'
        });
      
      if (insertError) {
        console.error('[API] Error inserting yield curve data:', insertError);
        return;
      }
      
      console.log(`[API] Successfully stored new yield curve data for ${latestDate}`);
    } else {
      // Update existing record
      const { error: updateError } = await supabaseAdmin
        .from('daily_yield_curves')
        .update({
          spread: data.spread,
          ten_year_yield: data.tenYearYield,
          two_year_yield: data.twoYearYield,
          status: data.status || 'normal',
          updated_at: new Date().toISOString()
        })
        .eq('date', latestDate);
      
      if (updateError) {
        console.error('[API] Error updating yield curve data:', updateError);
        return;
      }
      
      console.log(`[API] Successfully updated yield curve data for ${latestDate}`);
    }
    
    // Store sparkline data points
    if (data.sparklineData && data.sparklineData.length > 0) {
      // Start timing sparkline storage
      const sparklineStartTime = Date.now();
      
      // Create batch of sparkline data
      const sparklineRecords = data.sparklineData.map(point => {
        try {
          // Convert date like "Mar 25" to a proper date object for the current year
          const dateParts = point.date.split(' ');
          if (dateParts.length !== 2) {
            console.warn(`[API] Skipping invalid date format: ${point.date}`);
            return null;
          }
          
          const month = dateParts[0]; // "Mar"
          const day = parseInt(dateParts[1]); // 25
          
          if (isNaN(day)) {
            console.warn(`[API] Skipping invalid day in date: ${point.date}`);
            return null;
          }
          
          const dateObj = new Date();
          const monthIndex = new Date(Date.parse(`${month} 1, 2000`)).getMonth();
          if (isNaN(monthIndex)) {
            console.warn(`[API] Skipping invalid month in date: ${point.date}`);
            return null;
          }
          
          dateObj.setMonth(monthIndex);
          dateObj.setDate(day);
          
          // If the resulting date is in the future, it's probably from last year
          if (dateObj > new Date()) {
            dateObj.setFullYear(dateObj.getFullYear() - 1);
          }
          
          return {
            date: dateObj.toISOString().split('T')[0], // YYYY-MM-DD
            timeframe: timeframe,
            spread: point.value
          };
        } catch (e) {
          console.warn(`[API] Error processing date ${point.date}:`, e);
          return null;
        }
      }).filter(record => record !== null); // Remove any null records from errors
      
      if (sparklineRecords.length === 0) {
        console.warn('[API] No valid sparkline records to store');
        return;
      }
      
      // Use batched inserts to avoid hitting statement limits
      const BATCH_SIZE = 50; // Supabase recommended batch size
      
      console.log(`[API] Storing ${sparklineRecords.length} sparkline records in batches of ${BATCH_SIZE}`);
      
      // Process sparkline records in batches
      for (let i = 0; i < sparklineRecords.length; i += BATCH_SIZE) {
        const batch = sparklineRecords.slice(i, i + BATCH_SIZE);
        
        try {
          // Use upsert to avoid duplicate date/timeframe combinations
          const { error: sparklineError } = await supabaseAdmin
            .from('yield_curve_sparklines')
            .upsert(batch, { 
              onConflict: 'date,timeframe',
              ignoreDuplicates: false // Update if exists
            });
          
          if (sparklineError) {
            console.error(`[API] Error storing sparkline batch ${Math.floor(i/BATCH_SIZE) + 1}:`, sparklineError);
          }
        } catch (batchError) {
          console.error(`[API] Batch ${Math.floor(i/BATCH_SIZE) + 1} failed:`, batchError);
          // Continue with other batches despite error
        }
      }
      
      const sparklineTime = Date.now() - sparklineStartTime;
      console.log(`[API] Successfully stored ${sparklineRecords.length} sparkline data points in ${sparklineTime}ms`);
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`[API] Total data storage completed in ${totalTime}ms`);
    
  } catch (error) {
    console.error('[API] Error in storeYieldCurveData:', error);
  }
} 