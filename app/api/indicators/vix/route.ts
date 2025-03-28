import { Cache } from '@/lib/api/cache';
import { 
  fetchCurrentVix, 
  fetchTermStructure, 
  determineVixStatus, 
  calculateHistoricalPercentile 
} from '@/lib/api/vix-utils';

// Cache instance with 5-minute expiration for VIX data
const cache = new Cache(5 * 60 * 1000);

interface VixData {
  currentVix: number | null;
  historicalPercentile: number | null;
  value: number | null; // Required by IndicatorData interface
  timestamp: number;
  status: 'normal' | 'warning' | 'danger' | 'error';
  error?: string;
  termStructure: {
    oneMonth: number | null;
    threeMonth: number | null;
    sixMonth: number | null;
  };
  change?: number;
}

/**
 * API endpoint to fetch VIX (CBOE Volatility Index) data
 */
export async function GET() {
  // Check cache first
  const cacheKey = 'vix_data';
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return Response.json(cachedData);
  }

  try {
    // Fetch the current VIX value
    const { currentVix, previousClose } = await fetchCurrentVix();
    
    // Calculate change value if we have both current and previous values
    let change = null;
    if (currentVix !== null && previousClose !== null) {
      change = currentVix - previousClose;
    }
    
    // Determine the status based on the VIX value
    const status = determineVixStatus(currentVix);
    
    // Calculate historical percentile
    const historicalPercentile = calculateHistoricalPercentile(currentVix);
    
    // Fetch term structure data with fallbacks
    const termStructure = await fetchTermStructure();
    
    // Initialize the VIX data object with all required properties
    const vixData: VixData = {
      value: currentVix, // Required by IndicatorData interface
      currentVix: currentVix,
      historicalPercentile: historicalPercentile,
      status: status,
      timestamp: Date.now(),
      change: change,
      termStructure
    };
    
    // Cache the data
    cache.set(cacheKey, vixData);
    
    return Response.json(vixData);
  } catch (error) {
    console.error('Error fetching VIX data:', error);
    
    // Try to use stale data if available
    const staleData = cache.getStale(cacheKey);
    if (staleData) {
      return Response.json({
        ...staleData as VixData,
        status: 'error'
      });
    }
    
    // Return error response
    return Response.json(
      {
        value: null,
        currentVix: null,
        historicalPercentile: null,
        status: 'error',
        timestamp: Date.now(),
        termStructure: {
          oneMonth: null,
          threeMonth: null,
          sixMonth: null
        },
        error: 'Failed to fetch VIX data from Yahoo Finance'
      },
      { status: 500 }
    );
  }
} 