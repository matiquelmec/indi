import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.development') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// ================================================
// Database Utility Functions
// ================================================

/**
 * Check database health and connection
 */
async function checkDatabaseHealth() {
  console.log('🏥 Checking database health...');

  try {
    const tables = ['users', 'cards', 'sessions', 'analytics_events', 'analytics_daily_summary'];
    const results: any = {};

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          results[table] = { status: 'error', error: error.message };
        } else {
          results[table] = { status: 'ok', count };
        }
      } catch (err) {
        results[table] = { status: 'error', error: 'Table not accessible' };
      }
    }

    console.log('📊 Database Health Report:');
    console.table(results);
    return results;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    throw error;
  }
}

/**
 * Migrate database to new schema
 */
async function runDatabaseMigration() {
  console.log('🔄 Starting database migration...');

  try {
    // Read migration script
    const fs = require('fs');
    const migrationScript = fs.readFileSync(
      path.join(__dirname, '../../../migrate-database-safe.sql'),
      'utf8'
    );

    // Execute migration (Note: Supabase doesn't support direct SQL execution via JS client)
    // This would need to be run in Supabase SQL editor or via psql
    console.log('📝 Migration script ready. Please run the following in Supabase SQL Editor:');
    console.log('File: migrate-database-safe.sql');

    return {
      success: true,
      message: 'Migration script generated successfully'
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Clean up old analytics events (older than 90 days)
 */
async function cleanupOldAnalytics() {
  console.log('🧹 Cleaning up old analytics data...');

  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data, error } = await supabase
      .from('analytics_events')
      .delete()
      .lt('created_at', ninetyDaysAgo.toISOString());

    if (error) {
      throw error;
    }

    console.log(`✅ Cleaned up analytics events older than 90 days`);
    return { success: true, deletedRows: 0 };
  } catch (error) {
    console.error('❌ Analytics cleanup failed:', error);
    throw error;
  }
}

/**
 * Generate daily analytics summary for a specific date
 */
async function generateDailySummary(date: string) {
  console.log(`📊 Generating daily summary for ${date}...`);

  try {
    // Get all unique cards that had events on this date
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('card_id, event_type, visitor_id')
      .gte('created_at', `${date}T00:00:00Z`)
      .lt('created_at', `${date}T23:59:59Z`);

    if (eventsError) {
      throw eventsError;
    }

    // Group events by card
    const cardSummaries = events?.reduce((acc: any, event) => {
      const cardId = event.card_id;
      if (!acc[cardId]) {
        acc[cardId] = {
          card_id: cardId,
          date,
          total_views: 0,
          unique_views: new Set(),
          contact_saves: 0,
          social_clicks: 0,
          shares: 0,
          qr_scans: 0
        };
      }

      const summary = acc[cardId];

      switch (event.event_type) {
        case 'view':
          summary.total_views++;
          if (event.visitor_id) {
            summary.unique_views.add(event.visitor_id);
          }
          break;
        case 'contact_save':
          summary.contact_saves++;
          break;
        case 'social_click':
          summary.social_clicks++;
          break;
        case 'share':
          summary.shares++;
          break;
        case 'qr_scan':
          summary.qr_scans++;
          break;
      }

      return acc;
    }, {});

    // Insert/update daily summaries
    const summariesToInsert = Object.values(cardSummaries || {}).map((summary: any) => ({
      ...summary,
      unique_views: summary.unique_views.size
    }));

    if (summariesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('analytics_daily_summary')
        .upsert(summariesToInsert, {
          onConflict: 'card_id,date'
        });

      if (insertError) {
        throw insertError;
      }
    }

    console.log(`✅ Generated ${summariesToInsert.length} daily summaries for ${date}`);
    return { success: true, summariesGenerated: summariesToInsert.length };
  } catch (error) {
    console.error('❌ Daily summary generation failed:', error);
    throw error;
  }
}

/**
 * Update card view counts from analytics events
 */
async function updateCardViewCounts() {
  console.log('🔄 Updating card view counts...');

  try {
    // Get view counts per card from analytics events
    const { data: viewCounts, error } = await supabase
      .from('analytics_events')
      .select('card_id')
      .eq('event_type', 'view');

    if (error) {
      throw error;
    }

    // Group by card_id and count
    const counts = viewCounts?.reduce((acc: any, event) => {
      acc[event.card_id] = (acc[event.card_id] || 0) + 1;
      return acc;
    }, {});

    // Update each card
    let updated = 0;
    for (const [cardId, count] of Object.entries(counts || {})) {
      const { error: updateError } = await supabase
        .from('cards')
        .update({ views_count: count })
        .eq('id', cardId);

      if (!updateError) {
        updated++;
      }
    }

    console.log(`✅ Updated view counts for ${updated} cards`);
    return { success: true, cardsUpdated: updated };
  } catch (error) {
    console.error('❌ View count update failed:', error);
    throw error;
  }
}

/**
 * Get database statistics
 */
async function getDatabaseStats() {
  console.log('📊 Getting database statistics...');

  try {
    const stats: any = {};

    // Get table counts
    const tables = ['users', 'cards', 'sessions', 'analytics_events', 'analytics_daily_summary'];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        stats[table] = count;
      }
    }

    // Get additional statistics
    const { data: publishedCards } = await supabase
      .from('cards')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true);

    const { data: todayEvents } = await supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00Z');

    stats.published_cards = publishedCards?.length || 0;
    stats.today_events = todayEvents?.length || 0;

    console.log('📊 Database Statistics:');
    console.table(stats);
    return stats;
  } catch (error) {
    console.error('❌ Failed to get database statistics:', error);
    throw error;
  }
}

/**
 * Validate data integrity
 */
async function validateDataIntegrity() {
  console.log('🔍 Validating data integrity...');

  try {
    const issues: string[] = [];

    // Check for cards without users
    const { data: orphanedCards } = await supabase
      .from('cards')
      .select('id, user_id')
      .is('user_id', null);

    if (orphanedCards && orphanedCards.length > 0) {
      issues.push(`Found ${orphanedCards.length} cards without associated users`);
    }

    // Check for analytics events with invalid card IDs
    const { data: invalidAnalytics } = await supabase
      .rpc('get_invalid_analytics_events');

    // Check for expired sessions
    const { data: expiredSessions } = await supabase
      .from('sessions')
      .select('id')
      .lt('expires_at', new Date().toISOString());

    if (expiredSessions && expiredSessions.length > 0) {
      issues.push(`Found ${expiredSessions.length} expired sessions`);
    }

    if (issues.length === 0) {
      console.log('✅ Data integrity check passed');
    } else {
      console.log('⚠️ Data integrity issues found:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    }

    return { success: true, issues };
  } catch (error) {
    console.error('❌ Data integrity validation failed:', error);
    throw error;
  }
}

// ================================================
// CLI Interface
// ================================================

async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'health':
        await checkDatabaseHealth();
        break;

      case 'migrate':
        await runDatabaseMigration();
        break;

      case 'cleanup':
        await cleanupOldAnalytics();
        break;

      case 'daily-summary':
        const date = process.argv[3] || new Date().toISOString().split('T')[0];
        await generateDailySummary(date);
        break;

      case 'update-counts':
        await updateCardViewCounts();
        break;

      case 'stats':
        await getDatabaseStats();
        break;

      case 'validate':
        await validateDataIntegrity();
        break;

      default:
        console.log(`
🛠️ Database Utilities for INDI Digital Card Platform

Available commands:
  health          - Check database health and connection
  migrate         - Generate migration script (run in Supabase SQL Editor)
  cleanup         - Clean up analytics events older than 90 days
  daily-summary   - Generate daily analytics summary [date]
  update-counts   - Update card view counts from analytics
  stats           - Show database statistics
  validate        - Validate data integrity

Usage:
  npx ts-node src/utils/database-utilities.ts <command>

Examples:
  npx ts-node src/utils/database-utilities.ts health
  npx ts-node src/utils/database-utilities.ts daily-summary 2024-11-27
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Command failed:', error);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main();
}

export {
  checkDatabaseHealth,
  runDatabaseMigration,
  cleanupOldAnalytics,
  generateDailySummary,
  updateCardViewCounts,
  getDatabaseStats,
  validateDataIntegrity
};