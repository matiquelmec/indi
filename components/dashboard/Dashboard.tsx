import React from 'react';
import { DigitalCard, Language } from '../../types';
import { 
  Plus, 
  MoreVertical, 
  Edit3, 
  Eye, 
  Trash2, 
  Globe, 
  Clock, 
  BarChart3,
  CreditCard,
  Crown,
  AlertTriangle
} from 'lucide-react';
import Analytics from './Analytics';
import { MOCK_ANALYTICS } from '../../constants';
import { translations } from '../../lib/i18n';

interface DashboardProps {
  cards: DigitalCard[];
  onCreateNew: () => void;
  onEdit: (card: DigitalCard) => void;
  onDelete: (id: string) => void;
  onViewLive: (card: DigitalCard) => void;
  language: Language;
  onUpgrade: (card: DigitalCard) => void; // New prop for upgrade flow
}

const Dashboard: React.FC<DashboardProps> = ({ 
  cards, 
  onCreateNew, 
  onEdit, 
  onDelete, 
  onViewLive,
  language,
  onUpgrade
}) => {
  const t = translations[language].dashboard;
  
  return (
    <div className="w-full max-w-6xl mx-auto space-y-10 animate-fade-in pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-3">{t.title}</h1>
          <p className="text-slate-400 max-w-md">
            {t.subtitle}
          </p>
        </div>
        <button 
          onClick={onCreateNew}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 group"
        >
          <div className="bg-white/20 p-1 rounded-md group-hover:bg-white/30 transition-colors">
             <Plus size={18} />
          </div>
          <span>{t.createNew}</span>
        </button>
      </div>

      {/* Cards Grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
           <CreditCard className="text-emerald-400" size={24} />
           {t.yourCards}
        </h2>
        
        {cards.length === 0 ? (
          <div className="bg-slate-900/50 border border-dashed border-slate-700 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
             <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <CreditCard className="text-slate-600" size={40} />
             </div>
             <h3 className="text-xl font-semibold text-white mb-2">{t.noCards}</h3>
             <p className="text-slate-400 mb-6">{t.startBuilding}</p>
             <button onClick={onCreateNew} className="text-emerald-400 hover:text-emerald-300 font-medium">{t.createFirst} &rarr;</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => (
              <CardItem 
                key={card.id} 
                card={card} 
                onEdit={() => onEdit(card)} 
                onDelete={() => onDelete(card.id)}
                onView={() => onViewLive(card)}
                onUpgrade={() => onUpgrade(card)}
                t={t}
              />
            ))}
            
            {/* Quick Create Card Button in Grid */}
            <button 
              onClick={onCreateNew}
              className="group flex flex-col items-center justify-center gap-4 bg-slate-900/30 border border-dashed border-slate-700 hover:border-emerald-500/50 hover:bg-slate-900/60 rounded-3xl min-h-[280px] transition-all"
            >
              <div className="w-16 h-16 rounded-full bg-slate-800 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 text-slate-500 flex items-center justify-center transition-all shadow-xl">
                <Plus size={32} />
              </div>
              <span className="font-semibold text-slate-400 group-hover:text-white">{t.createNew}</span>
            </button>
          </div>
        )}
      </div>

      {/* Analytics Summary */}
      <div className="space-y-6 pt-8 border-t border-slate-800/50">
         <h2 className="text-xl font-bold text-white flex items-center gap-2">
           <BarChart3 className="text-blue-400" size={24} />
           {t.performance}
        </h2>
        <Analytics data={MOCK_ANALYTICS} language={language} />
      </div>
    </div>
  );
};

interface CardItemProps { 
  card: DigitalCard; 
  onEdit: () => void; 
  onDelete: () => void;
  onView: () => void;
  onUpgrade: () => void;
  t: any;
}

const CardItem: React.FC<CardItemProps> = ({ card, onEdit, onDelete, onView, onUpgrade, t }) => {
  const brandColor = card.themeConfig?.brandColor || '#10b981';
  
  // Subscription Logic
  const status = card.subscriptionStatus || 'trialing'; // Default to trial if new
  const now = Date.now();
  const trialEnds = card.trialEndsAt || (now + 7 * 86400000);
  const daysLeft = Math.ceil((trialEnds - now) / (1000 * 60 * 60 * 24));
  const isExpired = status === 'expired' || (status === 'trialing' && daysLeft <= 0);

  return (
    <div className={`group relative bg-slate-900 border ${isExpired ? 'border-red-900/50' : 'border-slate-800'} hover:border-slate-600 rounded-3xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-black/50 flex flex-col isolate`}>
      
      {/* Card Header / Preview Area */}
      <div 
        className="h-32 relative overflow-hidden"
        style={{ 
           background: isExpired 
             ? 'linear-gradient(135deg, #450a0a, #1a0606)' 
             : `linear-gradient(135deg, ${brandColor}, ${brandColor}44)` 
        }}
      >
         <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]"></div>
         {/* Abstract shapes */}
         <div className="absolute -right-4 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
         <div className="absolute left-8 bottom-[-20px] w-24 h-24 bg-black/20 rounded-full blur-xl"></div>
         
         {/* Status Badge */}
         <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-10">
            {/* Published Badge */}
            {card.isPublished && (
                 <div className="px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                    {t.published}
                 </div>
            )}
            
            {/* Subscription Badge */}
            {status === 'active' ? (
                 <div className="px-2.5 py-1 rounded-full bg-amber-500/90 text-slate-900 text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                    <Crown size={10} fill="currentColor" /> {t.subscription.proActive}
                 </div>
            ) : isExpired ? (
                 <div className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 animate-pulse">
                    <AlertTriangle size={10} fill="currentColor" /> {t.subscription.expired}
                 </div>
            ) : (
                 <div className="px-2.5 py-1 rounded-full bg-blue-600/90 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                    <Clock size={10} /> {daysLeft} {t.subscription.daysLeft}
                 </div>
            )}
         </div>
      </div>

      {/* Card Body */}
      <div className="p-6 pt-0 flex-1 flex flex-col relative z-10">
         <div className="flex justify-between items-start mb-4">
             {/* Avatar sticking up */}
             <div className="-mt-10 relative z-20">
                <img 
                  src={card.avatarUrl} 
                  alt="Profile" 
                  className={`w-20 h-20 rounded-2xl object-cover border-4 border-slate-900 shadow-xl bg-slate-800 ${isExpired ? 'grayscale opacity-75' : ''}`}
                />
             </div>
         </div>

         <div className="mb-6">
           <h3 className="text-xl font-bold text-white leading-tight mb-1 truncate">
             {card.firstName || 'Untitled'} {card.lastName}
           </h3>
           <p className="text-sm text-emerald-400 font-medium truncate mb-0.5">{card.title || 'No Title'}</p>
           <p className="text-xs text-slate-500 truncate">{card.company || 'No Company'}</p>
         </div>

         {/* Trial / Upgrade Banner (If not Active) */}
         {status !== 'active' && (
             <div className="mb-4">
                <button 
                  onClick={onUpgrade}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-400 group-hover:text-emerald-300"
                >
                   <Crown size={14} /> {t.actions.upgrade}
                </button>
             </div>
         )}

         {/* Footer Actions - Elevated Z-Index and Solid Background to ensure clickable */}
         <div className="mt-auto grid grid-cols-3 gap-2 border-t border-slate-800 pt-4 relative z-50 bg-slate-900">
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onView();
              }}
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors py-2 rounded-lg hover:bg-slate-800 cursor-pointer"
              title={t.actions.preview}
            >
               <Eye size={18} />
               <span className="text-[10px] font-medium uppercase">{t.actions.preview}</span>
            </button>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }}
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors py-2 rounded-lg hover:bg-slate-800 cursor-pointer"
              title={t.actions.edit}
            >
               <Edit3 size={18} />
               <span className="text-[10px] font-medium uppercase">{t.actions.edit}</span>
            </button>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if(window.confirm(t.actions.deleteConfirm)) {
                   onDelete();
                }
              }}
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-400 transition-colors py-2 rounded-lg hover:bg-slate-800 cursor-pointer"
              title={t.actions.delete}
            >
               <Trash2 size={18} />
               <span className="text-[10px] font-medium uppercase">{t.actions.delete}</span>
            </button>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;