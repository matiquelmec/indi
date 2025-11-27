const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}] ${message}`;

    if (stack) {
      logMessage += `\n${stack}`;
    }

    if (Object.keys(meta).length > 0) {
      logMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return logMessage;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} ${level} ${message}`;

    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }

    return logMessage;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'indi-digital-cards',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error logs - separate file for errors only
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Combined logs - all levels
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Performance logs
    new winston.transports.File({
      filename: path.join(logsDir, 'performance.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format((info) => {
          return info.type === 'performance' ? info : false;
        })()
      )
    }),

    // Security logs
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format((info) => {
          return info.type === 'security' ? info : false;
        })()
      )
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Custom logging methods
const logMethods = {
  // Authentication logs
  auth: {
    login: (userId, email, ip, success = true) => {
      logger.info('User authentication attempt', {
        type: 'security',
        action: 'login',
        userId,
        email,
        ip,
        success,
        timestamp: new Date().toISOString()
      });
    },

    logout: (userId, email, ip) => {
      logger.info('User logout', {
        type: 'security',
        action: 'logout',
        userId,
        email,
        ip,
        timestamp: new Date().toISOString()
      });
    },

    register: (userId, email, ip) => {
      logger.info('User registration', {
        type: 'security',
        action: 'register',
        userId,
        email,
        ip,
        timestamp: new Date().toISOString()
      });
    },

    failed: (email, ip, reason) => {
      logger.warn('Authentication failed', {
        type: 'security',
        action: 'auth_failed',
        email,
        ip,
        reason,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Performance logs
  performance: {
    apiRequest: (method, url, duration, statusCode, userId = null) => {
      logger.info('API request completed', {
        type: 'performance',
        action: 'api_request',
        method,
        url,
        duration,
        statusCode,
        userId,
        timestamp: new Date().toISOString()
      });
    },

    dbQuery: (query, duration, rowCount = null) => {
      logger.info('Database query executed', {
        type: 'performance',
        action: 'db_query',
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        duration,
        rowCount,
        timestamp: new Date().toISOString()
      });
    },

    cacheOperation: (operation, key, hit = null, duration = null) => {
      logger.info('Cache operation', {
        type: 'performance',
        action: 'cache_operation',
        operation,
        key,
        hit,
        duration,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Security logs
  security: {
    rateLimitHit: (ip, endpoint, limit) => {
      logger.warn('Rate limit exceeded', {
        type: 'security',
        action: 'rate_limit_hit',
        ip,
        endpoint,
        limit,
        timestamp: new Date().toISOString()
      });
    },

    suspiciousActivity: (ip, activity, details) => {
      logger.warn('Suspicious activity detected', {
        type: 'security',
        action: 'suspicious_activity',
        ip,
        activity,
        details,
        timestamp: new Date().toISOString()
      });
    },

    dataAccess: (userId, resource, action) => {
      logger.info('Data access', {
        type: 'security',
        action: 'data_access',
        userId,
        resource,
        operation: action,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Business logic logs
  business: {
    cardCreated: (userId, cardId, cardType) => {
      logger.info('Digital card created', {
        type: 'business',
        action: 'card_created',
        userId,
        cardId,
        cardType,
        timestamp: new Date().toISOString()
      });
    },

    cardUpdated: (userId, cardId, changes) => {
      logger.info('Digital card updated', {
        type: 'business',
        action: 'card_updated',
        userId,
        cardId,
        changes,
        timestamp: new Date().toISOString()
      });
    },

    cardViewed: (cardId, viewerId = null, ip) => {
      logger.info('Digital card viewed', {
        type: 'business',
        action: 'card_viewed',
        cardId,
        viewerId,
        ip,
        timestamp: new Date().toISOString()
      });
    },

    subscriptionChange: (userId, oldPlan, newPlan) => {
      logger.info('Subscription changed', {
        type: 'business',
        action: 'subscription_change',
        userId,
        oldPlan,
        newPlan,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Error logs
  error: {
    api: (error, req, additionalContext = {}) => {
      logger.error('API error occurred', {
        type: 'error',
        action: 'api_error',
        message: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        ...additionalContext,
        timestamp: new Date().toISOString()
      });
    },

    database: (error, query = null, additionalContext = {}) => {
      logger.error('Database error occurred', {
        type: 'error',
        action: 'db_error',
        message: error.message,
        stack: error.stack,
        query: query ? query.substring(0, 200) : null,
        ...additionalContext,
        timestamp: new Date().toISOString()
      });
    },

    external: (error, service, operation, additionalContext = {}) => {
      logger.error('External service error', {
        type: 'error',
        action: 'external_error',
        message: error.message,
        stack: error.stack,
        service,
        operation,
        ...additionalContext,
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Extend logger with custom methods
Object.assign(logger, logMethods);

// Health check for logger
logger.healthCheck = () => {
  try {
    const logFiles = ['error.log', 'combined.log', 'performance.log', 'security.log'];
    const status = {
      status: 'healthy',
      logLevel: logger.level,
      transports: logger.transports.length,
      logFiles: {}
    };

    logFiles.forEach(file => {
      const filePath = path.join(logsDir, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        status.logFiles[file] = {
          exists: true,
          size: stats.size,
          lastModified: stats.mtime
        };
      } else {
        status.logFiles[file] = { exists: false };
      }
    });

    return status;

  } catch (error) {
    return {
      status: 'error',
      message: error.message
    };
  }
};

// Log rotation helper
logger.rotate = () => {
  logger.info('Log rotation triggered', {
    type: 'system',
    action: 'log_rotation',
    timestamp: new Date().toISOString()
  });
};

// Graceful shutdown
logger.shutdown = async () => {
  logger.info('Logger shutdown initiated', {
    type: 'system',
    action: 'shutdown',
    timestamp: new Date().toISOString()
  });

  return new Promise((resolve) => {
    logger.on('finish', resolve);
    logger.end();
  });
};

module.exports = logger;