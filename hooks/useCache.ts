import { useState, useEffect, useCallback } from 'react';
import cacheService from '../services/cacheService';
import logger from '../lib/logger';

interface UseCacheOptions {
  ttl?: number;
  refetchOnMount?: boolean;
  refetchInterval?: number;
}

interface UseCacheResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

/**
 * Custom hook for cached data fetching
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
): UseCacheResult<T> {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    refetchOnMount = false,
    refetchInterval
  } = options;

  const [data, setData] = useState<T | null>(() => cacheService.get<T>(key));
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (force = false) => {
    try {
      // Check cache first unless forced
      if (!force) {
        const cached = cacheService.get<T>(key);
        if (cached !== null) {
          setData(cached);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);

      const result = await fetcher();

      // Update cache and state
      cacheService.set(key, result, ttl);
      setData(result);
      setError(null);
    } catch (err) {
      const error = err as Error;
      logger.error(`Failed to fetch data for key: ${key}`, error);
      setError(error);

      // Try to use stale data if available
      const staleData = cacheService.get<T>(key);
      if (staleData) {
        logger.info(`Using stale data for key: ${key}`);
        setData(staleData);
      }
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  // Initial fetch
  useEffect(() => {
    if (refetchOnMount || !data) {
      fetchData();
    }
  }, []);

  // Refetch interval
  useEffect(() => {
    if (refetchInterval && refetchInterval > 0) {
      const interval = setInterval(() => {
        fetchData(true);
      }, refetchInterval);

      return () => clearInterval(interval);
    }
  }, [refetchInterval, fetchData]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const invalidate = useCallback(() => {
    cacheService.remove(key);
    setData(null);
  }, [key]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate
  };
}

/**
 * Hook for manual cache management
 */
export function useCacheManager() {
  const set = useCallback(<T>(key: string, data: T, ttl?: number) => {
    cacheService.set(key, data, ttl);
  }, []);

  const get = useCallback(<T>(key: string): T | null => {
    return cacheService.get<T>(key);
  }, []);

  const remove = useCallback((key: string) => {
    cacheService.remove(key);
  }, []);

  const clear = useCallback(() => {
    cacheService.clear();
  }, []);

  const clearPattern = useCallback((pattern: string) => {
    cacheService.clearPattern(pattern);
  }, []);

  return {
    set,
    get,
    remove,
    clear,
    clearPattern,
    stats: cacheService.getStats()
  };
}