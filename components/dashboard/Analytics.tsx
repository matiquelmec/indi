import React, { useState, useEffect } from 'react';
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
  Activity
} from 'lucide-react';
import { translations } from '../../lib/i18n';

interface AnalyticsProps {
  data: AnalyticsData[];
  language: Language;
  analyticsMode?: 'global' | 'individual';
  onAnalyticsModeChange?: (mode: 'global' | 'individual') => void;
  selectedAnalyticsCardId?: string | null;
  onAnalyticsCardSelect?: (cardId: string | null) => void;
  cards?: any[];
}

const Analytics: React.FC<AnalyticsProps> = ({
  data,
  language,
  analyticsMode = 'global',
  onAnalyticsModeChange,
  selectedAnalyticsCardId,
  onAnalyticsCardSelect,
  cards = []
}) => {
  const t = translations[language].analytics;
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      if (analyticsMode === 'individual' && !selectedAnalyticsCardId) {
        setAnalytics(null);
        return;
      }

      setIsLoading(true);
      try {
        if (analyticsMode === 'global') {
          const response = await fetch('http://localhost:5001/api/analytics/dashboard/overview');
          const data = await response.json();
          setAnalytics(data.overview);
        } else if (selectedAnalyticsCardId) {
          const response = await fetch(`http://localhost:5001/api/analytics/cards/${selectedAnalyticsCardId}/detailed`);
          const data = await response.json();
          setAnalytics(data.metrics);
        }
      } catch (error) {
        console.error('Error loading analytics:', error);
        // Fallback to mock data calculations
        const totalViews = data.reduce((acc, curr) => acc + curr.views, 0);
        const totalClicks = data.reduce((acc, curr) => acc + curr.clicks, 0);
        const conversionRate = ((totalClicks / totalViews) * 100).toFixed(1);
        setAnalytics({
          totalViews,
          totalContacts: totalClicks,
          totalSocial: Math.floor(totalClicks * 0.6),
          conversionRate: parseFloat(conversionRate)
        });
      }
      setIsLoading(false);
    };

    loadAnalytics();
  }, [analyticsMode, selectedAnalyticsCardId]);

  // Fallback calculations for backward compatibility
  const totalViews = analytics?.totalViews || data.reduce((acc, curr) => acc + curr.views, 0);
  const totalClicks = analytics?.totalContacts || data.reduce((acc, curr) => acc + curr.clicks, 0);
  const conversionRate = analytics?.conversionRate || ((totalClicks / totalViews) * 100).toFixed(1);

  // Translate the data keys (Days of week) for the chart
  const translatedData = data.map(item => ({
    ...item,
    displayDate: t.days[item.date] || item.date
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Analytics Mode Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/30 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-700/50 rounded-lg p-1">
            <button
              onClick={() => onAnalyticsModeChange?.('global')}
              className={`px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
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
              className={`px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
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
                className="flex items-center text-slate-400 hover:text-white text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver
              </button>
              <select
                value={selectedAnalyticsCardId || ''}
                onChange={(e) => onAnalyticsCardSelect?.(e.target.value || null)}
                className="bg-slate-700 border-slate-600 text-white rounded-md text-sm"
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
      </div>

      {/* Show analytics only if in global mode OR individual mode with selected card */}
      {(analyticsMode === 'global' || (analyticsMode === 'individual' && selectedAnalyticsCardId)) && !isLoading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Stat Cards */}
            <StatCard
              title="Vistas Totales"
              value={totalViews}
              icon={<Eye className="text-blue-400" />}
              trend="+12%"
            />
            <StatCard
              title="Contactos"
              value={totalClicks}
              icon={<Users className="text-emerald-400" />}
              trend="+5%"
            />
            <StatCard
              title="Redes Sociales"
              value={analytics?.totalSocial || 0}
              icon={<Share2 className="text-purple-400" />}
              trend="+8%"
            />
            <StatCard
              title="Conversión"
              value={`${conversionRate}%`}
              icon={<TrendingUp className="text-orange-400" />}
              trend="+2.1%"
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

const StatCard = ({ title, value, icon, trend }: { title: string, value: string | number, icon: React.ReactNode, trend: string }) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 backdrop-blur-sm hover:border-slate-600 transition-colors">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-700/50 rounded-lg">{icon}</div>
      <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">{trend}</span>
    </div>
    <div className="text-2xl font-bold text-white mb-1">{value}</div>
    <div className="text-sm text-slate-400">{title}</div>
  </div>
);

export default Analytics;