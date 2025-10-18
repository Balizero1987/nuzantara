import { Request, Response, NextFunction } from 'express';

// Advanced IP-based defense system
interface IPDefenseOptions {
  maxRequestsPerHour: number;
  maxRequestsPerMinute: number;
  suspiciousThreshold: number; // requests that trigger investigation
  autoBlockThreshold: number; // requests that trigger auto-block
  whitelistedIPs: string[];
  blacklistedIPs: string[];
}

interface IPStats {
  requestCount: number;
  lastRequest: number;
  firstRequest: number;
  blockedUntil?: number;
  suspicious: boolean;
  userAgents: Set<string>;
  endpoints: Set<string>;
}

const ipStats = new Map<string, IPStats>();
const defaultConfig: IPDefenseOptions = {
  maxRequestsPerHour: 60,
  maxRequestsPerMinute: 10,
  suspiciousThreshold: 100, // 100 req/hr = suspicious
  autoBlockThreshold: 200,  // 200 req/hr = auto-block
  whitelistedIPs: [
    '34.96.62.141',     // Google Cloud health checks
    '34.64.0.0/10',     // Google Cloud range
    '130.211.0.0/22',   // Google Load Balancer
    '35.191.0.0/16'     // Google Load Balancer
  ],
  blacklistedIPs: []
};

export function createIPDefense(options: Partial<IPDefenseOptions> = {}) {
  const config = { ...defaultConfig, ...options };
  
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = getClientIP(req);
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    // const minuteAgo = now - (60 * 1000); // Declared but not used
    
    // Check whitelist first
    if (isWhitelisted(clientIP, config.whitelistedIPs)) {
      return next();
    }
    
    // Check blacklist
    if (config.blacklistedIPs.includes(clientIP)) {
      return blockRequest(res, 'IP blacklisted', 403);
    }
    
    // Get or create IP stats
    let stats = ipStats.get(clientIP);
    if (!stats) {
      stats = {
        requestCount: 0,
        lastRequest: now,
        firstRequest: now,
        suspicious: false,
        userAgents: new Set(),
        endpoints: new Set()
      };
      ipStats.set(clientIP, stats);
    }
    
    // Check if currently blocked
    if (stats.blockedUntil && now < stats.blockedUntil) {
      const remainingTime = Math.ceil((stats.blockedUntil - now) / 1000);
      return blockRequest(res, `IP blocked for ${remainingTime} seconds`, 429);
    }
    
    // Reset hourly counter if needed
    if (stats.firstRequest < hourAgo) {
      stats.requestCount = 0;
      stats.firstRequest = now;
      stats.suspicious = false;
    }
    
    // Increment counter and update stats
    stats.requestCount++;
    stats.lastRequest = now;
    stats.userAgents.add(req.get('User-Agent') || 'unknown');
    stats.endpoints.add(req.path);
    
    // Check for auto-block threshold
    if (stats.requestCount >= config.autoBlockThreshold) {
      stats.blockedUntil = now + (24 * 60 * 60 * 1000); // Block for 24 hours
      logSuspiciousActivity(clientIP, stats, 'AUTO-BLOCKED');
      return blockRequest(res, 'IP auto-blocked due to excessive requests', 429);
    }
    
    // Check for suspicious threshold
    if (stats.requestCount >= config.suspiciousThreshold && !stats.suspicious) {
      stats.suspicious = true;
      logSuspiciousActivity(clientIP, stats, 'SUSPICIOUS');
    }
    
    // Check minute-based rate limit
    const recentRequests = stats.requestCount; // Simplified for demo
    if (recentRequests > config.maxRequestsPerMinute) {
      return blockRequest(res, 'Rate limit exceeded', 429);
    }
    
    // Add defense headers
    res.set({
      'X-IP-Defense': 'active',
      'X-Requests-Remaining': (config.maxRequestsPerHour - stats.requestCount).toString(),
      'X-Reset-Time': new Date(stats.firstRequest + 60 * 60 * 1000).toISOString()
    });
    
    next();
  };
}

function getClientIP(req: Request): string {
  return req.ip || 
         req.get('X-Forwarded-For')?.split(',')[0] || 
         req.get('X-Real-IP') || 
         req.connection.remoteAddress || 
         'unknown';
}

function isWhitelisted(ip: string, whitelist: string[]): boolean {
  return whitelist.some(whiteIP => {
    if (whiteIP.includes('/')) {
      // CIDR range check (simplified)
      const baseIP = whiteIP.split('/')[0];
      const prefix = baseIP?.split('.').slice(0, 2).join('.') || '';
      return prefix && ip.startsWith(prefix);
    }
    return ip === whiteIP;
  });
}

function blockRequest(res: Response, message: string, statusCode: number) {
  return res.status(statusCode).json({
    error: 'Access denied',
    message,
    timestamp: new Date().toISOString(),
    blocked: true
  });
}

function logSuspiciousActivity(ip: string, stats: IPStats, level: string) {
  console.warn(`🚨 ${level} IP ACTIVITY: ${ip}`, {
    requests: stats.requestCount,
    timespan: new Date(stats.firstRequest).toISOString(),
    userAgents: Array.from(stats.userAgents),
    endpoints: Array.from(stats.endpoints),
    suspicious: stats.suspicious
  });
  
  // Could send to external monitoring service here
  sendToMonitoring(ip, stats, level);
}

function sendToMonitoring(ip: string, stats: IPStats, level: string) {
  // Implementation for external alerts (Slack, Discord, etc.)
  const alertMessage = {
    level,
    ip,
    requests: stats.requestCount,
    timespan: '1 hour',
    userAgents: Array.from(stats.userAgents).slice(0, 3),
    endpoints: Array.from(stats.endpoints).slice(0, 5)
  };
  
  // Would send to webhook here
  console.log('📊 Monitoring alert:', alertMessage);
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  const dayAgo = now - (24 * 60 * 60 * 1000);
  
  for (const [ip, stats] of ipStats.entries()) {
    if (stats.lastRequest < dayAgo) {
      ipStats.delete(ip);
    }
  }
}, 60 * 60 * 1000); // Cleanup every hour

// Export specific defenses
export const strictIPDefense = createIPDefense({
  maxRequestsPerHour: 30,
  maxRequestsPerMinute: 5,
  suspiciousThreshold: 50,
  autoBlockThreshold: 100
});

export const adminIPDefense = createIPDefense({
  maxRequestsPerHour: 10,
  maxRequestsPerMinute: 2,
  suspiciousThreshold: 20,
  autoBlockThreshold: 50
});

export const publicIPDefense = createIPDefense({
  maxRequestsPerHour: 100,
  maxRequestsPerMinute: 20,
  suspiciousThreshold: 200,
  autoBlockThreshold: 500
});