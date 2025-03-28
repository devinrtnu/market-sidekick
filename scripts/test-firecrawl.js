/**
 * Test script to verify Firecrawl extraction of put-call ratio
 * Run with: node scripts/test-firecrawl.js
 */

// Use require for Node.js
const { default: FireCrawlApp } = require('@mendable/firecrawl-js');
const { z } = require('zod');

const FIRECRAWL_API_KEY = "fc-200cbf4607c74ea5b7e038609edb0dc7";

async function testFirecrawlRawExtraction() {
  try {
    console.log('Testing Firecrawl extraction with simple prompt...');
    
    const app = new FireCrawlApp({ apiKey: FIRECRAWL_API_KEY });
    
    // Use a simpler extraction approach
    const result = await app.extract([
      "https://cboe.com/us/options/market_statistics/"
    ], {
      prompt: "Find the current Put/Call Ratio value from the webpage and return it as a decimal number."
    });
    
    console.log('Firecrawl raw response:', JSON.stringify(result, null, 2));
    
    // Check if there's error information
    if (result.error) {
      console.log('Firecrawl error:', result.error);
    }
    
    // Check if there's warning information
    if (result.warning) {
      console.log('Firecrawl warning:', result.warning);
    }
    
    // Look for source info
    if (result.sources) {
      console.log('Firecrawl sources:', result.sources);
    }
    
    return result;
  } catch (error) {
    console.error('Error with Firecrawl:', error);
    return null;
  }
}

// Run the test
testFirecrawlRawExtraction().then((result) => {
  console.log('Test completed.');
  
  // Attempt to manually find the P/C ratio in the result
  if (result) {
    const jsonString = JSON.stringify(result);
    
    // Look for numbers that could be the P/C ratio
    const matches = jsonString.match(/\d+\.\d+/g);
    if (matches && matches.length > 0) {
      console.log('Potential P/C ratio values found:', matches);
      
      // The P/C ratio is usually between 0.5 and 1.5, so filter for values in that range
      const potentialRatios = matches
        .map(m => parseFloat(m))
        .filter(n => n >= 0.5 && n <= 1.5);
      
      if (potentialRatios.length > 0) {
        console.log('Most likely P/C ratio:', potentialRatios[0]);
        
        // Determine status
        const ratio = potentialRatios[0];
        console.log('Status:', ratio >= 1.0 ? 'danger' : ratio >= 0.7 ? 'warning' : 'normal');
        
        // Format for database
        console.log('Formatted for database:', ratio.toFixed(4));
      }
    }
  }
  
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 