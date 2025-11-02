import { Request, Response, NextFunction } from 'express';
import { logger } from '../logging/unified-logger.js';

// Free application-level protection
const requestCounts = new Map<string, { count: number; resetTime: number; blocked: boolean }>();
const blockedIPs = new Set<string>();

// Known attack patterns
const ATTACK_PATTERNS = [
  'wp-admin', 'wp-content', '.php', '.asp', '.jsp',
  'sql', 'exec', 'script', 'admin.php', 'login.php',
  'phpmyadmin', 'xmlrpc.php', 'wp-login'
];

const BOT_AGENTS = [
  'bot', 'crawler', 'spider', 'scraper', 'scanner',
  'curl', 'wget', 'python', 'go-http-client'
];

export function freeProtection(req: Request, res: Response, next: NextFunction): void | Response {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || '';
  const path = req.path.toLowerCase();
  const now = Date.now();

  // 1. Check if IP is permanently blocked
  if (blockedIPs.has(clientIP)) {
    return res.status(403).json({
      error: 'IP blocked',
      message: 'Your IP has been blocked due to suspicious activity'
    });
  }

  // 2. Check for attack patterns in URL
  if (ATTACK_PATTERNS.some(pattern => path.includes(pattern))) {
    logger.warn('🚨 Attack pattern detected: ${clientIP} → ${path}');
    blockedIPs.add(clientIP);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied'
    });
  }

  // 3. Check for bot user agents
  if (BOT_AGENTS.some(bot => userAgent.toLowerCase().includes(bot))) {
    logger.warn('🤖 Bot detected: ${clientIP} → ${userAgent}');
    return res.status(403).json({
      error: 'Bot detected',
      message: 'Automated requests are not allowed'
    });
  }

  // 4. Rate limiting per IP
  let entry = requestCounts.get(clientIP);
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + 60000, blocked: false }; // 1 minute window
    requestCounts.set(clientIP, entry);
  }

  entry.count++;

  // 5. Check rate limits
  if (entry.count > 60) { // Max 60 requests per minute
    entry.blocked = true;
    logger.warn('⚠️ Rate limit exceeded: ${clientIP} (${entry.count} requests)');
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please wait a minute.',
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    });
  }

  // 6. Special limits for admin endpoints
  if (path.includes('/admin/') && entry.count > 10) {
    logger.warn('🔒 Admin rate limit: ${clientIP} → ${path}');
    return res.status(429).json({
      error: 'Admin rate limit',
      message: 'Too many admin requests. Please wait.',
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    });
  }

  // 7. Add security headers
  res.set({
    'X-Protection': 'active',
    'X-Rate-Limit': `${60 - entry.count}`,
    'X-Rate-Reset': new Date(entry.resetTime).toISOString()
  });

  next();
}

// Cleanup function (run periodically)
export function cleanupProtection() {
  const now = Date.now();
  for (const [ip, entry] of requestCounts.entries()) {
    if (now > entry.resetTime) {
      requestCounts.delete(ip);
    }
  }
}

// Auto-cleanup every 5 minutes
setInterval(cleanupProtection, 5 * 60 * 1000);

logger.info('🛡️ Free protection middleware loaded');