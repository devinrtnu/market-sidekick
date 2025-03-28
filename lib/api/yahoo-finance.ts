import yahooFinance from 'yahoo-finance2';
import { Cache } from './cache';
import { validateMarketData, validateSparklineData } from './validation';
import { MarketDataResponse, SparklineDataPoint, TransformedIndicatorData } from './types';

// Cache instance with 15-minute expiration (15 * 60 * 1000 ms)
const cache = new Cache(15 * 60 * 1000);

// Market symbols we're tracking
const SYMBOLS = {
  SP500: '^GSPC',
  TREASURY_10Y: '^TNX',
  GOLD: 'GC=F',
  BTC: 'BTC-USD'
};

// Display names for our indicators
const DISPLAY_NAMES = {
  [SYMBOLS.SP500]: 'S&P 500',
  [SYMBOLS.TREASURY_10Y]: '10Y Treasury',
  [SYMBOLS.GOLD]: 'Gold',
  [SYMBOLS.BTC]: 'Bitcoin'
};

/**
 * Fetches current market data for the specified symbol
 */
export async function fetchMarketData(symbol: string): Promise<MarketDataResponse> {
  // Try to get cached data first
  const cachedData = cache.get(symbol);
  if (cachedData) {
    return cachedData as MarketDataResponse;
  }

  try {
    // Fetch live data from Yahoo Finance
    const result = await yahooFinance.quote(symbol);
    
    // Transform to our internal format
    const transformedData: MarketDataResponse = {
      symbol: result.symbol || symbol,
      value: typeof result.regularMarketPrice === 'number' ? result.regularMarketPrice : 0,
      change: typeof result.regularMarketChangePercent === 'number' ? result.regularMarketChangePercent : 0,
      timestamp: typeof result.regularMarketTime === 'number' ? 
        new Date(result.regularMarketTime * 1000) : new Date()
    };
    
    // Validate the data
    if (!validateMarketData(transformedData)) {
      throw new Error(`Invalid data received for ${symbol}`);
    }
    
    // Cache the valid result
    cache.set(symbol, transformedData);
    
    return transformedData;
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    
    // Use cached data if available, even if expired
    const staleData = cache.getStale(symbol);
    if (staleData) {
      console.log(`Using stale data for ${symbol}`);
      return {
        ...staleData as MarketDataResponse,
        isStale: true
      };
    }
    
    // Last resort fallback
    throw new Error(`Failed to fetch market data for ${symbol}`);
  }
}

/**
 * Fetches intraday data for sparklines (current trading day)
 */
export async function fetchSparklineData(
  symbol: string
): Promise<SparklineDataPoint[]> {
  const cacheKey = `${symbol}_intraday_sparkline`;
  const cachedData = cache.get(cacheKey);
  
  // Use cache with a shorter TTL for intraday data (5 minutes)
  if (cachedData && (Date.now() - (cachedData as any).timestamp) < 5 * 60 * 1000) {
    console.log(`Using cached intraday data for ${symbol}`);
    return cachedData as SparklineDataPoint[];
  }
  
  try {
    // Get today's start time (market open around 9:30 AM ET)
    const now = new Date();
    let startDate: Date;
    
    // If it's a weekend or before market open, use previous trading day
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    if (currentDay === 0 || currentDay === 6 || (currentDay === 1 && currentHour < 9)) {
      // Weekend or Monday before market open, use Friday
      startDate = new Date(now);
      // Go back to the previous Friday
      const daysToSubtract = currentDay === 0 ? 2 : currentDay === 6 ? 1 : 3;
      startDate.setDate(now.getDate() - daysToSubtract);
      startDate.setHours(9, 30, 0, 0); // 9:30 AM
    } else if (currentHour < 9) {
      // Before market open, use previous day
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(9, 30, 0, 0); // 9:30 AM
    } else {
      // Normal trading day
      startDate = new Date(now);
      startDate.setHours(9, 30, 0, 0); // 9:30 AM
    }
    
    // Use chart API with intraday data
    const result = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: now,
      interval: '5m', // 5-minute intervals
      includePrePost: true, // Include pre/post market data
    });
    
    if (!result.quotes || result.quotes.length < 2) {
      throw new Error(`Not enough intraday data points for ${symbol}`);
    }
    
    // Sort by date to ensure proper order
    const sortedQuotes = [...result.quotes].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Transform to SparklineDataPoint format
    const sparklineData: SparklineDataPoint[] = sortedQuotes
      .filter(quote => quote.close !== null) // Filter out null values
      .map(quote => {
        const quoteDate = new Date(quote.date);
        return {
          date: quoteDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          value: parseFloat((quote.close || 0).toFixed(2))
        };
      });
    
    // Log for debugging
    console.log(`Fetched ${sparklineData.length} intraday data points for ${symbol} sparkline`);
    
    // Validate data points
    if (!validateSparklineData(symbol, sparklineData)) {
      throw new Error(`Invalid sparkline data for ${symbol}`);
    }
    
    // Store data with timestamp for TTL check
    const dataWithTimestamp = {
      ...sparklineData,
      timestamp: Date.now()
    };
    cache.set(cacheKey, dataWithTimestamp);
    
    return sparklineData;
  } catch (error) {
    console.error(`Error fetching sparkline data for ${symbol}:`, error);
    
    // Fallback to cached stale data
    const staleData = cache.getStale(cacheKey);
    if (staleData) {
      return staleData as SparklineDataPoint[];
    }
    
    // Last resort: Generate mock data based on the symbol for a smooth fallback
    return generateMockIntradaySparklineData(symbol, 24); // 24 points to represent the trading day
  }
}

/**
 * Fetch all top indicator data in parallel and transform to the format
 * needed for our UI components
 */
export async function fetchAllTopIndicators(): Promise<TransformedIndicatorData[]> {
  try {
    // Fetch all market data in parallel
    const [sp500, treasury, gold, vix] = await Promise.allSettled([
      fetchMarketData(SYMBOLS.SP500),
      fetchMarketData(SYMBOLS.TREASURY_10Y),
      fetchMarketData(SYMBOLS.GOLD), 
      fetchMarketData(SYMBOLS.BTC)
    ]);
    
    // Fetch sparkline data in parallel
    const [sp500Sparkline, treasurySparkline, goldSparkline, vixSparkline] = 
      await Promise.allSettled([
        fetchSparklineData(SYMBOLS.SP500),
        fetchSparklineData(SYMBOLS.TREASURY_10Y),
        fetchSparklineData(SYMBOLS.GOLD),
        fetchSparklineData(SYMBOLS.BTC)
      ]);
    
    // Transform to TopIndicatorProps format
    const topIndicators: TransformedIndicatorData[] = [
      transformIndicator(
        sp500.status === 'fulfilled' ? sp500.value : null, 
        SYMBOLS.SP500,
        sp500Sparkline.status === 'fulfilled' ? sp500Sparkline.value : []
      ),
      transformIndicator(
        treasury.status === 'fulfilled' ? treasury.value : null, 
        SYMBOLS.TREASURY_10Y,
        treasurySparkline.status === 'fulfilled' ? treasurySparkline.value : [],
        true // Format as percentage
      ),
      transformIndicator(
        gold.status === 'fulfilled' ? gold.value : null, 
        SYMBOLS.GOLD,
        goldSparkline.status === 'fulfilled' ? goldSparkline.value : []
      ),
      transformIndicator(
        vix.status === 'fulfilled' ? vix.value : null, 
        SYMBOLS.BTC,
        vixSparkline.status === 'fulfilled' ? vixSparkline.value : [],
        false,
        'btc-top' // Custom ID
      )
    ];
    
    return topIndicators;
  } catch (error) {
    console.error('Error fetching all top indicators:', error);
    
    // In case of a complete failure, return mock data
    return generateMockTopIndicators();
  }
}

/**
 * Transform market data into the format expected by our UI components
 */
function transformIndicator(
  data: MarketDataResponse | null, 
  symbol: string,
  sparklineData: SparklineDataPoint[] = [],
  formatAsPercentage = false,
  customId?: string
): TransformedIndicatorData {
  if (data) {
    return {
      id: customId,
      title: DISPLAY_NAMES[symbol],
      value: formatAsPercentage ? `${data.value.toFixed(2)}%` : data.value,
      change: data.change,
      sparklineData
    };
  } else {
    // Fallback mock data if API call failed
    return generateMockIndicator(symbol, formatAsPercentage, customId);
  }
}

/**
 * Generate mock data for a single indicator
 * Used as fallback when API calls fail
 */
function generateMockIndicator(
  symbol: string, 
  formatAsPercentage = false,
  customId?: string
): TransformedIndicatorData {
  let value: number;
  let change: number;
  
  switch (symbol) {
    case SYMBOLS.SP500:
      value = 4783.45;
      change = 0.32;
      break;
    case SYMBOLS.TREASURY_10Y:
      value = 3.95;
      change = -0.05;
      break;
    case SYMBOLS.GOLD:
      value = 2052.30;
      change = 0.45;
      break;
    case SYMBOLS.BTC:
    default:
      value = 70250.00;
      change = 2.5;
      break;
  }
  
  return {
    id: customId,
    title: DISPLAY_NAMES[symbol],
    value: formatAsPercentage ? `${value.toFixed(2)}%` : value,
    change: change,
    // Use intraday mock data instead of daily
    sparklineData: generateMockIntradaySparklineData(symbol, 24)
  };
}

/**
 * Generate mock daily sparkline data for a specific symbol
 * Used as fallback when API calls fail
 */
function generateMockSparklineData(
  symbol: string, 
  days: number = 7
): SparklineDataPoint[] {
  const data: SparklineDataPoint[] = [];
  let startValue: number;
  let volatility: number;
  let trend: 'up' | 'down' | 'volatile' = 'volatile';
  
  // Set appropriate values based on symbol
  switch (symbol) {
    case SYMBOLS.SP500:
      startValue = 4750;
      volatility = 0.005;
      trend = 'up';
      break;
    case SYMBOLS.TREASURY_10Y:
      startValue = 3.98;
      volatility = 0.01;
      trend = 'down';
      break;
    case SYMBOLS.GOLD:
      startValue = 2040;
      volatility = 0.008;
      trend = 'volatile';
      break;
    case SYMBOLS.BTC:
    default:
      startValue = 70250;
      volatility = 0.02;
      trend = 'volatile';
      break;
  }
  
  let currentValue = startValue;
  const trendFactor = trend === 'up' ? 0.005 : trend === 'down' ? -0.005 : 0;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    let changePercent = 0;
    if (trend === 'volatile') {
      changePercent = (2 * volatility * Math.random() - volatility) * 1.5;
    } else {
      changePercent = trendFactor + (2 * volatility * Math.random() - volatility);
    }
    
    currentValue *= (1 + changePercent);
    // Ensure value doesn't go negative
    currentValue = Math.max(currentValue, 0);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: parseFloat(currentValue.toFixed(2))
    });
  }
  
  return data;
}

/**
 * Generate mock intraday sparkline data for a specific symbol
 * Used as fallback when API calls fail
 */
function generateMockIntradaySparklineData(
  symbol: string, 
  points: number = 24
): SparklineDataPoint[] {
  const data: SparklineDataPoint[] = [];
  let startValue: number;
  let volatility: number;
  let trend: 'up' | 'down' | 'volatile' = 'volatile';
  
  // Set appropriate values based on symbol
  switch (symbol) {
    case SYMBOLS.SP500:
      startValue = 4750;
      volatility = 0.0015;
      trend = 'up';
      break;
    case SYMBOLS.TREASURY_10Y:
      startValue = 3.98;
      volatility = 0.003;
      trend = 'down';
      break;
    case SYMBOLS.GOLD:
      startValue = 2040;
      volatility = 0.002;
      trend = 'volatile';
      break;
    case SYMBOLS.BTC:
    default:
      startValue = 70250;
      volatility = 0.005;
      trend = 'volatile';
      break;
  }
  
  let currentValue = startValue;
  const trendFactor = trend === 'up' ? 0.001 : trend === 'down' ? -0.001 : 0;
  
  // Generate market hours (9:30 AM - 4:00 PM)
  const marketOpen = new Date();
  marketOpen.setHours(9, 30, 0, 0);
  
  const minutesPerPoint = 390 / points; // 390 minutes in a trading day (6.5 hours)
  
  for (let i = 0; i < points; i++) {
    const pointTime = new Date(marketOpen);
    pointTime.setMinutes(marketOpen.getMinutes() + Math.floor(i * minutesPerPoint));
    
    let changePercent = 0;
    if (trend === 'volatile') {
      changePercent = (2 * volatility * Math.random() - volatility) * 1.5;
    } else {
      changePercent = trendFactor + (2 * volatility * Math.random() - volatility);
    }
    
    currentValue *= (1 + changePercent);
    // Ensure value doesn't go negative
    currentValue = Math.max(currentValue, 0);
    
    data.push({
      date: pointTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      value: parseFloat(currentValue.toFixed(2))
    });
  }
  
  return data;
}

/**
 * Generate all mock indicators when API completely fails
 */
function generateMockTopIndicators(): TransformedIndicatorData[] {
  return [
    generateMockIndicator(SYMBOLS.SP500),
    generateMockIndicator(SYMBOLS.TREASURY_10Y, true),
    generateMockIndicator(SYMBOLS.GOLD),
    generateMockIndicator(SYMBOLS.BTC, false, 'btc-top')
  ];
}
