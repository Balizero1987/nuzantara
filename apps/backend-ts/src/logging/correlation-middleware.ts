/**
 * Enhanced Correlation ID Middleware
 * Integrates with Unified Logging System for consistent request tracking
 */

import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { logger, LogContext } from './unified-logger.js';

// Extended Request interface with correlation tracking
export interface CorrelatedRequest extends Request {
  correlationId: string;
  requestId: string;
  startTime: number;
  logContext: LogContext;
}

/**
 * Generate secure random ID
 */
function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Enhanced correlation middleware with comprehensive tracking
 */
export function correlationMiddleware() {
  return function cid(req: CorrelatedRequest, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // Extract or generate correlation IDs
    const incomingCorrelationId = req.headers['x-correlation-id'] as string;
    const incomingRequestId = req.headers['x-request-id'] as string;

    const correlationId = incomingCorrelationId || generateId();
    const requestId = incomingRequestId || generateId();

    // Attach to request object
    req.correlationId = correlationId;
    req.requestId = requestId;
    req.startTime = startTime;

    // Create standardized log context
    req.logContext = {
      correlationId,
      requestId,
      userId: (req as any).user?.id || (req as any).userId,
      sessionId: (req as any).sessionId,
      service: 'nuzantara-backend',
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
    };

    // Set response headers for client-side tracking
    res.setHeader('X-Correlation-ID', correlationId);
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Service-Name', 'nuzantara-backend');

    // Log request start
    logger.http(`Request started: ${req.method} ${req.url}`, {
      ...req.logContext,
      type: 'request_start',
      timestamp: startTime,
    });

    // Override res.end to log response completion
    const originalEnd = res.end.bind(res);
    (res as any).end = function (...args: any[]) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      logger.http(`Request completed: ${req.method} ${req.url} - ${res.statusCode}`, {
        ...req.logContext,
        type: 'request_end',
        statusCode: res.statusCode,
        duration,
        timestamp: endTime,
        contentLength: res.get('Content-Length'),
      });

      // Call original end
      return originalEnd(...args);
    };

    // Handle request errors
    res.on('error', (error) => {
      logger.error('Response error', error, {
        ...req.logContext,
        type: 'response_error',
      });
    });

    next();
  };
}

/**
 * Async request timing wrapper
 */
export async function withRequestTracking<T>(
  req: CorrelatedRequest,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    logger.debug(`Starting operation: ${operation}`, {
      ...req.logContext,
      operation,
      type: 'operation_start',
    });

    const result = await fn();

    const duration = Date.now() - startTime;
    logger.debug(`Completed operation: ${operation}`, {
      ...req.logContext,
      operation,
      duration,
      type: 'operation_success',
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Failed operation: ${operation}', error as Error, {
      ...req.logContext,
      operation,
      duration,
      type: 'operation_error',
    });

    throw error;
  }
}

/**
 * Extract correlation context from any request object
 */
export function getCorrelationContext(req: Request): LogContext {
  const correlated = req as CorrelatedRequest;
  return {
    correlationId: correlated.correlationId,
    requestId: correlated.requestId,
    userId: correlated.logContext?.userId,
    sessionId: correlated.logContext?.sessionId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  };
}

/**
 * Create child logger with request context
 */
export function createRequestLogger(req: Request) {
  const context = getCorrelationContext(req);
  return logger.child(context);
}

export default correlationMiddleware;
