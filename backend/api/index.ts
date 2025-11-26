import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env.development' });

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
app.get('/api/health', (req, res): any => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production'
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
const mockAnalytics = {
  monthlyTotals: {
    totalViews: 1247,
    totalContacts: 89,
    totalSocial: 156,
    conversionRate: 7.1
  },
  todayMetrics: {
    views: 23,
    contactSaves: 3,
    uniqueVisitors: 18
  }
};

// Dashboard overview
app.get('/api/analytics/dashboard/overview', (req, res): any => {
  res.json({
    overview: {
      totalCards: 1,
      totalViews: mockAnalytics.monthlyTotals.totalViews,
      totalContacts: mockAnalytics.monthlyTotals.totalContacts,
      totalSocial: mockAnalytics.monthlyTotals.totalSocial,
      conversionRate: mockAnalytics.monthlyTotals.conversionRate,
      todayViews: mockAnalytics.todayMetrics.views,
      todayContacts: mockAnalytics.todayMetrics.contactSaves,
      todayUnique: mockAnalytics.todayMetrics.uniqueVisitors,
      viewsTrend: '+12.5%',
      contactsTrend: '+8.3%',
      conversionTrend: '+2.1%'
    },
    lastUpdated: new Date().toISOString()
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

// For Vercel, export the Express app
export default app;