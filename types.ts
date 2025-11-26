export type ThemeId = 'emerald' | 'corporate' | 'medical' | 'legal' | 'financial' | 'creative';

export interface Theme {
  id: ThemeId;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  gradient: string;
  particleColor: string;
}

export type SocialPlatform = 'linkedin' | 'whatsapp' | 'instagram' | 'twitter' | 'github' | 'youtube' | 'website' | 'email' | 'behance' | 'dribbble';

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  label: string;
  active: boolean;
}

export interface CustomThemeConfig {
  brandColor: string;
  atmosphere: 'midnight' | 'glass' | 'clean';
  layout: 'modern' | 'centered' | 'classic';
}

export type SubscriptionStatus = 'trialing' | 'active' | 'expired';

export interface DigitalCard {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  bio: string;
  email: string;
  phone: string;
  location: string;
  avatarUrl: string;
  themeId: ThemeId; // Kept for backward compat or presets
  themeConfig?: CustomThemeConfig; // New granular control
  socialLinks: SocialLink[];
  isPublished?: boolean;
  publishedUrl?: string;
  
  // Business Logic Fields
  subscriptionStatus?: SubscriptionStatus;
  trialEndsAt?: number; // Timestamp
  planType?: 'free' | 'pro';
}

export interface AnalyticsData {
  date: string;
  views: number;
  clicks: number;
  contacts: number;
}

export type Language = 'es' | 'en';

// Updated ViewState to support SaaS flow
export type ViewState = 'landing' | 'auth' | 'dashboard' | 'editor' | 'live';