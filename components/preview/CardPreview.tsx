import React, { useMemo } from 'react';
import { DigitalCard, Language } from '../../types';
import { generatePalette } from '../../lib/colorUtils';
import { downloadVCard } from '../../lib/vcardUtils';
import { translations } from '../../lib/i18n';
import { 
  Linkedin, 
  MessageCircle, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Share2,
  Briefcase,
  Github,
  Youtube,
  Instagram,
  Twitter,
  ExternalLink
} from 'lucide-react';

interface CardPreviewProps {
  card: DigitalCard;
  scale?: number;
  mode?: 'preview' | 'live'; // 'preview' includes bezel, 'live' is full screen
  language?: Language;
}

const CardPreview: React.FC<CardPreviewProps> = ({ card, scale = 1, mode = 'preview', language = 'es' }) => {
  // Determine configuration (fallback to defaults if partial)
  const config = card.themeConfig || {
    brandColor: '#10b981',
    atmosphere: 'glass',
    layout: 'centered'
  };

  const t = translations[language].preview;

  // Generate the smart palette
  const palette = useMemo(() => {
    return generatePalette(config.brandColor, config.atmosphere);
  }, [config.brandColor, config.atmosphere]);

  const getIcon = (platform: string) => {
    switch(platform) {
      case 'linkedin': return <Linkedin size={20} />;
      case 'whatsapp': return <MessageCircle size={20} />;
      case 'website': return <Globe size={20} />;
      case 'email': return <Mail size={20} />;
      case 'github': return <Github size={20} />;
      case 'instagram': return <Instagram size={20} />;
      case 'twitter': return <Twitter size={20} />;
      case 'youtube': return <Youtube size={20} />;
      default: return <ExternalLink size={20} />;
    }
  };

  // Layout Styles
  const isCentered = config.layout === 'centered';
  const isLive = mode === 'live';
  
  // Custom shadow for clean/light themes to ensure depth
  const cardShadow = config.atmosphere === 'clean' 
    ? 'shadow-2xl shadow-slate-300/60' 
    : 'shadow-sm';

  // --- Dynamic Styles based on Mode ---
  const containerStyle: React.CSSProperties = isLive 
    ? {
        width: '100%',
        minHeight: '100vh',
        backgroundColor: palette.colors.background,
        borderRadius: 0,
        transform: 'none'
      }
    : { 
        width: '375px', 
        height: '750px', 
        transform: `scale(${scale})`,
        backgroundColor: palette.colors.background,
        borderRadius: '3.5rem' // Matches rounded-[3.5rem]
      };

  const handleSaveContact = () => {
    downloadVCard(card);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${card.firstName} ${card.lastName}`,
          text: card.bio,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      alert('Sharing is not supported on this device/browser.');
    }
  };

  return (
    <div 
      className={`relative mx-auto origin-top transition-transform duration-300 overflow-hidden ${!isLive ? 'shadow-2xl' : ''}`}
      style={containerStyle}
    >
      {/* Phone Bezel - Only in Preview Mode */}
      {!isLive && (
        <div className="absolute inset-0 border-[10px] border-gray-800 rounded-[3.5rem] z-20 pointer-events-none"></div>
      )}
      
      {/* Screen Content */}
      <div className={`relative w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide`}>
        
        {/* Dynamic Background Gradient */}
        <div 
          className={`absolute top-0 left-0 w-full h-full transition-colors duration-500 ${palette.gradientStyle ? '' : palette.colors.background}`}
          style={palette.gradientStyle}
        ></div>

        {/* Dynamic Header Gradient (only for non-glass modes to create separation) */}
        {config.atmosphere !== 'glass' && (
           <div 
             className={`absolute top-0 left-0 w-full h-48 bg-gradient-to-b opacity-90 transition-all duration-500`}
             style={{ 
                background: `linear-gradient(to bottom, ${palette.colors.darkShade}, ${palette.colors.background})` 
             }}
           ></div>
        )}
        
        {/* Content Wrapper */}
        <div className={`relative z-10 min-h-full flex flex-col ${isLive ? 'max-w-md mx-auto shadow-2xl min-h-screen' : ''}`}>

          {/* Header Profile Section */}
          <div className={`pt-16 px-8 pb-6 flex flex-col ${isCentered ? 'items-center text-center' : 'items-start text-left'}`}>
            
            {/* Avatar */}
            <div className={`relative mb-5 group ${isCentered ? '' : 'flex items-center gap-5'}`}>
               <div className="relative">
                 <div 
                    className={`absolute -inset-0.5 rounded-full blur opacity-75 animate-pulse`} 
                    style={{ backgroundColor: palette.colors.secondary }}
                  ></div>
                  <img 
                    src={card.avatarUrl} 
                    alt="Profile" 
                    className="relative w-28 h-28 rounded-full object-cover border-4 shadow-xl"
                    style={{ borderColor: palette.colors.background }}
                  />
               </div>
            </div>

            {/* Text Info */}
            <h2 
              className="text-3xl font-bold mb-1.5 drop-shadow-md transition-colors"
              style={{ color: palette.colors.text }}
            >
              {card.firstName} {card.lastName}
            </h2>
            <p 
              className="text-base font-medium uppercase tracking-wider mb-8 transition-colors"
              style={{ color: palette.colors.secondary }}
            >
              {card.title}
            </p>

            {/* Quick Actions */}
            <div className={`flex gap-4 w-full ${isCentered ? 'justify-center' : 'justify-start'}`}>
              <button 
                onClick={handleShare}
                className="flex items-center justify-center w-14 h-14 rounded-full border transition-all hover:scale-105 active:scale-95"
                style={{ 
                  backgroundColor: palette.colors.surface, 
                  borderColor: palette.colors.surfaceBorder,
                  color: palette.colors.text
                }}
              >
                <Share2 size={22} />
              </button>
              <button 
                onClick={handleSaveContact}
                className="flex items-center justify-center flex-1 max-w-[220px] h-14 rounded-full font-bold shadow-lg transition-transform active:scale-95 text-lg"
                style={{ 
                  backgroundColor: palette.colors.primary, 
                  color: palette.colors.onPrimary
                }}
              >
                {t.saveContact}
              </button>
            </div>
          </div>

          {/* Info Card / Body */}
          <div className="flex-1 px-5 pb-14">
            <div 
              className={`backdrop-blur-xl border rounded-3xl p-7 transition-colors duration-500 ${cardShadow}`}
              style={{ 
                backgroundColor: palette.colors.surface,
                borderColor: palette.colors.surfaceBorder
              }}
            >
              
              {/* Bio */}
              <div className="mb-8">
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3" style={{ color: palette.colors.text }}>{t.about}</h3>
                <p className="text-base leading-relaxed opacity-90" style={{ color: palette.colors.text }}>
                  {card.bio}
                </p>
              </div>

              {/* Details List */}
              <div className="space-y-5 mb-10">
                <DetailRow icon={Briefcase} text={card.company} color={palette.colors.text} />
                <DetailRow icon={Mail} text={card.email} color={palette.colors.text} />
                <DetailRow icon={Phone} text={card.phone} color={palette.colors.text} />
                <DetailRow icon={MapPin} text={card.location} color={palette.colors.text} />
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3" style={{ color: palette.colors.text }}>{t.connect}</h3>
                {card.socialLinks.filter(l => l.active).map(link => (
                  <a 
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] group"
                    style={{ 
                      backgroundColor: palette.colors.surface,
                      borderColor: palette.colors.surfaceBorder
                    }}
                  >
                    <div className="flex items-center gap-4" style={{ color: palette.colors.text }}>
                      {getIcon(link.platform)}
                      <span className="text-base font-medium">{link.label}</span>
                    </div>
                    <div style={{ color: palette.colors.primary }}>
                      <Share2 size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </a>
                ))}
              </div>

            </div>
          </div>
          
          {/* Footer */}
          <div className="pb-8 w-full text-center opacity-30">
             <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: palette.colors.text }}>{t.poweredBy}</p>
          </div>

        </div>
      </div>
    </div>
  );
};

// Helper for Detail Rows
const DetailRow = ({ icon: Icon, text, color }: any) => {
  if (!text) return null;
  return (
    <div className="flex items-center gap-4 opacity-90" style={{ color }}>
      <Icon size={18} className="shrink-0 opacity-70" />
      <span className="text-base font-medium break-all">{text}</span>
    </div>
  );
};

export default CardPreview;