import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Share2,
  ExternalLink,
  Smartphone,
  QrCode,
  Sparkles,
  Zap,
  Globe,
  Link2,
  MessageCircle,
  Mail,
  Twitter,
  Linkedin,
  Send
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'link' | 'qr' | 'social'>('link');
  const [isAnimating, setIsAnimating] = useState(false);
  const t = translations[language].share;

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setActiveTab('link');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);

    // Haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenLive = () => {
    onClose();
    onOpenLive();
  };

  // Generate QR Code URL with custom styling
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&color=10b981&bgcolor=020617`;

  // Social share URLs
  const shareUrls = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`Check out my digital card: ${url}`)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my digital card`)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent('Check out my digital card')}`,
    email: `mailto:?subject=${encodeURIComponent('My Digital Card')}&body=${encodeURIComponent(`Check out my digital card: ${url}`)}`
  };

  const handleSocialShare = (platform: keyof typeof shareUrls) => {
    window.open(shareUrls[platform], '_blank', 'width=600,height=400');

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = 'my-digital-card-qr.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-y-auto">
      {/* Animated Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl transition-all duration-500"
        onClick={onClose}
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        </div>
      </div>

      {/* Modal Content - Glass Morphism Design */}
      <div className={`relative w-full max-w-lg transform transition-all duration-700 ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-emerald-900/30 overflow-hidden">

          {/* Animated Header with Gradient */}
          <div className="relative p-8 pb-4 overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-teal-600/20 to-blue-600/20">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239CA3AF" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl p-2 transition-all duration-200 hover:rotate-90"
            >
              <X size={20} />
            </button>

            {/* Success Animation */}
            <div className="relative z-10 text-center">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-emerald-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full mx-auto flex items-center justify-center shadow-2xl transform hover:rotate-12 transition-transform">
                  <Sparkles size={32} className="text-white" />
                </div>
              </div>

              <h2 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                {t.title}
              </h2>
              <p className="text-slate-400 text-sm">{t.subtitle}</p>
            </div>

            {/* Modern Tab Navigation */}
            <div className="flex gap-2 mt-6 p-1 bg-slate-800/50 rounded-2xl backdrop-blur-sm">
              <button
                onClick={() => setActiveTab('link')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-300 ${
                  activeTab === 'link'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Link2 size={16} />
                <span className="hidden sm:inline">Link</span>
              </button>
              <button
                onClick={() => setActiveTab('qr')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-300 ${
                  activeTab === 'qr'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <QrCode size={16} />
                <span className="hidden sm:inline">QR Code</span>
              </button>
              <button
                onClick={() => setActiveTab('social')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-300 ${
                  activeTab === 'social'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Share2 size={16} />
                <span className="hidden sm:inline">Social</span>
              </button>
            </div>
          </div>

          <div className="p-6 pt-2">
            {/* Link Tab Content */}
            {activeTab === 'link' && (
              <div className="space-y-4 animate-fade-in">
                <div className="relative">
                  <div className="flex gap-2 p-1 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50">
                    <div className="flex-1 px-4 py-3 text-slate-300 text-sm font-mono truncate">
                      {url}
                    </div>
                    <button
                      onClick={handleCopy}
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                        copied
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                          : 'bg-slate-700 hover:bg-slate-600 text-white'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check size={18} className="animate-scale-in" />
                          <span className="hidden sm:inline">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={18} />
                          <span className="hidden sm:inline">Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {copied && (
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs rounded-full animate-bounce">
                      Link copied to clipboard! ✨
                    </div>
                  )}
                </div>

                {/* Quick Share Options */}
                <div className="grid grid-cols-2 gap-3 mt-12">
                  <button
                    onClick={handleOpenLive}
                    className="group relative overflow-hidden flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105 active:scale-95"
                  >
                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    <ExternalLink size={18} />
                    <span>Open Live</span>
                  </button>

                  <button
                    onClick={() => handleSocialShare('whatsapp')}
                    className="group relative overflow-hidden flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-green-600 text-white font-medium transition-all duration-300 hover:shadow-xl hover:shadow-green-500/30 hover:scale-105 active:scale-95"
                  >
                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    <MessageCircle size={18} />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            )}

            {/* QR Tab Content */}
            {activeTab === 'qr' && (
              <div className="space-y-4 animate-fade-in">
                <div className="relative flex flex-col items-center">
                  {/* Animated QR Container */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity animate-pulse"></div>
                    <div className="relative bg-slate-950 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-sm">
                      <div className="bg-white p-4 rounded-2xl">
                        <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 sm:w-56 sm:h-56" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-slate-300 text-sm flex items-center justify-center gap-2">
                      <Smartphone size={16} className="text-emerald-400" />
                      Scan with your phone camera
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownloadQR}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all duration-300 border border-slate-700 hover:border-emerald-500/50 group"
                >
                  <Download size={18} className="group-hover:animate-bounce" />
                  Download QR Code
                </button>
              </div>
            )}

            {/* Social Tab Content */}
            {activeTab === 'social' && (
              <div className="space-y-4 animate-fade-in">
                <p className="text-center text-slate-400 text-sm mb-4">
                  Share your digital card on social media
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSocialShare('whatsapp')}
                    className="group flex items-center justify-center gap-3 p-4 rounded-2xl bg-green-600/10 hover:bg-green-600 border border-green-600/30 hover:border-green-500 text-green-400 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <MessageCircle size={20} />
                    <span className="font-medium">WhatsApp</span>
                  </button>

                  <button
                    onClick={() => handleSocialShare('linkedin')}
                    className="group flex items-center justify-center gap-3 p-4 rounded-2xl bg-blue-600/10 hover:bg-blue-600 border border-blue-600/30 hover:border-blue-500 text-blue-400 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <Linkedin size={20} />
                    <span className="font-medium">LinkedIn</span>
                  </button>

                  <button
                    onClick={() => handleSocialShare('twitter')}
                    className="group flex items-center justify-center gap-3 p-4 rounded-2xl bg-sky-600/10 hover:bg-sky-600 border border-sky-600/30 hover:border-sky-500 text-sky-400 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <Twitter size={20} />
                    <span className="font-medium">Twitter</span>
                  </button>

                  <button
                    onClick={() => handleSocialShare('telegram')}
                    className="group flex items-center justify-center gap-3 p-4 rounded-2xl bg-cyan-600/10 hover:bg-cyan-600 border border-cyan-600/30 hover:border-cyan-500 text-cyan-400 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <Send size={20} />
                    <span className="font-medium">Telegram</span>
                  </button>
                </div>

                <button
                  onClick={() => handleSocialShare('email')}
                  className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 text-white transition-all duration-300 group"
                >
                  <Mail size={20} className="group-hover:animate-pulse" />
                  <span className="font-medium">Send via Email</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer with Animation */}
          <div className="p-6 pt-0">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Globe size={14} className="text-emerald-400" />
              <span>Your card is live and ready to share</span>
              <Zap size={14} className="text-yellow-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;