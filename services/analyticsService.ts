/**
 * Analytics Service - Real-time Analytics Integration
 * Handles all analytics tracking and data fetching
 */

import { AnalyticsData } from '../types';

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

const API_BASE = import.meta.env.VITE_API_URL;

class AnalyticsService {
  private trackingQueue: AnalyticsEvent[] = [];
  private isProcessing = false;

  /**
   * Get dashboard overview analytics (all user cards)
   */
  async getDashboardOverview(): Promise<AnalyticsOverview> {
    try {
      const response = await fetch(`${API_BASE}/analytics/dashboard/overview`);
      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }
      const data = await response.json();
      return data.overview;
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      // Return zero state instead of mock data
      return {
        totalCards: 0,
        totalViews: 0,
        todayViews: 0,
        todayContacts: 0,
        conversionRate: '0'
      };
    }
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
    try {
      if (cardId) {
        // Get individual card data
        const analytics = await this.getCardAnalytics(cardId);
        return analytics.dailyStats;
      } else {
        // Get aggregated data for all cards
        const response = await fetch(`${API_BASE}/analytics/dashboard/chart`);
        if (response.ok) {
          const data = await response.json();
          return data.chartData || this.generateEmptyWeekData();
        }
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }

    return this.generateEmptyWeekData();
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