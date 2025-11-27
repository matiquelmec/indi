const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.development' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function auditDatabase() {
  console.log('DATABASE AUDIT REPORT - INDI PLATFORM');
  console.log('='.repeat(50));

  try {
    // 1. Verificar tablas existentes
    console.log('\n1. EXISTING TABLES:');
    const { data: cards } = await supabase.from('cards').select('*').limit(1);
    const { data: users } = await supabase.from('users').select('*').limit(1);
    const { data: analytics } = await supabase.from('analytics_events').select('*').limit(1);

    console.log('  - cards: ' + (cards ? 'EXISTS' : 'MISSING'));
    console.log('  - users: ' + (users ? 'EXISTS' : 'MISSING'));
    console.log('  - analytics_events: ' + (analytics ? 'EXISTS' : 'MISSING'));

    // 2. Analizar estructura de cards (tabla principal)
    console.log('\n2. CARDS TABLE ANALYSIS:');
    const { data: allCards, error: cardsError } = await supabase
      .from('cards')
      .select('*');

    if (cardsError) {
      console.log('  ERROR:', cardsError.message);
      return;
    }

    console.log('  Total records:', allCards.length);

    // Verificar distribución por usuario
    const userDistribution = {};
    allCards.forEach(card => {
      const userId = card.user_id || 'NULL';
      userDistribution[userId] = (userDistribution[userId] || 0) + 1;
    });

    console.log('  User distribution:');
    Object.entries(userDistribution).forEach(([userId, count]) => {
      console.log(`    ${userId.substring(0, 8)}...: ${count} cards`);
    });

    // 3. Verificar campos críticos
    console.log('\n3. FIELD ANALYSIS:');
    const sampleCard = allCards[0];
    const criticalFields = [
      'id', 'user_id', 'first_name', 'last_name', 'email', 'phone',
      'location', 'website', 'bio', 'avatar_url', 'theme_id',
      'theme_config', 'social_links', 'is_published', 'published_url',
      'custom_slug', 'views_count', 'contacts_saved', 'shares_count',
      'is_active', 'plan_type', 'features', 'created_at', 'updated_at'
    ];

    criticalFields.forEach(field => {
      const exists = sampleCard.hasOwnProperty(field);
      const hasData = exists && sampleCard[field] !== null;
      console.log(`    ${field}: ${exists ? 'EXISTS' : 'MISSING'} ${hasData ? '(has data)' : '(null/empty)'}`);
    });

    // 4. Verificar integridad de datos
    console.log('\n4. DATA INTEGRITY:');
    const nullUserIds = allCards.filter(c => !c.user_id).length;
    const publishedCards = allCards.filter(c => c.is_published).length;
    const cardsWithSlugs = allCards.filter(c => c.custom_slug).length;
    const cardsWithViews = allCards.filter(c => c.views_count > 0).length;

    console.log(`  Cards without user_id: ${nullUserIds}`);
    console.log(`  Published cards: ${publishedCards}`);
    console.log(`  Cards with custom slugs: ${cardsWithSlugs}`);
    console.log(`  Cards with views: ${cardsWithViews}`);

    // 5. Analizar analytics reales
    console.log('\n5. ANALYTICS DATA:');
    const { data: analyticsData } = await supabase
      .from('analytics_events')
      .select('*');

    if (analyticsData) {
      console.log(`  Total analytics events: ${analyticsData.length}`);

      const eventTypes = {};
      analyticsData.forEach(event => {
        eventTypes[event.event_type] = (eventTypes[event.event_type] || 0) + 1;
      });

      console.log('  Event types distribution:');
      Object.entries(eventTypes).forEach(([type, count]) => {
        console.log(`    ${type}: ${count} events`);
      });
    } else {
      console.log('  No analytics data found');
    }

    // 6. Performance check - verificar índices críticos
    console.log('\n6. PERFORMANCE ANALYSIS:');

    // Test query performance
    const start = Date.now();
    const { data: testQuery } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', '23f71da9-1bac-4811-9456-50d5b7742567');
    const queryTime = Date.now() - start;

    console.log(`  Query by user_id time: ${queryTime}ms`);
    console.log(`  Results returned: ${testQuery ? testQuery.length : 0}`);

    console.log('\n7. RECOMMENDATIONS:');
    if (nullUserIds > 0) {
      console.log('  ⚠️  FIX: Some cards have null user_id - security risk');
    }
    if (queryTime > 100) {
      console.log('  ⚠️  OPTIMIZE: Add index on user_id for better performance');
    }
    if (publishedCards > 0 && cardsWithSlugs === 0) {
      console.log('  ⚠️  ENHANCE: Published cards should have custom slugs');
    }
    if (!analyticsData || analyticsData.length === 0) {
      console.log('  ⚠️  MISSING: No analytics data - tracking not working');
    }

    console.log('\nAUDIT COMPLETED');

  } catch (error) {
    console.error('AUDIT ERROR:', error.message);
  }
}

auditDatabase();