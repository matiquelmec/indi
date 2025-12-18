/**
 * Analytics Service - Real-time Analytics Integration
 * Handles all analytics tracking and data fetching
 */

import { AnalyticsData } from '../types';
import { analyticsCache } from './cacheManager';
import { authService } from './unifiedAuth';

export interface AnalyticsOverview {
  totalCards: number;
  totalViews: number;
  todayViews: number;
  todayContacts: number;
  conversionRate: string;
}

export interface IndividualAnalytics {
  cardId: string;
  dailyStats: AnalyticsData[];
  totalViews: number;
  totalContacts: number;
}

export interface AnalyticsEvent {
  cardId: string;
  eventType: 'view' | 'contact_save' | 'social_click' | 'share' | 'qr_scan';
  metadata?: Record<string, any>;
}

// Robust API_BASE configuration for all environments
const API_BASE = (() => {
  // Check for various environment variables
  if (import.meta.env.VITE_API_URL) {
    console.log('📡 Using VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }

  // Production URLs based on environment
  if (import.meta.env.PROD) {
    console.log('🚀 Production mode - using indbackend.vercel.app');
    return 'https://indbackend.vercel.app/api';
  }

  // Development fallbacks
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('💻 Development mode - using localhost:5001');
      return 'http://localhost:5001/api';
    }
  }

  // Final fallback to production
  console.log('🔄 Fallback - using indbackend.vercel.app');
  return 'https://indbackend.vercel.app/api';
})();

class AnalyticsService {
  private trackingQueue: AnalyticsEvent[] = [];
  private isProcessing = false;

  // Update interval for real-time updates
  readonly UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

  // List of fallback API endpoints
  private readonly API_ENDPOINTS = [
    API_BASE, // Primary endpoint
    'https://indbackend.vercel.app/api', // Production fallback
    'http://localhost:5001/api' // Local fallback (if available)
  ];

  /**
   * Try multiple endpoints until one works
   */
  private async fetchWithFallback(path: string, options: RequestInit = {}): Promise<Response> {
    let lastError: Error | null = null;

    for (const endpoint of this.API_ENDPOINTS) {
      try {
        console.log(`🔄 Trying endpoint: ${endpoint}${path}`);

        const response = await fetch(`${endpoint}${path}`, {
          ...options
        });

        if (response.ok) {
          console.log(`✅ Success with endpoint: ${endpoint}`);
          return response;
        } else if (response.status < 500) {
          // Client error (4xx) - don't retry with other endpoints
          throw new Error(`Client error: ${response.status} - ${response.statusText}`);
        }
      } catch (error) {
        lastError = error as Error;
        console.warn(`❌ Failed endpoint ${endpoint}: ${error instanceof Error ? error.message : error}`);

        // If it's a client error, don't try other endpoints
        if (error instanceof Error && error.message.includes('Client error')) {
          throw error;
        }
      }
    }

    throw lastError || new Error('All API endpoints failed');
  }

  /**
   * Get dashboard overview analytics (all user cards)
   */
  async getDashboardOverview(): Promise<AnalyticsOverview> {
    return analyticsCache.wrap(
      'dashboard_overview',
      async () => {
        try {
          console.log('🔍 Fetching fresh dashboard overview analytics...');

          // Get token for auth
          const { session } = await authService.getCurrentSession();
          const token = session?.access_token || session?.token;

          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };

          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const response = await fetch(`${API_BASE}/analytics/dashboard/overview`, {
            method: 'GET',
            headers
          });

          if (!response.ok) {
            throw new Error(`Analytics API error: ${response.status} - ${response.statusText}`);
          }

          const data = await response.json();
          return data.overview;
        } catch (error) {
          console.error('⚠️ Analytics dashboard overview failed:', error);

          // Return zero state with graceful degradation
          return {
            totalCards: 0,
            totalViews: 0,
            todayViews: 0,
            todayContacts: 0,
            conversionRate: '0'
          };
        }
      },
      2 * 60 * 1000 // 2 minutes cache
    );
  }

  /**
   * Get analytics for specific card
   */
  async getCardAnalytics(cardId: string): Promise<IndividualAnalytics> {
    try {
      const response = await fetch(`${API_BASE}/analytics/individual/${cardId}`);
      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }
      const data = await response.json();

      // Transform daily stats to match frontend format
      const transformedData: AnalyticsData[] = data.dailyStats.map((stat: any) => ({
        date: this.formatDateForDisplay(stat.date),
        views: stat.views || 0,
        clicks: stat.contacts || 0,
        contacts: stat.social || 0
      }));

      return {
        cardId: data.cardId,
        dailyStats: transformedData,
        totalViews: data.totalViews,
        totalContacts: data.totalContacts
      };
    } catch (error) {
      console.error('Error fetching card analytics:', error);
      // Return zero state
      return {
        cardId,
        dailyStats: this.generateEmptyWeekData(),
        totalViews: 0,
        totalContacts: 0
      };
    }
  }

  /**
   * Get real-time chart data for last 7 days
   */
  async getChartData(cardId?: string): Promise<AnalyticsData[]> {
    const cacheKey = cardId ? `chart_data_${cardId}` : 'chart_data_all';

    return analyticsCache.wrap(
      cacheKey,
      async () => {
        try {
          if (cardId) {
            // Get individual card data
            console.log('🔍 Fetching individual card analytics:', cardId);
            const analytics = await this.getCardAnalytics(cardId);
            return analytics.dailyStats;
          } else {
            // Get aggregated data for all cards
            console.log('🔍 Fetching fresh chart data...');

            // Get token
            const { session } = await authService.getCurrentSession();
            const token = session?.access_token || session?.token;

            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
            };

            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE}/analytics/dashboard/chart`, {
              method: 'GET',
              headers
            });

            if (response.ok) {
              const data = await response.json();
              return data.chartData || this.generateEmptyWeekData();
            } else {
              throw new Error(`Chart data API error: ${response.status} - ${response.statusText}`);
            }
          }
        } catch (error) {
          console.error('⚠️ Chart data fetch failed:', error);
          return this.generateEmptyWeekData();
        }
      },
      90 * 1000 // 90 seconds cache for chart data (more frequent updates)
    );
  }

  /**
   * Track an analytics event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    // Add to queue for batch processing
    this.trackingQueue.push(event);

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processTrackingQueue();
    }
  }

  /**
   * Track card view (automatic when card is displayed)
   */
  async trackView(cardId: string, metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      cardId,
      eventType: 'view',
      metadata: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        ...metadata
      }
    });
  }

  /**
   * Track contact save (when user saves contact info)
   */
  async trackContactSave(cardId: string, platform?: string): Promise<void> {
    await this.trackEvent({
      cardId,
      eventType: 'contact_save',
      metadata: {
        platform,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Track social media click
   */
  async trackSocialClick(cardId: string, platform: string, url: string): Promise<void> {
    await this.trackEvent({
      cardId,
      eventType: 'social_click',
      metadata: {
        platform,
        url,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Track card share
   */
  async trackShare(cardId: string, method: string): Promise<void> {
    await this.trackEvent({
      cardId,
      eventType: 'share',
      metadata: {
        method,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Process tracking queue in batches
   */
  private async processTrackingQueue(): Promise<void> {
    if (this.isProcessing || this.trackingQueue.length === 0) return;

    this.isProcessing = true;

    try {
      // Process up to 10 events at once
      const batch = this.trackingQueue.splice(0, 10);

      for (const event of batch) {
        try {
          await fetch(`${API_BASE}/analytics/track`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(event)
          });
        } catch (error) {
          console.error('Failed to track event:', error);
          // Re-add failed event to queue for retry
          this.trackingQueue.unshift(event);
        }
      }
    } finally {
      this.isProcessing = false;

      // Process remaining queue if any
      if (this.trackingQueue.length > 0) {
        setTimeout(() => this.processTrackingQueue(), 1000);
      }
    }
  }

  /**
   * Generate empty week data for fallback
   */
  private generateEmptyWeekData(): AnalyticsData[] {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return days.map(day => ({
      date: day,
      views: 0,
      clicks: 0,
      contacts: 0
    }));
  }

  /**
   * Format date for chart display
   */
  private formatDateForDisplay(dateStr: string): string {
    const date = new Date(dateStr);
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[date.getDay()];
  }

  /**
   * Get real-time update interval (5 minutes)
   */
  static readonly UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

  /**
   * Invalidate analytics cache (call when cards change)
   */
  invalidateCache(): void {
    console.log('🗑️ Invalidating analytics cache');
    analyticsCache.invalidatePattern('.*'); // Clear all analytics cache
  }

  /**
   * Force refresh analytics data
   */
  async forceRefresh(): Promise<void> {
    console.log('🔄 Force refreshing analytics data');
    this.invalidateCache();

    // Trigger fresh data fetch
    await Promise.all([
      this.getDashboardOverview(),
      this.getChartData()
    ]);
  }

  /**
   * Bust cache and get fresh data (for debugging)
   */
  async bustCacheAndRefresh(): Promise<void> {
    console.log('💥 Cache bust and refresh');
    analyticsCache.bustCache();
    await this.forceRefresh();
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService();

// Auto-tracking utilities
export const useAutoTracking = (cardId: string) => {
  return {
    trackView: () => analyticsService.trackView(cardId),
    trackContact: (platform?: string) => analyticsService.trackContactSave(cardId, platform),
    trackSocial: (platform: string, url: string) => analyticsService.trackSocialClick(cardId, platform, url),
    trackShare: (method: string) => analyticsService.trackShare(cardId, method)
  };
};