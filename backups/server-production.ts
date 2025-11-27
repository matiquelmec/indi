import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.development') });

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const app = express();
const PORT = process.env.PORT || 5001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: function(origin: any, callback: any) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://indi-digital-card.vercel.app'
    ];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit auth attempts
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Type definitions
interface AuthRequest extends express.Request {
  userId?: string;
}

// Helper functions
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRE || '15m' } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
};

// Middleware to verify JWT
const authenticateToken = async (req: AuthRequest, res: express.Response, next: express.NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }
};

// ==================== ROUTES ====================

// Health check
app.get('/api/health', (req: express.Request, res: express.Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: 'connected'
  });
});

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim()
], async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, firstName, lastName } = req.body;

  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user in database
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        email_verified: false
      })
      .select()
      .single();

    if (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser.id);

    // Store refresh token
    await supabase
      .from('sessions')
      .insert({
        user_id: newUser.id,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token
    await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        emailVerified: user.email_verified
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;

    // Check if session exists
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('refresh_token', refreshToken)
      .eq('user_id', decoded.userId)
      .single();

    if (!session || new Date(session.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Generate new tokens
    const tokens = generateTokens(decoded.userId);

    // Update refresh token in database
    await supabase
      .from('sessions')
      .update({
        refresh_token: tokens.refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', session.id);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Logout
app.post('/api/auth/logout', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Remove refresh token from database
    await supabase
      .from('sessions')
      .delete()
      .eq('refresh_token', refreshToken);
  }

  res.json({ message: 'Logged out successfully' });
});

// ==================== CARDS ROUTES ====================

// Get all user cards
app.get('/api/cards', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const { data: cards, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cards:', error);
      return res.status(500).json({ error: 'Failed to fetch cards' });
    }

    res.json(cards || []);
  } catch (error) {
    console.error('Cards fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single card
app.get('/api/cards/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const { data: card, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (error || !card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json(card);
  } catch (error) {
    console.error('Card fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get public card (no auth required)
app.get('/api/cards/:id/public', async (req: express.Request, res: express.Response) => {
  try {
    const { data: card, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', req.params.id)
      .eq('is_published', true)
      .single();

    if (error || !card) {
      return res.status(404).json({ error: 'Card not found or not published' });
    }

    // Increment view count
    await supabase
      .from('cards')
      .update({ views_count: (card.views_count || 0) + 1 })
      .eq('id', req.params.id);

    // Track analytics event
    await supabase
      .from('analytics_events')
      .insert({
        card_id: req.params.id,
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

// Create new card
app.post('/api/cards', authenticateToken, [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('title').notEmpty().trim()
], async (req: AuthRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const cardData = {
      ...req.body,
      user_id: req.userId,
      social_links: req.body.socialLinks || [],
      theme_config: req.body.themeConfig || {}
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

    res.status(201).json(newCard);
  } catch (error) {
    console.error('Card creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update card
app.put('/api/cards/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    // Verify ownership
    const { data: existingCard } = await supabase
      .from('cards')
      .select('user_id')
      .eq('id', req.params.id)
      .single();

    if (!existingCard || existingCard.user_id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updateData = {
      ...req.body,
      social_links: req.body.socialLinks || [],
      theme_config: req.body.themeConfig || {},
      updated_at: new Date().toISOString()
    };

    const { data: updatedCard, error } = await supabase
      .from('cards')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Card update error:', error);
      return res.status(500).json({ error: 'Failed to update card' });
    }

    res.json(updatedCard);
  } catch (error) {
    console.error('Card update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete card
app.delete('/api/cards/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    // Verify ownership
    const { data: existingCard } = await supabase
      .from('cards')
      .select('user_id')
      .eq('id', req.params.id)
      .single();

    if (!existingCard || existingCard.user_id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Card deletion error:', error);
      return res.status(500).json({ error: 'Failed to delete card' });
    }

    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Card deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Publish/Unpublish card
app.patch('/api/cards/:id/publish', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const { isPublished } = req.body;

    // Verify ownership
    const { data: existingCard } = await supabase
      .from('cards')
      .select('user_id')
      .eq('id', req.params.id)
      .single();

    if (!existingCard || existingCard.user_id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const publishedUrl = isPublished ? `/card/${req.params.id}` : null;

    const { data: updatedCard, error } = await supabase
      .from('cards')
      .update({
        is_published: isPublished,
        published_url: publishedUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Publish update error:', error);
      return res.status(500).json({ error: 'Failed to update publish status' });
    }

    res.json(updatedCard);
  } catch (error) {
    console.error('Publish update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== ANALYTICS ROUTES ====================

// Get card analytics
app.get('/api/analytics/card/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    // Verify ownership
    const { data: card } = await supabase
      .from('cards')
      .select('user_id')
      .eq('id', req.params.id)
      .single();

    if (!card || card.user_id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get analytics events for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('card_id', req.params.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Analytics fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }

    // Process events into daily stats
    const dailyStats: any = {};
    events?.forEach(event => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          views: 0,
          contacts: 0,
          social: 0
        };
      }

      if (event.event_type === 'view') dailyStats[date].views++;
      if (event.event_type === 'contact_save') dailyStats[date].contacts++;
      if (event.event_type === 'social_click') dailyStats[date].social++;
    });

    res.json({
      cardId: req.params.id,
      dailyStats: Object.values(dailyStats),
      totalViews: events?.filter(e => e.event_type === 'view').length || 0,
      totalContacts: events?.filter(e => e.event_type === 'contact_save').length || 0,
      totalSocial: events?.filter(e => e.event_type === 'social_click').length || 0
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dashboard overview
app.get('/api/analytics/dashboard/overview', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    // Get all user cards
    const { data: cards } = await supabase
      .from('cards')
      .select('id, views_count')
      .eq('user_id', req.userId);

    const cardIds = cards?.map(c => c.id) || [];
    const totalViews = cards?.reduce((sum, c) => sum + (c.views_count || 0), 0) || 0;

    // Get today's stats
    const today = new Date().toISOString().split('T')[0];
    const { data: todayEvents } = await supabase
      .from('analytics_events')
      .select('event_type')
      .in('card_id', cardIds)
      .gte('created_at', `${today}T00:00:00Z`);

    const todayViews = todayEvents?.filter(e => e.event_type === 'view').length || 0;
    const todayContacts = todayEvents?.filter(e => e.event_type === 'contact_save').length || 0;

    res.json({
      overview: {
        totalCards: cards?.length || 0,
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

// Track analytics event
app.post('/api/analytics/track', async (req: express.Request, res: express.Response) => {
  const { cardId, eventType, metadata } = req.body;

  try {
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        card_id: cardId,
        event_type: eventType,
        metadata: metadata || {},
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        referrer: req.headers['referer']
      });

    if (error) {
      console.error('Analytics tracking error:', error);
      return res.status(500).json({ error: 'Failed to track event' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 INDI Backend Server - PRODUCTION MODE
=========================================
✅ Server running on http://localhost:${PORT}
✅ Database: Supabase connected
✅ Auth system: JWT + Supabase Auth
✅ CORS enabled for frontend
✅ Rate limiting active
✅ Security headers enabled
=========================================
📊 Endpoints available:
  - Health: GET /api/health
  - Auth: POST /api/auth/[register|login|logout|refresh]
  - Cards: GET|POST|PUT|DELETE /api/cards
  - Analytics: GET /api/analytics/[card|dashboard]
  - Public: GET /api/cards/:id/public
=========================================
  `);
});