const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Checking database schema...\n');

    // Check existing tables
    console.log('=== EXISTING TABLES ===');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
    } else {
      console.log('Current tables:', tables.map(t => t.table_name));
    }

    // Check specific table structures
    const requiredTables = ['users', 'cards', 'analytics_events', 'analytics_daily_summary', 'sessions'];

    for (const tableName of requiredTables) {
      console.log(`\n=== ${tableName.toUpperCase()} TABLE ===`);

      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');

      if (columnsError) {
        console.error(`Error checking ${tableName}:`, columnsError);
      } else if (columns.length === 0) {
        console.log(`❌ Table "${tableName}" does NOT exist`);
      } else {
        console.log(`✅ Table "${tableName}" exists with columns:`);
        columns.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
      }
    }

    // Check current data
    console.log('\n=== CURRENT DATA ===');

    // Check users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, created_at')
      .limit(5);

    console.log('Users count:', users ? users.length : 0);
    if (usersError) console.log('Users error:', usersError.message);

    // Check cards
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('id, first_name, last_name, title, is_published, views_count, created_at')
      .limit(5);

    console.log('Cards count:', cards ? cards.length : 0);
    if (cards && cards.length > 0) {
      console.log('Sample card:', cards[0]);
    }
    if (cardsError) console.log('Cards error:', cardsError.message);

    // Check analytics events
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('id, card_id, event_type, created_at')
      .limit(5);

    console.log('Analytics events count:', events ? events.length : 0);
    if (events && events.length > 0) {
      console.log('Sample event:', events[0]);
    }
    if (eventsError) console.log('Analytics events error:', eventsError.message);

  } catch (error) {
    console.error('General error:', error);
  }
}

checkDatabaseSchema();