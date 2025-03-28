import yahooFinance from 'yahoo-finance2';

// Symbol for VIX index
export const VIX_SYMBOL = '^VIX';

// VIX term structure symbols - with fallbacks
export const VIX_TERM_SYMBOLS = [
  // Primary symbols
  {
    oneMonth: 'VIX=F',  // Front-month VIX futures
    threeMonth: 'VX=F',  // Another representation some providers use
    sixMonth: '^VXMT'    // CBOE Mid-Term Volatility Index
  },
  // Fallback symbols (original implementation)
  {
    oneMonth: '^VIX1M',
    threeMonth: '^VIX3M',
    sixMonth: '^VIX6M'
  },
  // Additional fallbacks
  {
    oneMonth: '^VIX9D',  // 9-day VIX
    threeMonth: 'VIX',   // without the ^ prefix
    sixMonth: '^VXV'     // 3-month VIX (alternative)
  }
];

export interface HistoricalDataPoint {
  date: number; // Timestamp
  value: number;
}

/**
 * Attempt to fetch the current VIX value with retries
 */
export async function fetchCurrentVix(maxRetries = 3): Promise<{
  currentVix: number | null;
  previousClose: number | null;
}> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetching VIX data, attempt ${attempt}/${maxRetries}`);
      
      // Option 1: Try Yahoo Finance
      try {
        const vixQuote = await yahooFinance.quote(VIX_SYMBOL);
        return {
          currentVix: vixQuote?.regularMarketPrice || null,
          previousClose: vixQuote?.regularMarketPreviousClose || null
        };
      } catch (yahooError) {
        console.error(`Yahoo Finance fetch failed on attempt ${attempt}:`, yahooError);
        
        // Option 2: Try direct chart data
        try {
          console.log('Trying chart data method...');
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 5); // Last 5 days
          
          const chartData = await yahooFinance.chart(VIX_SYMBOL, {
            period1: startDate,
            period2: endDate,
            interval: '1d'
          });
          
          if (chartData && chartData.quotes && chartData.quotes.length >= 2) {
            // Get the latest two data points
            const sortedQuotes = [...chartData.quotes].sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            
            return {
              currentVix: sortedQuotes[0]?.close || null,
              previousClose: sortedQuotes[1]?.close || null
            };
          }
          throw new Error('Insufficient chart data');
        } catch (chartError) {
          console.error('Chart data method failed:', chartError);
          
          // Try Option 3: Mock fallback data for development environments
          if (process.env.NODE_ENV === 'development') {
            console.log('Using development fallback data');
            // Generate realistic-looking VIX value between 10 and 30
            const mockVix = 14 + Math.random() * 16;
            const mockPrev = mockVix * (1 + (Math.random() * 0.1 - 0.05));
            
            return {
              currentVix: Number(mockVix.toFixed(2)),
              previousClose: Number(mockPrev.toFixed(2))
            };
          }
          
          // If this was the last attempt, throw
          if (attempt === maxRetries) throw chartError;
        }
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, attempt * 500));
    } catch (err) {
      console.error(`VIX fetch attempt ${attempt} failed:`, err);
      
      if (attempt === maxRetries) {
        // All attempts failed
        return {
          currentVix: null,
          previousClose: null
        };
      }
      
      // Wait before retry with exponential backoff
      const delay = Math.pow(2, attempt) * 500; // 500ms, 1000ms, 2000ms
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return { currentVix: null, previousClose: null };
}

/**
 * Fetch term structure with fallbacks
 */
export async function fetchTermStructure() {
  const termStructure = {
    oneMonth: null,
    threeMonth: null,
    sixMonth: null
  };
  
  // Try each set of symbols
  for (const symbolSet of VIX_TERM_SYMBOLS) {
    let success = false;
    
    // Try to fetch each term
    for (const [term, symbol] of Object.entries(symbolSet)) {
      try {
        const result = await yahooFinance.quote(symbol);
        if (result && result.regularMarketPrice) {
          termStructure[term] = result.regularMarketPrice;
          success = true;
        }
      } catch (err) {
        console.log(`Failed to fetch ${term} (${symbol}): ${err.message}`);
      }
    }
    
    if (success) {
      // If we got at least one term, stop trying
      break;
    }
  }
  
  // For development, generate mock data if we couldn't get real data
  if (process.env.NODE_ENV === 'development' && 
      termStructure.oneMonth === null && 
      termStructure.threeMonth === null && 
      termStructure.sixMonth === null) {
    console.log('Using mock term structure data for development');
    const baseVix = 15 + Math.random() * 10;
    
    return {
      oneMonth: Number((baseVix * 1.05).toFixed(2)),
      threeMonth: Number((baseVix * 1.1).toFixed(2)),
      sixMonth: Number((baseVix * 1.15).toFixed(2))
    };
  }
  
  return termStructure;
}

/**
 * Generate realistic-looking mock VIX data for development
 */
export function generateMockVixData(range: string): HistoricalDataPoint[] {
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

/**
 * Fetch historical VIX data with retries and fallbacks
 * @param range Time range (e.g., '6mo', '1y')
 * @param interval Data interval (e.g., '1d', '1wk')
 * @returns Array of historical data points
 */
export async function fetchHistoricalVixData(range: string = '6mo', interval: string = '1d'): Promise<HistoricalDataPoint[]> {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`VIX historical fetch attempt ${attempt}/${maxRetries}`);
      
      // Calculate dates
      const endDate = new Date();
      const startDate = new Date();
      
      // Adjust start date based on range
      if (range === '6mo') {
        startDate.setMonth(startDate.getMonth() - 6);
      } else if (range === '1y') {
        startDate.setFullYear(startDate.getFullYear() - 1);
      } else if (range === '3mo') {
        startDate.setMonth(startDate.getMonth() - 3);
      } else if (range === '1mo') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (range === '5y') {
        startDate.setFullYear(startDate.getFullYear() - 5);
      }
      
      // Convert interval format
      const chartInterval = interval === '1d' ? '1d' : 
                            interval === '1wk' ? '1wk' : 
                            interval === '1mo' ? '1mo' : '1d';
      
      // Use the chart API instead of historical
      const result = await yahooFinance.chart(VIX_SYMBOL, {
        period1: startDate,
        period2: endDate,
        interval: chartInterval
      });
      
      if (result && result.quotes && result.quotes.length > 0) {
        // Format data for chart use - we want date as timestamps and close price
        return result.quotes
          .filter(quote => quote.close !== null) // Filter out null values
          .map(quote => ({
            date: new Date(quote.date).getTime(),
            value: quote.close
          }))
          .sort((a, b) => a.date - b.date); // Ensure chronological order
      }
      
      // If we reach here, the result is empty or invalid
      throw new Error('Empty or invalid data returned from Yahoo Finance');
    } catch (err) {
      console.error(`VIX historical fetch attempt ${attempt} failed:`, err);
      
      // Wait before retrying (with exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 500; // 500ms, 1000ms, 2000ms
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Use mock data in development as a last resort
        if (process.env.NODE_ENV === 'development') {
          return generateMockVixData(range);
        }
        throw err; // Re-throw on the last attempt in production
      }
    }
  }
  
  // This should never be reached in production
  if (process.env.NODE_ENV === 'development') {
    return generateMockVixData(range);
  }
  return [];
}

/**
 * Determine VIX status based on current value
 * @param vixValue Current VIX value
 * @returns Status as 'normal', 'warning', or 'danger'
 */
export function determineVixStatus(vixValue: number | null): 'normal' | 'warning' | 'danger' | 'error' {
  if (vixValue === null) {
    return 'error'; // Error if no data
  }
  
  if (vixValue > 30) {
    return 'danger';  // High volatility/fear
  } else if (vixValue > 20) {
    return 'warning'; // Elevated volatility
  } else {
    return 'normal';  // Normal market conditions
  }
}

/**
 * Calculate VIX historical percentile
 * @param currentVix Current VIX value
 * @returns Percentile from 0-100
 */
export function calculateHistoricalPercentile(currentVix: number | null): number | null {
  if (currentVix === null) {
    return null;
  }
  
  // Simplified calculation based on historical ranges
  // In a real implementation, this would compare against an actual historical dataset
  
  // VIX typically ranges from around 10 (very low) to 80+ (extreme crisis)
  // A rough approximation using long-term distribution
  const vixMin = 9;   // Approximate historical minimum
  const vixMax = 80;  // Approximate severe crisis level
  
  // Calculate percentile, cap between 0-100
  return Math.min(
    100,
    Math.max(
      0,
      Math.round((currentVix - vixMin) / (vixMax - vixMin) * 100)
    )
  );
} 