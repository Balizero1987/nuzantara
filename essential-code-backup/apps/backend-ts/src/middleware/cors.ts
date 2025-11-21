import type { Request, Response, NextFunction } from 'express';

// Allowed origins for ZANTARA webapp
const ALLOWED_ORIGINS = [
  'https://zantara.balizero.com',
  'http://localhost:8002',
  'http://localhost:3000',
];

const ALLOW_METHODS = 'GET, POST, OPTIONS';
const ALLOW_HEADERS = 'Content-Type, Authorization, x-user-email, x-api-key';

/**
 * Lightweight CORS middleware tailored for the ZANTARA webapp.
 * Supports production domain and local development.
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin || '';

  // Check if origin is in allowed list or matches *.pages.dev pattern
  const isAllowed = ALLOWED_ORIGINS.includes(origin) ||
                    origin.endsWith('.pages.dev') ||
                    origin.includes('localhost');

  if (isAllowed) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  res.header('Access-Control-Allow-Methods', ALLOW_METHODS);
  res.header('Access-Control-Allow-Headers', ALLOW_HEADERS);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}
