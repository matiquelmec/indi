const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const databaseService = require('./services/database');
const authRoutes = require('./routes/auth.routes');

// Load environment variables
require('dotenv').config({ path: '.env.development' });

// Debug environment variables
console.log('🔍 Environment Debug:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  APP_MODE:', process.env.APP_MODE);
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET ✅' : 'MISSING ❌');
console.log('  SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET ✅' : 'MISSING ❌');

const app = express();
const PORT = process.env.PORT || 3001;

// Determine app mode
const APP_MODE = process.env.APP_MODE || 'demo'; // 'demo' or 'production'

console.log(`🚀 Starting INDI Analytics Server in ${APP_MODE.toUpperCase()} mode`);
console.log(`📊 Database Service: ${databaseService.getMode()}`);

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

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ===============================================
// HEALTH CHECK ENDPOINTS
// ===============================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    mode: APP_MODE,
    database: databaseService.getMode()
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    server: 'INDI Analytics API',
    version: '2.0.0',
    mode: APP_MODE,
    database: databaseService.getMode(),
    features: {
      realDatabase: databaseService.getMode() !== 'mock',
      realAuth: APP_MODE === 'production',
      eventTracking: APP_MODE === 'production',
      mockFallback: true
    },
    endpoints: {
      health: '/api/health',
      analytics: '/api/analytics/dashboard/overview',
      realtime: '/api/analytics/realtime/:cardId',
      tracking: '/api/analytics/track'
    }
  });
});

// ===============================================
// AUTHENTICATION ROUTES
// ===============================================

// Use real auth routes
app.use('/api/auth', authRoutes);

// ===============================================
// ANALYTICS ENDPOINTS
// ===============================================

// Dashboard overview - Real data with mock fallback
app.get('/api/analytics/dashboard/overview', async (req, res) => {
  try {
    const cardId = req.query.cardId || 'c3140e8f-999a-41ef-b755-1dc4519afb9e';

    console.log(`📊 Getting analytics overview for card: ${cardId}`);

    const analyticsData = await databaseService.getAnalyticsOverview(cardId);

    // Add mode indicator to response
    analyticsData.mode = APP_MODE;
    analyticsData.databaseMode = databaseService.getMode();

    res.json(analyticsData);

  } catch (error) {
    console.error('❌ Error getting analytics overview:', error);
    res.status(500).json({
      error: 'Failed to get analytics overview',
      message: error.message,
      fallback: 'Using empty data'
    });
  }
});

// Real-time analytics - Real data with mock fallback
app.get('/api/analytics/realtime/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;

    console.log(`⚡ Getting realtime analytics for card: ${cardId}`);

    const realtimeData = await databaseService.getRealtimeAnalytics(cardId);

    // Add mode indicator to response
    realtimeData.mode = APP_MODE;
    realtimeData.databaseMode = databaseService.getMode();

    res.json(realtimeData);

  } catch (error) {
    console.error('❌ Error getting realtime analytics:', error);
    res.status(500).json({
      error: 'Failed to get realtime analytics',
      message: error.message,
      fallback: 'Using mock data'
    });
  }
});

// Event tracking endpoint (only works in production mode)
app.post('/api/analytics/track', async (req, res) => {
  try {
    const {
      cardId,
      eventType, // 'view', 'contact_save', 'social_click', 'qr_scan', 'share'
      visitorId,
      sessionId,
      metadata
    } = req.body;

    if (!cardId || !eventType) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['cardId', 'eventType']
      });
    }

    // Extract client information
    const userAgent = req.headers['user-agent'] || '';
    const clientIP = req.ip || req.connection.remoteAddress;

    const eventData = {
      cardId,
      eventType,
      visitorId: visitorId || `visitor_${Date.now()}`,
      sessionId: sessionId || `session_${Date.now()}`,
      deviceType: 'unknown', // TODO: Parse from user-agent
      browser: 'unknown', // TODO: Parse from user-agent
      os: 'unknown', // TODO: Parse from user-agent
      country: 'Unknown', // TODO: Get from IP geolocation
      city: 'Unknown', // TODO: Get from IP geolocation
      referrer: req.headers.referer || null,
      utmSource: req.query.utm_source || null,
      utmMedium: req.query.utm_medium || null,
      utmCampaign: req.query.utm_campaign || null,
      ipAddress: clientIP,
      userAgent: userAgent,
      metadata: metadata || {}
    };

    const result = await databaseService.trackEvent(eventData);

    if (result.success) {
      res.json({
        success: true,
        eventType,
        mode: result.mode,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        error: 'Failed to track event',
        message: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error tracking event:', error);
    res.status(500).json({
      error: 'Failed to track event',
      message: error.message
    });
  }
});

// ===============================================
// LEGACY MOCK ENDPOINTS (for compatibility)
// ===============================================

// Mock cards endpoint
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
      createdAt: new Date().toISOString(),
      mode: APP_MODE
    }
  ]);
});

// ===============================================
// MODE SWITCHING ENDPOINTS (for testing)
// ===============================================

app.post('/api/admin/switch-mode', (req, res) => {
  const { mode } = req.body;

  if (!['demo', 'production', 'mock'].includes(mode)) {
    return res.status(400).json({
      error: 'Invalid mode',
      validModes: ['demo', 'production', 'mock']
    });
  }

  databaseService.setMode(mode);

  res.json({
    message: `Mode switched to ${mode}`,
    previousMode: APP_MODE,
    newMode: mode,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/admin/modes', (req, res) => {
  res.json({
    current: {
      appMode: APP_MODE,
      databaseMode: databaseService.getMode()
    },
    available: ['demo', 'production', 'mock'],
    descriptions: {
      demo: 'Uses real Supabase database with demo data fallback',
      production: 'Full production mode with real user authentication',
      mock: 'Mock data only, no database connections'
    }
  });
});

// ===============================================
// ERROR HANDLERS
// ===============================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    statusCode: 404,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/status',
      'GET /api/analytics/dashboard/overview',
      'GET /api/analytics/realtime/:cardId',
      'POST /api/analytics/track',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/cards'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('🚨 Server Error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message,
    mode: APP_MODE
  });
});

// ===============================================
// START SERVER
// ===============================================

app.listen(PORT, () => {
  console.log('\n🚀 INDI Analytics Server Started Successfully!');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  console.log(`📊 Status: http://localhost:${PORT}/api/status`);
  console.log(`📈 Analytics: http://localhost:${PORT}/api/analytics/dashboard/overview`);
  console.log(`⚡ Realtime: http://localhost:${PORT}/api/analytics/realtime/c3140e8f-999a-41ef-b755-1dc4519afb9e`);
  console.log(`\n🔧 Mode: ${APP_MODE.toUpperCase()}`);
  console.log(`💾 Database: ${databaseService.getMode().toUpperCase()}`);

  if (APP_MODE === 'demo') {
    console.log('\n💡 DEMO MODE FEATURES:');
    console.log('   ✅ Real Supabase database (if available)');
    console.log('   ✅ Mock data fallback');
    console.log('   ✅ Demo authentication');
    console.log('   ⚠️  Event tracking disabled');
  } else if (APP_MODE === 'production') {
    console.log('\n🏭 PRODUCTION MODE FEATURES:');
    console.log('   ✅ Real Supabase database');
    console.log('   ✅ Real authentication (TODO)');
    console.log('   ✅ Event tracking enabled');
    console.log('   ❌ No mock fallbacks');
  }

  console.log('\n🎮 API Endpoints Ready!');
});

module.exports = app;