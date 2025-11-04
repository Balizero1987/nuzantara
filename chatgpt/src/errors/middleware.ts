/**
 * Express Middleware for Unified Error Handling
 * Provides global error handling and async error wrapping
 */

import type { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
import { UnifiedErrorHandler, getDefaultErrorHandler } from './unified-error-handler.js';
import { ApplicationError, isApplicationError, ErrorCategory, ErrorSeverity } from './types.js';

/**
 * Global error handling middleware
 * Should be registered as the last middleware in the Express app
 *
 * @example
 * ```ts
 * import express from 'express';
 * import { errorHandlerMiddleware } from './errors/middleware';
 *
 * const app = express();
 * // ... register routes ...
 * app.use(errorHandlerMiddleware());
 * ```
 */
export function errorHandlerMiddleware(handler?: UnifiedErrorHandler): ErrorRequestHandler {
  const errorHandler = handler ?? getDefaultErrorHandler();

  return (err: Error | ApplicationError, req: Request, res: Response) => {
    // Process error through unified handler
    const errorResponse = errorHandler.processError(err, req);

    // Get status code from error
    const statusCode = isApplicationError(err) ? err.statusCode : 500;

    // Log critical errors
    if (isApplicationError(err) && err.severity === ErrorSeverity.CRITICAL) {
      console.error('[CRITICAL ERROR]', {
        message: err.message,
        path: req.path,
        method: req.method,
        statusCode,
      });
    }

    // Send error response
    res.status(statusCode).json(errorResponse);
  };
}

/**
 * Async error wrapper for route handlers
 * Automatically catches errors in async functions and passes them to error middleware
 *
 * @example
 * ```ts
 * import { asyncHandler } from './errors/middleware';
 *
 * app.get('/users/:id', asyncHandler(async (req, res) => {
 *   const user = await getUserById(req.params.id);
 *   if (!user) {
 *     throw new NotFoundError('User not found');
 *   }
 *   res.json(user);
 * }));
 * ```
 */
export function asyncHandler<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Record<string, string>,
>(
  fn: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ) => Promise<void>
): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Request context injection middleware
 * Adds request ID and other context to requests for error tracking
 * Should be registered early in the middleware chain
 *
 * @example
 * ```ts
 * import { requestContextMiddleware } from './errors/middleware';
 *
 * const app = express();
 * app.use(requestContextMiddleware());
 * // ... register other middleware and routes ...
 * ```
 */
export function requestContextMiddleware(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Generate unique request ID if not present
    if (!(req as Request & { id?: string }).id) {
      (req as Request & { id: string }).id = generateRequestId();
    }

    // Add request start time for performance tracking
    (req as Request & { startTime: number }).startTime = Date.now();

    next();
  };
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Not found (404) handler middleware
 * Should be registered after all routes but before error handler
 *
 * @example
 * ```ts
 * import { notFoundHandler } from './errors/middleware';
 *
 * const app = express();
 * // ... register routes ...
 * app.use(notFoundHandler());
 * app.use(errorHandlerMiddleware());
 * ```
 */
export function notFoundHandler(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const error = new ApplicationError(
      `Route ${req.method} ${req.path} not found`,
      ErrorCategory.NOT_FOUND,
      {
        code: 'ROUTE_NOT_FOUND',
        context: {
          path: req.path,
          method: req.method,
          timestamp: new Date(),
        },
      }
    );
    next(error);
  };
}

/**
 * Request timeout middleware
 * Automatically terminates requests that exceed the specified timeout
 *
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 *
 * @example
 * ```ts
 * import { requestTimeoutMiddleware } from './errors/middleware';
 *
 * const app = express();
 * app.use(requestTimeoutMiddleware(15000)); // 15 second timeout
 * ```
 */
export function requestTimeoutMiddleware(timeoutMs = 30000): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        const error = new ApplicationError(
          `Request timeout after ${timeoutMs}ms`,
          ErrorCategory.TIMEOUT,
          {
            code: 'REQUEST_TIMEOUT',
            context: {
              path: req.path,
              method: req.method,
              timestamp: new Date(),
              additionalData: {
                timeoutMs,
              },
            },
          }
        );
        next(error);
      }
    }, timeoutMs);

    // Clear timeout on response finish
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    // Clear timeout on response close (client disconnect)
    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
}

/**
 * Error rate limiting middleware
 * Tracks error rates per IP and returns 429 if threshold is exceeded
 *
 * @param maxErrorsPerMinute - Maximum errors allowed per minute per IP (default: 10)
 *
 * @example
 * ```ts
 * import { errorRateLimitMiddleware } from './errors/middleware';
 *
 * const app = express();
 * app.use(errorRateLimitMiddleware(5)); // Max 5 errors per minute
 * ```
 */
export function errorRateLimitMiddleware(maxErrorsPerMinute = 10): ErrorRequestHandler {
  const errorCounts = new Map<string, number[]>();

  return (err: Error | ApplicationError, req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Get or initialize error timestamps for this IP
    let timestamps = errorCounts.get(ip) ?? [];

    // Filter out old timestamps (older than 1 minute)
    timestamps = timestamps.filter((ts) => ts > oneMinuteAgo);

    // Add current error timestamp
    timestamps.push(now);

    // Update map
    errorCounts.set(ip, timestamps);

    // Check if rate limit exceeded
    if (timestamps.length > maxErrorsPerMinute) {
      const rateLimitError = new ApplicationError(
        'Too many errors from this client',
        ErrorCategory.RATE_LIMIT,
        {
          code: 'ERROR_RATE_LIMIT_EXCEEDED',
          context: {
            ip,
            timestamp: new Date(),
            additionalData: {
              errorCount: timestamps.length,
              maxErrors: maxErrorsPerMinute,
              windowMinutes: 1,
            },
          },
        }
      );

      const errorHandler = getDefaultErrorHandler();
      const errorResponse = errorHandler.processError(rateLimitError, req);
      return res.status(429).json(errorResponse);
    }

    // Pass error to next error handler
    next(err);
  };
}

/**
 * Complete error handling setup helper
 * Sets up all recommended error handling middleware in the correct order
 *
 * @example
 * ```ts
 * import express from 'express';
 * import { setupErrorHandling } from './errors/middleware';
 *
 * const app = express();
 *
 * // ... register body parsers, etc ...
 *
 * const { requestContext, notFound, errorHandler } = setupErrorHandling({
 *   requestTimeout: 15000,
 *   maxErrorsPerMinute: 5,
 * });
 *
 * // Apply context middleware early
 * app.use(requestContext);
 *
 * // ... register routes ...
 *
 * // Apply error middleware last
 * app.use(notFound);
 * app.use(errorHandler);
 * ```
 */
export function setupErrorHandling(options?: {
  handler?: UnifiedErrorHandler;
  requestTimeout?: number;
  maxErrorsPerMinute?: number;
}) {
  return {
    requestContext: requestContextMiddleware(),
    timeout: requestTimeoutMiddleware(options?.requestTimeout),
    notFound: notFoundHandler(),
    errorRateLimit: errorRateLimitMiddleware(options?.maxErrorsPerMinute),
    errorHandler: errorHandlerMiddleware(options?.handler),
  };
}
