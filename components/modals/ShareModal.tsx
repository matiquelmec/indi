import React, { useState } from 'react';
import { X, Copy, Check, Download, Share2, ExternalLink } from 'lucide-react';
import { Language } from '../../types';
import { translations } from '../../lib/i18n';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  onOpenLive: () => void;
  language: Language;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, url, onOpenLive, language }) => {
  const [copied, setCopied] = useState(false);
  const t = translations[language].share;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenLive = () => {
    onClose();
    onOpenLive();
  };

  // Generate QR Code URL (using a reliable placeholder API for demo purposes)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&color=0f172a`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-emerald-900/20 overflow-hidden transform transition-all animate-slide-up">
        
        {/* Header */}
        <div className="relative bg-gradient-to-br from-emerald-600 to-teal-600 p-8 text-center">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-100 hover:text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center mb-4 shadow-xl">
            <Check size={32} className="text-emerald-600 stroke-[3]" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-1">{t.title}</h2>
          <p className="text-emerald-100 text-sm">{t.subtitle}</p>
        </div>

        <div className="p-6 space-y-6">
          
          {/* QR Code Section */}
          <div className="flex flex-col items-center justify-center">
            <div className="bg-white p-4 rounded-xl shadow-inner mb-4">
              <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40 mix-blend-multiply" />
            </div>
            <p className="text-slate-400 text-xs text-center">{t.scan}</p>
          </div>

          {/* Link Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.publicLink}</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-300 text-sm font-mono truncate">
                {url}
              </div>
              <button 
                onClick={handleCopy}
                className={`px-4 rounded-lg font-medium transition-all border flex items-center justify-center gap-2 ${
                  copied 
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                }`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors border border-slate-700">
               <Download size={16} /> {t.saveQr}
            </button>
            <button 
              onClick={handleOpenLive}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors shadow-lg shadow-emerald-600/20"
            >
               <ExternalLink size={16} /> {t.openPublic}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ShareModal;