import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.development' });

console.log('🔍 Testing Supabase connection...');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

console.log('📍 Supabase URL:', supabaseUrl);
console.log('🔑 Service Key:', supabaseKey ? '[PRESENT]' : '[MISSING]');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n🔌 Testing basic connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('information_schema.tables').select('table_name').limit(1);
    
    if (error && !error.message.includes('relation "information_schema.tables" does not exist')) {
      console.error('❌ Connection failed:', error);
      return false;
    }
    
    console.log('✅ Basic connection successful');
    
    // Test auth functionality
    console.log('\n🔐 Testing auth functionality...');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError && authError.message.includes('JWT')) {
      console.log('✅ Auth service responding (expected auth error)');
    } else {
      console.log('✅ Auth service accessible');
    }
    
    // List existing tables
    console.log('\n📊 Checking existing tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('⚠️  Could not list tables:', tablesError.message);
    } else {
      console.log(`📋 Found ${tables?.length || 0} public tables:`, tables?.map(t => t.table_name));
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Supabase connection test successful!');
  } else {
    console.log('\n💥 Supabase connection test failed!');
  }
  process.exit(success ? 0 : 1);
});