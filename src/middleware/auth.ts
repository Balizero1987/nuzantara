import type { Request, Response, NextFunction } from "express";
import { ENV } from "../config.js";
export type ApiRole = "internal" | "external";

export interface RequestWithCtx extends Request {
  ctx?: {
    role: ApiRole;
  };
}

// Rate limiting for failed API key attempts
const failedAttempts = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_FAILED_ATTEMPTS = 5;

export function apiKeyAuth(req: RequestWithCtx, res: Response, next: NextFunction) {
  const key = req.header("x-api-key");
  const clientIP = req.header("x-forwarded-for") || req.connection?.remoteAddress || "unknown";

  if (!key) {
    // Rate limit missing API key attempts
    const attempts = failedAttempts.get(clientIP) || { count: 0, timestamp: Date.now() };
    if (Date.now() - attempts.timestamp < RATE_LIMIT_WINDOW && attempts.count >= MAX_FAILED_ATTEMPTS) {
      return res.status(429).json({ error: "Rate limit exceeded. Try again later." });
    }

    failedAttempts.set(clientIP, {
      count: attempts.count + 1,
      timestamp: Date.now()
    });
    return res.status(401).json({ error: 'Missing x-api-key' });
  }

  if (ENV.INTERNAL_KEYS.includes(key)) {
    req.ctx = { role: "internal" };
    // Reset failed attempts on successful auth
    failedAttempts.delete(clientIP);
    return next();
  }

  if (ENV.EXTERNAL_KEYS.includes(key)) {
    req.ctx = { role: "external" };
    // Reset failed attempts on successful auth
    failedAttempts.delete(clientIP);
    return next();
  }

  // Rate limit invalid API key attempts
  const attempts = failedAttempts.get(clientIP) || { count: 0, timestamp: Date.now() };
  if (Date.now() - attempts.timestamp < RATE_LIMIT_WINDOW && attempts.count >= MAX_FAILED_ATTEMPTS) {
    return res.status(429).json({ error: "Rate limit exceeded. Try again later." });
  }

  failedAttempts.set(clientIP, {
    count: attempts.count + 1,
    timestamp: Date.now()
  });

  return res.status(401).json({ error: 'Invalid API key' });
}