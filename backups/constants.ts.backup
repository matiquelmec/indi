import { Theme, DigitalCard, AnalyticsData, CustomThemeConfig } from './types';
import { 
  Briefcase, 
  Stethoscope, 
  Scale, 
  TrendingUp, 
  Palette, 
  Gem
} from 'lucide-react';

export const THEMES: Theme[] = [
  {
    id: 'emerald',
    name: 'Emerald Professional',
    colors: {
      primary: '#059669',
      secondary: '#10b981',
      accent: '#34d399',
      background: 'bg-slate-900',
      text: '#ffffff'
    },
    gradient: 'from-emerald-900 via-slate-900 to-emerald-900',
    particleColor: '#10b981'
  },
  {
    id: 'corporate',
    name: 'Corporate Executive',
    colors: {
      primary: '#2563eb',
      secondary: '#3b82f6',
      accent: '#60a5fa',
      background: 'bg-slate-900',
      text: '#ffffff'
    },
    gradient: 'from-blue-900 via-slate-900 to-blue-900',
    particleColor: '#3b82f6'
  },
  {
    id: 'medical',
    name: 'Medical Trust',
    colors: {
      primary: '#0ea5e9',
      secondary: '#38bdf8',
      accent: '#7dd3fc',
      background: 'bg-slate-50',
      text: '#0f172a'
    },
    gradient: 'from-cyan-900 via-slate-900 to-cyan-900',
    particleColor: '#38bdf8'
  },
  {
    id: 'legal',
    name: 'Legal Authority',
    colors: {
      primary: '#b45309',
      secondary: '#d97706',
      accent: '#f59e0b',
      background: 'bg-slate-900',
      text: '#ffffff'
    },
    gradient: 'from-amber-900 via-slate-900 to-stone-900',
    particleColor: '#d97706'
  },
  {
    id: 'financial',
    name: 'Financial Gold',
    colors: {
      primary: '#eab308',
      secondary: '#facc15',
      accent: '#fde047',
      background: 'bg-slate-900',
      text: '#ffffff'
    },
    gradient: 'from-yellow-900 via-slate-900 to-yellow-900',
    particleColor: '#facc15'
  },
  {
    id: 'creative',
    name: 'Creative Energy',
    colors: {
      primary: '#db2777',
      secondary: '#ec4899',
      accent: '#f472b6',
      background: 'bg-slate-900',
      text: '#ffffff'
    },
    gradient: 'from-pink-900 via-purple-900 to-pink-900',
    particleColor: '#ec4899'
  }
];

export const PRESET_THEMES: { id: string; name: string; config: CustomThemeConfig }[] = [
  {
    id: 'noir',
    name: 'Noir Elite',
    config: {
      brandColor: '#d4af37', // Gold
      atmosphere: 'midnight',
      layout: 'modern'
    }
  },
  {
    id: 'swiss',
    name: 'Swiss Minimal',
    config: {
      brandColor: '#ef4444', // Red
      atmosphere: 'clean',
      layout: 'modern'
    }
  },
  {
    id: 'tech',
    name: 'Neo Tech',
    config: {
      brandColor: '#06b6d4', // Cyan
      atmosphere: 'glass',
      layout: 'modern'
    }
  },
  {
    id: 'corporate',
    name: 'Trust Corp',
    config: {
      brandColor: '#1e40af', // Deep Blue
      atmosphere: 'clean',
      layout: 'centered'
    }
  },
  {
    id: 'eco',
    name: 'Eco Zen',
    config: {
      brandColor: '#15803d', // Green
      atmosphere: 'clean',
      layout: 'centered'
    }
  },
  {
    id: 'berry',
    name: 'Berry Creative',
    config: {
      brandColor: '#be185d', // Pink
      atmosphere: 'glass',
      layout: 'centered'
    }
  }
];

export const INITIAL_CARD: DigitalCard = {
  id: '1',
  firstName: 'Elena',
  lastName: 'Castillo',
  title: 'Psicóloga Clínica',
  company: 'Mente & Equilibrio',
  bio: 'Especialista en terapia cognitivo-conductual y manejo de ansiedad. Acompaño a mis pacientes en su proceso de transformación personal y bienestar emocional con un enfoque empático y profesional.',
  email: 'draelena@ejemplo.com',
  phone: '+56 9 1234 5678',
  location: 'Santiago, Chile',
  avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&h=400',
  themeId: 'medical',
  themeConfig: {
    brandColor: '#0d9488', // Teal/Turquoise for calmness
    atmosphere: 'clean',
    layout: 'centered'
  },
  socialLinks: [
    { id: '1', platform: 'linkedin', url: 'https://linkedin.com', label: 'LinkedIn', active: true },
    { id: '2', platform: 'whatsapp', url: 'https://wa.me/123456789', label: 'Agendar Cita', active: true },
    { id: '3', platform: 'instagram', url: 'https://instagram.com', label: 'Instagram', active: true },
    { id: '4', platform: 'website', url: 'https://ejemplo.com', label: 'Sitio Web', active: true }
  ]
};

export const MOCK_ANALYTICS: AnalyticsData[] = [
  { date: 'Mon', views: 45, clicks: 12, contacts: 3 },
  { date: 'Tue', views: 52, clicks: 15, contacts: 5 },
  { date: 'Wed', views: 38, clicks: 8, contacts: 2 },
  { date: 'Thu', views: 65, clicks: 22, contacts: 8 },
  { date: 'Fri', views: 89, clicks: 28, contacts: 12 },
  { date: 'Sat', views: 42, clicks: 10, contacts: 4 },
  { date: 'Sun', views: 35, clicks: 5, contacts: 1 }
];

export const THEME_ICONS = {
  emerald: Gem,
  corporate: Briefcase,
  medical: Stethoscope,
  legal: Scale,
  financial: TrendingUp,
  creative: Palette
};