import React, { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Eye, 
  MousePointerClick, 
  TrendingUp, 
  Users, 
  Globe, 
  Smartphone,
  Monitor,
  Tablet,
  Activity,
  Clock,
  MapPin,
  Share2
} from 'lucide-react';

interface AdvancedAnalyticsProps {
  cardId?: string;
  language?: string;
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

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ 
  cardId = 'c3140e8f-999a-41ef-b755-1dc4519afb9e',
  language = 'es' 
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [isRealTimeActive, setIsRealTimeActive] = useState(true);

  // Colores para los gráficos
  const COLORS = {
    primary: '#3b82f6',
    success: '#10b981', 
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6'
  };

  const DEVICE_COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  // Mock data mejorado
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
    const loadAnalytics = async () => {
      setIsLoading(true);
      
      try {
        // Simular carga de API
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAnalytics(mockAnalytics);
      } catch (error) {
        console.error('Error loading analytics:', error);
        setAnalytics(mockAnalytics); // Fallback a mock data
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [cardId, selectedPeriod]);

  // Update real-time data every 30 seconds
  useEffect(() => {
    if (!isRealTimeActive) return;

    const interval = setInterval(() => {
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
    }, 30000);

    return () => clearInterval(interval);
  }, [isRealTimeActive]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

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
      <div className="space-y-6 animate-pulse">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-800/30 rounded-xl p-6">
              <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-slate-700 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No se pudieron cargar las métricas</p>
      </div>
    );
  }

  const chartData = analytics.dailyData.map(item => ({
    ...item,
    displayDate: formatDate(item.date)
  }));

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Análisis Detallado</h2>
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 ${isRealTimeActive ? 'text-green-400' : 'text-slate-400'}`} />
            <span className={`text-sm ${isRealTimeActive ? 'text-green-400' : 'text-slate-400'}`}>
              Tiempo Real {isRealTimeActive ? 'Activo' : 'Pausado'}
            </span>
            <button 
              onClick={() => setIsRealTimeActive(!isRealTimeActive)}
              className={`ml-2 px-2 py-1 rounded text-xs ${isRealTimeActive ? 'bg-green-600' : 'bg-slate-600'} text-white`}
            >
              {isRealTimeActive ? 'Pausar' : 'Activar'}
            </button>
          </div>
        </div>

        <select 
          value={selectedPeriod} 
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="bg-slate-800 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm"
        >
          <option value="7d">Últimos 7 días</option>
          <option value="30d">Últimos 30 días</option>
          <option value="90d">Últimos 90 días</option>
        </select>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Vistas Totales"
          value={analytics.overview.totalViews.toLocaleString()}
          trend={analytics.overview.viewsTrend}
          icon={<Eye className="w-5 h-5" />}
          color="text-blue-400"
          bgColor="bg-blue-500/10"
        />
        
        <MetricCard 
          title="Contactos Guardados"
          value={analytics.overview.totalContacts.toLocaleString()}
          trend={analytics.overview.contactsTrend}
          icon={<Users className="w-5 h-5" />}
          color="text-emerald-400"
          bgColor="bg-emerald-500/10"
        />
        
        <MetricCard 
          title="Clicks Sociales"
          value={analytics.overview.totalSocial.toLocaleString()}
          trend="+5.2%"
          icon={<Share2 className="w-5 h-5" />}
          color="text-purple-400"
          bgColor="bg-purple-500/10"
        />
        
        <MetricCard 
          title="Tasa de Conversión"
          value={`${analytics.overview.conversionRate}%`}
          trend="+2.1%"
          icon={<TrendingUp className="w-5 h-5" />}
          color="text-orange-400"
          bgColor="bg-orange-500/10"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Performance Chart */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AreaChart className="w-5 h-5 text-blue-400" />
            Rendimiento por Días
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorContacts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155', 
                    borderRadius: '8px',
                    color: '#f8fafc'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke={COLORS.primary} 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                  name="Vistas"
                />
                <Area 
                  type="monotone" 
                  dataKey="contactSaves" 
                  stroke={COLORS.success} 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorContacts)" 
                  name="Contactos"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Sources Chart */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            Fuentes de Tráfico
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.trafficSources} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis type="category" dataKey="source" stroke="#94a3b8" fontSize={12} width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155', 
                    borderRadius: '8px',
                    color: '#f8fafc'
                  }} 
                />
                <Bar dataKey="visits" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row - Real-time and Device Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Stats */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-purple-400" />
            Dispositivos
          </h3>
          <div className="space-y-4">
            {analytics.deviceStats.map((device, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-slate-700/50 text-slate-300`}>
                    {getDeviceIcon(device.device)}
                  </div>
                  <span className="text-white font-medium">{device.device}</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{device.visits}</div>
                  <div className="text-slate-400 text-sm">{device.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Activity */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Tiempo Real
          </h3>
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-400 mb-1">
                {analytics.realtimeData.activeVisitors}
              </div>
              <div className="text-slate-400 text-sm">Visitantes Activos</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {analytics.realtimeData.viewsLastHour}
              </div>
              <div className="text-slate-400 text-sm">Vistas Última Hora</div>
            </div>
          </div>
        </div>

        {/* Active Countries */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-400" />
            Países Activos
          </h3>
          <div className="space-y-3">
            {analytics.realtimeData.activeCountries.length > 0 ? (
              analytics.realtimeData.activeCountries.map((country, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-white">{country.country}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-slate-300 text-sm">{country.activeUsers}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay visitantes activos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  trend: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, trend, icon, color, bgColor }) => (
  <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${bgColor} ${color}`}>
        {icon}
      </div>
      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
        trend.startsWith('+') ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
      }`}>
        {trend}
      </span>
    </div>
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-sm text-slate-400">{title}</div>
  </div>
);

export default AdvancedAnalytics;