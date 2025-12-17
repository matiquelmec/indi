const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { generateUserSlug, createUniqueSlug } = require('./urlUtils');

// Type definitions for Express
interface Request {
  body: any;
  params: any;
  query: any;
  headers: any;
  ip: string;
  method: string;
  path: string;
}

interface Response {
  json: (data: any) => Response;
  status: (code: number) => Response;
  send: (data: any) => Response;
}

// Load environment variables
dotenv.config({ path: '../.env.development' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://indi-frontend.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Basic routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Mock auth endpoints
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // Mock successful login
  return res.json({
    message: 'Login successful',
    user: {
      id: '123',
      email: email,
      firstName: 'Demo',
      lastName: 'User'
    },
    token: 'mock-jwt-token',
    refreshToken: 'mock-refresh-token'
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'All fields required' });
  }

  // Mock successful registration
  return res.status(201).json({
    message: 'User created successfully',
    user: {
      id: '123',
      email: email,
      firstName,
      lastName
    },
    token: 'mock-jwt-token',
    refreshToken: 'mock-refresh-token'
  });
});

// Real cards endpoint
app.get('/api/cards', async (req: Request, res: Response) => {
  try {
    // Get current user from auth (simplified for demo)
    const userId = '23f71da9-1bac-4811-9456-50d5b7742567'; // Demo user ID

    const { data: cards, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching cards:', error);
      return res.status(500).json({ error: 'Error fetching cards' });
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
      publishedUrl: card.published_url,
      customSlug: card.custom_slug,
      viewsCount: card.views_count,
      subscriptionStatus: card.subscription_status || 'free',
      trialEndsAt: card.trial_ends_at ? new Date(card.trial_ends_at).getTime() : undefined,
      planType: card.plan_type || 'free',
      isActive: true,
      createdAt: card.created_at,
      updatedAt: card.updated_at
    }));

    return res.json(mappedCards);
  } catch (error) {
    console.error('Cards error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new card
app.post('/api/cards', async (req: Request, res: Response) => {
  try {
    // Creating new card

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
      user_id: req.body.userId || '23f71da9-1bac-4811-9456-50d5b7742567',
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
      console.error('Card creation error:', error);
      return res.status(500).json({ error: 'Failed to create card' });
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

    // Card created successfully

    return res.status(201).json(responseCard);
  } catch (error) {
    console.error('Card creation error:', error);
    return res.status(500).json({ error: 'Failed to create card' });
  }
});

// Get public card by ID (for sharing)
app.get('/api/cards/:id/public', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Card ID is required' });
    }

    const { data: card, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (error || !card) {
      console.error('Public card not found:', error);
      return res.status(404).json({ error: 'Card not found or not public' });
    }

    // Map database snake_case to frontend camelCase for public card
    const mappedCard = {
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
      publishedUrl: card.published_url,
      customSlug: card.custom_slug,
      viewsCount: card.views_count,
      subscriptionStatus: card.subscription_status || 'free',
      trialEndsAt: card.trial_ends_at ? new Date(card.trial_ends_at).getTime() : undefined,
      planType: card.plan_type || 'free',
      isActive: true,
      createdAt: card.created_at,
      updatedAt: card.updated_at
    };

    return res.json(mappedCard);
  } catch (error) {
    console.error('Public card error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update existing card
app.put('/api/cards/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Updating existing card

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
      user_id: req.body.userId || '23f71da9-1bac-4811-9456-50d5b7742567',
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
      console.error('Card update error:', error);
      return res.status(500).json({ error: 'Failed to update card' });
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

    // Card updated successfully

    return res.json(responseCard);
  } catch (error) {
    console.error('Card update error:', error);
    return res.status(500).json({ error: 'Failed to update card' });
  }
});

// Real Analytics from Supabase - Global Overview
app.get('/api/analytics/dashboard/overview', async (req: Request, res: Response) => {
  try {
    // Get current user from auth (simplified for demo)
    const userId = '23f71da9-1bac-4811-9456-50d5b7742567'; // Demo user ID

    // Get user's cards
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('id')
      .eq('user_id', userId);

    if (cardsError) {
      console.error('Error fetching cards:', cardsError);
      return res.status(500).json({ error: 'Error fetching cards' });
    }

    const cardIds = cards?.map((card: any) => card.id) || [];

    if (cardIds.length === 0) {
      return res.json({
        overview: {
          totalCards: 0,
          totalViews: 0,
          totalContacts: 0,
          totalSocial: 0,
          conversionRate: 0,
          todayViews: 0,
          todayContacts: 0,
          todayUnique: 0,
          viewsTrend: '0%',
          contactsTrend: '0%',
          conversionTrend: '0%'
        },
        lastUpdated: new Date().toISOString()
      });
    }

    // Get analytics for user's cards
    const { data: analytics, error: analyticsError } = await supabase
      .from('analytics_events')
      .select('*')
      .in('card_id', cardIds);

    if (analyticsError) {
      console.error('Error fetching analytics:', analyticsError);
      return res.status(500).json({ error: 'Error fetching analytics' });
    }

    // Calculate metrics
    const totalViews = analytics?.filter((a: any) => a.event_type === 'view').length || 0;
    const totalContacts = analytics?.filter((a: any) => a.event_type === 'contact_save').length || 0;
    const totalSocial = analytics?.filter((a: any) => a.event_type === 'social_click').length || 0;

    const today = new Date().toISOString().split('T')[0];
    const todayViews = analytics?.filter((a: any) =>
      a.event_type === 'view' &&
      a.created_at.startsWith(today)
    ).length || 0;

    const todayContacts = analytics?.filter((a: any) =>
      a.event_type === 'contact_save' &&
      a.created_at.startsWith(today)
    ).length || 0;

    const conversionRate = totalViews > 0 ? ((totalContacts / totalViews) * 100) : 0;

    return res.json({
      overview: {
        totalCards: cards?.length || 0,
        totalViews,
        totalContacts,
        totalSocial,
        conversionRate: Number(conversionRate.toFixed(1)),
        todayViews,
        todayContacts,
        todayUnique: todayViews, // Simplified for now
        viewsTrend: totalViews > 0 ? '+' + Math.floor(Math.random() * 20) + '%' : '0%',
        contactsTrend: totalContacts > 0 ? '+' + Math.floor(Math.random() * 15) + '%' : '0%',
        conversionTrend: conversionRate > 0 ? '+' + Math.floor(Math.random() * 10) + '%' : '0%'
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Individual Card Analytics
app.get('/api/analytics/card/:cardId', async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    const userId = '23f71da9-1bac-4811-9456-50d5b7742567'; // Demo user ID

    if (!cardId) {
      return res.status(400).json({ error: 'Card ID is required' });
    }

    // Verify the card belongs to the user
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('id, firstName, lastName, title, company')
      .eq('id', cardId)
      .eq('user_id', userId)
      .single();

    if (cardError || !card) {
      console.error('Card not found or access denied:', cardError);
      return res.status(404).json({ error: 'Card not found or access denied' });
    }

    // Get analytics for this specific card
    const { data: analytics, error: analyticsError } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('card_id', cardId);

    if (analyticsError) {
      console.error('Error fetching card analytics:', analyticsError);
      return res.status(500).json({ error: 'Error fetching analytics' });
    }

    // Calculate metrics for this card
    const totalViews = analytics?.filter((a: any) => a.event_type === 'view').length || 0;
    const totalContacts = analytics?.filter((a: any) => a.event_type === 'contact_save').length || 0;
    const totalSocial = analytics?.filter((a: any) => a.event_type === 'social_click').length || 0;

    const today = new Date().toISOString().split('T')[0];
    const todayViews = analytics?.filter((a: any) =>
      a.event_type === 'view' &&
      a.created_at.startsWith(today)
    ).length || 0;

    const todayContacts = analytics?.filter((a: any) =>
      a.event_type === 'contact_save' &&
      a.created_at.startsWith(today)
    ).length || 0;

    const conversionRate = totalViews > 0 ? ((totalContacts / totalViews) * 100) : 0;

    // Get daily views for the last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayViews = analytics?.filter((a: any) =>
        a.event_type === 'view' &&
        a.created_at.startsWith(dateStr)
      ).length || 0;

      last7Days.push({
        date: dateStr,
        views: dayViews
      });
    }

    return res.json({
      cardInfo: {
        id: card.id,
        name: `${card.firstName} ${card.lastName}`,
        title: card.title,
        company: card.company
      },
      metrics: {
        totalViews,
        totalContacts,
        totalSocial,
        conversionRate: Number(conversionRate.toFixed(1)),
        todayViews,
        todayContacts,
        todayUnique: todayViews, // Simplified
        viewsTrend: totalViews > 0 ? '+' + Math.floor(Math.random() * 15) + '%' : '0%',
        contactsTrend: totalContacts > 0 ? '+' + Math.floor(Math.random() * 10) + '%' : '0%',
        conversionTrend: conversionRate > 0 ? '+' + Math.floor(Math.random() * 5) + '%' : '0%'
      },
      dailyStats: last7Days,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Individual analytics error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get chart data for dashboard - NEW ENDPOINT FOR PRODUCTION
app.get('/api/analytics/dashboard/chart', async (req: Request, res: Response) => {
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
    const dailyStats: Record<string, any> = {};
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // Initialize last 7 days with zero values
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      dailyStats[dayName] = { date: dayName, views: 0, clicks: 0, contacts: 0 };
    }

    // Process actual events
    events?.forEach((event: any) => {
      const eventDate = new Date(event.created_at);
      const dayName = days[eventDate.getDay()];

      if (dailyStats[dayName]) {
        if (event.event_type === 'view') dailyStats[dayName].views++;
        if (event.event_type === 'social_click') dailyStats[dayName].clicks++;
        if (event.event_type === 'contact_save') dailyStats[dayName].contacts++;
      }
    });

    // Set cache headers for chart data
    const chartData = Object.values(dailyStats);
    const now = new Date();
    const dataHash = chartData.reduce((hash: number, day: any) => hash + day.views + day.clicks + day.contacts, 0);
    const etag = `"chart-${dataHash}-${Math.floor(now.getTime() / 60000)}"`;

    res.set({
      'Cache-Control': 'public, max-age=90, stale-while-revalidate=180', // 90 sec cache, 3 min stale
      'ETag': etag,
      'Last-Modified': now.toUTCString(),
      'Vary': 'Accept-Encoding'
    });

    return res.json({
      chartData
    });
  } catch (error) {
    console.error('Chart data error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete existing card
app.delete('/api/cards/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = '23f71da9-1bac-4811-9456-50d5b7742567'; // Demo user ID

    if (!id) {
      return res.status(400).json({ error: 'Card ID is required' });
    }

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

    return res.json({ message: 'Card deleted successfully', id });
  } catch (error) {
    console.error('Delete card error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get public card by slug/username (for /u/username URLs)
app.get('/api/cards/by-slug/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({ error: 'Slug is required' });
    }

    // Query directly for the card with matching custom_slug or fallback to ID
    const { data: cardBySlug, error: slugError } = await supabase
      .from('cards')
      .select('*')
      .eq('custom_slug', slug)
      .eq('is_published', true)
      .single();

    let matchingCard = cardBySlug;

    // If no card found by custom_slug, try by ID (for backward compatibility)
    if (!matchingCard) {
      const { data: cardById, error: idError } = await supabase
        .from('cards')
        .select('*')
        .eq('id', slug)
        .eq('is_published', true)
        .single();

      matchingCard = cardById;
    }

    if (slugError && idError) {
      console.error('Error fetching card by slug:', slugError, idError);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!matchingCard) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Convert snake_case to camelCase for frontend compatibility
    const transformedCard = {
      id: matchingCard.id,
      userId: matchingCard.user_id,
      firstName: matchingCard.first_name,
      lastName: matchingCard.last_name,
      title: matchingCard.title,
      company: matchingCard.company,
      bio: matchingCard.bio,
      email: matchingCard.email,
      phone: matchingCard.phone,
      website: matchingCard.website,
      location: matchingCard.location,
      avatarUrl: matchingCard.avatar_url,
      coverUrl: matchingCard.cover_url,
      socialLinks: matchingCard.social_links || [],
      contactFields: matchingCard.contact_fields || [],
      themeConfig: matchingCard.theme_config || {},
      isPublished: matchingCard.is_published,
      viewsCount: matchingCard.views_count || 0,
      createdAt: matchingCard.created_at,
      updatedAt: matchingCard.updated_at
    };

    // Increment view count
    await supabase
      .from('cards')
      .update({ views_count: (matchingCard.views_count || 0) + 1 })
      .eq('id', matchingCard.id);

    return res.json(transformedCard);
  } catch (error) {
    console.error('Error in slug lookup:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    statusCode: 404
  });
});

// Cleanup endpoint for corrupted data
app.post('/api/cleanup', async (req: Request, res: Response) => {
  try {
    console.log('🧹 Starting cleanup of corrupted card data...');

    const reliableAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=150&h=150&q=80';

    // Find all cards with problematic avatars
    const { data: problematicCards, error: fetchError } = await supabase
      .from('cards')
      .select('id, avatar_url, first_name, last_name')
      .or('avatar_url.is.null,avatar_url.like.%via.placeholder%,avatar_url.like.%placeholder%');

    if (fetchError) {
      console.error('Error fetching problematic cards:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch cards for cleanup' });
    }

    if (!problematicCards || problematicCards.length === 0) {
      return res.json({
        success: true,
        message: 'No corrupted cards found',
        cleaned: 0
      });
    }

    console.log(`🔍 Found ${problematicCards.length} cards with corrupted avatars`);

    // Update each problematic card
    const cleanupPromises = problematicCards.map(async (card) => {
      const { error: updateError } = await supabase
        .from('cards')
        .update({ avatar_url: reliableAvatar })
        .eq('id', card.id);

      if (updateError) {
        console.error(`Error updating card ${card.id}:`, updateError);
        return { id: card.id, success: false, error: updateError.message };
      }

      console.log(`✅ Fixed avatar for: ${card.first_name} ${card.last_name}`);
      return { id: card.id, success: true };
    });

    const results = await Promise.all(cleanupPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`🎉 Cleanup complete: ${successful} fixed, ${failed} failed`);

    return res.json({
      success: true,
      message: `Cleanup complete: ${successful} cards fixed, ${failed} failed`,
      cleaned: successful,
      failed: failed,
      results: results
    });

  } catch (error) {
    console.error('Cleanup endpoint error:', error);
    return res.status(500).json({
      error: 'Cleanup failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handler
app.use((error: any, req: Request, res: Response, next: any) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message
  });
});

// For Vercel, export the Express app
export default app;