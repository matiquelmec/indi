/**
 * Smart Cache Manager
 * Intelligent caching system with automatic invalidation and versioning
 */

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  version: string;
  ttl: number; // Time to live in milliseconds
  etag?: string;
}

export interface CacheConfig {
  defaultTTL: number;
  maxMemoryEntries: number;
  useLocalStorage: boolean;
  keyPrefix: string;
}

export class CacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private version: string;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxMemoryEntries: 100,
      useLocalStorage: true,
      keyPrefix: 'indi_cache_',
      ...config
    };

    // Generate version based on timestamp and random component
    this.version = this.generateVersion();

    // Clean up old cache entries on initialization
    this.cleanup();

    console.log('📦 CacheManager initialized with version:', this.version);
  }

  /**
   * Generate cache version for busting
   */
  private generateVersion(): string {
    const timestamp = Math.floor(Date.now() / (1000 * 60 * 10)); // Change every 10 minutes
    const random = Math.random().toString(36).substring(2, 8);
    return `v${timestamp}_${random}`;
  }

  /**
   * Get cache key with prefix and version
   */
  private getCacheKey(key: string): string {
    return `${this.config.keyPrefix}${this.version}_${key}`;
  }

  /**
   * Set data in cache with TTL and versioning
   */
  set<T>(key: string, data: T, ttl?: number, etag?: string): void {
    const cacheKey = this.getCacheKey(key);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: this.version,
      ttl: ttl || this.config.defaultTTL,
      etag
    };

    // Store in memory cache
    this.memoryCache.set(cacheKey, entry);

    // Store in localStorage if enabled
    if (this.config.useLocalStorage) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(entry));
      } catch (error) {
        console.warn('📦 localStorage cache failed:', error);
      }
    }

    // Cleanup if memory cache is too large
    if (this.memoryCache.size > this.config.maxMemoryEntries) {
      this.cleanup();
    }

    console.log(`📦 Cached: ${key} (TTL: ${entry.ttl}ms)`);
  }

  /**
   * Get data from cache with validation
   */
  get<T>(key: string): T | null {
    const cacheKey = this.getCacheKey(key);

    // Try memory cache first (fastest)
    let entry = this.memoryCache.get(cacheKey) as CacheEntry<T>;

    // Fallback to localStorage
    if (!entry && this.config.useLocalStorage) {
      try {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
          entry = JSON.parse(stored);
          // Restore to memory cache
          this.memoryCache.set(cacheKey, entry);
        }
      } catch (error) {
        console.warn('📦 localStorage retrieval failed:', error);
      }
    }

    if (!entry) {
      console.log(`📦 Cache miss: ${key}`);
      return null;
    }

    // Check if expired
    const now = Date.now();
    const isExpired = (now - entry.timestamp) > entry.ttl;

    // Check if version matches (cache busting)
    const isVersionValid = entry.version === this.version;

    if (isExpired || !isVersionValid) {
      console.log(`📦 Cache expired/invalid: ${key} (expired: ${isExpired}, version: ${!isVersionValid})`);
      this.delete(key);
      return null;
    }

    console.log(`📦 Cache hit: ${key}`);
    return entry.data;
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): void {
    const cacheKey = this.getCacheKey(key);
    this.memoryCache.delete(cacheKey);

    if (this.config.useLocalStorage) {
      try {
        localStorage.removeItem(cacheKey);
      } catch (error) {
        console.warn('📦 localStorage delete failed:', error);
      }
    }
  }

  /**
   * Check if cache entry exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    console.log('📦 Clearing all cache');
    this.memoryCache.clear();

    if (this.config.useLocalStorage) {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(this.config.keyPrefix)) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('📦 localStorage clear failed:', error);
      }
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    // Cleanup memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      const isExpired = (now - entry.timestamp) > entry.ttl;
      const isVersionValid = entry.version === this.version;

      if (isExpired || !isVersionValid) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    // Cleanup localStorage
    if (this.config.useLocalStorage) {
      try {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key.startsWith(this.config.keyPrefix)) {
            try {
              const stored = localStorage.getItem(key);
              if (stored) {
                const entry = JSON.parse(stored);
                const isExpired = (now - entry.timestamp) > entry.ttl;
                const isVersionValid = entry.version === this.version;

                if (isExpired || !isVersionValid) {
                  localStorage.removeItem(key);
                  cleaned++;
                }
              }
            } catch {
              // Remove invalid entries
              localStorage.removeItem(key);
              cleaned++;
            }
          }
        }
      } catch (error) {
        console.warn('📦 localStorage cleanup failed:', error);
      }
    }

    if (cleaned > 0) {
      console.log(`📦 Cleaned up ${cleaned} expired cache entries`);
    }
  }

  /**
   * Invalidate cache by pattern (useful for related data)
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    let invalidated = 0;

    // Invalidate memory cache
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
        invalidated++;
      }
    }

    // Invalidate localStorage
    if (this.config.useLocalStorage) {
      try {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key.startsWith(this.config.keyPrefix) && regex.test(key)) {
            localStorage.removeItem(key);
            invalidated++;
          }
        }
      } catch (error) {
        console.warn('📦 Pattern invalidation failed:', error);
      }
    }

    console.log(`📦 Invalidated ${invalidated} entries matching pattern: ${pattern}`);
  }

  /**
   * Force cache version update (global cache bust)
   */
  bustCache(): void {
    console.log('💥 Cache busted - generating new version');
    this.version = this.generateVersion();
    this.cleanup(); // Remove old version entries
  }

  /**
   * Get cache statistics
   */
  getStats(): { memoryEntries: number; version: string; keyPrefix: string } {
    return {
      memoryEntries: this.memoryCache.size,
      version: this.version,
      keyPrefix: this.config.keyPrefix
    };
  }

  /**
   * Cache wrapper for async functions
   */
  async wrap<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
    forceRefresh = false
  ): Promise<T> {
    // Return cached data if available and not forcing refresh
    if (!forceRefresh) {
      const cached = this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    }

    // Fetch fresh data
    console.log(`📦 Fetching fresh data for: ${key}`);
    try {
      const data = await fetcher();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      // If fetch fails, try to return stale cached data
      const stale = this.get<T>(key);
      if (stale !== null) {
        console.warn(`📦 Using stale cache for: ${key} due to fetch error`);
        return stale;
      }
      throw error;
    }
  }
}

// Singleton instance for analytics
export const analyticsCache = new CacheManager({
  defaultTTL: 2 * 60 * 1000, // 2 minutes for analytics
  maxMemoryEntries: 50,
  useLocalStorage: true,
  keyPrefix: 'indi_analytics_'
});

// General purpose cache
export const appCache = new CacheManager({
  defaultTTL: 10 * 60 * 1000, // 10 minutes for general data
  maxMemoryEntries: 200,
  useLocalStorage: true,
  keyPrefix: 'indi_app_'
});