const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function generateWeeklyPerformance() {
  console.log('📊 GENERATING REAL WEEKLY PERFORMANCE DATA');
  console.log('='.repeat(50));

  try {
    // Get all analytics events from the last 7 days
    const { data: analyticsEvents } = await supabase
      .from('analytics_events')
      .select('*')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    // Get current week dates (starting from Monday)
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

    // Generate week days (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
    const weekDays = [];
    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDays.push({
        dayName: dayNames[i],
        fullDate: date.toISOString().split('T')[0],
        date: date.getDate(),
        month: date.getMonth() + 1,
        isToday: date.toDateString() === today.toDateString()
      });
    }

    console.log('\n📅 CURRENT WEEK ANALYSIS:');
    console.log('Week starting:', monday.toISOString().split('T')[0]);

    // Process events by day
    const weeklyPerformance = weekDays.map(day => {
      const dayEvents = analyticsEvents.filter(event => {
        const eventDate = new Date(event.created_at).toISOString().split('T')[0];
        return eventDate === day.fullDate;
      });

      const views = dayEvents.filter(e => e.event_type === 'view').length;
      const contacts = dayEvents.filter(e => e.event_type === 'contact_save').length;
      const social = dayEvents.filter(e => e.event_type === 'social_click').length;
      const total = views + contacts + social;

      // Calculate performance score (0-100 based on activity)
      const maxExpected = 25; // Expected max events per day
      const performanceScore = Math.min(100, Math.round((total / maxExpected) * 100));

      console.log(`${day.dayName} (${day.date}/${day.month}): ${total} eventos | Performance: ${performanceScore}%${day.isToday ? ' ← HOY' : ''}`);

      return {
        day: day.dayName,
        fullDate: day.fullDate,
        date: day.date,
        month: day.month,
        views,
        contacts,
        social,
        total,
        performanceScore,
        isToday: day.isToday
      };
    });

    // Calculate weekly totals
    const weeklyTotals = {
      totalViews: weeklyPerformance.reduce((sum, day) => sum + day.views, 0),
      totalContacts: weeklyPerformance.reduce((sum, day) => sum + day.contacts, 0),
      totalSocial: weeklyPerformance.reduce((sum, day) => sum + day.social, 0),
      totalEvents: weeklyPerformance.reduce((sum, day) => sum + day.total, 0),
      avgPerformance: Math.round(weeklyPerformance.reduce((sum, day) => sum + day.performanceScore, 0) / 7)
    };

    // Find peak day
    const peakDay = weeklyPerformance.reduce((peak, day) =>
      day.total > peak.total ? day : peak
    );

    console.log('\n📊 WEEKLY SUMMARY:');
    console.log(`Total Events: ${weeklyTotals.totalEvents}`);
    console.log(`Total Views: ${weeklyTotals.totalViews}`);
    console.log(`Total Contacts: ${weeklyTotals.totalContacts}`);
    console.log(`Total Social: ${weeklyTotals.totalSocial}`);
    console.log(`Average Performance: ${weeklyTotals.avgPerformance}%`);
    console.log(`Peak Day: ${peakDay.day} with ${peakDay.total} events`);

    // Generate chart data format
    const chartData = weeklyPerformance.map(day => ({
      name: day.day,
      performance: day.performanceScore,
      events: day.total,
      views: day.views,
      contacts: day.contacts,
      tooltip: `${day.day} ${day.date}/${day.month}: ${day.total} eventos`
    }));

    console.log('\n📈 CHART DATA GENERATED:');
    console.log('Format for frontend charts:');
    console.log(JSON.stringify(chartData, null, 2));

    // Generate summary for performance report
    const performanceReport = {
      period: 'Current Week',
      startDate: weekDays[0].fullDate,
      endDate: weekDays[6].fullDate,
      weeklyTotals,
      peakDay: {
        name: peakDay.day,
        date: `${peakDay.date}/${peakDay.month}`,
        events: peakDay.total,
        performance: peakDay.performanceScore
      },
      dailyBreakdown: weeklyPerformance,
      chartData,
      lastUpdated: new Date().toISOString()
    };

    console.log('\n✅ REAL PERFORMANCE SUMMARY GENERATED');
    console.log('Data based on actual database analytics_events');
    console.log(`Period: ${performanceReport.startDate} to ${performanceReport.endDate}`);

    // Save to file for frontend consumption
    require('fs').writeFileSync(
      './weekly_performance_real.json',
      JSON.stringify(performanceReport, null, 2)
    );

    console.log('\n💾 Data saved to: weekly_performance_real.json');

    return performanceReport;

  } catch (error) {
    console.error('❌ Error generating weekly performance:', error.message);
    throw error;
  }
}

generateWeeklyPerformance();