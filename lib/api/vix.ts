import { IndicatorProps } from '@/components/dashboard/indicator-card';
import { Cache } from './cache';
import { fetchCurrentVix, fetchTermStructure, determineVixStatus, calculateHistoricalPercentile, VIX_SYMBOL } from './vix-utils';
import yahooFinance from 'yahoo-finance2';

// Cache instance with 2-minute expiration for VIX data
const cache = new Cache(2 * 60 * 1000);

interface VixApiResponse {
  currentVix: number | null;
  historicalPercentile: number | null;
  value: number | null;
  timestamp: number;
  status: 'normal' | 'warning' | 'danger' | 'error';
  error?: string;
  termStructure: {
    oneMonth: number | null;
    threeMonth: number | null;
    sixMonth: number | null;
  };
  change?: number | null;
}

/**
 * Fetch recent VIX historical data for sparkline
 */
async function fetchVixSparklineData(): Promise<{ date: string; value: number }[]> {
  try {
    // Calculate dates for a 1-month period
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    
    // Try to get data from Yahoo Finance
    const chartData = await yahooFinance.chart(VIX_SYMBOL, {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    });
    
    if (chartData && chartData.quotes && chartData.quotes.length > 0) {
      // Sort chronologically
      const sortedQuotes = [...chartData.quotes]
        .filter(quote => quote.close !== null)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Format data for sparkline
      return sortedQuotes.map(quote => ({
        date: new Date(quote.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        value: quote.close
      }));
    }
    
    throw new Error('Insufficient data from Yahoo Finance');
  } catch (error) {
    console.error('Error fetching VIX sparkline data:', error);
    
    // Generate mock data for development or when API fails
    if (process.env.NODE_ENV === 'development') {
      return generateMockSparklineData();
    }
    
    // In production, return empty array
    return [];
  }
}

/**
 * Generate mock sparkline data for development/testing
 */
function generateMockSparklineData(): { date: string; value: number }[] {
  const dataPoints = [];
  const now = new Date();
  let baseValue = 15 + Math.random() * 10; // Start between 15-25
  
  // Generate 21 days (approximately one month of trading days)
  for (let i = 21; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    
    // Skip weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    // Random walk with mean reversion
    const meanReversionFactor = 0.05;
    const volatility = 0.15;
    const meanVix = 14.5; // Target to match example
    
    baseValue = baseValue + 
      meanReversionFactor * (meanVix - baseValue) + // Pull toward the mean
      volatility * (Math.random() * 2 - 1); // Random component
    
    // Ensure value is in a reasonable range
    baseValue = Math.max(baseValue, 11);
    baseValue = Math.min(baseValue, 18);
    
    dataPoints.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Number(baseValue.toFixed(2))
    });
  }
  
  return dataPoints;
}

/**
 * Fetches VIX data from our API and transforms it to the IndicatorProps format
 */
export async function fetchVixIndicator(): Promise<IndicatorProps> {
  const cacheKey = 'vix_indicator';
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    return cachedData as IndicatorProps;
  }
  
  try {
    // Fetch the current VIX data
    const { currentVix, previousClose } = await fetchCurrentVix();
    
    // Calculate change
    let changeValue = null;
    let changeString = undefined;
    
    if (currentVix !== null && previousClose !== null) {
      changeValue = currentVix - previousClose;
      // Format with sign and fixed decimal places
      changeString = (changeValue >= 0 ? '+' : '') + changeValue.toFixed(1);
    }
    
    // Determine status and percentile
    const status = determineVixStatus(currentVix);
    const historicalPercentile = calculateHistoricalPercentile(currentVix);
    
    // Fetch sparkline data
    const sparklineData = await fetchVixSparklineData();
    
    // Generate explanation text
    const explanationText = [
      "The VIX, or CBOE Volatility Index, measures expected market volatility for the S&P 500 over the next 30 days.",
      "Often called the 'fear index', it rises during market stress and falls during periods of stability and confidence.",
      "Readings below 20 generally indicate calm markets, 20-30 shows elevated concern, and above 30 signals high fear or stress.",
      "Extreme VIX readings (>40) often occur during market crises, while very low readings (<15) may signal market complacency."
    ];
    
    // Transform to IndicatorProps format
    const indicatorData: IndicatorProps = {
      id: 'vix',
      name: 'VIX (Fear Index)',
      description: 'Market Volatility Expectation',
      value: currentVix !== null ? currentVix.toFixed(2) : 'N/A',
      status: status === 'error' ? 'danger' : status as any,
      change: changeString,
      explanation: explanationText,
      sparklineData: sparklineData.length > 0 ? sparklineData : undefined
    };
    
    // Cache the transformed data
    cache.set(cacheKey, indicatorData);
    
    return indicatorData;
  } catch (error) {
    console.error('Error fetching VIX indicator data:', error);
    
    // Try to use stale data if available
    const staleData = cache.getStale(cacheKey);
    if (staleData) {
      return {
        ...staleData as IndicatorProps,
        status: 'danger'
      };
    }
    
    // Last resort: Return mock data
    return {
      id: 'vix',
      name: 'VIX (Fear Index)',
      description: 'Market Volatility Expectation',
      value: '14.23',
      status: 'normal',
      change: '-0.8',
      explanation: [
        "The VIX measures expected market volatility for the S&P 500 over the next 30 days.",
        "Often called the 'fear index', it rises during market stress and falls during periods of stability and confidence.",
        "Readings below 20 generally indicate calm markets, 20-30 shows elevated concern, and above 30 signals high fear or stress.",
        "Extreme VIX readings (>40) often occur during market crises, while very low readings (<15) may signal market complacency."
      ],
      sparklineData: generateMockSparklineData()
    };
  }
} 