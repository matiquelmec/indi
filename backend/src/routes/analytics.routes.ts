import express, { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Mock analytics storage (replace with database in production)
const analyticsEvents: any[] = [];

// Track event (public - can be called without auth for public cards)
router.post('/track', [
  body('cardId').isUUID(),
  body('eventType').isIn(['view', 'click', 'contact_saved', 'social_click']),
  body('metadata').optional().isObject()
], (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { cardId, eventType, metadata = {} } = req.body;

    // Generate visitor ID from IP and User-Agent (simplified)
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const visitorId = Buffer.from(`${ip}-${userAgent}`).toString('base64').slice(0, 20);

    const event = {
      id: uuidv4(),
      cardId,
      eventType,
      visitorId,
      ipAddress: ip,
      userAgent,
      referrer: req.headers.referer || null,
      country: null, // Would be populated by GeoIP service
      city: null,
      deviceType: userAgent.includes('Mobile') ? 'mobile' : 'desktop',
      browser: userAgent.includes('Chrome') ? 'Chrome' : 'Other',
      os: userAgent.includes('Windows') ? 'Windows' : 'Other',
      metadata,
      createdAt: new Date()
    };

    analyticsEvents.push(event);

    res.json({ message: 'Event tracked successfully' });

  } catch (error) {
    console.error('Track event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get card analytics
router.get('/cards/:cardId', authMiddleware, [
  param('cardId').isUUID(),
  query('period').optional().isIn(['1d', '7d', '30d', '90d', '1y'])
], (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { cardId } = req.params;
    const period = req.query.period as string || '7d';

    // Calculate date range
    const now = new Date();
    const periodInMs = {
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000
    };
    
    const startDate = new Date(now.getTime() - periodInMs[period as keyof typeof periodInMs]);

    // Filter events for the card and period
    const events = analyticsEvents.filter(e => 
      e.cardId === cardId && 
      new Date(e.createdAt) >= startDate
    );

    // Calculate metrics
    const totalViews = events.filter(e => e.eventType === 'view').length;
    const totalClicks = events.filter(e => e.eventType === 'click').length;
    const totalContacts = events.filter(e => e.eventType === 'contact_saved').length;
    const uniqueVisitors = new Set(events.map(e => e.visitorId)).size;

    // Daily breakdown
    const dailyStats: { [key: string]: any } = {};
    events.forEach(event => {
      const date = new Date(event.createdAt).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          views: 0,
          clicks: 0,
          contacts: 0,
          visitors: new Set()
        };
      }
      
      if (event.eventType === 'view') dailyStats[date].views++;
      if (event.eventType === 'click') dailyStats[date].clicks++;
      if (event.eventType === 'contact_saved') dailyStats[date].contacts++;
      dailyStats[date].visitors.add(event.visitorId);
    });

    // Convert daily stats to array and clean up
    const dailyData = Object.values(dailyStats).map((day: any) => ({
      date: day.date,
      views: day.views,
      clicks: day.clicks,
      contacts: day.contacts,
      visitors: day.visitors.size
    }));

    // Device breakdown
    const devices = events.reduce((acc: any, event) => {
      acc[event.deviceType] = (acc[event.deviceType] || 0) + 1;
      return acc;
    }, {});

    // Browser breakdown
    const browsers = events.reduce((acc: any, event) => {
      acc[event.browser] = (acc[event.browser] || 0) + 1;
      return acc;
    }, {});

    res.json({
      period,
      summary: {
        totalViews,
        totalClicks,
        totalContacts,
        uniqueVisitors,
        conversionRate: totalViews > 0 ? (totalContacts / totalViews * 100).toFixed(2) : '0.00'
      },
      dailyData: dailyData.sort((a, b) => a.date.localeCompare(b.date)),
      breakdown: {
        devices,
        browsers
      }
    });

  } catch (error) {
    console.error('Get card analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dashboard analytics (all user's cards)
router.get('/dashboard', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // This would normally join with cards table to get user's cards
    // For now, we'll mock this data
    const mockUserCards = ['card-id-1', 'card-id-2']; // Would come from database

    // Get events for all user's cards
    const events = analyticsEvents.filter(e => 
      mockUserCards.includes(e.cardId)
    );

    // Calculate overall metrics
    const totalViews = events.filter(e => e.eventType === 'view').length;
    const totalClicks = events.filter(e => e.eventType === 'click').length;
    const totalContacts = events.filter(e => e.eventType === 'contact_saved').length;
    const uniqueVisitors = new Set(events.map(e => e.visitorId)).size;

    // Last 7 days breakdown
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const weeklyData = last7Days.map(date => {
      const dayEvents = events.filter(e => 
        new Date(e.createdAt).toISOString().split('T')[0] === date
      );
      
      return {
        date,
        views: dayEvents.filter(e => e.eventType === 'view').length,
        clicks: dayEvents.filter(e => e.eventType === 'click').length,
        contacts: dayEvents.filter(e => e.eventType === 'contact_saved').length
      };
    });

    res.json({
      summary: {
        totalViews,
        totalClicks,
        totalContacts,
        uniqueVisitors,
        conversionRate: totalViews > 0 ? (totalContacts / totalViews * 100).toFixed(2) : '0.00'
      },
      weeklyData
    });

  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;