const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

/**
 * Rate limiting middleware for different endpoint types
 * Protects against brute force attacks, spam, and DoS
 */

// Environment-based configuration
const isProduction = process.env.NODE_ENV === 'production';
const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const maxRequestsPerWindow = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

// Global rate limiter - applies to all requests
const globalRateLimit = rateLimit({
  windowMs: rateLimitWindow, // 15 minutes
  max: maxRequestsPerWindow, // 100 requests per window per IP
  message: {
    error: 'Too many requests from this IP',
    retryAfter: Math.ceil(rateLimitWindow / 1000),
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks in development
    return !isProduction && req.path === '/api/health';
  },
  keyGenerator: (req) => {
    // Use IP address as key, with fallback for proxies
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

// Strict rate limiter for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window per IP
  message: {
    error: 'Too many authentication attempts',
    retryAfter: 900, // 15 minutes in seconds
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: (req) => {
    // Rate limit by IP and email combination for auth
    const email = req.body?.email || '';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `auth_${ip}_${email}`;
  }
});

// Medium rate limiter for API endpoints
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // 60 requests per window per IP
  message: {
    error: 'Too many API requests',
    retryAfter: 900,
    code: 'API_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Lenient rate limiter for public endpoints (card views, analytics)
const publicRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // 100 requests per window per IP
  message: {
    error: 'Too many requests to public endpoints',
    retryAfter: 300,
    code: 'PUBLIC_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Progressive slowdown for repeated requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 10, // Allow 10 requests per windowMs without delay
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 5000, // Maximum delay of 5 seconds
  skipFailedRequests: true, // Don't count failed requests
  skipSuccessfulRequests: false
});

// Card creation rate limiter (prevents spam card creation)
const cardCreationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 card creations per hour per user
  message: {
    error: 'Too many cards created',
    retryAfter: 3600,
    code: 'CARD_CREATION_LIMIT_EXCEEDED'
  },
  keyGenerator: (req) => {
    // Rate limit by user ID for authenticated requests
    const userId = req.user?.id || req.ip;
    return `card_creation_${userId}`;
  }
});

// Analytics tracking rate limiter (prevents analytics spam)
const analyticsRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 analytics events per minute per IP
  message: {
    error: 'Too many analytics requests',
    retryAfter: 60,
    code: 'ANALYTICS_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: false
});

// Custom middleware for user-specific rate limiting
const userRateLimit = (maxRequests = 50, windowMs = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      error: 'User rate limit exceeded',
      retryAfter: Math.ceil(windowMs / 1000),
      code: 'USER_RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise fall back to IP
      if (req.user?.id) {
        return `user_${req.user.id}`;
      }
      return `ip_${req.ip || req.connection.remoteAddress}`;
    }
  });
};

// Bypass rate limiting for trusted IPs or API keys
const trustedBypass = (req, res, next) => {
  const trustedIPs = (process.env.TRUSTED_IPS || '').split(',').filter(Boolean);
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Check for trusted IP
  if (trustedIPs.includes(clientIP)) {
    req.rateLimit = { bypass: true };
    return next();
  }
  
  // Check for valid API key bypass
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === process.env.BYPASS_API_KEY) {
    req.rateLimit = { bypass: true };
    return next();
  }
  
  next();
};

// Error handler for rate limit exceeded
const rateLimitErrorHandler = (err, req, res, next) => {
  if (err && err.status === 429) {
    console.log(`Rate limit exceeded for ${req.ip} on ${req.path}`);
    
    return res.status(429).json({
      error: err.message || 'Too many requests',
      retryAfter: err.retryAfter || 60,
      code: 'RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
  
  next(err);
};

module.exports = {
  globalRateLimit,
  authRateLimit,
  apiRateLimit,
  publicRateLimit,
  speedLimiter,
  cardCreationRateLimit,
  analyticsRateLimit,
  userRateLimit,
  trustedBypass,
  rateLimitErrorHandler
};