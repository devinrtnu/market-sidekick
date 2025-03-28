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
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Check if this is a debug request
    if (request.nextUrl.searchParams.has('debug') && process.env.NODE_ENV !== 'production') {
      // Only allow in non-production environments
      return NextResponse.json({
        environment: process.env.NODE_ENV,
        hasFredApiKey: !!process.env.FRED_API_KEY,
        fredApiKeyLength: process.env.FRED_API_KEY?.length || 0,
        message: 'This is debugging information. Do not use in production.',
        timestamp: new Date().toISOString()
      });
    }

    // Check if FRED API key is available
    if (!process.env.FRED_API_KEY) {
      console.error('FRED_API_KEY is missing from environment variables');
      return NextResponse.json(
        { error: 'API configuration error', message: 'Missing required API key' },
        { status: 500 }
      );
    }

    // Check if we need to throttle the request
    // Implement a simple rate limiter for our own API
    const API_REQUEST_INTERVAL = 2000; // 2 seconds between requests
    const RATE_LIMIT_WINDOW = 60000; // 1 minute window
    const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute
    
    // Global rate limiting state (would normally use Redis in production)
    if (!global._apiRateLimits) {
      global._apiRateLimits = {
        lastRequestTime: 0,
        requestCount: 0,
        resetTime: Date.now() + RATE_LIMIT_WINDOW
      };
    }
    
    const now = Date.now();
    const { lastRequestTime, requestCount, resetTime } = global._apiRateLimits;
    
    // Check if we need to reset the window
    if (now > resetTime) {
      global._apiRateLimits = {
        lastRequestTime: now,
        requestCount: 1,
        resetTime: now + RATE_LIMIT_WINDOW
      };
    } 
    // Check if we've exceeded the rate limit
    else if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
      const retryAfter = Math.ceil((resetTime - now) / 1000);
      console.warn(`API rate limit exceeded. Try again in ${retryAfter} seconds.`);
      
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: `API rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(retryAfter)
          }
        }
      );
    }
    // Check if this request is too soon after the last one
    else if (now - lastRequestTime < API_REQUEST_INTERVAL) {
      const retryAfter = Math.ceil((API_REQUEST_INTERVAL - (now - lastRequestTime)) / 1000);
      console.warn(`Request too soon. Throttling for ${retryAfter} seconds.`);
      
      return NextResponse.json(
        { 
          error: 'Request throttled',
          message: `Too many requests too quickly. Try again in ${retryAfter} seconds.`,
          retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(retryAfter)
          }
        }
      );
    }
    // Update the rate limit counter
    else {
      global._apiRateLimits = {
        lastRequestTime: now,
        requestCount: requestCount + 1,
        resetTime
      };
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '1m';
    const forceRefresh = searchParams.has('force') || searchParams.has('refresh');

    console.log(`Fetching yield curve data with period: ${period}, forceRefresh: ${forceRefresh}`);

    // 1. If not forcing refresh, try to get data from database first
    if (!forceRefresh) {
      const { data: dbData, latestDataDate } = await getLatestYieldCurveFromDB(period);
      
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
    } else {
      console.log('[API] Force refresh requested, bypassing database cache');
    }
    
    // 2. Fetch fresh data from FRED API
    console.log(`[API] Fetching fresh yield curve data with timeframe: ${period}`);
    const yieldCurveData = await fetchYieldCurveData(period, forceRefresh);
    
    // 3. Store the fetched data in the database for future use
    await storeYieldCurveData(yieldCurveData, period);
    
    // 4. Return the data
    return NextResponse.json(yieldCurveData);
  } catch (error) {
    console.error('Error in yield curve API route:', error);

    // Provide more specific error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
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
    
    // Return error response
    return NextResponse.json(
      { 
        error: 'Failed to fetch yield curve data',
        message: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
};

// Add data point limits for longer timeframes
async function getLatestYieldCurveFromDB(timeframe: string = '1m'): Promise<{data: YieldCurveData | null, latestDataDate: string | null}> {
  try {
    console.log(`[API DEBUG] Getting yield curve data for timeframe: ${timeframe}`);
    
    // First, check if we have today's data
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Fetch the latest record from daily_yield_curves
    const { data: latestData, error } = await supabaseAdmin
      .from('daily_yield_curves')
      .select('*')
      .order('date', { ascending: false })
      .limit(1);
    
    if (error || !latestData || latestData.length === 0) {
      console.log('[API ERROR] No yield curve data found in database');
      return { data: null, latestDataDate: null };
    }
    
    const latestRecord = latestData[0];
    const latestDate = latestRecord.date;
    
    console.log(`[API] Found latest yield curve data in database for ${latestDate}`);
    
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
      maxDataPoints = 365; // Approximately 1 point per week for 5 years
      skipFactor = 5;
    }
    
    console.log(`[API DEBUG] Using daysLimit of ${daysLimit} with maxDataPoints ${maxDataPoints} and skipFactor ${skipFactor}`);
    
    // Now fetch the sparkline data for the requested timeframe from daily_yield_curves
    // This is more reliable than the timeframe-specific data
    console.log(`[API] Fetching ${daysLimit} days of sparkline data for timeframe ${timeframe}`);
    
    // Query for data in descending order (newest first), then we'll reverse it
    const { data: historicalData, error: historicalError } = await supabaseAdmin
      .from('daily_yield_curves')
      .select('date, spread')
      .order('date', { ascending: false })
      .limit(daysLimit);
    
    if (historicalError) {
      console.log('[API ERROR] Error fetching historical data directly:', historicalError);
      // We can still return the latest data without sparkline
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
    
    if (!historicalData || historicalData.length === 0) {
      console.log(`[API WARNING] No historical data found for timeframe ${timeframe}`);
      // We can still return the latest data without sparkline
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
    
    console.log(`[API DEBUG] Found ${historicalData.length} historical data points`);
    
    // Reverse the data to get ascending order (oldest first)
    const ascendingHistoricalData = [...historicalData].reverse();
    
    // Apply sampling for longer timeframes to reduce data size
    const sampledData = skipFactor > 1 
      ? ascendingHistoricalData.filter((_, index) => index % skipFactor === 0)
      : ascendingHistoricalData;
    
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
  } catch (error) {
    console.error('[API ERROR] Error accessing yield curve database:', error);
    return { data: null, latestDataDate: null };
  }
}

// Function to store yield curve data in the database
async function storeYieldCurveData(data: YieldCurveData, timeframe: string): Promise<void> {
  try {
    if (!data || !data.latestDataDate) {
      console.error('[API] Cannot store yield curve data: invalid data');
      return;
    }
    
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
      // Create batch of sparkline data
      const sparklineRecords = data.sparklineData.map(point => {
        // Convert date like "Mar 25" to a proper date object for the current year
        const dateParts = point.date.split(' ');
        const month = dateParts[0]; // "Mar"
        const day = parseInt(dateParts[1]); // 25
        
        const dateObj = new Date();
        const monthIndex = new Date(Date.parse(`${month} 1, 2000`)).getMonth();
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
      });
      
      // Use upsert to avoid duplicate date/timeframe combinations
      const { error: sparklineError } = await supabaseAdmin
        .from('yield_curve_sparklines')
        .upsert(sparklineRecords, { 
          onConflict: 'date,timeframe',
          ignoreDuplicates: false // Update if exists
        });
      
      if (sparklineError) {
        console.error('[API] Error storing sparkline data:', sparklineError);
      } else {
        console.log(`[API] Successfully stored ${sparklineRecords.length} sparkline data points`);
      }
    }
  } catch (error) {
    console.error('[API] Error in storeYieldCurveData:', error);
  }
} 