// Script to verify if put-call ratio tables exist in Supabase
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

async function verifyPutCallRatioTables() {
  try {
    console.log('🔍 Verifying put-call ratio tables in Supabase...');
    
    // Method 1: Check information schema
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['put_call_ratios', 'put_call_ratio_history']);
    
    if (schemaError) {
      console.error('❌ Error checking information schema:', schemaError);
    } else {
      console.log(`Information Schema Check: Found ${schemaData.length} of 2 expected tables.`);
      if (schemaData.length > 0) {
        schemaData.forEach(table => {
          console.log(`  ✓ ${table.table_name}`);
        });
      }
      
      if (schemaData.length < 2) {
        console.log('  ❌ Some tables are missing.');
        const foundTables = schemaData.map(table => table.table_name);
        ['put_call_ratios', 'put_call_ratio_history'].forEach(tableName => {
          if (!foundTables.includes(tableName)) {
            console.log(`  - Missing table: ${tableName}`);
          }
        });
      }
    }
    
    // Method 2: Try to query the tables directly
    console.log('\nDirect Table Access Check:');
    
    // Check put_call_ratios table
    const { count: ratioCount, error: ratioError } = await supabase
      .from('put_call_ratios')
      .select('*', { count: 'exact', head: true });
    
    if (ratioError) {
      console.log(`  ❌ put_call_ratios: ${ratioError.message}`);
    } else {
      console.log(`  ✓ put_call_ratios exists (contains ${ratioCount || 0} rows)`);
    }
    
    // Check put_call_ratio_history table
    const { count: historyCount, error: historyError } = await supabase
      .from('put_call_ratio_history')
      .select('*', { count: 'exact', head: true });
    
    if (historyError) {
      console.log(`  ❌ put_call_ratio_history: ${historyError.message}`);
    } else {
      console.log(`  ✓ put_call_ratio_history exists (contains ${historyCount || 0} rows)`);
    }
    
    // Conclusion
    console.log('\nConclusion:');
    if (
      (schemaData && schemaData.length === 2) || 
      (!ratioError && !historyError)
    ) {
      console.log('✅ All put-call ratio tables exist in the database!');
    } else {
      console.error('❌ Some put-call ratio tables are missing or inaccessible.');
      console.log('\nTo create the missing tables:');
      console.log('1. Run the SQL from scripts/create-put-call-ratio-tables.sql in the Supabase SQL Editor');
      console.log('2. Or run: node scripts/create-put-call-ratio-tables-direct.js');
    }
    
  } catch (error) {
    console.error('❌ Error verifying tables:', error);
    process.exit(1);
  }
}

// Run the function
verifyPutCallRatioTables(); 