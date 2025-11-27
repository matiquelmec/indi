const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

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
    const userId = 'a626f7d9-9582-43be-a569-afc3aadac3db'; // Demo user ID

    const { data: cards, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching cards:', error);
      return res.status(500).json({ error: 'Error fetching cards' });
    }

    res.json(cards || []);
  } catch (error) {
    console.error('Cards error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Real Analytics from Supabase - Global Overview
app.get('/api/analytics/dashboard/overview', async (req: Request, res: Response) => {
  try {
    // Get current user from auth (simplified for demo)
    const userId = 'a626f7d9-9582-43be-a569-afc3aadac3db'; // Demo user ID

    // Get user's cards
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('id')
      .eq('user_id', userId);

    if (cardsError) {
      console.error('Error fetching cards:', cardsError);
      return res.status(500).json({ error: 'Error fetching cards' });
    }

    const cardIds = cards?.map(card => card.id) || [];

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
    const totalViews = analytics?.filter(a => a.event_type === 'view').length || 0;
    const totalContacts = analytics?.filter(a => a.event_type === 'contact_save').length || 0;
    const totalSocial = analytics?.filter(a => a.event_type === 'social_click').length || 0;

    const today = new Date().toISOString().split('T')[0];
    const todayViews = analytics?.filter(a =>
      a.event_type === 'view' &&
      a.created_at.startsWith(today)
    ).length || 0;

    const todayContacts = analytics?.filter(a =>
      a.event_type === 'contact_save' &&
      a.created_at.startsWith(today)
    ).length || 0;

    const conversionRate = totalViews > 0 ? ((totalContacts / totalViews) * 100) : 0;

    res.json({
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
    const userId = 'a626f7d9-9582-43be-a569-afc3aadac3db'; // Demo user ID

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
    const totalViews = analytics?.filter(a => a.event_type === 'view').length || 0;
    const totalContacts = analytics?.filter(a => a.event_type === 'contact_save').length || 0;
    const totalSocial = analytics?.filter(a => a.event_type === 'social_click').length || 0;

    const today = new Date().toISOString().split('T')[0];
    const todayViews = analytics?.filter(a =>
      a.event_type === 'view' &&
      a.created_at.startsWith(today)
    ).length || 0;

    const todayContacts = analytics?.filter(a =>
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

      const dayViews = analytics?.filter(a =>
        a.event_type === 'view' &&
        a.created_at.startsWith(dateStr)
      ).length || 0;

      last7Days.push({
        date: dateStr,
        views: dayViews
      });
    }

    res.json({
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