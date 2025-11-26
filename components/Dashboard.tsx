import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Share2, 
  Smartphone, 
  Monitor, 
  Tablet,
  Globe,
  Clock,
  Activity
} from 'lucide-react';

interface DashboardProps {
  cardId?: string;
}

interface MetricCard {
  title: string;
  value: string | number;
  trend: string;
  icon: React.ReactNode;
  color: string;
}

interface AnalyticsData {
  overview: {
    totalViews: number;
    totalContacts: number;
    totalSocial: number;
    conversionRate: number;
    todayViews: number;
    todayContacts: number;
    viewsTrend: string;
    contactsTrend: string;
  };
  dailyData: Array<{
    date: string;
    views: number;
    uniqueVisitors: number;
    contactSaves: number;
  }>;
  trafficSources: Array<{
    source: string;
    visits: number;
    percentage: number;
  }>;
  deviceStats: Array<{
    device: string;
    visits: number;
    percentage: number;
  }>;
  realtimeData: {
    activeVisitors: number;
    viewsLastHour: number;
    activeCountries: Array<{
      country: string;
      activeUsers: number;
    }>;
  };
}

const Dashboard: React.FC<DashboardProps> = ({ cardId = 'c3140e8f-999a-41ef-b755-1dc4519afb9e' }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  // Mock data que coincide con nuestros datos generados
  const mockAnalytics: AnalyticsData = {
    overview: {
      totalViews: 247,
      totalContacts: 34,
      totalSocial: 56,
      conversionRate: 13.8,
      todayViews: 23,
      todayContacts: 5,
      viewsTrend: '+12.5%',
      contactsTrend: '+8.3%'
    },
    dailyData: [
      { date: '2025-11-20', views: 28, uniqueVisitors: 22, contactSaves: 3 },
      { date: '2025-11-21', views: 31, uniqueVisitors: 26, contactSaves: 4 },
      { date: '2025-11-22', views: 25, uniqueVisitors: 20, contactSaves: 2 },
      { date: '2025-11-23', views: 18, uniqueVisitors: 15, contactSaves: 3 },
      { date: '2025-11-24', views: 22, uniqueVisitors: 18, contactSaves: 2 },
      { date: '2025-11-25', views: 35, uniqueVisitors: 28, contactSaves: 6 },
      { date: '2025-11-26', views: 23, uniqueVisitors: 19, contactSaves: 5 }
    ],
    trafficSources: [
      { source: 'QR Code', visits: 89, percentage: 36 },
      { source: 'Direct Link', visits: 67, percentage: 27 },
      { source: 'Social Media', visits: 45, percentage: 18 },
      { source: 'WhatsApp', visits: 31, percentage: 13 },
      { source: 'Other', visits: 15, percentage: 6 }
    ],
    deviceStats: [
      { device: 'Mobile', visits: 156, percentage: 63 },
      { device: 'Desktop', visits: 68, percentage: 28 },
      { device: 'Tablet', visits: 23, percentage: 9 }
    ],
    realtimeData: {
      activeVisitors: Math.floor(Math.random() * 8) + 1,
      viewsLastHour: Math.floor(Math.random() * 15) + 5,
      activeCountries: [
        { country: 'Chile', activeUsers: Math.floor(Math.random() * 5) + 1 },
        { country: 'Argentina', activeUsers: Math.floor(Math.random() * 3) },
        { country: 'Peru', activeUsers: Math.floor(Math.random() * 2) }
      ].filter(c => c.activeUsers > 0)
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      try {
        // Conectar con API real del backend
        const overviewResponse = await fetch('http://localhost:3001/api/analytics/dashboard/overview');
        if (!overviewResponse.ok) {
          throw new Error('Failed to fetch overview data');
        }

        const overviewData = await overviewResponse.json();

        // Obtener datos en tiempo real
        const realtimeResponse = await fetch(`http://localhost:3001/api/analytics/realtime/${cardId}`);
        const realtimeData = realtimeResponse.ok ? await realtimeResponse.json() : null;

        // Combinar datos de la API real
        setAnalytics({
          overview: overviewData.overview,
          dailyData: mockAnalytics.dailyData, // Usar mock por ahora
          trafficSources: mockAnalytics.trafficSources, // Usar mock por ahora
          deviceStats: mockAnalytics.deviceStats, // Usar mock por ahora
          realtimeData: realtimeData || mockAnalytics.realtimeData
        });

        console.log('✅ Datos cargados desde API:', overviewData);
      } catch (error) {
        console.error('❌ Error loading analytics:', error);
        // Fallback a datos mock en caso de error
        setAnalytics(mockAnalytics);
      }

      setIsLoading(false);
    };

    loadData();

    // Auto-refresh cada 30 segundos para datos en tiempo real
    const interval = setInterval(async () => {
      try {
        // Obtener datos en tiempo real actualizados
        const realtimeResponse = await fetch(`http://localhost:3001/api/analytics/realtime/${cardId}`);
        if (realtimeResponse.ok) {
          const realtimeData = await realtimeResponse.json();
          setAnalytics(prev => prev ? {
            ...prev,
            realtimeData: realtimeData
          } : null);
        }
      } catch (error) {
        console.error('Error updating realtime data:', error);
        // Fallback a datos mock en caso de error
        setAnalytics(prev => prev ? {
          ...prev,
          realtimeData: {
            ...prev.realtimeData,
            activeVisitors: Math.floor(Math.random() * 8) + 1,
            viewsLastHour: Math.floor(Math.random() * 15) + 5,
            activeCountries: [
              { country: 'Chile', activeUsers: Math.floor(Math.random() * 5) + 1 },
              { country: 'Argentina', activeUsers: Math.floor(Math.random() * 3) },
              { country: 'Peru', activeUsers: Math.floor(Math.random() * 2) }
            ].filter(c => c.activeUsers > 0)
          }
        } : null);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [cardId, selectedPeriod]);

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'desktop': return <Monitor className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center">
        <p className="text-gray-500">No se pudieron cargar las métricas</p>
      </div>
    );
  }

  const metricCards: MetricCard[] = [
    {
      title: 'Vistas Totales',
      value: analytics.overview.totalViews.toLocaleString(),
      trend: analytics.overview.viewsTrend,
      icon: <Eye className="w-5 h-5" />,
      color: 'text-blue-600'
    },
    {
      title: 'Contactos Guardados',
      value: analytics.overview.totalContacts.toLocaleString(),
      trend: analytics.overview.contactsTrend,
      icon: <Users className="w-5 h-5" />,
      color: 'text-green-600'
    },
    {
      title: 'Clicks Sociales',
      value: analytics.overview.totalSocial.toLocaleString(),
      trend: '+5.2%',
      icon: <Share2 className="w-5 h-5" />,
      color: 'text-purple-600'
    },
    {
      title: 'Tasa de Conversión',
      value: `${analytics.overview.conversionRate}%`,
      trend: '+2.1%',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
          <p className="text-gray-500">Métricas de tu tarjeta digital</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-600 font-medium">
            {analytics.realtimeData.activeVisitors} visitantes activos
          </span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className={`${metric.color}`}>
                {metric.icon}
              </span>
              <span className={`text-sm font-medium ${metric.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {metric.trend}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h3>
            <p className="text-sm text-gray-500">{metric.title}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Views Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Vistas Diarias</h3>
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-sm border-gray-300 rounded-md"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
            </select>
          </div>
          
          <div className="space-y-3">
            {analytics.dailyData.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(day.views / 35) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{day.views}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fuentes de Tráfico</h3>
          <div className="space-y-3">
            {analytics.trafficSources.map((source, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{source.source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{source.percentage}%</span>
                  <span className="text-sm font-medium text-gray-900">{source.visits}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dispositivos</h3>
          <div className="space-y-3">
            {analytics.deviceStats.map((device, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getDeviceIcon(device.device)}
                  <span className="text-sm text-gray-700">{device.device}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{device.visits}</div>
                  <div className="text-xs text-gray-500">{device.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Activity */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Tiempo Real
          </h3>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {analytics.realtimeData.activeVisitors}
              </div>
              <div className="text-sm text-gray-500">Visitantes activos</div>
            </div>
            
            <div className="text-center">
              <div className="text-xl font-semibold text-blue-600">
                {analytics.realtimeData.viewsLastHour}
              </div>
              <div className="text-sm text-gray-500">Vistas última hora</div>
            </div>
          </div>
        </div>

        {/* Active Countries */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Países Activos</h3>
          <div className="space-y-3">
            {analytics.realtimeData.activeCountries.length > 0 ? (
              analytics.realtimeData.activeCountries.map((country, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{country.country}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {country.activeUsers} activos
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No hay visitantes activos ahora</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;