/**
 * Error Classification and Types
 * Centralized error taxonomy for consistent error handling
 */

import { z } from 'zod';

/**
 * Error severity levels
 * Used for logging priority and alerting
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error categories for classification
 * Helps route errors to appropriate handlers
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  RATE_LIMIT = 'rate_limit',
  EXTERNAL_SERVICE = 'external_service',
  DATABASE = 'database',
  INTERNAL = 'internal',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
}

/**
 * HTTP status codes mapped to error categories
 */
export const ERROR_STATUS_CODES: Record<ErrorCategory, number> = {
  [ErrorCategory.VALIDATION]: 400,
  [ErrorCategory.AUTHENTICATION]: 401,
  [ErrorCategory.AUTHORIZATION]: 403,
  [ErrorCategory.NOT_FOUND]: 404,
  [ErrorCategory.CONFLICT]: 409,
  [ErrorCategory.RATE_LIMIT]: 429,
  [ErrorCategory.EXTERNAL_SERVICE]: 502,
  [ErrorCategory.DATABASE]: 503,
  [ErrorCategory.INTERNAL]: 500,
  [ErrorCategory.NETWORK]: 503,
  [ErrorCategory.TIMEOUT]: 504,
};

/**
 * Error severity by category
 */
export const ERROR_SEVERITY_MAP: Record<ErrorCategory, ErrorSeverity> = {
  [ErrorCategory.VALIDATION]: ErrorSeverity.LOW,
  [ErrorCategory.AUTHENTICATION]: ErrorSeverity.MEDIUM,
  [ErrorCategory.AUTHORIZATION]: ErrorSeverity.MEDIUM,
  [ErrorCategory.NOT_FOUND]: ErrorSeverity.LOW,
  [ErrorCategory.CONFLICT]: ErrorSeverity.LOW,
  [ErrorCategory.RATE_LIMIT]: ErrorSeverity.MEDIUM,
  [ErrorCategory.EXTERNAL_SERVICE]: ErrorSeverity.HIGH,
  [ErrorCategory.DATABASE]: ErrorSeverity.CRITICAL,
  [ErrorCategory.INTERNAL]: ErrorSeverity.CRITICAL,
  [ErrorCategory.NETWORK]: ErrorSeverity.HIGH,
  [ErrorCategory.TIMEOUT]: ErrorSeverity.HIGH,
};

/**
 * Error context schema
 * Additional information for debugging
 */
export const ErrorContextSchema = z.object({
  userId: z.string().optional(),
  requestId: z.string().optional(),
  path: z.string().optional(),
  method: z.string().optional(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.date().optional(),
  additionalData: z.record(z.unknown()).optional(),
});

export type ErrorContext = z.infer<typeof ErrorContextSchema>;

/**
 * Standardized error response schema
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    category: z.nativeEnum(ErrorCategory),
    severity: z.nativeEnum(ErrorSeverity),
    statusCode: z.number(),
    timestamp: z.string(),
    requestId: z.string().optional(),
    details: z.record(z.unknown()).optional(),
    stack: z.string().optional(), // Only in development
  }),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * Base application error class
 * All custom errors should extend this
 */
export class ApplicationError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly statusCode: number;
  public readonly code: string;
  public readonly context?: ErrorContext;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    category: ErrorCategory,
    options?: {
      code?: string;
      severity?: ErrorSeverity;
      statusCode?: number;
      context?: ErrorContext;
      isOperational?: boolean;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = this.constructor.name;
    this.category = category;
    this.severity = options?.severity ?? ERROR_SEVERITY_MAP[category];
    this.statusCode = options?.statusCode ?? ERROR_STATUS_CODES[category];
    this.code = options?.code ?? `${category.toUpperCase()}_ERROR`;
    this.context = options?.context;
    this.isOperational = options?.isOperational ?? true;

    // Preserve error cause if provided
    if (options?.cause) {
      this.cause = options.cause;
    }

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Pre-defined error classes for common scenarios
 */

export class ValidationError extends ApplicationError {
  constructor(message: string, context?: ErrorContext, details?: Record<string, unknown>) {
    super(message, ErrorCategory.VALIDATION, {
      code: 'VALIDATION_ERROR',
      context: { ...context, additionalData: details },
    });
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication required', context?: ErrorContext) {
    super(message, ErrorCategory.AUTHENTICATION, {
      code: 'AUTHENTICATION_ERROR',
      context,
    });
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Insufficient permissions', context?: ErrorContext) {
    super(message, ErrorCategory.AUTHORIZATION, {
      code: 'AUTHORIZATION_ERROR',
      context,
    });
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, context?: ErrorContext) {
    super(`Resource not found: ${resource}`, ErrorCategory.NOT_FOUND, {
      code: 'NOT_FOUND',
      context,
    });
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCategory.CONFLICT, {
      code: 'CONFLICT_ERROR',
      context,
    });
  }
}

export class RateLimitError extends ApplicationError {
  constructor(message: string = 'Rate limit exceeded', context?: ErrorContext) {
    super(message, ErrorCategory.RATE_LIMIT, {
      code: 'RATE_LIMIT_ERROR',
      context,
    });
  }
}

export class ExternalServiceError extends ApplicationError {
  constructor(service: string, message: string, context?: ErrorContext, cause?: Error) {
    super(`External service error (${service}): ${message}`, ErrorCategory.EXTERNAL_SERVICE, {
      code: 'EXTERNAL_SERVICE_ERROR',
      context,
      cause,
    });
  }
}

export class DatabaseError extends ApplicationError {
  constructor(message: string, context?: ErrorContext, cause?: Error) {
    super(message, ErrorCategory.DATABASE, {
      code: 'DATABASE_ERROR',
      context,
      cause,
    });
  }
}

export class TimeoutError extends ApplicationError {
  constructor(operation?: string, timeoutMs?: number, context?: ErrorContext) {
    const message = operation
      ? `Operation timed out: ${operation} (${timeoutMs}ms)`
      : 'Request timeout';
    super(message, ErrorCategory.TIMEOUT, {
      code: 'TIMEOUT_ERROR',
      context,
    });
  }
}

export class NetworkError extends ApplicationError {
  constructor(message: string, context?: ErrorContext, cause?: Error) {
    super(message, ErrorCategory.NETWORK, {
      code: 'NETWORK_ERROR',
      context,
      cause,
    });
  }
}

/**
 * Type guards for error classification
 */

export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError;
}

export function isOperationalError(error: unknown): boolean {
  return isApplicationError(error) && error.isOperational;
}

export function isCriticalError(error: unknown): boolean {
  return isApplicationError(error) && error.severity === ErrorSeverity.CRITICAL;
}
