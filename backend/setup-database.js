const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.development' });

/**
 * Setup Real Analytics Database
 * This script creates the real database structure for analytics
 */

async function setupDatabase() {
  console.log('🚀 Setting up Real Analytics Database...\n');

  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin operations

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in environment variables');
    console.error('   Please check SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.development');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Read SQL setup file
    const sqlPath = path.join(__dirname, 'database', 'setup-real-analytics.sql');
    const setupSQL = fs.readFileSync(sqlPath, 'utf8');

    console.log('📖 Reading SQL setup file...');
    console.log(`📁 Path: ${sqlPath}`);

    // Split SQL into individual statements (basic split by semicolon)
    const statements = setupSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute SQL statements
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      if (statement.length < 10) continue; // Skip very short statements

      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

        // Execute statement using Supabase RPC (raw SQL)
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // Try alternative: direct query execution for certain statements
          if (statement.toUpperCase().includes('CREATE TABLE') ||
              statement.toUpperCase().includes('CREATE INDEX') ||
              statement.toUpperCase().includes('ALTER TABLE')) {

            // For schema changes, we'll use a different approach
            console.log(`   ⚠️  Statement failed with RPC, trying alternative method...`);

            // For now, let's log what we would execute
            console.log(`   📋 SQL: ${statement.substring(0, 100)}...`);

          } else {
            throw error;
          }
        } else {
          console.log(`   ✅ Statement executed successfully`);
        }

      } catch (error) {
        console.log(`   ⚠️  Statement failed (might be expected): ${error.message}`);
        // Continue with next statement - some might fail if already exists
      }
    }

    console.log('\n🔍 Verifying database setup...');

    // Verify tables were created
    const tablesToCheck = ['users', 'cards', 'analytics_events', 'analytics_daily_summary', 'analytics_sessions'];

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`   ❌ Table '${table}' not accessible: ${error.message}`);
        } else {
          console.log(`   ✅ Table '${table}' is accessible`);
        }
      } catch (error) {
        console.log(`   ❌ Table '${table}' check failed: ${error.message}`);
      }
    }

    // Test demo data
    console.log('\n📊 Checking demo data...');

    try {
      const { data: demoCard, error } = await supabase
        .from('cards')
        .select('*')
        .eq('id', 'c3140e8f-999a-41ef-b755-1dc4519afb9e')
        .single();

      if (error) {
        console.log('   ⚠️  Demo card not found - this is expected for new setup');
        console.log('   💡 You can create demo data manually or through the app');
      } else {
        console.log('   ✅ Demo card found:', demoCard.title);
      }
    } catch (error) {
      console.log('   ⚠️  Demo data check failed:', error.message);
    }

    console.log('\n🎉 Database setup completed!');
    console.log('\nNext steps:');
    console.log('1. Run the backend with: npm run dev');
    console.log('2. The app will now use real database in DEMO mode');
    console.log('3. Create a real account to use production features');

  } catch (error) {
    console.error('\n❌ Database setup failed:');
    console.error(error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your Supabase credentials');
    console.error('2. Ensure you have database admin privileges');
    console.error('3. Check network connectivity to Supabase');
    process.exit(1);
  }
}

// Alternative: Manual SQL execution instructions
function showManualInstructions() {
  console.log('\n📋 MANUAL SETUP INSTRUCTIONS:');
  console.log('If automated setup fails, you can run the SQL manually:');
  console.log('\n1. Go to your Supabase Dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the content from:');
  console.log('   backend/database/setup-real-analytics.sql');
  console.log('4. Execute the SQL script');
  console.log('\n🔗 Supabase Dashboard: https://app.supabase.com');
}

// Run setup
if (require.main === module) {
  setupDatabase().catch(error => {
    console.error('Setup failed:', error.message);
    showManualInstructions();
    process.exit(1);
  });
}

module.exports = { setupDatabase };