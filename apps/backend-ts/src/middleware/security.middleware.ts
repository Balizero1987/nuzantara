/**
 * Security Middleware - PATCH-3
 * Enhanced security with headers, rate limiting, API validation
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import logger from '../services/logger.js';
import { err } from '../utils/response.js';

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;");
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.removeHeader('X-Powered-By');
  next();
};

// Global rate limiter
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Global rate limit exceeded from IP: ${req.ip}`);
    res.status(429).json(err('Too many requests'));
  },
  skip: (req) => req.path === '/health' || req.path === '/metrics'
});

// API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`API rate limit exceeded from IP: ${req.ip}`);
    res.status(429).json(err('API rate limit exceeded'));
  }
});

// Strict rate limiter for sensitive operations
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.error(`Strict rate limit exceeded from IP: ${req.ip}`);
    res.status(429).json(err('Too many attempts'));
  }
});

// API key validation
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('x-api-key');
  if (!apiKey) return res.status(401).json(err('API key required'));
  
  const validKeys = (process.env.API_KEYS || '').split(',').filter(Boolean);
  const internalKeys = (process.env.API_KEYS_INTERNAL || '').split(',').filter(Boolean);
  if (![ ...validKeys, ...internalKeys].some(key => key === apiKey)) {
    return res.status(401).json(err('Invalid API key'));
  }
  (req as any).authenticated = true;
  next();
};

// Request sanitization
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = (req.query[key] as string).replace(/<script>/gi, '').replace(/javascript:/gi, '');
      }
    });
  }
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].replace(/<script>/gi, '').replace(/javascript:/gi, '');
      }
    });
  }
  next();
};

// CORS config
export const corsConfig = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean).concat(['http://localhost:3000']);
    if (!origin || allowed.includes(origin) || allowed.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  maxAge: 86400
};

// Security logger
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
};

// Apply all security
export const applySecurity = [securityHeaders, sanitizeRequest, securityLogger];
