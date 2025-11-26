import React, { useState } from 'react';
import { X, Check, ShieldCheck, CreditCard, Sparkles } from 'lucide-react';
import { Language } from '../../types';
import { translations } from '../../lib/i18n';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  language: Language;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onSuccess, language }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const t = translations[language].pricing;

  if (!isOpen) return null;

  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate API/Gateway delay
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-md transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl shadow-emerald-900/40 overflow-hidden transform transition-all animate-slide-up">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-white/10 rounded-full p-2 transition-colors z-20"
        >
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 h-full">
            {/* Left/Top: Value Prop */}
            <div className="md:col-span-12 p-8 pt-10 text-center bg-gradient-to-b from-slate-900 to-slate-800">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold uppercase tracking-wider mb-4">
                  <Sparkles size={12} /> PRO Membership
               </div>
               
               <h2 className="text-3xl font-bold text-white mb-2">{t.title}</h2>
               <p className="text-slate-400 text-sm max-w-xs mx-auto mb-8">{t.subtitle}</p>

               {/* Pricing */}
               <div className="mb-8">
                  <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-black text-white tracking-tight">{t.price}</span>
                  </div>
                  <div className="text-emerald-400 font-medium text-sm mt-1">{t.period}</div>
               </div>

               {/* Features */}
               <div className="bg-slate-950/50 rounded-2xl p-6 border border-slate-800 text-left mb-8 max-w-sm mx-auto">
                   <ul className="space-y-3">
                       {t.features.map((feature, idx) => (
                           <li key={idx} className="flex items-start gap-3">
                               <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                   <Check size={12} className="text-emerald-400 stroke-[3]" />
                               </div>
                               <span className="text-sm text-slate-300">{feature}</span>
                           </li>
                       ))}
                   </ul>
               </div>

               {/* CTA */}
               <button 
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full max-w-sm py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-lg shadow-xl shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
               >
                 {isProcessing ? (
                     <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {t.processing}
                     </>
                 ) : (
                     <>
                        <CreditCard size={20} />
                        {t.cta}
                     </>
                 )}
               </button>

               <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-500">
                   <ShieldCheck size={12} />
                   {t.secure}
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;