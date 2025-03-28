import { supabaseAdmin } from '../lib/supabase';
import { determinePutCallStatus } from '../lib/utils/indicator-utils';

/**
 * Script to seed the database with historical put-call ratio data for testing
 */
async function seedPutCallRatioData() {
  console.log('Seeding put-call ratio data...');
  
  try {
    // Generate 60 days of sample data
    const records = [];
    const endDate = new Date();
    
    // Create a sine wave pattern for sample data
    for (let i = 0; i < 60; i++) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      
      // Generate a value between 0.6 and 1.2 using a sine wave pattern
      // This creates a cyclical pattern that looks realistic
      const baseValue = 0.9; // Middle value
      const amplitude = 0.3; // How much it varies
      const period = 30; // Days in one cycle
      
      // Create sinusoidal pattern with some randomness
      const ratio = baseValue + amplitude * Math.sin((2 * Math.PI * i) / period) + (Math.random() * 0.1 - 0.05);
      const roundedRatio = Math.round(ratio * 100) / 100; // Round to 2 decimal places
      
      // Determine status based on the ratio
      const status = determinePutCallStatus(roundedRatio);
      
      records.push({
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
        ratio_value: roundedRatio,
        status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    
    // Insert data in batches to avoid hitting limits
    const batchSize = 10;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      const { error } = await supabaseAdmin
        .from('put_call_ratios')
        .upsert(batch, { onConflict: 'date' });
      
      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      } else {
        console.log(`Inserted batch ${i / batchSize + 1} of ${Math.ceil(records.length / batchSize)}`);
      }
    }
    
    console.log(`Successfully seeded ${records.length} days of put-call ratio data.`);
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

// Run the seed function if this is executed directly
if (require.main === module) {
  seedPutCallRatioData()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
} 