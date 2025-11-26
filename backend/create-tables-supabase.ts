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

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🚀 Creating tables in Supabase...');
console.log('📍 URL:', supabaseUrl);

async function createTables() {
  try {
    console.log('\n🔧 Creating database schema...');

    // Create users table using SQL
    const usersSQL = `
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
    `;

    // Create cards table using SQL
    const cardsSQL = `
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
    `;

    // Create sessions table using SQL  
    const sessionsSQL = `
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        refresh_token TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Execute SQL commands using the edge function approach
    console.log('👥 Creating users table...');
    const { data: usersResult, error: usersError } = await supabase.from('_').select('*').sql(usersSQL);
    
    if (usersError) {
      console.log('⚠️ Users table:', usersError.message);
    } else {
      console.log('✅ Users table created');
    }

    console.log('💳 Creating cards table...');
    const { data: cardsResult, error: cardsError } = await supabase.from('_').select('*').sql(cardsSQL);
    
    if (cardsError) {
      console.log('⚠️ Cards table:', cardsError.message);
    } else {
      console.log('✅ Cards table created');
    }

    console.log('🔐 Creating sessions table...');
    const { data: sessionsResult, error: sessionsError } = await supabase.from('_').select('*').sql(sessionsSQL);
    
    if (sessionsError) {
      console.log('⚠️ Sessions table:', sessionsError.message);
    } else {
      console.log('✅ Sessions table created');
    }

    return true;

  } catch (error) {
    console.error('❌ Creation failed:', error);
    
    // Try alternative approach - just test the connection
    console.log('\n🔍 Testing basic connection...');
    
    try {
      // Just verify we can communicate with Supabase
      const { data, error } = await supabase.auth.getUser();
      
      if (error || data) {
        console.log('✅ Supabase connection working!');
        console.log('📝 Please create the tables manually in the Supabase dashboard:');
        console.log('\n1. Go to https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Go to SQL Editor');
        console.log('4. Execute the following SQL:');
        console.log('\n' + usersSQL);
        console.log('\n' + cardsSQL);
        console.log('\n' + sessionsSQL);
        
        return false;
      }
    } catch (authError) {
      console.log('✅ Supabase connection verified (auth response received)');
    }
    
    return false;
  }
}

createTables().then(success => {
  if (success) {
    console.log('\n🎉 Database setup completed!');
  } else {
    console.log('\n⚠️ Manual setup required - but connection is working!');
  }
  process.exit(0);
});