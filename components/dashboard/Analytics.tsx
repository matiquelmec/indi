import React from 'react';
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
import { Eye, MousePointerClick, TrendingUp } from 'lucide-react';
import { translations } from '../../lib/i18n';

interface AnalyticsProps {
  data: AnalyticsData[];
  language: Language;
}

const Analytics: React.FC<AnalyticsProps> = ({ data, language }) => {
  const t = translations[language].analytics;

  const totalViews = data.reduce((acc, curr) => acc + curr.views, 0);
  const totalClicks = data.reduce((acc, curr) => acc + curr.clicks, 0);
  const conversionRate = ((totalClicks / totalViews) * 100).toFixed(1);

  // Translate the data keys (Days of week) for the chart
  const translatedData = data.map(item => ({
    ...item,
    displayDate: t.days[item.date] || item.date
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat Cards */}
        <StatCard 
          title={t.totalViews} 
          value={totalViews} 
          icon={<Eye className="text-blue-400" />} 
          trend="+12%" 
        />
        <StatCard 
          title={t.totalInteractions} 
          value={totalClicks} 
          icon={<MousePointerClick className="text-emerald-400" />} 
          trend="+5%" 
        />
        <StatCard 
          title={t.conversionRate} 
          value={`${conversionRate}%`} 
          icon={<TrendingUp className="text-purple-400" />} 
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