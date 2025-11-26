import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Setting up Supabase tables for INDI Digital Card...');

async function setupTables() {
  try {
    // Test basic connection
    console.log('🔌 Testing connection...');
    const { data: testData, error: testError } = await supabase.from('_test_').select('*').limit(1);
    
    if (testError && testError.code !== 'PGRST116') { // PGRST116 means table doesn't exist, which is expected
      throw testError;
    }
    
    console.log('✅ Connection successful!');

    // Create users table
    console.log('\n👥 Creating users table...');
    const { data: usersData, error: usersError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email_verified BOOLEAN DEFAULT false,
          role VARCHAR(20) DEFAULT 'user',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (usersError) {
      console.log('⚠️ Users table creation failed (might already exist):', usersError.message);
    } else {
      console.log('✅ Users table created successfully');
    }

    // Create cards table
    console.log('\n💳 Creating cards table...');
    const { data: cardsData, error: cardsError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS cards (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          company VARCHAR(200),
          position VARCHAR(200),
          phone VARCHAR(50),
          email VARCHAR(255),
          website VARCHAR(255),
          social_links JSONB DEFAULT '{}',
          design_template VARCHAR(50) DEFAULT 'modern',
          colors JSONB DEFAULT '{"primary": "#2563eb", "secondary": "#64748b"}',
          is_active BOOLEAN DEFAULT true,
          views_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (cardsError) {
      console.log('⚠️ Cards table creation failed (might already exist):', cardsError.message);
    } else {
      console.log('✅ Cards table created successfully');
    }

    // Create sessions table for refresh tokens
    console.log('\n🔐 Creating sessions table...');
    const { data: sessionsData, error: sessionsError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS sessions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          refresh_token TEXT NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (sessionsError) {
      console.log('⚠️ Sessions table creation failed (might already exist):', sessionsError.message);
    } else {
      console.log('✅ Sessions table created successfully');
    }

    // Test if tables exist by querying them
    console.log('\n🧪 Testing table access...');
    
    const { data: usersTest, error: usersTestError } = await supabase.from('users').select('id').limit(1);
    if (!usersTestError) {
      console.log('✅ Users table accessible');
    } else {
      console.log('❌ Users table not accessible:', usersTestError.message);
    }

    const { data: cardsTest, error: cardsTestError } = await supabase.from('cards').select('id').limit(1);
    if (!cardsTestError) {
      console.log('✅ Cards table accessible');
    } else {
      console.log('❌ Cards table not accessible:', cardsTestError.message);
    }

    const { data: sessionsTest, error: sessionsTestError } = await supabase.from('sessions').select('id').limit(1);
    if (!sessionsTestError) {
      console.log('✅ Sessions table accessible');
    } else {
      console.log('❌ Sessions table not accessible:', sessionsTestError.message);
    }

    console.log('\n🎉 Database setup completed!');
    return true;

  } catch (error) {
    console.error('❌ Setup failed:', error);
    return false;
  }
}

setupTables().then(success => {
  console.log(success ? '\n✨ Setup successful!' : '\n💥 Setup failed!');
  process.exit(success ? 0 : 1);
});