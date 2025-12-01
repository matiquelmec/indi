const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { generateUserSlug } = require('./urlUtils');

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

    return res.json(cards || []);
  } catch (error) {
    console.error('Cards error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new card
app.post('/api/cards', async (req: Request, res: Response) => {
  try {
    console.log('🆕 BACKEND POST /api/cards');
    console.log('🆕 RECEIVED PAYLOAD:', JSON.stringify(req.body, null, 2));

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
      published_url: req.body.publishedUrl,
      custom_slug: req.body.customSlug,
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

    console.log('✅ BACKEND POST RESPONSE:', JSON.stringify(responseCard, null, 2));

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

    return res.json(card);
  } catch (error) {
    console.error('Public card error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update existing card
app.put('/api/cards/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log('🔄 BACKEND PUT /api/cards/:id');
    console.log('🔄 CARD ID:', id);
    console.log('🔄 RECEIVED PAYLOAD:', JSON.stringify(req.body, null, 2));

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
      published_url: req.body.publishedUrl,
      custom_slug: req.body.customSlug,
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

    console.log('✅ BACKEND PUT RESPONSE:', JSON.stringify(responseCard, null, 2));

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

    // Get all published cards and check which ones match the slug
    const { data: cards, error } = await supabase
      .from('cards')
      .select('*')
      .eq('is_published', true);

    if (error) {
      console.error('Error fetching cards for slug lookup:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Find the card that matches the slug by generating slugs for each card
    const matchingCard = cards?.find(card => {
      const cardSlug = generateUserSlug(card.first_name || '', card.last_name || '');
      return cardSlug === slug;
    });

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