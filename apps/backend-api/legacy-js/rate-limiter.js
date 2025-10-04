import rateLimit from 'express-rate-limit';
import { ipKeyGenerator } from 'express-rate-limit';
class ZantaraRateLimiter {
    // 🎯 SMART LIMITING based on endpoint cost
    static getSmartLimiter(endpoint) {
        if (endpoint.includes('/ai/') || endpoint.includes('/openai/') ||
            endpoint.includes('/claude/') || endpoint.includes('/gemini/')) {
            return this.aiRateLimit;
        }
        if (endpoint.includes('/auth') || endpoint.includes('/login')) {
            return this.authRateLimit;
        }
        if (endpoint.includes('/slack/') || endpoint.includes('/discord/') ||
            endpoint.includes('/googlechat/')) {
            return this.webhookRateLimit;
        }
        if (endpoint.includes('/calendar/') || endpoint.includes('/drive/') ||
            endpoint.includes('/memory/')) {
            return this.dataRateLimit;
        }
        return this.generalRateLimit;
    }
    // 📈 ANALYTICS: Track rate limit stats
    static getStats() {
        // In a real implementation, this would pull from Redis/database
        return {
            totalRequests: 'tracked_in_redis',
            blockedRequests: 'tracked_in_redis',
            topIPs: 'tracked_in_redis',
            costSavings: 'calculated_from_blocked_ai_calls'
        };
    }
    // 🚨 SECURITY: Get suspicious IPs
    static getSuspiciousActivity() {
        return {
            multipleRateLimits: 'ips_hitting_multiple_limits',
            highVolumeIPs: 'ips_with_unusual_traffic',
            blockedRequests: 'recent_blocked_attempts'
        };
    }
    // ⚙️ CONFIGURATION: Dynamic rate limit adjustment
    static adjustLimits(multiplier) {
        console.log(`🔧 Adjusting rate limits by ${multiplier}x`);
        // In production, this would update Redis-based rate limits
        // For high traffic periods, increase limits
        // For attacks/abuse, decrease limits
    }
}
// 🔥 AGGRESSIVE LIMITING for expensive AI calls
ZantaraRateLimiter.aiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 AI requests per 15min per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many AI requests',
        retryAfter: '15 minutes',
        tip: 'AI calls are expensive. Please wait before trying again.',
        contact: 'For higher limits, contact zero@balizero.com'
    },
    keyGenerator: (req) => {
        // Use IPv6-compatible key generator with User-Agent for granular control
        const ipKey = ipKeyGenerator(req.ip || 'unknown');
        return `${ipKey}-${req.get('User-Agent')?.slice(0, 50) || 'unknown'}`;
    },
    handler: (req, res) => {
        console.log(`🚨 AI Rate limit exceeded: ${req.ip} - ${req.path}`);
        res.status(429).json({
            error: 'AI_RATE_LIMIT_EXCEEDED',
            message: 'Too many AI requests from this IP',
            retryAfter: '15 minutes',
            currentTime: new Date().toISOString()
        });
    }
});
// 📊 MODERATE LIMITING for data operations
ZantaraRateLimiter.dataRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 200, // 200 requests per 5min per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many data requests',
        retryAfter: '5 minutes'
    },
    handler: (req, res) => {
        console.log(`⚠️ Data Rate limit exceeded: ${req.ip} - ${req.path}`);
        res.status(429).json({
            error: 'DATA_RATE_LIMIT_EXCEEDED',
            message: 'Too many data requests from this IP',
            retryAfter: '5 minutes'
        });
    }
});
// 🌊 GENEROUS LIMITING for general API
ZantaraRateLimiter.generalRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute per IP (1 per second)
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many requests',
        retryAfter: '1 minute'
    },
    handler: (req, res) => {
        console.log(`📊 General rate limit exceeded: ${req.ip} - ${req.path}`);
        res.status(429).json({
            error: 'GENERAL_RATE_LIMIT_EXCEEDED',
            message: 'Too many requests from this IP',
            retryAfter: '1 minute'
        });
    }
});
// 🔐 STRICT LIMITING for auth endpoints
ZantaraRateLimiter.authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Only 5 auth attempts per 15min
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
    handler: (req, res) => {
        console.log(`🔒 Auth rate limit exceeded: ${req.ip} - ${req.path}`);
        res.status(429).json({
            error: 'AUTH_RATE_LIMIT_EXCEEDED',
            message: 'Too many authentication attempts',
            retryAfter: '15 minutes',
            security: 'This incident has been logged'
        });
    }
});
// 💰 PREMIUM LIMITING for webhook notifications (these cost money)
ZantaraRateLimiter.webhookRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 30, // 30 webhook calls per 10min
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`💸 Webhook rate limit exceeded: ${req.ip} - ${req.path}`);
        res.status(429).json({
            error: 'WEBHOOK_RATE_LIMIT_EXCEEDED',
            message: 'Too many webhook requests',
            retryAfter: '10 minutes',
            note: 'Webhook calls have service costs'
        });
    }
});
export default ZantaraRateLimiter;
