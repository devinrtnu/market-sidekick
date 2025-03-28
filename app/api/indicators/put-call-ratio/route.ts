import { NextResponse } from 'next/server';
import { z } from 'zod';
import { extractPutCallRatio } from '@/lib/api/firecrawl';
import { fetchOptionsDataFromYahoo } from '@/lib/api/options-data';
import { supabaseAdmin, PutCallRatioRecord } from '@/lib/supabase';
import { determinePutCallStatus } from '@/lib/utils/indicator-utils';

// Cache data to minimize API calls
interface CacheData {
  data: any;
  timestamp: number;
}

// Reduce cache expiry time to minimize stale data
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes instead of 60

// Store cached data - export for testing purposes
export let cacheData: CacheData | null = null;

// Firecrawl API key
const FIRECRAWL_API_KEY = "fc-200cbf4607c74ea5b7e038609edb0dc7";

// For testing - allows clearing the cache
export function clearCache() {
  console.log('[API] Manually clearing put-call ratio cache');
  cacheData = null;
}

/**
 * Get historical put-call ratio data from the database
 * @param period The time period to fetch (1m, 3m, 6m, 1y, 2y, etc.)
 */
async function getHistoricalData(period = '1m'): Promise<Array<{ date: number; putCallRatio: number }>> {
  try {
    // Convert period to days
    let days = 30; // Default to 1 month
    
    if (period === '3m') days = 90;
    else if (period === '6m') days = 180;
    else if (period === '1y') days = 365;
    else if (period === '2y') days = 730;
    else if (period === 'max') days = 3650; // 10 years max
    
    // Get data from daily_put_call_ratios table - these are the end-of-day records
    const { data, error } = await supabaseAdmin
      .from('daily_put_call_ratios')
      .select('date, ratio_value')
      .order('date', { ascending: false })
      .limit(days);
    
    if (error || !data) {
      console.error('[API] Error fetching historical data:', error);
      return [];
    }
    
    const formattedData = data.map(item => ({
      date: new Date(item.date).getTime(),
      putCallRatio: item.ratio_value
    }));
    
    console.log(`[API] Fetched ${formattedData.length} historical data points for period ${period}`);
    return formattedData;
  } catch (err) {
    console.error('[API] Failed to get historical data:', err);
    return [];
  }
}

/**
 * Calculate 20-day moving average of put-call ratio
 */
async function get20DayAverage(): Promise<number | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('daily_put_call_ratios')
      .select('ratio_value')
      .order('date', { ascending: false })
      .limit(20);
    
    if (error || !data || data.length === 0) {
      console.error('[API] Error calculating 20-day average:', error);
      return null;
    }
    
    const sum = data.reduce((total, item) => total + parseFloat(item.ratio_value.toString()), 0);
    const average = sum / data.length;
    console.log(`[API] Calculated 20-day average: ${average.toFixed(2)} from ${data.length} data points`);
    return average;
  } catch (err) {
    console.error('[API] Failed to calculate 20-day average:', err);
    return null;
  }
}

/**
 * Get the latest intraday put-call ratio data
 */
async function getLatestIntradayData() {
  try {
    const { data, error } = await supabaseAdmin
      .from('intraday_put_call_ratios')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1);
    
    if (error || !data || data.length === 0) {
      console.error('[API] Error fetching latest intraday data:', error);
      return null;
    }
    
    return data[0];
  } catch (err) {
    console.error('[API] Failed to get latest intraday data:', err);
    return null;
  }
}

/**
 * API endpoint to fetch put-call ratio data
 */
export async function GET(request: Request) {
  try {
    const now = Date.now();
    const url = new URL(request.url);
    
    // Get the requested time period (default to 1 month)
    const period = url.searchParams.get('period') || '1m';
    
    // Check for cache busting parameters
    const noCache = url.searchParams.has('no-cache') || 
                    url.searchParams.has('_') || 
                    url.searchParams.has('timestamp') ||
                    url.searchParams.has('refresh');
    
    // Use cache unless explicitly disabled or cache is expired
    if (cacheData && !noCache && (now - cacheData.timestamp) < CACHE_EXPIRY) {
      console.log('[API] Using cached put-call ratio data');
      
      // If we're using cache but need a different period, just update historical data
      if (cacheData.data.period !== period) {
        console.log(`[API] Updating historical data for period ${period}`);
        const historical = await getHistoricalData(period);
        
        const updatedData = {
          ...cacheData.data,
          historical,
          period
        };
        
        // Update cache with new period data
        cacheData = {
          data: updatedData,
          timestamp: now
        };
        
        return NextResponse.json(updatedData, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }
      
      return NextResponse.json(cacheData.data, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
    
    console.log('[API] Fetching fresh put-call ratio data');
    
    // Try to get the latest intraday data first
    const latestIntraday = await getLatestIntradayData();
    
    let ratio: number | null;
    let status: 'normal' | 'warning' | 'danger';
    let source = 'CBOE via Firecrawl';
    let lastUpdated: string;
    let isApproximateData = false;
    let putsVolume: number | null = null;
    let callsVolume: number | null = null;
    let totalVolume: number | null = null;
    
    if (latestIntraday) {
      // Use the latest intraday data
      console.log(`[API] Using latest intraday data from ${latestIntraday.timestamp}`);
      ratio = latestIntraday.ratio_value;
      status = latestIntraday.status as 'normal' | 'warning' | 'danger';
      lastUpdated = latestIntraday.timestamp;
      putsVolume = latestIntraday.puts_volume;
      callsVolume = latestIntraday.calls_volume;
      totalVolume = latestIntraday.total_volume;
    } else {
      // Fallback: Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      console.log(`[API] No intraday data, checking daily data for ${today}`);
      
      // Check if we already have today's data in the daily table
      try {
        const { data: existingData, error } = await supabaseAdmin
          .from('daily_put_call_ratios')
          .select('*')
          .eq('date', today)
          .single();
        
        if (!error && existingData) {
          console.log(`[API] Using today's daily data: ${existingData.ratio_value}`);
          ratio = existingData.ratio_value;
          status = existingData.status as 'normal' | 'warning' | 'danger';
          lastUpdated = existingData.updated_at;
        } else {
          // Final fallback: extract fresh data from source
          console.log('[API] No data for today, extracting fresh data from source');
          
          try {
            // Use the extractPutCallRatio function with the specific API key
            ratio = await extractPutCallRatio(FIRECRAWL_API_KEY);
            console.log(`[API] Successfully extracted put-call ratio: ${ratio}`);
            status = determinePutCallStatus(ratio);
          } catch (scraperError) {
            console.error('[API] Firecrawl extraction failed:', scraperError);
            
            // Fallback to Yahoo Finance options data
            try {
              ratio = await fetchOptionsDataFromYahoo();
              isApproximateData = true;
              source = 'Yahoo Finance (approximate)';
              status = determinePutCallStatus(ratio);
              console.log(`[API] Using Yahoo Finance fallback data: ${ratio}`);
            } catch (yahooError) {
              console.error('[API] Yahoo Finance fallback failed:', yahooError);
              throw new Error('Failed to fetch put-call ratio from all sources');
            }
          }
          
          lastUpdated = new Date().toISOString();
          
          // Store the new data in the database
          try {
            const { error } = await supabaseAdmin
              .from('daily_put_call_ratios')
              .insert({
                date: today,
                ratio_value: ratio,
                status: status
              });
            
            if (error) {
              console.error('[API] Error storing data in database:', error);
            } else {
              console.log(`[API] Successfully stored put-call ratio ${ratio} in database for ${today}`);
            }
          } catch (dbError) {
            console.error('[API] Database insertion failed:', dbError);
            // Continue even if database storage fails
          }
        }
      } catch (err) {
        console.error('[API] Error checking database for today\'s data:', err);
        throw new Error('Failed to fetch data from all sources');
      }
    }
    
    // Get historical data and 20-day average
    const historical = await getHistoricalData(period);
    const twentyDayAverage = await get20DayAverage();
    
    // Prepare the response data
    const data = {
      totalPutCallRatio: ratio,
      equityPutCallRatio: null, // We don't have this breakdown from the scraper
      indexPutCallRatio: null,  // We don't have this breakdown from the scraper
      twentyDayAverage,
      status,
      value: ratio,
      timestamp: now,
      source,
      lastUpdated,
      historical,
      isApproximateData,
      period,
      // Include volume data if available
      putsVolume,
      callsVolume,
      totalVolume
    };
    
    // Cache the data
    cacheData = {
      data,
      timestamp: now
    };
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('[API] Error fetching Put-Call Ratio data:', error);
    
    // Return error response
    return NextResponse.json({
      totalPutCallRatio: null,
      equityPutCallRatio: null,
      indexPutCallRatio: null,
      twentyDayAverage: null,
      status: 'error',
      value: null,
      timestamp: Date.now(),
      error: 'Failed to fetch data from CBOE website',
      isApproximateData: false
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
} 