// Script to create yield curve database tables
const fs = require('fs');
const path = require('path');
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

async function createYieldCurveTables() {
  try {
    console.log('📊 Creating yield curve tables in Supabase...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'create-yield-curve-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL against the Supabase database
    const { error } = await supabase.rpc('pgmigrations_control', {
      sql_script: sqlContent
    });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Yield curve tables created successfully!');
    console.log('The following tables were created:');
    console.log('- daily_yield_curves: Stores the latest yield curve data (10Y-2Y spread)');
    console.log('- yield_curve_sparklines: Stores historical yield curve data for charts');
    
    // Verify the tables exist
    const { data: tablesData, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .in('tablename', ['daily_yield_curves', 'yield_curve_sparklines']);
    
    if (tablesError) {
      console.warn('⚠️ Could not verify table creation:', tablesError.message);
    } else if (tablesData) {
      console.log(`👍 Confirmed ${tablesData.length}/2 tables exist in the database.`);
    }
    
  } catch (error) {
    console.error('❌ Error creating yield curve tables:', error);
    
    // Check if the error is due to missing RPC function
    if (error.message && error.message.includes('function pgmigrations_control() does not exist')) {
      console.error('\n⚠️ The pgmigrations_control function does not exist in your Supabase instance.');
      console.error('This could be because:');
      console.error('1. You need to enable the pg_control extension');
      console.error('2. You need to create the function manually');
      console.error('\nAlternative approach:');
      console.error('You can run the SQL directly through the Supabase dashboard:');
      console.error('1. Go to your Supabase project');
      console.error('2. Click on "Database" in the left sidebar');
      console.error('3. Click on "SQL Editor"');
      console.error('4. Paste the contents of create-yield-curve-tables.sql');
      console.error('5. Click "Run"');
    }
    
    process.exit(1);
  }
}

// Run the function
createYieldCurveTables(); 