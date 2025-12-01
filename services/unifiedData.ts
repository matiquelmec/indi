/**
 * Unified Data Service
 * Automatically routes to real or demo data service based on app configuration
 */

import { appConfig } from './appConfig';
import { supabaseDataService } from './supabaseData';
import { storageService } from './storageService';
import { DigitalCard } from '../types';

/**
 * Demo Data Service (uses localStorage)
 */
const demoDataService = {
  async getCards(): Promise<DigitalCard[]> {
    return storageService.getCards();
  },

  async getCard(id: string): Promise<DigitalCard | null> {
    const cards = storageService.getCards();
    return cards.find(c => c.id === id) || null;
  },

  async createCard(card: Partial<DigitalCard>): Promise<DigitalCard> {
    const newCard = {
      ...card,
      id: card.id || crypto.randomUUID(),
      userId: 'demo-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as DigitalCard;

    storageService.saveCard(newCard);
    return newCard;
  },

  async updateCard(card: DigitalCard): Promise<DigitalCard> {
    const updatedCard = {
      ...card,
      updatedAt: new Date().toISOString()
    };

    storageService.saveCard(updatedCard);
    return updatedCard;
  },

  async deleteCard(id: string): Promise<boolean> {
    storageService.deleteCard(id);
    return true;
  }
};

/**
 * Unified Data Service that automatically chooses the correct implementation
 */
export const unifiedDataService = appConfig.isRealMode ? supabaseDataService : demoDataService;

/**
 * Enhanced data service with mode awareness
 */
export const dataService = {
  ...unifiedDataService,

  /**
   * Get app mode information
   */
  getMode: () => appConfig,

  /**
   * Check if we're in demo mode
   */
  isDemoMode: () => appConfig.isDemoMode,

  /**
   * Check if we're in real mode
   */
  isRealMode: () => appConfig.isRealMode,

  /**
   * Get mode display name
   */
  getModeDisplayName: () => appConfig.isDemoMode ? 'Demo Storage' : 'Supabase Database'
};

console.log('📦 Data Service:', {
  mode: appConfig.mode,
  service: dataService.getModeDisplayName()
});