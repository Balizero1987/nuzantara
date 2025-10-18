import { trackActivity } from '../services/session-tracker.js';
import logger from '../services/logger.js';
// In-memory metrics (for now, could be extended to external service)
const metrics = {
    requests: 0,
    errors: 0,
    responseTimeMs: [],
    errorsByType: new Map(),
    requestsByPath: new Map(),
    activeRequests: new Set(),
};
// Request ID generator
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
// Request tracking middleware
export function requestTracker(req, res, _next) {
    const requestId = generateRequestId();
    const startTime = Date.now();
    // Add request ID to request object
    req.requestId = requestId;
    // Track request start
    const requestMetrics = {
        startTime,
        path: req.path,
        method: req.method,
        userAgent: req.get('user-agent'),
        ip: req.ip || req.connection.remoteAddress,
        apiKey: req.get('x-api-key')?.substring(0, 8) + '...' || 'none'
    };
    metrics.requests++;
    metrics.activeRequests.add(requestId);
    metrics.requestsByPath.set(req.path, (metrics.requestsByPath.get(req.path) || 0) + 1);
    // Store request metrics for later use
    req.requestMetrics = requestMetrics;
    logger.info(`Request started`, { requestId, method: req.method, path: req.path });
    // Track team member activity (for team.recent_activity handler)
    try {
        trackActivity(req, 'action');
    }
    catch (err) {
        // Don't fail request if tracking fails
        logger.warn('Activity tracking failed', { error: err.message });
    }
    // Track response
    const originalSend = res.send;
    res.send = function (data) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        metrics.responseTimeMs.push(responseTime);
        metrics.activeRequests.delete(requestId);
        // Keep only last 1000 response times for memory efficiency
        if (metrics.responseTimeMs.length > 1000) {
            metrics.responseTimeMs = metrics.responseTimeMs.slice(-1000);
        }
        const statusCode = res.statusCode;
        const isError = statusCode >= 400;
        if (isError) {
            metrics.errors++;
            const errorType = `${statusCode}xx`;
            metrics.errorsByType.set(errorType, (metrics.errorsByType.get(errorType) || 0) + 1);
            // Track error for alerting system
            trackErrorForAlert(statusCode);
        }
        logger.info(`Request completed`, { requestId, statusCode, path: req.path, responseTime, isError });
        return originalSend.call(this, data);
    };
    _next();
}
// Error tracking middleware
export function errorTracker(err, req, _res, next) {
    const requestId = req.requestId || 'unknown';
    const errorType = err.name || err.constructor.name || 'UnknownError';
    metrics.errors++;
    metrics.errorsByType.set(errorType, (metrics.errorsByType.get(errorType) || 0) + 1);
    logger.error(`Request error`, {
        requestId,
        errorType,
        message: err.message,
        stack: err.stack?.split('\n').slice(0, 3).join('\n'),
        path: req.path,
        method: req.method,
        body: req.body,
    });
    next(err);
}
// Health metrics endpoint
export async function getHealthMetrics() {
    const avgResponseTime = metrics.responseTimeMs.length > 0
        ? Math.round(metrics.responseTimeMs.reduce((a, b) => a + b, 0) / metrics.responseTimeMs.length)
        : 0;
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    // Get Service Account status from Firebase initialization
    let serviceAccountStatus = { available: false, error: 'Not initialized' };
    try {
        // Import firebaseStatus from firebase service
        const { firebaseStatus } = await import('../services/firebase.js');
        if (firebaseStatus.initialized && !firebaseStatus.error) {
            serviceAccountStatus = {
                available: true,
                source: firebaseStatus.serviceAccountSource,
                message: firebaseStatus.serviceAccountSource === 'adc'
                    ? 'Using ADC (cloud-run-deployer@involuted-box-469105-r0.iam.gserviceaccount.com)'
                    : firebaseStatus.serviceAccountSource === 'secret-manager'
                        ? 'Loaded from Secret Manager'
                        : `Loaded from ${firebaseStatus.serviceAccountSource}`
            };
        }
        else if (firebaseStatus.error) {
            serviceAccountStatus = {
                available: false,
                error: firebaseStatus.error
            };
        }
        else {
            serviceAccountStatus = {
                available: false,
                error: 'Firebase not initialized yet'
            };
        }
    }
    catch (error) {
        serviceAccountStatus = { available: false, error: error?.message || 'status_unavailable' };
    }
    return {
        status: 'healthy',
        version: '5.2.0',
        uptime: Math.round(uptime),
        metrics: {
            requests: {
                total: metrics.requests,
                active: metrics.activeRequests.size,
                errors: metrics.errors,
                errorRate: metrics.requests > 0 ? Math.round((metrics.errors / metrics.requests) * 100) : 0,
                avgResponseTimeMs: avgResponseTime,
            },
            system: {
                memoryUsageMB: Math.round(memUsage.heapUsed / 1024 / 1024),
                memoryTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
                uptimeMinutes: Math.round(uptime / 60),
            },
            serviceAccount: serviceAccountStatus,
            popular: {
                paths: Array.from(metrics.requestsByPath.entries())
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([path, count]) => ({ path, count })),
                errors: Array.from(metrics.errorsByType.entries())
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([type, count]) => ({ type, count })),
            }
        }
    };
}
// Performance monitoring helper
export function logSlowQuery(operation, durationMs, threshold = 1000) {
    if (durationMs > threshold) {
        logger.warn(`Slow operation detected`, { operation, durationMs, threshold });
    }
}
// Default alert configuration (can be overridden via env vars)
const alertConfig = {
    enabled: process.env.ALERTS_ENABLED === 'true',
    thresholds: {
        error4xx: parseInt(process.env.ALERT_THRESHOLD_4XX || '10', 10),
        error5xx: parseInt(process.env.ALERT_THRESHOLD_5XX || '5', 10),
        errorRate: parseInt(process.env.ALERT_THRESHOLD_ERROR_RATE || '15', 10),
    },
    window: parseInt(process.env.ALERT_WINDOW_MS || '300000', 10), // 5 min default
    cooldown: parseInt(process.env.ALERT_COOLDOWN_MS || '300000', 10), // 5 min default
    channels: {
        whatsapp: process.env.ALERT_WHATSAPP === 'true',
        console: true, // Always log to console
    }
};
// Alert metrics tracking
const alertMetrics = {
    count4xx: 0,
    count5xx: 0,
    totalRequests: 0,
    windowStart: Date.now(),
    lastAlertTime: 0,
    lastAlertType: null,
};
// Reset metrics window
function resetAlertWindow() {
    alertMetrics.count4xx = 0;
    alertMetrics.count5xx = 0;
    alertMetrics.totalRequests = 0;
    alertMetrics.windowStart = Date.now();
}
// Check if we should reset the window
function checkWindowReset() {
    const now = Date.now();
    const windowElapsed = now - alertMetrics.windowStart;
    if (windowElapsed > alertConfig.window) {
        resetAlertWindow();
    }
}
// Send alert notification
async function sendAlert(alertType, message, details) {
    const now = Date.now();
    const timeSinceLastAlert = now - alertMetrics.lastAlertTime;
    // Check cooldown
    if (timeSinceLastAlert < alertConfig.cooldown && alertMetrics.lastAlertType === alertType) {
        logger.info(`Alert cooldown active`, { alertType, remainingSeconds: Math.round((alertConfig.cooldown - timeSinceLastAlert) / 1000) });
        return;
    }
    // Update last alert time
    alertMetrics.lastAlertTime = now;
    alertMetrics.lastAlertType = alertType;
    // Console alert (always active)
    if (alertConfig.channels.console) {
        logger.error(`ALERT`, { alertType, message, details });
    }
    // WhatsApp alert (if enabled)
    if (alertConfig.channels.whatsapp) {
        try {
            // Dynamic import to avoid circular dependency
            const { sendManualMessage } = await import('../handlers/communication/whatsapp.js');
            const whatsappMessage = `🚨 *ZANTARA ALERT*\n\n*Type:* ${alertType}\n*Message:* ${message}\n\n*Details:*\n${JSON.stringify(details, null, 2)}`;
            await sendManualMessage({
                to: process.env.ALERT_WHATSAPP_NUMBER || '+6281338051876',
                message: whatsappMessage
            });
            logger.info('WhatsApp alert sent');
        }
        catch (error) {
            logger.error('Failed to send WhatsApp alert', { error: error.message });
        }
    }
}
// Check if alert thresholds are exceeded
async function checkAlertThresholds() {
    if (!alertConfig.enabled)
        return;
    checkWindowReset();
    const errorRate = alertMetrics.totalRequests > 0
        ? Math.round((alertMetrics.count4xx + alertMetrics.count5xx) / alertMetrics.totalRequests * 100)
        : 0;
    // Check 4xx threshold
    if (alertMetrics.count4xx >= alertConfig.thresholds.error4xx) {
        await sendAlert('4XX_THRESHOLD_EXCEEDED', `4xx errors exceeded threshold (${alertMetrics.count4xx} >= ${alertConfig.thresholds.error4xx})`, {
            count4xx: alertMetrics.count4xx,
            count5xx: alertMetrics.count5xx,
            totalRequests: alertMetrics.totalRequests,
            errorRate: `${errorRate}%`,
            windowMinutes: Math.round(alertConfig.window / 60000),
            threshold: alertConfig.thresholds.error4xx,
        });
    }
    // Check 5xx threshold
    if (alertMetrics.count5xx >= alertConfig.thresholds.error5xx) {
        await sendAlert('5XX_THRESHOLD_EXCEEDED', `5xx errors exceeded threshold (${alertMetrics.count5xx} >= ${alertConfig.thresholds.error5xx})`, {
            count4xx: alertMetrics.count4xx,
            count5xx: alertMetrics.count5xx,
            totalRequests: alertMetrics.totalRequests,
            errorRate: `${errorRate}%`,
            windowMinutes: Math.round(alertConfig.window / 60000),
            threshold: alertConfig.thresholds.error5xx,
        });
    }
    // Check error rate threshold
    if (errorRate >= alertConfig.thresholds.errorRate && alertMetrics.totalRequests >= 10) {
        await sendAlert('ERROR_RATE_EXCEEDED', `Error rate exceeded threshold (${errorRate}% >= ${alertConfig.thresholds.errorRate}%)`, {
            count4xx: alertMetrics.count4xx,
            count5xx: alertMetrics.count5xx,
            totalRequests: alertMetrics.totalRequests,
            errorRate: `${errorRate}%`,
            windowMinutes: Math.round(alertConfig.window / 60000),
            threshold: `${alertConfig.thresholds.errorRate}%`,
        });
    }
}
// Track errors for alerting
export function trackErrorForAlert(statusCode) {
    if (!alertConfig.enabled)
        return;
    alertMetrics.totalRequests++;
    if (statusCode >= 400 && statusCode < 500) {
        alertMetrics.count4xx++;
    }
    else if (statusCode >= 500) {
        alertMetrics.count5xx++;
    }
    // Check thresholds (async, non-blocking)
    checkAlertThresholds().catch(err => {
        logger.error('Error checking alert thresholds', { error: err });
    });
}
// Get alert status
export function getAlertStatus() {
    checkWindowReset();
    const errorRate = alertMetrics.totalRequests > 0
        ? Math.round((alertMetrics.count4xx + alertMetrics.count5xx) / alertMetrics.totalRequests * 100)
        : 0;
    return {
        enabled: alertConfig.enabled,
        config: alertConfig,
        currentWindow: {
            count4xx: alertMetrics.count4xx,
            count5xx: alertMetrics.count5xx,
            totalRequests: alertMetrics.totalRequests,
            errorRate: `${errorRate}%`,
            windowStarted: new Date(alertMetrics.windowStart).toISOString(),
            windowElapsedMs: Date.now() - alertMetrics.windowStart,
        },
        lastAlert: alertMetrics.lastAlertTime > 0 ? {
            type: alertMetrics.lastAlertType,
            timestamp: new Date(alertMetrics.lastAlertTime).toISOString(),
            timeSinceMs: Date.now() - alertMetrics.lastAlertTime,
        } : null,
    };
}
// Reset all alert metrics (for testing)
export function resetAlertMetrics() {
    alertMetrics.count4xx = 0;
    alertMetrics.count5xx = 0;
    alertMetrics.totalRequests = 0;
    alertMetrics.windowStart = Date.now();
    alertMetrics.lastAlertTime = 0;
    alertMetrics.lastAlertType = null;
}
