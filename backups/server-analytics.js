const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.development' });

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

// Helper function to load mock analytics
function loadMockAnalytics() {
  try {
    const analyticsPath = path.join(__dirname, '../mock-analytics.json');
    console.log('Looking for analytics at:', analyticsPath);
    if (fs.existsSync(analyticsPath)) {
      const data = fs.readFileSync(analyticsPath, 'utf8');
      console.log('✅ Mock analytics loaded successfully');
      return JSON.parse(data);
    } else {
      console.log('❌ Mock analytics file not found');
    }
    return null;
  } catch (error) {
    console.error('Error loading mock analytics:', error);
    return null;
  }
}

// Dashboard overview
app.get('/api/analytics/dashboard/overview', (req, res) => {
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

  return res.json({
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

// Detailed card analytics
app.get('/api/analytics/cards/:cardId/detailed', (req, res) => {
  const { cardId } = req.params;
  const mockData = loadMockAnalytics();

  if (!mockData || mockData.cardId !== cardId) {
    return res.status(404).json({ error: 'Card analytics not found' });
  }

  return res.json({
    cardId,
    cardTitle: mockData.cardTitle,
    metrics: {
      totalViews: mockData.monthlyTotals.totalViews,
      totalContacts: mockData.monthlyTotals.totalContacts,
      totalSocial: mockData.monthlyTotals.totalSocial,
      conversionRate: mockData.monthlyTotals.conversionRate,
      uniqueVisitors: mockData.todayMetrics.uniqueVisitors
    },
    dailyData: mockData.weeklyViews,
    hourlyActivity: mockData.hourlyActivity,
    audience: {
      trafficSources: mockData.trafficSources,
      deviceBreakdown: mockData.deviceStats,
      topLocations: mockData.topLocations,
      socialPerformance: mockData.socialPerformance
    },
    recentActivity: mockData.recentEvents.slice(0, 20),
    lastUpdated: new Date().toISOString()
  });
});

// Real-time metrics
app.get('/api/analytics/realtime/:cardId', (req, res) => {
  const { cardId } = req.params;
  const mockData = loadMockAnalytics();

  if (!mockData || mockData.cardId !== cardId) {
    return res.status(404).json({ error: 'Card not found' });
  }

  const now = new Date();
  const currentHour = now.getHours();
  const baseActivity = mockData.hourlyActivity.find(h => h.hour === `${currentHour.toString().padStart(2, '0')}:00`)?.activity || 5;
  const currentViews = Math.max(0, baseActivity + Math.floor(Math.random() * 6) - 3);

  return res.json({
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
app.use((error, req, res, next) => {
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
  console.log(`📊 Analytics: http://localhost:${PORT}/api/analytics/dashboard/overview`);
});

module.exports = app;