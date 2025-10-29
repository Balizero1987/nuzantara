import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',');
const API_KEY = process.env.API_KEY;

export function securityMiddleware(req: Request, res: Response, next: NextFunction) {
  // Request ID
  const requestId = req.headers['x-request-id'] || generateRequestId();
  res.setHeader('X-Request-ID', requestId as string);

  // Security headers (additional to helmet)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Remove sensitive headers
  res.removeHeader('X-Powered-By');

  // Log security-relevant info
  logger.debug('Request', {
    requestId,
    ip: req.ip,
    method: req.method,
    path: req.path,
    userAgent: req.get('user-agent')
  });

  // Check API key for protected routes
  if (isProtectedRoute(req.path)) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== API_KEY) {
      logger.warn('Unauthorized access attempt', {
        ip: req.ip,
        path: req.path
      });
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  next();
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

function isProtectedRoute(path: string): boolean {
  // Add protected route patterns here
  const protectedPatterns = [
    '/api/admin',
    '/api/internal'
  ];
  return protectedPatterns.some(pattern => path.startsWith(pattern));
}
