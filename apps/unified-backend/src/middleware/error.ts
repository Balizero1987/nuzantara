import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { incrementRequestMetric } from '../utils/metrics';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Increment error metric
  incrementRequestMetric('error');

  // Log error
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Prepare error response
  const errorResponse: any = {
    error: err.message || 'Internal server error',
    path: req.path,
    timestamp: new Date().toISOString()
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}
