const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');
const {
  mapCardToDatabase,
  mapCardFromDatabase,
  mapCardsFromDatabase,
  prepareCardUpdate,
  generateSlug,
  generatePublishedUrl
} = require('./utils/cardMappers');
require('dotenv').config({ path: '.env.development' });

const app = express();
const PORT = process.env.PORT || 5002;

// Initialize Supabase
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

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Disable cache in development
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'development',
    database: 'supabase-connected'
  });
});

// Mock auth - simplified
app.post('/api/auth/register', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: 'mock_hash',
        first_name: firstName,
        last_name: lastName
      })
      .select()
      .single();

    if (error) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name
      },
      token: 'mock-jwt-token'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      token: 'mock-jwt-token'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cards endpoints - REAL DATA with full schema support
app.get('/api/cards', async (req, res) => {
  try {
    // Get current user from auth (simplified for demo)
    const userId = '23f71da9-1bac-4811-9456-50d5b7742567'; // Demo user ID

    const { data: cards, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // Use the shared mapper for consistent transformation
    const mappedCards = mapCardsFromDatabase(cards);

    res.json(mappedCards);
  } catch (error) {
    console.error('Cards fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

app.post('/api/cards', async (req, res) => {
  try {
    console.log('Creating card with data:', req.body);

    // Use shared mapper for consistent data transformation
    const userId = req.body.userId || '23f71da9-1bac-4811-9456-50d5b7742567'; // Demo user
    const cardData = mapCardToDatabase(req.body, userId);

    // Generate slug and published URL if creating a published card
    if (cardData.is_published && !cardData.custom_slug) {
      const slug = generateSlug(cardData.first_name, cardData.last_name);
      cardData.custom_slug = slug;
      cardData.published_url = generatePublishedUrl(slug, null, process.env.FRONTEND_URL);
      cardData.published_at = new Date().toISOString();
    }

    const { data: newCard, error } = await supabase
      .from('cards')
      .insert(cardData)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // Use shared mapper for response
    const responseCard = mapCardFromDatabase(newCard);
    res.status(201).json(responseCard);
  } catch (error) {
    console.error('Card creation error:', error);
    res.status(500).json({ error: 'Failed to create card', details: error.message });
  }
});

app.put('/api/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Use shared mapper for update data preparation
    const updateData = prepareCardUpdate(req.body);

    // Handle publishing logic
    if (req.body.isPublished && !updateData.published_at) {
      updateData.published_at = new Date().toISOString();

      // Generate slug and URL if not already set
      if (!updateData.custom_slug && req.body.firstName && req.body.lastName) {
        const slug = generateSlug(req.body.firstName, req.body.lastName);
        updateData.custom_slug = slug;
        updateData.published_url = generatePublishedUrl(slug, id, process.env.FRONTEND_URL);
      }
    }

    const { data: updatedCard, error } = await supabase
      .from('cards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    if (!updatedCard) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Use shared mapper for response
    const responseCard = mapCardFromDatabase(updatedCard);
    res.json(responseCard);
  } catch (error) {
    console.error('Card update error:', error);
    res.status(500).json({ error: 'Failed to update card', details: error.message });
  }
});

app.get('/api/cards/:id/public', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: card, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (error || !card) {
      return res.status(404).json({ error: 'Card not found or not published' });
    }

    // Increment view count
    await supabase
      .from('cards')
      .update({ views_count: (card.views_count || 0) + 1 })
      .eq('id', id);

    // Track analytics
    await supabase
      .from('analytics_events')
      .insert({
        card_id: id,
        event_type: 'view',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        referrer: req.headers['referer']
      });

    res.json(card);
  } catch (error) {
    console.error('Public card fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analytics endpoints - REAL DATA
app.get('/api/analytics/dashboard/overview', async (req, res) => {
  try {
    const { data: cards } = await supabase
      .from('cards')
      .select('id, views_count');

    const totalCards = cards?.length || 0;
    const totalViews = cards?.reduce((sum, c) => sum + (c.views_count || 0), 0) || 0;

    // Get today's events
    const today = new Date().toISOString().split('T')[0];
    const { data: todayEvents } = await supabase
      .from('analytics_events')
      .select('event_type')
      .gte('created_at', `${today}T00:00:00Z`);

    const todayViews = todayEvents?.filter(e => e.event_type === 'view').length || 0;
    const todayContacts = todayEvents?.filter(e => e.event_type === 'contact_save').length || 0;

    res.json({
      overview: {
        totalCards,
        totalViews,
        todayViews,
        todayContacts,
        conversionRate: totalViews > 0 ? ((todayContacts / totalViews) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/analytics/individual/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;

    const { data: events } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('card_id', cardId)
      .order('created_at', { ascending: false });

    // Process events into daily stats
    const dailyStats = {};
    events?.forEach(event => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { date, views: 0, contacts: 0, social: 0 };
      }
      if (event.event_type === 'view') dailyStats[date].views++;
      if (event.event_type === 'contact_save') dailyStats[date].contacts++;
      if (event.event_type === 'social_click') dailyStats[date].social++;
    });

    res.json({
      cardId,
      dailyStats: Object.values(dailyStats),
      totalViews: events?.filter(e => e.event_type === 'view').length || 0,
      totalContacts: events?.filter(e => e.event_type === 'contact_save').length || 0
    });
  } catch (error) {
    console.error('Individual analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Track analytics event
app.post('/api/analytics/track', async (req, res) => {
  try {
    const { cardId, eventType, metadata } = req.body;

    await supabase
      .from('analytics_events')
      .insert({
        card_id: cardId,
        event_type: eventType,
        metadata: metadata || {},
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        referrer: req.headers['referer']
      });

    res.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Weekly performance endpoint - REAL DATA
app.get('/api/analytics/weekly-performance', async (req, res) => {
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

      return {
        name: day.dayName,
        performance: performanceScore,
        events: total,
        views,
        contacts,
        social,
        fullDate: day.fullDate,
        isToday: day.isToday,
        tooltip: `${day.dayName} ${day.date}/${day.month}: ${total} eventos`
      };
    });

    // Calculate weekly totals
    const weeklyTotals = {
      totalViews: weeklyPerformance.reduce((sum, day) => sum + day.views, 0),
      totalContacts: weeklyPerformance.reduce((sum, day) => sum + day.contacts, 0),
      totalSocial: weeklyPerformance.reduce((sum, day) => sum + day.social, 0),
      totalEvents: weeklyPerformance.reduce((sum, day) => sum + day.events, 0),
      avgPerformance: Math.round(weeklyPerformance.reduce((sum, day) => sum + day.performance, 0) / 7)
    };

    // Find peak day
    const peakDay = weeklyPerformance.reduce((peak, day) =>
      day.events > peak.events ? day : peak
    );

    res.json({
      period: 'Current Week',
      startDate: weekDays[0].fullDate,
      endDate: weekDays[6].fullDate,
      weeklyTotals,
      peakDay: {
        name: peakDay.name,
        events: peakDay.events,
        performance: peakDay.performance
      },
      chartData: weeklyPerformance,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Weekly performance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete existing card
app.delete('/api/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = '23f71da9-1bac-4811-9456-50d5b7742567'; // Demo user ID

    if (!id) {
      return res.status(400).json({ error: 'Card ID is required' });
    }

    console.log(`Attempting to delete card ${id} for user ${userId}`);

    // Verify card belongs to user before deleting
    const { data: existingCard, error: fetchError } = await supabase
      .from('cards')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingCard) {
      console.error('Card not found or access denied:', fetchError);
      return res.status(404).json({ error: 'Card not found or access denied' });
    }

    console.log(`Found card ${id}, proceeding with deletion`);

    // Delete the card
    const { error: deleteError } = await supabase
      .from('cards')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting card:', deleteError);
      return res.status(500).json({ error: 'Failed to delete card' });
    }

    console.log(`Card ${id} deleted successfully`);
    return res.json({ message: 'Card deleted successfully', id });
  } catch (error) {
    console.error('Delete card error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 INDI Backend Server - REAL DATABASE MODE
=========================================
✅ Server: http://localhost:${PORT}
✅ Health: http://localhost:${PORT}/api/health
✅ Database: Supabase Connected
✅ Mode: Development with REAL data
=========================================
  `);
});