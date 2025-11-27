import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.development' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Basic routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mock auth endpoints
app.post('/api/auth/login', (req, res) => {
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

app.post('/api/auth/register', (req, res) => {
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

// Mock cards endpoints
app.get('/api/cards', (req, res) => {
  res.json([
    {
      id: 'c3140e8f-999a-41ef-b755-1dc4519afb9e',
      firstName: 'Elena',
      lastName: 'Castillo',
      title: 'Dra. Elena Castillo - Psicóloga Clínica',
      company: 'Mente & Equilibrio',
      isPublished: true,
      viewsCount: 247,
      createdAt: new Date().toISOString()
    }
  ]);
});

// Enhanced Analytics Endpoints
const fs = require('fs');
const path = require('path');

// Helper function to load mock analytics
function loadMockAnalytics() {
  try {
    const analyticsPath = path.join(__dirname, '../../mock-analytics.json');
    if (fs.existsSync(analyticsPath)) {
      const data = fs.readFileSync(analyticsPath, 'utf8');
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Error loading mock analytics:', error);
    return null;
  }
}

// Dashboard overview
app.get('/api/analytics/dashboard/overview', (req, res): any => {
  const mockData = loadMockAnalytics();
  
  if (!mockData) {
    return res.json({
      overview: {
        totalCards: 1,
        totalViews: 0,
        todayViews: 0,
        conversionRate: 0
      }
    });
  }

  res.json({
    overview: {
      totalCards: 1,
      totalViews: mockData.monthlyTotals.totalViews,
      totalContacts: mockData.monthlyTotals.totalContacts,
      totalSocial: mockData.monthlyTotals.totalSocial,
      conversionRate: mockData.monthlyTotals.conversionRate,
      todayViews: mockData.todayMetrics.views,
      todayContacts: mockData.todayMetrics.contactSaves,
      todayUnique: mockData.todayMetrics.uniqueVisitors,
      viewsTrend: '+12.5%',
      contactsTrend: '+8.3%',
      conversionTrend: '+2.1%'
    },
    lastUpdated: new Date().toISOString()
  });
});

// Detailed card analytics - Real Supabase Data
app.get('/api/analytics/cards/:cardId/detailed', async (req, res): Promise<any> => {
  try {
    const { cardId } = req.params;
    const userId = 'a626f7d9-9582-43be-a569-afc3aadac3db'; // Demo user ID

    if (!cardId) {
      return res.status(400).json({ error: 'Card ID is required' });
    }

    // Verify the card belongs to the user
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', userId)
      .single();

    if (cardError || !card) {
      console.error('Card not found or access denied:', cardError);
      return res.status(404).json({ error: 'Card analytics not found' });
    }

    // Get analytics for this specific card
    const { data: analytics, error: analyticsError } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('card_id', cardId)
      .order('created_at', { ascending: false });

    if (analyticsError) {
      console.error('Error fetching card analytics:', analyticsError);
      return res.status(500).json({ error: 'Error fetching analytics' });
    }

    // Calculate real metrics
    const totalViews = analytics?.filter(a => a.event_type === 'view').length || 0;
    const totalContacts = analytics?.filter(a => a.event_type === 'contact_save').length || 0;
    const totalSocial = analytics?.filter(a => a.event_type === 'social_click').length || 0;
    const conversionRate = totalViews > 0 ? ((totalContacts / totalViews) * 100) : 0;

    // Get daily data for the last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayViews = analytics?.filter(a =>
        a.event_type === 'view' && a.created_at.startsWith(dateStr)
      ).length || 0;

      const dayContacts = analytics?.filter(a =>
        a.event_type === 'contact_save' && a.created_at.startsWith(dateStr)
      ).length || 0;

      last7Days.push({
        date: dateStr,
        views: dayViews,
        uniqueVisitors: dayViews, // Simplified
        contactSaves: dayContacts
      });
    }

    // Mock audience data (simplified for now)
    const mockAudienceData = {
      trafficSources: [
        { source: "Direct", percentage: 45, visits: Math.floor(totalViews * 0.45) },
        { source: "Social Media", percentage: 30, visits: Math.floor(totalViews * 0.30) },
        { source: "QR Code", percentage: 25, visits: Math.floor(totalViews * 0.25) }
      ],
      deviceBreakdown: [
        { device: "Mobile", percentage: 70 },
        { device: "Desktop", percentage: 25 },
        { device: "Tablet", percentage: 5 }
      ],
      topLocations: [
        { location: "Chile", visits: Math.floor(totalViews * 0.80) },
        { location: "Argentina", visits: Math.floor(totalViews * 0.15) },
        { location: "Peru", visits: Math.floor(totalViews * 0.05) }
      ],
      socialPerformance: [
        { platform: "LinkedIn", clicks: Math.floor(totalSocial * 0.40) },
        { platform: "Instagram", clicks: Math.floor(totalSocial * 0.35) },
        { platform: "WhatsApp", clicks: Math.floor(totalSocial * 0.25) }
      ]
    };

    res.json({
      cardId,
      cardTitle: card.title || card.first_name || card.firstName || 'Untitled Card',
      metrics: {
        totalViews,
        totalContacts,
        totalSocial,
        conversionRate: Number(conversionRate.toFixed(1)),
        uniqueVisitors: totalViews // Simplified
      },
      dailyData: last7Days,
      hourlyActivity: [], // Could be implemented later
      audience: mockAudienceData,
      recentActivity: analytics?.slice(0, 20) || [],
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Individual analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Public card endpoint (for sharing)
app.get('/api/cards/:cardId/public', async (req, res) => {
  try {
    const { cardId } = req.params;

    if (!cardId) {
      return res.status(400).json({ error: 'Card ID is required' });
    }

    // Get card from Supabase (public access, no user_id filter for sharing)
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .eq('is_published', true) // Only published cards can be accessed publicly
      .single();

    if (cardError || !card) {
      console.error('Public card not found:', cardError);
      return res.status(404).json({ error: 'Card not found or not published' });
    }

    // Track the view analytics
    try {
      await supabase
        .from('analytics_events')
        .insert({
          card_id: cardId,
          event_type: 'view',
          metadata: {
            user_agent: req.headers['user-agent'],
            referer: req.headers.referer,
            ip: req.ip
          }
        });
    } catch (analyticsError) {
      console.warn('Failed to track view:', analyticsError);
      // Don't fail the request if analytics tracking fails
    }

    // Return the public card data
    res.json(card);

  } catch (error) {
    console.error('Public card fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Real-time metrics
app.get('/api/analytics/realtime/:cardId', (req, res): any => {
  const { cardId } = req.params;
  const mockData = loadMockAnalytics();

  if (!mockData || mockData.cardId !== cardId) {
    return res.status(404).json({ error: 'Card not found' });
  }

  const now = new Date();
  const currentHour = now.getHours();
  const baseActivity = mockData.hourlyActivity.find((h: any) => h.hour === `${currentHour.toString().padStart(2, '0')}:00`)?.activity || 5;
  const currentViews = Math.max(0, baseActivity + Math.floor(Math.random() * 6) - 3);
  
  res.json({
    timestamp: now.toISOString(),
    activeVisitors: Math.floor(Math.random() * 8) + 1,
    viewsLastHour: currentViews,
    recentEvents: mockData.recentEvents.slice(0, 10),
    todayMetrics: {
      ...mockData.todayMetrics,
      views: mockData.todayMetrics.views + Math.floor(Math.random() * 3)
    },
    activeCountries: [
      { country: 'Chile', activeUsers: Math.floor(Math.random() * 5) + 1 },
      { country: 'Argentina', activeUsers: Math.floor(Math.random() * 3) },
      { country: 'Peru', activeUsers: Math.floor(Math.random() * 2) }
    ].filter(c => c.activeUsers > 0)
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    statusCode: 404
  });
});

// Error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
