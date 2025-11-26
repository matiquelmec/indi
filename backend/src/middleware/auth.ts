import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'No token provided' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'fallback-secret'
      ) as any;
      
      if (decoded.type !== 'access') {
        return res.status(401).json({ 
          error: 'Invalid token type' 
        });
      }

      req.user = {
        userId: decoded.userId,
        email: decoded.email || '',
        role: decoded.role || 'user'
      };

      next();
    } catch (jwtError) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Token verification failed'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
};

export const optionalAuth = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'fallback-secret'
      ) as any;
      
      req.user = {
        userId: decoded.userId,
        email: decoded.email || '',
        role: decoded.role || 'user'
      };
    } catch (error) {
      // Ignore token errors for optional auth
    }
  }
  
  next();
};