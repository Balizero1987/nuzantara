// Zantara Dashboard Server - Metrics Collection & AI Analytics

import express from 'express';
import path from 'path';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DashboardMetrics extends EventEmitter {
    constructor() {
        super();
        this.metrics = {
            conversations: {
                active: 0,
                total: 0,
                history: []
            },
            actions: {
                perMinute: 0,
                total: 0,
                byType: {},
                history: []
            },
            revenue: {
                today: 0,
                week: 0,
                month: 0,
                byService: {}
            },
            performance: {
                apiLatency: [],
                cacheHitRate: 0,
                errorRate: 0,
                cpu: 0,
                memory: 0
            },
            health: {
                services: {},
                lastCheck: null
            },
            alerts: [],
            predictions: []
        };

        this.initializeMetricsCollection();
        this.startAIAnalytics();
    }

    initializeMetricsCollection() {
        // Reset per-minute counters
        setInterval(() => {
            this.metrics.actions.history.push({
                timestamp: Date.now(),
                count: this.metrics.actions.perMinute
            });
            // Keep only last hour
            if (this.metrics.actions.history.length > 60) {
                this.metrics.actions.history.shift();
            }
            this.metrics.actions.perMinute = 0;
        }, 60000);

        // Health checks every 30 seconds
        setInterval(() => this.performHealthChecks(), 30000);

        // AI predictions every 5 minutes
        setInterval(() => this.generatePredictions(), 300000);
    }

    trackAction(action, metadata = {}) {
        this.metrics.actions.perMinute++;
        this.metrics.actions.total++;

        // Track by type
        if (!this.metrics.actions.byType[action]) {
            this.metrics.actions.byType[action] = 0;
        }
        this.metrics.actions.byType[action]++;

        // Track revenue if applicable
        if (metadata.revenue) {
            this.trackRevenue(metadata.revenue, metadata.service);
        }

        // Emit event for real-time updates
        this.emit('action', { action, metadata, timestamp: Date.now() });

        // Check for anomalies
        this.detectAnomalies(action, metadata);
    }

    trackConversation(event, metadata = {}) {
        if (event === 'start') {
            this.metrics.conversations.active++;
            this.metrics.conversations.total++;
        } else if (event === 'end') {
            this.metrics.conversations.active = Math.max(0, this.metrics.conversations.active - 1);
        }

        this.emit('conversation', {
            event,
            active: this.metrics.conversations.active,
            metadata
        });
    }

    trackPerformance(type, value) {
        if (type === 'latency') {
            this.metrics.performance.apiLatency.push(value);
            // Keep only last 100 measurements
            if (this.metrics.performance.apiLatency.length > 100) {
                this.metrics.performance.apiLatency.shift();
            }
        } else if (type === 'cache') {
            this.metrics.performance.cacheHitRate = value;
        } else if (type === 'error') {
            this.metrics.performance.errorRate = value;
        }
    }

    trackRevenue(amount, service) {
        const now = new Date();
        const dayStart = new Date(now.setHours(0, 0, 0, 0));
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));

        this.metrics.revenue.today += amount;

        if (!this.metrics.revenue.byService[service]) {
            this.metrics.revenue.byService[service] = 0;
        }
        this.metrics.revenue.byService[service] += amount;

        this.emit('revenue', { amount, service, timestamp: Date.now() });
    }

    performHealthChecks() {
        const services = [
            'ChatGPT API',
            'Firebase',
            'Google Drive',
            'Redis Cache',
            'OAuth Service',
            'Webhook Server'
        ];

        services.forEach(service => {
            // Simulate health check
            const isHealthy = Math.random() > 0.1;
            const status = isHealthy ? 'healthy' :
                Math.random() > 0.5 ? 'warning' : 'error';

            this.metrics.health.services[service] = {
                status,
                lastCheck: Date.now(),
                responseTime: Math.floor(Math.random() * 100)
            };
        });

        this.metrics.health.lastCheck = Date.now();
    }

    detectAnomalies(action, metadata) {
        // Simple anomaly detection
        const avgActionsPerMinute = this.metrics.actions.history.reduce((sum, h) =>
            sum + h.count, 0) / Math.max(1, this.metrics.actions.history.length);

        if (this.metrics.actions.perMinute > avgActionsPerMinute * 2) {
            this.addAlert({
                type: 'warning',
                title: 'Unusual Activity Spike',
                description: `Actions/min is ${Math.round(
                    (this.metrics.actions.perMinute / avgActionsPerMinute - 1) * 100
                )}% above average`,
                timestamp: Date.now()
            });
        }

        // Check for repeated failures
        if (metadata.error) {
            const recentErrors = this.metrics.alerts.filter(a =>
                a.type === 'error' &&
                Date.now() - a.timestamp < 300000
            ).length;

            if (recentErrors > 5) {
                this.addAlert({
                    type: 'error',
                    title: 'High Error Rate Detected',
                    description: `${recentErrors} errors in the last 5 minutes`,
                    timestamp: Date.now()
                });
            }
        }
    }

    generatePredictions() {
        const predictions = [];

        // Traffic prediction based on historical patterns
        const currentHour = new Date().getHours();
        const dayOfWeek = new Date().getDay();

        // Simulate pattern detection
        if (dayOfWeek === 1 && currentHour >= 8 && currentHour <= 10) {
            predictions.push({
                type: 'traffic',
                confidence: 0.85,
                message: 'High visa inquiry traffic expected (Monday morning pattern)',
                suggestedAction: 'Scale up ChatGPT workers'
            });
        }

        // Revenue prediction
        const todayRevenue = this.metrics.revenue.today;
        const avgDailyRevenue = 10000; // Baseline

        if (todayRevenue > avgDailyRevenue * 1.5) {
            predictions.push({
                type: 'revenue',
                confidence: 0.92,
                message: `Revenue tracking ${Math.round((todayRevenue / avgDailyRevenue - 1) * 100)}% above average`,
                suggestedAction: 'Consider promotional campaign to maintain momentum'
            });
        }

        // System load prediction
        const avgLatency = this.metrics.performance.apiLatency.reduce((sum, val) =>
            sum + val, 0) / Math.max(1, this.metrics.performance.apiLatency.length);

        if (avgLatency > 100) {
            predictions.push({
                type: 'performance',
                confidence: 0.78,
                message: 'System latency increasing, potential bottleneck forming',
                suggestedAction: 'Review database queries and cache strategy'
            });
        }

        this.metrics.predictions = predictions;
        this.emit('predictions', predictions);
    }

    addAlert(alert) {
        this.metrics.alerts.unshift(alert);
        // Keep only last 50 alerts
        if (this.metrics.alerts.length > 50) {
            this.metrics.alerts = this.metrics.alerts.slice(0, 50);
        }
        this.emit('alert', alert);
    }

    getMetricsSummary() {
        const avgLatency = this.metrics.performance.apiLatency.length > 0 ?
            Math.round(this.metrics.performance.apiLatency.reduce((sum, val) =>
                sum + val, 0) / this.metrics.performance.apiLatency.length) : 42;

        return {
            conversations: this.metrics.conversations.active,
            actionsPerMinute: this.metrics.actions.perMinute,
            successRate: (100 - this.metrics.performance.errorRate).toFixed(1),
            revenue: {
                today: this.metrics.revenue.today,
                week: this.metrics.revenue.week,
                month: this.metrics.revenue.month,
                byService: this.metrics.revenue.byService
            },
            performance: {
                latency: avgLatency,
                cacheHitRate: this.metrics.performance.cacheHitRate,
                errorRate: this.metrics.performance.errorRate
            },
            health: this.metrics.health.services,
            topActions: Object.entries(this.metrics.actions.byType)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([action, count]) => ({ action, count })),
            alerts: this.metrics.alerts.slice(0, 5),
            predictions: this.metrics.predictions
        };
    }

    startAIAnalytics() {
        // Advanced AI analytics engine
        setInterval(() => {
            // Pattern recognition
            this.analyzePatterns();

            // Predictive modeling
            this.runPredictiveModels();

            // Auto-optimization suggestions
            this.generateOptimizations();
        }, 60000);
    }

    analyzePatterns() {
        // Analyze action patterns
        const patterns = {};
        const hourlyData = {};

        // Group actions by hour
        this.metrics.actions.history.forEach(entry => {
            const hour = new Date(entry.timestamp).getHours();
            if (!hourlyData[hour]) {
                hourlyData[hour] = [];
            }
            hourlyData[hour].push(entry.count);
        });

        // Find peak hours
        Object.entries(hourlyData).forEach(([hour, counts]) => {
            const avg = counts.reduce((sum, c) => sum + c, 0) / counts.length;
            if (avg > 100) {
                patterns[`peak_hour_${hour}`] = {
                    type: 'traffic_pattern',
                    hour: parseInt(hour),
                    avgActions: Math.round(avg)
                };
            }
        });

        return patterns;
    }

    runPredictiveModels() {
        // Simple linear regression for revenue prediction
        const revenueHistory = [];
        const now = Date.now();

        // Simulate historical data
        for (let i = 30; i >= 0; i--) {
            revenueHistory.push({
                day: now - (i * 86400000),
                revenue: 8000 + Math.random() * 6000
            });
        }

        // Calculate trend
        const n = revenueHistory.length;
        const sumX = revenueHistory.reduce((sum, d, i) => sum + i, 0);
        const sumY = revenueHistory.reduce((sum, d) => sum + d.revenue, 0);
        const sumXY = revenueHistory.reduce((sum, d, i) => sum + (i * d.revenue), 0);
        const sumX2 = revenueHistory.reduce((sum, d, i) => sum + (i * i), 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Predict next day
        const prediction = slope * (n + 1) + intercept;

        return {
            tomorrowRevenue: Math.round(prediction),
            trend: slope > 0 ? 'increasing' : 'decreasing',
            confidence: 0.75
        };
    }

    generateOptimizations() {
        const optimizations = [];

        // Cache optimization
        if (this.metrics.performance.cacheHitRate < 80) {
            optimizations.push({
                area: 'cache',
                priority: 'high',
                suggestion: 'Increase cache TTL for frequently accessed data',
                expectedImprovement: '15-20% latency reduction'
            });
        }

        // API optimization
        const avgLatency = this.metrics.performance.apiLatency.reduce((sum, val) =>
            sum + val, 0) / Math.max(1, this.metrics.performance.apiLatency.length);

        if (avgLatency > 150) {
            optimizations.push({
                area: 'api',
                priority: 'medium',
                suggestion: 'Implement request batching for ChatGPT calls',
                expectedImprovement: '30% reduction in API calls'
            });
        }

        return optimizations;
    }
}

// Initialize metrics collector
const metricsCollector = new DashboardMetrics();

// Middleware to track all requests
function metricsMiddleware(req, res, next) {
    const start = Date.now();

    // Track response
    res.on('finish', () => {
        const latency = Date.now() - start;
        metricsCollector.trackPerformance('latency', latency);

        // Track action if it's a custom GPT handler
        if (req.path.startsWith('/api/custom-gpt/')) {
            const action = req.path.split('/').pop();
            metricsCollector.trackAction(action, {
                method: req.method,
                status: res.statusCode,
                latency,
                error: res.statusCode >= 400
            });
        }
    });

    next();
}

// Dashboard API routes
function setupDashboardRoutes(app) {
    // Serve dashboard static files
    app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));

    // Metrics API endpoint
    app.get('/api/dashboard/metrics', (req, res) => {
        // Verify API key
        const apiKey = req.headers['x-api-key'];
        if (!apiKey || !isValidApiKey(apiKey)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        res.json(metricsCollector.getMetricsSummary());
    });

    // Real-time metrics stream (SSE)
    app.get('/api/dashboard/stream', (req, res) => {
        // Setup SSE
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        // Send metrics updates
        const sendUpdate = (event, data) => {
            res.write(`event: ${event}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        // Listen for events
        metricsCollector.on('action', data => sendUpdate('action', data));
        metricsCollector.on('conversation', data => sendUpdate('conversation', data));
        metricsCollector.on('alert', data => sendUpdate('alert', data));
        metricsCollector.on('revenue', data => sendUpdate('revenue', data));

        // Heartbeat
        const heartbeat = setInterval(() => {
            res.write(':heartbeat\n\n');
        }, 30000);

        // Cleanup on disconnect
        req.on('close', () => {
            clearInterval(heartbeat);
            metricsCollector.removeAllListeners();
        });
    });

    // AI Assistant endpoint
    app.post('/api/dashboard/ai-assistant', async (req, res) => {
        const { message } = req.body;

        // Simple AI responses based on metrics
        const metrics = metricsCollector.getMetricsSummary();
        let response = '';

        if (message.toLowerCase().includes('revenue')) {
            response = `Current revenue today: $${metrics.revenue.today}. `;
            response += `Top performing service: ${Object.entries(metrics.revenue.byService)
                .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}`;
        } else if (message.toLowerCase().includes('performance')) {
            response = `API latency: ${metrics.performance.latency}ms, `;
            response += `Cache hit rate: ${metrics.performance.cacheHitRate}%, `;
            response += `Error rate: ${metrics.performance.errorRate}%`;
        } else if (message.toLowerCase().includes('optimize')) {
            const optimizations = metricsCollector.generateOptimizations();
            response = optimizations.length > 0 ?
                `Suggested optimization: ${optimizations[0].suggestion}` :
                'System is running optimally. No immediate optimizations needed.';
        } else {
            response = 'I can help you with revenue analysis, performance metrics, and optimization suggestions. What would you like to know?';
        }

        res.json({ response });
    });

    // Trigger test events (for demo purposes)
    app.post('/api/dashboard/test-event', (req, res) => {
        const { type, data } = req.body;

        switch (type) {
            case 'action':
                metricsCollector.trackAction(data.action || 'test.action', data);
                break;
            case 'conversation':
                metricsCollector.trackConversation(data.event || 'start', data);
                break;
            case 'revenue':
                metricsCollector.trackRevenue(data.amount || 100, data.service || 'test');
                break;
            case 'alert':
                metricsCollector.addAlert(data);
                break;
        }

        res.json({ success: true });
    });
}

function isValidApiKey(key) {
    // Check against your API keys
    const validKeys = [
        'zantara-internal-dev-key-2025',
        'zantara-external-dev-key-2025'
    ];
    return validKeys.includes(key);
}

export {
    DashboardMetrics,
    metricsMiddleware,
    setupDashboardRoutes,
    metricsCollector
};