import express, { Request, Response } from 'express';
import { param, query, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import * as fs from 'fs';
import * as path from 'path';

const router = express.Router();

// Helper function to load mock analytics data
function loadMockAnalytics() {
  try {
    const analyticsPath = path.join(__dirname, '../../../mock-analytics.json');
    if (fs.existsSync(analyticsPath)) {
      const data = fs.readFileSync(analyticsPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading mock analytics:', error);
  }
  return null;
}

// Get dashboard overview with real-time metrics
router.get('/dashboard/overview', authMiddleware, (req: Request, res: Response) => {
  try {
    const mockData = loadMockAnalytics();
    
    if (!mockData) {
      return res.status(200).json({
        message: 'No analytics data available yet',
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
        
        // Métricas de hoy
        todayViews: mockData.todayMetrics.views,
        todayContacts: mockData.todayMetrics.contactSaves,
        todayUnique: mockData.todayMetrics.uniqueVisitors,
        
        // Tendencias (comparado con ayer - simulado)
        viewsTrend: '+12.5%',
        contactsTrend: '+8.3%',
        conversionTrend: '+2.1%'
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get detailed card analytics
router.get('/cards/:cardId/detailed', authMiddleware, [
  param('cardId').isUUID(),
  query('period').optional().isIn(['1d', '7d', '30d'])
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
    const mockData = loadMockAnalytics();

    if (!mockData || mockData.cardId !== cardId) {
      return res.status(404).json({ error: 'Card analytics not found' });
    }

    return res.json({
      cardId,
      cardTitle: mockData.cardTitle,
      period,
      
      // Métricas principales
      metrics: {
        totalViews: mockData.monthlyTotals.totalViews,
        totalContacts: mockData.monthlyTotals.totalContacts,
        totalSocial: mockData.monthlyTotals.totalSocial,
        conversionRate: mockData.monthlyTotals.conversionRate,
        uniqueVisitors: mockData.todayMetrics.uniqueVisitors
      },

      // Datos temporales
      dailyData: mockData.weeklyViews,
      hourlyActivity: mockData.hourlyActivity,

      // Análisis de audiencia
      audience: {
        trafficSources: mockData.trafficSources,
        deviceBreakdown: mockData.deviceStats,
        topLocations: mockData.topLocations,
        socialPerformance: mockData.socialPerformance
      },

      // Eventos recientes
      recentActivity: mockData.recentEvents.slice(0, 20),

      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Detailed card analytics error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get real-time metrics (simulated)
router.get('/realtime/:cardId', authMiddleware, [
  param('cardId').isUUID()
], (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    const mockData = loadMockAnalytics();

    if (!mockData || mockData.cardId !== cardId) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Simular métricas en tiempo real
    const now = new Date();
    const currentHour = now.getHours();
    const baseActivity = mockData.hourlyActivity.find(h => h.hour === `${currentHour.toString().padStart(2, '0')}:00`)?.activity || 5;
    
    // Añadir variación aleatoria para simular tiempo real
    const currentViews = Math.max(0, baseActivity + Math.floor(Math.random() * 6) - 3);
    
    return res.json({
      timestamp: now.toISOString(),
      activeVisitors: Math.floor(Math.random() * 8) + 1, // 1-8 visitantes activos
      viewsLastHour: currentViews,
      recentEvents: mockData.recentEvents.slice(0, 10),
      
      // Métricas del día actual (actualizadas)
      todayMetrics: {
        ...mockData.todayMetrics,
        views: mockData.todayMetrics.views + Math.floor(Math.random() * 3) // Simular incremento
      },

      // Estados de países activos (simulado)
      activeCountries: [
        { country: 'Chile', activeUsers: Math.floor(Math.random() * 5) + 1 },
        { country: 'Argentina', activeUsers: Math.floor(Math.random() * 3) },
        { country: 'Peru', activeUsers: Math.floor(Math.random() * 2) }
      ].filter(c => c.activeUsers > 0)
    });

  } catch (error) {
    console.error('Real-time metrics error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get performance insights
router.get('/cards/:cardId/insights', authMiddleware, [
  param('cardId').isUUID()
], (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    const mockData = loadMockAnalytics();

    if (!mockData || mockData.cardId !== cardId) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Generar insights basados en los datos
    const insights = [];
    
    // Insight de mejor día de la semana
    const bestDay = mockData.weeklyViews.reduce((best, current) => 
      current.views > best.views ? current : best
    );
    insights.push({
      type: 'performance',
      title: 'Mejor día de la semana',
      description: `${new Date(bestDay.date).toLocaleDateString('es-ES', { weekday: 'long' })} fue tu mejor día con ${bestDay.views} vistas`,
      icon: '📈',
      actionable: true,
      suggestion: 'Considera programar tus publicaciones en redes sociales para este día'
    });

    // Insight de fuente de tráfico principal
    const topSource = mockData.trafficSources[0];
    insights.push({
      type: 'traffic',
      title: 'Fuente principal de tráfico',
      description: `${topSource.source} representa el ${topSource.percentage}% de tu tráfico`,
      icon: '🎯',
      actionable: true,
      suggestion: topSource.source === 'QR Code' ? 
        'Tu código QR es muy efectivo. Considera imprimirlo en más materiales' :
        `Optimiza tu presencia en ${topSource.source} para maximizar este canal`
    });

    // Insight de dispositivos
    const mobilePercentage = mockData.deviceStats.find(d => d.device === 'Mobile')?.percentage || 0;
    if (mobilePercentage > 70) {
      insights.push({
        type: 'device',
        title: 'Audiencia principalmente móvil',
        description: `${mobilePercentage}% de tus visitantes usan dispositivos móviles`,
        icon: '📱',
        actionable: true,
        suggestion: 'Asegúrate de que tu información de contacto sea fácil de usar en móviles'
      });
    }

    // Insight de conversión
    if (mockData.monthlyTotals.conversionRate > 10) {
      insights.push({
        type: 'conversion',
        title: 'Excelente tasa de conversión',
        description: `Tu tasa de conversión del ${mockData.monthlyTotals.conversionRate}% está por encima del promedio`,
        icon: '🏆',
        actionable: false,
        suggestion: '¡Sigue así! Tu tarjeta está convirtiendo muy bien'
      });
    }

    return res.json({
      cardId,
      insights,
      score: Math.floor(mockData.monthlyTotals.conversionRate * 6), // Score sobre 100
      recommendations: [
        'Añade más enlaces sociales para aumentar el engagement',
        'Considera actualizar tu foto de perfil regularmente',
        'Optimiza tu biografía con palabras clave relevantes'
      ],
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Performance insights error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Export events (for data backup/analysis)
router.get('/cards/:cardId/export', authMiddleware, [
  param('cardId').isUUID(),
  query('format').optional().isIn(['json', 'csv'])
], (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    const format = req.query.format as string || 'json';
    const mockData = loadMockAnalytics();

    if (!mockData || mockData.cardId !== cardId) {
      return res.status(404).json({ error: 'Card not found' });
    }

    if (format === 'csv') {
      // Convert events to CSV
      let csv = 'timestamp,event_type,device,source,location\n';
      mockData.recentEvents.forEach((event: any) => {
        csv += `${event.timestamp},${event.eventType},${event.metadata.device},${event.metadata.source},${event.metadata.location}\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${cardId}.csv"`);
      return res.send(csv);
    } else {
      // Return JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${cardId}.json"`);
      return res.json({
        exportDate: new Date().toISOString(),
        cardId,
        metrics: mockData,
        events: mockData.recentEvents
      });
    }

  } catch (error) {
    console.error('Export analytics error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;