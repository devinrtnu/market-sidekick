import { Cache } from './cache';
import { YieldCurveData, SparklineDataPoint } from './types';

// Cache instance with 15-minute expiration (15 * 60 * 1000 ms)
const cache = new Cache(15 * 60 * 1000);

// FRED Series IDs
const SERIES = {
  T10Y2Y: 'T10Y2Y', // 10-Year Treasury Constant Maturity Minus 2-Year Treasury Constant Maturity
  DGS10: 'DGS10',   // 10-Year Treasury Constant Maturity Rate
  DGS2: 'DGS2'      // 2-Year Treasury Constant Maturity Rate
};

// Known historical recessions for reference
const US_RECESSIONS = [
  {
    start: new Date('2001-03-01').getTime(),
    end: new Date('2001-11-01').getTime(),
    name: 'Dot-com bubble recession'
  },
  {
    start: new Date('2007-12-01').getTime(),
    end: new Date('2009-06-01').getTime(),
    name: 'Great Recession'
  },
  {
    start: new Date('2020-02-01').getTime(),
    end: new Date('2020-04-30').getTime(),
    name: 'COVID-19 recession'
  },
  {
    start: new Date('2022-01-01').getTime(),
    end: new Date('2022-06-30').getTime(),
    name: 'Technical recession (2022)'
  }
];

/**
 * Fetch data from FRED API for a specific series
 */
async function fetchFredSeries(seriesId: string, limit: number = 30): Promise<FredApiResponse> {
  const FRED_API_KEY = process.env.FRED_API_KEY;
  if (!FRED_API_KEY) {
    throw new Error('FRED_API_KEY not found in environment variables');
  }

  // Add current timestamp to prevent caching by the API
  const timestamp = new Date().getTime();
  
  // Use tomorrow's date to ensure we get the latest data
  // This is because some data may be published with a slight delay
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  // Build the API URL with all necessary parameters
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=${limit}&observation_end=${tomorrowStr}&_=${timestamp}`;
  
  console.log(`Fetching FRED data for ${seriesId} with end date ${tomorrowStr}`);
  
  // Implement retry logic with exponential backoff
  const maxRetries = 3;
  let retries = 0;
  let lastError: Error | null = null;
  
  while (retries < maxRetries) {
    try {
      // Update the fetch options to disable caching and ensure we get fresh data
      const response = await fetch(url, { 
        cache: 'no-store',
        next: { revalidate: 0 },
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
        
        // Handle rate limiting specially
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || '5';
          const waitTime = parseInt(retryAfter, 10) * 1000;
          console.log(`Rate limited. Waiting ${waitTime}ms before retry.`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retries++;
          continue;
        }
        
        throw new Error(`FRED API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Log the dates we received to help with debugging
      if (data && data.observations && data.observations.length > 0) {
        console.log(`FRED data for ${seriesId}: got ${data.observations.length} observations, latest date: ${data.observations[0].date}`);
      } else {
        console.warn(`FRED data for ${seriesId}: No observations returned`);
      }
      
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Exponential backoff
      const waitTime = Math.pow(2, retries) * 1000;
      console.log(`FRED API request failed. Retrying in ${waitTime}ms (${retries + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      retries++;
    }
  }
  
  // If we've exhausted our retries, throw the last error
  throw lastError || new Error(`Failed to fetch FRED data for ${seriesId} after ${maxRetries} attempts`);
}

/**
 * Get limit value based on timeframe
 */
function getLimitFromTimeframe(timeframe: string): number {
  switch (timeframe) {
    case '1m': return 30;   // 1 month of daily data
    case '3m': return 90;   // 3 months
    case '6m': return 180;  // 6 months
    case '1y': return 250;  // 1 year
    case '2y': return 500;  // 2 years
    case '5y': return 1250; // 5 years
    case '10y': return 2500; // 10 years
    default: return 30;     // Default to 1 month
  }
}

/**
 * Find recessions that followed an inversion period
 */
function findFollowingRecession(inversionEndDate: number | null): { 
  start: number; 
  end: number; 
  name: string; 
} | null {
  if (!inversionEndDate) return null;
  
  const PREDICTION_WINDOW_MS = 24 * 30 * 24 * 60 * 60 * 1000; // 24 months
  
  for (const recession of US_RECESSIONS) {
    if (recession.start > inversionEndDate && 
        recession.start <= inversionEndDate + PREDICTION_WINDOW_MS) {
      return recession;
    }
  }
  
  return null;
}

/**
 * Detect periods of yield curve inversion from time series data
 */
function detectInversionPeriods(timeSeriesData: Array<{date: number, spread: number}>): Array<{
  start: number;
  end: number | null;
  recession: {
    start: number | null;
    end: number | null;
    name?: string;
  } | null;
}> {
  const inversions = [];
  let inversionStart = null;
  let previousPoint = null;
  const MIN_INVERSION_DAYS = 5;
  
  const sortedData = [...timeSeriesData].sort((a, b) => a.date - b.date);
  
  for (const point of sortedData) {
    if (point.spread === undefined || point.spread === null || isNaN(point.spread)) {
      continue;
    }
    
    if (previousPoint === null) {
      previousPoint = point;
      continue;
    }
    
    if (previousPoint.spread >= 0 && point.spread < 0) {
      inversionStart = point.date;
    }
    
    if (previousPoint.spread < 0 && point.spread >= 0 && inversionStart !== null) {
      const durationDays = Math.round((point.date - inversionStart) / (1000 * 60 * 60 * 24));
      
      if (durationDays >= MIN_INVERSION_DAYS) {
        inversions.push({
          start: inversionStart,
          end: point.date,
          recession: findFollowingRecession(point.date)
        });
      }
      
      inversionStart = null;
    }
    
    previousPoint = point;
  }
  
  if (inversionStart !== null && previousPoint !== null && previousPoint.spread < 0) {
    const currentDurationDays = Math.round((Date.now() - inversionStart) / (1000 * 60 * 60 * 24));
    
    if (currentDurationDays >= MIN_INVERSION_DAYS) {
      inversions.push({
        start: inversionStart,
        end: null,
        recession: null
      });
    }
  }
  
  return inversions;
}

/**
 * Determine the status of the yield curve based on the spread
 */
function determineYieldCurveStatus(spread: number): 'normal' | 'warning' | 'danger' | 'error' {
  if (spread >= 0.002) return 'normal';     // spread ≥ 0.2%
  if (spread >= 0) return 'warning';        // 0% ≤ spread < 0.2%
  return 'danger';                          // spread < 0% (inverted)
}

interface FredObservation {
  date: string;
  value: string;
  realtime_start?: string;
  realtime_end?: string;
}

interface FredApiResponse {
  realtime_start: string;
  realtime_end: string;
  observation_start: string;
  observation_end: string;
  units: string;
  output_type: number;
  file_type: string;
  order_by: string;
  sort_order: string;
  count: number;
  offset: number;
  limit: number;
  observations: FredObservation[];
}

/**
 * Format sparkline data from FRED observations
 */
function formatSparklineData(observations: FredObservation[]): SparklineDataPoint[] {
  // Filter out invalid observations first
  const validObservations = observations
    .filter(obs => obs.value !== '' && obs.value !== '.' && !isNaN(parseFloat(obs.value)));
  
  if (validObservations.length === 0) {
    console.warn('No valid observations found for sparkline data');
    return [];
  }
  
  // Get the very latest date from the API (should be the first observation since sort_order=desc)
  const latestApiDate = validObservations[0]?.date;
  console.log(`Latest API date is: ${latestApiDate}`);
  
  // First sort by date to ensure chronological order (oldest to newest)
  const sortedObservations = [...validObservations]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Take the most recent data points (max 30)
  // Since observations are now sorted oldest->newest, take the last 30 elements
  let dataPoints = sortedObservations.slice(-30);
  
  // Convert observations to formatted sparkline data points
  return dataPoints.map(obs => {
    // Parse the value as a decimal (FRED values are percentages)
    const rawValue = parseFloat(obs.value);
    const decimalValue = Number((rawValue / 100).toFixed(4));
    
    // Parse the date for proper formatting
    const date = new Date(obs.date);
    
    // Format date consistently as Month Day (e.g., "Mar 15")
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    
    // Return properly formatted data point
    return {
      date: formattedDate,
      value: decimalValue,
      isoDate: obs.date // Include ISO date for sorting and debugging
    };
  });
}

/**
 * Fetch yield curve data from FRED
 * @param timeframe Timeframe for data ('1m', '3m', etc.)
 * @param forceRefresh Whether to force a cache refresh
 */
export async function fetchYieldCurveData(timeframe: string = '1m', forceRefresh: boolean = false): Promise<YieldCurveData> {
  const cacheKey = `yield_curve_${timeframe}`;
  
  // Force refresh if requested
  if (forceRefresh) {
    cache.forceRefresh(cacheKey);
    console.log('Forced refresh of yield curve data');
  }
  
  // Try to get data from cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    // Import validateYieldCurveData dynamically to avoid circular dependencies
    const { validateYieldCurveData } = await import('./validation');
    if (validateYieldCurveData(cachedData)) {
      console.log('Using cached yield curve data');
      return cachedData as YieldCurveData;
    } else {
      console.warn('Cached yield curve data failed validation, fetching fresh data');
      cache.forceRefresh(cacheKey);
    }
  }

  try {
    const limit = getLimitFromTimeframe(timeframe);
    const historicalLimit = getLimitFromTimeframe('10y');

    console.log(`Fetching fresh yield curve data with timeframe ${timeframe}, limit ${limit}`);

    // Fetch all required data in parallel
    const [spreadData, tenYearData, twoYearData, historicalSpreadData] = await Promise.all([
      fetchFredSeries(SERIES.T10Y2Y, limit),
      fetchFredSeries(SERIES.DGS10, 1),
      fetchFredSeries(SERIES.DGS2, 1),
      fetchFredSeries(SERIES.T10Y2Y, historicalLimit)
    ]);

    // Check if we have the latest data
    const latestDate = spreadData.observations[0]?.date;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    console.log(`Latest data date: ${latestDate}, expecting data for: ${yesterdayStr}`);
    
    // If we don't have today's data, try a direct API call with specific date
    if (latestDate !== yesterdayStr) {
      console.warn(`Data may not be up to date. Latest date: ${latestDate}, expected: ${yesterdayStr}`);
    }

    // Get current values (convert percentages to decimals)
    const currentSpread = parseFloat((spreadData as FredApiResponse).observations[0].value) / 100;
    const tenYearYield = parseFloat((tenYearData as FredApiResponse).observations[0].value) / 100;
    const twoYearYield = parseFloat((twoYearData as FredApiResponse).observations[0].value) / 100;

    // Calculate the previous day's spread for change calculation
    const previousSpread = spreadData.observations.length > 1 
      ? parseFloat(spreadData.observations[1].value) / 100
      : currentSpread;
    const change = currentSpread - previousSpread;

    // Format sparkline data
    const sparklineData = formatSparklineData(spreadData.observations);

    // Process historical data for inversions
    const historicalTimeSeriesData = (historicalSpreadData as FredApiResponse).observations
      .filter((obs: FredObservation) => obs.value !== '' && obs.value !== '.')
      .map((obs: FredObservation) => ({
        date: new Date(obs.date).getTime(),
        spread: parseFloat(obs.value) / 100
      }));

    // Detect inversions
    const inversions = detectInversionPeriods(historicalTimeSeriesData);

    // Calculate last inversion data
    let lastInversion: YieldCurveData['lastInversion'] | undefined;
    if (inversions.length > 0) {
      const mostRecent = inversions[inversions.length - 1];
      const durationMs = (mostRecent.end || Date.now()) - mostRecent.start;
      const durationMonths = Math.round(durationMs / (30 * 24 * 60 * 60 * 1000));
      
      lastInversion = {
        date: new Date(mostRecent.start).toISOString().split('T')[0],
        duration: durationMonths === 1 ? '1 month' : `${durationMonths} months`,
        followedByRecession: !!mostRecent.recession,
        recessionStart: mostRecent.recession?.start 
          ? new Date(mostRecent.recession.start).toISOString().split('T')[0]
          : undefined
      };
    }

    const yieldCurveData: YieldCurveData = {
      title: 'Yield Curve (10Y-2Y)',
      value: (currentSpread * 100).toFixed(2) + '%',
      change,
      sparklineData,
      status: determineYieldCurveStatus(currentSpread),
      spread: currentSpread,
      tenYearYield,
      twoYearYield,
      historicalInversions: inversions,
      lastInversion,
      lastUpdated: new Date().toISOString(),
      latestDataDate: spreadData.observations[0]?.date
    };

    // Validate the data before caching
    const { validateYieldCurveData } = await import('./validation');
    if (!validateYieldCurveData(yieldCurveData)) {
      console.error('Generated yield curve data failed validation');
      throw new Error('Generated yield curve data failed validation');
    }

    // Cache the validated data
    cache.set(cacheKey, yieldCurveData);
    return yieldCurveData;
  } catch (error) {
    console.error('Error fetching yield curve data:', error);
    
    // Try to use stale data if available
    const staleData = cache.getStale(cacheKey);
    if (staleData) {
      // Validate stale data before using it
      try {
        const { validateYieldCurveData } = await import('./validation');
        if (validateYieldCurveData({...staleData, status: 'error'})) {
          console.log('Using stale yield curve data due to error');
          return {
            ...staleData as YieldCurveData,
            status: 'error'
          };
        }
      } catch (validationError) {
        console.error('Stale data validation failed:', validationError);
      }
    }

    // Last resort: return error state
    throw new Error('Failed to fetch yield curve data');
  }
}
