const redisClient = require('../cache/redisClient');

// Cache middleware for GET requests
function cacheMiddleware(options = {}) {
  const {
    ttl = redisClient.TTL?.MEDIUM || 300,
    keyPrefix = 'api',
    skipCache = false,
    cachePredicate = null, // Function to determine if response should be cached
    keyGenerator = null    // Custom key generator function
  } = options;

  return async (req, res, next) => {
    // Only cache GET requests unless specified otherwise
    if (req.method !== 'GET' || skipCache) {
      return next();
    }

    try {
      // Generate cache key
      let cacheKey;
      if (keyGenerator && typeof keyGenerator === 'function') {
        cacheKey = keyGenerator(req);
      } else {
        const keyParts = [
          keyPrefix,
          req.originalUrl || req.url,
          req.query ? JSON.stringify(req.query) : '',
          req.user?.id || 'anonymous'
        ].filter(Boolean);
        cacheKey = redisClient.generateKey(...keyParts);
      }

      // Try to get from cache
      const cachedResponse = await redisClient.get(cacheKey);

      if (cachedResponse) {
        console.log(`🎯 Cache HIT for key: ${cacheKey}`);

        // Set cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `public, max-age=${ttl}`
        });

        return res.status(cachedResponse.status || 200).json(cachedResponse.data);
      }

      console.log(`💨 Cache MISS for key: ${cacheKey}`);

      // Store original res.json method
      const originalJson = res.json.bind(res);

      // Override res.json to cache response
      res.json = function(body) {
        // Check if response should be cached
        const shouldCache = !cachePredicate || cachePredicate(req, res, body);
        const isSuccessStatus = res.statusCode >= 200 && res.statusCode < 300;

        if (shouldCache && isSuccessStatus) {
          // Cache the response
          const responseData = {
            status: res.statusCode,
            data: body,
            timestamp: new Date().toISOString()
          };

          redisClient.set(cacheKey, responseData, ttl).catch(error => {
            console.error(`❌ Failed to cache response for key ${cacheKey}:`, error.message);
          });

          console.log(`💾 Cached response for key: ${cacheKey} (TTL: ${ttl}s)`);
        }

        // Set cache headers
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey,
          'Cache-Control': shouldCache && isSuccessStatus ? `public, max-age=${ttl}` : 'no-cache'
        });

        return originalJson(body);
      };

      next();

    } catch (error) {
      console.error('❌ Cache middleware error:', error.message);
      // Continue without caching on error
      next();
    }
  };
}

// Cache invalidation middleware
function cacheInvalidationMiddleware(options = {}) {
  const { patterns = [], keyPrefix = 'api' } = options;

  return async (req, res, next) => {
    // Store original response methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    const invalidateCache = async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          // Invalidate specific patterns
          for (const pattern of patterns) {
            const keyPattern = pattern.includes(':') ? pattern : `${keyPrefix}:${pattern}*`;
            await redisClient.flushPattern(keyPattern);
            console.log(`🗑️  Invalidated cache pattern: ${keyPattern}`);
          }

          // Auto-invalidate user-specific cache if user exists
          if (req.user?.id) {
            const userPattern = `${keyPrefix}:*:${req.user.id}*`;
            await redisClient.flushPattern(userPattern);
            console.log(`🗑️  Invalidated user cache: ${userPattern}`);
          }

        } catch (error) {
          console.error('❌ Cache invalidation error:', error.message);
        }
      }
    };

    // Override response methods to trigger cache invalidation
    res.json = function(body) {
      const result = originalJson(body);
      invalidateCache();
      return result;
    };

    res.send = function(body) {
      const result = originalSend(body);
      invalidateCache();
      return result;
    };

    next();
  };
}

// Specific cache strategies
const cacheStrategies = {
  // User data - medium TTL, user-specific
  userData: () => cacheMiddleware({
    ttl: redisClient.TTL?.MEDIUM || 300,
    keyPrefix: 'user',
    keyGenerator: (req) => redisClient.generateKey('user', req.user?.id || 'anonymous', req.originalUrl)
  }),

  // Cards data - medium TTL, user-specific
  cardsData: () => cacheMiddleware({
    ttl: redisClient.TTL?.MEDIUM || 300,
    keyPrefix: 'cards',
    keyGenerator: (req) => redisClient.generateKey('cards', req.user?.id || 'anonymous', req.originalUrl)
  }),

  // Analytics data - longer TTL, less frequent updates
  analyticsData: () => cacheMiddleware({
    ttl: redisClient.TTL?.LONG || 1800,
    keyPrefix: 'analytics',
    keyGenerator: (req) => redisClient.generateKey('analytics', req.originalUrl, req.query?.period || 'default')
  }),

  // Public card views - short TTL, high frequency
  publicCards: () => cacheMiddleware({
    ttl: redisClient.TTL?.SHORT || 60,
    keyPrefix: 'public',
    keyGenerator: (req) => redisClient.generateKey('public', 'card', req.params.id || req.params.cardId)
  }),

  // Health checks and static data - extra long TTL
  staticData: () => cacheMiddleware({
    ttl: redisClient.TTL?.EXTRA_LONG || 3600,
    keyPrefix: 'static'
  })
};

// Cache status endpoint
const getCacheStats = async (req, res) => {
  try {
    const health = await redisClient.healthCheck();

    return res.json({
      status: 'success',
      cache: {
        connected: redisClient.isConnected,
        health: health.status,
        message: health.message
      },
      strategies: {
        userData: 'Medium TTL (5min) - User specific',
        cardsData: 'Medium TTL (5min) - User specific',
        analyticsData: 'Long TTL (30min) - Less frequent updates',
        publicCards: 'Short TTL (1min) - High frequency',
        staticData: 'Extra Long TTL (1hour) - Static content'
      },
      ttl_constants: redisClient.TTL || {
        SHORT: 60,
        MEDIUM: 300,
        LONG: 1800,
        EXTRA_LONG: 3600
      }
    });

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get cache stats',
      error: error.message
    });
  }
};

module.exports = {
  cacheMiddleware,
  cacheInvalidationMiddleware,
  cacheStrategies,
  getCacheStats
};