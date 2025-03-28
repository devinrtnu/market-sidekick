import yahooFinance from 'yahoo-finance2';

/**
 * Fetches options data from Yahoo Finance and calculates the put-call ratio
 * Used as a fallback when Firecrawl scraping fails
 */
export async function fetchOptionsDataFromYahoo(): Promise<number> {
  try {
    // Get SPY options data
    const optionsData = await yahooFinance.options('SPY');
    
    // Calculate total put and call volumes
    let totalCallVolume = 0;
    let totalPutVolume = 0;
    
    // Process each expiration date's options
    for (const optionChain of optionsData.options) {
      // Sum call volumes
      for (const call of optionChain.calls) {
        if (call.volume) {
          totalCallVolume += call.volume;
        }
      }
      
      // Sum put volumes
      for (const put of optionChain.puts) {
        if (put.volume) {
          totalPutVolume += put.volume;
        }
      }
    }
    
    // Calculate ratio
    const putCallRatio = totalCallVolume > 0 ? totalPutVolume / totalCallVolume : 0;
    
    return putCallRatio;
  } catch (error) {
    console.error('Error fetching options data from Yahoo Finance:', error);
    throw error;
  }
} 