/**
 * PATCH-3: Security & Secrets Management
 * Comprehensive security middleware for NUZANTARA platform
 */

import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { logger } from '../logging/unified-logger.js';
import { err } from '../utils/response.js';

// Security Headers Middleware
export const securityHeaders: RequestHandler = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // HSTS - Force HTTPS for 1 year
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // CSP - Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'");

  // XFO - Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // XCTO - Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XXP - XSS Protection (legacy but still useful)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (Feature-Policy successor)
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');

  next();
};

// Global Rate Limiter (100 req/15min per IP)
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { ok: false, error: 'Troppi tentativi. Riprova tra 15 minuti.' },
  standardHeaders: true,
  legacyHeaders: true,
  skip: (req: Request) => req.path === '/health',
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.setHeader('Retry-After', Math.ceil(15 * 60).toString());
    res.setHeader('X-RateLimit-Limit', '100');
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', Math.ceil((Date.now() + 15 * 60 * 1000) / 1000).toString());
    res.status(429).json(err('Troppi tentativi. Riprova tra 15 minuti.'));
  },
});

// API Rate Limiter (20 req/min per IP)
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { ok: false, error: 'Troppi tentativi API. Riprova tra 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: true,
  handler: (req: Request, res: Response) => {
    logger.warn(`API rate limit exceeded for IP: ${req.ip}`);
    res.setHeader('Retry-After', '60');
    res.setHeader('X-RateLimit-Limit', '20');
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', Math.ceil((Date.now() + 60 * 1000) / 1000).toString());
    res.status(429).json(err('Troppi tentativi API. Riprova tra 1 minuto.'));
  },
});

// Strict Rate Limiter for sensitive operations (5 req/hour)
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { ok: false, error: 'Troppi tentativi per operazione sensibile. Riprova tra 1 ora.' },
  standardHeaders: true,
  legacyHeaders: true,
  handler: (req: Request, res: Response) => {
    logger.warn(`Strict rate limit exceeded for IP: ${req.ip}`);
    res.setHeader('Retry-After', (60 * 60).toString());
    res.setHeader('X-RateLimit-Limit', '5');
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', Math.ceil((Date.now() + 60 * 60 * 1000) / 1000).toString());
    res.status(429).json(err('Troppi tentativi per operazione sensibile. Riprova tra 1 ora.'));
  },
});

// API Key Validation Middleware
export const validateApiKey: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    logger.error('API_KEY non configurata nel server');
    res.status(500).json(err('Errore di configurazione server'));
    return;
  }

  if (!apiKey || apiKey !== validApiKey) {
    logger.warn(`Tentativo accesso con API key invalida: ${req.ip}`);
    res.status(401).json(err('API key non valida'));
    return;
  }

  next();
};

// Request Sanitization Middleware
export const sanitizeRequest: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Remove potentially dangerous properties
  if (req.body) {
    delete (req.body as any).__proto__;
    delete (req.body as any).constructor;
    delete (req.body as any).prototype;
  }

  // Log suspicious requests
  const suspiciousPatterns = /<script|javascript:|onerror=|onclick=/i;
  const bodyString = JSON.stringify(req.body);

  if (suspiciousPatterns.test(bodyString)) {
    logger.warn(`Richiesta sospetta rilevata da IP: ${req.ip}`, {
      path: req.path,
      body: req.body,
    });
  }

  next();
};

// CORS Configuration
export const corsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:8888',
      'https://zantara.balizero.com',
    ];

    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Non consentito da CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  maxAge: 86400, // 24 hours
};

// Security Logger Middleware
export const securityLogger: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  logger.info('Security check', {
    ip: req.ip,
    method: req.method,
    path: req.path,
    userAgent: req.get('user-agent'),
  });
  next();
};

// Combined Security Middleware Stack
export const applySecurity: RequestHandler[] = [securityHeaders, sanitizeRequest, securityLogger];
