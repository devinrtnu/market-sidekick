// Script to create put-call ratio database tables directly
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

async function createPutCallRatioTables() {
  try {
    console.log('📊 Creating put-call ratio tables in Supabase...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'create-put-call-ratio-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL into individual statements
    // This is a simple approach and may not work for all SQL statements
    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Check if the rpc method exists
    let useRPC = true;
    try {
      const { error: rpcCheckError } = await supabase.rpc('exec_sql', {
        query: 'SELECT 1'
      });
      
      if (rpcCheckError) {
        console.warn('⚠️ RPC method not available. Falling back to direct SQL execution.');
        useRPC = false;
      }
    } catch (rpcError) {
      console.warn('⚠️ Error checking RPC method:', rpcError.message);
      useRPC = false;
    }
    
    // Manual SQL execution without RPC
    if (!useRPC) {
      console.log('Executing SQL directly via dashboard instructions:');
      console.log('\n-------- Copy and paste this SQL into Supabase SQL Editor --------');
      console.log(sqlContent);
      console.log('----------------------------------------------------------------\n');
      console.log('📝 Instructions:');
      console.log('1. Go to your Supabase project');
      console.log('2. Click on "Database" in the left sidebar');
      console.log('3. Click on "SQL Editor"');
      console.log('4. Paste the SQL above');
      console.log('5. Click "Run"');
      console.log('\nAfter running the SQL, come back and manually check if the tables exist with:');
      console.log('node scripts/verify-put-call-ratio-tables.js');
      
      // Exit early
      return;
    }
    
    // Execute each statement independently using RPC
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      // Execute the SQL against the Supabase database
      const { error } = await supabase.rpc('exec_sql', {
        query: statement
      });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error.message);
        // Continue with other statements despite error
        continue;
      }
      
      console.log(`✅ Statement ${i + 1} executed successfully`);
    }
    
    console.log('\n✅ All SQL statements executed!');
    console.log('The following tables should now be available:');
    console.log('- put_call_ratios: Stores daily and intraday put-call ratio data');
    console.log('- put_call_ratio_history: Stores historical put-call ratio data for charts');
    
    // Try to verify the tables exist
    try {
      const { data, error } = await supabase.from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['put_call_ratios', 'put_call_ratio_history']);
      
      if (error) {
        console.warn('⚠️ Could not verify table creation:', error.message);
      } else if (data) {
        console.log(`👍 Confirmed ${data.length}/2 tables exist in the database.`);
        data.forEach(table => {
          console.log(`  - ${table.table_name}`);
        });
      }
    } catch (verifyError) {
      console.warn('⚠️ Could not verify table creation:', verifyError.message);
    }
    
  } catch (error) {
    console.error('❌ Error creating put-call ratio tables:', error);
    
    console.error('\n⚠️ If the RPC method failed, you can run the SQL directly through the Supabase dashboard:');
    console.error('1. Go to your Supabase project');
    console.error('2. Click on "Database" in the left sidebar');
    console.error('3. Click on "SQL Editor"');
    console.error('4. Paste the contents of create-put-call-ratio-tables.sql');
    console.error('5. Click "Run"');
    
    process.exit(1);
  }
}

// Run the function
createPutCallRatioTables(); 