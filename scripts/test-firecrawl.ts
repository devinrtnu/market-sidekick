/**
 * Test script to verify Firecrawl extraction of put-call ratio
 * Run with: npx ts-node scripts/test-firecrawl.ts
 */

// Use require instead of import
const FireCrawlApp = require('@mendable/firecrawl-js').default;
const { z } = require('zod');

const FIRECRAWL_API_KEY = "fc-200cbf4607c74ea5b7e038609edb0dc7";

// Define the schema inline since we can't import it
const putCallRatioSchema = z.array(
  z.object({
    daily_pc_ratio: z.number()
  })
);

async function extractPutCallRatio(apiKey: string): Promise<number> {
  try {
    // Initialize FireCrawlApp with the provided API key
    const app = new FireCrawlApp({ apiKey });
    
    // Use the extract method to pull data from the CBOE website
    const extractResult = await app.extract([
      "https://cboe.com/us/options/market_statistics/"
    ], {
      prompt: "Extract the daily P/C Ratio from the specified page.",
      schema: putCallRatioSchema,
    });
    
    // Log the raw result to see what we're getting
    console.log('Raw extraction result:', JSON.stringify(extractResult, null, 2));
    
    // Parse and return the extracted data - it comes as an array
    const validatedData = putCallRatioSchema.parse(extractResult);
    
    // The result is an array with a single object containing daily_pc_ratio
    if (validatedData.length > 0 && validatedData[0].daily_pc_ratio) {
      return validatedData[0].daily_pc_ratio;
    }
    
    throw new Error('No valid put-call ratio found in extraction results');
  } catch (error) {
    console.error('Error extracting put-call ratio with Firecrawl:', error);
    throw error;
  }
}

async function testFirecrawlExtraction(): Promise<number | null> {
  try {
    console.log('Testing Firecrawl extraction of put-call ratio...');
    
    const ratio = await extractPutCallRatio(FIRECRAWL_API_KEY);
    
    console.log('Successfully extracted put-call ratio:', ratio);
    console.log('Status:', ratio >= 1.0 ? 'danger' : ratio >= 0.7 ? 'warning' : 'normal');
    
    // Format to 4 decimal places as stored in the database
    console.log('Formatted for database:', ratio.toFixed(4));
    
    return ratio;
  } catch (error) {
    console.error('Error extracting put-call ratio:', error);
    return null;
  }
}

// Run the test
testFirecrawlExtraction().then(() => {
  console.log('Test completed.');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 