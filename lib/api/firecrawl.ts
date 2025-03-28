import FireCrawlApp from '@mendable/firecrawl-js';
import { z } from 'zod';

// Define the schema for data extraction - wrapped in an array
export const putCallRatioSchema = z.array(
  z.object({
    daily_pc_ratio: z.number()
  })
);

/**
 * Extract the put-call ratio from CBOE website using Firecrawl
 * @param apiKey Firecrawl API key
 * @returns The put-call ratio as a number
 */
export async function extractPutCallRatio(apiKey: string): Promise<number> {
  try {
    // Initialize FireCrawlApp with the provided API key
    const app = new FireCrawlApp({ apiKey });
    
    // Use the extract method to pull data from the CBOE website
    const result = await app.extract([
      "https://cboe.com/us/options/market_statistics/"
    ], {
      prompt: "Find the current Put/Call Ratio value from the webpage and return it as a decimal number."
    });
    
    // Log the raw response for debugging
    console.log('Firecrawl response:', JSON.stringify(result, null, 2));
    
    // Check if we got a direct result in the data object
    if (result.data && result.data.putCallRatio && typeof result.data.putCallRatio === 'number') {
      return result.data.putCallRatio;
    }
    
    // Try to find the ratio in any property of the data object
    if (result.data) {
      for (const key in result.data) {
        const value = result.data[key];
        if (typeof value === 'number' && value >= 0.5 && value <= 1.5) {
          return value;
        }
      }
    }
    
    // If we didn't find it in a structured way, search for numbers in the whole response
    const jsonString = JSON.stringify(result);
    const matches = jsonString.match(/\d+\.\d+/g);
    
    if (matches && matches.length > 0) {
      // Filter to only include values that are likely to be P/C ratios (between 0.5 and 1.5)
      const potentialRatios = matches
        .map(m => parseFloat(m))
        .filter(n => n >= 0.5 && n <= 1.5);
      
      if (potentialRatios.length > 0) {
        return potentialRatios[0];
      }
    }
    
    throw new Error('Could not find put-call ratio in Firecrawl response');
  } catch (error) {
    console.error('Error extracting put-call ratio with Firecrawl:', error);
    throw error;
  }
} 