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

    // Check specific table structures
    const requiredTables = ['users', 'cards', 'analytics_events', 'analytics_daily_summary', 'sessions'];

    for (const tableName of requiredTables) {
      console.log(`=== ${tableName.toUpperCase()} TABLE ===`);

      // Simple check by trying to query the table
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Table "${tableName}" - Error:`, error.message);
        } else {
          console.log(`✅ Table "${tableName}" exists and is accessible`);
          if (data && data.length > 0) {
            console.log(`  Sample structure:`, Object.keys(data[0]));
          }
        }
      } catch (err) {
        console.log(`❌ Table "${tableName}" - Exception:`, err.message);
      }
    }

    // Check current data
    console.log('\n=== CURRENT DATA COUNTS ===');

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
      console.log('Sample card:', {
        id: cards[0].id,
        name: `${cards[0].first_name} ${cards[0].last_name}`,
        title: cards[0].title,
        published: cards[0].is_published
      });
    }
    if (cardsError) console.log('Cards error:', cardsError.message);

    // Check analytics events
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('id, card_id, event_type, created_at')
      .limit(5);

    console.log('Analytics events count:', events ? events.length : 0);
    if (events && events.length > 0) {
      console.log('Sample event:', {
        id: events[0].id,
        event_type: events[0].event_type,
        card_id: events[0].card_id
      });
    }
    if (eventsError) console.log('Analytics events error:', eventsError.message);

    // Check analytics daily summary
    const { data: summary, error: summaryError } = await supabase
      .from('analytics_daily_summary')
      .select('*')
      .limit(5);

    console.log('Analytics daily summary count:', summary ? summary.length : 0);
    if (summaryError) console.log('Analytics daily summary error:', summaryError.message);

    // Check sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .limit(5);

    console.log('Sessions count:', sessions ? sessions.length : 0);
    if (sessionsError) console.log('Sessions error:', sessionsError.message);

  } catch (error) {
    console.error('General error:', error);
  }
}

checkDatabaseSchema();