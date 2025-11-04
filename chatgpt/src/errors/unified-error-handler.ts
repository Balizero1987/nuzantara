import type { Request } from 'express';
import {
  ApplicationError,
  ErrorContext,
  ErrorResponse,
  ErrorSeverity,
  isApplicationError,
  isOperationalError,
  isCriticalError,
  ErrorCategory,
} from './types.js';

/**
 * Error handling configuration options
 */
export interface ErrorHandlerConfig {
  /**
   * Include stack traces in error responses (disabled in production)
   */
  includeStackTrace?: boolean;

  /**
   * Enable detailed error logging
   */
  enableLogging?: boolean;

  /**
   * Enable error metrics collection
   */
  enableMetrics?: boolean;

  /**
   * Custom logger function
   */
  logger?: (error: Error, context: ErrorContext) => void;

  /**
   * Custom metrics collector
   */
  metricsCollector?: (error: Error, context: ErrorContext, duration: number) => void;
}

/**
 * Error metrics data structure
 */
export interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  criticalErrors: number;
  operationalErrors: number;
  nonOperationalErrors: number;
  averageResponseTime: number;
  lastError?: {
    timestamp: Date;
    category: string;
    severity: ErrorSeverity;
    message: string;
  };
}

/**
 * Unified Error Handler - Centralized error processing for the application
 *
 * Features:
 * - Automatic error classification and severity assignment
 * - Consistent error response formatting
 * - Integrated logging and monitoring
 * - Metrics collection and tracking
 * - Stack trace management (dev vs production)
 * - Request context enrichment
 */
export class UnifiedErrorHandler {
  private readonly config: Required<ErrorHandlerConfig>;
  private metrics: ErrorMetrics;
  private readonly errorTimestamps: Map<string, number[]>;

  constructor(config: ErrorHandlerConfig = {}) {
    this.config = {
      includeStackTrace: config.includeStackTrace ?? process.env.NODE_ENV !== 'production',
      enableLogging: config.enableLogging ?? true,
      enableMetrics: config.enableMetrics ?? true,
      logger: config.logger ?? this.defaultLogger.bind(this),
      metricsCollector: config.metricsCollector ?? this.defaultMetricsCollector.bind(this),
    };

    this.metrics = {
      totalErrors: 0,
      errorsByCategory: {},
      errorsBySeverity: {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.CRITICAL]: 0,
      },
      criticalErrors: 0,
      operationalErrors: 0,
      nonOperationalErrors: 0,
      averageResponseTime: 0,
    };

    this.errorTimestamps = new Map();
  }

  /**
   * Process an error and return a standardized error response
   */
  public processError(error: Error | ApplicationError, req?: Request): ErrorResponse {
    const startTime = Date.now();

    // Extract or create error context from request
    const context = this.enrichErrorContext(error, req);

    // Classify error if it's not already an ApplicationError
    const appError = this.ensureApplicationError(error);

    // Log error if logging is enabled
    if (this.config.enableLogging) {
      this.config.logger(appError, context);
    }

    // Track metrics if metrics collection is enabled
    if (this.config.enableMetrics) {
      const duration = Date.now() - startTime;
      this.trackMetrics(appError, context, duration);
      this.config.metricsCollector(appError, context, duration);
    }

    // Format error response
    return this.formatErrorResponse(appError, context);
  }

  /**
   * Ensure error is an ApplicationError instance
   */
  private ensureApplicationError(error: Error | ApplicationError): ApplicationError {
    if (isApplicationError(error)) {
      return error;
    }

    // Convert generic Error to ApplicationError with INTERNAL category
    return new ApplicationError(
      error.message || 'An unexpected error occurred',
      ErrorCategory.INTERNAL,
      {
        cause: error,
      }
    );
  }

  /**
   * Enrich error context with request information
   */
  private enrichErrorContext(_error: Error | ApplicationError, req?: Request): ErrorContext {
    const baseContext: ErrorContext = {
      timestamp: new Date(),
    };

    if (!req) {
      return baseContext;
    }

    return {
      ...baseContext,
      userId: (req as Request & { userId?: string }).userId,
      requestId: (req as Request & { id?: string }).id,
      path: req.path,
      method: req.method,
      ip: req.ip ?? req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
      additionalData: {
        query: req.query,
        params: req.params,
        body: this.sanitizeRequestBody(req.body),
      },
    };
  }

  /**
   * Sanitize request body to remove sensitive information
   */
  private sanitizeRequestBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body } as Record<string, unknown>;
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'creditCard'];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Format error into standardized response
   */
  private formatErrorResponse(error: ApplicationError, context: ErrorContext): ErrorResponse {
    const timestamp = context.timestamp ?? new Date();

    const response: ErrorResponse = {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        category: error.category,
        severity: error.severity,
        timestamp: timestamp.toISOString(),
        statusCode: error.statusCode,
      },
    };

    // Include stack trace only if enabled (typically in development)
    if (this.config.includeStackTrace && error.stack) {
      response.error.stack = error.stack;
    }

    // Include error context for debugging
    if (context.requestId) {
      response.error.requestId = context.requestId;
    }

    // Add validation errors if present (for ValidationError)
    if ('errors' in error) {
      const validationErrors = (error as { errors: unknown }).errors;
      if (validationErrors) {
        response.error.details = { validationErrors };
      }
    }

    return response;
  }

  /**
   * Track error metrics
   */
  private trackMetrics(error: ApplicationError, context: ErrorContext, duration: number): void {
    // Increment total errors
    this.metrics.totalErrors++;

    // Track by category
    this.metrics.errorsByCategory[error.category] =
      (this.metrics.errorsByCategory[error.category] ?? 0) + 1;

    // Track by severity
    this.metrics.errorsBySeverity[error.severity]++;

    // Track operational vs non-operational
    if (isOperationalError(error)) {
      this.metrics.operationalErrors++;
    } else {
      this.metrics.nonOperationalErrors++;
    }

    // Track critical errors
    if (isCriticalError(error)) {
      this.metrics.criticalErrors++;
    }

    // Update average response time
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (this.metrics.totalErrors - 1) + duration) /
      this.metrics.totalErrors;

    // Update last error info
    const timestamp = context.timestamp ?? new Date();
    this.metrics.lastError = {
      timestamp,
      category: error.category,
      severity: error.severity,
      message: error.message,
    };

    // Track error rate by category (for rate limiting detection)
    const categoryKey = error.category;
    const timestamps = this.errorTimestamps.get(categoryKey) ?? [];
    timestamps.push(Date.now());

    // Keep only last 100 timestamps per category
    if (timestamps.length > 100) {
      timestamps.shift();
    }

    this.errorTimestamps.set(categoryKey, timestamps);
  }

  /**
   * Get current error metrics
   */
  public getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  /**
   * Get error rate for a specific category (errors per minute)
   */
  public getErrorRate(category: string, windowMinutes = 5): number {
    const timestamps = this.errorTimestamps.get(category);
    if (!timestamps || timestamps.length === 0) {
      return 0;
    }

    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    const recentErrors = timestamps.filter((ts) => now - ts < windowMs);

    return recentErrors.length / windowMinutes || 0;
  }

  /**
   * Reset metrics (useful for testing or periodic resets)
   */
  public resetMetrics(): void {
    this.metrics = {
      totalErrors: 0,
      errorsByCategory: {},
      errorsBySeverity: {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.CRITICAL]: 0,
      },
      criticalErrors: 0,
      operationalErrors: 0,
      nonOperationalErrors: 0,
      averageResponseTime: 0,
    };

    this.errorTimestamps.clear();
  }

  /**
   * Default logger implementation
   */
  private defaultLogger(error: Error, context: ErrorContext): void {
    const logLevel = this.getLogLevel(error);
    const timestamp = context.timestamp ?? new Date();
    const logData = {
      message: error.message,
      category: isApplicationError(error) ? error.category : 'unknown',
      severity: isApplicationError(error) ? error.severity : ErrorSeverity.MEDIUM,
      context: {
        requestId: context.requestId,
        userId: context.userId,
        path: context.path,
        method: context.method,
        timestamp: timestamp.toISOString(),
      },
      stack: error.stack,
    };

    // Use appropriate console method based on severity
    if (logLevel === 'error') {
      console.error('[ERROR]', JSON.stringify(logData, null, 2));
    } else if (logLevel === 'warn') {
      console.warn('[WARN]', JSON.stringify(logData, null, 2));
    } else {
      console.log('[INFO]', JSON.stringify(logData, null, 2));
    }
  }

  /**
   * Get appropriate log level based on error severity
   */
  private getLogLevel(error: Error): 'error' | 'warn' | 'info' {
    if (!isApplicationError(error)) {
      return 'error';
    }

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'error';
    }
  }

  /**
   * Default metrics collector implementation
   */
  private defaultMetricsCollector(error: Error, context: ErrorContext, duration: number): void {
    // This is a simple implementation - in production, you might send to a monitoring service
    // like Prometheus, DataDog, New Relic, etc.
    if (isCriticalError(error)) {
      console.error('[CRITICAL ERROR DETECTED]', {
        message: error.message,
        category: isApplicationError(error) ? error.category : 'unknown',
        duration,
        context: {
          requestId: context.requestId,
          path: context.path,
        },
      });
    }
  }
}

// Singleton instance for convenient usage
let defaultHandlerInstance: UnifiedErrorHandler | null = null;

/**
 * Get or create the default error handler instance
 */
export function getDefaultErrorHandler(config?: ErrorHandlerConfig): UnifiedErrorHandler {
  defaultHandlerInstance ??= new UnifiedErrorHandler(config);
  return defaultHandlerInstance;
}

/**
 * Reset the default error handler instance (useful for testing)
 */
export function resetDefaultErrorHandler(): void {
  defaultHandlerInstance = null;
}
