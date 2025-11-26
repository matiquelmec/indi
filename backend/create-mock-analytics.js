require('dotenv').config({ path: '.env.development' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function createMockAnalytics() {
  console.log('📊 Generando métricas demo para dashboard...');

  try {
    // Obtener la tarjeta demo
    const { data: cardData, error: cardError } = await supabase
      .from('cards')
      .select('id, title, user_id')
      .limit(1)
      .single();

    if (cardError || !cardData) {
      console.log('❌ No se encontró tarjeta demo');
      return;
    }

    console.log('✅ Tarjeta encontrada:', cardData.title);
    console.log('🎯 ID:', cardData.id);

    // Generar datos mock para métricas (simularemos la tabla analytics_events)
    const now = new Date();
    const mockAnalytics = {
      cardId: cardData.id,
      cardTitle: cardData.title,
      
      // Métricas de los últimos 7 días
      weeklyViews: generateDailyViews(7),
      
      // Métricas del día actual
      todayMetrics: {
        views: 23,
        contactSaves: 5,
        socialClicks: 8,
        uniqueVisitors: 18
      },

      // Métricas mensuales
      monthlyTotals: {
        totalViews: 247,
        totalContacts: 34,
        totalSocial: 56,
        conversionRate: 13.8
      },

      // Fuentes de tráfico
      trafficSources: [
        { source: 'QR Code', visits: 89, percentage: 36 },
        { source: 'Direct Link', visits: 67, percentage: 27 },
        { source: 'Social Media', visits: 45, percentage: 18 },
        { source: 'WhatsApp', visits: 31, percentage: 13 },
        { source: 'Other', visits: 15, percentage: 6 }
      ],

      // Dispositivos
      deviceStats: [
        { device: 'Mobile', visits: 156, percentage: 63 },
        { device: 'Desktop', visits: 68, percentage: 28 },
        { device: 'Tablet', visits: 23, percentage: 9 }
      ],

      // Ubicaciones (top 5)
      topLocations: [
        { country: 'Chile', city: 'Santiago', visits: 89 },
        { country: 'Chile', city: 'Valparaíso', visits: 34 },
        { country: 'Chile', city: 'Concepción', visits: 23 },
        { country: 'Argentina', city: 'Buenos Aires', visits: 12 },
        { country: 'Peru', city: 'Lima', visits: 8 }
      ],

      // Enlaces sociales más clickeados
      socialPerformance: [
        { platform: 'WhatsApp', clicks: 23, ctr: 15.3 },
        { platform: 'LinkedIn', clicks: 19, ctr: 12.7 },
        { platform: 'Instagram', clicks: 14, ctr: 9.3 }
      ],

      // Horarios de mayor actividad
      hourlyActivity: generateHourlyActivity(),

      // Eventos recientes (últimas 24 horas)
      recentEvents: generateRecentEvents(cardData.id, 50)
    };

    // Guardar en archivo local para el demo
    const fs = require('fs');
    const analyticsPath = './mock-analytics.json';
    fs.writeFileSync(analyticsPath, JSON.stringify(mockAnalytics, null, 2));

    console.log('✅ Métricas demo generadas');
    console.log('📁 Guardadas en:', analyticsPath);
    console.log('📊 Datos incluyen:');
    console.log('   • Vistas diarias (7 días)');
    console.log('   • Métricas de hoy:', mockAnalytics.todayMetrics.views, 'vistas');
    console.log('   • Fuentes de tráfico:', mockAnalytics.trafficSources.length, 'fuentes');
    console.log('   • Eventos recientes:', mockAnalytics.recentEvents.length, 'eventos');
    console.log('   • Análisis de dispositivos y ubicaciones');

    // También actualizar el contador de vistas en la tarjeta real
    const { error: updateError } = await supabase
      .from('cards')
      .update({ 
        views_count: mockAnalytics.monthlyTotals.totalViews,
        updated_at: new Date().toISOString()
      })
      .eq('id', cardData.id);

    if (updateError) {
      console.log('⚠️ Error actualizando contador:', updateError.message);
    } else {
      console.log('✅ Contador de vistas actualizado a', mockAnalytics.monthlyTotals.totalViews);
    }

    return mockAnalytics;

  } catch (error) {
    console.error('💥 Error generando analytics:', error.message);
    return null;
  }
}

function generateDailyViews(days) {
  const views = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const baseViews = Math.floor(Math.random() * 20) + 15; // 15-35 vistas por día
    const weekdayMultiplier = date.getDay() === 0 || date.getDay() === 6 ? 0.7 : 1; // Menos en fines de semana
    
    views.push({
      date: date.toISOString().split('T')[0],
      views: Math.floor(baseViews * weekdayMultiplier),
      uniqueVisitors: Math.floor(baseViews * weekdayMultiplier * 0.8),
      contactSaves: Math.floor(Math.random() * 5) + 1
    });
  }
  
  return views;
}

function generateHourlyActivity() {
  const hours = [];
  for (let hour = 0; hour < 24; hour++) {
    let activity = 5; // Base activity
    
    // Picos de actividad en horarios laborales
    if (hour >= 9 && hour <= 18) {
      activity += Math.floor(Math.random() * 15) + 10;
    }
    // Actividad moderada en noche
    else if (hour >= 19 && hour <= 22) {
      activity += Math.floor(Math.random() * 8) + 5;
    }
    
    hours.push({
      hour: hour.toString().padStart(2, '0') + ':00',
      activity: activity
    });
  }
  
  return hours;
}

function generateRecentEvents(cardId, count) {
  const events = [];
  const eventTypes = [
    'view',
    'contact_save',
    'social_click',
    'profile_share',
    'qr_scan'
  ];
  
  const locations = [
    'Santiago, Chile',
    'Valparaíso, Chile', 
    'Concepción, Chile',
    'Buenos Aires, Argentina',
    'Lima, Peru'
  ];
  
  const devices = ['mobile', 'desktop', 'tablet'];
  const sources = ['qr_code', 'direct', 'social', 'whatsapp', 'referral'];

  for (let i = 0; i < count; i++) {
    const timestamp = new Date();
    timestamp.setMinutes(timestamp.getMinutes() - Math.floor(Math.random() * 1440)); // Últimas 24 horas
    
    events.push({
      id: uuidv4(),
      cardId: cardId,
      eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      timestamp: timestamp.toISOString(),
      metadata: {
        device: devices[Math.floor(Math.random() * devices.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        location: locations[Math.floor(Math.random() * locations.length)]
      }
    });
  }
  
  return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

createMockAnalytics();