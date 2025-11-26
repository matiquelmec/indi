/**
 * Unified Authentication Service
 * Automatically routes to real or mock auth based on app configuration
 */

import { appConfig } from './appConfig';
import { supabaseAuthService } from './supabaseAuth';
import { mockAuthService } from './mockAuth';

/**
 * Unified Auth Service that automatically chooses the correct implementation
 */
export const unifiedAuthService = appConfig.isRealMode ? supabaseAuthService : mockAuthService;

/**
 * Enhanced auth service with mode awareness
 */
export const authService = {
  ...unifiedAuthService,

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
  getModeDisplayName: () => appConfig.isDemoMode ? 'Demo Mode' : 'Real Authentication'
};

// Log the selected auth mode
console.log(`🔐 Auth Service Initialized: ${authService.getModeDisplayName()}`);

export default authService;