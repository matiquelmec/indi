const logger = require('../utils/logger');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, errorCode = null, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Development error response
const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    status: 'error',
    error: {
      message: err.message,
      stack: err.stack,
      errorCode: err.errorCode,
      timestamp: err.timestamp || new Date().toISOString()
    },
    ...(process.env.NODE_ENV === 'development' && {
      fullError: err
    })
  });
};

// Production error response
const sendErrorProd = (err, res) => {
  // Operational errors: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      errorCode: err.errorCode,
      timestamp: err.timestamp || new Date().toISOString()
    });
  } else {
    // Programming errors: don't leak details
    console.error('ERROR 💥', err);

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
      errorCode: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

// Handle specific error types
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'INVALID_DATA');
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400, 'DUPLICATE_VALUE');
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401, 'INVALID_TOKEN');

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401, 'TOKEN_EXPIRED');

const handleSupabaseError = (err) => {
  let message = 'Database operation failed';
  let statusCode = 500;
  let errorCode = 'DATABASE_ERROR';

  // Handle specific Supabase/PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        message = 'A record with this data already exists';
        statusCode = 409;
        errorCode = 'DUPLICATE_RECORD';
        break;
      case '23503': // Foreign key violation
        message = 'Referenced record does not exist';
        statusCode = 400;
        errorCode = 'INVALID_REFERENCE';
        break;
      case '23502': // Not null violation
        message = 'Required field is missing';
        statusCode = 400;
        errorCode = 'MISSING_REQUIRED_FIELD';
        break;
      case '42P01': // Relation does not exist
        message = 'Database table not found';
        statusCode = 500;
        errorCode = 'DATABASE_SCHEMA_ERROR';
        break;
      case '42703': // Column does not exist
        message = 'Database column not found';
        statusCode = 500;
        errorCode = 'DATABASE_SCHEMA_ERROR';
        break;
      default:
        message = err.message || 'Database operation failed';
    }
  }

  return new AppError(message, statusCode, errorCode);
};

// Main error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log all errors
  logger.error.api(err, req, {
    body: req.body ? { ...req.body, password: req.body.password ? '[REDACTED]' : undefined } : undefined,
    params: req.params,
    query: req.query
  });

  // Handle different error types
  let error = { ...err };
  error.message = err.message;

  // Database errors
  if (error.name === 'CastError') error = handleCastErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === 'ValidationError') error = handleValidationErrorDB(error);

  // JWT errors
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  // Supabase/PostgreSQL errors
  if (error.code && typeof error.code === 'string' && error.code.match(/^[0-9]{5}$/)) {
    error = handleSupabaseError(error);
  }

  // Rate limiting errors
  if (error.type === 'entity.too.large') {
    error = new AppError('Request entity too large', 413, 'PAYLOAD_TOO_LARGE');
  }

  // Send error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404, 'ROUTE_NOT_FOUND');
  next(err);
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Override res.end to capture response details
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;

    // Log API request
    logger.performance.apiRequest(
      req.method,
      req.originalUrl,
      duration,
      res.statusCode,
      req.user?.id
    );

    // Log security events
    if (res.statusCode === 401 || res.statusCode === 403) {
      logger.security.suspiciousActivity(
        req.ip,
        'unauthorized_access',
        {
          method: req.method,
          url: req.originalUrl,
          userAgent: req.get('User-Agent'),
          referer: req.get('Referer')
        }
      );
    }

    originalEnd.apply(this, args);
  };

  next();
};

// Unhandled rejection handler
const unhandledRejectionHandler = () => {
  process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Promise Rejection', {
      type: 'error',
      action: 'unhandled_rejection',
      message: err.message,
      stack: err.stack,
      promise: promise.toString(),
      timestamp: new Date().toISOString()
    });

    // Close server gracefully
    console.log('💥 UNHANDLED PROMISE REJECTION! Shutting down...');
    process.exit(1);
  });
};

// Uncaught exception handler
const uncaughtExceptionHandler = () => {
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', {
      type: 'error',
      action: 'uncaught_exception',
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });

    console.log('💥 UNCAUGHT EXCEPTION! Shutting down...');
    process.exit(1);
  });
};

// Validation helpers
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body);

      if (error) {
        const errorMessage = error.details.map(detail => detail.message).join(', ');
        throw new AppError(errorMessage, 400, 'VALIDATION_ERROR');
      }

      req.body = value;
      next();
    } catch (err) {
      next(err);
    }
  };
};

// Health check for error handling
const errorHandlerHealthCheck = () => {
  try {
    return {
      status: 'healthy',
      middleware: {
        globalErrorHandler: 'active',
        requestLogger: 'active',
        asyncHandler: 'active',
        notFoundHandler: 'active'
      },
      errorTypes: {
        AppError: 'configured',
        DatabaseErrors: 'handled',
        JWTErrors: 'handled',
        ValidationErrors: 'handled',
        UnhandledRejections: 'monitored',
        UncaughtExceptions: 'monitored'
      },
      logging: logger.healthCheck()
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.message
    };
  }
};

module.exports = {
  AppError,
  asyncHandler,
  globalErrorHandler,
  notFoundHandler,
  requestLogger,
  unhandledRejectionHandler,
  uncaughtExceptionHandler,
  validateRequest,
  errorHandlerHealthCheck
};