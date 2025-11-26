import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const createAppError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const { statusCode = 500, message } = error;

  console.error('🚨 Error occurred:', {
    message: error.message,
    statusCode,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  const errorResponse = {
    success: false,
    error: {
      message: statusCode < 500 || isDevelopment ? message : 'Internal Server Error',
      statusCode,
      ...(isDevelopment && { stack: error.stack })
    },
    timestamp: new Date().toISOString()
  };

  return res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response): Response => {
  return res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
      statusCode: 404
    },
    timestamp: new Date().toISOString()
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};