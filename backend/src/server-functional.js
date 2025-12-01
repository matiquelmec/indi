const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');
const { createUniqueSlug } = require('../api/urlUtils');
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
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure UTF-8 encoding
app.use((req, res, next) => {
  req.setEncoding('utf8');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

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

// Cards endpoints - REAL DATA
app.get('/api/cards', async (req, res) => {
  try {
    const { data: cards, error } = await supabase
      .from('cards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Map database snake_case to frontend camelCase
    const mappedCards = (cards || []).map(card => ({
      id: card.id,
      userId: card.user_id,
      firstName: card.first_name,
      lastName: card.last_name,
      title: card.title,
      company: card.company,
      phone: card.phone,
      email: card.email,
      website: card.website,
      bio: card.bio,
      avatarUrl: card.avatar_url,
      coverUrl: card.cover_url,
      socialLinks: card.social_links,
      contactFields: card.contact_fields,
      themeConfig: card.theme_config,
      isPublished: card.is_published,
      viewsCount: card.views_count,
      createdAt: card.created_at,
      updatedAt: card.updated_at
    }));

    res.json(mappedCards);
  } catch (error) {
    console.error('Cards fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

app.post('/api/cards', async (req, res) => {
  try {
    console.log('🆕 BACKEND POST /api/cards');
    console.log('🆕 RECEIVED PAYLOAD:', JSON.stringify(req.body, null, 2));

    // Generate unique slug for URL if names are provided
    let customSlug = req.body.customSlug;
    let publishedUrl = req.body.publishedUrl;

    if (req.body.firstName && req.body.lastName && !customSlug) {
      // Get existing slugs to ensure uniqueness
      const { data: existingCards, error: slugError } = await supabase
        .from('cards')
        .select('custom_slug')
        .not('custom_slug', 'is', null);

      if (slugError) {
        console.error('Error fetching existing slugs:', slugError);
      } else {
        const existingSlugs = existingCards?.map(card => card.custom_slug).filter(Boolean) || [];
        customSlug = createUniqueSlug(req.body.firstName, req.body.lastName, existingSlugs);

        if (customSlug) {
          publishedUrl = `https://frontindi.vercel.app/card/${customSlug}`;
          console.log(`🔗 Generated unique slug: ${customSlug} -> ${publishedUrl}`);
        }
      }
    }

    // Map frontend camelCase to database snake_case
    const cardData = {
      user_id: req.body.userId || null,
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      title: req.body.title,
      company: req.body.company,
      phone: req.body.phone,
      email: req.body.email,
      website: req.body.website,
      bio: req.body.bio,
      avatar_url: req.body.avatarUrl,
      cover_url: req.body.coverUrl,
      social_links: req.body.socialLinks,
      contact_fields: req.body.contactFields,
      theme_config: req.body.themeConfig,
      is_published: req.body.isPublished || false,
      published_url: publishedUrl,
      custom_slug: customSlug,
      views_count: 0
    };

    const { data: newCard, error } = await supabase
      .from('cards')
      .insert(cardData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Map database snake_case back to frontend camelCase
    const responseCard = {
      id: newCard.id,
      userId: newCard.user_id,
      firstName: newCard.first_name,
      lastName: newCard.last_name,
      title: newCard.title,
      company: newCard.company,
      phone: newCard.phone,
      email: newCard.email,
      website: newCard.website,
      bio: newCard.bio,
      avatarUrl: newCard.avatar_url,
      coverUrl: newCard.cover_url,
      socialLinks: newCard.social_links,
      contactFields: newCard.contact_fields,
      themeConfig: newCard.theme_config,
      isPublished: newCard.is_published,
      publishedUrl: newCard.published_url,
      customSlug: newCard.custom_slug,
      viewsCount: newCard.views_count,
      createdAt: newCard.created_at,
      updatedAt: newCard.updated_at
    };

    res.status(201).json(responseCard);
  } catch (error) {
    console.error('Card creation error:', error);
    res.status(500).json({ error: 'Failed to create card' });
  }
});

app.put('/api/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('✏️ BACKEND PUT /api/cards/' + id);
    console.log('✏️ RECEIVED PAYLOAD:', JSON.stringify(req.body, null, 2));

    // Check if names are being changed to regenerate URLs if needed
    let customSlug = req.body.customSlug;
    let publishedUrl = req.body.publishedUrl;

    // If firstName or lastName are being changed and no custom slug is provided, regenerate URLs
    if (req.body.firstName && req.body.lastName && !req.body.customSlug) {
      // Get existing card data first
      const { data: existingCard } = await supabase
        .from('cards')
        .select('first_name, last_name, custom_slug')
        .eq('id', id)
        .single();

      // Check if names have actually changed
      const namesChanged = existingCard && (
        existingCard.first_name !== req.body.firstName ||
        existingCard.last_name !== req.body.lastName
      );

      if (namesChanged) {
        // Get existing slugs to ensure uniqueness (excluding current card)
        const { data: existingCards, error: slugError } = await supabase
          .from('cards')
          .select('custom_slug')
          .not('custom_slug', 'is', null)
          .neq('id', id); // Exclude current card

        if (slugError) {
          console.error('Error fetching existing slugs:', slugError);
        } else {
          const existingSlugs = existingCards?.map(card => card.custom_slug).filter(Boolean) || [];
          customSlug = createUniqueSlug(req.body.firstName, req.body.lastName, existingSlugs);

          if (customSlug) {
            publishedUrl = `https://frontindi.vercel.app/card/${customSlug}`;
            console.log(`🔄 Regenerated unique slug due to name change: ${customSlug} -> ${publishedUrl}`);
          }
        }
      }
    }

    // Map frontend camelCase to database snake_case
    const cardData = {
      user_id: req.body.userId || null,
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      title: req.body.title,
      company: req.body.company,
      phone: req.body.phone,
      email: req.body.email,
      website: req.body.website,
      bio: req.body.bio,
      avatar_url: req.body.avatarUrl,
      cover_url: req.body.coverUrl,
      social_links: req.body.socialLinks,
      contact_fields: req.body.contactFields,
      theme_config: req.body.themeConfig,
      is_published: req.body.isPublished,
      published_url: publishedUrl,
      custom_slug: customSlug,
      views_count: req.body.viewsCount || 0
    };

    const { data: updatedCard, error } = await supabase
      .from('cards')
      .update(cardData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!updatedCard) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Map database snake_case back to frontend camelCase
    const responseCard = {
      id: updatedCard.id,
      userId: updatedCard.user_id,
      firstName: updatedCard.first_name,
      lastName: updatedCard.last_name,
      title: updatedCard.title,
      company: updatedCard.company,
      phone: updatedCard.phone,
      email: updatedCard.email,
      website: updatedCard.website,
      bio: updatedCard.bio,
      avatarUrl: updatedCard.avatar_url,
      coverUrl: updatedCard.cover_url,
      socialLinks: updatedCard.social_links,
      contactFields: updatedCard.contact_fields,
      themeConfig: updatedCard.theme_config,
      isPublished: updatedCard.is_published,
      publishedUrl: updatedCard.published_url,
      customSlug: updatedCard.custom_slug,
      viewsCount: updatedCard.views_count,
      createdAt: updatedCard.created_at,
      updatedAt: updatedCard.updated_at
    };

    res.json(responseCard);
  } catch (error) {
    console.error('Card update error:', error);
    res.status(500).json({ error: 'Failed to update card' });
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

// Get chart data for dashboard
app.get('/api/analytics/dashboard/chart', async (req, res) => {
  try {
    // Get last 7 days of data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: events } = await supabase
      .from('analytics_events')
      .select('created_at, event_type')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    // Process events into daily stats
    const dailyStats = {};
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // Initialize last 7 days with zero values
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      dailyStats[dayName] = { date: dayName, views: 0, clicks: 0, contacts: 0 };
    }

    // Process actual events
    events?.forEach(event => {
      const eventDate = new Date(event.created_at);
      const dayName = days[eventDate.getDay()];

      if (dailyStats[dayName]) {
        if (event.event_type === 'view') dailyStats[dayName].views++;
        if (event.event_type === 'social_click') dailyStats[dayName].clicks++;
        if (event.event_type === 'contact_save') dailyStats[dayName].contacts++;
      }
    });

    res.json({
      chartData: Object.values(dailyStats)
    });
  } catch (error) {
    console.error('Chart data error:', error);
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