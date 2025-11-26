import React from 'react';
import { Language } from '../../types';
import { translations } from '../../lib/i18n';
import { Sparkles, ArrowRight, Zap, BarChart, Share2, ShieldCheck, Check } from 'lucide-react';
import CardPreview from '../preview/CardPreview';
import { INITIAL_CARD } from '../../constants';

interface LandingPageProps {
  language: Language;
  onStart: () => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ language, onStart, onLogin }) => {
  const t = translations[language].landing;
  const tPricing = translations[language].pricing;

  return (
    <div className="relative w-full overflow-hidden">
      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        
        {/* Text Content */}
        <div className="flex-1 text-center lg:text-left z-10 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-8">
            <Sparkles size={12} /> {t.hero.badge}
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight leading-tight mb-6">
            {language === 'es' ? (
              <>Tu Presentación <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Profesional</span>.</>
            ) : (
              <>Your Professional <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Identity</span>.</>
            )}
          </h1>
          
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            {t.hero.subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <button 
              onClick={onStart}
              className="px-8 py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-lg shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 flex items-center gap-2"
            >
              {t.hero.cta} <ArrowRight size={20} />
            </button>
            <button 
              onClick={onLogin}
              className="px-8 py-4 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-semibold text-lg border border-slate-700 transition-all"
            >
              {t.hero.secondaryCta}
            </button>
          </div>
        </div>

        {/* Visual Hero */}
        <div className="flex-1 relative w-full flex justify-center perspective-1000">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 blur-[100px] rounded-full"></div>
          <div className="relative transform rotate-y-12 rotate-z-6 hover:rotate-y-0 hover:rotate-z-0 transition-all duration-700 ease-out cursor-pointer">
             <div className="scale-75 sm:scale-90 origin-center pointer-events-none select-none">
                <CardPreview card={INITIAL_CARD} mode="preview" language={language} />
             </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 bg-slate-900/50 border-y border-slate-800">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-bold text-white mb-4">{t.features.title}</h2>
               <div className="h-1 w-20 bg-emerald-500 mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <FeatureCard 
                  icon={<Zap size={32} className="text-amber-400" />}
                  title={t.features.list[0].title}
                  desc={t.features.list[0].desc}
               />
               <FeatureCard 
                  icon={<BarChart size={32} className="text-blue-400" />}
                  title={t.features.list[1].title}
                  desc={t.features.list[1].desc}
               />
               <FeatureCard 
                  icon={<Share2 size={32} className="text-emerald-400" />}
                  title={t.features.list[2].title}
                  desc={t.features.list[2].desc}
               />
            </div>
         </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24 px-6 max-w-5xl mx-auto text-center">
         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider mb-6">
             {tPricing.secure}
         </div>
         <h2 className="text-4xl font-bold text-white mb-6">{tPricing.title}</h2>
         <p className="text-slate-400 max-w-xl mx-auto mb-12">{tPricing.subtitle}</p>

         <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden max-w-md mx-auto">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500"></div>
             
             <div className="text-5xl font-black text-white mb-2">{tPricing.price}</div>
             <div className="text-emerald-400 font-medium mb-8">{tPricing.period}</div>

             <ul className="space-y-4 mb-10 text-left">
                 {tPricing.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                       <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <Check size={12} className="text-emerald-400 stroke-[3]" />
                       </div>
                       <span className="text-slate-300">{f}</span>
                    </li>
                 ))}
             </ul>

             <button 
               onClick={onStart}
               className="w-full py-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-lg transition-colors"
             >
               {t.hero.cta}
             </button>
         </div>
      </div>
      
      {/* Footer */}
      <footer className="py-12 border-t border-slate-800 text-center text-slate-500 text-sm">
        <p>© 2024 INDI Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: any) => (
  <div className="bg-slate-800/40 border border-slate-700/50 p-8 rounded-2xl hover:bg-slate-800/60 transition-colors">
     <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
        {icon}
     </div>
     <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
     <p className="text-slate-400 leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;