/**
 * Cache Service for optimizing API calls
 * Implements memory cache with TTL and localStorage fallback
 */

import logger from '../lib/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    // Try memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValid(memoryEntry)) {
      logger.debug(`Cache hit (memory): ${key}`);
      return memoryEntry.data as T;
    }

    // Try localStorage as fallback
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (this.isValid(entry)) {
          logger.debug(`Cache hit (localStorage): ${key}`);
          // Restore to memory cache
          this.memoryCache.set(key, entry);
          return entry.data;
        }
      }
    } catch (error) {
      logger.warn(`Failed to read from localStorage cache: ${key}`, error);
    }

    logger.debug(`Cache miss: ${key}`);
    return null;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    // Store in memory
    this.memoryCache.set(key, entry);

    // Store in localStorage as backup
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
      logger.debug(`Cached: ${key}`);
    } catch (error) {
      logger.warn(`Failed to write to localStorage cache: ${key}`, error);
      // If localStorage is full, clear old cache entries
      this.clearLocalStorageCache();
    }
  }

  /**
   * Remove specific entry from cache
   */
  remove(key: string): void {
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(`cache_${key}`);
      logger.debug(`Cache removed: ${key}`);
    } catch (error) {
      logger.warn(`Failed to remove from localStorage cache: ${key}`, error);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear();
    this.clearLocalStorageCache();
    logger.info('Cache cleared');
  }

  /**
   * Clear pattern-matching keys
   */
  clearPattern(pattern: string): void {
    // Clear from memory cache
    const keysToDelete: string[] = [];
    this.memoryCache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.memoryCache.delete(key));

    // Clear from localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_') && key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      logger.warn('Failed to clear pattern from localStorage cache', error);
    }
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Clear old cache entries from localStorage
   */
  private clearLocalStorageCache(): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));

      const now = Date.now();
      let cleared = 0;

      cacheKeys.forEach(key => {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const entry = JSON.parse(stored);
            if (!this.isValid(entry)) {
              localStorage.removeItem(key);
              cleared++;
            }
          }
        } catch (e) {
          // Remove corrupted entries
          localStorage.removeItem(key);
          cleared++;
        }
      });

      if (cleared > 0) {
        logger.debug(`Cleared ${cleared} expired cache entries from localStorage`);
      }
    } catch (error) {
      logger.warn('Failed to clear localStorage cache', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { memorySize: number; localStorageKeys: number } {
    const localStorageKeys = Object.keys(localStorage).filter(key =>
      key.startsWith('cache_')
    ).length;

    return {
      memorySize: this.memoryCache.size,
      localStorageKeys
    };
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Clean up expired entries on startup
setTimeout(() => {
  const stats = cacheService.getStats();
  logger.debug('Cache service initialized', stats);
}, 0);

export default cacheService;

/**
 * Cache decorator for async functions
 */
export function withCache<T>(
  key: string | ((args: any[]) => string),
  ttl?: number
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = typeof key === 'function' ? key(args) : key;

      // Try to get from cache
      const cached = cacheService.get<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Call original method
      const result = await originalMethod.apply(this, args);

      // Store in cache
      if (result !== null && result !== undefined) {
        cacheService.set(cacheKey, result, ttl);
      }

      return result;
    };

    return descriptor;
  };
}