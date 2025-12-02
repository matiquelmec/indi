import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { AnalyticsData, Language } from '../../types';
import {
  Eye,
  MousePointerClick,
  TrendingUp,
  BarChart3,
  ArrowLeft,
  Users,
  Share2,
  Activity,
  RefreshCw
} from 'lucide-react';
import { translations } from '../../lib/i18n';
import { analyticsService, AnalyticsOverview } from '../../services/analyticsService';

interface AnalyticsProps {
  data?: AnalyticsData[]; // Made optional - we'll fetch real data
  language: Language;
  analyticsMode?: 'global' | 'individual';
  onAnalyticsModeChange?: (mode: 'global' | 'individual') => void;
  selectedAnalyticsCardId?: string | null;
  onAnalyticsCardSelect?: (cardId: string | null) => void;
  cards?: any[];
}

const Analytics: React.FC<AnalyticsProps> = ({
  data: initialData,
  language,
  analyticsMode = 'global',
  onAnalyticsModeChange,
  selectedAnalyticsCardId,
  onAnalyticsCardSelect,
  cards = []
}) => {
  const t = translations[language].analytics;
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [chartData, setChartData] = useState<AnalyticsData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    if (analyticsMode === 'individual' && !selectedAnalyticsCardId) {
      setAnalytics(null);
      setChartData([]);
      return;
    }

    setIsLoading(true);
    try {
      if (analyticsMode === 'global') {
        // Load dashboard overview
        const overview = await analyticsService.getDashboardOverview();
        setAnalytics(overview);

        // Load chart data for all cards
        const chart = await analyticsService.getChartData();
        setChartData(chart);
      } else if (selectedAnalyticsCardId) {
        // Load individual card analytics
        const cardAnalytics = await analyticsService.getCardAnalytics(selectedAnalyticsCardId);

        setAnalytics({
          totalCards: 1,
          totalViews: cardAnalytics.totalViews,
          todayViews: cardAnalytics.totalViews, // Simplified for now
          todayContacts: cardAnalytics.totalContacts,
          conversionRate: cardAnalytics.totalViews > 0
            ? ((cardAnalytics.totalContacts / cardAnalytics.totalViews) * 100).toFixed(1)
            : '0'
        });

        setChartData(cardAnalytics.dailyStats);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Set zero values when API fails
      setAnalytics({
        totalCards: 0,
        totalViews: 0,
        todayViews: 0,
        todayContacts: 0,
        conversionRate: '0'
      });
      setChartData([]);
    }
    setIsLoading(false);
  }, [analyticsMode, selectedAnalyticsCardId]);

  // Refresh analytics data
  const refreshAnalytics = useCallback(async () => {
    setIsRefreshing(true);
    await loadAnalytics();
    setIsRefreshing(false);
  }, [loadAnalytics]);

  // Load data on mount and mode change
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Auto-refresh every 5 minutes for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (analyticsMode === 'global' || (analyticsMode === 'individual' && selectedAnalyticsCardId)) {
        refreshAnalytics();
      }
    }, analyticsService.UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [analyticsMode, selectedAnalyticsCardId, refreshAnalytics]);

  // Use analytics data directly, default to 0 if not available
  const totalViews = analytics?.totalViews || 0;
  const totalClicks = analytics?.todayContacts || 0;
  const totalSocial = Math.floor(totalClicks * 0.6); // Estimate social clicks
  const conversionRate = analytics?.conversionRate || '0';

  // Use real chart data or fallback to empty data
  const translatedData = chartData.length > 0 ? chartData : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Analytics Mode Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/30 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center gap-4">
          {/* Refresh Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={refreshAnalytics}
              disabled={isRefreshing}
              className={`flex items-center gap-2 px-4 py-3 md:px-3 md:py-2 rounded-lg text-sm transition-colors min-h-[48px] touch-manipulation ${
                isRefreshing
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white'
              }`}
              title="Actualizar datos (usa cache inteligente)"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Actualizando...' : 'Actualizar'}
            </button>

            <button
              onClick={async () => {
                setIsRefreshing(true);
                await analyticsService.bustCacheAndRefresh();
                await loadAnalytics();
                setIsRefreshing(false);
              }}
              disabled={isRefreshing}
              className={`flex items-center gap-2 px-4 py-3 md:px-3 md:py-2 rounded-lg text-sm transition-colors border min-h-[48px] touch-manipulation ${
                isRefreshing
                  ? 'bg-red-900/20 border-red-800 text-red-400 cursor-not-allowed'
                  : 'bg-red-900/20 border-red-800 hover:bg-red-900/40 text-red-400 hover:text-red-300'
              }`}
              title="Limpiar cache y obtener datos frescos"
            >
              💥 Cache Bust
            </button>
          </div>

          <div className="flex items-center bg-slate-700/50 rounded-lg p-1">
            <button
              onClick={() => onAnalyticsModeChange?.('global')}
              className={`px-4 py-3 md:px-3 md:py-2 text-sm rounded-md transition-colors flex items-center gap-2 min-h-[48px] touch-manipulation ${
                analyticsMode === 'global'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Globales
            </button>
            <button
              onClick={() => onAnalyticsModeChange?.('individual')}
              className={`px-4 py-3 md:px-3 md:py-2 text-sm rounded-md transition-colors flex items-center gap-2 min-h-[48px] touch-manipulation ${
                analyticsMode === 'individual'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" />
              Individual
            </button>
          </div>

          {analyticsMode === 'individual' && (
            <>
              <button
                onClick={() => onAnalyticsModeChange?.('global')}
                className="flex items-center text-slate-400 hover:text-white text-sm py-2 px-3 rounded-lg min-h-[48px] touch-manipulation"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver
              </button>
              <select
                value={selectedAnalyticsCardId || ''}
                onChange={(e) => onAnalyticsCardSelect?.(e.target.value || null)}
                className="bg-slate-700 border-slate-600 text-white rounded-md text-sm py-2 px-3 min-h-[48px] touch-manipulation"
              >
                <option value="">Seleccionar tarjeta...</option>
                {cards.filter(card => !card.isTemporary).map(card => (
                  <option key={card.id} value={card.id}>
                    {card.firstName} {card.lastName} - {card.title}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        {/* Last Update Info */}
        {lastUpdate && (
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Activity className="w-3 h-3" />
            Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
          </div>
        )}
      </div>

      {/* Show analytics only if in global mode OR individual mode with selected card */}
      {(analyticsMode === 'global' || (analyticsMode === 'individual' && selectedAnalyticsCardId)) && !isLoading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Stat Cards */}
            <StatCard
              title={analyticsMode === 'global' ? "Vistas Totales" : "Vistas de Tarjeta"}
              value={totalViews}
              icon={<Eye className="text-blue-400" />}
              trend="En tiempo real"
              subtitle={analyticsMode === 'global' ? "Todas las tarjetas" : "Esta tarjeta"}
            />
            <StatCard
              title="Contactos"
              value={totalClicks}
              icon={<Users className="text-emerald-400" />}
              trend="Hoy"
              subtitle="Información guardada"
            />
            <StatCard
              title="Redes Sociales"
              value={totalSocial}
              icon={<Share2 className="text-purple-400" />}
              trend="Estimado"
              subtitle="Clicks en enlaces"
            />
            <StatCard
              title="Conversión"
              value={`${conversionRate}%`}
              icon={<TrendingUp className="text-orange-400" />}
              trend="Tasa actual"
              subtitle="Contactos/Vistas"
            />
      </div>

      {/* Main Chart */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-6">{t.performanceOverview}</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={translatedData}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="displayDate" 
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  borderColor: '#334155', 
                  borderRadius: '8px', 
                  color: '#f8fafc' 
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="views" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorViews)" 
              />
              <Area 
                type="monotone" 
                dataKey="clicks" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorClicks)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
        </>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center">
          <div className="animate-pulse">
            <Activity className="w-8 h-8 text-emerald-400 mx-auto mb-4 animate-spin" />
            <p className="text-slate-400">Cargando analytics...</p>
          </div>
        </div>
      )}

      {/* No Card Selected State */}
      {analyticsMode === 'individual' && !selectedAnalyticsCardId && !isLoading && (
        <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-8 text-center">
          <Eye className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Selecciona una tarjeta</h3>
          <p className="text-slate-400">
            Elige una tarjeta del selector de arriba para ver sus estadísticas individuales
          </p>
        </div>
      )}
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  trend,
  subtitle
}: {
  title: string,
  value: string | number,
  icon: React.ReactNode,
  trend: string,
  subtitle?: string
}) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 backdrop-blur-sm hover:border-slate-600 transition-colors">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-700/50 rounded-lg">{icon}</div>
      <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">{trend}</span>
    </div>
    <div className="text-2xl font-bold text-white mb-1">{value}</div>
    <div className="text-sm text-slate-400">{title}</div>
    {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
  </div>
);

export default Analytics;