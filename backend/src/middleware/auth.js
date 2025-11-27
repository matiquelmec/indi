const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client lazily to ensure env vars are loaded
let supabase = null;
const getSupabaseClient = () => {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
  return supabase;
};

/**
 * JWT Authentication Middleware
 * Validates JWT tokens and extracts user information
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Check for Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'AUTH_MISSING_TOKEN'
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-secret-key');
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expired',
          code: 'AUTH_TOKEN_EXPIRED'
        });
      }
      
      return res.status(403).json({ 
        error: 'Invalid token',
        code: 'AUTH_INVALID_TOKEN'
      });
    }

    // Validate user exists in database
    const { data: user, error } = await getSupabaseClient()
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      console.error('User validation error:', error);
      return res.status(403).json({ 
        error: 'User not found or invalid',
        code: 'AUTH_USER_NOT_FOUND'
      });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name
    };

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ 
      error: 'Internal authentication error',
      code: 'AUTH_INTERNAL_ERROR'
    });
  }
};

/**
 * Optional Authentication Middleware
 * For endpoints that can work with or without authentication
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-secret-key');
    
    const { data: user, error } = await getSupabaseClient()
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', decoded.userId)
      .single();

    if (!error && user) {
      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      };
    } else {
      req.user = null;
    }
  } catch (error) {
    req.user = null;
  }

  next();
};

/**
 * Demo Mode Middleware
 * For development/testing with hardcoded demo user
 */
const demoAuth = (req, res, next) => {
  const demoUserId = '23f71da9-1bac-4811-9456-50d5b7742567';
  
  req.user = {
    id: demoUserId,
    email: 'demo@indi.com',
    firstName: 'Demo',
    lastName: 'User',
    isDemo: true
  };

  next();
};

/**
 * Generate JWT Token
 */
const generateToken = (userId, expiresIn = '24h') => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'development-secret-key',
    { expiresIn }
  );
};

/**
 * Refresh Token Validation
 */
const validateRefreshToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'development-refresh-secret');
    
    const { data: user, error } = await getSupabaseClient()
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      throw new Error('User not found');
    }

    return {
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  demoAuth,
  generateToken,
  validateRefreshToken
};