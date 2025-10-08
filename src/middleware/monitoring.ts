import type { Request, Response, NextFunction } from "express";
import { createRequire } from 'module';
import { trackActivity } from '../services/session-tracker.js';
const require = createRequire(import.meta.url);

// Performance and error tracking
interface RequestMetrics {
  startTime: number;
  path: string;
  method: string;
  userAgent?: string;
  ip?: string;
  apiKey?: string;
}

// In-memory metrics (for now, could be extended to external service)
const metrics = {
  requests: 0,
  errors: 0,
  responseTimeMs: [] as number[],
  errorsByType: new Map<string, number>(),
  requestsByPath: new Map<string, number>(),
  activeRequests: new Set<string>(),
};

// Request ID generator
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Request tracking middleware
export function requestTracker(req: Request, res: Response, next: NextFunction) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  // Add request ID to request object
  (req as any).requestId = requestId;

  // Track request start
  const requestMetrics: RequestMetrics = {
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

  console.log(`🔍 [${requestId}] ${req.method} ${req.path} - Started`);

  // Track team member activity (for team.recent_activity handler)
  try {
    trackActivity(req, 'action');
  } catch (err) {
    // Don't fail request if tracking fails
    console.warn('⚠️ Activity tracking failed:', (err as Error).message);
  }

  // Track response
  const originalSend = res.send;
  res.send = function(data: any) {
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
    }

    console.log(`✅ [${requestId}] ${statusCode} ${req.path} - ${responseTime}ms${isError ? ' ERROR' : ''}`);

    return originalSend.call(this, data);
  };

  next();
}

// Error tracking middleware
export function errorTracker(err: any, req: Request, res: Response, next: NextFunction) {
  const requestId = (req as any).requestId || 'unknown';
  const errorType = err.name || err.constructor.name || 'UnknownError';

  metrics.errors++;
  metrics.errorsByType.set(errorType, (metrics.errorsByType.get(errorType) || 0) + 1);

  console.error(`❌ [${requestId}] Error: ${errorType}`, {
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
  let serviceAccountStatus = { available: false, error: 'Not initialized' } as any;
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
    } else if (firebaseStatus.error) {
      serviceAccountStatus = {
        available: false,
        error: firebaseStatus.error
      };
    } else {
      serviceAccountStatus = {
        available: false,
        error: 'Firebase not initialized yet'
      };
    }
  } catch (error: any) {
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
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([path, count]) => ({ path, count })),
        errors: Array.from(metrics.errorsByType.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([type, count]) => ({ type, count })),
      }
    }
  };
}

// Performance monitoring helper
export function logSlowQuery(operation: string, durationMs: number, threshold: number = 1000) {
  if (durationMs > threshold) {
    console.warn(`🐌 Slow operation detected: ${operation} took ${durationMs}ms (threshold: ${threshold}ms)`);
  }
}
