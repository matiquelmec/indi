const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

/**
 * Database Service - Real vs Demo Mode Handler
 * This service manages both real Supabase data and demo/mock data
 */
class DatabaseService {
  constructor() {
    // Load environment variables first
    require('dotenv').config({ path: '.env.development' });

    this.mode = process.env.APP_MODE || 'demo'; // 'demo' or 'production'
    this.supabase = null;
    this.mockData = null;
    this.init();
  }

  /**
   * Initialize database service
   */
  init() {
    console.log(`🔧 Initializing Database Service in ${this.mode.toUpperCase()} mode`);

    if (this.mode === 'production' || this.mode === 'demo') {
      this.initSupabase();
    }

    this.loadMockData();
  }

  /**
   * Initialize Supabase client
   */
  initSupabase() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    console.log('🔍 Debug - Supabase URL:', supabaseUrl ? 'SET' : 'MISSING');
    console.log('🔍 Debug - Supabase Key:', supabaseKey ? 'SET' : 'MISSING');

    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️  Missing Supabase credentials, falling back to mock data');
      this.mode = 'mock';
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
  }

  /**
   * Load mock data for fallback
   */
  loadMockData() {
    try {
      const mockPath = path.join(__dirname, '../../mock-analytics.json');
      if (fs.existsSync(mockPath)) {
        const data = fs.readFileSync(mockPath, 'utf8');
        this.mockData = JSON.parse(data);
        console.log('✅ Mock data loaded');
      }
    } catch (error) {
      console.warn('⚠️  Could not load mock data:', error.message);
    }
  }

  /**
   * Get analytics overview for dashboard
   */
  async getAnalyticsOverview(cardId = null) {
    console.log(`📊 Getting analytics overview (mode: ${this.mode})`);

    // In demo or production mode with Supabase connected, try real data first
    if ((this.mode === 'demo' || this.mode === 'production') && this.supabase) {
      return await this.getRealAnalyticsOverview(cardId);
    } else {
      return this.getMockAnalyticsOverview();
    }
  }

  /**
   * Get real analytics from Supabase
   */
  async getRealAnalyticsOverview(cardId) {
    try {
      // Get card info
      const { data: cardData, error: cardError } = await this.supabase
        .from('cards')
        .select('*')
        .eq('id', cardId || 'c3140e8f-999a-41ef-b755-1dc4519afb9e')
        .single();

      if (cardError) {
        console.warn('⚠️  Card not found in database, using demo data');
        return this.getMockAnalyticsOverview();
      }

      // Get analytics events for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: events, error: eventsError } = await this.supabase
        .from('analytics_events')
        .select('*')
        .eq('card_id', cardData.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (eventsError) {
        throw eventsError;
      }

      // Calculate metrics
      const today = new Date().toDateString();
      const todayEvents = events.filter(e => new Date(e.created_at).toDateString() === today);

      const metrics = {
        totalViews: events.filter(e => e.event_type === 'view').length,
        totalContacts: events.filter(e => e.event_type === 'contact_save').length,
        totalSocial: events.filter(e => e.event_type === 'social_click').length,
        todayViews: todayEvents.filter(e => e.event_type === 'view').length,
        todayContacts: todayEvents.filter(e => e.event_type === 'contact_save').length,
        uniqueVisitors: new Set(events.map(e => e.visitor_id)).size
      };

      metrics.conversionRate = metrics.totalViews > 0
        ? ((metrics.totalContacts / metrics.totalViews) * 100).toFixed(1)
        : 0;

      console.log('✅ Real analytics retrieved:', metrics);

      return {
        overview: {
          totalCards: 1,
          totalViews: metrics.totalViews,
          totalContacts: metrics.totalContacts,
          totalSocial: metrics.totalSocial,
          conversionRate: parseFloat(metrics.conversionRate),
          todayViews: metrics.todayViews,
          todayContacts: metrics.todayContacts,
          todayUnique: metrics.uniqueVisitors,
          viewsTrend: '+12.5%', // TODO: Calculate real trend
          contactsTrend: '+8.3%', // TODO: Calculate real trend
          conversionTrend: '+2.1%' // TODO: Calculate real trend
        },
        lastUpdated: new Date().toISOString(),
        dataSource: 'real'
      };

    } catch (error) {
      console.error('❌ Error getting real analytics:', error.message);
      console.log('📋 Falling back to mock data');
      return this.getMockAnalyticsOverview();
    }
  }

  /**
   * Get mock analytics data
   */
  getMockAnalyticsOverview() {
    if (!this.mockData) {
      return {
        overview: {
          totalCards: 1,
          totalViews: 0,
          todayViews: 0,
          conversionRate: 0
        },
        dataSource: 'empty'
      };
    }

    console.log('📋 Using mock analytics data');

    return {
      overview: {
        totalCards: 1,
        totalViews: this.mockData.monthlyTotals.totalViews,
        totalContacts: this.mockData.monthlyTotals.totalContacts,
        totalSocial: this.mockData.monthlyTotals.totalSocial,
        conversionRate: this.mockData.monthlyTotals.conversionRate,
        todayViews: this.mockData.todayMetrics.views,
        todayContacts: this.mockData.todayMetrics.contactSaves,
        todayUnique: this.mockData.todayMetrics.uniqueVisitors,
        viewsTrend: '+12.5%',
        contactsTrend: '+8.3%',
        conversionTrend: '+2.1%'
      },
      lastUpdated: new Date().toISOString(),
      dataSource: 'mock'
    };
  }

  /**
   * Get real-time analytics data
   */
  async getRealtimeAnalytics(cardId) {
    console.log(`⚡ Getting realtime analytics (mode: ${this.mode})`);

    // In demo or production mode with Supabase connected, try real data first
    if ((this.mode === 'demo' || this.mode === 'production') && this.supabase) {
      return await this.getRealRealtimeAnalytics(cardId);
    } else {
      return this.getMockRealtimeAnalytics(cardId);
    }
  }

  /**
   * Get real realtime analytics
   */
  async getRealRealtimeAnalytics(cardId) {
    try {
      // Get active sessions (last 30 minutes)
      const thirtyMinutesAgo = new Date();
      thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

      const { data: activeSessions, error } = await this.supabase
        .from('analytics_sessions')
        .select('*')
        .eq('card_id', cardId)
        .eq('is_active', true)
        .gte('last_seen_at', thirtyMinutesAgo.toISOString());

      if (error) {
        throw error;
      }

      // Get recent events (last 10)
      const { data: recentEvents } = await this.supabase
        .from('analytics_events')
        .select('*')
        .eq('card_id', cardId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get today's metrics
      const today = new Date().toDateString();
      const { data: todayEvents } = await this.supabase
        .from('analytics_events')
        .select('*')
        .eq('card_id', cardId)
        .gte('created_at', new Date(today).toISOString());

      const todayMetrics = {
        views: todayEvents?.filter(e => e.event_type === 'view').length || 0,
        contactSaves: todayEvents?.filter(e => e.event_type === 'contact_save').length || 0,
        socialClicks: todayEvents?.filter(e => e.event_type === 'social_click').length || 0,
        uniqueVisitors: new Set(todayEvents?.map(e => e.visitor_id) || []).size
      };

      return {
        timestamp: new Date().toISOString(),
        activeVisitors: activeSessions?.length || 0,
        viewsLastHour: activeSessions?.length || 0, // Simplified
        recentEvents: recentEvents || [],
        todayMetrics: todayMetrics,
        activeCountries: this.getActiveCountries(activeSessions),
        dataSource: 'real'
      };

    } catch (error) {
      console.error('❌ Error getting real realtime analytics:', error.message);
      return this.getMockRealtimeAnalytics(cardId);
    }
  }

  /**
   * Get mock realtime analytics
   */
  getMockRealtimeAnalytics(cardId) {
    if (!this.mockData) {
      return {
        timestamp: new Date().toISOString(),
        activeVisitors: 0,
        viewsLastHour: 0,
        recentEvents: [],
        todayMetrics: { views: 0, contactSaves: 0, socialClicks: 0, uniqueVisitors: 0 },
        activeCountries: [],
        dataSource: 'empty'
      };
    }

    console.log('📋 Using mock realtime data');

    const now = new Date();
    const currentHour = now.getHours();
    const baseActivity = this.mockData.hourlyActivity.find(h =>
      h.hour === `${currentHour.toString().padStart(2, '0')}:00`
    )?.activity || 5;
    const currentViews = Math.max(0, baseActivity + Math.floor(Math.random() * 6) - 3);

    return {
      timestamp: now.toISOString(),
      activeVisitors: Math.floor(Math.random() * 8) + 1,
      viewsLastHour: currentViews,
      recentEvents: this.mockData.recentEvents.slice(0, 10),
      todayMetrics: {
        ...this.mockData.todayMetrics,
        views: this.mockData.todayMetrics.views + Math.floor(Math.random() * 3)
      },
      activeCountries: [
        { country: 'Chile', activeUsers: Math.floor(Math.random() * 5) + 1 },
        { country: 'Argentina', activeUsers: Math.floor(Math.random() * 3) },
        { country: 'Peru', activeUsers: Math.floor(Math.random() * 2) }
      ].filter(c => c.activeUsers > 0),
      dataSource: 'mock'
    };
  }

  /**
   * Track an analytics event (production mode)
   */
  async trackEvent(eventData) {
    if (this.mode !== 'production' || !this.supabase) {
      console.log('📋 Event tracking disabled in demo mode:', eventData.event_type);
      return { success: true, mode: 'demo' };
    }

    try {
      const { data, error } = await this.supabase
        .from('analytics_events')
        .insert([{
          card_id: eventData.cardId,
          event_type: eventData.eventType,
          visitor_id: eventData.visitorId,
          session_id: eventData.sessionId,
          device_type: eventData.deviceType,
          browser: eventData.browser,
          os: eventData.os,
          country: eventData.country,
          city: eventData.city,
          referrer: eventData.referrer,
          utm_source: eventData.utmSource,
          utm_medium: eventData.utmMedium,
          utm_campaign: eventData.utmCampaign,
          ip_address: eventData.ipAddress,
          user_agent: eventData.userAgent,
          metadata: eventData.metadata || {}
        }]);

      if (error) {
        throw error;
      }

      console.log('✅ Event tracked successfully:', eventData.eventType);
      return { success: true, mode: 'production' };

    } catch (error) {
      console.error('❌ Error tracking event:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper: Get active countries from sessions
   */
  getActiveCountries(sessions) {
    if (!sessions || sessions.length === 0) return [];

    const countries = {};
    sessions.forEach(session => {
      if (session.country) {
        countries[session.country] = (countries[session.country] || 0) + 1;
      }
    });

    return Object.entries(countries).map(([country, activeUsers]) => ({
      country,
      activeUsers
    }));
  }

  /**
   * Get current mode
   */
  getMode() {
    return this.mode;
  }

  /**
   * Switch mode (for testing)
   */
  setMode(newMode) {
    this.mode = newMode;
    console.log(`🔄 Database mode switched to: ${newMode}`);
  }
}

// Singleton instance
const databaseService = new DatabaseService();

module.exports = databaseService;