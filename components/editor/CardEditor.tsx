import React, { useState, useRef, useEffect } from 'react';
import { DigitalCard, SocialPlatform, SocialLink, CustomThemeConfig, Language } from '../../types';
import { 
  User, Briefcase, MapPin, Phone, Mail, Sparkles, Check, Camera, Upload, 
  Plus, Trash2, GripVertical, Linkedin, MessageCircle, Github, Globe, Youtube, Instagram, Twitter,
  Palette, Layout, Smartphone, Moon, Sun, Droplet, Save
} from 'lucide-react';
import { generateProfessionalBio } from '../../services/geminiService';
import { PRESET_THEMES } from '../../constants';
import { translations } from '../../lib/i18n';

interface CardEditorProps {
  card: DigitalCard;
  setCard: React.Dispatch<React.SetStateAction<DigitalCard>>;
  onPublish: () => void;
  isPublishing: boolean;
  onBack?: () => void; 
  language: Language;
}

const CardEditor: React.FC<CardEditorProps> = ({ card, setCard, onPublish, isPublishing, onBack, language }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'design' | 'social'>('details');
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const t = translations[language].editor;

  // Auto-save feedback visual
  useEffect(() => {
    setSaveStatus('saved');
    const timer = setTimeout(() => setSaveStatus('idle'), 2000);
    return () => clearTimeout(timer);
  }, [card]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCard(prev => ({ ...prev, [name]: value }));
  };

  const handleThemeConfigChange = (key: keyof CustomThemeConfig, value: any) => {
    setCard(prev => ({
      ...prev,
      themeConfig: {
        ...(prev.themeConfig || { brandColor: '#10b981', atmosphere: 'glass', layout: 'centered' }),
        [key]: value
      }
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCard(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleAiBio = async () => {
    if (!card.title || !card.company) {
      alert("Please enter a Title and Company first.");
      return;
    }
    setIsGeneratingBio(true);
    const newBio = await generateProfessionalBio(card.title, card.company, "Leadership, Design, Strategy");
    setCard(prev => ({ ...prev, bio: newBio }));
    setIsGeneratingBio(false);
  };

  // --- Social Link Logic ---

  const addSocialLink = () => {
    const newLink: SocialLink = {
      id: Date.now().toString(),
      platform: 'website',
      url: '',
      label: 'My Website',
      active: true
    };
    setCard(prev => ({ ...prev, socialLinks: [...prev.socialLinks, newLink] }));
  };

  const removeSocialLink = (id: string) => {
    setCard(prev => ({ 
      ...prev, 
      socialLinks: prev.socialLinks.filter(link => link.id !== id) 
    }));
  };

  const updateSocialLink = (id: string, field: keyof SocialLink, value: any) => {
    setCard(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.map(link => 
        link.id === id ? { ...link, [field]: value } : link
      )
    }));
  };

  const getPlatformIcon = (platform: SocialPlatform) => {
    switch(platform) {
      case 'linkedin': return <Linkedin size={16} />;
      case 'whatsapp': return <MessageCircle size={16} />;
      case 'github': return <Github size={16} />;
      case 'instagram': return <Instagram size={16} />;
      case 'twitter': return <Twitter size={16} />;
      case 'youtube': return <Youtube size={16} />;
      default: return <Globe size={16} />;
    }
  };

  const PLATFORMS: { value: SocialPlatform, label: string }[] = [
    { value: 'website', label: 'Website / Portfolio' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'twitter', label: 'X / Twitter' },
    { value: 'github', label: 'GitHub' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'email', label: 'Email Address' },
    { value: 'behance', label: 'Behance' },
    { value: 'dribbble', label: 'Dribbble' },
  ];

  const PRESET_COLORS = [
    '#10b981', '#2563eb', '#7c3aed', '#db2777', '#e11d48', '#ea580c', '#d97706', '#0f172a'
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header with Navigation & Publish */}
      <div className="relative flex justify-center items-center p-4 px-6 bg-slate-900/40 border-b border-slate-800 min-h-[72px]">
         
         {/* Left: Clean now (Navigation is in Main Header) */}
         <div className="absolute left-6 flex items-center">
            {/* Back button removed to avoid redundancy with top Navbar */}
         </div>

         {/* Center: Tabs */}
         <div className="flex border border-slate-700 rounded-lg bg-slate-800/50 p-1 shadow-sm">
            <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')} label={t.tabs.profile} />
            <TabButton active={activeTab === 'design'} onClick={() => setActiveTab('design')} label={t.tabs.design} />
            <TabButton active={activeTab === 'social'} onClick={() => setActiveTab('social')} label={t.tabs.links} />
         </div>

         {/* Right: Actions */}
         <div className="absolute right-6 flex items-center gap-3">
           <div className="text-xs font-medium text-slate-500 hidden xl:flex items-center gap-1.5 px-3">
             {saveStatus === 'saved' && <><Check size={12} className="text-emerald-500"/> {t.saved}</>}
             {saveStatus === 'idle' && ''}
           </div>
           
           <button 
             onClick={onPublish}
             disabled={isPublishing}
             className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-sm font-semibold rounded-lg shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
           >
              {isPublishing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">{t.publishing}</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span className="hidden sm:inline">{t.publish}</span>
                </>
              )}
           </button>
         </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700">
        
        {activeTab === 'details' && (
          <div className="space-y-6 max-w-lg mx-auto animate-fade-in">
            
            {/* Photo Upload */}
            <div className="flex items-center gap-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="relative group shrink-0">
                <img 
                  src={card.avatarUrl} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-600 shadow-lg group-hover:opacity-75 transition-opacity"
                />
                <button 
                  onClick={triggerFileInput}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera size={20} className="text-white" />
                </button>
              </div>
              
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-1">{t.profile.photo}</h3>
                <p className="text-xs text-slate-400 mb-3">{t.profile.photoDesc}</p>
                <div className="flex gap-3">
                  <button 
                    onClick={triggerFileInput}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg transition-colors border border-slate-600"
                  >
                    <Upload size={14} />
                    {t.profile.upload}
                  </button>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputGroup label={t.profile.firstName} name="firstName" value={card.firstName} onChange={handleInputChange} icon={<User size={16}/>} />
              <InputGroup label={t.profile.lastName} name="lastName" value={card.lastName} onChange={handleInputChange} />
            </div>
            
            <InputGroup label={t.profile.jobTitle} name="title" value={card.title} onChange={handleInputChange} icon={<Briefcase size={16}/>} />
            <InputGroup label={t.profile.company} name="company" value={card.company} onChange={handleInputChange} />
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-300">{t.profile.bio}</label>
                <button 
                  onClick={handleAiBio}
                  disabled={isGeneratingBio}
                  className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20"
                >
                  <Sparkles size={12} />
                  {isGeneratingBio ? t.profile.aiThinking : t.profile.aiButton}
                </button>
              </div>
              <textarea
                name="bio"
                value={card.bio}
                onChange={handleInputChange}
                rows={4}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm resize-none"
                placeholder="Brief summary about yourself..."
              />
            </div>

            <div className="border-t border-slate-700 pt-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t.profile.contactGroup}</h3>
              <InputGroup label={t.profile.email} name="email" value={card.email} onChange={handleInputChange} icon={<Mail size={16}/>} />
              <InputGroup label={t.profile.phone} name="phone" value={card.phone} onChange={handleInputChange} icon={<Phone size={16}/>} />
              <InputGroup label={t.profile.location} name="location" value={card.location} onChange={handleInputChange} icon={<MapPin size={16}/>} />
            </div>
          </div>
        )}

        {activeTab === 'design' && (
          <div className="space-y-8 max-w-lg mx-auto animate-fade-in">
            
            {/* Themes Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-amber-400" size={20} />
                <h3 className="text-lg font-bold text-white">{t.design.themes}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {PRESET_THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => setCard(prev => ({ ...prev, themeConfig: theme.config }))}
                    className="group relative overflow-hidden rounded-xl border border-slate-700 hover:border-emerald-500 transition-all text-left"
                  >
                    {/* Preview Gradient */}
                    <div 
                      className="h-16 w-full"
                      style={{ 
                        background: theme.config.atmosphere === 'clean' 
                          ? '#f8fafc' 
                          : theme.config.atmosphere === 'midnight' 
                            ? '#020617' 
                            : `linear-gradient(135deg, ${theme.config.brandColor}aa, #0f172a)` 
                      }}
                    >
                        {/* Accent Line */}
                        <div className="h-full w-full flex items-center justify-center opacity-30">
                          <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.config.brandColor }}></div>
                        </div>
                    </div>
                    <div className="p-3 bg-slate-800">
                      <div className="font-semibold text-sm text-slate-200 group-hover:text-emerald-400 transition-colors">{theme.name}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{theme.config.atmosphere} • {theme.config.layout}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full h-px bg-slate-800"></div>

            {/* Color Palette Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="text-emerald-500" size={20} />
                <h3 className="text-lg font-bold text-white">{t.design.brand}</h3>
              </div>
              
              <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 block">{t.design.brandDesc}</label>
                
                <div className="flex flex-wrap gap-3 mb-5">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => handleThemeConfigChange('brandColor', color)}
                      className={`w-8 h-8 rounded-full transition-transform hover:scale-110 border-2 ${
                        card.themeConfig?.brandColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  
                  {/* Custom Color Input Wrapper */}
                  <div className="relative group">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[2px] cursor-pointer hover:scale-110 transition-transform">
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                          <Plus size={14} className="text-white" />
                        </div>
                     </div>
                     <input 
                      type="color" 
                      value={card.themeConfig?.brandColor}
                      onChange={(e) => handleThemeConfigChange('brandColor', e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                  <span className="text-sm text-slate-400 font-mono">{card.themeConfig?.brandColor}</span>
                  <div className="w-12 h-6 rounded-md shadow-sm" style={{ backgroundColor: card.themeConfig?.brandColor }}></div>
                </div>
              </div>
            </div>

            {/* Atmosphere Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Droplet className="text-blue-500" size={20} />
                <h3 className="text-lg font-bold text-white">{t.design.atmosphere}</h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <AtmosphereOption 
                  id="glass"
                  label="Glass"
                  icon={<Smartphone size={18} />}
                  current={card.themeConfig?.atmosphere}
                  onClick={() => handleThemeConfigChange('atmosphere', 'glass')}
                  description="Modern blur"
                />
                <AtmosphereOption 
                  id="midnight"
                  label="Midnight"
                  icon={<Moon size={18} />}
                  current={card.themeConfig?.atmosphere}
                  onClick={() => handleThemeConfigChange('atmosphere', 'midnight')}
                  description="Deep dark"
                />
                <AtmosphereOption 
                  id="clean"
                  label="Clean"
                  icon={<Sun size={18} />}
                  current={card.themeConfig?.atmosphere}
                  onClick={() => handleThemeConfigChange('atmosphere', 'clean')}
                  description="Minimal light"
                />
              </div>
            </div>

            {/* Layout Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Layout className="text-purple-500" size={20} />
                <h3 className="text-lg font-bold text-white">{t.design.layout}</h3>
              </div>

               <div className="grid grid-cols-1 gap-3">
                <LayoutOption 
                   id="modern"
                   label="Modern Card"
                   current={card.themeConfig?.layout}
                   onClick={() => handleThemeConfigChange('layout', 'modern')}
                />
                <LayoutOption 
                   id="centered"
                   label="Centered Profile"
                   current={card.themeConfig?.layout}
                   onClick={() => handleThemeConfigChange('layout', 'centered')}
                />
               </div>
            </div>

          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-6 max-w-lg mx-auto animate-fade-in">
             <div className="flex items-center justify-between">
               <h3 className="text-sm font-bold text-slate-200">{t.links.title}</h3>
               <button 
                onClick={addSocialLink}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition-colors"
               >
                 <Plus size={14} /> {t.links.add}
               </button>
             </div>

             <div className="space-y-3">
               {card.socialLinks.length === 0 && (
                 <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-xl">
                   <p className="text-slate-500 text-sm">{t.links.empty}</p>
                   <p className="text-slate-600 text-xs">{t.links.emptyDesc}</p>
                 </div>
               )}

               {card.socialLinks.map((link) => (
                 <div key={link.id} className="group flex items-start gap-3 bg-slate-800/50 border border-slate-700 p-3 rounded-xl hover:border-slate-600 transition-colors">
                    <div className="mt-2 text-slate-500 cursor-move">
                      <GripVertical size={16} />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex gap-3">
                         <div className="w-1/2">
                           <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">{t.links.platform}</label>
                           <div className="relative">
                              <select 
                                value={link.platform}
                                onChange={(e) => updateSocialLink(link.id, 'platform', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-2 text-xs text-white appearance-none focus:ring-1 focus:ring-emerald-500"
                              >
                                {PLATFORMS.map(p => (
                                  <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                              </select>
                              <div className="absolute left-3 top-2 text-slate-400 pointer-events-none">
                                {getPlatformIcon(link.platform)}
                              </div>
                           </div>
                         </div>
                         <div className="w-1/2">
                           <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">{t.links.label}</label>
                           <input 
                              type="text"
                              value={link.label}
                              onChange={(e) => updateSocialLink(link.id, 'label', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:ring-1 focus:ring-emerald-500"
                              placeholder="e.g. My Portfolio"
                           />
                         </div>
                      </div>
                      
                      <div>
                        <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">{t.links.url}</label>
                        <input 
                            type="text"
                            value={link.url}
                            onChange={(e) => updateSocialLink(link.id, 'url', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-xs text-emerald-400 font-mono focus:ring-1 focus:ring-emerald-500 placeholder-slate-700"
                            placeholder="https://..."
                          />
                      </div>
                    </div>

                    <button 
                      onClick={() => removeSocialLink(link.id)}
                      className="mt-2 text-slate-600 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                 </div>
               ))}
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

// UI Components for Design Tab
const AtmosphereOption = ({ id, label, icon, current, onClick, description }: any) => {
  const isSelected = current === id;
  return (
    <button 
      onClick={onClick}
      className={`relative p-3 rounded-xl border text-left transition-all ${
        isSelected 
          ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500' 
          : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
      }`}
    >
      <div className={`mb-2 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>{icon}</div>
      <div className="font-semibold text-sm text-slate-200">{label}</div>
      <div className="text-[10px] text-slate-500">{description}</div>
    </button>
  );
};

const LayoutOption = ({ id, label, current, onClick }: any) => {
  const isSelected = current === id;
  return (
    <button 
      onClick={onClick}
      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
        isSelected 
          ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500' 
          : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
      }`}
    >
      <span className="text-sm font-medium text-slate-200">{label}</span>
      {isSelected && <Check size={16} className="text-emerald-500" />}
    </button>
  );
};

// Simplified Tab Button for local use
const TabButton = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
      active ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
    }`}
  >
    {label}
  </button>
);

const InputGroup = ({ label, name, value, onChange, icon }: any) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-slate-400 ml-1">{label}</label>
    <div className="relative">
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2.5 px-4 pl-10 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
      />
      <div className="absolute left-3 top-2.5 text-slate-500">
        {icon || <span className="w-4 h-4 block"></span>}
      </div>
    </div>
  </div>
);

export default CardEditor;