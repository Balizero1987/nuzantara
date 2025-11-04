import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';

function genId(): string {
  return crypto.randomBytes(8).toString('hex');
}

export function correlationId() {
  return function cid(req: Request, res: Response, next: NextFunction) {
    const incoming =
      (req.headers['x-request-id'] as string) || (req.headers['x-correlation-id'] as string);
    const id = incoming || genId();
    res.setHeader('X-Request-ID', id);
    // Correlation: prefer explicit header, fallback to request id
    const corr = (req.headers['x-correlation-id'] as string) || id;
    res.setHeader('X-Correlation-ID', corr);
    (req as any).correlationId = corr;
    next();
  };
}
