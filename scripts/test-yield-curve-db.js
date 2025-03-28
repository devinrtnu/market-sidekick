// Script to test database queries for yield curve data
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please check .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabaseQueries() {
  try {
    console.log('🔍 Testing yield curve database queries...');
    
    // Test query for daily records count
    console.log('\n📊 DAILY RECORDS COUNT TEST:');
    const { count: dailyCount, error: dailyCountError } = await supabase
      .from('daily_yield_curves')
      .select('*', { count: 'exact', head: true });
    
    if (dailyCountError) {
      console.error('❌ Error counting daily records:', dailyCountError);
    } else {
      console.log(`✅ Found ${dailyCount} daily records`);
    }
    
    // Test query for latest record
    console.log('\n📊 LATEST RECORD TEST:');
    const { data: latestData, error: latestError } = await supabase
      .from('daily_yield_curves')
      .select('*')
      .order('date', { ascending: false })
      .limit(1);
    
    if (latestError) {
      console.error('❌ Error fetching latest record:', latestError);
    } else if (!latestData || latestData.length === 0) {
      console.error('❌ No latest record found');
    } else {
      console.log(`✅ Latest record date: ${latestData[0].date}`);
      console.log(`   Spread value: ${latestData[0].spread}`);
    }
    
    // Test queries for different timeframes
    const timeframes = ['1m', '3m', '6m', '1y', '2y', '5y'];
    
    for (const timeframe of timeframes) {
      console.log(`\n📊 TIMEFRAME TEST: ${timeframe}`);
      
      // Convert timeframe to days limit
      let daysLimit = 30; // Default for 1m
      if (timeframe === '3m') daysLimit = 90;
      else if (timeframe === '6m') daysLimit = 180;
      else if (timeframe === '1y') daysLimit = 365;
      else if (timeframe === '2y') daysLimit = 730;
      else if (timeframe === '5y') daysLimit = 1825;
      
      // First query the specific timeframe from yield_curve_sparklines
      const { data: sparklineData, error: sparklineError } = await supabase
        .from('yield_curve_sparklines')
        .select('*')
        .eq('timeframe', timeframe)
        .order('date', { ascending: false })
        .limit(10);
      
      if (sparklineError) {
        console.error(`❌ Error querying sparkline data for timeframe ${timeframe}:`, sparklineError);
      } else if (!sparklineData || sparklineData.length === 0) {
        console.log(`⚠️ No sparkline data found for timeframe ${timeframe}`);
      } else {
        console.log(`✅ Found ${sparklineData.length}/10 sparkline records for timeframe ${timeframe}`);
        console.log(`   Latest date: ${sparklineData[0].date}`);
      }
      
      // Now try to get data directly from daily_yield_curves
      const { data: historicalData, error: historicalError } = await supabase
        .from('daily_yield_curves')
        .select('date, spread')
        .order('date', { ascending: false })
        .limit(daysLimit);
      
      if (historicalError) {
        console.error(`❌ Error querying historical data for timeframe ${timeframe}:`, historicalError);
      } else if (!historicalData || historicalData.length === 0) {
        console.log(`⚠️ No historical data found for timeframe ${timeframe}`);
      } else {
        console.log(`✅ Found ${historicalData.length}/${daysLimit} daily records for timeframe ${timeframe}`);
        console.log(`   Date range: ${historicalData[historicalData.length-1].date} to ${historicalData[0].date}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing database queries:', error);
  }
}

// Run the test
testDatabaseQueries(); 