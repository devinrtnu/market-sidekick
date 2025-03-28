import { Cache } from '@/lib/api/cache';
import { fetchHistoricalVixData } from '@/lib/api/vix-utils';

// Cache instance with 1-hour expiration for historical data
const cache = new Cache(60 * 60 * 1000);

// Symbol for VIX index
const VIX_SYMBOL = '^VIX';

interface HistoricalDataPoint {
  date: number; // Timestamp
  value: number;
}

/**
 * Generate realistic-looking mock VIX data for development
 */
function generateMockVixData(range: string): HistoricalDataPoint[] {
  console.log('Generating mock VIX historical data for development');
  
  const now = new Date();
  const dataPoints: HistoricalDataPoint[] = [];
  let days: number;
  
  // Determine how many data points to generate based on range
  switch (range) {
    case '1mo': days = 22; break; // ~1 month of trading days
    case '3mo': days = 66; break; // ~3 months of trading days
    case '6mo': days = 128; break; // ~6 months of trading days
    case '1y': days = 252; break; // ~1 year of trading days
    case '5y': days = 1258; break; // ~5 years of trading days
    default: days = 22;
  }
  
  // Generate realistic VIX pattern
  let vixValue = 15 + Math.random() * 10; // Start between 15-25
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    // Random walk with mean reversion
    const meanReversionFactor = 0.05;
    const volatility = 0.1;
    const meanVix = 20;
    
    vixValue = vixValue + 
      meanReversionFactor * (meanVix - vixValue) + // Pull toward the mean
      volatility * (Math.random() * 2 - 1); // Random component
    
    // Ensure value is in a reasonable range
    vixValue = Math.max(vixValue, 9);
    vixValue = Math.min(vixValue, 45);
    
    dataPoints.push({
      date: date.getTime(),
      value: Number(vixValue.toFixed(2))
    });
  }
  
  return dataPoints;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const range = url.searchParams.get('range') || '6mo';
  const interval = url.searchParams.get('interval') || '1d';
  
  // Validate range and interval parameters
  const validRanges = ['1mo', '3mo', '6mo', '1y', '5y'];
  const validIntervals = ['1d', '1wk', '1mo'];
  
  if (!validRanges.includes(range)) {
    return Response.json(
      { error: `Invalid range parameter. Valid values are: ${validRanges.join(', ')}` },
      { status: 400 }
    );
  }
  
  if (!validIntervals.includes(interval)) {
    return Response.json(
      { error: `Invalid interval parameter. Valid values are: ${validIntervals.join(', ')}` },
      { status: 400 }
    );
  }
  
  // Check cache
  const cacheKey = `vix_history_${range}_${interval}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return Response.json({ data: cachedData });
  }
  
  try {
    const data = await fetchHistoricalVixData(range, interval);
    
    // Log the data range to help with debugging
    if (data.length > 0) {
      const firstDate = new Date(data[0].date).toLocaleDateString();
      const lastDate = new Date(data[data.length - 1].date).toLocaleDateString();
      console.log(`VIX history data period: ${firstDate} to ${lastDate} (${data.length} points)`);
    } else {
      console.warn('No VIX history data points returned');
    }
    
    // Cache the data
    cache.set(cacheKey, data);
    
    return Response.json({ data });
  } catch (error) {
    console.error('Error fetching VIX historical data:', error);
    
    // Try to use stale data if available
    const staleData = cache.getStale(cacheKey);
    if (staleData) {
      return Response.json({
        data: staleData,
        isStale: true,
        error: 'Using cached data due to fetch error'
      });
    }
    
    return Response.json(
      { error: 'Failed to fetch VIX historical data' },
      { status: 500 }
    );
  }
} 