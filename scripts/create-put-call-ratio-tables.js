// Script to create the put-call ratio database tables
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please check .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Path to SQL file
const sqlFilePath = path.join(__dirname, 'create-put-call-ratio-tables.sql');

// Function to create tables
async function createPutCallRatioTables() {
  try {
    console.log('🔧 Creating put-call ratio database tables...');
    
    // Read the SQL file
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute.`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', {
        query_text: statement
      });
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        // Continue with other statements despite errors
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully.`);
      }
    }
    
    console.log('🎉 Put-call ratio database tables created successfully!');
    
    // Verify tables exist
    console.log('Verifying tables...');
    
    // Check put_call_ratios table
    const { count: ratiosCount, error: ratiosError } = await supabase
      .from('put_call_ratios')
      .select('*', { count: 'exact', head: true });
    
    if (ratiosError) {
      console.error('❌ Error verifying put_call_ratios table:', ratiosError);
    } else {
      console.log(`✅ put_call_ratios table exists and has ${ratiosCount || 0} rows.`);
    }
    
    // Check put_call_ratio_history table
    const { count: historyCount, error: historyError } = await supabase
      .from('put_call_ratio_history')
      .select('*', { count: 'exact', head: true });
    
    if (historyError) {
      console.error('❌ Error verifying put_call_ratio_history table:', historyError);
    } else {
      console.log(`✅ put_call_ratio_history table exists and has ${historyCount || 0} rows.`);
    }
    
  } catch (error) {
    console.error('❌ Error creating database tables:', error);
    process.exit(1);
  }
}

// Run the function
createPutCallRatioTables(); 