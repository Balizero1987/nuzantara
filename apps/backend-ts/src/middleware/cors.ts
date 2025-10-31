import type { Request, Response, NextFunction } from 'express';

const ALLOWED_ORIGIN = 'https://zantara.balizero.com';
const ALLOW_METHODS = 'GET, POST, OPTIONS';
const ALLOW_HEADERS = 'Content-Type, Authorization';

/**
 * Lightweight CORS middleware tailored for the ZANTARA webapp.
 * Ensures SSE requests from the production frontend succeed without relying
 * on external libraries (keeps behaviour deterministic across environments).
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.header('Access-Control-Allow-Methods', ALLOW_METHODS);
  res.header('Access-Control-Allow-Headers', ALLOW_HEADERS);
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}
