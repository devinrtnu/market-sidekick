// Script to seed yield curve database tables with sample data
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please check .env.local file.');
  console.error('Required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedYieldCurveData() {
  try {
    console.log('🌱 Seeding yield curve data in Supabase...');
    
    // Check if tables exist - fixed query to use information_schema correctly
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['daily_yield_curves', 'yield_curve_sparklines']);

    // Alternative approach if the above doesn't work
    if (tablesError) {
      console.log('Trying alternative method to check if tables exist...');
      
      // Try to query the tables directly with count
      try {
        const { count: dailyCount, error: dailyError } = await supabase
          .from('daily_yield_curves')
          .select('*', { count: 'exact', head: true });
          
        const { count: sparklineCount, error: sparklineError } = await supabase
          .from('yield_curve_sparklines')
          .select('*', { count: 'exact', head: true });
          
        if (dailyError || sparklineError) {
          console.error('❌ Tables verification failed. Error:', dailyError || sparklineError);
          console.log('Attempting to proceed anyway...');
        } else {
          console.log(`✅ Tables verified. Found ${dailyCount} daily records and ${sparklineCount} sparkline records.`);
        }
      } catch (verifyError) {
        console.error('❌ Tables verification failed. Will attempt to proceed anyway.');
      }
    } else if (!tablesData || tablesData.length < 2) {
      console.warn('⚠️ Not all required yield curve tables were found. Will attempt to proceed anyway.');
    } else {
      console.log(`✅ Found ${tablesData.length} yield curve tables in the database`);
    }
    
    // Generate seed data
    const today = new Date();
    const dailyEntries = [];
    const sparklineEntries = [];
    
    // Set the latest spread and yields
    const latestSpread = 0.0041; // Example: 41 basis points
    const tenYearYield = 0.0435; // 4.35%
    const twoYearYield = 0.0394; // 3.94%
    
    // Add the latest entry
    dailyEntries.push({
      date: formatDate(today),
      spread: latestSpread,
      ten_year_yield: tenYearYield,
      two_year_yield: twoYearYield,
      status: determineStatus(latestSpread)
    });
    
    // Generate 30 days of sparkline data with a realistic pattern
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Create some variation in the spread
      // This creates a more realistic pattern with small day-to-day changes
      const dayOffset = i === 0 ? 0 : (Math.random() * 0.0008 - 0.0004);
      
      // For a more realistic trend, make the spread gradually change over time
      // Start with current spread and shift it slightly each day back in time
      const trendFactor = i / 100;
      const baseSpread = latestSpread - trendFactor;
      
      const spread = Math.max(-0.01, Math.min(0.02, baseSpread + dayOffset));
      
      sparklineEntries.push({
        date: formatDate(date),
        timeframe: '1m',
        spread: parseFloat(spread.toFixed(6))
      });
    }
    
    // Insert daily data (latest entry)
    console.log('Inserting daily yield curve data...');
    const { error: dailyError } = await supabase
      .from('daily_yield_curves')
      .upsert(dailyEntries, { 
        onConflict: 'date',
        ignoreDuplicates: false // Update if exists
      });
    
    if (dailyError) {
      console.error('❌ Error inserting daily data:', dailyError.message);
    } else {
      console.log(`✅ Successfully inserted ${dailyEntries.length} daily entries`);
    }
    
    // Insert sparkline data in batches to avoid hitting statement limits
    const batchSize = 10;
    console.log(`Inserting sparkline data in batches of ${batchSize}...`);
    
    for (let i = 0; i < sparklineEntries.length; i += batchSize) {
      const batch = sparklineEntries.slice(i, i + batchSize);
      const { error: sparklineError } = await supabase
        .from('yield_curve_sparklines')
        .upsert(batch, { 
          onConflict: 'date,timeframe',
          ignoreDuplicates: false // Update if exists
        });
      
      if (sparklineError) {
        console.error(`❌ Error inserting sparkline batch ${i/batchSize + 1}:`, sparklineError.message);
      } else {
        console.log(`✅ Successfully inserted sparkline batch ${i/batchSize + 1} of ${Math.ceil(sparklineEntries.length/batchSize)}`);
      }
    }
    
    console.log('\n🎉 Yield curve data seeded successfully!');
    console.log(`Created ${dailyEntries.length} daily entries and ${sparklineEntries.length} sparkline data points.`);
    
  } catch (error) {
    console.error('❌ Error seeding yield curve data:', error);
    process.exit(1);
  }
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Helper function to determine status based on spread
function determineStatus(spread) {
  if (spread < 0) return 'danger';     // Inverted yield curve (negative spread)
  if (spread < 0.001) return 'warning'; // Very close to inversion
  return 'normal';                      // Normal yield curve
}

// Run the function
seedYieldCurveData(); 