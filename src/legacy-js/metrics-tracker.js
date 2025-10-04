// Real Metrics Tracker for Zantara Bridge
// Tracks actual API calls, cache hits, errors, and performance

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MetricsTracker extends EventEmitter {
    constructor() {
        super();

        // Real-time metrics storage
        this.metrics = {
            requests: {
                total: 0,
                byEndpoint: {},
                byStatus: {},
                last100: []
            },
            handlers: {
                byAction: {},
                totalCalls: 0,
                errors: 0,
                avgResponseTime: 0
            },
            cache: {
                hits: 0,
                misses: 0,
                writes: 0,
                hitRate: 0
            },
            ai: {
                openai: { calls: 0, tokens: 0, errors: 0 },
                anthropic: { calls: 0, tokens: 0, errors: 0 },
                gemini: { calls: 0, tokens: 0, errors: 0 },
                cohere: { calls: 0, tokens: 0, errors: 0 }
            },
            performance: {
                responseTimesMs: [],
                p95: 0,
                p99: 0,
                median: 0
            },
            errors: {
                total: 0,
                byType: {},
                last10: []
            },
            business: {
                leads: 0,
                quotes: 0,
                revenue: 0,
                conversions: {}
            }
        };

        // Load persisted metrics
        this.loadMetrics();

        // Save metrics every 30 seconds
        setInterval(() => this.saveMetrics(), 30000);

        // Calculate rates every second
        setInterval(() => this.calculateRates(), 1000);
    }

    // Track incoming request
    trackRequest(req, res, startTime) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const endpoint = req.path;
        const method = req.method;
        const status = res.statusCode;

        // Update totals
        this.metrics.requests.total++;

        // Track by endpoint
        const key = `${method} ${endpoint}`;
        if (!this.metrics.requests.byEndpoint[key]) {
            this.metrics.requests.byEndpoint[key] = 0;
        }
        this.metrics.requests.byEndpoint[key]++;

        // Track by status
        const statusGroup = `${Math.floor(status / 100)}xx`;
        if (!this.metrics.requests.byStatus[statusGroup]) {
            this.metrics.requests.byStatus[statusGroup] = 0;
        }
        this.metrics.requests.byStatus[statusGroup]++;

        // Track last 100 requests
        this.metrics.requests.last100.push({
            endpoint,
            method,
            status,
            duration,
            timestamp: endTime
        });
        if (this.metrics.requests.last100.length > 100) {
            this.metrics.requests.last100.shift();
        }

        // Update performance metrics
        this.metrics.performance.responseTimesMs.push(duration);
        if (this.metrics.performance.responseTimesMs.length > 1000) {
            this.metrics.performance.responseTimesMs.shift();
        }

        // Emit event
        this.emit('request', {
            endpoint,
            method,
            status,
            duration,
            timestamp: endTime
        });
    }

    // Track handler execution
    trackHandler(action, success, duration, metadata = {}) {
        // Update handler metrics
        if (!this.metrics.handlers.byAction[action]) {
            this.metrics.handlers.byAction[action] = {
                calls: 0,
                errors: 0,
                totalTime: 0,
                avgTime: 0
            };
        }

        const handler = this.metrics.handlers.byAction[action];
        handler.calls++;
        handler.totalTime += duration;
        handler.avgTime = handler.totalTime / handler.calls;

        this.metrics.handlers.totalCalls++;

        if (!success) {
            handler.errors++;
            this.metrics.handlers.errors++;
        }

        // Track business metrics
        if (action === 'lead.save' && success) {
            this.metrics.business.leads++;
        }
        if (action === 'quote.generate' && success) {
            this.metrics.business.quotes++;
        }
        if (metadata.revenue) {
            this.metrics.business.revenue += metadata.revenue;
        }

        // Emit event
        this.emit('handler', {
            action,
            success,
            duration,
            metadata,
            timestamp: Date.now()
        });
    }

    // Track cache operations
    trackCache(operation, hit = false) {
        if (operation === 'get') {
            if (hit) {
                this.metrics.cache.hits++;
            } else {
                this.metrics.cache.misses++;
            }
        } else if (operation === 'set') {
            this.metrics.cache.writes++;
        }

        // Calculate hit rate
        const total = this.metrics.cache.hits + this.metrics.cache.misses;
        if (total > 0) {
            this.metrics.cache.hitRate = (this.metrics.cache.hits / total) * 100;
        }

        this.emit('cache', {
            operation,
            hit,
            hitRate: this.metrics.cache.hitRate,
            timestamp: Date.now()
        });
    }

    // Track AI provider usage
    trackAI(provider, tokens = 0, error = false) {
        if (this.metrics.ai[provider]) {
            this.metrics.ai[provider].calls++;
            this.metrics.ai[provider].tokens += tokens;
            if (error) {
                this.metrics.ai[provider].errors++;
            }
        }

        this.emit('ai', {
            provider,
            tokens,
            error,
            timestamp: Date.now()
        });
    }

    // Track errors
    trackError(error, context = {}) {
        this.metrics.errors.total++;

        const errorType = error.name || 'Unknown';
        if (!this.metrics.errors.byType[errorType]) {
            this.metrics.errors.byType[errorType] = 0;
        }
        this.metrics.errors.byType[errorType]++;

        // Keep last 10 errors
        this.metrics.errors.last10.push({
            type: errorType,
            message: error.message,
            context,
            timestamp: Date.now()
        });
        if (this.metrics.errors.last10.length > 10) {
            this.metrics.errors.last10.shift();
        }

        this.emit('error', {
            type: errorType,
            message: error.message,
            context,
            timestamp: Date.now()
        });
    }

    // Calculate performance percentiles
    calculateRates() {
        const times = this.metrics.performance.responseTimesMs;
        if (times.length > 0) {
            const sorted = [...times].sort((a, b) => a - b);
            const p95Index = Math.floor(sorted.length * 0.95);
            const p99Index = Math.floor(sorted.length * 0.99);
            const medianIndex = Math.floor(sorted.length * 0.5);

            this.metrics.performance.p95 = sorted[p95Index] || 0;
            this.metrics.performance.p99 = sorted[p99Index] || 0;
            this.metrics.performance.median = sorted[medianIndex] || 0;
        }

        // Calculate handler average response time
        let totalTime = 0;
        let totalCalls = 0;
        Object.values(this.metrics.handlers.byAction).forEach(h => {
            totalTime += h.totalTime;
            totalCalls += h.calls;
        });
        if (totalCalls > 0) {
            this.metrics.handlers.avgResponseTime = totalTime / totalCalls;
        }
    }

    // Get current metrics snapshot
    getSnapshot() {
        return {
            timestamp: Date.now(),
            requests: {
                total: this.metrics.requests.total,
                perMinute: this.getRequestsPerMinute(),
                topEndpoints: this.getTopEndpoints(),
                statusDistribution: this.metrics.requests.byStatus
            },
            handlers: {
                total: this.metrics.handlers.totalCalls,
                errorRate: this.metrics.handlers.errors > 0 ?
                    (this.metrics.handlers.errors / this.metrics.handlers.totalCalls * 100).toFixed(2) : 0,
                avgResponseTime: Math.round(this.metrics.handlers.avgResponseTime),
                topActions: this.getTopActions()
            },
            cache: {
                hitRate: this.metrics.cache.hitRate.toFixed(2),
                totalHits: this.metrics.cache.hits,
                totalMisses: this.metrics.cache.misses
            },
            ai: this.metrics.ai,
            performance: {
                median: Math.round(this.metrics.performance.median),
                p95: Math.round(this.metrics.performance.p95),
                p99: Math.round(this.metrics.performance.p99)
            },
            errors: {
                total: this.metrics.errors.total,
                recent: this.metrics.errors.last10.slice(-5)
            },
            business: {
                leads: this.metrics.business.leads,
                quotes: this.metrics.business.quotes,
                revenue: this.metrics.business.revenue,
                conversionRate: this.metrics.business.quotes > 0 ?
                    (this.metrics.business.leads / this.metrics.business.quotes * 100).toFixed(2) : 0
            }
        };
    }

    // Get requests per minute
    getRequestsPerMinute() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const recentRequests = this.metrics.requests.last100.filter(r =>
            r.timestamp >= oneMinuteAgo
        );
        return recentRequests.length;
    }

    // Get top endpoints
    getTopEndpoints(limit = 5) {
        return Object.entries(this.metrics.requests.byEndpoint)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([endpoint, count]) => ({ endpoint, count }));
    }

    // Get top actions
    getTopActions(limit = 5) {
        return Object.entries(this.metrics.handlers.byAction)
            .sort((a, b) => b[1].calls - a[1].calls)
            .slice(0, limit)
            .map(([action, data]) => ({
                action,
                calls: data.calls,
                avgTime: Math.round(data.avgTime),
                errorRate: data.errors > 0 ? (data.errors / data.calls * 100).toFixed(2) : 0
            }));
    }

    // Persist metrics to disk
    async saveMetrics() {
        try {
            const metricsFile = path.join(__dirname, 'metrics.json');
            await fs.writeFile(metricsFile, JSON.stringify(this.metrics, null, 2));
        } catch (error) {
            console.error('Failed to save metrics:', error);
        }
    }

    // Load metrics from disk
    async loadMetrics() {
        try {
            const metricsFile = path.join(__dirname, 'metrics.json');
            const data = await fs.readFile(metricsFile, 'utf-8');
            const loaded = JSON.parse(data);

            // Merge loaded metrics with current
            Object.keys(loaded).forEach(key => {
                if (typeof loaded[key] === 'number') {
                    this.metrics[key] = loaded[key];
                } else if (typeof loaded[key] === 'object') {
                    Object.assign(this.metrics[key], loaded[key]);
                }
            });

            console.log('📊 Loaded persisted metrics');
        } catch (error) {
            // File doesn't exist or is corrupt, start fresh
            console.log('📊 Starting with fresh metrics');
        }
    }

    // Reset metrics
    reset() {
        Object.keys(this.metrics).forEach(key => {
            if (typeof this.metrics[key] === 'number') {
                this.metrics[key] = 0;
            } else if (Array.isArray(this.metrics[key])) {
                this.metrics[key] = [];
            } else if (typeof this.metrics[key] === 'object') {
                Object.keys(this.metrics[key]).forEach(subKey => {
                    if (typeof this.metrics[key][subKey] === 'number') {
                        this.metrics[key][subKey] = 0;
                    } else if (Array.isArray(this.metrics[key][subKey])) {
                        this.metrics[key][subKey] = [];
                    }
                });
            }
        });
        console.log('🔄 Metrics reset');
    }
}

// Create singleton instance
const metricsTracker = new MetricsTracker();

// Middleware for Express
export function metricsMiddleware(req, res, next) {
    const startTime = Date.now();

    // Track when response finishes
    res.on('finish', () => {
        metricsTracker.trackRequest(req, res, startTime);
    });

    next();
}

// Handler wrapper to track execution
export function wrapHandler(action, handler) {
    return async (params) => {
        const startTime = Date.now();
        let success = true;
        let result;

        try {
            result = await handler(params);

            // Track business metrics
            const metadata = {};
            if (action === 'quote.generate' && result?.data?.options?.[0]?.price) {
                const price = parseInt(result.data.options[0].price.replace(/[^0-9]/g, '')) / 1000;
                metadata.revenue = price;
            }

            metricsTracker.trackHandler(action, true, Date.now() - startTime, metadata);

            return result;
        } catch (error) {
            success = false;
            metricsTracker.trackHandler(action, false, Date.now() - startTime);
            metricsTracker.trackError(error, { action });
            throw error;
        }
    };
}

// Cache wrapper
export function wrapCache(cache) {
    const originalGet = cache.get.bind(cache);
    const originalSet = cache.set.bind(cache);

    cache.get = async (key) => {
        const result = await originalGet(key);
        metricsTracker.trackCache('get', result !== null && result !== undefined);
        return result;
    };

    cache.set = async (key, value, ttl) => {
        const result = await originalSet(key, value, ttl);
        metricsTracker.trackCache('set');
        return result;
    };

    return cache;
}

export default metricsTracker;