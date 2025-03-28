/**
 * Script to directly check the put-call ratio data in the database and API
 * Run with: node scripts/direct-fetch-pcr.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get host from command line args or default to localhost
const host = process.argv[2] || 'http://localhost:3000';

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

/**
 * Function to check the database directly
 */
async function checkDatabase() {
  console.log('== CHECKING DATABASE DIRECTLY ==');
  
  if (!supabase) {
    console.error('❌ Supabase client not initialized - missing env variables');
    return;
  }
  
  try {
    // Get all put-call ratio data from the database
    const { data, error } = await supabase
      .from('put_call_ratios')
      .select('*')
      .order('date', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching from database:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('❌ No data found in put_call_ratios table');
      return;
    }
    
    console.log(`✅ Found ${data.length} records in database`);
    console.log('📊 Latest entry:');
    console.log(`   Date: ${data[0].date}`);
    console.log(`   Value: ${data[0].ratio_value}`);
    console.log(`   Status: ${data[0].status}`);
    console.log(`   Updated: ${data[0].updated_at}`);
    
    console.log('\n📊 All recent entries:');
    data.forEach((row, i) => {
      console.log(`   ${i+1}. ${row.date}: ${row.ratio_value} (${row.status})`);
    });
    
    return data[0]; // Return latest entry for comparison
  } catch (err) {
    console.error('❌ Error accessing database:', err);
  }
}

/**
 * Function to check the debug API endpoint
 */
async function checkDebugEndpoint() {
  console.log('\n== CHECKING DEBUG API ENDPOINT ==');
  
  try {
    const cacheBuster = Date.now();
    const response = await fetch(`${host}/api/debug/latest-put-call-ratio?_=${cacheBuster}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ Debug API error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Debug API response received');
    
    if (data.latestEntry) {
      console.log('📊 Latest entry from debug API:');
      console.log(`   Date: ${data.latestEntry.date}`);
      console.log(`   Value: ${data.latestEntry.ratio_value}`);
      console.log(`   Status: ${data.latestEntry.status}`);
    } else {
      console.log('❌ No data in debug API response');
    }
    
    return data.latestEntry;
  } catch (err) {
    console.error('❌ Error calling debug API:', err);
  }
}

/**
 * Function to check the regular API endpoint
 */
async function checkRegularEndpoint() {
  console.log('\n== CHECKING REGULAR API ENDPOINT ==');
  
  try {
    const cacheBuster = Date.now();
    const response = await fetch(`${host}/api/indicators/put-call-ratio?no-cache=${cacheBuster}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ API error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Regular API response received');
    
    if (data.totalPutCallRatio !== null) {
      console.log('📊 Data from regular API:');
      console.log(`   Total P/C Ratio: ${data.totalPutCallRatio}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Source: ${data.source}`);
      console.log(`   20-Day Average: ${data.twentyDayAverage}`);
      
      if (data.historical && data.historical.length > 0) {
        console.log(`   Historical data: ${data.historical.length} entries`);
        console.log('   Latest historical entries:');
        data.historical.slice(0, 5).forEach((item, i) => {
          const date = new Date(item.date).toISOString().split('T')[0];
          console.log(`     ${i+1}. ${date}: ${item.putCallRatio}`);
        });
      } else {
        console.log('   No historical data');
      }
    } else {
      console.log('❌ No data in API response');
    }
    
    return data;
  } catch (err) {
    console.error('❌ Error calling API:', err);
  }
}

// Compare all data sources to check for consistency
async function runAllChecks() {
  try {
    const dbData = await checkDatabase();
    const debugData = await checkDebugEndpoint();
    const apiData = await checkRegularEndpoint();
    
    console.log('\n== CONSISTENCY CHECK ==');
    
    // Compare database and API values 
    if (dbData && apiData && apiData.totalPutCallRatio !== null) {
      console.log('Comparing database value vs API response:');
      
      const dbValue = dbData.ratio_value;
      const apiValue = apiData.totalPutCallRatio;
      
      if (Math.abs(dbValue - apiValue) < 0.001) {
        console.log(`✅ Values match! DB: ${dbValue}, API: ${apiValue}`);
      } else {
        console.log(`❌ Values don't match! DB: ${dbValue}, API: ${apiValue}`);
        console.log('This indicates a caching issue or data inconsistency.');
      }
    } else {
      console.log('❌ Can\'t compare values because some data is missing');
    }
    
    console.log('\nAll checks completed!');
  } catch (err) {
    console.error('Error running checks:', err);
  }
}

// Run all the checks
runAllChecks(); 