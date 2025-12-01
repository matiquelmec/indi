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

async function createAnalyticsData() {
  try {
    console.log('🚀 Creating demo analytics data...');

    // Get all existing cards
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('id, first_name, last_name');

    if (cardsError) {
      console.error('Error fetching cards:', cardsError);
      return;
    }

    if (!cards || cards.length === 0) {
      console.log('No cards found. Please create some cards first.');
      return;
    }

    console.log(`Found ${cards.length} cards. Creating analytics events...`);

    // Generate events for last 7 days
    const events = [];
    const eventTypes = ['view', 'contact_save', 'social_click', 'share'];

    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);

      cards.forEach(card => {
        // Generate random events for each card each day
        const dailyViews = Math.floor(Math.random() * 20) + 5; // 5-25 views per day
        const dailyContacts = Math.floor(Math.random() * 5) + 1; // 1-5 contacts
        const dailySocial = Math.floor(Math.random() * 8) + 2; // 2-10 social clicks
        const dailyShares = Math.floor(Math.random() * 3); // 0-2 shares

        // Create view events
        for (let i = 0; i < dailyViews; i++) {
          const eventTime = new Date(date);
          eventTime.setHours(Math.floor(Math.random() * 24));
          eventTime.setMinutes(Math.floor(Math.random() * 60));

          events.push({
            card_id: card.id,
            event_type: 'view',
            visitor_id: `visitor_${Math.floor(Math.random() * 1000)}`,
            device_type: Math.random() > 0.6 ? 'mobile' : 'desktop',
            browser: ['Chrome', 'Safari', 'Firefox'][Math.floor(Math.random() * 3)],
            country: ['Chile', 'Argentina', 'Colombia', 'Peru'][Math.floor(Math.random() * 4)],
            created_at: eventTime.toISOString(),
            metadata: { source: 'demo_data' }
          });
        }

        // Create contact save events
        for (let i = 0; i < dailyContacts; i++) {
          const eventTime = new Date(date);
          eventTime.setHours(Math.floor(Math.random() * 24));
          eventTime.setMinutes(Math.floor(Math.random() * 60));

          events.push({
            card_id: card.id,
            event_type: 'contact_save',
            visitor_id: `visitor_${Math.floor(Math.random() * 1000)}`,
            device_type: Math.random() > 0.6 ? 'mobile' : 'desktop',
            created_at: eventTime.toISOString(),
            metadata: { platform: 'vcard', source: 'demo_data' }
          });
        }

        // Create social click events
        for (let i = 0; i < dailySocial; i++) {
          const eventTime = new Date(date);
          eventTime.setHours(Math.floor(Math.random() * 24));
          eventTime.setMinutes(Math.floor(Math.random() * 60));

          const platforms = ['linkedin', 'whatsapp', 'instagram', 'website'];
          const platform = platforms[Math.floor(Math.random() * platforms.length)];

          events.push({
            card_id: card.id,
            event_type: 'social_click',
            visitor_id: `visitor_${Math.floor(Math.random() * 1000)}`,
            device_type: Math.random() > 0.6 ? 'mobile' : 'desktop',
            created_at: eventTime.toISOString(),
            metadata: { platform, source: 'demo_data' }
          });
        }

        // Create share events
        for (let i = 0; i < dailyShares; i++) {
          const eventTime = new Date(date);
          eventTime.setHours(Math.floor(Math.random() * 24));
          eventTime.setMinutes(Math.floor(Math.random() * 60));

          events.push({
            card_id: card.id,
            event_type: 'share',
            visitor_id: `visitor_${Math.floor(Math.random() * 1000)}`,
            device_type: Math.random() > 0.6 ? 'mobile' : 'desktop',
            created_at: eventTime.toISOString(),
            metadata: { method: Math.random() > 0.5 ? 'native-share' : 'copy-link', source: 'demo_data' }
          });
        }
      });
    }

    console.log(`Generated ${events.length} analytics events`);

    // Insert events in batches of 100
    const batchSize = 100;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);

      const { error: insertError } = await supabase
        .from('analytics_events')
        .insert(batch);

      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
        continue;
      }

      console.log(`✅ Inserted batch ${i / batchSize + 1}/${Math.ceil(events.length / batchSize)}`);
    }

    // Update views_count in cards table to match analytics
    for (const card of cards) {
      const cardEvents = events.filter(e => e.card_id === card.id && e.event_type === 'view');

      const { error: updateError } = await supabase
        .from('cards')
        .update({ views_count: cardEvents.length })
        .eq('id', card.id);

      if (updateError) {
        console.error(`Error updating views count for card ${card.id}:`, updateError);
      }
    }

    console.log('🎉 Demo analytics data created successfully!');
    console.log('📊 You can now see real data in the analytics dashboard');

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

// Run the script
createAnalyticsData().then(() => {
  console.log('Script completed');
  process.exit(0);
});